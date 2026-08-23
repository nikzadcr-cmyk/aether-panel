// Subscription link generator. Mirrors Zeus's link structure so the
// same clients (v2rayNG, Streisand, Hiddify, Clash, sing-box, etc.)
// parse it identically:
//
//   vless://<uuid>@<clean-ip>:<port>?path=<encoded>&security=tls
//          &encryption=none&insecure=0&host=<worker-host>&fp=chrome
//          &type=ws&allowInsecure=0&sni=<worker-host>#<remark>
//
// One link per (clean IP × port × protocol) is produced, plus a short
// "noise" header so the subscription isn't trivially identifiable.

import type { UserRow } from "../db/types.js";
import { DEFAULT_CLEAN_IPS, parseIpsField } from "./cleanIps.js";

export interface SubContext {
  host: string;          // Worker hostname (used as SNI / Host header)
  port: number;          // default public TLS port
  tls: boolean;
  cleanIps?: string[];   // override default clean IP pool (from settings)
}

const TLS_PORTS = new Set(["443", "2053", "2083", "2087", "2096", "8443"]);

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
    return {
      body: JSON.stringify(buildSingBox(user, ctx, links), null, 2),
      contentType: "application/json; charset=utf-8",
    };
  }

  // Zeus-style base64 with noise header so the sub isn't trivially
  // identifiable by DPI on first fetch.
  const noise = [
    "# Sub Update: OK",
    "# Random Code: " + Math.random().toString(36).slice(2, 10),
    "# Nikzad Panel",
    "",
  ].join("\n");
  const plain = noise + links.join("\n");
  return {
    body: b64url(plain),
    contentType: "text/plain; charset=utf-8",
  };
}

export function buildLinks(user: UserRow, ctx: SubContext): string[] {
  const out: string[] = [];
  const host = ctx.host;
  const sni = user.sni_host || host;
  const fp = user.fingerprint || "chrome";
  const alpn = (user.alpn || "h2,http/1.1").replace(/\s/g, "");
  const path = "/" + Math.random().toString(36).slice(2, 12);
  const pathEnc = encodeURIComponent(path);
  const userIps = parseIpsField(user.ips);
  const pool = userIps.length
    ? userIps
    : (ctx.cleanIps && ctx.cleanIps.length ? ctx.cleanIps : DEFAULT_CLEAN_IPS);
  const ips = pool.slice(0, 30);
  const ports = String(user.port || "443").split(",").map((p) => p.trim()).filter(Boolean);
  const connType = String(user.connection_type || "vless").toLowerCase();
  const enableVless = connType.includes("vless") || !connType.includes("trojan");
  const enableTrojan = connType.includes("trojan");
  const enableVmess = connType.includes("vmess");
  const isAll = connType.includes("all");

  let frag = "";
  if (user.fragment) frag += "&fragment=" + encodeURIComponent(user.fragment);

  function pushOne(ip: string, portStr: string, pathVal: string, sec: "tls" | "none", remarkSuffix?: string) {
    const pEnc = encodeURIComponent(pathVal);
    const baseRemark = "Nikzad|" + user.username + "|" + ip + (remarkSuffix ? "|" + remarkSuffix : "");
    const encRemark = encodeURIComponent(baseRemark);
    if (enableVless) {
      out.push(
        "vless://" + user.uuid + "@" + ip + ":" + portStr +
        "?path=" + pEnc +
        "&security=" + sec +
        "&encryption=none" +
        "&insecure=0" +
        "&host=" + encodeURIComponent(sni) +
        "&fp=" + fp +
        "&type=ws" +
        "&allowInsecure=0" +
        "&sni=" + encodeURIComponent(sni) +
        (alpn ? "&alpn=" + encodeURIComponent(alpn) : "") +
        frag +
        "#" + encRemark
      );
    }
    if (enableTrojan) {
      out.push(
        "trojan://" + user.uuid + "@" + ip + ":" + portStr +
        "?path=" + pEnc +
        "&security=" + sec +
        "&insecure=0" +
        "&host=" + encodeURIComponent(sni) +
        "&fp=" + fp +
        "&type=ws" +
        "&allowInsecure=0" +
        "&sni=" + encodeURIComponent(sni) +
        (alpn ? "&alpn=" + encodeURIComponent(alpn) : "") +
        frag +
        "#" + encRemark
      );
    }
    if (enableVmess) {
      const json = {
        v: "2", ps: baseRemark, add: ip, port: portStr, id: user.uuid,
        aid: "0", net: "ws", type: "none", host: sni, path: pathVal,
        tls: sec === "tls" ? "tls" : "", sni, alpn: alpn.replace(/,/g, ""),
        fp: fp,
      };
      out.push("vmess://" + b64url(JSON.stringify(json)));
    }
  }

  // 1) Primary entries — one link per (IP × port) on the random path.
  for (const ip of ips) {
    for (const portStr of ports) {
      const isTls = TLS_PORTS.has(portStr);
      pushOne(ip, portStr, path, isTls ? "tls" : "none");
    }
  }

  // 2) "all" bundle: extra fallback variants on CDN-friendly paths
  // ("/api", "/ws", "/ray") + port-80 plain-HTTP entries so clients
  // whose DPI blocks the random path or TLS can still connect.
  if (isAll) {
    const fallbackPaths = ["/api/ws", "/ws", "/ray", "/?ed=2048"];
    const topIps = ips.slice(0, 10);
    for (const ip of topIps) {
      // Port 443 with alternative paths
      for (const fp2 of fallbackPaths.slice(0, 3)) {
        pushOne(ip, "443", fp2, "tls", fp2.replace(/[\/?=]/g, "").slice(0, 10) || "p");
      }
      // Port 80 plain HTTP (bypasses TLS DPI entirely)
      if (enableVless) {
        pushOne(ip, "80", path, "none", "80");
      }
    }
  }

  return out;
}

