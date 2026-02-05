import { useState, useEffect, useRef } from "react"
import { useCurrentMainBaseLayout, useCurrentMainBaseState, useMainStore, useUsedBuildingIds, useCurrentBuildingOrder, useCurrentBuildingDates, getBuildingOrderNumber, buildingDateKey, type BuildingCoords } from "../../store"
import { hasMainBaseVariant, mainBaseVariants } from "@/store/main-base"
import MainBaseBuildingsSelector, { type MainBuilding } from "./MainBaseBuildingsSelector"
import { getBuildingIconPath, getHudImagePath, TIME_ICON_PATH } from "@/utils/assetPaths"
import { playCancelSlotSound, playMenuToggleSound, playMainBaseBuildingSound, playMainBaseSwitchSound } from "@/utils/sound"
import { usePanelTooltip } from "@/hooks/usePanelTooltip"
import { usePanelHideOnRightClick } from "@/hooks/usePanelHideOnRightClick"
import BuildingAttributesTooltip from "./BuildingAttributesTooltip"
import OrderBadge from "@/components/OrderBadge"
import PanelCorners from "@/components/PanelCorners"
import { PANEL_BORDER_HOVER_CLASS } from "@/components/shared/panelBorderHover"
import { incrementOrder, decrementOrder, buildingIsEqual } from "@/hooks/useItemOrder"
import DatePicker from "@/components/DatePicker"
import mainBuildingsData from "./MainBaseBuildingsSelector/main-buildings.json"

const mainBuildings = mainBuildingsData as MainBuilding[]

function getBuildingByName(name: string | null): MainBuilding | undefined {
  if (!name) return undefined
  return mainBuildings.find((b) => b.name === name)
}

function getCategorySlotBgUrl(category: MainBuilding['category']): string {
  switch (category) {
    case 'Economy':
      return getHudImagePath("slot_economic.webp")
    case 'Military':
      return getHudImagePath("slot_military.webp")
    case 'Statecraft':
      return getHudImagePath("slot_statecraft.webp")
  }
}

type SlotType = 'filled' | 'empty_add' | 'empty_disabled'

interface SelectedCell {
  rowIndex: number
  groupIndex: number
  cellIndex: number
}

interface AnchorPosition {
  x: number
  y: number
}

