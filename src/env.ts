// Shared environment types for Aether Panel
export type Env = {
  // Bindings (see wrangler.toml)
  DB: D1Database;
  KV: KVNamespace;
  BUCKET?: R2Bucket;            // optional — requires R2 (paid)
  METRICS?: AnalyticsEngineDataset;
  WRITE_QUEUE: Queue<QueueMessage>;

  USER_STATE: DurableObjectNamespace;
  POOL_STATE: DurableObjectNamespace;
  RATE_LIMIT: DurableObjectNamespace;

  // Secrets
  PANEL_SECRET: string;
  TELEGRAM_TOKEN?: string;
  TELEGRAM_ADMIN_ID?: string;
  CF_API_TOKEN?: string;       // Cloudflare API token for in-panel self-update
  CF_ACCOUNT_ID?: string;      // optional override; otherwise auto-detected
  CF_SCRIPT_NAME?: string;     // optional override; otherwise derived from request host

  // Public vars
  APP_NAME: string;
  APP_VERSION: string;
  PRIMARY_FETCH: string;
  DEFAULT_DOH: string;
  PROXY_FALLBACK_HOSTS: string;

  // Non-production
  ADMIN_BOOTSTRAP_PASSWORD?: string;
};;

export type QueueMessage =
  | { type: "traffic"; username: string; bytes: number; requests: number }
  | { type: "request"; username: string; ts: number }
  | { type: "audit"; actor: string; action: string; meta: Record<string, unknown> };
