import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // All requests starting with /api go to backend
      '/api': {
        target: 'http://localhost:3001',          // ← your Fastify port
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')   // removes /api prefix
        // or if your backend routes already have /api prefix, remove the rewrite line
      }
    }
  }
})