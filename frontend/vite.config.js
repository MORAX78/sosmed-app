import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Konfigurasi Vite untuk aplikasi React.
 * Proxy /api ke backend Laravel agar tidak ada masalah CORS saat development.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Setiap request ke /api akan diteruskan ke Laravel backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Proxy untuk akses file storage Laravel
      '/storage': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
