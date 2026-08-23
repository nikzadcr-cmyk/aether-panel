// Static inlined assets: PWA manifest, service worker, SVG icon.

export const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="g" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#22d3ee"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="#020617"/>
  <rect x="48" y="48" width="416" height="416" rx="88" fill="url(#g)" opacity="0.18"/>
  <g transform="translate(128,96) scale(16)" fill="none" stroke="#67e8f9" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
    <path d="M4 22 L14 2 L14 12 L22 12 L10 30 L10 20 L4 20 Z"/>
  </g>
</svg>`;

export const PWA_MANIFEST = JSON.stringify({
  name: "Aether Panel",
  short_name: "Aether",
  description: "Modern Cloudflare Worker proxy panel",
  start_url: "/panel",
  scope: "/",
  display: "standalone",
  background_color: "#07090d",
  theme_color: "#07090d",
  dir: "rtl",
  lang: "fa-IR",
  orientation: "any",
  icons: [
    { src: "/icon.svg", sizes: "192x192 512x512", type: "image/svg+xml", purpose: "any maskable" },
  ],
  categories: ["utilities", "productivity"],
});

export const SW_JS = `
const CACHE = "aether-v1";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (u.pathname.startsWith("/api/") || u.pathname.startsWith("/sub/")) return;
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(e.request);
      const run = fetch(e.request).then((res) => {
        if (res && res.status === 200) cache.put(e.request, res.clone());
        return res;
      }).catch(() => hit);
      return hit || run;
    })
  );
});
`;
