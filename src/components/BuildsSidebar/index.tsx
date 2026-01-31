import { useState, useRef, useEffect, memo } from "react"
import { useMainStore, type SavedBuild, type FactionLabel } from "@/store"
import { getFactionIconPath } from "@/utils/assetPaths"

function getFactionFocusRingClass(faction: FactionLabel): string {
  const ring: Record<FactionLabel, string> = {
    harkonnen: "focus:ring-red-500",
    atreides: "focus:ring-amber-500",
    ecaz: "focus:ring-green-500",
    smuggler: "focus:ring-yellow-500",
    vernius: "focus:ring-blue-500",
    fremen: "focus:ring-orange-500",
    corrino: "focus:ring-purple-500",
  }
  return ring[faction] ?? "focus:ring-amber-500"
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
  onLoad: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
}

const BuildRow = memo(function BuildRow({ build, onLoad, onDuplicate, onDelete, onRename }: BuildRowProps) {
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

  const rowClass = "group flex items-center gap-2 py-2 px-3  border border-transparent text-sm min-h-[2.5rem]"

  const factionIconSrc = getFactionIconPath(build.selectedFaction)

  if (renaming) {
    return (
      <div className={`${rowClass} bg-zinc-800 border-zinc-600`}>
        <img
          key={`${build.id}-faction`}
          src={factionIconSrc}
          alt=""
          className="w-6 h-6  shrink-0 object-cover"
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
          className={`flex-1 min-w-0 h-6 bg-zinc-700 text-white border border-zinc-600  px-2 text-sm focus:outline-none focus:ring-2 focus:ring-inset ${getFactionFocusRingClass(build.selectedFaction)}`}
          aria-label="New name"
        />
      </div>
    )
  }

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
      className={`${rowClass} hover:bg-zinc-800 hover:border-zinc-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset ${getFactionFocusRingClass(build.selectedFaction)}`}
    >
      <img
        key={`${build.id}-faction`}
        src={factionIconSrc}
        alt=""
        className="w-6 h-6  shrink-0 object-cover"
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate text-white">{build.name}</span>
      <button
        type="button"
        data-pencil
        onClick={(e) => {
          e.stopPropagation()
          setRenaming(true)
        }}
        aria-label="Rename"
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 transition-all shrink-0"
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
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 transition-all shrink-0"
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
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 transition-all shrink-0"
      >
        <TrashIcon />
      </button>
    </div>
  )
})

interface BuildsSidebarProps {
  onClose: () => void
}

const BuildsSidebar = ({ onClose }: BuildsSidebarProps) => {
  const savedBuilds = useMainStore((s) => s.savedBuilds)
  const loadBuild = useMainStore((s) => s.loadBuild)
  const duplicateBuild = useMainStore((s) => s.duplicateBuild)
  const deleteBuild = useMainStore((s) => s.deleteBuild)
  const renameBuild = useMainStore((s) => s.renameBuild)

  const sortedSaved = [...savedBuilds].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <aside
      className="fixed top-[calc(2.5rem+4em)] right-3 z-50 w-[280px] max-w-[90vw] max-h-[calc(100vh-2.5rem-4em-1rem)] flex flex-col border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden"
      aria-label="Build list"
    >
      <div className="flex items-center justify-between p-3 border-b border-zinc-700 shrink-0">
        <h2 className="text-sm font-semibold text-zinc-200">Builds</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      <div className="overflow-y-auto p-3 space-y-2 min-h-0">
        {sortedSaved.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4 text-center">No saved builds</p>
        ) : (
          sortedSaved.map((build) => (
            <BuildRow
              key={build.id}
              build={build}
              onLoad={loadBuild}
              onDuplicate={duplicateBuild}
              onDelete={deleteBuild}
              onRename={renameBuild}
            />
          ))
        )}
      </div>
    </aside>
  )
}

export default BuildsSidebar
