/* global self, URL */
/* Foco Jornada — extensão do service worker para notificações.
 * É importada pelo Workbox. Suporta clique nas notificações atuais e deixa
 * preparada a receção Web Push padrão sem depender do React estar aberto.
 */

function notificationTarget(data) {
  const value = data && typeof data.url === 'string' ? data.url : ''
  try {
    return new URL(value || './', self.registration.scope).href
  } catch {
    return self.registration.scope
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = notificationTarget(event.notification.data)

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    })

    const existing = windows.find((client) => client.url.startsWith(self.registration.scope))
    if (existing) {
      if ('navigate' in existing && existing.url !== targetUrl) {
        try {
          await existing.navigate(targetUrl)
        } catch {
          // Se a navegação não for permitida, focar a janela atual continua útil.
        }
      }
      return existing.focus()
    }

    if (self.clients.openWindow) return self.clients.openWindow(targetUrl)
    return undefined
  })())
})

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = {
      title: 'Foco Jornada',
      body: event.data ? event.data.text() : 'Tens um novo aviso.',
    }
  }

  const title = typeof payload.title === 'string' && payload.title.trim()
    ? payload.title.trim()
    : 'Foco Jornada'
  const body = typeof payload.body === 'string'
    ? payload.body
    : typeof payload.detail === 'string' ? payload.detail : 'Tens um novo aviso.'
  const tag = typeof payload.tag === 'string' && payload.tag.trim()
    ? payload.tag.trim()
    : 'foco-jornada-push'
  const url = typeof payload.url === 'string' ? payload.url : './'

  event.waitUntil(self.registration.showNotification(title, {
    body,
    tag,
    icon: './icon.svg',
    badge: './icon.svg',
    data: {
      ...payload,
      url,
    },
  }))
})
