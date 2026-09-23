import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  server: {
    host: true, // Listen on all network interfaces
    port: 5173, // Default Vite port
    historyApiFallback: true, // SPA: refresh pe same page par rehna
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      '@reduxjs/toolkit', 
      'react-redux',
      'firebase/app',
      'firebase/messaging'
    ],
  },
  build: {
    target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari13'],
    cssTarget: ['es2015', 'safari13'],
    chunkSizeWarningLimit: 1500,
  },
})
