import { useState, useRef } from "react"
import { useMainStore, useCurrentArmoryState, UNITS_PER_FACTION, GEAR_SLOTS_PER_UNIT } from "../../store"
import { getGearIconPath, getHudImagePath } from "@/utils/assetPaths"
import { playCancelSlotSound, playMenuToggleSound } from "@/utils/sound"
import { usePanelTooltip } from "@/hooks/usePanelTooltip"
import { usePanelHideOnRightClick } from "@/hooks/usePanelHideOnRightClick"
import ArmoryGearSelector from "./ArmoryGearSelector"
import GearAttributesTooltip from "./GearAttributesTooltip"
import PanelCorners from "@/components/PanelCorners"
import { PANEL_BORDER_HOVER_CLASS } from "@/components/shared/panelBorderHover"
import {
  getUnitsForFaction,
  getGearByName,
  type GearItem,
} from "./armory-utils"

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
  const toggleArmory = useMainStore((s) => s.toggleArmory)
  const armoryOpen = useMainStore((s) => s.panelVisibility.armoryOpen)
  const panelRightClickHide = usePanelHideOnRightClick(toggleArmory, armoryOpen)

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
        <h2 className="text-xs font-mono font-bold text-white/70 uppercase m-0 text-left">
          Armory
        </h2>

        {/* Panel (slots only) + unit names to the right, aligned with middle of each gear row */}
        <div className="flex flex-1 min-h-0 gap-2 items-stretch">
          <div
            id="armory-grid"
            className={`relative bg-zinc-900 flex flex-col flex-1 min-h-0 p-4 box-border overflow-y-auto overflow-x-hidden min-w-0 ${PANEL_BORDER_HOVER_CLASS}`}
            {...panelRightClickHide}
          >
            <PanelCorners />
            <div
              className="grid flex-1 min-h-0 gap-1 w-fit"
              style={{
                gridTemplateColumns: "auto auto",
                gridTemplateRows: `repeat(${UNITS_PER_FACTION}, minmax(0, 1fr))`,
              }}
            >
              {units.slice(0, UNITS_PER_FACTION).flatMap((unit, unitIndex) =>
                Array.from({ length: GEAR_SLOTS_PER_UNIT }).map((_, slotIndex) => {
                  const gearName = armoryState[unitIndex]?.[slotIndex]
                  const gearData = gearName ? getGearByName(gearName) : null
                  const hasGear = gearName !== null && gearData !== undefined
                  return (
                    <div
                      key={`${unit.id}-${slotIndex}`}
                      ref={slotIndex === 0 ? (el) => { firstSlotRefs.current[unitIndex] = el } : undefined}
                      role="button"
                      tabIndex={0}
                      className="w-12 h-12 relative cursor-pointer flex items-center justify-center overflow-hidden border border-zinc-700 aspect-square bg-cover bg-center hover:brightness-110"
                      style={{ backgroundImage: `url(${getHudImagePath("slot.webp")})` }}
                      id={`armory-slot-${unitIndex}-${slotIndex}`}
                      data-panel-slot
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
                          decoding="async"
                          className="object-contain w-full h-full"
                        />
                      )}
                    </div>
                  )
                })
              )}
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
          {/* Unit names outside panel, to the right, vertically aligned with middle of each gear row */}
          <div
            className="grid shrink-0 pl-2 min-h-0 self-stretch mt-2"
            style={{ gridTemplateRows: `repeat(${UNITS_PER_FACTION}, 1fr)` }}
          >
            {units.slice(0, UNITS_PER_FACTION).map((unit) => (
              <div
                key={unit.id}
                className="flex items-center text-[10px] font-mono text-white/70 uppercase text-left h-12 whitespace-nowrap"
              >
                {unit.name}
              </div>
            ))}
          </div>
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
