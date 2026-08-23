// Scanner service — uses Cloudflare Workers' raw TCP socket API to:
//   1. Test reachability + latency of Cloudflare edge IPs ("clean IP scanner")
//   2. Test proxies (SOCKS4 / SOCKS5 / HTTP CONNECT) by connecting through
//      them to a known-anycast target (1.1.1.1:443) and measuring RTT.
//
// Both scanners cap concurrency and wall-clock time so a single request
// cannot exhaust the Worker's subrequest/CPU budget.

import { connect } from "cloudflare:sockets";

export interface ScanResult {
  target: string;
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export interface IpScanOptions {
  ips: string[];
  port?: number;
  concurrency?: number;
  timeoutMs?: number;
}

export interface ProxyScanOptions {
  proxies: string[];
  testHost?: string;
  testPort?: number;
  concurrency?: number;
  timeoutMs?: number;
}

/**
 * Probe a single host:port by opening a TCP connection and measuring how
 * long the TLS/TCP handshake acknowledgement takes. We don't do a full TLS
 * handshake — just opening the socket to a TLS port is enough to prove
 * the edge is reachable and is a working Cloudflare anycast IP.
 */
export async function tcpPing(host: string, port: number, timeoutMs: number): Promise<number> {
  const start = Date.now();
  const socket = connect({ hostname: host, port }, { secureTransport: "off", allowHalfOpen: false });
  // Race the opened-promise against a timeout so one slow IP never blocks
  // the whole scan.
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      socket.opened,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
      }),
    ]);
    return Date.now() - start;
  } finally {
    if (timer) clearTimeout(timer);
    socket.close().catch(() => {});
  }
}

export async function scanIps(opts: IpScanOptions): Promise<ScanResult[]> {
  const port = opts.port ?? 443;
  const concurrency = Math.min(25, Math.max(1, opts.concurrency ?? 12));
  const timeoutMs = Math.min(8000, Math.max(1000, opts.timeoutMs ?? 4000));
  const out: ScanResult[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < opts.ips.length) {
      const idx = cursor++;
      const ip = opts.ips[idx]!;
      try {
        const ms = await tcpPing(ip, port, timeoutMs);
        out[idx] = { target: ip, ok: true, latencyMs: ms };
      } catch (e) {
        out[idx] = { target: ip, ok: false, latencyMs: -1, error: (e as Error).message };
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return out;
}

/**
 * Parse a proxy URI of the form:
 *   socks5://[user:pass@]host:port
 *   socks4://host:port
 *   http://[user:pass@]host:port
 *   host:port                            (treated as SOCKS5)
 * Returns null on malformed input.
 */
export interface ParsedProxy {
  type: "socks5" | "socks4" | "http";
  host: string;
  port: number;
  user?: string;
  pass?: string;
}
export function parseProxyUri(raw: string): ParsedProxy | null {
  let s = raw.trim();
  if (!s) return null;
  let type: ParsedProxy["type"] = "socks5";
  if (s.startsWith("socks5://")) { type = "socks5"; s = s.slice(9); }
  else if (s.startsWith("socks4://")) { type = "socks4"; s = s.slice(9); }
  else if (s.startsWith("http://")) { type = "http"; s = s.slice(7); }
  else if (s.startsWith("https://")) { type = "http"; s = s.slice(8); }
  let user: string | undefined, pass: string | undefined;
  const at = s.lastIndexOf("@");
  if (at >= 0) {
    const cred = s.slice(0, at);
    s = s.slice(at + 1);
    const ci = cred.indexOf(":");
    if (ci >= 0) { user = cred.slice(0, ci); pass = cred.slice(ci + 1); }
    else user = cred;
  }
  // strip path/query if present
  s = s.split("/")[0]!.split("?")[0]!;
  const ci = s.lastIndexOf(":");
  if (ci < 0) return null;
  const host = s.slice(0, ci);
  const port = parseInt(s.slice(ci + 1), 10);
  if (!host || !Number.isFinite(port) || port < 1 || port > 65535) return null;
  return { type, host, port, user, pass };
}

/**
 * Test a proxy by asking it to CONNECT to testHost:testPort and measuring
 * how long until the upstream acknowledges. We then close immediately.
 */
export async function testProxy(p: ParsedProxy, testHost: string, testPort: number, timeoutMs: number): Promise<number> {
  const start = Date.now();
  const socket = connect({ hostname: p.host, port: p.port }, { secureTransport: "off", allowHalfOpen: false });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const writer = socket.writable.getWriter();
  const reader = socket.readable.getReader();
  try {
    await Promise.race([
      socket.opened,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("connect timeout")), timeoutMs);
      }),
    ]);
    if (timer) { clearTimeout(timer); timer = undefined; }

    if (p.type === "socks5") {
      // greeting (no-auth)
      await writer.write(new Uint8Array([0x05, 0x01, 0x00]));
      const hdr = await readExact(reader, 2, timeoutMs);
      if (hdr[0] !== 0x05) throw new Error("bad SOCKS5 handshake");
      if (hdr[1] === 0x02 && p.user) {
        // user/pass auth
        const u = new TextEncoder().encode(p.user);
        const pw = new TextEncoder().encode(p.pass || "");
        const buf = new Uint8Array(3 + u.length + pw.length);
        buf.set([0x01, u.length], 0); buf.set(u, 2);
        buf[2 + u.length] = pw.length; buf.set(pw, 3 + u.length);
        await writer.write(buf);
        const ar = await readExact(reader, 2, timeoutMs);
        if (ar[1] !== 0x00) throw new Error("SOCKS5 auth failed");
      } else if (hdr[1] !== 0x00) {
        throw new Error("SOCKS5 requires auth");
      }
      // CONNECT to testHost
      const host = new TextEncoder().encode(testHost);
      const req = new Uint8Array(7 + host.length);
      req.set([0x05, 0x01, 0x00, 0x03, host.length], 0);
      req.set(host, 5);
      req[5 + host.length] = (testPort >> 8) & 0xff;
      req[6 + host.length] = testPort & 0xff;
      await writer.write(req);
      const rep = await readExact(reader, 4, timeoutMs);
      if (rep[1] !== 0x00) throw new Error("SOCKS5 connect failed (" + rep[1] + ")");
      // consume the rest of the reply (bound addr)
      const atyp = rep[3];
      if (atyp === 1) await readExact(reader, 4, timeoutMs);
      else if (atyp === 4) await readExact(reader, 16, timeoutMs);
      else if (atyp === 3) { const l = await readExact(reader, 1, timeoutMs); await readExact(reader, l[0]!, timeoutMs); }
      await readExact(reader, 2, timeoutMs);
    } else if (p.type === "socks4") {
      const ip = testHost.split(".").map((x) => parseInt(x, 10));
      const buf = new Uint8Array(9);
      buf.set([0x04, 0x01, (testPort >> 8) & 0xff, testPort & 0xff,
        ip[0] || 0, ip[1] || 0, ip[2] || 0, ip[3] || 0, 0x00], 0);
      await writer.write(buf);
      const r = await readExact(reader, 8, timeoutMs);
      if (r[1] !== 0x5a) throw new Error("SOCKS4 connect failed (" + r[1] + ")");
    } else {
      // HTTP CONNECT
      const auth = p.user ? "Basic " + btoa(p.user + ":" + (p.pass || "")) : "";
      const req = "CONNECT " + testHost + ":" + testPort + " HTTP/1.1\r\nHost: " + testHost + ":" + testPort + "\r\n" +
        (auth ? "Proxy-Authorization: " + auth + "\r\n" : "") + "Proxy-Connection: close\r\n\r\n";
      await writer.write(new TextEncoder().encode(req));
      // read until \r\n\r\n
      let buf = "";
      while (buf.indexOf("\r\n\r\n") < 0) {
        const { value, done } = await Promise.race([
          reader.read(),
          new Promise<never>((_, reject) => {
            const t = setTimeout(() => reject(new Error("http timeout")), timeoutMs);
            timer = t as unknown as ReturnType<typeof setTimeout>;
          }),
        ]);
        if (timer) { clearTimeout(timer); timer = undefined; }
        if (done) throw new Error("proxy closed");
        buf += new TextDecoder().decode(value);
        if (buf.length > 4096) break;
      }
      const line = buf.split("\r\n")[0] || "";
      if (!/ 200\b/.test(line)) throw new Error("HTTP proxy: " + line);
    }
    return Date.now() - start;
  } finally {
    if (timer) clearTimeout(timer);
    try { await writer.close(); } catch {}
    try { await reader.cancel(); } catch {}
    socket.close().catch(() => {});
  }
}

