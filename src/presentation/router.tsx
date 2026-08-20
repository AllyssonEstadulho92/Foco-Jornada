import { createHashRouter } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { ActivitiesPage } from './pages/ActivitiesPage'
import { FocusPage } from './pages/FocusPage'
import { HistoryPage } from './pages/HistoryPage'
import { MorePage } from './pages/MorePage'
import { SettingsPage } from './pages/SettingsPage'
import { StatisticsPage } from './pages/StatisticsPage'
import { TodayPage } from './pages/TodayPage'

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
      { path: 'estatisticas', element: <StatisticsPage /> },
      { path: 'definicoes', element: <SettingsPage /> },
    ],
  },
])
