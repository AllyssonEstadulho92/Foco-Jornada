import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string }
const buildDate = new Date().toISOString()
const buildId = process.env.GITHUB_SHA?.slice(0, 7) ?? `local-${Date.now().toString(36)}`
const githubPagesBase = '/Foco-Jornada/'
const sourceRoot = fileURLToPath(new URL('./src', import.meta.url))
const publicDir = fileURLToPath(new URL('./public', import.meta.url))
const distDir = fileURLToPath(new URL('./dist', import.meta.url))

export default defineConfig({
  root: sourceRoot,
  publicDir,
  base: githubPagesBase,
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_BUILD_DATE__: JSON.stringify(buildDate),
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
  build: {
    target: 'es2019',
    outDir: distDir,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      'react-hot-toast': fileURLToPath(new URL('./src/shared/notifications/hotToastBridge.tsx', import.meta.url)),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'notification-sw.js'],
      manifest: {
        id: githubPagesBase,
        name: 'Foco & Jornada',
        short_name: 'Foco & Jornada',
        description: 'Jornada, pausas, atividades, foco e produtividade num único espaço.',
        lang: 'pt-PT',
        theme_color: '#f6f7f5',
        background_color: '#f6f7f5',
        display: 'standalone',
        start_url: githubPagesBase,
        scope: githubPagesBase,
        icons: [
          {
            src: `${githubPagesBase}icon.svg`,
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        importScripts: ['notification-sw.js'],
        navigateFallbackDenylist: [/^\/Foco-Jornada\//],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,svg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'foco-jornada-navigation-v1',
              networkTimeoutSeconds: 4,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
})