async function readExact(reader: ReadableStreamDefaultReader<Uint8Array>, n: number, timeoutMs: number): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let total = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    while (total < n) {
      const { value, done } = await Promise.race([
        reader.read(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("read timeout")), timeoutMs);
        }),
      ]);
      if (timer) { clearTimeout(timer); timer = undefined; }
      if (done || !value) throw new Error("socket closed");
      chunks.push(value);
      total += value.length;
    }
  } finally {
    if (timer) clearTimeout(timer);
  }
  const out = new Uint8Array(n);
  let off = 0;
  for (const c of chunks) {
    const take = Math.min(c.length, n - off);
    out.set(c.subarray(0, take), off);
    off += take;
    if (off >= n) break;
  }
  return out;
}

export async function scanProxies(opts: ProxyScanOptions): Promise<ScanResult[]> {
  const testHost = opts.testHost || "1.1.1.1";
  const testPort = opts.testPort ?? 443;
  const concurrency = Math.min(15, Math.max(1, opts.concurrency ?? 8));
  const timeoutMs = Math.min(10000, Math.max(2000, opts.timeoutMs ?? 6000));
  const out: ScanResult[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < opts.proxies.length) {
      const idx = cursor++;
      const raw = opts.proxies[idx]!;
      const parsed = parseProxyUri(raw);
      if (!parsed) {
        out[idx] = { target: raw, ok: false, latencyMs: -1, error: "bad URI" };
        continue;
      }
      try {
        const ms = await testProxy(parsed, testHost, testPort, timeoutMs);
        out[idx] = { target: raw, ok: true, latencyMs: ms };
      } catch (e) {
        out[idx] = { target: raw, ok: false, latencyMs: -1, error: (e as Error).message };
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return out;
}
