const CACHE_NAME = 'smalltools-v2';
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

// 2. 激活階段：清理舊版本快取
// 注意：移除 clients.claim()，讓舊分頁繼續由舊 SW 控制直到使用者主動重新整理。
// 這樣可以避免新 SW 接管後，舊分頁因引用舊 hash 的 JS/CSS 而 404 卡住。
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
    // ❌ 移除 clients.claim()
    // 若加上 clients.claim()，新 SW 會立即接管所有舊分頁，
    // 但舊分頁的 HTML 仍引用舊 hash 的 JS/CSS（已從 CDN 刪除），導致 404。
  );
});

// 監聽訊息：支援立刻強制跳過等待 (skipWaiting)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 3. Fetch 攔截策略
self.addEventListener('fetch', (event) => {
  // 只處理 GET 請求與 http/https 協議
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // ✅ Next.js 靜態資產（/_next/static/）永遠走 Network-First
  // 這些檔案每次 build 都有新的 content hash，不應從快取取舊版
  // 只有在完全離線時才 fallback 到快取
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // 完全離線時才使用快取版本（可能是舊版，但總比空白好）
          return caches.match(event.request);
        })
    );
    return;
  }

  // ✅ 其他資源（HTML 頁面、圖片、字型等）採用 Stale-While-Revalidate
  // 優先從快取回傳秒開，並在背景更新快取
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
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

      // 有快取就優先回傳（離線秒開），否則等待網路回傳
      return cachedResponse || fetchPromise;
    })
  );
});
