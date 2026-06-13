import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'electron-vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173
  }
})

export const electronConfig = {
  main: {
    build: {
      outDir: 'dist-electron',
      rollupOptions: {
        external: ['electron']
      }
    }
  },
  preload: {
    build: {
      outDir: 'dist-electron'
    }
  }
}
