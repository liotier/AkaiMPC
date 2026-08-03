// Service Worker - offline support for the Chord Progression Generator.
//
// The previous version was never registered by any page, and its precache list
// named a redirect stub plus three icons that did not exist. cache.addAll() is
// atomic, so a single missing file failed the whole install and offline use
// never worked at all.

const CACHE_NAME = "mpc-chords-v2";

// Everything the app needs to boot with no network
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./styles.css",
  "./app.js",
  "./modules/audio.js",
  "./modules/constants.js",
  "./modules/guitarChords.js",
  "./modules/i18n.js",
  "./modules/midiExport.js",
  "./modules/musicTheory.js",
  "./modules/rendering.js",
  "./modules/storage.js",
  "./locales/en.json",
  "./locales/fr.json",
  "./locales/es.json",
  "./locales/de.json",
  "./locales/pt.json",
  "./locales/it.json",
  "./icons/favicon-32.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./20250821 MPC One on chair - web sized.jpg"
];

// Third-party scripts. Cached opportunistically: they are needed for ZIP export
// but the app still runs without them, so a CDN failure must not fail install.
const OPTIONAL_FILES = [
  "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
  "https://cdn.jsdelivr.net/npm/webmidi@3.1.16/dist/iife/webmidi.iife.js"
];

// Cache entries one at a time so a single failure cannot abort the install
async function cacheAllSettled(cache, urls) {
  await Promise.all(urls.map(url =>
    cache.add(new Request(url, { cache: "reload" }))
      .catch(error => console.warn("[sw] could not cache", url, error))
  ));
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cacheAllSettled(cache, FILES_TO_CACHE);
    await cacheAllSettled(cache, OPTIONAL_FILES);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => key === CACHE_NAME ? undefined : caches.delete(key)));
    await self.clients.claim();
  })());
});

// Stale-while-revalidate: serve the cached copy immediately, then refresh it in
// the background so a deploy reaches the user on their next visit rather than
// leaving them pinned to whatever shipped the day they first loaded the page.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isOptional = OPTIONAL_FILES.includes(request.url);
  if (!sameOrigin && !isOptional) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    const network = fetch(request).then(response => {
      // Opaque responses have status 0 and cannot be inspected; cache them
      // anyway so cross-origin scripts stay available offline
      if (response && (response.ok || response.type === "opaque")) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    }).catch(() => undefined);

    if (cached) {
      event.waitUntil(network);
      return cached;
    }

    const response = await network;
    if (response) return response;

    // Offline and never cached: fall back to the shell for navigations
    if (request.mode === "navigate") {
      const shell = await cache.match("./index.html");
      if (shell) return shell;
    }
    return Response.error();
  })());
});
