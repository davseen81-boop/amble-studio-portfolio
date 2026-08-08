/*
 * Service worker for DynamiX Daily.
 *
 * The dashboard has to work with no signal — on a plane, in a lift, in a
 * basement meeting room — so the app shell is cached on install and served
 * cache-first. Task data never comes through here; it lives in localStorage
 * and, optionally, the Apps Script bridge (which is always network-only).
 */

const CACHE = "dynamix-daily-v3";

const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "../assets/dynamix-badge.png",
  "../assets/dynamix-favicon.png",
  "../assets/dynamix-icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      // addAll is all-or-nothing; add individually so one 404 can't break install.
      .then(cache => Promise.all(SHELL.map(url => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // The sync bridge and Google's own endpoints must never be served stale.
  if (url.hostname.endsWith("script.google.com") ||
      url.hostname.endsWith("googleusercontent.com") ||
      url.hostname.endsWith("calendar.google.com")) {
    return;
  }

  // Navigations: network first so a deploy is picked up, cache as the fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put("./index.html", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  // Everything else (fonts, icons): cache first, refill in the background.
  event.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && res.status === 200 && (res.type === "basic" || res.type === "cors")) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});

// Tapping a reminder should bring the dashboard forward, not open a second copy.
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes("/dashboard") && "focus" in client) return client.focus();
      }
      return self.clients.openWindow ? self.clients.openWindow("./") : undefined;
    })
  );
});
