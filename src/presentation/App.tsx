import { Toaster } from 'react-hot-toast'
import { RouterProvider } from 'react-router-dom'
import { AppServicesProvider, type AppServices } from './providers/AppServicesProvider'
import { router } from './router'

export function App({ services }: { services: AppServices }) {
  return (
    <AppServicesProvider services={services}>
      <RouterProvider router={router} />
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </AppServicesProvider>
  )
}
