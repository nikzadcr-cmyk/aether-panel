// Subscription link generator. Produces base64-encoded plain text
// for generic clients, and Clash YAML / sing-box JSON when the
// request asks via ?format=.

import type { UserRow } from "../db/types.js";

export interface SubContext {
  host: string;          // Worker hostname (used as SNI)
  port: number;          // public TLS port
  tls: boolean;
  pathPrefix?: string;
}

export async function generateSubscription(
  user: UserRow,
  ctx: SubContext,
  format: "base64" | "clash" | "singbox" | "raw" = "base64"
): Promise<{ body: string; contentType: string }> {
  const links = buildLinks(user, ctx);
  if (format === "raw") {
    return { body: links.join("\n"), contentType: "text/plain; charset=utf-8" };
  }
  if (format === "clash") {
    return { body: buildClash(user, ctx, links), contentType: "text/yaml; charset=utf-8" };
  }
  if (format === "singbox") {
    return { body: JSON.stringify(buildSingBox(user, ctx, links), null, 2), contentType: "application/json; charset=utf-8" };
  }
  return {
    body: b64url(links.join("\n")),
    contentType: "text/plain; charset=utf-8",
  };
}

function buildLinks(user: UserRow, ctx: SubContext): string[] {
  const out: string[] = [];
  const host = ctx.host;
  const port = user.port ?? ctx.port;
  // Use a simple, client-friendly path. "/" trips up some importers;
  // "/ws" is recognized by every VLESS/Trojan client.
  const path = (user.path && user.path !== "/") ? user.path : "/ws";
  const sni = user.sni_host || host;
  const fp = user.fingerprint || "chrome";
  const alpnList = (user.alpn || "h2,http/1.1").split(",").filter(Boolean);
  const security = ctx.tls ? "tls" : "none";
  const tlsParam = security === "tls"
    ? "&security=tls&sni=" + encodeURIComponent(sni) + "&fp=" + fp + "&alpn=" + alpnList.join(",") + "&allowInsecure=" + (user.allow_insecure ? 1 : 0)
    : "&security=none";
  const frag = user.fragment ? "&fragment=" + encodeURIComponent(user.fragment) : "";
  const label = "Aether|" + user.username;
  const encPath = encodeURIComponent(path);
  const encHost = encodeURIComponent(sni);

  const connType = (user.connection_type || "vless").toLowerCase();

  if (connType.includes("vless")) {
    out.push(
      "vless://" + user.uuid + "@" + host + ":" + port +
      "?encryption=none&security=" + security +
      "&sni=" + encodeURIComponent(sni) +
      "&fp=" + fp +
      "&alpn=" + alpnList.join(",") +
      "&allowInsecure=" + (user.allow_insecure ? 1 : 0) +
      "&type=ws&host=" + encHost + "&path=" + encPath +
      frag +
      "#" + encodeURIComponent(label + "|vless")
    );
  }
  if (connType.includes("trojan")) {
    // Most Trojan clients hash the password themselves; send the raw UUID.
    out.push(
      "trojan://" + user.uuid + "@" + host + ":" + port +
      "?security=" + security +
      "&sni=" + encodeURIComponent(sni) +
      "&fp=" + fp +
      "&alpn=" + alpnList.join(",") +
      "&allowInsecure=" + (user.allow_insecure ? 1 : 0) +
      "&type=ws&host=" + encHost + "&path=" + encPath +
      frag +
      "#" + encodeURIComponent(label + "|trojan")
    );
  }
  if (connType.includes("vmess")) {
    const json = {
      v: "2", ps: label + "|vmess", add: host, port: String(port), id: user.uuid,
      aid: "0", net: "ws", type: "none", host: sni, path,
      tls: security === "tls" ? "tls" : "", sni, alpn: alpnList.join(","), fp,
    };
    out.push("vmess://" + b64url(JSON.stringify(json)));
  }
  return out;
}

function buildClash(user: UserRow, ctx: SubContext, links: string[]): string {
  const name = `aether-${user.username}`;
  const sni = user.sni_host || ctx.host;
  const uuid = user.uuid;
  const directDomains = parseList(user.route_direct);
  const blockDomains = parseList(user.route_block);
  const directRules = directDomains.length
    ? directDomains.map((d) => `  - DOMAIN-SUFFIX,${d},DIRECT`).join("\n")
    : "";
  const blockRules = blockDomains.length
    ? blockDomains.map((d) => `  - DOMAIN-SUFFIX,${d},REJECT`).join("\n")
    : "";
  return `# Aether Panel Clash configuration
mixed-port: 7890
allow-lan: false
mode: rule
log-level: info
ipv6: true
dns:
  enable: true
  listen: 0.0.0.0:53
  default-nameserver:
    - 1.1.1.1
    - 8.8.8.8
  nameserver:
    - https://cloudflare-dns.com/dns-query
    - https://dns.google/dns-query
proxies:
  - name: "${name}"
    type: vless
    server: ${ctx.host}
    port: ${user.port ?? ctx.port}
    uuid: ${uuid}
    network: ws
    tls: ${ctx.tls}
    servername: ${sni}
    ws-opts:
      path: "${user.path || "/"}"
      headers:
        Host: ${sni}
    client-fingerprint: ${user.fingerprint || "chrome"}
proxy-groups:
  - name: "PROXY"
    type: select
    proxies: ["${name}"]
rules:
${directRules ? directRules + "\n" : ""}${blockRules ? blockRules + "\n" : ""}  - GEOIP,IR,DIRECT
  - MATCH,PROXY
`;
}

function buildSingBox(_user: UserRow, _ctx: SubContext, _links: string[]): unknown {
  const directDomains = parseList(_user.route_direct);
  const blockDomains = parseList(_user.route_block);
  const rules: unknown[] = [];
  for (const d of directDomains) rules.push({ domain_suffix: [d], outbound: "direct" });
  for (const d of blockDomains) rules.push({ domain_suffix: [d], outbound: "block" });
  rules.push({ geoip: ["IR"], outbound: "direct" });
  return {
    log: { level: "info" },
    dns: {
      servers: [
        { tag: "cf", address: "https://cloudflare-dns.com/dns-query" },
        { tag: "local", address: "local", detour: "direct" },
      ],
      rules: [{ domain_suffix: [".ir"], server: "local" }],
    },
    outbounds: [
      {
        type: "vless",
        tag: "proxy",
        server: _ctx.host,
        server_port: _user.port ?? _ctx.port,
        uuid: _user.uuid,
        tls: { enabled: _ctx.tls, server_name: _user.sni_host || _ctx.host, utls: { enabled: true, fingerprint: _user.fingerprint || "chrome" } },
        transport: { type: "ws", path: _user.path || "/" },
      },
      { type: "direct", tag: "direct" },
      { type: "block", tag: "block" },
    ],
    route: { rules, final: "proxy" },
  };
}

function parseList(json: string | null): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function b64url(s: string): string {
  const enc = new TextEncoder();
  const u8 = enc.encode(s);
  let bin = "";
  for (let i = 0; i < u8.byteLength; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
