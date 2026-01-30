import { useUIStore } from "@/store"

interface TopbarProps {
  onCreate: () => void
}

const Topbar = ({ onCreate }: TopbarProps) => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  return (
    <header className="w-full h-10  py-[25px] shrink-0 flex items-center justify-end gap-2 px-4 bg-zinc-900/80 border-b border-zinc-700">
      <button
        type="button"
        onClick={onCreate}
        aria-label="Create new build"
        className="mr-4 px-3 py-1 text-sm font-medium rounded border border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
      >
        create
      </button>
      <button
        type="button"
        onClick={toggleSidebar}
        aria-pressed={sidebarOpen}
        aria-label="Open build list"
        className={`px-3 py-1 text-sm font-medium rounded border transition-colors ${sidebarOpen
          ? "bg-amber-600 border-amber-500 text-white"
          : "bg-zinc-800 border-zinc-600 text-zinc-200 hover:bg-zinc-700"
          }`}
      >
        Builds
      </button>
    </header>
  )
}

export default Topbar
