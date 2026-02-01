import { useEffect } from "react"
import AnimatedBackground from "./components/AnimatedBackground"
import DitherBackground from "./components/DitherBackground"
import Topbar from "./components/Topbar"
import BuildLayout from "./components/BuildLayout"
import MainBase from "./components/MainBase"
import Armory from "./components/Armory"
import Units from "./components/Units"
import Councillors from "./components/Councillors"
import BuildsSidebar from "./components/BuildsSidebar"
import Metadata from "./components/Metadata"
import { useMainStore, useUIStore } from "./store"
import { decodeBuildPayload } from "./utils/mainBaseShare"
import "./utils/assetPaths"

function App() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const panelVisibility = useMainStore((s) => s.panelVisibility)
  const createNewBuild = useMainStore((s) => s.createNewBuild)
  const forkCurrentBuild = useMainStore((s) => s.forkCurrentBuild)

  useEffect(() => {
    const payload = decodeBuildPayload(window.location.search)
    if (payload) {
      useMainStore.getState().loadSharedBuild(payload)
    }
  }, [])

  return (
    <div className="w-screen h-screen text-white flex flex-col overflow-hidden select-none relative">
      <AnimatedBackground />
      <DitherBackground />
      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        <Topbar onNew={createNewBuild} onFork={forkCurrentBuild} />
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <BuildLayout
            mainBase={panelVisibility.mainBaseOpen ? <MainBase /> : undefined}
            units={panelVisibility.unitsOpen ? <Units /> : undefined}
            councillors={panelVisibility.councillorsOpen ? <Councillors /> : undefined}
            armory={panelVisibility.armoryOpen ? <Armory /> : undefined}
          />
        </div>
      </div>
      <div className="fixed top-[calc(2.5rem+4em)] right-3 z-50 flex flex-col gap-2 max-h-[calc(100vh-2.5rem-4em-1rem)] overflow-y-auto">
        {sidebarOpen && <BuildsSidebar onClose={() => setSidebarOpen(false)} />}
        {panelVisibility.metadataOpen && <Metadata />}
      </div>
    </div>
  )
}

export default App
