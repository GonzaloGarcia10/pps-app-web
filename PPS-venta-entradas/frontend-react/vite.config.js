import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Proxy /api → backend FastAPI (puerto 8000) para que las cookies
// de sesión viajen como mismo origen durante el desarrollo.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
