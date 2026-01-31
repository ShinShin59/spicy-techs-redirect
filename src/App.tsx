import { useEffect } from "react"
import MainBase from "./components/MainBase"
import Armory from "./components/Armory"
import Units from "./components/Units"
import Topbar from "./components/Topbar"
import BuildsSidebar from "./components/BuildsSidebar"
import BuildLayout from "./components/BuildLayout"
import { useMainStore, useUIStore } from "./store"
import { decodeBuildPayload } from "./utils/mainBaseShare"
// Import assetPaths to trigger preloading at module load time (before render)
import "./utils/assetPaths"

function App() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const panelVisibility = useMainStore((s) => s.panelVisibility)
  const resetToDefault = useMainStore((s) => s.resetToDefault)

  useEffect(() => {
    const payload = decodeBuildPayload(window.location.search)
    if (payload) {
      useMainStore.getState().loadSharedBuild(payload)
    }
  }, [])

  return (
    <div className="w-screen h-screen bg-black text-white flex flex-col overflow-hidden select-none">
      <Topbar onCreate={() => resetToDefault()} />
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <BuildLayout
          mainBase={panelVisibility.mainBaseOpen ? <MainBase /> : undefined}
          units={panelVisibility.unitsOpen ? <Units /> : undefined}
          armory={panelVisibility.armoryOpen ? <Armory /> : undefined}
        />
      </div>
      {sidebarOpen && <BuildsSidebar onClose={() => setSidebarOpen(false)} />}
    </div>
  )
}

export default App
