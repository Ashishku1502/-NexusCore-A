import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  root: 'client',
  resolve: {
    alias: {
      // Allow imports like '../../../shared/types.js' to resolve correctly
      shared: resolve(__dirname, 'shared'),
    },
  },
  build: {
    outDir: '../dist',
  }
})
