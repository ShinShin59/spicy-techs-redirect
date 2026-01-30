import { useState, useRef, useEffect } from "react"
import { useMainStore } from "@/store"

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-70">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
)

const BuildNameEditable = () => {
  const currentBuildName = useMainStore((s) => s.currentBuildName)
  const setCurrentBuildName = useMainStore((s) => s.setCurrentBuildName)
  const saveCurrentBuild = useMainStore((s) => s.saveCurrentBuild)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentBuildName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setValue(currentBuildName)
  }, [currentBuildName, editing])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleSubmit = () => {
    setCurrentBuildName(value)
    setEditing(false)
    saveCurrentBuild(value.trim() || undefined)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit()
    if (e.key === "Escape") {
      setValue(currentBuildName)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <label className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-medium text-zinc-400 whitespace-nowrap">Build</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          className="bg-zinc-800 text-white border border-zinc-600 rounded px-2 py-1 text-sm min-w-[120px] max-w-[200px] focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Build name"
        />
      </label>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setEditing(true)}
      className="flex items-center gap-1.5 group cursor-pointer min-w-0 rounded px-1 py-0.5 -m-0.5 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-inset"
      aria-label="Rename build"
    >
      <span className="text-sm font-medium text-zinc-400 whitespace-nowrap">Build</span>
      <span className="text-sm text-white truncate max-w-[180px]">{currentBuildName}</span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center" aria-hidden>
        <PencilIcon />
      </span>
    </div>
  )
}

export default BuildNameEditable
