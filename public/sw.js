const CACHE_NAME = 'citycare-cache-v2'
const ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith('citycare-cache-') && key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url)
  if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin || requestUrl.pathname.startsWith('/api/')) return

  event.respondWith(
    caches.match(event.request.mode === 'navigate' ? '/index.html' : event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        const isStatic = requestUrl.pathname === '/' || requestUrl.pathname === '/index.html'
          || requestUrl.pathname === '/manifest.webmanifest' || requestUrl.pathname === '/favicon.svg'
          || requestUrl.pathname.startsWith('/assets/')
        if (response.ok && isStatic) {
          void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()))
        }
        return response
      }).catch(() => Response.error())
    }),
  )
})
