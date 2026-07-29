const CACHE_NAME = 'smalltools-v5';
const PRECACHE_ASSETS = [
  '/support.svg',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/offline.html',
];

// 1. 安裝階段：預快取靜態資源（不快取 HTML 頁面）
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. 激活階段：清理所有舊版本快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
    // ✅ 保留 clients.claim() 以立即接管，配合 Network-First HTML 策略不會出問題
    // 因為 HTML 本身現在也走 Network-First，永遠從伺服器拿最新版本
  );
});

// 監聽訊息：支援手動強制跳過等待 (skipWaiting)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 3. Fetch 攔截策略（Next.js SSG 最佳實踐）
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // ✅ 策略一：HTML 頁面 → Network-First
  // HTML 每次部署後會引用新的 JS/CSS hash，必須永遠從網路取最新版
  // 離線時才 fallback 到快取（可能是舊版，但至少不會白畫面）
  const isNavigation = event.request.mode === 'navigate';
  const isHtml = url.pathname.endsWith('.html') || url.pathname.endsWith('/') || !url.pathname.includes('.');
  if (isNavigation || isHtml) {
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
          // 完全離線時：優先使用該頁面的快取，若無則降級回退至專屬離線頁面或首頁
          return caches.match(event.request).then((cachedResp) => {
            return cachedResp || caches.match('/offline.html') || caches.match('/');
          });
        })
    );
    return;
  }

  // ✅ 策略二：Next.js 靜態資產（/_next/static/）→ Cache-First
  // 這些檔案含 content hash，hash 不變則內容不變，可安全永久快取
  // 新 deploy 會有新 hash，新 HTML 會引用新 hash，不怕舊 hash 污染
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse; // 快取命中，直接回傳
        // 快取未命中（首次存取），從網路取得並存入快取
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // ✅ 策略三：其他資源（圖片、SVG、字型等）→ Stale-While-Revalidate
  // 優先從快取回傳（秒開），並在背景更新快取
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
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
