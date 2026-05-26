const CACHE_NAME = 'tablo-v1'
const TEACHER_URLS = [
  '/teacher/dashboard',
  '/teacher/timetable',
]

// Install — cache teacher pages
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(TEACHER_URLS))
  )
  self.skipWaiting()
})

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch — network first, fallback to cache for teacher routes
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  const isTeacherRoute =
    url.pathname.startsWith('/teacher/') || url.pathname.startsWith('/api/teacher')

  if (isTeacherRoute && event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return response
        })
        .catch(() => caches.match(event.request))
    )
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return
  let data = {}
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Tablo', body: event.data.text() }
  }

  const { title = 'Tablo', body = '', icon = '/icon-192.png' } = data

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/icon-72.png',
      data,
    })
  )
})

// Notification click — open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus()
      }
      return clients.openWindow('/teacher/dashboard')
    })
  )
})
