import { useState, useContext, useRef, useEffect, useCallback } from "react"
import { useMainStore, useCurrentUnitSlots, HERO_SLOT_INDEX, MAX_UNIT_CP } from "@/store"
import { getUnitIconPath } from "@/utils/assetPaths"
import { playRandomSound, playCancelSlotSound, BUTTON_SPENDRESOURCES_SOUNDS } from "@/utils/sound"
import { usePanelTooltip } from "@/hooks/usePanelTooltip"
import { getUnitById, getUnitsForFaction, type UnitData } from "./units-utils"
import { getHeroById, getHeroIconPath, isHeroId } from "./heroes-utils"
import UnitsSelector from "./UnitsSelector"
import UnitTooltip from "./UnitTooltip"
import PanelCorners from "@/components/PanelCorners"
import { MainBaseHeightContext } from "@/components/BuildLayout/mainBaseHeightContext"

interface AnchorPosition {
  x: number
  y: number
}

const DEFAULT_SLOT_PX = 64
const MIN_SLOT_PX = 32
const GRID_GAP_PX = 4
const GRID_COLS_DEFAULT = 5
const GRID_PADDING_PX = 32 // p-4 top + bottom
const MAX_PANEL_WIDTH = 432
const AVAILABLE_WIDTH_PX = MAX_PANEL_WIDTH - GRID_PADDING_PX

