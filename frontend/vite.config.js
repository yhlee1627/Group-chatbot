import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  },
  build: {
    outDir: 'dist',
  },
  // 클라이언트 사이드 라우팅 404 에러 해결을 위한 설정
  preview: {
    port: 4173,
    host: true,
    strictPort: false,
  },
  // SPA에서 새로고침 시 404 문제 해결
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
