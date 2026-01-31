import { useState, useMemo, useEffect, useRef } from "react"
import { useMainStore } from "@/store"
import { getUnitIconPath } from "@/utils/assetPaths"
import { getUnitsForFaction, type UnitData } from "./units-utils"
import UnitTooltip from "./UnitTooltip"

interface AnchorPosition {
  x: number
  y: number
}

interface UnitsSelectorProps {
  onClose: () => void
  onSelect: (unitId: string | null) => void
  anchorPosition: AnchorPosition
}

const UnitsSelector = ({
  onClose,
  onSelect,
  anchorPosition,
}: UnitsSelectorProps) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const [hoverTooltip, setHoverTooltip] = useState<{
    unit: UnitData
    anchorRect: { left: number; top: number; width: number; height: number }
  } | null>(null)

  // Close on outside click (allows click to propagate to other elements)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  // Get available units for current faction
  const units = useMemo(() => getUnitsForFaction(selectedFaction), [selectedFaction])

  // Position the popup above the clicked slot
  const popupStyle = useMemo<React.CSSProperties>(
    () => ({
      position: "fixed",
      left: anchorPosition.x,
      bottom: window.innerHeight - anchorPosition.y,
    }),
    [anchorPosition.x, anchorPosition.y]
  )

  return (
    <>
      {/* Modal content */}
      <div
        ref={modalRef}
        className="z-50 bg-zinc-900 border border-zinc-700 flex flex-col"
        style={popupStyle}
      >
        {/* Title */}
        <div className="flex items-center justify-center gap-4 px-4 py-2 border-b border-zinc-700">
          <div className="flex-1 h-px bg-zinc-600" />
          <h2 className="text-sm font-bold tracking-wider text-zinc-200 uppercase">
            Select Unit
          </h2>
          <div className="flex-1 h-px bg-zinc-600" />
        </div>

        {/* Units grid - 5 units in a row */}
        <div className="flex p-3 gap-1">
          {units.map((unit) => (
            <div
              key={unit.id}
              className="w-16 h-16 shrink-0"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                setHoverTooltip({
                  unit,
                  anchorRect: {
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                  },
                })
              }}
              onMouseLeave={() => setHoverTooltip(null)}
            >
              <button
                onClick={() => onSelect(unit.id)}
                className="w-full h-full flex items-center justify-center hover:brightness-125 cursor-pointer"
              >
                <img
                  src={getUnitIconPath(selectedFaction, unit.name)}
                  alt={unit.name}
                  loading="eager"
                  decoding="sync"
                  className="w-16 h-16 object-contain"
                />
              </button>
            </div>
          ))}
        </div>

        {/* Show message if no units available */}
        {units.length === 0 && (
          <div className="px-4 py-2 text-zinc-500 text-sm">
            No units available for this faction
          </div>
        )}
      </div>

      {/* Hover tooltip */}
      {hoverTooltip && (
        <UnitTooltip
          unit={hoverTooltip.unit}
          anchorRect={hoverTooltip.anchorRect}
        />
      )}
    </>
  )
}

export default UnitsSelector
