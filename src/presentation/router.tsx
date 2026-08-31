import { createHashRouter } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { ActivitiesPage } from './pages/ActivitiesPage'
import { ExportDataPage } from './pages/ExportDataPage'
import { FocusPage } from './pages/FocusPage'
import { GuideWithMedicationPage } from './pages/GuideWithMedicationPage'
import { HistoryPage } from './pages/HistoryPage'
import { MedicationActionsGuidePage } from './pages/MedicationActionsGuidePage'
import { MedicationsStockPage } from './pages/MedicationsStockPage'
import { MoreWithBackupPage } from './pages/MoreWithBackupPage'
import { NotificationCenterV2Page } from './pages/NotificationCenterV2Page'
import { OperationalCalendarPage } from './pages/OperationalCalendarPage'
import { PayrollPage } from './pages/PayrollPage'
import { PayrollReferencePage } from './pages/PayrollReferencePage'
import { PersonalStockHubPage } from './pages/PersonalStockHubPage'
import { ReportsV2Page } from './pages/ReportsV2Page'
import { SettingsReferencePage } from './pages/SettingsReferencePage'
import { ShiftMapPage } from './pages/ShiftMapPage'
import { StatisticsPage } from './pages/StatisticsPage'
import { SticksStockPage } from './pages/SticksStockPage'
import { TodayReferencePage } from './pages/TodayReferencePage'
import { WorkHoursCalculatorPage } from './pages/WorkHoursCalculatorPage'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <TodayReferencePage /> },
      { path: 'calendario', element: <OperationalCalendarPage /> },
      { path: 'notificacoes', element: <NotificationCenterV2Page /> },
      { path: 'relatorios', element: <ReportsV2Page /> },
      { path: 'turnos', element: <ShiftMapPage /> },
      { path: 'atividades', element: <ActivitiesPage /> },
      { path: 'foco', element: <FocusPage /> },
      { path: 'historico', element: <HistoryPage /> },
      { path: 'mais', element: <MoreWithBackupPage /> },
      { path: 'stock', element: <PersonalStockHubPage /> },
      { path: 'medicamentos', element: <MedicationsStockPage /> },
      { path: 'sticks', element: <SticksStockPage /> },
      { path: 'guia', element: <GuideWithMedicationPage /> },
      { path: 'guia/medicamentos', element: <MedicationActionsGuidePage /> },
      { path: 'vencimento', element: <PayrollReferencePage /> },
      { path: 'vencimento/configurar', element: <PayrollPage /> },
      { path: 'horas', element: <WorkHoursCalculatorPage /> },
      { path: 'estatisticas', element: <StatisticsPage /> },
      { path: 'relatorio', element: <ExportDataPage /> },
      { path: 'exportar', element: <ExportDataPage /> },
      { path: 'definicoes', element: <SettingsReferencePage /> },
    ],
  },
])
