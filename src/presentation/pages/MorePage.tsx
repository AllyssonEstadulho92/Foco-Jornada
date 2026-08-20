import { Link } from 'react-router-dom'
import { PagePlaceholder } from '../components/PagePlaceholder'

export function MorePage() {
  return (
    <PagePlaceholder
      eyebrow="MAIS"
      title="Mais"
      description="Estatísticas, exportações e acessos secundários serão concentrados nesta área."
    >
      <Link className="settingsLink" to="/definicoes">
        Abrir definições
      </Link>
    </PagePlaceholder>
  )
}