const MainBase = () => {
  const layout = useCurrentMainBaseLayout()
  const mainBaseState = useCurrentMainBaseState()
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const selectedMainBaseIndex = useMainStore((s) => s.selectedMainBaseIndex[s.selectedFaction] ?? 0)
  const setSelectedMainBaseIndex = useMainStore((s) => s.setSelectedMainBaseIndex)
  const setMainBaseCell = useMainStore((state) => state.setMainBaseCell)
  const toggleMainBase = useMainStore((s) => s.toggleMainBase)
  const mainBaseOpen = useMainStore((s) => s.panelVisibility.mainBaseOpen)
  const panelRightClickHide = usePanelHideOnRightClick(toggleMainBase, mainBaseOpen)
  const updateBuildingOrder = useMainStore((state) => state.updateBuildingOrder)
  const usedBuildingIds = useUsedBuildingIds()
  const buildingOrder = useCurrentBuildingOrder()
  const buildingDates = useCurrentBuildingDates()
  const setBuildingDate = useMainStore((s) => s.setBuildingDate)

  const variant = hasMainBaseVariant(selectedFaction) ? mainBaseVariants[selectedFaction] : null

  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null)
  const [datePickerCell, setDatePickerCell] = useState<SelectedCell | null>(null)
  const [datePickerAnchor, setDatePickerAnchor] = useState<AnchorPosition | null>(null)
  const datePickerRef = useRef<HTMLDivElement>(null)
  const [anchorPosition, setAnchorPosition] = useState<AnchorPosition | null>(null)
  const [hoverTooltip, setHoverTooltip, showTooltip] = usePanelTooltip<{
    building: MainBuilding
    anchorRect: { left: number; top: number; width: number; height: number }
  }>(selectedCell !== null)

  const handleCellClick = (e: React.MouseEvent, rowIndex: number, groupIndex: number, cellIndex: number) => {
    // Don't open selector if clicking on the order badge or date picker trigger
    const target = e.target as HTMLElement
    if (target.closest("[data-order-badge]") || target.closest("[data-date-picker-trigger]")) return

    const buildingName = mainBaseState[rowIndex]?.[groupIndex]?.[cellIndex]
    const buildingData = getBuildingByName(buildingName)
    const hasBuilding = buildingName !== null && buildingData !== undefined
    const rawGroup = mainBaseState[rowIndex]?.[groupIndex]
    const groupState = Array.isArray(rawGroup) ? rawGroup : []
    const emptyCount = groupState.filter((v) => v === null).length
    const firstEmptyIndex = groupState.findIndex((v) => v === null)
    const slotTypeForCell: SlotType =
      hasBuilding && buildingData
        ? "filled"
        : emptyCount >= 2 && cellIndex !== firstEmptyIndex
          ? "empty_disabled"
          : "empty_add"

    // Empty slot only: toggle building selector (second click on same slot closes it)
    const isSameCell =
      selectedCell &&
      selectedCell.rowIndex === rowIndex &&
      selectedCell.groupIndex === groupIndex &&
      selectedCell.cellIndex === cellIndex
    if (slotTypeForCell === "empty_add" && isSameCell) {
      handleCloseSelector()
      return
    }

    if (slotTypeForCell === "empty_add") {
      playMenuToggleSound(true)
    }

    const rect = e.currentTarget.getBoundingClientRect()
    setAnchorPosition({ x: rect.left, y: rect.top })
    setSelectedCell({ rowIndex, groupIndex, cellIndex })
  }

  const handleSelectBuilding = (buildingId: string | null) => {
    if (selectedCell) {
      if (buildingId !== null) {
        playMainBaseBuildingSound()
      }
      setMainBaseCell(selectedCell.rowIndex, selectedCell.groupIndex, selectedCell.cellIndex, buildingId)
      setSelectedCell(null)
      setAnchorPosition(null)
    }
  }

  const handleCloseSelector = () => {
    setSelectedCell(null)
    setAnchorPosition(null)
  }

  // Close DatePicker on outside click
  useEffect(() => {
    if (!datePickerCell) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest("[data-date-picker-trigger]")
      ) {
        setDatePickerCell(null)
        setDatePickerAnchor(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [datePickerCell])

  const handleCellRightClick = (e: React.MouseEvent, rowIndex: number, groupIndex: number, cellIndex: number) => {
    e.preventDefault()
    const buildingName = mainBaseState[rowIndex]?.[groupIndex]?.[cellIndex]
    if (buildingName !== null) {
      playCancelSlotSound()
      setMainBaseCell(rowIndex, groupIndex, cellIndex, null)
      setHoverTooltip(null)
    }
  }

  return (
    <>
      <div className="relative group flex flex-col w-full">
        {variant ? (
          <h2 className="text-xs font-mono font-bold text-white/70 uppercase m-0 ml-auto flex items-center justify-end gap-1.5" role="group" aria-label="Main base view">
            <button
              type="button"
              className={`uppercase bg-transparent border-none cursor-pointer p-0 font-inherit ${selectedMainBaseIndex === 0 ? "text-white" : "text-white/70 hover:text-white/85"}`}
              onClick={() => {
                playMainBaseSwitchSound()
                setSelectedMainBaseIndex(0)
              }}
              aria-pressed={selectedMainBaseIndex === 0}
              aria-label={variant.leftLabel}
            >
              {variant.leftLabel}
            </button>
            <span className="text-white/50 select-none" aria-hidden>|</span>
            <button
              type="button"
              className={`uppercase bg-transparent border-none cursor-pointer p-0 font-inherit ${selectedMainBaseIndex === 1 ? "text-white" : "text-white/70 hover:text-white/85"}`}
              onClick={() => {
                playMainBaseSwitchSound()
                setSelectedMainBaseIndex(1)
              }}
              aria-pressed={selectedMainBaseIndex === 1}
              aria-label={variant.rightLabel}
            >
              {variant.rightLabel}
            </button>
          </h2>
        ) : (
          <h2 className="text-xs font-mono font-bold text-white/70 uppercase m-0 ml-auto">
            Main Base
          </h2>
        )}
        <div
          id="main-base-grid"
          className={`relative w-full p-4 box-border bg-zinc-900 bg-repeat bg-center ${PANEL_BORDER_HOVER_CLASS}`}
          style={{ backgroundImage: `url(${getHudImagePath("mb_bg_pattern.webp")})` }}
          {...panelRightClickHide}
        >
          <PanelCorners />
          <div className="relative flex flex-col justify-center items-center gap-12">
            {layout.map((row, rowIndex) => (
              <div key={rowIndex} className="flex" id={`main-base-row-${rowIndex}`}>
                {row.map((building, groupIndex) => (
                  <div
                    key={groupIndex}
                    className="flex mx-4"
                    id={`main-base-building-block-${groupIndex}`}
                  >
                    {Array.from({ length: building }).map((_, cellIndex) => {
                      const buildingName = mainBaseState[rowIndex]?.[groupIndex]?.[cellIndex]
                      const buildingData = getBuildingByName(buildingName)
                      const hasBuilding = buildingName !== null && buildingData !== undefined
                      const orderNumber = getBuildingOrderNumber(buildingOrder, rowIndex, groupIndex, cellIndex)

                      const rawGroup = mainBaseState[rowIndex]?.[groupIndex]
                      const groupState = Array.isArray(rawGroup) ? rawGroup : []
                      const emptyCount = groupState.filter((v) => v === null).length
                      const firstEmptyIndex = groupState.findIndex((v) => v === null)

                      const slotType: SlotType = hasBuilding && buildingData
                        ? 'filled'
                        : emptyCount >= 2 && cellIndex !== firstEmptyIndex
                          ? 'empty_disabled'
                          : 'empty_add'

                      const cellBgUrl =
                        slotType === 'filled' && buildingData
                          ? getCategorySlotBgUrl(buildingData.category)
                          : slotType === 'empty_add'
                            ? getHudImagePath("slot_add.webp")
                            : getHudImagePath("slot_disabled.webp")
                      const cellBgHoverUrl =
                        slotType === 'empty_add' ? getHudImagePath("slot_add_hover.webp") : null

                      const isDisabled = slotType === 'empty_disabled'

                      return (
                        <div
                          key={cellIndex}
                          role="button"
                          tabIndex={isDisabled ? -1 : 0}
                          aria-disabled={isDisabled ? true : undefined}
                          className={`relative w-[64px] h-[64px] flex items-center justify-center overflow-hidden border border-zinc-700 bg-cover bg-center ${cellBgHoverUrl && !isDisabled ? "hover:bg-(image:--slot-hover)" : ""} ${isDisabled ? 'pointer-events-none' : 'cursor-pointer'}`}
                          style={{
                            backgroundImage: `url(${cellBgUrl})`,
                            ...(cellBgHoverUrl && !isDisabled ? { ["--slot-hover" as string]: `url(${cellBgHoverUrl})` } : {}),
                          }}
                          id={`main-base-building-${cellIndex}`}
                          data-panel-slot
                          onClick={isDisabled ? undefined : (e) => handleCellClick(e, rowIndex, groupIndex, cellIndex)}
                          onContextMenu={isDisabled ? undefined : (e) => handleCellRightClick(e, rowIndex, groupIndex, cellIndex)}
                          onMouseEnter={
                            slotType === 'filled' && buildingData
                              ? (e) => {
                                const rect = e.currentTarget.getBoundingClientRect()
                                setHoverTooltip({
                                  building: buildingData,
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
                          onMouseLeave={
                            slotType === 'filled' ? () => setHoverTooltip(null) : undefined
                          }
                        >
                          {hasBuilding && buildingData && (
                            <>
                              <img
                                src={getBuildingIconPath(buildingData.name)}
                                alt={buildingData.name}
                                className="w-12 h-12"
                              />
                              <button
                                type="button"
                                data-date-picker-trigger
                                className="absolute top-0.5 left-0.5 z-10 w-4 h-4 flex items-center justify-center bg-black/50 hover:bg-black/70 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  playMenuToggleSound(true)
                                  const rect = e.currentTarget.getBoundingClientRect()
                                  setDatePickerAnchor({ x: rect.left, y: rect.bottom })
                                  setDatePickerCell((prev) =>
                                    prev?.rowIndex === rowIndex && prev?.groupIndex === groupIndex && prev?.cellIndex === cellIndex
                                      ? null
                                      : { rowIndex, groupIndex, cellIndex }
                                  )
                                }}
                                aria-label="Définir la date d'ajout du bâtiment"
                              >
                                <img
                                  src={TIME_ICON_PATH}
                                  alt=""
                                  className="w-3 h-3 object-contain"
                                />
                              </button>
                            </>
                          )}
                          {orderNumber !== null && (
                            <OrderBadge
                              orderNumber={orderNumber}
                              onIncrement={() => {
                                const coords: BuildingCoords = { rowIndex, groupIndex, cellIndex }
                                updateBuildingOrder(incrementOrder(buildingOrder, coords, buildingIsEqual))
                              }}
                              onDecrement={() => {
                                const coords: BuildingCoords = { rowIndex, groupIndex, cellIndex }
                                updateBuildingOrder(decrementOrder(buildingOrder, coords, buildingIsEqual))
                              }}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            ))}
            {selectedCell && anchorPosition && (
              <MainBaseBuildingsSelector
                onClose={handleCloseSelector}
                onSelect={handleSelectBuilding}
                usedBuildingNames={usedBuildingIds}
                anchorPosition={anchorPosition}
                selectedMainBaseIndex={selectedMainBaseIndex}
              />
            )}
          </div>
          {datePickerCell && datePickerAnchor && (
            <div
              ref={datePickerRef}
              data-date-picker
              className="fixed z-20 bg-zinc-900 p-2 shadow-lg"
              style={{
                left: datePickerAnchor.x,
                top: datePickerAnchor.y + 4,
              }}
            >
              <DatePicker
                totalDays={buildingDates[buildingDateKey(datePickerCell.rowIndex, datePickerCell.groupIndex, datePickerCell.cellIndex)] ?? 0}
                onChange={(totalDays) =>
                  setBuildingDate(datePickerCell.rowIndex, datePickerCell.groupIndex, datePickerCell.cellIndex, totalDays)
                }
              />
            </div>
          )}
        </div>

      </div>
      {/* Hover tooltip (hidden when buildings selector is open) */}
      {showTooltip && hoverTooltip && (
        <BuildingAttributesTooltip
          building={hoverTooltip.building}
          anchorRect={hoverTooltip.anchorRect}
        />
      )}
    </>
  )
}

export default MainBase