// Auth routes: setup, login, logout, change password, 2FA.

import { Hono } from "hono";
import type { Env } from "../env.js";
import { destroySession, issueSession, requireAuth, type AppVars } from "../middleware/auth.js";
import { hashPassword, verifyPassword, generateTotpSecret, verifyTotp, totpUri, randomToken } from "../util/crypto.js";
import { nowSec } from "../util/bytes.js";

export const authRoutes = new Hono<{ Bindings: Env; Variables: AppVars }>();

authRoutes.post("/setup", async (c) => {
  const env = c.env;
  const existing = await env.DB.prepare("SELECT COUNT(*) AS n FROM admins").first<{ n: number }>();
  if (existing && existing.n > 0) return c.json({ error: "already initialized" }, 400);
  const body = await c.req.json<{ username: string; password: string }>();
  if (!body.username || !body.password || body.password.length < 8) {
    return c.json({ error: "username and password (>=8 chars) required" }, 400);
  }
  const hash = await hashPassword(body.password);
  await env.DB.prepare("INSERT INTO admins (username, password_hash, role, is_active) VALUES (?,?, 'owner', 1)")
    .bind(body.username, hash).run();
  return c.json({ ok: true });
});

// Auto-bootstrap admin from ADMIN_BOOTSTRAP_PASSWORD secret (used by
// the Telegram bot when deploying a fresh panel for a user).
authRoutes.post("/auto-bootstrap", async (c) => {
  const env = c.env;
  if (!env.ADMIN_BOOTSTRAP_PASSWORD) return c.json({ error: "no bootstrap secret" }, 400);
  const existing = await env.DB.prepare("SELECT COUNT(*) AS n FROM admins").first<{ n: number }>();
  if (existing && existing.n > 0) return c.json({ ok: true, already: true });
  const hash = await hashPassword(env.ADMIN_BOOTSTRAP_PASSWORD);
  await env.DB.prepare("INSERT INTO admins (username, password_hash, role, is_active) VALUES (?, ?, 'owner', 1)")
    .bind("admin", hash).run();
  return c.json({ ok: true });
});

authRoutes.post("/login", async (c) => {
  const env = c.env;
  const body = await c.req.json<{ username: string; password: string; totp?: string }>();
  const row = await env.DB.prepare("SELECT * FROM admins WHERE username = ? AND is_active = 1")
    .bind(body.username).first<{ id: number; password_hash: string; totp_secret: string | null }>();
  if (!row || !(await verifyPassword(body.password, row.password_hash))) {
    return c.json({ error: "invalid credentials" }, 401);
  }
  if (row.totp_secret) {
    if (!body.totp || !(await verifyTotp(row.totp_secret, body.totp))) {
      return c.json({ error: "totp required" }, 401);
    }
  }
  // Upgrade legacy sha256 hashes.
  if (!row.password_hash.startsWith("pbkdf2$")) {
    const newHash = await hashPassword(body.password);
    await env.DB.prepare("UPDATE admins SET password_hash = ? WHERE id = ?").bind(newHash, row.id).run();
  }
  await env.DB.prepare("UPDATE admins SET last_login = ? WHERE id = ?").bind(nowSec(), row.id).run();
  await issueSession(c, row.id, env);
  return c.json({ ok: true });
});

authRoutes.post("/logout", async (c) => {
  await destroySession(c, c.env);
  return c.json({ ok: true });
});

authRoutes.get("/me", requireAuth, async (c) => {
  return c.json({
    actor: c.get("actor"),
    role: c.get("role"),
    kind: c.get("authKind"),
  });
});

authRoutes.post("/change-password", requireAuth, async (c) => {
  const env = c.env;
  const adminId = c.get("adminId") as number | undefined;
  if (!adminId) return c.json({ error: "session required" }, 403);
  const body = await c.req.json<{ current: string; next: string }>();
  if (!body.next || body.next.length < 8) return c.json({ error: "password too short" }, 400);
  const row = await env.DB.prepare("SELECT password_hash FROM admins WHERE id = ?").bind(adminId).first<{ password_hash: string }>();
  if (!row || !(await verifyPassword(body.current, row.password_hash))) return c.json({ error: "bad current password" }, 400);
  await env.DB.prepare("UPDATE admins SET password_hash = ? WHERE id = ?").bind(await hashPassword(body.next), adminId).run();
  return c.json({ ok: true });
});

authRoutes.post("/2fa/enroll", requireAuth, async (c) => {
  const adminId = c.get("adminId") as number | undefined;
  if (!adminId) return c.json({ error: "session required" }, 403);
  const secret = generateTotpSecret();
  await c.env.DB.prepare("UPDATE admins SET totp_secret = ? WHERE id = ?").bind(secret, adminId).run();
  const row = await c.env.DB.prepare("SELECT username FROM admins WHERE id = ?").bind(adminId).first<{ username: string }>();
  return c.json({ secret, uri: totpUri(secret, "Aether Panel", row!.username) });
});

authRoutes.post("/2fa/disable", requireAuth, async (c) => {
  const adminId = c.get("adminId") as number | undefined;
  if (!adminId) return c.json({ error: "session required" }, 403);
  await c.env.DB.prepare("UPDATE admins SET totp_secret = NULL WHERE id = ?").bind(adminId).run();
  return c.json({ ok: true });
});

authRoutes.post("/token", requireAuth, async (c) => {
  const body = await c.req.json<{ name: string; scopes: string[]; ttlDays?: number }>();
  const raw = randomToken(32);
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const expires = body.ttlDays ? nowSec() + body.ttlDays * 86400 : null;
  await c.env.DB.prepare("INSERT INTO api_tokens (name, token_hash, scopes, expires_at) VALUES (?,?,?,?)")
    .bind(body.name, hex, JSON.stringify(body.scopes || ["read"]), expires).run();
  return c.json({ token: raw, expiresAt: expires });
});
