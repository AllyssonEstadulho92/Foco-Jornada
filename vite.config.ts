import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    target: 'es2019',
  },
  resolve: {
    alias: {
      'react-hot-toast': '/src/shared/notifications/hotToastBridge.tsx',
    },
  },
  plugins: [react()],
})
