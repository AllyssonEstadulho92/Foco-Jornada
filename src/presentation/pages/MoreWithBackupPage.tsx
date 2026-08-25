import { AppBackupPanel } from '../components/AppBackupPanel'
import { MorePage } from './MorePage'

export function MoreWithBackupPage() {
  return (
    <>
      <MorePage />
      <section className="reportPage morePage moreToolsPage" aria-label="Cópia de segurança">
        <AppBackupPanel />
      </section>
    </>
  )
}
