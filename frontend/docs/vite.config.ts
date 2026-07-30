import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
      'next/link': path.resolve(rootDir, 'src/shims/next-link.tsx'),
      'next/navigation': path.resolve(rootDir, 'src/shims/next-navigation.tsx'),
      'next-themes': path.resolve(rootDir, 'src/shims/next-themes.tsx'),
      '@vercel/analytics/next': path.resolve(rootDir, 'src/shims/vercel-analytics-next.tsx'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
