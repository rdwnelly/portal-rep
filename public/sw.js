/* PORTAL REP — Service Worker
 *
 * Strategi cache:
 *  • Navigasi (halaman HTML) : network-first → cache → /offline.html
 *    (HTML tidak pernah disajikan basi setelah deploy baru, mencegah layar kosong
 *    akibat HTML lama yang merujuk chunk JavaScript yang sudah dihapus).
 *  • /_next/static/*        : cache-first (nama file mengandung hash → tidak berubah).
 *  • Ikon, gambar, manifest  : stale-while-revalidate.
 *  • /api/*, lintas-domain (Firestore, Open-Meteo, dll.) & non-GET : tidak di-cache.
 */
const VERSION = 'v3';
const PRECACHE = `portal-rep-precache-${VERSION}`;
const RUNTIME = `portal-rep-runtime-${VERSION}`;
const OFFLINE_URL = '/offline.html';
const MAX_RUNTIME_ENTRIES = 120;

const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.json',
  '/images/rep-logo.jpg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== PRECACHE && k !== RUNTIME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function networkFirstPage(request) {
  const cache = await caches.open(RUNTIME);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      trimCache(RUNTIME, MAX_RUNTIME_ENTRIES);
    }
    return response;
  } catch {
    return (await cache.match(request)) || (await caches.match(OFFLINE_URL));
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Firestore, Open-Meteo, Google, dll.
  if (url.pathname.startsWith('/api/')) return; // data dinamis & terautentikasi

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
    return;
  }
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (/^\/(icons|images)\//.test(url.pathname) || url.pathname === '/manifest.json') {
    event.respondWith(staleWhileRevalidate(request));
  }
  // Selain itu (mis. data RSC /_next/data, chunk dev) → biarkan ke jaringan.
});

// ---------------------------------------------------------------------------
// Notifikasi push pengumuman (Firebase Cloud Messaging, payload webpush)
// ---------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { notification: { title: 'PORTAL REP', body: event.data ? event.data.text() : '' } };
  }
  const n = payload.notification || {};
  const data = payload.data || {};
  const url = data.url || (payload.fcmOptions && payload.fcmOptions.link) || '/dashboard/notices';

  event.waitUntil(
    self.registration.showNotification(n.title || 'Pengumuman PORTAL REP', {
      body: n.body || '',
      icon: n.icon || '/icons/icon-192x192.png',
      badge: n.badge || '/icons/icon-192x192.png',
      tag: n.tag || data.noticeId || undefined,
      renotify: true,
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || '/dashboard/notices', self.location.origin);
  // Hanya buka halaman milik portal sendiri.
  if (target.origin !== self.location.origin) return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client && new URL(client.url).origin === target.origin) {
          client.navigate(target.href);
          return client.focus();
        }
      }
      return self.clients.openWindow(target.href);
    })
  );
});
