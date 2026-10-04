const CACHE_NAME = 'citycare-cache-v3'
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
  if (event.request.method !== 'GET'
    || requestUrl.origin !== self.location.origin
    || requestUrl.pathname === '/api'
    || requestUrl.pathname.startsWith('/api/')) return

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      if (event.request.mode === 'navigate') {
        let response
        try {
          response = await fetch(event.request)
        } catch {
          return await cache.match('/index.html') ?? Response.error()
        }
        if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
          try {
            await cache.put('/index.html', response.clone())
          } catch (error) {
            console.warn('CityCare could not update its offline app shell cache.', error)
          }
        }
        return response
      }

      if (requestUrl.pathname.startsWith('/assets/')) {
        const cached = await cache.match(event.request)
        if (cached) return cached
      }

      let response
      try {
        response = await fetch(event.request)
      } catch {
        return await cache.match(event.request) ?? Response.error()
      }
      if (response.ok && (requestUrl.pathname.startsWith('/assets/')
        || requestUrl.pathname === '/manifest.webmanifest'
        || requestUrl.pathname === '/favicon.svg')) {
        try {
          await cache.put(event.request, response.clone())
        } catch (error) {
          console.warn('CityCare could not update its offline asset cache.', error)
        }
      }
      return response
    })(),
  )
})
