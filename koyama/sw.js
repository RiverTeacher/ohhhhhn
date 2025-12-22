// sw.js（オンライン専用）
// SW_VERSION を変えるだけで確実に更新される
const SW_VERSION = '2025-12-23-02';

self.addEventListener('install', event => {
  console.log('[SW] install', SW_VERSION);
  // 即時有効化
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] activate', SW_VERSION);
  // すべてのページを即制御
  self.clients.claim();
});

// キャッシュ一切しない（常にネットワーク）
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .catch(() => {
        return new Response(
          'オンライン環境でご利用ください',
          {
            status: 503,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8'
            }
          }
        );
      })
  );
});
