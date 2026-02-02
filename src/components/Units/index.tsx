import { useState } from "react"
import { useMainStore, useCurrentUnitSlots, HERO_SLOT_INDEX, MAX_UNIT_CP } from "@/store"
import { getUnitIconPath } from "@/utils/assetPaths"
import { playRandomSound, playCancelSlotSound, BUTTON_SPENDRESOURCES_SOUNDS } from "@/utils/sound"
import { usePanelTooltip } from "@/hooks/usePanelTooltip"
import { getUnitById, getUnitsForFaction, type UnitData } from "./units-utils"
import { getHeroById, getHeroIconPath, isHeroId } from "./heroes-utils"
import UnitsSelector from "./UnitsSelector"
import UnitTooltip from "./UnitTooltip"
import PanelCorners from "@/components/PanelCorners"
import { PANEL_BORDER_HOVER_CLASS } from "@/components/shared/panelBorderHover"
import { usePanelHideOnRightClick } from "@/hooks/usePanelHideOnRightClick"

// Match Armory slot size and gap
const SLOT_PX = 48
const SLOT_GAP_PX = 8
const GRID_COLS = 5
const GRID_PADDING_PX = 32
const PANEL_WIDTH = GRID_COLS * SLOT_PX + (GRID_COLS - 1) * SLOT_GAP_PX + GRID_PADDING_PX
const MIN_GRID_ROWS = 3
const MIN_GRID_HEIGHT_PX = MIN_GRID_ROWS * SLOT_PX + (MIN_GRID_ROWS - 1) * SLOT_GAP_PX

interface AnchorPosition {
  x: number
  y: number
}

