const CACHE_NAME = 'iron-tracker-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap'
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
        console.error('[SW] Echec installation. Un fichier manque peut-être :', err);
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

  // Stratégie pour les autres ressources (CSS, JS, Images, Fonts) : Cache First, puis Network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((response) => {
        // Mise en cache dynamique des nouvelles ressources valides
        // On ne cache pas les extensions chrome ou autres protocoles non http
        if (!event.request.url.startsWith('http')) return response;
        
        return caches.open(CACHE_NAME).then((cache) => {
             cache.put(event.request, response.clone());
             return response;
        });
      });
    })
  );
});