import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { useMainStore, type FactionLabel } from "@/store"
import { getDevelopmentSpriteStyle } from "@/utils/assetPaths"
import DevelopmentDetailTooltip, {
  type DevelopmentEntry,
  type DevelopmentDomain,
} from "./DevelopmentDetailTooltip"
import OrderBadge from "@/components/OrderBadge"
import PanelCorners from "@/components/PanelCorners"
import developmentsData from "./developments.json"

const NODE_SIZE = 64

const DOMAIN_ORDER: DevelopmentDomain[] = ["economic", "military", "statecraft", "green"]

/** Category color names for borders/backgrounds (match theme: economy, military, statecraft, expansion) */
const DOMAIN_BORDER_CLASS: Record<DevelopmentDomain, string> = {
  economic: "border-economy",
  military: "border-military",
  statecraft: "border-statecraft",
  green: "border-expansion",
}

const DOMAIN_BG_SELECTED_CLASS: Record<DevelopmentDomain, string> = {
  economic: "bg-economy/90",
  military: "bg-military/90",
  statecraft: "bg-statecraft/90",
  green: "bg-expansion/90",
}

const allDevelopments = developmentsData as DevelopmentEntry[]

const idToDev = new Map<string, DevelopmentEntry>(allDevelopments.map((d) => [d.id, d]))

/** Effective prerequisite: own requires, or (if replaces another) the replaced node's requires */
function getEffectiveRequires(d: DevelopmentEntry): string | null {
  if (d.requires) return d.requires
  if (d.replaces) {
    const replaced = idToDev.get(d.replaces)
    return replaced?.requires ?? null
  }
  return null
}

function computeSummary(ids: string[]): { economic: number; military: number; green: number; statecraft: number } {
  const byDomain = { economic: 0, military: 0, green: 0, statecraft: 0 }
  const idToDomain = new Map<string, DevelopmentDomain>()
  allDevelopments.forEach((d) => idToDomain.set(d.id, d.domain))
  ids.forEach((id) => {
    const domain = idToDomain.get(id)
    if (domain && domain in byDomain) byDomain[domain]++
  })
  return byDomain
}

function filterByFaction(devs: DevelopmentEntry[], selectedFaction: FactionLabel): DevelopmentEntry[] {
  const replacedIds = new Set(
    devs.filter((d) => d.replaces && (d.faction as FactionLabel) === selectedFaction).map((d) => d.replaces!)
  )
  return devs.filter(
    (d) =>
      (!d.faction || (d.faction as FactionLabel) === selectedFaction) && !replacedIds.has(d.id)
  )
}

interface DevelopmentsPickerProps {
  open: boolean
  onClose: () => void
}

export default function DevelopmentsPicker({ open, onClose }: DevelopmentsPickerProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const selectedDevelopments = useMainStore((s) => s.selectedDevelopments)
  const setSelectedDevelopments = useMainStore((s) => s.setSelectedDevelopments)
  const reorderDevelopment = useMainStore((s) => s.reorderDevelopment)
  const selectedFaction = useMainStore((s) => s.selectedFaction)

  const [hoverTooltip, setHoverTooltip] = useState<{
    development: DevelopmentEntry
    x: number
    y: number
  } | null>(null)

  const filteredDevelopments = useMemo(
    () => filterByFaction(allDevelopments, selectedFaction),
    [selectedFaction]
  )

  const byDomain = useMemo(() => {
    const map: Record<DevelopmentDomain, DevelopmentEntry[]> = {
      economic: [],
      military: [],
      statecraft: [],
      green: [],
    }
    filteredDevelopments.forEach((d) => {
      if (map[d.domain]) map[d.domain].push(d)
    })
    DOMAIN_ORDER.forEach((domain) => {
      map[domain].sort((a, b) => a.tier - b.tier || a.gridX - b.gridX || a.gridY - b.gridY)
    })
    return map
  }, [filteredDevelopments])

  const selectedSet = useMemo(() => new Set(selectedDevelopments), [selectedDevelopments])

  const getOrderNumber = useCallback(
    (id: string): number | null => {
      const i = selectedDevelopments.indexOf(id)
      return i === -1 ? null : i + 1
    },
    [selectedDevelopments]
  )

  const isAvailable = useCallback(
    (d: DevelopmentEntry): boolean => {
      const req = getEffectiveRequires(d)
      return req == null || selectedSet.has(req)
    },
    [selectedSet]
  )

  const handleNodeClick = useCallback(
    (d: DevelopmentEntry) => {
      const available = isAvailable(d)
      const selected = selectedSet.has(d.id)
      if (!available && !selected) return
      if (selected) {
        const next = selectedDevelopments.filter((id) => id !== d.id)
        setSelectedDevelopments(next, computeSummary(next))
      } else {
        const next = [...selectedDevelopments, d.id]
        setSelectedDevelopments(next, computeSummary(next))
      }
    },
    [selectedSet, selectedDevelopments, setSelectedDevelopments, isAvailable]
  )

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70" aria-hidden />
      <div
        ref={modalRef}
        className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[95vw] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded border border-zinc-700 bg-zinc-900 shadow-2xl"
      >
        <PanelCorners />
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-700 px-4 py-2">
          <h2 className="text-sm font-bold text-zinc-200">Developments</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-zinc-400 hover:bg-zinc-700 hover:text-white"
          >
            Close
          </button>
        </div>
        <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-px overflow-auto bg-zinc-800 p-2">
          {DOMAIN_ORDER.map((domain) => (
            <Quadrant
              key={domain}
              domain={domain}
              developments={byDomain[domain]}
              selectedSet={selectedSet}
              isAvailable={isAvailable}
              getOrderNumber={getOrderNumber}
              onNodeClick={handleNodeClick}
              onReorderIncrement={(id) => reorderDevelopment(id, 1)}
              onReorderDecrement={(id) => reorderDevelopment(id, -1)}
              onHover={setHoverTooltip}
            />
          ))}
        </div>
      </div>
      {hoverTooltip && (
        <DevelopmentDetailTooltip
          development={hoverTooltip.development}
          followCursor={{ x: hoverTooltip.x, y: hoverTooltip.y }}
        />
      )}
    </>
  )
}

