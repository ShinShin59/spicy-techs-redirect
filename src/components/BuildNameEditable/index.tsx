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
  // Use currentBuildName directly when not editing, local state only when editing
  const [editValue, setEditValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleSubmit = () => {
    const trimmedValue = editValue.trim() || undefined
    setCurrentBuildName(trimmedValue || currentBuildName)
    setEditing(false)
    saveCurrentBuild(trimmedValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit()
    if (e.key === "Escape") {
      setEditing(false)
    }
  }

  const handleStartEditing = () => {
    setEditValue(currentBuildName)
    setEditing(true)
  }

  if (editing) {
    return (
      <label className="flex items-center min-w-0">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          className="bg-zinc-800 text-white border border-zinc-600  px-2 py-1 text-sm min-w-[100px] max-w-[180px] focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Build name"
        />
      </label>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleStartEditing}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleStartEditing()}
      className="flex items-center gap-1.5 group cursor-pointer min-w-0  px-1 py-0.5 -m-0.5 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
      aria-label="Rename build"
    >
      <span className="text-sm text-white truncate max-w-[160px]">{currentBuildName}</span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center shrink-0" aria-hidden>
        <PencilIcon />
      </span>
    </div>
  )
}

export default BuildNameEditable
