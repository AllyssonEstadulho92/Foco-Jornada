import { createHashRouter } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { ActivitiesPage } from './pages/ActivitiesPage'
import { FocusPage } from './pages/FocusPage'
import { GuidePage } from './pages/GuidePage'
import { HistoryPage } from './pages/HistoryPage'
import { MorePage } from './pages/MorePage'
import { PayrollPage } from './pages/PayrollPage'
import { SettingsReferencePage } from './pages/SettingsReferencePage'
import { ShiftMapPage } from './pages/ShiftMapPage'
import { StatisticsPage } from './pages/StatisticsPage'
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
      { path: 'mais', element: <MorePage /> },
      { path: 'guia', element: <GuidePage /> },
      { path: 'vencimento', element: <PayrollPage /> },
      { path: 'horas', element: <WorkHoursCalculatorPage /> },
      { path: 'estatisticas', element: <StatisticsPage /> },
      { path: 'definicoes', element: <SettingsReferencePage /> },
    ],
  },
])