const Units = () => {
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const unitSlotCount = useMainStore((s) => s.unitSlotCount)
  const addUnitSlot = useMainStore((s) => s.addUnitSlot)
  const setUnitSlot = useMainStore((s) => s.setUnitSlot)
  const removeUnitSlot = useMainStore((s) => s.removeUnitSlot)
  const unitSlots = useCurrentUnitSlots()
  const toggleUnits = useMainStore((s) => s.toggleUnits)
  const unitsOpen = useMainStore((s) => s.panelVisibility.unitsOpen)
  const panelRightClickHide = usePanelHideOnRightClick(toggleUnits, unitsOpen)

  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null)
  const [anchorPosition, setAnchorPosition] = useState<AnchorPosition | null>(null)
  const [hoverTooltip, setHoverTooltip, showTooltip] = usePanelTooltip<{
    unit: UnitData | { name: string; desc?: string }
    anchorRect: { left: number; top: number; width: number; height: number }
  }>(selectedSlotIndex !== null)

  const handleSlotClick = (e: React.MouseEvent, slotIndex: number) => {
    if (slotIndex !== 0 && slotIndex !== HERO_SLOT_INDEX) return
    if (slotIndex === 0 && addSlotDisabled) return
    const rect = e.currentTarget.getBoundingClientRect()
    setAnchorPosition({ x: rect.left, y: rect.top })
    setSelectedSlotIndex(slotIndex)
  }

  const handleSelectUnit = (unitId: string | null) => {
    if (selectedSlotIndex === null) return
    if (selectedSlotIndex === HERO_SLOT_INDEX) {
      if (unitId !== null) playRandomSound(BUTTON_SPENDRESOURCES_SOUNDS)
      setUnitSlot(HERO_SLOT_INDEX, unitId)
      setSelectedSlotIndex(null)
      setAnchorPosition(null)
      return
    }
    if (selectedSlotIndex === 0) {
      if (unitId !== null) {
        const unitData = getUnitById(selectedFaction, unitId)
        const unitCost = unitData?.cpCost ?? 0
        if (totalCP + unitCost > MAX_UNIT_CP) return
        let placed = false
        for (let k = 2; k < unitSlotCount; k++) {
          if (unitSlots[k] == null) {
            setUnitSlot(k, unitId)
            placed = true
            playRandomSound(BUTTON_SPENDRESOURCES_SOUNDS)
            break
          }
        }
        if (!placed) {
          const newIndex = addUnitSlot()
          if (newIndex !== undefined) {
            setUnitSlot(newIndex, unitId)
            playRandomSound(BUTTON_SPENDRESOURCES_SOUNDS)
          }
        }
        if (totalCP + unitCost === MAX_UNIT_CP) {
          handleCloseSelector()
        }
      }
    }
  }

  const handleCloseSelector = () => {
    setSelectedSlotIndex(null)
    setAnchorPosition(null)
  }

  const totalCP = unitSlots.reduce((sum, unitId) => {
    if (!unitId) return sum
    const unitData = !isHeroId(unitId) ? getUnitById(selectedFaction, unitId) : null
    return sum + (unitData?.cpCost ?? 0)
  }, 0)

  const unitsForFaction = getUnitsForFaction(selectedFaction)
  const minUnitCost = unitsForFaction.length
    ? Math.min(...unitsForFaction.map((u) => u.cpCost ?? Infinity))
    : Infinity
  const addSlotDisabled = totalCP >= MAX_UNIT_CP || totalCP + minUnitCost > MAX_UNIT_CP
  const cpNumberRed = totalCP < MAX_UNIT_CP && totalCP + minUnitCost > MAX_UNIT_CP

  const handleSlotRightClick = (e: React.MouseEvent, slotIndex: number) => {
    e.preventDefault()
    const unitId = unitSlots[slotIndex]
    if (unitId !== null && unitId !== undefined) {
      playCancelSlotSound()
      if (slotIndex === HERO_SLOT_INDEX) {
        setUnitSlot(HERO_SLOT_INDEX, null)
      } else {
        removeUnitSlot(slotIndex)
      }
      setHoverTooltip(null)
    }
  }

  const slotStyle = { width: SLOT_PX, height: SLOT_PX, minWidth: SLOT_PX, minHeight: SLOT_PX }

  return (
    <>
      <div className="flex flex-col shrink-0">
        <div className="flex justify-end items-center gap-1 mb-1 shrink-0">
          <h2 className="text-xs font-mono font-bold text-white/70 uppercase m-0">
            Units
          </h2>
          <span
            className={`text-xs font-mono ${cpNumberRed ? "font-bold text-(--color-error)" : totalCP === MAX_UNIT_CP ? "font-bold text-white/70" : "text-white/70"}`}
          >
            {totalCP} CP
          </span>
        </div>
        <div
          id="units-grid"
          className={`relative bg-zinc-900 box-border overflow-hidden p-4 ${PANEL_BORDER_HOVER_CLASS}`}
          style={{ width: PANEL_WIDTH }}
          {...panelRightClickHide}
        >
          <PanelCorners />
          <div
            className="grid content-start"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLS}, ${SLOT_PX}px)`,
              gap: `${SLOT_GAP_PX}px`,
              minHeight: MIN_GRID_HEIGHT_PX,
            }}
          >
            {Array.from({ length: unitSlotCount }).map((_, index) => {
              const isAddSlot = index === 0
              const unitId = unitSlots[index] ?? null
              const isHeroSlot = index === HERO_SLOT_INDEX
              const heroData = unitId && isHeroId(unitId) ? getHeroById(selectedFaction, unitId) : null
              const unitData = unitId && !isHeroId(unitId) ? getUnitById(selectedFaction, unitId) : null
              const displayData = heroData ?? unitData ?? null
              const hasUnit = unitId !== null && unitId !== undefined && displayData !== null

              const isHeroSlotEmpty = isHeroSlot && !hasUnit
              const addSlotDisabledStyle = isAddSlot && addSlotDisabled
              const cellStyle = isAddSlot
                ? addSlotDisabledStyle
                  ? "bg-[url('/images/hud/slot_add.png')] bg-cover bg-center opacity-70 brightness-[0.5] cursor-not-allowed"
                  : "bg-[url('/images/hud/slot_add.png')] bg-cover bg-center hover:bg-[url('/images/hud/slot_add_hover.png')] cursor-pointer"
                : isHeroSlot
                  ? "bg-[url('/images/hud/background_hero.png')] bg-cover bg-center cursor-pointer"
                  : hasUnit
                    ? "bg-[url('/images/hud/slot.png')] bg-cover bg-center border border-zinc-700 cursor-pointer"
                    : "bg-[url('/images/hud/slot.png')] bg-cover bg-center border border-zinc-700 cursor-pointer hover:brightness-110"
              const heroSlotMuted = isHeroSlotEmpty ? "opacity-70" : ""
              const canOpenSelector = (isAddSlot && !addSlotDisabled) || isHeroSlot

              return (
                <div
                  key={`unit-${index}`}
                  role={canOpenSelector ? "button" : undefined}
                  tabIndex={canOpenSelector ? 0 : undefined}
                  className={`flex items-center justify-center overflow-hidden text-white text-xs font-medium relative ${cellStyle} ${heroSlotMuted}`}
                  style={slotStyle}
                  id={`units-slot-${index}`}
                  data-panel-slot
                  title={isAddSlot ? "Add unit" : isHeroSlotEmpty ? "Hero slot (optional)" : undefined}
                  onClick={(e) => handleSlotClick(e, index)}
                  onContextMenu={(e) => handleSlotRightClick(e, index)}
                  onMouseEnter={
                    hasUnit && displayData
                      ? (e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setHoverTooltip({
                          unit: displayData,
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
                  {!isAddSlot && hasUnit && heroData && (
                    <img
                      src={getHeroIconPath(selectedFaction, heroData.imageName)}
                      alt={heroData.name}
                      loading="eager"
                      decoding="sync"
                      className="w-full h-full object-contain"
                    />
                  )}
                  {!isAddSlot && hasUnit && unitData && (
                    <img
                      src={getUnitIconPath(selectedFaction, unitData.name)}
                      alt={unitData.name}
                      loading="eager"
                      decoding="sync"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              )
            })}
          </div>

          {selectedSlotIndex !== null && anchorPosition && (
            <UnitsSelector
              onClose={handleCloseSelector}
              onSelect={handleSelectUnit}
              anchorPosition={anchorPosition}
              heroOnly={selectedSlotIndex === HERO_SLOT_INDEX}
              remainingCP={selectedSlotIndex === 0 ? MAX_UNIT_CP - totalCP : undefined}
            />
          )}
        </div>
      </div>

      {showTooltip && hoverTooltip && (
        <UnitTooltip
          unit={hoverTooltip.unit}
          anchorRect={hoverTooltip.anchorRect}
        />
      )}
    </>
  )
}

export default Units
