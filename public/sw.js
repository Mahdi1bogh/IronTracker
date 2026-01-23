const CACHE_NAME = 'iron-tracker-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force l'activation immédiate
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Mise en cache des fichiers...');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch((err) => {
        console.error('[SW] Echec installation. Vérifiez que manifest.json est bien dans le dossier /public/ ou dist/ :', err);
      })
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  // Stratégie pour les pages HTML (Navigation) : Network First, puis Cache (pour le offline)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Stratégie pour les autres ressources (CSS, JS, Images) : Cache First, puis Network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((response) => {
        // Mise en cache dynamique des nouvelles ressources
        return caches.open(CACHE_NAME).then((cache) => {
          if (event.request.url.startsWith('http')) {
             cache.put(event.request, response.clone());
          }
          return response;
        });
      });
    })
  );
});
