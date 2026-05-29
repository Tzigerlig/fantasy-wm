const CACHE = 'fantasy-wm-v2';
const ASSETS = ['/', '/fantasy-wm/', '/fantasy-wm/index.html'];
const ICON = 'https://tzigerlig.github.io/fantasy-wm/icon-192.png';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if(res.ok && e.request.url.startsWith(self.location.origin)){
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match('/fantasy-wm/index.html')))
  );
});

// Handle notification clicks — focus/open the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(list => {
      const existing = list.find(c => c.url.includes('fantasy-wm'));
      if(existing) return existing.focus();
      return clients.openWindow('/fantasy-wm/');
    })
  );
});

// Handle push events (for future VAPID integration)
self.addEventListener('push', e => {
  let data = {title:'Fantasy WM 2026', body:''};
  try { data = e.data?.json() || data; } catch(_) {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: ICON,
      badge: ICON,
      tag: data.tag || 'fantasy-wm',
      renotify: true
    })
  );
});

// Triggered by main thread via postMessage
self.addEventListener('message', e => {
  if(e.data?.type === 'SHOW_NOTIF'){
    self.registration.showNotification(e.data.title, {
      body: e.data.body || '',
      icon: e.data.icon || ICON,
      badge: ICON,
      tag: 'fantasy-wm-' + Date.now()
    });
  }
});
