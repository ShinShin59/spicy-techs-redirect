import { useUIStore, useMainStore } from "@/store"
import FactionSelector from "@/components/FactionSelector"

interface TopbarProps {
  onNew: () => void
  onFork: () => void
}

const Topbar = ({ onNew, onFork }: TopbarProps) => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const panelVisibility = useMainStore((s) => s.panelVisibility)
  const toggleMainBase = useMainStore((s) => s.toggleMainBase)
  const toggleArmory = useMainStore((s) => s.toggleArmory)
  const toggleUnits = useMainStore((s) => s.toggleUnits)
  const toggleCouncillors = useMainStore((s) => s.toggleCouncillors)
  const toggleMetadata = useMainStore((s) => s.toggleMetadata)

  const panelBtnClass = (open: boolean) =>
    `px-3 py-1.5 text-sm font-medium border transition-colors cursor-pointer ${open ? "bg-accent border-accent text-white hover:bg-accent-hover" : "bg-zinc-800 border-zinc-600 text-zinc-200 hover:bg-zinc-700"
    }`

  return (
    <header className="w-full h-10 py-6 shrink-0 flex items-center justify-end gap-2 px-4 bg-slot border-b border-zinc-700 relative">
      <FactionSelector />
      <button
        type="button"
        onClick={onNew}
        aria-label="Create new build"
        className="px-3 py-1.5 text-sm font-medium border border-zinc-600 cursor-pointer bg-expansion text-white hover:bg-expansion/80 transition-colors"
      >
        New
      </button>
      <button
        type="button"
        onClick={onFork}
        aria-label="Fork current build"
        className="px-3 py-1.5 text-sm font-medium border border-accent/70 cursor-pointer bg-accent/50 text-zinc-200 hover:bg-accent/70 transition-colors"
      >
        Fork
      </button>
      <button
        type="button"
        onClick={toggleMainBase}
        aria-pressed={panelVisibility.mainBaseOpen}
        aria-label="Toggle Main Base"
        className={panelBtnClass(panelVisibility.mainBaseOpen)}
      >
        Main Base
      </button>
      <button
        type="button"
        onClick={toggleArmory}
        aria-pressed={panelVisibility.armoryOpen}
        aria-label="Toggle Armory"
        className={panelBtnClass(panelVisibility.armoryOpen)}
      >
        Armory
      </button>
      <button
        type="button"
        onClick={toggleUnits}
        aria-pressed={panelVisibility.unitsOpen}
        aria-label="Toggle Units"
        className={panelBtnClass(panelVisibility.unitsOpen)}
      >
        Units
      </button>
      <button
        type="button"
        onClick={toggleCouncillors}
        aria-pressed={panelVisibility.councillorsOpen}
        aria-label="Toggle Councillors"
        className={panelBtnClass(panelVisibility.councillorsOpen)}
      >
        Councillors
      </button>
      <button
        type="button"
        onClick={toggleSidebar}
        aria-pressed={sidebarOpen}
        aria-label="Open build list"
        className={panelBtnClass(sidebarOpen)}
      >
        Builds
      </button>
      <button
        type="button"
        onClick={toggleMetadata}
        aria-pressed={panelVisibility.metadataOpen}
        aria-label="Toggle Metadata"
        className={panelBtnClass(panelVisibility.metadataOpen)}
      >
        Meta
      </button>
    </header>
  )
}

export default Topbar