const Units = () => {
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const unitSlotCount = useMainStore((s) => s.unitSlotCount)
  const addUnitSlot = useMainStore((s) => s.addUnitSlot)
  const setUnitSlot = useMainStore((s) => s.setUnitSlot)
  const removeUnitSlot = useMainStore((s) => s.removeUnitSlot)
  const unitSlots = useCurrentUnitSlots()
  const mainBaseHeight = useContext(MainBaseHeightContext)
  const gridContainerRef = useRef<HTMLDivElement>(null)
  const [slotSizePx, setSlotSizePx] = useState(DEFAULT_SLOT_PX)
  const [gridCols, setGridCols] = useState(GRID_COLS_DEFAULT)

  // Scale slot size and pick column count so slots grow when units are deleted
  const updateSlotSize = useCallback(() => {
    const el = gridContainerRef.current
    if (!el) {
      setSlotSizePx(DEFAULT_SLOT_PX)
      setGridCols(GRID_COLS_DEFAULT)
      return
    }
    if (mainBaseHeight == null || unitSlotCount <= 0) {
      setSlotSizePx(DEFAULT_SLOT_PX)
      setGridCols(GRID_COLS_DEFAULT)
      return
    }
    const availableHeight = el.clientHeight - GRID_PADDING_PX
    if (availableHeight <= 0) {
      setSlotSizePx(DEFAULT_SLOT_PX)
      setGridCols(GRID_COLS_DEFAULT)
      return
    }
    let bestSlot = MIN_SLOT_PX - 1
    let bestCols = GRID_COLS_DEFAULT
    const maxCols = unitSlotCount
    for (let cols = 1; cols <= maxCols; cols++) {
      const rows = Math.ceil(unitSlotCount / cols)
      const heightSlot = (availableHeight - (rows - 1) * GRID_GAP_PX) / rows
      const widthSlot = (AVAILABLE_WIDTH_PX - (cols - 1) * GRID_GAP_PX) / cols
      const slot = Math.min(DEFAULT_SLOT_PX, Math.floor(heightSlot), Math.floor(widthSlot))
      if (slot >= MIN_SLOT_PX && slot > bestSlot) {
        bestSlot = slot
        bestCols = cols
      }
    }
    if (bestSlot < MIN_SLOT_PX) {
      setSlotSizePx(DEFAULT_SLOT_PX)
      setGridCols(GRID_COLS_DEFAULT)
    } else {
      setSlotSizePx(bestSlot)
      setGridCols(bestCols)
    }
  }, [mainBaseHeight, unitSlotCount])

  useEffect(() => {
    const el = gridContainerRef.current
    if (!el) return
    // Recalc immediately and after layout (so slot size grows back when unit count drops)
    updateSlotSize()
    const raf = requestAnimationFrame(() => updateSlotSize())
    const ro = new ResizeObserver(updateSlotSize)
    ro.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [updateSlotSize])

  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null)
  const [anchorPosition, setAnchorPosition] = useState<AnchorPosition | null>(null)
  const [hoverTooltip, setHoverTooltip, showTooltip] = usePanelTooltip<{
    unit: UnitData | { name: string; desc?: string }
    anchorRect: { left: number; top: number; width: number; height: number }
  }>(selectedSlotIndex !== null)

  const handleSlotClick = (e: React.MouseEvent, slotIndex: number) => {
    // Add slot (0) and hero slot (1) can open the selector; other slots cannot
    if (slotIndex !== 0 && slotIndex !== HERO_SLOT_INDEX) return
    if (slotIndex === 0 && addSlotDisabled) return
    const rect = e.currentTarget.getBoundingClientRect()
    setAnchorPosition({ x: rect.left, y: rect.top })
    setSelectedSlotIndex(slotIndex)
  }

  const handleSelectUnit = (unitId: string | null) => {
    if (selectedSlotIndex === null) return
    if (selectedSlotIndex === HERO_SLOT_INDEX) {
      // Hero slot: set hero and close selector (same sound as unit selection)
      if (unitId !== null) playRandomSound(BUTTON_SPENDRESOURCES_SOUNDS)
      setUnitSlot(HERO_SLOT_INDEX, unitId)
      setSelectedSlotIndex(null)
      setAnchorPosition(null)
      return
    }
    if (selectedSlotIndex === 0) {
      // Add slot: assign to first empty unit slot (2..N), or add a new slot if all full (respect 65 CP cap)
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
      // Otherwise keep selector open; user closes it by clicking outside
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

  const slotStyle = { width: slotSizePx, height: slotSizePx, minWidth: slotSizePx, minHeight: slotSizePx }

  return (
    <>
      <div
        className="flex flex-col min-h-0"
        style={mainBaseHeight != null ? { maxHeight: mainBaseHeight } : undefined}
      >
        <div className="flex justify-end items-center gap-1 mb-0 shrink-0">
          <span
            className={`text-xs font-mono ${cpNumberRed ? "font-bold text-(--color-error)" : totalCP === MAX_UNIT_CP ? "font-bold text-white/70" : "text-white/70"}`}
          >
            {totalCP} CP
          </span>
          <h2 className="text-xs font-mono font-bold text-white/70 uppercase m-0">
            Units
          </h2>
        </div>
        <div
          ref={gridContainerRef}
          id="units-grid"
          className="relative bg-zinc-900 border border-zinc-700 flex-1 min-h-0 box-border overflow-hidden p-4"
          style={{
            width: Math.min(MAX_PANEL_WIDTH, gridCols * slotSizePx + (gridCols - 1) * GRID_GAP_PX + GRID_PADDING_PX),
          }}
        >
          <PanelCorners />
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, ${slotSizePx}px)`,
              gap: `${GRID_GAP_PX}px`,
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
                  : "bg-[url('/images/hud/slot_add.png')] bg-cover bg-center hover:bg-[url('/images/hud/slot_add_hover.png')]"
                : isHeroSlot
                  ? "bg-[url('/images/hud/background_hero.png')] bg-cover bg-center"
                  : hasUnit
                    ? "bg-cover bg-center"
                    : "bg-cover bg-center hover:brightness-110"
              const heroSlotMuted = isHeroSlotEmpty ? "opacity-70" : ""
              const canOpenSelector = (isAddSlot && !addSlotDisabled) || isHeroSlot

              return (
                <div
                  key={`unit-${index}`}
                  role={canOpenSelector ? "button" : undefined}
                  tabIndex={canOpenSelector ? 0 : undefined}
                  className={`flex items-center justify-center overflow-hidden text-white text-xs font-medium relative cursor-pointer ${cellStyle} ${heroSlotMuted}`}
                  style={slotStyle}
                  id={`units-slot-${index}`}
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

          {/* Unit selector popup */}
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

      {/* Hover tooltip (hidden when unit selector is open) */}
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
