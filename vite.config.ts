import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    target: 'es2019',
  },
  plugins: [react()],
})
