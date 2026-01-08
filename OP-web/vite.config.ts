import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/hackathon-demo/',  // GitHub Pages 路径
  server: {
    port: 5173,
    strictPort: true,
  },
})
