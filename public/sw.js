const CACHE_NAME = "travelgram-v1";

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  "/",
  "/offline/",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/manifest.json",
  "/fallback-content.json",
];

// Install event - precache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache");
        // Use Promise.allSettled instead of Promise.all to handle individual failures
        return Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            fetch(url)
              .then((response) => {
                if (!response.ok) {
                  throw new Error(`Failed to fetch ${url}: ${response.status}`);
                }
                return cache.put(url, response);
              })
              .catch((error) => {
                console.warn(`Failed to cache ${url}:`, error);
                // Continue despite the error
                return null;
              })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip requests to Next.js build manifests
  if (
    event.request.url.includes("_next/app-build-manifest") ||
    event.request.url.includes("workbox-")
  ) {
    return;
  }

  // Special case for Firebase Firestore requests - allow them to fail gracefully
  if (event.request.url.includes("firestore.googleapis.com")) {
    return;
  }

  // Handle HTML navigation requests (e.g., pages)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/offline/") || caches.match("/");
      })
    );
    return;
  }

  // For images, use cache-first strategy
  if (event.request.destination === "image") {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((networkResponse) => {
            // Cache the new image for next time
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // If fetching the image fails, return a placeholder
            return caches.match("/icons/icon-512x512.png");
          });
      })
    );
    return;
  }

  // For CSS/JS, use stale-while-revalidate (return cache, then update)
  if (
    event.request.destination === "script" ||
    event.request.destination === "style" ||
    event.request.url.endsWith(".js") ||
    event.request.url.endsWith(".css")
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Cache the new response
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            console.log("Failed to fetch:", event.request.url);
            // If fetch fails, we still return null
            return null;
          });

        // Return cached response immediately if available, or wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // For everything else, use network-first strategy
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If we got a valid response, cache it
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // If network fails, try the cache
        return caches.match(event.request);
      })
  );
});
