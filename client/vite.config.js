import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime']
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react/jsx-runtime', 
      'framer-motion', 
      'three', 
      '@react-three/fiber', 
      '@react-three/drei'
    ]
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js'
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true
      }
    }
  }
})
