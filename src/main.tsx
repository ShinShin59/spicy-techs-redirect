import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installDebugTools } from './utils/debugTools'

if (typeof window !== "undefined") {
  installDebugTools()
}

const base = import.meta.env.BASE_URL
document.documentElement.style.setProperty("--cursor-default", `url("${base}images/hud/cursor_default.webp")`)
document.documentElement.style.setProperty("--cursor-pointer", `url("${base}images/hud/cursor_pointer.webp")`)
document.documentElement.style.setProperty("--font-red-alert", `url("${base}font/c_c_red_alert_inet/C&C Red Alert [LAN].woff2")`)
document.documentElement.style.setProperty("--font-dune-rise", `url("${base}font/Dune_Rise/Dune_Rise.ttf")`)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
