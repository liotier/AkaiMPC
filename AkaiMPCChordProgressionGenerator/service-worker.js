// Service Worker - offline support for the Chord Progression Generator.
//
// The previous version was never registered by any page, and its precache list
// named a redirect stub plus three icons that did not exist. cache.addAll() is
// atomic, so a single missing file failed the whole install and offline use
// never worked at all.

const CACHE_NAME = "mpc-chords-v3";

// Everything the app needs to boot with no network. JSZip and WebMidi were
// CDN-loaded and cached opportunistically here for the same reason
// vendor/NOTICE.md gives for vendoring them: a CDN failure could not be
// allowed to fail install, since the app runs without them, but that also
// meant a user whose first visit couldn't reach that CDN got no export
// capability, ever. They are same-origin files now, so they belong in the
// ordinary precache list like everything else.
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./styles.css",
  "./app.js",
  "./modules/audio.js",
  "./modules/constants.js",
  "./modules/generation.js",
  "./modules/guitarChords.js",
  "./modules/i18n.js",
  "./modules/midiExport.js",
  "./modules/mpcNaming.js",
  "./modules/musicTheory.js",
  "./modules/rendering.js",
  "./modules/storage.js",
  "./vendor/jszip.min.js",
  "./vendor/webmidi.iife.js",
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
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    const network = fetch(request).then(response => {
      if (response && response.ok) {
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
