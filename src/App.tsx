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
import { useUIStore } from "./store/ui"
import { decodeBuildPayload } from "./utils/buildShare"
import { startBackgroundMusic } from "./utils/sound"
import "./utils/assetPaths"

function App() {
  const panelVisibility = useMainStore((s) => s.panelVisibility)
  const createNewBuild = useMainStore((s) => s.createNewBuild)
  const resetToDefault = useMainStore((s) => s.resetToDefault)
  const forkCurrentBuild = useMainStore((s) => s.forkCurrentBuild)
  const lightweightMode = useUIStore((s) => s.lightweightMode)

  useEffect(() => {
    const payload = decodeBuildPayload(window.location.search)
    if (payload) {
      useMainStore.getState().loadSharedBuild(payload)
      const url = window.location.origin + window.location.pathname
      window.history.replaceState(null, "", url)
    }
  }, [])

  // Start background music only after first user interaction to avoid autoplay policy warnings
  useEffect(() => {
    const startOnInteraction = () => {
      startBackgroundMusic().catch(() => { })
      document.removeEventListener("click", startOnInteraction)
      document.removeEventListener("keydown", startOnInteraction)
      document.removeEventListener("touchstart", startOnInteraction)
    }
    document.addEventListener("click", startOnInteraction, { once: true })
    document.addEventListener("keydown", startOnInteraction, { once: true })
    document.addEventListener("touchstart", startOnInteraction, { once: true })
    return () => {
      document.removeEventListener("click", startOnInteraction)
      document.removeEventListener("keydown", startOnInteraction)
      document.removeEventListener("touchstart", startOnInteraction)
    }
  }, [])

  return (
    <div className={`w-screen h-screen text-white flex flex-col overflow-hidden select-none relative ${lightweightMode ? "lightweight-mode" : ""}`}>
      <AnimatedBackground />
      <DitherBackground />
      <DitherOverlay />
      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        <Topbar onNew={createNewBuild} onReset={resetToDefault} onFork={forkCurrentBuild} />
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
      <a
        href="https://discord.gg/wpVJJmM6"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-2 right-2 z-50 text-gray-400 hover:text-[#5865F2] transition-colors grayscale hover:grayscale-0"
        aria-label="Join our Discord"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-6"
        >
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      </a>
    </div>
  )
}

export default App
