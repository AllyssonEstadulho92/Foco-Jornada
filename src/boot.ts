const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
let preference: 'system' | 'light' | 'dark' = 'system'

try {
  const persisted = JSON.parse(localStorage.getItem('foco-jornada-ui-v2') || '{}') as {
    state?: { theme?: unknown }
  }
  const storedTheme = persisted.state?.theme
  if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
    preference = storedTheme
  }
} catch {
  // O tema visual não contém dados protegidos e pode usar o valor por defeito.
}

const resolved = preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference
const themeColor = resolved === 'dark' ? '#070a08' : '#f7f8f6'
document.documentElement.dataset.theme = resolved
document.documentElement.style.colorScheme = resolved
document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor)
document
  .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
  ?.setAttribute('content', resolved === 'dark' ? 'black-translucent' : 'default')

window.addEventListener('error', (event) => {
  const detail = document.getElementById('app-boot-detail')
  if (!detail) return
  if (event.target instanceof HTMLScriptElement) {
    detail.textContent = 'Falha ao carregar um módulo da aplicação.'
  } else if (event.message) {
    detail.textContent = 'A aplicação encontrou um erro durante o arranque.'
  }
}, true)

window.setTimeout(() => {
  const fallback = document.getElementById('app-boot-fallback')
  const message = document.getElementById('app-boot-message')
  if (!fallback || !message) return
  fallback.dataset.stalled = 'true'
  message.textContent = 'A aplicação não iniciou. Atualiza a página para tentar novamente.'
}, 8000)
