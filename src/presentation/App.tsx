import { Toaster } from 'react-hot-toast'
import { RouterProvider } from 'react-router-dom'
import { ScheduledWorkdayAutomation } from './components/ScheduledWorkdayAutomation'
import { AppServicesProvider, type AppServices } from './providers/AppServicesProvider'
import { router } from './router'

export function App({
  services,
  scheduleAutomation = true,
}: {
  services: AppServices
  scheduleAutomation?: boolean
}) {
  return (
    <AppServicesProvider services={services}>
      {scheduleAutomation ? <ScheduledWorkdayAutomation /> : null}
      <RouterProvider router={router} />
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </AppServicesProvider>
  )
}
