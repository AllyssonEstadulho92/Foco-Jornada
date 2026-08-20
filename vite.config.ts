import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Foco & Jornada',
        short_name: 'Foco & Jornada',
        description: 'Jornada, foco e produtividade num único espaço.',
        theme_color: '#0b1018',
        background_color: '#0b1018',
        display: 'standalone',
        start_url: '/',
      },
      workbox: {
        navigateFallback: '/index.html',
      },
    }),
  ],
})
