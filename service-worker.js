const CACHE_NAME = 'my-site-v1';
const urlsToCache = [
    '/my-website/',
    '/my-website/index.html',
    '/my-website/style.css',
    '/my-website/script.js',
    '/my-website/icon.svg'
];

// 安装时缓存资源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('缓存已打开');
                return cache.addAll(urlsToCache);
            })
            .catch((err) => {
                console.log('缓存失败:', err);
            })
    );
    self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('删除旧缓存:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 拦截请求，优先从缓存获取
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 缓存命中，直接返回
                if (response) {
                    return response;
                }
                // 缓存未命中，发起网络请求
                return fetch(event.request)
                    .then((response) => {
                        // 检查响应是否有效
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        // 克隆响应（因为响应只能使用一次）
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    })
                    .catch(() => {
                        // 网络请求失败，返回离线页面
                        console.log('网络请求失败，使用离线缓存');
                    });
            })
    );
});
