import { useState } from "react"
import { useMainStore, useCurrentUnitSlots, MAX_UNIT_SLOT_COUNT } from "@/store"
import { getUnitIconPath } from "@/utils/assetPaths"
import { getUnitById, type UnitData } from "./units-utils"
import UnitsSelector from "./UnitsSelector"
import UnitTooltip from "./UnitTooltip"

interface AnchorPosition {
  x: number
  y: number
}

const cellClass =
  "w-[64px] h-[64px] flex items-center justify-center overflow-hidden border border-zinc-700 text-white text-xs font-medium"

const Units = () => {
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const unitSlotCount = useMainStore((s) => s.unitSlotCount)
  const addUnitSlot = useMainStore((s) => s.addUnitSlot)
  const setUnitSlot = useMainStore((s) => s.setUnitSlot)
  const removeUnitSlot = useMainStore((s) => s.removeUnitSlot)
  const unitSlots = useCurrentUnitSlots()

  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null)
  const [anchorPosition, setAnchorPosition] = useState<AnchorPosition | null>(null)
  const [hoverTooltip, setHoverTooltip] = useState<{
    unit: UnitData
    anchorRect: { left: number; top: number; width: number; height: number }
  } | null>(null)

  const handleSlotClick = (e: React.MouseEvent, slotIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setAnchorPosition({ x: rect.left, y: rect.top })
    setSelectedSlotIndex(slotIndex)
  }

  const handleSelectUnit = (unitId: string | null) => {
    if (selectedSlotIndex !== null) {
      setUnitSlot(selectedSlotIndex, unitId)
      setSelectedSlotIndex(null)
      setAnchorPosition(null)

      // Auto-add a new slot if all slots are now filled
      if (unitId !== null && unitSlotCount < MAX_UNIT_SLOT_COUNT) {
        // Count how many empty slots remain after this selection
        let emptyCount = 0
        for (let i = 0; i < unitSlotCount; i++) {
          const slotValue = i === selectedSlotIndex ? unitId : unitSlots[i]
          if (slotValue === null || slotValue === undefined) {
            emptyCount++
          }
        }
        // Only add a new slot if there are no empty slots left
        if (emptyCount === 0) {
          addUnitSlot()
        }
      }
    }
  }

  const handleCloseSelector = () => {
    setSelectedSlotIndex(null)
    setAnchorPosition(null)
  }

  const handleSlotRightClick = (e: React.MouseEvent, slotIndex: number) => {
    e.preventDefault()
    const unitId = unitSlots[slotIndex]
    if (unitId !== null && unitId !== undefined) {
      removeUnitSlot(slotIndex)
      setHoverTooltip(null)
    }
  }

  return (
    <>
      <div className="flex flex-col">
        <h2 className="text-xs font-mono font-bold text-white/70 uppercase m-0 ml-auto">
          Units
        </h2>
        <div
          id="units-grid"
          className="relative bg-zinc-900 border border-zinc-700 w-[432px] gap-4 p-4  box-border overflow-y-auto min-h-0"
        >
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: unitSlotCount }).map((_, index) => {
              const unitId = unitSlots[index]
              const unitData = unitId ? getUnitById(selectedFaction, unitId) : null
              const hasUnit = unitId !== null && unitId !== undefined && unitData !== undefined

              return (
                <div
                  key={`unit-${index}`}
                  role="button"
                  tabIndex={0}
                  className={`${cellClass} cursor-pointer ${hasUnit ? "bg-zinc-700" : "bg-zinc-600 hover:bg-zinc-500"}`}
                  id={`units-slot-${index}`}
                  onClick={(e) => handleSlotClick(e, index)}
                  onContextMenu={(e) => handleSlotRightClick(e, index)}
                  onMouseEnter={
                    hasUnit && unitData
                      ? (e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setHoverTooltip({
                          unit: unitData,
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
                  onMouseLeave={hasUnit ? () => setHoverTooltip(null) : undefined}
                >
                  {hasUnit && unitData && (
                    <img
                      src={getUnitIconPath(selectedFaction, unitData.name)}
                      alt={unitData.name}
                      loading="eager"
                      decoding="sync"
                      className="w-16 h-16 object-contain"
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Unit selector popup */}
          {selectedSlotIndex !== null && anchorPosition && (
            <UnitsSelector
              onClose={handleCloseSelector}
              onSelect={handleSelectUnit}
              anchorPosition={anchorPosition}
            />
          )}
        </div>
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

export default Units
