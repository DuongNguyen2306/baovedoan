import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API = 'http://127.0.0.1:5112'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  optimizeDeps: {
    include: ['recharts', 'react', 'react-dom', 'framer-motion', '@microsoft/signalr'],
  },
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: API,
        changeOrigin: true,
        secure: false,
      },
      '/hubs': {
        target: API,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})
