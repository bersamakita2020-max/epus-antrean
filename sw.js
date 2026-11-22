self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'EPUS Tanjung Puri', body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(deliver(data))
})

async function deliver(data) {
  const title = data.title || 'EPUS Tanjung Puri'
  const options = {
    body: data.body || '',
    icon: data.icon || new URL('icons/icon-192.png', self.registration.scope).href,
    badge: data.badge || new URL('icons/badge-96.png', self.registration.scope).href,
    tag: data.tag || 'epus',
    renotify: true,
    data: { url: data.url || '' },
    vibrate: [180, 80, 180],
  }
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  const visible = windows.some((client) => client.visibilityState === 'visible')
  if (visible && !data.force) {
    windows.forEach((client) => client.postMessage({ type: 'epus-push', notice: data }))
    return
  }
  await self.registration.showNotification(title, options)
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path = String((event.notification.data && event.notification.data.url) || '').replace(/^\//, '')
  const target = new URL(path, self.registration.scope).href
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) {
      if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
        await client.focus()
        if ('navigate' in client) await client.navigate(target)
        return
      }
    }
    await self.clients.openWindow(target)
  })())
})
