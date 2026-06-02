import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Pastikan base diisi sesuai dengan nama repositori GitHub Anda
export default defineConfig({
  plugins: [react()],
  base: '/Dashboard-Nilai/', 
})
