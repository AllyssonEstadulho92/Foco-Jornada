// O HashRouter utiliza o fragmento do URL para as rotas. Não usar href="#id" para saltar
// para secções internas: isso substituiria a rota atual e produziria um 404.
export function focusSection(id: string): boolean {
  const target = document.getElementById(id)
  if (!target) return false

  target.scrollIntoView?.({ block: 'start' })
  target.focus({ preventScroll: true })
  return true
}
