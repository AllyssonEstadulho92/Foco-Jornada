import { createHashRouter } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { ActivitiesPage } from './pages/ActivitiesPage'
import { FocusPage } from './pages/FocusPage'
import { GuidePage } from './pages/GuidePage'
import { HistoryPage } from './pages/HistoryPage'
import { MorePage } from './pages/MorePage'
import { PayrollPage } from './pages/PayrollPage'
import { SettingsPage } from './pages/SettingsPage'
import { StatisticsPage } from './pages/StatisticsPage'
import { TodayPage } from './pages/TodayPage'
import { WorkHoursCalculatorPage } from './pages/WorkHoursCalculatorPage'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <TodayPage /> },
      { path: 'atividades', element: <ActivitiesPage /> },
      { path: 'foco', element: <FocusPage /> },
      { path: 'historico', element: <HistoryPage /> },
      { path: 'mais', element: <MorePage /> },
      { path: 'guia', element: <GuidePage /> },
      { path: 'vencimento', element: <PayrollPage /> },
      { path: 'horas', element: <WorkHoursCalculatorPage /> },
      { path: 'estatisticas', element: <StatisticsPage /> },
      { path: 'definicoes', element: <SettingsPage /> },
    ],
  },
])
