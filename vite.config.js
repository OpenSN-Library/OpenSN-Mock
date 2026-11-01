import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'

export default defineConfig({
  // 相对路径 + HashRouter：构建产物放到 GitHub Pages 的子路径下也能直接打开
  base: './',
  plugins: [react(), cesium()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3100,
  },
  preview: {
    host: '0.0.0.0',
    port: 3100,
  },
  build: {
    outDir: 'build',
    emptyOutDir: true,
    chunkSizeWarningLimit: 4096,
  },
})
