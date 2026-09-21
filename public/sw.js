/* Service worker de MuscleMap : installation sur l'écran d'accueil et lecture hors ligne.
 *
 * - /_next/static : cache d'abord (fichiers versionnés, jamais modifiés).
 * - images d'exercices : servies du cache, rafraîchies en arrière-plan.
 * - pages : réseau d'abord (données à jour), copie locale si le réseau est absent ou trop lent.
 * - /api et tout ce qui n'est pas un GET : jamais mis en cache (photos privées, exports, actions serveur).
 *
 * Changer VERSION invalide toutes les copies.
 */
const VERSION = "v1";
const STATIC = `mm-static-${VERSION}`;
const IMAGES = `mm-images-${VERSION}`;
const PAGES = `mm-pages-${VERSION}`;
const KEEP = [STATIC, IMAGES, PAGES];
const NETWORK_TIMEOUT_MS = 3500;
const MAX_IMAGES = 300;
const MAX_PAGES = 60;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith("mm-") && !KEEP.includes(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

/** Garde au plus `max` entrées : les plus anciennes partent d'abord. */
async function trim(cache, max) {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => cache.delete(k)));
}

const cacheable = (response) => response && response.ok && response.type === "basic" && !response.redirected;

async function cacheFirst(request) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (cacheable(response)) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(IMAGES);
  const hit = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (cacheable(response)) {
        cache.put(request, response.clone()).then(() => trim(cache, MAX_IMAGES));
      }
      return response;
    })
    .catch(() => hit);
  return hit || refresh;
}

async function networkFirst(request) {
  const cache = await caches.open(PAGES);

  // La requête continue même si on répond avec la copie locale : elle la met à jour pour la prochaine fois.
  const network = fetch(request).then((response) => {
    if (cacheable(response)) {
      cache.put(request, response.clone()).then(() => trim(cache, MAX_PAGES));
    }
    return response;
  });
  network.catch(() => {});

  try {
    const slow = new Promise((resolve) => setTimeout(() => resolve(null), NETWORK_TIMEOUT_MS));
    const fast = await Promise.race([network, slow]);
    if (fast) return fast;

    // Réseau lent : la copie locale si on en a une, sinon on attend le réseau.
    const hit = await cache.match(request);
    return hit || (await network);
  } catch {
    const hit = await cache.match(request);
    if (hit) return hit;
    if (request.mode === "navigate") {
      return new Response(
        `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hors ligne · MuscleMap</title>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0A0B0A;color:#EDEAE4;font-family:system-ui,sans-serif;text-align:center;padding:24px">
<div><h1 style="font-size:22px;margin:0 0 8px">Hors ligne</h1>
<p style="color:#9A958C;line-height:1.5;margin:0">Cette page n'a pas encore été ouverte avec du réseau.<br>Reviens dessus une fois connecté.</p></div></body></html>`,
        { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
      );
    }
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname === "/sw.js") return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
  } else if (request.destination === "image" || url.pathname.startsWith("/exercises/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});
