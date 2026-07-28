const CACHE_NAME = 'smalltools-v1';
const PRECACHE_ASSETS = [
  '/',
  '/support.svg',
  '/robots.txt',
];

// 1. 安裝階段：預快取核心 shell 資源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. 激活階段：清理舊版本快取的資源，並立即接管控制權
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 監聽訊息：支援立刻強制跳過等待 (skipWaiting)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 3. Fetch 攔截：採用 Stale-While-Revalidate (優先從快取回傳秒開，背景同步更新)
self.addEventListener('fetch', (event) => {
  // 只處理 GET 請求與 http/https 協議
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 在背景向伺服器發送網路請求進行更新
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // 網路失敗/離線時，直接回傳快取
          return cachedResponse;
        });

      // 如果本地有快取就優先回傳（離線秒開），否則等待網絡回傳
      return cachedResponse || fetchPromise;
    })
  );
});
