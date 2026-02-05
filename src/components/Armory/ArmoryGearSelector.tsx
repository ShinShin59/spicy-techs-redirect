import { useState, useMemo, useEffect, useRef } from "react"
import { getGearIconPath } from "@/utils/assetPaths"
import { getGearOptionsForUnit, type GearItem, type UnitData } from "./armory-utils"
import GearAttributesTooltip from "./GearAttributesTooltip"

interface AnchorPosition {
  x: number
  y: number
}

interface ArmoryGearSelectorProps {
  unit: UnitData
  /** Gear names already selected for this unit (to disable) */
  selectedGear: string[]
  onClose: () => void
  onSelect: (gearName: string | null) => void
  anchorPosition: AnchorPosition
}

const ArmoryGearSelector = ({
  unit,
  selectedGear,
  onClose,
  onSelect,
  anchorPosition,
}: ArmoryGearSelectorProps) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const [hoverTooltip, setHoverTooltip] = useState<{
    gear: GearItem
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

  // Get available gear options for this unit
  const gearOptions = useMemo(() => getGearOptionsForUnit(unit), [unit])

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


        {/* Gear grid - 4 options in a row */}
        <div className="flex p-3 gap-2">
          {gearOptions.map((gear) => {
            const isSelected = selectedGear.includes(gear.name)

            return (
              <div
                key={gear.name}
                className="shrink-0 flex items-center justify-center overflow-hidden"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setHoverTooltip({
                    gear,
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
                  onClick={() => !isSelected && onSelect(gear.name)}
                  disabled={isSelected}
                  className={`
                    w-full h-full border-2 border-zinc-600 flex items-center justify-center
                    bg-slot/50
                    ${isSelected
                      ? "grayscale opacity-50 cursor-not-allowed"
                      : "hover:brightness-125 hover:border-zinc-400 cursor-pointer"
                    }
                  `}
                >
                  <img
                    src={getGearIconPath(gear.image)}
                    alt={gear.name}
                    loading="eager"
                    decoding="async"
                    className="w-10 h-10 object-contain"
                  />
                </button>
              </div>
            )
          })}
        </div>

        {/* Show message if no gear available */}
        {gearOptions.length === 0 && (
          <div className="px-4 py-2 text-zinc-500 text-sm">
            No gear available for this unit
          </div>
        )}
      </div>

      {/* Hover tooltip */}
      {hoverTooltip && (
        <GearAttributesTooltip
          gear={hoverTooltip.gear}
          anchorRect={hoverTooltip.anchorRect}
        />
      )}
    </>
  )
}

export default ArmoryGearSelector
