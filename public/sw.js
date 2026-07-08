const CACHE_NAME = 'howtocook-v3'

// ── Install: wait for natural activation (no skipWaiting) ──────
self.addEventListener('install', () => {
  // Removed skipWaiting() — let browser activate after old tabs close
})

// ── Activate: clean old caches, claim clients ─────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)),
      ),
    ),
  )
  self.clients.claim()
  trimCache()
})

// ── Fetch strategies ───────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  // Skip API calls
  if (url.pathname.startsWith('/api/')) return

  // 1. Navigation (HTML): network-first — always get latest page
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request))
    return
  }

  // 2. Hashed assets (/assets/*): cache-first — filenames change on update
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(event.request))
    return
  }

  // 3. Everything else (images, fonts, data, etc.): stale-while-revalidate
  event.respondWith(staleWhileRevalidate(event.request))
})

// ── Strategies ─────────────────────────────────────────────────

const MAX_CACHE_BYTES = 50 * 1024 * 1024 // 50 MB

async function trimCache() {
  const cache = await caches.open(CACHE_NAME)
  const keys = await cache.keys()
  let totalSize = 0
  const entries = []
  for (const req of keys) {
    const resp = await cache.match(req)
    const size = resp ? parseInt(resp.headers.get('content-length') || '0', 10) : 0
    totalSize += size
    entries.push({ req, size })
  }
  // Remove oldest entries until under limit
  while (totalSize > MAX_CACHE_BYTES && entries.length) {
    const oldest = entries.shift()
    if (oldest) {
      totalSize -= oldest.size
      await cache.delete(oldest.req)
    }
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await cache.match(request)
    return cached || new Response('Offline', { status: 503 })
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('', { status: 408 })
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => cached)

  return cached || fetchPromise
}
