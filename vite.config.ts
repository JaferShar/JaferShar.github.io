import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' = relative Pfade → funktioniert auf deinname.github.io UND deinname.github.io/repo-name
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1600 }, // three.js ist groß, das ist normal
})
