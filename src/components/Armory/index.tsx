import { useState, useRef } from "react"
import { useMainStore, useCurrentArmoryState, UNITS_PER_FACTION, GEAR_SLOTS_PER_UNIT } from "../../store"
import { getGearIconPath } from "@/utils/assetPaths"
import { playCancelSlotSound, playMenuToggleSound } from "@/utils/sound"
import { usePanelTooltip } from "@/hooks/usePanelTooltip"
import ArmoryGearSelector from "./ArmoryGearSelector"
import GearAttributesTooltip from "./GearAttributesTooltip"
import PanelCorners from "@/components/PanelCorners"
import { PANEL_BORDER_HOVER_CLASS } from "@/components/shared/panelBorderHover"
import {
  getUnitsForFaction,
  getGearByName,
  getGearOptionsForUnit,
  type GearItem,
  type UnitData,
} from "./armory-utils"

const SLOT_PX = 48
const ICON_PX = 36
const LABEL_HEIGHT_PX = 14
const SLOT_GAP_PX = 8

// Re-export for external use
export { getUnitsForFaction, getGearByName, getGearOptionsForUnit, type GearItem, type UnitData }

interface SelectedSlot {
  unitIndex: number
  slotIndex: number
}

interface AnchorPosition {
  x: number
  y: number
}

const Armory = () => {
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const armoryState = useCurrentArmoryState()
  const setArmorySlot = useMainStore((s) => s.setArmorySlot)

  const units = getUnitsForFaction(selectedFaction)
  const firstSlotRefs = useRef<(HTMLDivElement | null)[]>([])

  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)
  const [anchorPosition, setAnchorPosition] = useState<AnchorPosition | null>(null)
  const [hoverTooltip, setHoverTooltip, showTooltip] = usePanelTooltip<{
    gear: GearItem
    anchorRect: { left: number; top: number; width: number; height: number }
  }>(selectedSlot !== null)

  const handleSlotClick = (
    e: React.MouseEvent,
    unitIndex: number,
    slotIndex: number
  ) => {
    const isSameSlot =
      selectedSlot &&
      selectedSlot.unitIndex === unitIndex &&
      selectedSlot.slotIndex === slotIndex
    if (isSameSlot) {
      playMenuToggleSound(false)
      handleCloseSelector()
      return
    }
    playMenuToggleSound(true)
    // Always anchor selector above the first cell of the block (slot 0), for both cells
    const firstSlotEl = firstSlotRefs.current[unitIndex]
    const rect = (firstSlotEl ?? e.currentTarget).getBoundingClientRect()
    setAnchorPosition({ x: rect.left, y: rect.top })
    setSelectedSlot({ unitIndex, slotIndex })
  }

  const handleSelectGear = (gearName: string | null) => {
    if (selectedSlot) {
      if (gearName !== null) {
        playMenuToggleSound(true)
      }
      setArmorySlot(selectedSlot.unitIndex, selectedSlot.slotIndex, gearName)
      setSelectedSlot(null)
      setAnchorPosition(null)
    }
  }

  const handleCloseSelector = () => {
    setSelectedSlot(null)
    setAnchorPosition(null)
  }

  const handleSlotRightClick = (
    e: React.MouseEvent,
    unitIndex: number,
    slotIndex: number
  ) => {
    e.preventDefault()
    const gearName = armoryState[unitIndex]?.[slotIndex]
    if (gearName !== null) {
      playCancelSlotSound()
      setArmorySlot(unitIndex, slotIndex, null)
      setHoverTooltip(null)
    }
  }

  // Get selected gear names for the selected unit (to disable in selector)
  const getSelectedGearForUnit = (unitIndex: number): string[] => {
    const unitSlots = armoryState[unitIndex] || []
    return unitSlots.filter((g): g is string => g !== null)
  }

  return (
    <>
      <div className="relative group flex flex-col h-full min-h-0">
        {/* Title at top, outside panel, aligned right */}
        <h2 className="text-xs font-mono font-bold text-white/70 uppercase m-0 text-right">
          Armory
        </h2>

        {/* Panel: column of unit blocks (unit name, 2 slots, separator except last) */}
        <div
          id="armory-grid"
          className={`relative bg-zinc-900 flex flex-col flex-1 min-h-0 p-4 box-border overflow-auto ${PANEL_BORDER_HOVER_CLASS}`}
        >
          <PanelCorners />
          <div className="flex flex-col gap-0">
            {units.slice(0, UNITS_PER_FACTION).map((unit, unitIndex) => (
              <div key={unit.id} className="flex flex-col shrink-0 mb-2">
                <div
                  className="text-[10px] font-mono text-white/70 uppercase shrink-0 text-center"
                  style={{ height: LABEL_HEIGHT_PX }}
                >
                  {unit.name}
                </div>
                <div
                  className="flex gap-2 shrink-0"
                  style={{ gap: SLOT_GAP_PX }}
                >
                  {Array.from({ length: GEAR_SLOTS_PER_UNIT }).map((_, slotIndex) => {
                    const gearName = armoryState[unitIndex]?.[slotIndex]
                    const gearData = gearName ? getGearByName(gearName) : null
                    const hasGear = gearName !== null && gearData !== undefined

                    return (
                      <div
                        key={slotIndex}
                        ref={slotIndex === 0 ? (el) => { firstSlotRefs.current[unitIndex] = el } : undefined}
                        role="button"
                        tabIndex={0}
                        className={`relative cursor-pointer flex items-center justify-center overflow-hidden border border-zinc-700 shrink-0 ${hasGear ? "bg-[url('/images/hud/slot.png')] bg-cover bg-center" : "bg-[url('/images/hud/slot.png')] bg-cover bg-center hover:brightness-110"}`}
                        style={{ width: SLOT_PX, height: SLOT_PX }}
                        id={`armory-slot-${unitIndex}-${slotIndex}`}
                        onClick={(e) => handleSlotClick(e, unitIndex, slotIndex)}
                        onContextMenu={(e) =>
                          handleSlotRightClick(e, unitIndex, slotIndex)
                        }
                        onMouseEnter={
                          hasGear && gearData
                            ? (e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setHoverTooltip({
                                gear: gearData,
                                anchorRect: {
                                  left: rect.left,
                                  top: rect.top,
                                  width: rect.width,
                                  height: rect.height,
                                },
                              })
                            }
                            : undefined
                        }
                        onMouseLeave={hasGear ? () => setHoverTooltip(null) : undefined}
                      >
                        {hasGear && gearData && (
                          <img
                            src={getGearIconPath(gearData.image)}
                            alt={gearData.name}
                            loading="eager"
                            decoding="sync"
                            className="object-contain"
                            style={{ width: ICON_PX, height: ICON_PX }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Gear selector popup */}
          {selectedSlot && anchorPosition && (
            <ArmoryGearSelector
              unit={units[selectedSlot.unitIndex]}
              selectedGear={getSelectedGearForUnit(selectedSlot.unitIndex)}
              onClose={handleCloseSelector}
              onSelect={handleSelectGear}
              anchorPosition={anchorPosition}
            />
          )}
        </div>
      </div>

      {/* Hover tooltip (hidden when gear selector is open) */}
      {showTooltip && hoverTooltip && (
        <GearAttributesTooltip
          gear={hoverTooltip.gear}
          anchorRect={hoverTooltip.anchorRect}
        />
      )}
    </>
  )
}

export default Armory
