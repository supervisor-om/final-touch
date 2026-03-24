const CACHE_NAME = 'final-touch-v2';

// ─── PUSH NOTIFICATIONS ──────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch(e) { data.body = event.data.text(); }
  const opts = {
    body: data.body || 'تم تحديث حالة سيارتك',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [300, 100, 300, 100, 300],
    tag: data.tag || 'car-update',
    renotify: true,
    requireInteraction: true,
    data: { url: data.url || '/track.html' }
  };
  event.waitUntil(
    self.registration.showNotification(data.title || '🚗 اللمسة الأخيرة', opts)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/track.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      for (const c of cs) {
        if (c.url.includes('track') && 'focus' in c) return c.focus();
      }
      return clients.openWindow(url);
    })
  );
});
// ─────────────────────────────────────────────────────────────────────


const STATIC_ASSETS = [
  '/workshop.html',
  '/track.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&family=Tajawal:wght@300;400;500;700;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache local assets reliably; external fonts cached separately with no-cors
      const localAssets = STATIC_ASSETS.filter(url => !url.startsWith('http'));
      const externalAssets = STATIC_ASSETS.filter(url => url.startsWith('http'));

      return cache.addAll(localAssets).then(() => {
        return Promise.allSettled(
          externalAssets.map(url =>
            fetch(url, { mode: 'no-cors' })
              .then(res => cache.put(url, res))
              .catch(() => {})
          )
        );
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for Firebase, cache-first for static assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go network-first for Firebase (real-time data)
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('googleapis.com')
  ) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const cloned = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/workshop.html');
        }
      });
    })
  );
});
