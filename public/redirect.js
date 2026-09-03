/* global window */
const base = '/Foco-Jornada/'
const pathname = window.location.pathname
let hash = window.location.hash

if (!hash && pathname.startsWith(base)) {
  let legacyPath = pathname.slice(base.length)
  legacyPath = legacyPath.replace(/^site\/?/, '').replace(/^\/+/, '')
  if (legacyPath) hash = '#/' + legacyPath
}

window.location.replace(base + hash)
