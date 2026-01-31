import { useState } from "react"
import { useMainStore, useCurrentArmoryState, useCurrentArmoryOrder, getArmoryOrderNumber, UNITS_PER_FACTION, GEAR_SLOTS_PER_UNIT, type ArmoryCoords } from "../../store"
import { getGearIconPath } from "@/utils/assetPaths"
import ArmoryGearSelector from "./ArmoryGearSelector"
import GearAttributesTooltip from "./GearAttributesTooltip"
import OrderBadge from "@/components/OrderBadge"
import {
  getUnitsForFaction,
  getGearByName,
  getGearOptionsForUnit,
  type GearItem,
  type UnitData,
} from "./armory-utils"
import { incrementOrder, decrementOrder, armoryIsEqual } from "@/hooks/useItemOrder"

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
  const armoryOrder = useCurrentArmoryOrder()
  const setArmorySlot = useMainStore((s) => s.setArmorySlot)
  const updateArmoryOrder = useMainStore((s) => s.updateArmoryOrder)

  const units = getUnitsForFaction(selectedFaction)

  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)
  const [anchorPosition, setAnchorPosition] = useState<AnchorPosition | null>(null)
  const [hoverTooltip, setHoverTooltip] = useState<{
    gear: GearItem
    anchorRect: { left: number; top: number; width: number; height: number }
  } | null>(null)

  const handleSlotClick = (
    e: React.MouseEvent,
    unitIndex: number,
    slotIndex: number
  ) => {
    // Don't open selector if clicking on the order badge
    const target = e.target as HTMLElement
    if (target.closest("[data-order-badge]")) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    setAnchorPosition({ x: rect.left, y: rect.top })
    setSelectedSlot({ unitIndex, slotIndex })
  }

  const handleSelectGear = (gearName: string | null) => {
    if (selectedSlot) {
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
      <div className="relative group flex flex-col w-full">
        {/* Unit names row - centered */}
        <div className="flex items-end justify-center">
          {units.slice(0, UNITS_PER_FACTION).map((unit, unitIndex) => (
            <div key={unit.id} className="flex items-center">
              {/* Unit name spanning 2 slots (64px * 2 slots + 8px gap) */}
              <div
                className="text-[10px] font-mono text-white/70 text-center uppercase"
                style={{ width: `${64 * GEAR_SLOTS_PER_UNIT + 8}px` }}
              >
                {unit.name}
              </div>
              {/* Separator after each pair (except last) */}
              {unitIndex < UNITS_PER_FACTION - 1 && (
                <div className="w-4 flex justify-center">
                  <div className="h-4 w-px bg-zinc-600" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Grid container */}
        <div
          id="armory-grid"
          className="relative bg-zinc-900 border border-zinc-700 flex items-center justify-center p-4 box-border w-full"
        >
          {units.slice(0, UNITS_PER_FACTION).map((unit, unitIndex) => (
            <div key={unit.id} className="flex items-center">
              {/* Gear slots for this unit */}
              <div className="flex gap-2">
                {Array.from({ length: GEAR_SLOTS_PER_UNIT }).map((_, slotIndex) => {
                  const gearName = armoryState[unitIndex]?.[slotIndex]
                  const gearData = gearName ? getGearByName(gearName) : null
                  const hasGear = gearName !== null && gearData !== undefined
                  const orderNumber = getArmoryOrderNumber(armoryOrder, unitIndex, slotIndex)

                  return (
                    <div
                      key={slotIndex}
                      role="button"
                      tabIndex={0}
                      className={`relative w-[64px] h-[64px] cursor-pointer flex items-center justify-center overflow-hidden border border-zinc-700 ${hasGear ? "bg-zinc-700" : "bg-zinc-600 hover:bg-zinc-500"
                        }`}
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
                          className="w-12 h-12 object-contain"
                        />
                      )}
                      {orderNumber !== null && (
                        <OrderBadge
                          orderNumber={orderNumber}
                          onIncrement={() => {
                            const coords: ArmoryCoords = { unitIndex, slotIndex }
                            updateArmoryOrder(incrementOrder(armoryOrder, coords, armoryIsEqual))
                          }}
                          onDecrement={() => {
                            const coords: ArmoryCoords = { unitIndex, slotIndex }
                            updateArmoryOrder(decrementOrder(armoryOrder, coords, armoryIsEqual))
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
              {/* Separator after each pair (except last) */}
              {unitIndex < UNITS_PER_FACTION - 1 && (
                <div className="w-4 flex justify-center">
                  <div className="h-16 w-px bg-zinc-600" />
                </div>
              )}
            </div>
          ))}

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

        {/* Title at bottom left */}
        <h2 className="text-xs font-mono font-bold text-white/70 uppercase m-0 mt-1">
          Armory
        </h2>
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

export default Armory
