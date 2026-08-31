import { createHashRouter } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { TodayV2Page } = await import('./pages/TodayV2Page')
          return { Component: TodayV2Page }
        },
      },
      {
        path: 'calendario',
        lazy: async () => {
          const { OperationalCalendarPage } = await import('./pages/OperationalCalendarPage')
          return { Component: OperationalCalendarPage }
        },
      },
      {
        path: 'notificacoes',
        lazy: async () => {
          const { NotificationCenterV2Page } = await import('./pages/NotificationCenterV2Page')
          return { Component: NotificationCenterV2Page }
        },
      },
      {
        path: 'relatorios',
        lazy: async () => {
          const { ReportsV2Page } = await import('./pages/ReportsV2Page')
          return { Component: ReportsV2Page }
        },
      },
      {
        path: 'turnos',
        lazy: async () => {
          const { ShiftMapPage } = await import('./pages/ShiftMapPage')
          return { Component: ShiftMapPage }
        },
      },
      {
        path: 'atividades',
        lazy: async () => {
          const { ActivitiesPage } = await import('./pages/ActivitiesPage')
          return { Component: ActivitiesPage }
        },
      },
      {
        path: 'foco',
        lazy: async () => {
          const { FocusPage } = await import('./pages/FocusPage')
          return { Component: FocusPage }
        },
      },
      {
        path: 'historico',
        lazy: async () => {
          const { HistoryPage } = await import('./pages/HistoryPage')
          return { Component: HistoryPage }
        },
      },
      {
        path: 'mais',
        lazy: async () => {
          const { MoreWithBackupPage } = await import('./pages/MoreWithBackupPage')
          return { Component: MoreWithBackupPage }
        },
      },
      {
        path: 'stock',
        lazy: async () => {
          const { PersonalStockHubPage } = await import('./pages/PersonalStockHubPage')
          return { Component: PersonalStockHubPage }
        },
      },
      {
        path: 'medicamentos',
        lazy: async () => {
          const { MedicationsStockPage } = await import('./pages/MedicationsStockPage')
          return { Component: MedicationsStockPage }
        },
      },
      {
        path: 'sticks',
        lazy: async () => {
          const { SticksStockPage } = await import('./pages/SticksStockPage')
          return { Component: SticksStockPage }
        },
      },
      {
        path: 'guia',
        lazy: async () => {
          const { GuideWithMedicationPage } = await import('./pages/GuideWithMedicationPage')
          return { Component: GuideWithMedicationPage }
        },
      },
      {
        path: 'guia/medicamentos',
        lazy: async () => {
          const { MedicationActionsGuidePage } = await import('./pages/MedicationActionsGuidePage')
          return { Component: MedicationActionsGuidePage }
        },
      },
      {
        path: 'vencimento',
        lazy: async () => {
          const { PayrollReferencePage } = await import('./pages/PayrollReferencePage')
          return { Component: PayrollReferencePage }
        },
      },
      {
        path: 'vencimento/configurar',
        lazy: async () => {
          const { PayrollPage } = await import('./pages/PayrollPage')
          return { Component: PayrollPage }
        },
      },
      {
        path: 'horas',
        lazy: async () => {
          const { WorkHoursCalculatorPage } = await import('./pages/WorkHoursCalculatorPage')
          return { Component: WorkHoursCalculatorPage }
        },
      },
      {
        path: 'estatisticas',
        lazy: async () => {
          const { StatisticsPage } = await import('./pages/StatisticsPage')
          return { Component: StatisticsPage }
        },
      },
      {
        path: 'relatorio',
        lazy: async () => {
          const { ExportDataPage } = await import('./pages/ExportDataPage')
          return { Component: ExportDataPage }
        },
      },
      {
        path: 'exportar',
        lazy: async () => {
          const { ExportDataPage } = await import('./pages/ExportDataPage')
          return { Component: ExportDataPage }
        },
      },
      {
        path: 'definicoes',
        lazy: async () => {
          const { SettingsReferencePage } = await import('./pages/SettingsReferencePage')
          return { Component: SettingsReferencePage }
        },
      },
    ],
  },
])
