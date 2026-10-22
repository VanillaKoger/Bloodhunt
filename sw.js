const CACHE = 'bloodhunt-v1'

/** Directory that contains this worker. On GitHub Pages that is /<repo>/. */
function appRoot() {
  return new URL('./', self.location.href)
}

self.addEventListener('install', (event) => {
  const root = appRoot()
  const urls = ['./', './index.html', './manifest.webmanifest'].map((path) => new URL(path, root).href)
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(urls))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  const root = appRoot()
  if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname)) return
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {})
        }
        return res
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match(new URL('index.html', root).href))),
  )
})
