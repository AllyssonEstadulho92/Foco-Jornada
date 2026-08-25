import { createHashRouter } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { ActivitiesPage } from './pages/ActivitiesPage'
import { ExportDataPage } from './pages/ExportDataPage'
import { FocusPage } from './pages/FocusPage'
import { GuidePage } from './pages/GuidePage'
import { HistoryPage } from './pages/HistoryPage'
import { MedicationsStockPage } from './pages/MedicationsStockPage'
import { MoreWithBackupPage } from './pages/MoreWithBackupPage'
import { PayrollPage } from './pages/PayrollPage'
import { PayrollReferencePage } from './pages/PayrollReferencePage'
import { PersonalStockHubPage } from './pages/PersonalStockHubPage'
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
      { path: 'turnos', element: <ShiftMapPage /> },
      { path: 'atividades', element: <ActivitiesPage /> },
      { path: 'foco', element: <FocusPage /> },
      { path: 'historico', element: <HistoryPage /> },
      { path: 'mais', element: <MoreWithBackupPage /> },
      { path: 'stock', element: <PersonalStockHubPage /> },
      { path: 'medicamentos', element: <MedicationsStockPage /> },
      { path: 'sticks', element: <SticksStockPage /> },
      { path: 'guia', element: <GuidePage /> },
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
