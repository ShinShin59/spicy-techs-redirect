import { useEffect } from "react"
import AnimatedBackground from "./components/AnimatedBackground"
import DitherBackground from "./components/DitherBackground"
import DitherOverlay from "./components/DitherOverlay"
import Topbar from "./components/Topbar"
import BuildLayout from "./components/BuildLayout"
import MainBase from "./components/MainBase"
import Armory from "./components/Armory"
import Units from "./components/Units"
import Councillors from "./components/Councillors"
import Developments from "./components/Developments"
import Operations from "./components/Operations"
import BuildsSidebar from "./components/BuildsSidebar"
import Metadata from "./components/Metadata"
import { useMainStore } from "./store"
import { decodeBuildPayload } from "./utils/mainBaseShare"
import { startBackgroundMusic } from "./utils/sound"
import "./utils/assetPaths"

function App() {
  const panelVisibility = useMainStore((s) => s.panelVisibility)
  const createNewBuild = useMainStore((s) => s.createNewBuild)
  const forkCurrentBuild = useMainStore((s) => s.forkCurrentBuild)

  useEffect(() => {
    const payload = decodeBuildPayload(window.location.search)
    if (payload) {
      useMainStore.getState().loadSharedBuild(payload)
      const url = window.location.origin + window.location.pathname
      window.history.replaceState(null, "", url)
    }
  }, [])

  useEffect(() => {
    startBackgroundMusic().catch(() => {
      const startOnInteraction = () => {
        startBackgroundMusic().catch(() => { })
        document.removeEventListener("click", startOnInteraction)
        document.removeEventListener("keydown", startOnInteraction)
      }
      document.addEventListener("click", startOnInteraction, { once: true })
      document.addEventListener("keydown", startOnInteraction, { once: true })
    })
  }, [])

  return (
    <div className="w-screen h-screen text-white flex flex-col overflow-hidden select-none relative">
      <AnimatedBackground />
      <DitherBackground />
      <DitherOverlay />
      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        <Topbar onNew={createNewBuild} onFork={forkCurrentBuild} />
        <div className="flex flex-1 min-h-0 gap-3 p-3 pt-[2em]">
          <Metadata />
          <div className="flex-1 flex items-start mt-48 justify-center min-h-0 overflow-auto px-4 pb-4">
            <BuildLayout
              mainBase={panelVisibility.mainBaseOpen ? <MainBase /> : undefined}
              units={panelVisibility.unitsOpen ? <Units /> : undefined}
              councillors={panelVisibility.councillorsOpen ? <Councillors /> : undefined}
              developments={panelVisibility.developmentsOpen ? <Developments /> : undefined}
              armory={panelVisibility.armoryOpen ? <Armory /> : undefined}
              operations={panelVisibility.operationsOpen ? <Operations /> : undefined}
            />
          </div>
          <BuildsSidebar />
        </div>
      </div>
    </div>
  )
}

export default App
