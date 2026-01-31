import { useUIStore, useMainStore } from "@/store"
import FactionSelector from "@/components/FactionSelector"

interface TopbarProps {
  onCreate: () => void
}

const Topbar = ({ onCreate }: TopbarProps) => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const panelVisibility = useMainStore((s) => s.panelVisibility)
  const toggleMainBase = useMainStore((s) => s.toggleMainBase)
  const toggleArmory = useMainStore((s) => s.toggleArmory)
  const toggleUnits = useMainStore((s) => s.toggleUnits)

  const panelBtnClass = (open: boolean) =>
    `px-3 py-1.5 text-sm font-medium border transition-colors ${open ? "bg-amber-600 border-amber-500 text-white" : "bg-zinc-800 border-zinc-600 text-zinc-200 hover:bg-zinc-700"
    }`

  return (
    <header className="w-full h-10 py-6 shrink-0 flex items-center justify-end gap-2 px-4 bg-zinc-900/80 border-b border-zinc-700 relative">
      <FactionSelector />
      <button
        type="button"
        onClick={onCreate}
        aria-label="Create new build"
        className="px-3 py-1.5 text-sm font-medium  border border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
      >
        Create
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
        onClick={toggleSidebar}
        aria-pressed={sidebarOpen}
        aria-label="Open build list"
        className={panelBtnClass(sidebarOpen)}
      >
        Builds
      </button>
    </header>
  )
}

export default Topbar
