/**
 * Service Worker for PWA Offline Support
 * Footnote Game - v1.0.0
 */

const CACHE_NAME = 'footnote-v1';
const STATIC_CACHE_NAME = 'footnote-static-v1';
const DYNAMIC_CACHE_NAME = 'footnote-dynamic-v1';

// 静态资源（构建时生成）
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// 需要缓存的资源类型
const CACHEABLE_TYPES = [
  'image/webp',
  'image/png',
  'image/svg+xml',
  'audio/mpeg',
  'audio/ogg',
  'application/javascript',
  'text/css',
];

// 安装事件
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // 跳过等待，立即激活
  self.skipWaiting();
});

// 激活事件
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('footnote-') && name !== STATIC_CACHE_NAME && name !== DYNAMIC_CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  // 立即控制所有客户端
  self.clients.claim();
});

// 请求拦截
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }
  
  // API请求不缓存
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // 如果缓存命中，返回缓存
      if (cachedResponse) {
        // 后台更新缓存
        fetchAndCache(request);
        return cachedResponse;
      }
      
      // 缓存未命中，从网络获取
      return fetchAndCache(request);
    }).catch(() => {
      // 网络错误，尝试返回离线页面
      if (request.mode === 'navigate') {
        return caches.match('/index.html');
      }
      return new Response('Offline', { status: 503 });
    })
  );
});

/**
 * 获取并缓存资源
 */
async function fetchAndCache(request) {
  try {
    const response = await fetch(request);
    
    // 只缓存成功的响应
    if (response.status !== 200) {
      return response;
    }
    
    // 检查是否应该缓存
    const contentType = response.headers.get('content-type') || '';
    const shouldCache = CACHEABLE_TYPES.some((type) => contentType.includes(type));
    
    if (shouldCache) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    throw error;
  }
}

// 消息处理
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
});

// 后台同步（可选）
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-save') {
    console.log('[SW] Syncing save data...');
    // 可以在这里实现存档同步
  }
});









