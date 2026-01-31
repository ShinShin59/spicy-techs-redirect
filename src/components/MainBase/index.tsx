import { useState } from "react"
import { useCurrentMainBaseLayout, useCurrentMainBaseState, useMainStore, useUsedBuildingIds, useCurrentBuildingOrder, getBuildingOrderNumber, type BuildingCoords } from "../../store"
import MainBaseBuildingsSelector, { type MainBuilding } from "./MainBaseBuildingsSelector"
import { getBuildingIconPath } from "@/utils/assetPaths"
import { useShareButton } from "@/hooks/useShareButton"
import BuildingAttributesTooltip from "./BuildingAttributesTooltip"
import OrderBadge from "@/components/OrderBadge"
import { incrementOrder, decrementOrder, buildingIsEqual } from "@/hooks/useItemOrder"
import mainBuildingsData from "./MainBaseBuildingsSelector/main-buildings.json"

const mainBuildings = mainBuildingsData as MainBuilding[]

function getBuildingByName(name: string | null): MainBuilding | undefined {
  if (!name) return undefined
  return mainBuildings.find((b) => b.name === name)
}

function getCategoryBgClass(category: MainBuilding['category']): string {
  switch (category) {
    case 'Economy':
      return 'bg-economy'
    case 'Military':
      return 'bg-military'
    case 'Statecraft':
      return 'bg-statecraft'
  }
}

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
  const { copied: shareCopied, handleShare } = useShareButton()

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
    
    const rect = e.currentTarget.getBoundingClientRect()
    setAnchorPosition({ x: rect.left, y: rect.top })
    setSelectedCell({ rowIndex, groupIndex, cellIndex })
  }

  const handleSelectBuilding = (buildingId: string | null) => {
    if (selectedCell) {
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
          className="relative bg-zinc-900 border border-zinc-700 w-full flex flex-col justify-center items-center gap-12 px-4 py-6 box-border"
        >
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

                    const cellBgClass = hasBuilding && buildingData
                      ? getCategoryBgClass(buildingData.category)
                      : 'bg-zinc-600 hover:bg-zinc-500'

                    return (
                      <div
                        key={cellIndex}
                        role="button"
                        tabIndex={0}
                        className={`relative w-[64px] h-[64px] cursor-pointer flex items-center justify-center overflow-hidden border border-zinc-700 ${cellBgClass}`}
                        id={`main-base-building-${cellIndex}`}
                        onClick={(e) => handleCellClick(e, rowIndex, groupIndex, cellIndex)}
                        onContextMenu={(e) => handleCellRightClick(e, rowIndex, groupIndex, cellIndex)}
                        onMouseEnter={
                          hasBuilding && buildingData
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
                          hasBuilding ? () => setHoverTooltip(null) : undefined
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
        <div className="absolute top-2 right-2">
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5  text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:[&_img]:brightness-0 hover:[&_img]:invert"
            title="Share"
          >
            <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgNzIgNzIiIGZpbGw9IiM2YjcyODAiPjxnIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzZiNzI4MCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHN0cm9rZS13aWR0aD0iMiI+PGNpcmNsZSBjeD0iNTAiIGN5PSIyMiIgcj0iNSIvPjxjaXJjbGUgY3g9IjIyIiBjeT0iMzgiIHI9IjUiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1Ii8+PHBhdGggZD0ibTI3IDQwbDE4IDhtMC0yM0wyNyAzNSIvPjwvZz48L3N2Zz4=" alt="Share" className="w-6 h-6 transition-[filter]" />
          </button>
          {shareCopied && (
            <div
              className="absolute left-1/2 w-max top-full mt-1 -translate-x-1/2 z-10 bg-zinc-950 border border-zinc-700  shadow-lg px-3 py-2 text-zinc-100 text-sm text-center pointer-events-none"
              role="tooltip"
            >
              Copied!
              <div className="absolute left-1/2 bottom-full -translate-x-1/2 mb-px w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-zinc-950" />
            </div>
          )}
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