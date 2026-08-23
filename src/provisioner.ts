// Cloudflare account provisioner — runs *inside* the panel Worker and
// uses the *user's* Cloudflare API token to deploy a new Aether Panel
// on their account.
//
// Steps:
//   1. verify the token
//   2. create D1 / KV / Queue
//   3. fetch the latest worker.js from the GitHub repo
//   4. upload the worker with all bindings + DO migrations
//   5. apply D1 schema (direct SQL via D1 HTTP API)
//   6. insert admin directly via D1 (avoids workers.dev 1042 issue on
//      internal subrequests — the new worker's subdomain often returns
//      "bad host header" for the first minute when called from another
//      Worker, even though it works externally).
//   7. return the panel URL + generated admin password

import { hashPassword } from "./util/crypto.js";

export interface ProvisionInput {
  token: string;
  workerName?: string;
}

export interface ProvisionResult {
  ok: boolean;
  workerName: string;
  url: string;
  d1Id: string;
  kvId: string;
  adminUser: string;
  adminPassword: string;
  panelSecret: string;
  error?: string;
}

// We pin to a specific commit so newly-provisioned panels always run the
// exact bundle we built+tested. raw.githubusercontent.com caches @main for
// ~5 minutes which caused users to deploy stale bundles on first build.
// Bump this to git rev-parse HEAD after every release.
const BUNDLE_REF = "b0180eff3fb4fa4f00b2cfe1eccab0a629ac5cb3";
const BUNDLE_BASE =
  "https://raw.githubusercontent.com/nikzadcr-cmyk/aether-panel/" + BUNDLE_REF + "/";
const WORKER_SOURCE_URL = BUNDLE_BASE + "dist/index.js";
const SCHEMA_URL = BUNDLE_BASE + "migrations/0001_init.sql";

