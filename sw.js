// 定義快取名稱與版本號 (當 index.html 有修改時，請更改此版本號以觸發更新)
const CACHE_NAME = 'bp-record-v8.7';

// 需要快取的檔案清單
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// 1. 安裝階段：將指定的檔案存入快取
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] 快取已建立:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
  // 強制立刻進入 activate 階段，不要等待舊版 Service Worker 關閉
  self.skipWaiting();
});

// 2. 啟用階段：清除與目前版本不符的舊快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 讓新的 Service Worker 立刻接管所有的網頁
  self.clients.claim();
});

// 3. 攔截請求階段：快取優先 (Cache First) 策略
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果在快取中找到對應的檔案，就直接回傳快取
        if (response) {
          return response;
        }
        // 如果快取沒有，才透過網路抓取
        return fetch(event.request).catch(() => {
          console.log('[Service Worker] 網路請求失敗且無快取可對應');
        });
      })
  );
});