const CACHE_NAME = 'bp-app-v8.7';
const urlsToCache = [
    './index.html',
    './manifest.json',
    './icon.svg'
];

self.addEventListener('install', event => {
    // 強制立即接管控制權，不需要等待舊版 Service Worker 停止
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // 如果快取名稱與當前版本不符，就刪除舊快取
                    if (cacheName !== CACHE_NAME) {
                        console.log('刪除舊快取:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    // 針對 HTML 網頁請求 (優先透過網路抓取最新版，若無網路才用快取)
    if (event.request.mode === 'navigate' || event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('./index.html');
            })
        );
    } else {
        // 針對其他靜態資源 (優先使用快取，快取沒有才去網路抓)
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request);
            })
        );
    }
});