interface QuadrantProps {
  domain: DevelopmentDomain
  developments: DevelopmentEntry[]
  selectedSet: Set<string>
  isAvailable: (d: DevelopmentEntry) => boolean
  getOrderNumber: (id: string) => number | null
  onNodeClick: (d: DevelopmentEntry) => void
  onReorderIncrement: (id: string) => void
  onReorderDecrement: (id: string) => void
  onHover: React.Dispatch<React.SetStateAction<{ development: DevelopmentEntry; x: number; y: number } | null>>
}

function Quadrant({
  domain: _domain,
  developments,
  selectedSet,
  isAvailable,
  getOrderNumber,
  onNodeClick,
  onReorderIncrement,
  onReorderDecrement,
  onHover,
}: QuadrantProps) {
  const maxX = useMemo(
    () => (developments.length ? Math.max(...developments.map((d) => d.gridX)) : 0),
    [developments]
  )
  const maxY = useMemo(
    () => (developments.length ? Math.max(...developments.map((d) => d.gridY)) : 0),
    [developments]
  )
  const cols = maxX + 1
  const rows = maxY + 1

  const nodeState = (d: DevelopmentEntry): "locked" | "available" | "selected" => {
    if (selectedSet.has(d.id)) return "selected"
    return isAvailable(d) ? "available" : "locked"
  }

  /** Unselected: light dark bg + category border. Selected: category bg. Locked signified by opacity/cursor only. */
  const getNodeClasses = (d: DevelopmentEntry, state: "locked" | "available" | "selected") => {
    const border = DOMAIN_BORDER_CLASS[d.domain]
    const base = "rounded border-2 p-1 transition-colors flex flex-col items-center justify-start"
    if (state === "selected") {
      return `${base} ${border} ${DOMAIN_BG_SELECTED_CLASS[d.domain]} cursor-pointer text-white`
    }
    const unselectedBg = "bg-black/20"
    const unselected = `${base} ${border} ${unselectedBg} ${state === "locked" ? "opacity-60 cursor-not-allowed" : "hover:bg-black/30 cursor-pointer"}`
    return unselected
  }

  return (
    <div className="relative min-h-[180px] overflow-auto bg-zinc-900/80 p-2">
      <div
        className="grid w-full gap-1"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(${NODE_SIZE}px, 1fr))`,
          gridTemplateRows: `repeat(${rows}, auto)`,
        }}
      >
        {developments.map((d) => {
          const state = nodeState(d)
          const orderNumber = getOrderNumber(d.id)
          const spriteStyle = getDevelopmentSpriteStyle(d.gfx)
          return (
            <div
              key={d.id}
              className={getNodeClasses(d, state)}
              style={{
                gridColumn: d.gridX + 1,
                gridRow: d.gridY + 1,
              }}
              onClick={() => state !== "locked" && onNodeClick(d)}
              onMouseEnter={(e) => {
                onHover({ development: d, x: e.clientX, y: e.clientY })
              }}
              onMouseMove={(e) => {
                onHover((prev) =>
                  prev && prev.development.id === d.id ? { ...prev, x: e.clientX, y: e.clientY } : prev
                )
              }}
              onMouseLeave={() => onHover(null)}
            >
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm">
                {spriteStyle && (
                  <div className="h-full w-full shrink-0" style={spriteStyle} />
                )}
                {orderNumber !== null && (
                  <OrderBadge
                    orderNumber={orderNumber}
                    onIncrement={() => onReorderIncrement(d.id)}
                    onDecrement={() => onReorderDecrement(d.id)}
                  />
                )}
                {state === "selected" && orderNumber === null && (
                  <span className="absolute top-0.5 right-1 text-white">✓</span>
                )}
              </div>
              <span className={`mt-0.5 line-clamp-2 text-center text-[10px] leading-tight ${state === "selected" ? "text-white" : "text-zinc-200"}`}>
                {d.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

