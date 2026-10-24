import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  ssr: {
    resolve: {
      conditions: ['module-sync', 'module', 'node'],
    },
    noExternal: ['react-router-dom', 'react-router'],
  },
  server: {
    proxy: {
      '/api': process.env.VITE_API_PROXY_TARGET || 'http://localhost:4000',
    },
  },
})
