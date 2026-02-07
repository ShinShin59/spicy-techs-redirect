import { useState, useRef, useEffect } from "react"
import { FACTION_LABELS, useMainStore, type FactionLabel } from "@/store"
import { getFactionIconPath } from "@/utils/assetPaths"
import { playSelectionSound } from "@/utils/sound"

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-400">
    <path d="m6 9 6 6 6-6" />
  </svg>
)

interface FactionSelectorProps {
  compact?: boolean
}

const FactionSelector = ({ compact = false }: FactionSelectorProps) => {
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const switchFaction = useMainStore((s) => s.switchFaction)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const handleSelect = (faction: FactionLabel) => {
    if (faction !== selectedFaction) {
      playSelectionSound()
    }
    switchFaction(faction)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative z-30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select faction"
        className={`flex items-center gap-2 border border-zinc-600 bg-zinc-800 text-topbar-btn hover:bg-zinc-700 transition-colors cursor-pointer bg-no-repeat justify-between ${
          compact
            ? "py-1 pl-7 pr-1.5 text-xs min-w-[85px] bg-[length:1rem_1rem] bg-[position:left_0.25rem_center]"
            : "py-1.5 pl-10 pr-2 text-sm font-medium bg-size-[1.25rem_1.25rem] bg-position-[left_0.70rem_center] min-w-[140px]"
        }`}
        style={{ backgroundImage: `url(${getFactionIconPath(selectedFaction)})` }}
      >
        <span className="capitalize">{selectedFaction}</span>
        <ChevronDown />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full mt-1 min-w-[140px]  border border-zinc-700 bg-zinc-900 py-1 shadow-xl z-150"
          aria-label="Faction list"
        >
          {FACTION_LABELS.map((label) => {
            const faction = label as FactionLabel
            const isSelected = faction === selectedFaction
            return (
              <li key={faction} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => handleSelect(faction)}
                  className={`flex w-full items-center gap-2 py-2 px-3 text-left text-sm capitalize transition-colors cursor-pointer ${isSelected
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                    }`}
                >
                  <img
                    src={getFactionIconPath(faction)}
                    alt=""
                    className="w-5 h-5 shrink-0 object-cover"
                    aria-hidden
                  />
                  {faction}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default FactionSelector
