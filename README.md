# ⚡ Aether Panel

A modern, modular **Cloudflare Worker** proxy panel. Built with TypeScript, Hono,
D1, Durable Objects, KV, R2, Queues and Analytics Engine — designed to be a
clean-room, well-architected alternative to ZEUS and similar single-file panels.

## Highlights

- **Multi-protocol inbound on a single Worker**: VLESS, Trojan and VMess over
  WebSocket, selectable per user (including combinations).
- **Durable traffic accounting**: per-user counters live in a Durable Object and
  are persisted before isolate eviction, so bytes are not lost.
- **Batched writes**: traffic counters are flushed to D1 through Cloudflare
  Queues, dramatically reducing D1 write pressure.
- **Strong auth**: PBKDF2-SHA256 (210k iters) password hashing, random opaque
  session tokens in `HttpOnly`/`Secure` cookies, CSRF origin check, optional
  TOTP 2FA, scoped API tokens.
- **Multi-admin RBAC**: roles `owner / admin / support / readonly`.
- **Live upstream pool**: country-routed SOCKS4 / SOCKS5 / HTTP CONNECT proxies
  with background health checks.
- **Content filtering**: DoH-based blocking for NSFW, ads and malware
  (Cloudflare Family / AdGuard / Cloudflare Security).
- **Subscription outputs**: base64 (default), raw, Clash YAML, sing-box JSON.
- **Auto maintenance (cron)**: clean-IP rotation, quota auto-resets, pool health.
- **Audit log, time-series traffic table, coupons/gifts**.
- **PWA**: installable RTL panel in Persian with dark AMOLED theme, no build
  step required for the bundled UI.

## Repository layout

```
src/
  index.ts                 entry: routing, cron, queue consumer
  env.ts                   shared Env / QueueMessage types
  core/
    tunnel.ts              WebSocket tunnel orchestration
    pump.ts                backpressure-aware bidirectional pump
    types.ts               shared protocol/upstream types
    protocol/parsers.ts    VLESS / Trojan / VMess inbound parsers
    upstream/connect.ts    direct, SOCKS4/5, HTTP CONNECT connectors
    dns/doh.ts             DoH client + content filter
  do/
    UserState.ts           per-user DO: online + unflushed traffic
    PoolState.ts           global upstream proxy pool + health checks
    RateLimiter.ts         login/rate limiter
  db/
    schema.ts              Drizzle schema
    types.ts               row types
  routes/
    auth.ts                /api/auth/*
    users.ts               /api/users/*
  middleware/auth.ts       session / API-token auth, CSRF
  services/subscription.ts sub link generator (base64/clash/sing-box)
  telegram/bot.ts          optional Telegram bot
  ui/
    panel.ts               HTML for panel / login / status / 404
    assets.ts              SVG icon, PWA manifest, service worker
migrations/0001_init.sql   initial D1 schema
test/protocol.test.ts      parser unit tests
```

## Requirements

- Node.js ≥ 18
- A Cloudflare account
- `wrangler` (installed as devDependency)

## Local development

```bash
npm install
npx wrangler dev
```

## First-time deployment

1. **Create the D1 database**
   ```bash
   npx wrangler d1 create aether
   ```
   Copy the returned `database_id` into `wrangler.toml` →
   `[[d1_databases]].database_id`.

2. **Create KV namespace**
   ```bash
   npx wrangler kv namespace create AETHER_KV
   ```
   Copy the id into `wrangler.toml` → `[[kv_namespaces]].id`.

3. **Create R2 bucket**
   ```bash
   npx wrangler r2 bucket create aether-data
   ```

4. **Create the queue**
   ```bash
   npx wrangler queues create aether-writes
   ```

5. **Run migrations**
   ```bash
   npx wrangler d1 migrations apply aether --remote
   ```

6. **Set the master secret** (used for HMAC/signing where needed)
   ```bash
   npx wrangler secret put PANEL_SECRET
   ```
   Use a long random string (e.g. `openssl rand -hex 32`).

7. **(Optional) Telegram bot**
   ```bash
   npx wrangler secret put TELEGRAM_TOKEN
   npx wrangler secret put TELEGRAM_ADMIN_ID
   ```

8. **Deploy**
   ```bash
   npx wrangler deploy
   ```

9. **Initial admin**: open `https://<worker>/panel` — the bootstrap form will
   create the first `owner` account.

## Configuring a client

After creating a user in the panel, copy the subscription URL:

```
https://<worker>/sub/<username>
```

Import it into v2rayN / v2rayNG / Streisand / Shadowrocket / Hiddify / Clash Meta.
Append `?format=clash` or `?format=singbox` for those formats.

Per-user paths for direct WS connections:

| Protocol | WS path                |
| -------- | ---------------------- |
| VLESS    | `/vless/<uuid>`        |
| Trojan   | `/trojan/<sha224(uuid)>` |
| VMess    | `/vmess/<uuid>`        |

The default `connection_type = "vless+trojan"` activates both on one UUID.

## One-shot deploy with deploy.sh

```bash
CLOUDFLARE_API_TOKEN=xxx \
CLOUDFLARE_ACCOUNT_ID=yyy \
PANEL_SECRET=$(openssl rand -hex 32) \
TELEGRAM_TOKEN=123:abc \
TELEGRAM_ADMIN_ID=111111 \
bash deploy.sh aether-panel
```

The script verifies the token, creates D1/KV/R2/Queue if missing, patches
`wrangler.toml`, applies migrations, sets secrets and runs `wrangler deploy`.
After deployment register the Telegram webhook:

```bash
TELEGRAM_TOKEN=xxx WORKER_URL=https://aether-panel.<you>.workers.dev \
  bash scripts/set-telegram-webhook.sh
```

## Upstream proxy pool

- Drop proxy URIs in via `POST /api/proxies/import` (panel UI → «پروکسی‌ها»):
  - `{ "url": "https://example.com/proxy/US.txt", "country": "US" }`
  - or `{ "list": ["socks5://u:p@host:1080", ...], "country": "US" }`
- Each user can either hard-code `user_socks5` or set `user_proxy_iata` to
  pick a random healthy proxy from that country's pool.
- The `PoolState` Durable Object health-checks proxies every minute and
  serves healthy random picks.

## Time-series traffic

Every session close writes one row to `traffic_hourly` (up/down/requests).
Fetch with:

```
GET /api/traffic/<username>?hours=24
```

## Backup / restore

```bash
# owner-only
curl -X GET "$URL/api/system/backup" -H "Cookie: ..." -o backup.json
curl -X POST "$URL/api/system/restore" -H "content-type: application/json" \
     -H "Cookie: ..." --data @backup.json
```

Backups are also written to the `aether-data` R2 bucket automatically.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Run Wrangler dev server |
| `npm run deploy` | Deploy to Cloudflare |
| `npm run typecheck` | Run `tsc --noEmit` |
| `npm test` | Run Vitest unit tests |
| `npm run db:migrate:local` | Apply D1 migrations locally |
| `npm run db:migrate:remote` | Apply D1 migrations in production |

## Roadmap

- [ ] Full multi-hop chain support in `connect.ts`
- [ ] Telegram bot inline buttons + user self-service portal
- [ ] R2-backed block-list ingestion (StevenBlack / Iranian NSFW)
- [ ] Admin UI split into a modern Svelte/Solid SPA (currently inline)
- [ ] Geosite/GeoIP rule engine for direct/block routing
- [ ] Coupons & payment webhooks
- [ ] Per-user traffic charts from Analytics Engine
- [ ] Backup/restore to/from R2

## License

MIT — see `LICENSE`.
