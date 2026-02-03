import { useState, useRef, useEffect, memo } from "react"
import { useMainStore, type SavedBuild, type FactionLabel } from "@/store"
import { getFactionIconPath } from "@/utils/assetPaths"
import { playSelectionSound, playSound } from "@/utils/sound"
import PanelCorners from "@/components/PanelCorners"

function getFactionRingClass(faction: FactionLabel): string {
  const ring: Record<FactionLabel, string> = {
    harkonnen: "ring-faction-harkonnen",
    atreides: "ring-faction-atreides",
    ecaz: "ring-faction-ecaz",
    smuggler: "ring-faction-smuggler",
    vernius: "ring-faction-vernius",
    fremen: "ring-faction-fremen",
    corrino: "ring-faction-corrino",
  }
  return ring[faction] ?? "ring-faction-atreides"
}

function getFactionBorderClass(faction: FactionLabel): string {
  const border: Record<FactionLabel, string> = {
    harkonnen: "border-faction-harkonnen/50",
    atreides: "border-faction-atreides/50",
    ecaz: "border-faction-ecaz/50",
    smuggler: "border-faction-smuggler/50",
    vernius: "border-faction-vernius/50",
    fremen: "border-faction-fremen/50",
    corrino: "border-faction-corrino/50",
  }
  return border[faction] ?? "border-faction-atreides/50"
}

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-70">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
)

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-70">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
)

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-70 hover:opacity-100 hover:text-red-400 transition-all">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </svg>
)

interface BuildRowProps {
  build: SavedBuild
  isSelected: boolean
  onLoad: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
}

const BuildRow = memo(function BuildRow({ build, isSelected, onLoad, onDuplicate, onDelete, onRename }: BuildRowProps) {
  const [renaming, setRenaming] = useState(false)
  const [editValue, setEditValue] = useState(build.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(build.name)
  }, [build.name])

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [renaming])

  const handleRenameSubmit = () => {
    const trimmed = editValue.trim()
    if (trimmed) onRename(build.id, trimmed)
    setRenaming(false)
  }

  const handleRowClick = (e: React.MouseEvent) => {
    if (renaming) return
    const target = e.target as HTMLElement
    if (target.closest("[data-pencil]") || target.closest("[data-copy]") || target.closest("[data-trash]") || target.closest("input")) return
    onLoad(build.id)
  }

  const rowClass = "group relative flex items-center gap-2 py-2 px-3 border text-sm min-h-[2.5rem]"

  const factionIconSrc = getFactionIconPath(build.selectedFaction)

  if (renaming) {
    return (
      <div className={`${rowClass} bg-zinc-800 border-zinc-600`}>
        <img
          key={`${build.id}-faction`}
          src={factionIconSrc}
          alt=""
          className="w-6 h-6 shrink-0 object-cover"
          aria-hidden
        />
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRenameSubmit()
            if (e.key === "Escape") {
              setEditValue(build.name)
              setRenaming(false)
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className={`flex-1 min-w-0 h-6 bg-zinc-700 text-white border border-zinc-600 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-inset ${getFactionRingClass(build.selectedFaction)}`}
          aria-label="New name"
        />
      </div>
    )
  }

  const selectedClass = isSelected
    ? `bg-zinc-800/60 ${getFactionBorderClass(build.selectedFaction)}`
    : "border-transparent hover:bg-zinc-800 hover:border-zinc-600"

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onLoad(build.id)
        }
      }}
      className={`${rowClass} ${selectedClass} cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset ${getFactionRingClass(build.selectedFaction)}`}
    >
      <img
        key={`${build.id}-faction`}
        src={factionIconSrc}
        alt=""
        className="w-6 h-6 shrink-0 object-cover"
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate text-white pr-1">{build.name}</span>
      {/* Action buttons - absolutely positioned on hover with background */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 rounded px-1 py-0.5">
        <button
          type="button"
          data-pencil
          onClick={(e) => {
            e.stopPropagation()
            setRenaming(true)
          }}
          aria-label="Rename"
          className="p-1 hover:bg-zinc-700 rounded transition-colors cursor-pointer"
        >
          <PencilIcon />
        </button>
        <button
          type="button"
          data-copy
          onClick={(e) => {
            e.stopPropagation()
            onDuplicate(build.id)
          }}
          aria-label="Duplicate build"
          className="p-1 hover:bg-zinc-700 rounded transition-colors cursor-pointer"
        >
          <CopyIcon />
        </button>
        <button
          type="button"
          data-trash
          onClick={(e) => {
            e.stopPropagation()
            onDelete(build.id)
          }}
          aria-label="Delete build"
          className="p-1 hover:bg-zinc-700 rounded transition-colors cursor-pointer"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  )
})

const BuildsSidebar = () => {
  const savedBuilds = useMainStore((s) => s.savedBuilds)
  const currentBuildId = useMainStore((s) => s.currentBuildId)
  const loadBuild = useMainStore((s) => s.loadBuild)
  const duplicateBuild = useMainStore((s) => s.duplicateBuild)
  const deleteBuild = useMainStore((s) => s.deleteBuild)
  const renameBuild = useMainStore((s) => s.renameBuild)

  const handleLoadBuild = (id: string) => {
    if (id !== currentBuildId) {
      playSelectionSound()
    }
    loadBuild(id)
  }

  const handleDeleteBuild = (id: string) => {
    const wasCurrent = currentBuildId === id
    const remaining = savedBuilds.filter((b) => b.id !== id)
    const topBuild = remaining[0]
    deleteBuild(id)
    if (wasCurrent && topBuild) {
      loadBuild(topBuild.id)
    }
    playSound("UI_Mainmenu_Button_close.mp3")
  }

  return (
    <div className="shrink-0 w-[280px] self-start flex flex-col min-h-0 max-h-[calc(100vh-2.5rem-4em-1rem)] overflow-y-auto">
      <aside
        className="relative w-full flex flex-col border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden"
        aria-label="Build list"
      >
        <PanelCorners />
        <div className="flex items-center p-3 border-b border-zinc-700 shrink-0">
          <h2 className="text-sm font-semibold text-zinc-200">Builds</h2>
        </div>

        <div className="p-3 space-y-2">
          {savedBuilds.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4 text-center">No saved builds</p>
          ) : (
            savedBuilds.map((build) => (
              <BuildRow
                key={build.id}
                build={build}
                isSelected={build.id === currentBuildId}
                onLoad={handleLoadBuild}
                onDuplicate={duplicateBuild}
                onDelete={handleDeleteBuild}
                onRename={renameBuild}
              />
            ))
          )}
        </div>
      </aside>
    </div>
  )
}

export default BuildsSidebar
