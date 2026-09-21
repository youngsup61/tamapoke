// sw.js - Service Worker with Galaxy Fit 3 Interactive Notification Support

const CACHE_NAME = 'tamapoke-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/dex.js',
  './js/i18n.js',
  './js/audio.js',
  './js/notification.js',
  './js/pak_loader.js',
  './js/engine.js',
  './js/ui.js',
  './sprites.pak'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching TamaPoke app shell & assets...');
      return cache.addAll(ASSETS_TO_CACHE.filter(url => !url.endsWith('.pak')));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});

// Galaxy Fit 3 Interactive Notification Handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      let replyTitle = '';
      let replyBody = '';

      if (action === 'feed') {
        replyTitle = '🍎 냠냠! 밥을 맛있게 먹었어요!';
        replyBody = '포만감이 올랐습니다 (+25)';
      } else if (action === 'play') {
        replyTitle = '⚽ 와 신난다! 기분이 좋아졌어요!';
        replyBody = '행복도가 올랐습니다 (+15)';
      } else if (action === 'clean') {
        replyTitle = '🫧 깨끗해졌어요!';
        replyBody = '목욕을 마치고 청결도가 100%가 되었습니다';
      } else if (action === 'pet') {
        replyTitle = '💖 하트 뿅뿅!';
        replyBody = '손목을 통해 쓰다듬어 주었습니다 (+5)';
      }

      // Notify open windows to update game state
      for (const client of clientList) {
        client.postMessage({ type: 'FIT3_ACTION', action: action });
      }

      // Send confirmation vibration & notification back to Galaxy Fit 3 wrist
      if (replyTitle) {
        return self.registration.showNotification(replyTitle, {
          body: replyBody,
          icon: 'assets/icon-192.png',
          badge: 'assets/icon-192.png',
          tag: 'tamapoke-feedback',
          renotify: true,
          vibrate: [200, 100, 200]
        });
      }

      // Tap on notification body -> open app
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('./index.html');
    })
  );
});
