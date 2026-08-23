import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string }
const buildDate = new Date().toISOString()
const buildId = process.env.GITHUB_SHA?.slice(0, 7) ?? `local-${Date.now().toString(36)}`

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_BUILD_DATE__: JSON.stringify(buildDate),
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
  build: {
    target: 'es2019',
  },
  resolve: {
    alias: {
      'react-hot-toast': '/src/shared/notifications/hotToastBridge.tsx',
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Foco & Jornada',
        short_name: 'Foco & Jornada',
        description: 'Jornada, pausas, atividades, foco e produtividade num único espaço.',
        lang: 'pt-PT',
        theme_color: '#f6f7f5',
        background_color: '#f6f7f5',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
    }),
  ],
})
