// 每次更新網頁有大改動時，更改這個版本號，強制讓瀏覽器更新快取
const CACHE_NAME = 'bp-tracker-v10.2'; // 👈 從 v10.2 改成 v10.2

// 需要被快取的檔案清單
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// 1. 安裝階段 (Install) - 建立快取並把指定的檔案存進去
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('快取已開啟');
        return cache.addAll(urlsToCache);
      })
  );
  // 強制立刻接管控制權
  self.skipWaiting();
});

// 2. 啟動階段 (Activate) - 清除舊版無用的快取檔案
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('清除舊版快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 確保 Service Worker 立即控制所有的客戶端 (Client)
  event.waitUntil(self.clients.claim());
});

// 3. 攔截請求階段 (Fetch) - 優先從網路抓取，如果沒網路才從快取拿 (Network First)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 如果網路請求成功，就更新一下快取，然後回傳結果
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // 如果斷網（fetch 失敗），就嘗試從快取裡找有沒有存過的檔案
        return caches.match(event.request);
      })
  );
});
