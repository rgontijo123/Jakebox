// Minimal service worker: exists mainly to satisfy PWA installability
// (Chrome/Android requires a registered service worker with a fetch
// handler) and gives the app shell an offline fallback. All real data
// (songs, auth, credits) always goes to the network -- this app has no
// offline-first ambitions, it's just a thin client over the Jakebox API.
const CACHE_NAME = "jakebox-shell-v1";
const APP_SHELL = ["/", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((cached) => cached ?? caches.match("/"))),
  );
});
