import { NavLink } from 'react-router-dom'
import '../../styles/route-not-found.css'

/** An unmatched client-side route must never show React Router's developer error screen. */
export function NotFoundPage() {
  return (
    <section className="routeNotFound" aria-labelledby="route-not-found-title">
      <span className="routeNotFoundEyebrow">NAVEGAÇÃO</span>
      <h1 id="route-not-found-title">Não encontrámos esta página</h1>
      <p>O endereço pode estar incompleto ou pertencer a uma versão anterior da aplicação. Os teus registos não são alterados por este erro de navegação.</p>
      <div className="routeNotFoundActions">
        <NavLink to="/ferias">Voltar às férias</NavLink>
        <NavLink to="/">Ir ao início</NavLink>
      </div>
    </section>
  )
}
