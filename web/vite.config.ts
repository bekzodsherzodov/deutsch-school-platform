import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // dev paytida /api so‘rovlari Node serverga (server.js) yo‘naltiriladi
    proxy: { '/api': 'http://localhost:3000' },
  },
})
