// Offline support. Pages always come fresh from the network (never an old cached
// copy that points at files a newer version removed); files fall back to the
// last cached copy when there is no signal.
const CACHE = 'sakahan-v2'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  ),
)

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !request.url.startsWith('http')) return
  const isPage = request.mode === 'navigate'
  event.respondWith(
    fetch(request, isPage ? { cache: 'no-store' } : undefined)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
          return response
        }
        return caches.match(request).then((hit) => hit || response)
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match('./'))),
  )
})
