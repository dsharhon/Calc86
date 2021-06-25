// Configure the cache
const name = 'Calc86-v1'
const wait = 1000
const files = [
  'libs/dos.ttf',
  'libs/math.js',
  'libs/normalize.css',
  'cache.js',
  'favicon.ico',
  'icon_24.png',
  'icon_72.png',
  'icon_96.png',
  'icon_apple_96.png',
  'icon_maskable_196.png',
  'index.css',
  'index.html',
  'index.js',
  'manifest.json',
  'si.png'
]

// Handle installing the service worker
self.addEventListener('install', event => {
  console.log('Installing service worker')
  event.waitUntil(caches.open(name).then(cache => cache.addAll(files)))
})

// Handle fetches from the network, falling back to the cache
self.addEventListener('fetch', event => {

  // Set a timeout for the request to keep from hanging a long time
  const controller = new AbortController()
  setTimeout(() => controller.abort(), wait)

  event.respondWith(fetch(event.request, { signal: controller.signal })
    .then(response => {
      console.log('Fetching from network:', event.request.url)
      return response
    })
    .catch(error => {
      console.warn('Falling back to fetching from cache:', event.request.url)
      return caches.match(event.request)
    })
  )
})
