import { useState } from "react"
import { useCurrentMainBaseLayout, useCurrentMainBaseState, useMainStore, useUsedBuildingIds, useCurrentBuildingOrder, getBuildingOrderNumber, type BuildingCoords } from "../../store"
import MainBaseBuildingsSelector, { type MainBuilding } from "./MainBaseBuildingsSelector"
import { getBuildingIconPath } from "@/utils/assetPaths"
import { playCancelSlotSound, playMenuToggleSound, playMainBaseBuildingSound } from "@/utils/sound"
import BuildingAttributesTooltip from "./BuildingAttributesTooltip"
import OrderBadge from "@/components/OrderBadge"
import PanelCorners from "@/components/PanelCorners"
import { incrementOrder, decrementOrder, buildingIsEqual } from "@/hooks/useItemOrder"
import mainBuildingsData from "./MainBaseBuildingsSelector/main-buildings.json"

const mainBuildings = mainBuildingsData as MainBuilding[]

function getBuildingByName(name: string | null): MainBuilding | undefined {
  if (!name) return undefined
  return mainBuildings.find((b) => b.name === name)
}

function getCategorySlotBgClass(category: MainBuilding['category']): string {
  switch (category) {
    case 'Economy':
      return "bg-[url('/images/hud/slot_economic.png')]"
    case 'Military':
      return "bg-[url('/images/hud/slot_military.png')]"
    case 'Statecraft':
      return "bg-[url('/images/hud/slot_statecraft.png')]"
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
  const setMainBaseCell = useMainStore((state) => state.setMainBaseCell)
  const updateBuildingOrder = useMainStore((state) => state.updateBuildingOrder)
  const usedBuildingIds = useUsedBuildingIds()
  const buildingOrder = useCurrentBuildingOrder()

  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null)
  const [anchorPosition, setAnchorPosition] = useState<AnchorPosition | null>(null)
  const [hoverTooltip, setHoverTooltip] = useState<{
    building: MainBuilding
    anchorRect: { left: number; top: number; width: number; height: number }
  } | null>(null)

  const handleCellClick = (e: React.MouseEvent, rowIndex: number, groupIndex: number, cellIndex: number) => {
    // Don't open selector if clicking on the order badge
    const target = e.target as HTMLElement
    if (target.closest("[data-order-badge]")) return

    const buildingName = mainBaseState[rowIndex]?.[groupIndex]?.[cellIndex]
    const buildingData = getBuildingByName(buildingName)
    const hasBuilding = buildingName !== null && buildingData !== undefined
    const groupState = mainBaseState[rowIndex]?.[groupIndex] ?? []
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
        <h2 className="text-xs font-mono font-bold text-white/70 uppercase m-0 ml-auto">
          Main Base
        </h2>
        <div
          id="main-base-grid"
          className="relative w-full p-4 border border-zinc-700 box-border bg-zinc-900 bg-[url('/images/hud/mb_bg_pattern.png')] bg-repeat bg-center"
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

                      const groupState = mainBaseState[rowIndex]?.[groupIndex] ?? []
                      const emptyCount = groupState.filter((v) => v === null).length
                      const firstEmptyIndex = groupState.findIndex((v) => v === null)

                      const slotType: SlotType = hasBuilding && buildingData
                        ? 'filled'
                        : emptyCount >= 2 && cellIndex !== firstEmptyIndex
                          ? 'empty_disabled'
                          : 'empty_add'

                      const cellBgClass =
                        slotType === 'filled' && buildingData
                          ? `${getCategorySlotBgClass(buildingData.category)} bg-cover bg-center`
                          : slotType === 'empty_add'
                            ? "bg-[url('/images/hud/slot_add.png')] bg-cover bg-center hover:bg-[url('/images/hud/slot_add_hover.png')]"
                            : "bg-[url('/images/hud/slot_disabled.png')] bg-cover bg-center"

                      const isDisabled = slotType === 'empty_disabled'

                      return (
                        <div
                          key={cellIndex}
                          role="button"
                          tabIndex={isDisabled ? -1 : 0}
                          aria-disabled={isDisabled ? true : undefined}
                          className={`relative w-[64px] h-[64px] flex items-center justify-center overflow-hidden border border-zinc-700 ${cellBgClass} ${isDisabled ? 'pointer-events-none' : 'cursor-pointer'}`}
                          id={`main-base-building-${cellIndex}`}
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
                            <img
                              src={getBuildingIconPath(buildingData.name)}
                              alt={buildingData.name}
                              className="w-12 h-12"
                            />
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
              />
            )}
          </div>
        </div>

      </div>
      {hoverTooltip && (
        <BuildingAttributesTooltip
          building={hoverTooltip.building}
          anchorRect={hoverTooltip.anchorRect}
        />
      )}
    </>
  )
}

export default MainBase