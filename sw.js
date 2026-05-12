const cacheName = 'apok-v2'; // Change le nom à chaque mise à jour majeure
const assets = [
  '/',
  '/manifest.json',
  // Ajoute ici tes fichiers CSS/JS principaux si nécessaire
];

// 1. Installation : Mise en cache initiale
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      console.log('SW: Mise en cache des assets');
      return cache.addAll(assets);
    })
  );
  // Force le nouveau SW à prendre le contrôle immédiatement
  self.skipWaiting();
});

// 2. Activation : Nettoyage des anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== cacheName)
            .map(key => caches.delete(key))
      );
    })
  );
  // Récupère le contrôle des clients sans attendre le rechargement
  return self.clients.claim();
});

// 3. Stratégie : Network First (Réseau d'abord, Cache en secours)
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Si la réponse est valide, on fait une copie dans le cache
        const resClone = res.clone();
        caches.open(cacheName).then(cache => {
          // On ne cache que les requêtes GET valides
          if (e.request.method === 'GET' && res.status === 200) {
            cache.put(e.request, resClone);
          }
        });
        return res;
      })
      .catch(() => caches.match(e.request)) // Si réseau échoue, on prend le cache
  );
});