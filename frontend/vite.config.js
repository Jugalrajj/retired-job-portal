import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy any request starting with /api to the backend server
      '/api': {
        target: ['https://ivjobs.onrender.com'], // CHANGE THIS to your backend port (5000, 4000, 8000 etc.)
        changeOrigin: true,
        secure: false,
      },
    },
  },
})