import { useState } from "react"
import { useCurrentMainBaseLayout, useCurrentMainBaseState, useMainStore, useUsedBuildingIds, useCurrentBuildingOrder, getBuildingOrderNumber } from "../../store"
import MainBaseBuildingsSelector, { type MainBuilding, getBuildingIconPath } from "./MainBaseBuildingsSelector"
import BuildingAttributesTooltip from "./BuildingAttributesTooltip"
import mainBuildingsData from "./MainBaseBuildingsSelector/main-buildings.json"

const mainBuildings = mainBuildingsData as MainBuilding[]

/** Trouve un bâtiment par son nom */
function getBuildingByName(name: string | null): MainBuilding | undefined {
  if (!name) return undefined
  return mainBuildings.find((b) => b.name === name)
}

/** Retourne la classe de couleur de fond selon la catégorie */
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
  const usedBuildingIds = useUsedBuildingIds()
  const buildingOrder = useCurrentBuildingOrder()

  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null)
  const [anchorPosition, setAnchorPosition] = useState<AnchorPosition | null>(null)
  const [hoverTooltip, setHoverTooltip] = useState<{
    building: MainBuilding
    anchorRect: { left: number; top: number; width: number; height: number }
  } | null>(null)

  const handleCellClick = (e: React.MouseEvent, rowIndex: number, groupIndex: number, cellIndex: number) => {
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
    }
  }

  return (
    <>
      <div
        id="main-base-grid"
        className="relative bg-zinc-900 border border-zinc-700 w-[384px] h-[320px] flex flex-col justify-center items-center gap-12"
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
                      title={buildingData?.name || "Vide"}
                    >
                      {hasBuilding && buildingData && (
                        <img
                          src={getBuildingIconPath(buildingData.name)}
                          alt={buildingData.name}
                          className="w-12 h-12"
                        />
                      )}
                      {orderNumber !== null && (
                        <span className="absolute top-0.5 right-1 text-xs font-bold text-white bg-black/60 px-1 rounded">
                          {orderNumber}
                        </span>
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