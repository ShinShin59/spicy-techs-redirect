import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: "/spicy-techs/", // GitHub Pages: https://<user>.github.io/spicy-techs/
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: true, // allow tunnel hosts (e.g. localtunnel *.loca.lt)
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
  },
  css: {
    devSourcemap: true,
  },
})
