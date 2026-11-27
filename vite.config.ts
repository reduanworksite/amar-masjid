import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the site at /amar-masjid/ — assets must use this base.
  base: '/amar-masjid/',
  plugins: [react(), tailwindcss()],
})