function cleanIpFor(ctx: SubContext, user: UserRow): string {
  const userIps = parseIpsField(user.ips);
  if (userIps.length) return userIps[0]!;
  const pool = ctx.cleanIps && ctx.cleanIps.length ? ctx.cleanIps : DEFAULT_CLEAN_IPS;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function buildClash(user: UserRow, ctx: SubContext, _links: string[]): string {
  const host = ctx.host;
  const sni = user.sni_host || host;
  const ip = cleanIpFor(ctx, user);
  const directDomains = parseList(user.route_direct);
  const blockDomains = parseList(user.route_block);
  const directRules = directDomains.map((d) => "  - DOMAIN-SUFFIX," + d + ",DIRECT").join("\n");
  const blockRules = blockDomains.map((d) => "  - DOMAIN-SUFFIX," + d + ",REJECT").join("\n");
  return "# Nikzad Panel Clash configuration\n" +
    "mixed-port: 7890\nallow-lan: false\nmode: rule\nlog-level: info\nipv6: true\n" +
    "dns:\n  enable: true\n  listen: 0.0.0.0:53\n" +
    "  default-nameserver: [1.1.1.1, 8.8.8.8]\n" +
    "  nameserver: [https://cloudflare-dns.com/dns-query, https://dns.google/dns-query]\n" +
    "proxies:\n" +
    "  - name: \"aether-" + user.username + "\"\n" +
    "    type: vless\n    server: " + ip + "\n    port: " + (user.port || 443) + "\n" +
    "    uuid: " + user.uuid + "\n    network: ws\n    tls: true\n    servername: " + sni + "\n" +
    "    ws-opts:\n      path: \"/\"\n      headers:\n        Host: " + sni + "\n" +
    "    client-fingerprint: " + (user.fingerprint || "chrome") + "\n" +
    "proxy-groups:\n  - name: PROXY\n    type: select\n    proxies: [\"aether-" + user.username + "\"]\n" +
    "rules:\n" +
    (directRules ? directRules + "\n" : "") +
    (blockRules ? blockRules + "\n" : "") +
    "  - GEOIP,IR,DIRECT\n  - MATCH,PROXY\n";
}

function buildSingBox(user: UserRow, ctx: SubContext, _links: string[]): unknown {
  const sni = user.sni_host || ctx.host;
  const ip = cleanIpFor(ctx, user);
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
        type: "vless", tag: "proxy",
        server: ip, server_port: user.port || 443, uuid: user.uuid,
        tls: { enabled: true, server_name: sni, utls: { enabled: true, fingerprint: user.fingerprint || "chrome" } },
        transport: { type: "ws", path: "/" },
      },
      { type: "direct", tag: "direct" },
      { type: "block", tag: "block" },
    ],
    route: { final: "proxy" },
  };
}

function parseList(json: string | null): string[] {
  if (!json) return [];
  try { const v = JSON.parse(json); return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []; }
  catch { return []; }
}

function b64url(s: string): string {
  const u8 = new TextEncoder().encode(s);
  let bin = "";
  for (let i = 0; i < u8.byteLength; i++) bin += String.fromCharCode(u8[i]!);
  // Standard btoa gives +/= which every sub client accepts.
  return btoa(bin);
}