export async function provisionAccount(input: ProvisionInput): Promise<ProvisionResult> {
  const token = input.token.trim();
  if (!token) throw new Error("توکن خالی است");

  const headers = {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  };
  const api = "https://api.cloudflare.com/client/v4";

  // 1. verify + get account
  const verify = await fetch(api + "/user/tokens/verify", { headers });
  const vj = (await verify.json()) as { success: boolean; errors?: { message: string }[] };
  if (!vj.success) {
    throw new Error("توکن نامعتبر: " + (vj.errors?.[0]?.message || "unknown"));
  }
  const accRes = await fetch(api + "/accounts", { headers });
  const accJson = (await accRes.json()) as {
    success: boolean;
    result?: Array<{ id: string; name: string }>;
    errors?: { message: string }[];
  };
  if (!accJson.success || !accJson.result?.length) {
    throw new Error("حساب کلودفلر پیدا نشد: " + (accJson.errors?.[0]?.message || ""));
  }
  const accountId = accJson.result[0]!.id;
  const workerName = (input.workerName || "aether-panel-" + randomSuffix(6)).toLowerCase();
  // Unique per-deployment resource names so multiple panels on one account
  // don't collide on shared D1/KV/Queue. Names are truncated to fit limits.
  const suffix = workerName.replace(/[^a-z0-9]/g, "").slice(0, 24) || randomSuffix(6);
  const d1Name = "aether-" + suffix;
  const kvName = "aether-kv-" + suffix;
  const queueName = "aether-q-" + suffix.slice(0, 20);

  // 2. D1
  const d1 = await ensureD1(api, headers, accountId, d1Name);
  // 3. KV
  const kv = await ensureKv(api, headers, accountId, kvName);
  // 4. Queue
  await ensureQueue(api, headers, accountId, queueName);
  // 5. fetch worker source
  const srcRes = await fetch(WORKER_SOURCE_URL + "?v=" + Date.now());
  if (!srcRes.ok) throw new Error("دریافت سورس ورکر از گیت‌هاب ناموفق بود");
  const workerJs = await srcRes.text();

  // 6. set up secrets: we generate and upload PANEL_SECRET, admin password.
  const panelSecret = randomHex(32);
  const adminPassword = randomReadablePassword();
  const adminUser = "admin";

  // 7. multipart upload of worker with metadata
  const metadata = {
    main_module: "index.js",
    compatibility_date: "2025-01-15",
    compatibility_flags: ["nodejs_compat"],
    migrations: { tag: "v1", new_sqlite_classes: ["UserState", "PoolState", "RateLimiter"] },
    bindings: [
      { type: "d1", name: "DB", id: d1 },
      { type: "kv_namespace", name: "KV", namespace_id: kv },
      { type: "queue", name: "WRITE_QUEUE", queue_name: queueName },
      {
        type: "durable_object_namespace",
        name: "USER_STATE",
        class_name: "UserState",
      },
      {
        type: "durable_object_namespace",
        name: "POOL_STATE",
        class_name: "PoolState",
      },
      {
        type: "durable_object_namespace",
        name: "RATE_LIMIT",
        class_name: "RateLimiter",
      },
      { type: "plain_text", name: "APP_NAME", text: "Aether Panel" },
      { type: "plain_text", name: "APP_VERSION", text: "0.1.0" },
      {
        type: "plain_text",
        name: "PRIMARY_FETCH",
        text: "https://raw.githubusercontent.com/panel-zeus/Z-E-U-S/main/ips.txt",
      },
      {
        type: "plain_text",
        name: "DEFAULT_DOH",
        text: "https://cloudflare-dns.com/dns-query",
      },
      { type: "plain_text", name: "PROXY_FALLBACK_HOSTS", text: "fra,ams,lhr,cdg,fra2" },
      { type: "secret_text", name: "PANEL_SECRET", text: panelSecret },
      { type: "secret_text", name: "ADMIN_BOOTSTRAP_PASSWORD", text: adminPassword },
    ],
    observability: { enabled: true },
  };

  const form = new FormData();
  form.set("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }), "metadata.json");
  form.set("index.js", new Blob([workerJs], { type: "application/javascript+module" }), "index.js");

  const upload = await fetch(
    api + "/accounts/" + accountId + "/workers/scripts/" + workerName,
    { method: "PUT", headers: { Authorization: "Bearer " + token }, body: form }
  );
  const upJson = (await upload.json()) as { success: boolean; errors?: { message: string }[] };
  if (!upJson.success) {
    throw new Error("آپلود ورکر ناموفق: " + (upJson.errors?.[0]?.message || "unknown"));
  }

  // 8. enable workers.dev route for this script
  await fetch(api + "/accounts/" + accountId + "/workers/scripts/" + workerName + "/subdomain", {
    method: "POST",
    headers,
    body: JSON.stringify({ enabled: true }),
  }).catch(() => {});

  // 9. fetch (never overwrite) account-level workers.dev subdomain
  let subdomain = accountId.slice(0, 12);
  try {
    const sd = await fetch(api + "/accounts/" + accountId + "/workers/subdomain", { headers });
    const sdj = (await sd.json()) as { success: boolean; result?: { subdomain?: string } };
    if (sdj.success && sdj.result?.subdomain) subdomain = sdj.result.subdomain;
  } catch { /* use default */ }

  // 10. apply D1 schema (idempotent)
  await applyD1Schema(api, headers, accountId, d1);

  // 10b. Insert admin directly into D1. We can't call /api/auth/setup on
  // the new worker because internal Worker→workers.dev subrequests often
  // return "error 1042 (bad host header)" while the new route is still
  // propagating. Hashing the password here and inserting via the D1 HTTP
  // API is instant and 100% reliable.
  const panelBase = "https://" + workerName + "." + subdomain + ".workers.dev";
  try {
    const adminHash = await hashPassword(adminPassword);
    for (let i = 0; i < 8; i++) {
      try {
        const r = await fetch(api + "/accounts/" + accountId + "/d1/database/" + d1 + "/query", {
          method: "POST",
          headers,
          body: JSON.stringify({
            sql: "INSERT OR IGNORE INTO admins (username, password_hash, role, is_active) VALUES (?, ?, 'owner', 1)",
            params: ["admin", adminHash],
          }),
        });
        const j = (await r.json()) as { success?: boolean; errors?: { message: string }[] };
        if (j.success) break;
        if (i === 7) console.warn("admin insert failed:", j.errors?.[0]?.message);
      } catch (e) {
        if (i === 7) console.warn("admin insert error:", (e as Error).message);
      }
      await new Promise((r) => setTimeout(r, 800));
    }
  } catch (e) {
    console.warn("hash/insert admin failed:", (e as Error).message);
  }

  // 10c. Enable workers.dev subdomain explicitly and wait for the worker
  // to become reachable (up to ~20s) so the Telegram bot can report the
  // panel as live.
  await fetch(api + "/accounts/" + accountId + "/workers/scripts/" + workerName + "/subdomain", {
    method: "POST",
    headers,
    body: JSON.stringify({ enabled: true }),
  }).catch(() => {});
  const loginBody = JSON.stringify({ username: adminUser, password: adminPassword });
  for (let i = 0; i < 10; i++) {
    try {
      const lr = await fetch(panelBase + "/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: loginBody,
      });
      if (lr.ok) break;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  // 11. register queue consumer
  await fetch(api + "/accounts/" + accountId + "/workers/scripts/" + workerName + "/queues", {
    method: "POST",
    headers,
    body: JSON.stringify({
      queue_name: queueName,
      dead_letter_queue: undefined,
      settings: { batch_size: 100, max_retries: 3, max_concurrency: 5 },
    }),
  }).catch(() => {});

  // 12. cron triggers
  await fetch(api + "/accounts/" + accountId + "/workers/scripts/" + workerName + "/schedules", {
    method: "PUT",
    headers,
    body: JSON.stringify({
      schedules: [
        { cron: "* * * * *" },
        { cron: "*/5 * * * *" },
        { cron: "0 * * * *" },
      ],
    }),
  }).catch(() => {});

  const url = "https://" + workerName + "." + subdomain + ".workers.dev";
  return {
    ok: true,
    workerName,
    url,
    d1Id: d1,
    kvId: kv,
    adminUser,
    adminPassword,
    panelSecret,
  };
}

/**
 * Re-deploy (update) an existing Aether worker on a user's account,
 * preserving its D1/KV bindings and secrets. Used by the Telegram bot
 * "🔄 آپدیت پنل" action.
 */
export async function updateWorkerDeployment(input: {
  token: string;
  workerName: string;
  accountId?: string;
}): Promise<{ ok: true; workerName: string; url: string }> {
  const token = input.token.trim();
  if (!token) throw new Error("توکن خالی است");
  const api = "https://api.cloudflare.com/client/v4";
  const headers: Record<string, string> = {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  };

  let accountId = input.accountId;
  if (!accountId) {
    const accRes = await fetch(api + "/accounts", { headers });
    const aj = (await accRes.json()) as { success: boolean; result?: Array<{ id: string }>; errors?: { message: string }[] };
    if (!aj.success || !aj.result?.length) throw new Error("حساب پیدا نشد: " + (aj.errors?.[0]?.message || ""));
    accountId = aj.result[0]!.id;
  }
  const workerName = input.workerName;

  // When updating we only need existing bindings to remain intact; the
  // metadata.bindings we send here will be merged with keep_bindings by
  // Cloudflare. Look up current worker config to reuse its D1/KV/queue IDs.
  const cur = await fetch(api + "/accounts/" + accountId + "/workers/scripts/" + workerName + "/settings", { headers });
  const curJson = (await cur.json()) as {
    success: boolean;
    result?: { bindings?: Array<{ type: string; name: string; id?: string; namespace_id?: string; queue_name?: string }> };
  };
  const binds = (curJson.success ? curJson.result?.bindings || [] : []) as Array<{ type: string; name: string; id?: string; namespace_id?: string; queue_name?: string }>;
  const d1Bind = binds.find((b) => b.type === "d1" && b.name === "DB");
  const kvBind = binds.find((b) => b.type === "kv_namespace" && b.name === "KV");
  const qBind = binds.find((b) => b.type === "queue" && b.name === "WRITE_QUEUE");
  const d1 = d1Bind?.id || (await ensureD1(api, headers, accountId));
  const kv = kvBind?.namespace_id || (await ensureKv(api, headers, accountId));
  const queueName = qBind?.queue_name || "aether-writes";
  await ensureQueue(api, headers, accountId, queueName);

  let subdomain = accountId.slice(0, 12);
  try {
    const sd = await fetch(api + "/accounts/" + accountId + "/workers/subdomain", { headers });
    const sdj = (await sd.json()) as { success: boolean; result?: { subdomain?: string } };
    if (sdj.success && sdj.result?.subdomain) subdomain = sdj.result.subdomain;
  } catch { /* default */ }

  const srcRes = await fetch(WORKER_SOURCE_URL + "?v=" + Date.now());
  if (!srcRes.ok) throw new Error("دریافت سورس جدید ناموفق بود");
  const workerJs = await srcRes.text();

  const metadata = {
    main_module: "index.js",
    compatibility_date: "2025-01-15",
    compatibility_flags: ["nodejs_compat"],
    bindings: [
      { type: "d1", name: "DB", id: d1 },
      { type: "kv_namespace", name: "KV", namespace_id: kv },
      { type: "queue", name: "WRITE_QUEUE", queue_name: queueName },
      { type: "durable_object_namespace", name: "USER_STATE", class_name: "UserState", script_name: workerName },
      { type: "durable_object_namespace", name: "POOL_STATE", class_name: "PoolState", script_name: workerName },
      { type: "durable_object_namespace", name: "RATE_LIMIT", class_name: "RateLimiter", script_name: workerName },
    ],
    keep_bindings: [
      { type: "secret_text", name: "PANEL_SECRET" },
      { type: "secret_text", name: "ADMIN_BOOTSTRAP_PASSWORD" },
      { type: "plain_text", name: "APP_NAME" },
      { type: "plain_text", name: "APP_VERSION" },
      { type: "plain_text", name: "PRIMARY_FETCH" },
      { type: "plain_text", name: "DEFAULT_DOH" },
      { type: "plain_text", name: "PROXY_FALLBACK_HOSTS" },
    ],
    migrations: { tag: "v1", new_sqlite_classes: ["UserState", "PoolState", "RateLimiter"] },
    observability: { enabled: true },
  };

  const form = new FormData();
  form.set("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }), "metadata.json");
  form.set("index.js", new Blob([workerJs], { type: "application/javascript+module" }), "index.js");
  const up = await fetch(api + "/accounts/" + accountId + "/workers/scripts/" + workerName, {
    method: "PUT",
    headers: { Authorization: "Bearer " + token },
    body: form,
  });
  const uj = (await up.json()) as { success: boolean; errors?: { message: string }[] };
  if (!uj.success) throw new Error("آپلود سورس جدید ناموفق: " + (uj.errors?.[0]?.message || ""));

  // re-register queue consumer + cron (idempotent)
  await fetch(api + "/accounts/" + accountId + "/workers/scripts/" + workerName + "/queues", {
    method: "POST",
    headers,
    body: JSON.stringify({ queue_name: queueName, settings: { batch_size: 100, max_retries: 3, max_concurrency: 5 } }),
  }).catch(() => {});
  await fetch(api + "/accounts/" + accountId + "/workers/scripts/" + workerName + "/schedules", {
    method: "PUT",
    headers,
    body: JSON.stringify({ schedules: [{ cron: "* * * * *" }, { cron: "*/5 * * * *" }, { cron: "0 * * * *" }] }),
  }).catch(() => {});

  const url = "https://" + workerName + "." + subdomain + ".workers.dev";
  return { ok: true, workerName, url };
}

/* ---------------- helpers ---------------- */

async function ensureD1(api: string, headers: Record<string, string>, accountId: string, name = "aether"): Promise<string> {
  const list = await fetch(api + "/accounts/" + accountId + "/d1/database?name=" + encodeURIComponent(name), { headers });
  const lj = (await list.json()) as { success: boolean; result?: Array<{ uuid: string; name: string }> };
  const existing = lj.result?.find((d) => d.name === name);
  if (existing) return existing.uuid;
  const create = await fetch(api + "/accounts/" + accountId + "/d1/database", {
    method: "POST",
    headers,
    body: JSON.stringify({ name }),
  });
  const cj = (await create.json()) as { success: boolean; result?: { uuid: string }; errors?: { message: string }[] };
  if (!cj.success || !cj.result) throw new Error("ساخت D1 ناموفق: " + (cj.errors?.[0]?.message || ""));
  return cj.result.uuid;
}

async function ensureKv(api: string, headers: Record<string, string>, accountId: string, title = "aether-kv"): Promise<string> {
  const list = await fetch(api + "/accounts/" + accountId + "/storage/kv/namespaces?per_page=100", { headers });
  const lj = (await list.json()) as { result?: Array<{ id: string; title: string }> };
  const existing = (lj.result || []).find((n) => n.title === title);
  if (existing) return existing.id;
  const create = await fetch(api + "/accounts/" + accountId + "/storage/kv/namespaces", {
    method: "POST",
    headers,
    body: JSON.stringify({ title }),
  });
  const cj = (await create.json()) as { success: boolean; result?: { id: string }; errors?: { message: string }[] };
  if (!cj.success || !cj.result) throw new Error("ساخت KV ناموفق: " + (cj.errors?.[0]?.message || ""));
  return cj.result.id;
}

async function ensureQueue(api: string, headers: Record<string, string>, accountId: string, name = "aether-writes"): Promise<void> {
  const list = await fetch(api + "/accounts/" + accountId + "/queues", { headers });
  const lj = (await list.json()) as { success: boolean; result?: Array<{ queue_name: string }> };
  if ((lj.result || []).some((q) => q.queue_name === name)) return;
  await fetch(api + "/accounts/" + accountId + "/queues", {
    method: "POST",
    headers,
    body: JSON.stringify({ queue_name: name }),
  });
}

async function applyD1Schema(
  api: string,
  headers: Record<string, string>,
  accountId: string,
  d1Id: string
): Promise<void> {
  const res = await fetch(SCHEMA_URL + "?v=" + Date.now());
  if (!res.ok) return;
  let sql = await res.text();
  // strip SQL comments (lines starting with --) which D1 rejects
  sql = sql.split("\n").filter((l) => !l.trimStart().startsWith("--")).join("\n");
  // Split on semicolons; keep statements non-empty. The D1 query endpoint
  // accepts multiple statements in one call, which is much faster than one
  // HTTP request per statement.
  const stmts = sql
    .split(/;(?:\s|\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("PRAGMA"));
  if (stmts.length === 0) return;
  // Send in one batched call — D1 returns per-statement results.
  try {
    const r = await fetch(api + "/accounts/" + accountId + "/d1/database/" + d1Id + "/query", {
      method: "POST",
      headers,
      body: JSON.stringify({ sql: stmts.join(";\n") + ";" }),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      if (!/already exists|duplicate/i.test(body)) {
        console.warn("D1 schema batch failed, falling back to per-statement:", body.slice(0, 300));
        // Fallback: one at a time so one bad statement doesn't kill the rest.
        for (const stmt of stmts) {
          try {
            await fetch(api + "/accounts/" + accountId + "/d1/database/" + d1Id + "/query", {
              method: "POST",
              headers,
              body: JSON.stringify({ sql: stmt }),
            });
          } catch (e) {
            console.warn("D1 schema stmt failed:", (e as Error).message);
          }
        }
      }
    } else {
      const j = (await r.json()) as { success?: boolean; errors?: { message: string }[]; result?: Array<{ success: boolean; error?: string }> };
      if (j.errors?.length) {
        const realErr = j.errors.find((e) => !/already exists|duplicate/i.test(e.message));
        if (realErr) console.warn("D1 schema error:", realErr.message);
      }
      if (Array.isArray(j.result)) {
        j.result.forEach((rr, i) => {
          if (rr && rr.success === false && rr.error && !/already exists|duplicate/i.test(rr.error)) {
            console.warn("D1 stmt[" + i + "] failed:", rr.error, stmts[i]?.slice(0, 80));
          }
        });
      }
    }
  } catch (e) {
    console.warn("D1 schema fetch error:", (e as Error).message);
  }
}

function randomSuffix(n: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  for (let i = 0; i < n; i++) out += chars[arr[i]! % chars.length]!;
  return out;
}

function randomHex(n: number): string {
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomReadablePassword(): string {
  // 12-char password with upper + lower + digit, no ambiguous chars
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digit = "23456789";
  const all = upper + lower + digit;
  const out: string[] = [];
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  out.push(upper[a[0]! % upper.length]!);
  out.push(lower[a[1]! % lower.length]!);
  out.push(digit[a[2]! % digit.length]!);
  for (let i = 3; i < 12; i++) out.push(all[a[i]! % all.length]!);
  // shuffle
  for (let i = out.length - 1; i > 0; i--) {
    const j = a[i]! % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out.join("");
}
