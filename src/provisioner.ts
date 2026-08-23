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
//   6. return the panel URL + generated admin password

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

const WORKER_SOURCE_URL =
  "https://cdn.jsdelivr.net/gh/nikzadcr-cmyk/aether-panel@main/dist/index.js";

const SCHEMA_URL =
  "https://cdn.jsdelivr.net/gh/nikzadcr-cmyk/aether-panel@main/migrations/0001_init.sql";

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

  // 2. D1
  const d1 = await ensureD1(api, headers, accountId);
  // 3. KV
  const kv = await ensureKv(api, headers, accountId);
  // 4. Queue
  await ensureQueue(api, headers, accountId);
  // 5. fetch worker source
  const srcRes = await fetch(WORKER_SOURCE_URL);
  if (!srcRes.ok) throw new Error("دریافت سورس ورکر از گیت‌هاب ناموفق بود");
  const workerJs = await srcRes.text();

  // 6. set up secrets: we generate and upload PANEL_SECRET, admin password.
  const panelSecret = randomHex(32);
  const adminPassword = randomReadablePassword();
  const adminUser = "admin";

  // 7. multipart upload of worker with metadata
  const metadata = {
    main_module: "worker.js",
    compatibility_date: "2025-01-15",
    compatibility_flags: ["nodejs_compat"],
    migrations: [
      {
        tag: "v1",
        new_sqlite_classes: ["UserState", "PoolState", "RateLimiter"],
      },
    ],
    bindings: [
      { type: "d1", name: "DB", id: d1 },
      { type: "kv_namespace", name: "KV", namespace_id: kv },
      { type: "queue", name: "WRITE_QUEUE", queue_name: "aether-writes" },
      {
        type: "durable_object_namespace",
        name: "USER_STATE",
        class_name: "UserState",
        script_name: workerName,
      },
      {
        type: "durable_object_namespace",
        name: "POOL_STATE",
        class_name: "PoolState",
        script_name: workerName,
      },
      {
        type: "durable_object_namespace",
        name: "RATE_LIMIT",
        class_name: "RateLimiter",
        script_name: workerName,
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
  form.set("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.set("worker.js", new Blob([workerJs], { type: "application/javascript+module" }));

  const upload = await fetch(
    api + "/accounts/" + accountId + "/workers/scripts/" + workerName,
    { method: "PUT", headers: { Authorization: "Bearer " + token }, body: form }
  );
  const upJson = (await upload.json()) as { success: boolean; errors?: { message: string }[] };
  if (!upJson.success) {
    throw new Error("آپلود ورکر ناموفق: " + (upJson.errors?.[0]?.message || "unknown"));
  }

  // 8. enable workers.dev subdomain for this worker (one-time per account)
  await fetch(api + "/accounts/" + accountId + "/workers/scripts/" + workerName + "/subdomain", {
    method: "POST",
    headers,
    body: JSON.stringify({ enabled: true }),
  }).catch(() => {});

  // 9. make sure account-level workers.dev is on
  await fetch(api + "/accounts/" + accountId + "/workers/subdomain", {
    method: "PUT",
    headers,
    body: JSON.stringify({ subdomain: accountId.slice(0, 12) }),
  }).catch(() => {});

  // 10. apply D1 schema (idempotent)
  await applyD1Schema(api, headers, accountId, d1);

  // 11. register queue consumer
  await fetch(api + "/accounts/" + accountId + "/workers/scripts/" + workerName + "/queues", {
    method: "POST",
    headers,
    body: JSON.stringify({
      queue_name: "aether-writes",
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

  const url = "https://" + workerName + "." + accountId.slice(0, 12) + ".workers.dev";
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

/* ---------------- helpers ---------------- */

async function ensureD1(api: string, headers: Record<string, string>, accountId: string): Promise<string> {
  const list = await fetch(api + "/accounts/" + accountId + "/d1/database?name=aether", { headers });
  const lj = (await list.json()) as { success: boolean; result?: Array<{ uuid: string; name: string }> };
  const existing = lj.result?.find((d) => d.name === "aether");
  if (existing) return existing.uuid;
  const create = await fetch(api + "/accounts/" + accountId + "/d1/database", {
    method: "POST",
    headers,
    body: JSON.stringify({ name: "aether" }),
  });
  const cj = (await create.json()) as { success: boolean; result?: { uuid: string }; errors?: { message: string }[] };
  if (!cj.success || !cj.result) throw new Error("ساخت D1 ناموفق: " + (cj.errors?.[0]?.message || ""));
  return cj.result.uuid;
}

async function ensureKv(api: string, headers: Record<string, string>, accountId: string): Promise<string> {
  const list = await fetch(api + "/accounts/" + accountId + "/storage/kv/namespaces?per_page=100", { headers });
  const lj = (await list.json()) as { result?: Array<{ id: string; title: string }> };
  const existing = (lj.result || []).find((n) => n.title === "aether-kv");
  if (existing) return existing.id;
  const create = await fetch(api + "/accounts/" + accountId + "/storage/kv/namespaces", {
    method: "POST",
    headers,
    body: JSON.stringify({ title: "aether-kv" }),
  });
  const cj = (await create.json()) as { success: boolean; result?: { id: string }; errors?: { message: string }[] };
  if (!cj.success || !cj.result) throw new Error("ساخت KV ناموفق: " + (cj.errors?.[0]?.message || ""));
  return cj.result.id;
}

async function ensureQueue(api: string, headers: Record<string, string>, accountId: string): Promise<void> {
  const list = await fetch(api + "/accounts/" + accountId + "/queues", { headers });
  const lj = (await list.json()) as { success: boolean; result?: Array<{ queue_name: string }> };
  if ((lj.result || []).some((q) => q.queue_name === "aether-writes")) return;
  await fetch(api + "/accounts/" + accountId + "/queues", {
    method: "POST",
    headers,
    body: JSON.stringify({ queue_name: "aether-writes" }),
  });
}

async function applyD1Schema(
  api: string,
  headers: Record<string, string>,
  accountId: string,
  d1Id: string
): Promise<void> {
  const res = await fetch(SCHEMA_URL);
  if (!res.ok) return;
  const sql = await res.text();
  // split on semicolons for individual statements
  const stmts = sql.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
  for (const stmt of stmts) {
    await fetch(api + "/accounts/" + accountId + "/d1/database/" + d1Id + "/query", {
      method: "POST",
      headers,
      body: JSON.stringify({ sql: stmt }),
    }).catch(() => {});
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
