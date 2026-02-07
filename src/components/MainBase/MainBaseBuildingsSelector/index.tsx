import { useState, useMemo, useEffect, useRef } from "react"
import { useMainStore, type FactionLabel } from "@/store"
import { getBuildingIconPath } from "@/utils/assetPaths"
import { useIsMobile } from "@/hooks/useMediaQuery"
import BuildingAttributesTooltip from "../BuildingAttributesTooltip"
import mainBuildingsData from "./main-buildings.json"

export interface MainBuilding {
  name: string
  desc?: string
  attributes: string[]
  category: 'Economy' | 'Military' | 'Statecraft'
  excludeFromFaction?: FactionLabel
  onlyForFaction?: FactionLabel
}

const mainBuildings = mainBuildingsData as MainBuilding[]

interface AnchorPosition {
  x: number
  y: number
}

interface MainBaseBuildingsSelectorProps {
  onClose: () => void
  onSelect: (buildingName: string | null) => void
  /** Building names already present in the base */
  usedBuildingNames: string[]
  /** Position d'ancrage pour le popup */
  anchorPosition: AnchorPosition
  /** Current main base index (0 or 1) */
  selectedMainBaseIndex: 0 | 1
}

const CATEGORIES = ['Economy', 'Military', 'Statecraft'] as const
type Category = typeof CATEGORIES[number]

const categoryColors: Record<Category, string> = {
  Economy: 'border-economy text-economy',
  Military: 'border-military text-military',
  Statecraft: 'border-statecraft text-statecraft',
}

const categoryBgOpacity: Record<Category, string> = {
  Economy: 'bg-economy/25',
  Military: 'bg-military/25',
  Statecraft: 'bg-statecraft/25',
}

const MainBaseBuildingsSelector = ({
  onClose,
  onSelect,
  usedBuildingNames,
  anchorPosition,
  selectedMainBaseIndex,
}: MainBaseBuildingsSelectorProps) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const [hoverTooltip, setHoverTooltip] = useState<{
    building: MainBuilding
    anchorRect: { left: number; top: number; width: number; height: number }
  } | null>(null)

  // Close on outside click (allows click to propagate to other elements)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  // Memoize available buildings (only changes when faction or base index changes)
  const availableBuildings = useMemo(() => {
    return mainBuildings.filter((building) => {
      // Standard faction filtering
      if (building.excludeFromFaction === selectedFaction) return false
      if (building.onlyForFaction && building.onlyForFaction !== selectedFaction) return false
      
      // Bazaar cannot be built in sietch (main base #2 for Fremen)
      if (building.name === "Bazaar" && selectedFaction === "fremen" && selectedMainBaseIndex === 1) {
        return false
      }
      
      return true
    })
  }, [selectedFaction, selectedMainBaseIndex])

  // Memoize grouping by category
  const buildingsByCategory = useMemo(() => {
    return availableBuildings.reduce<Record<Category, MainBuilding[]>>(
      (acc, building) => {
        acc[building.category].push(building)
        return acc
      },
      { Economy: [], Military: [], Statecraft: [] }
    )
  }, [availableBuildings])

  // Memoize popup style
  const popupStyle = useMemo<React.CSSProperties>(() => {
    if (isMobile) {
      return {
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: "calc(100vw - 2rem)",
        maxHeight: "calc(100vh - 4rem)",
      }
    }
    return {
      position: "fixed",
      left: anchorPosition.x,
      bottom: window.innerHeight - anchorPosition.y,
    }
  }, [anchorPosition.x, anchorPosition.y, isMobile])

  return (
    <>
      {/* Modal content */}
      <div
        ref={modalRef}
        className={`z-50 bg-zinc-900 border border-zinc-700 flex flex-col ${isMobile ? "overflow-auto" : ""}`}
        style={popupStyle}
      >
        {/* Categories container */}
        <div className={`flex shrink-0 ${isMobile ? "p-2 gap-2 flex-col" : "p-4 gap-4 flex-row"}`}>
          {CATEGORIES.map((category) => (
            <div key={category} className="flex flex-col shrink-0">
              {/* Buildings grid */}
              <div className="grid grid-cols-3 gap-1">
                {buildingsByCategory[category].map((building) => {
                  const isUsed = usedBuildingNames.includes(building.name)

                  return (
                    <div
                      key={building.name}
                      className={isMobile ? "w-10 h-10 shrink-0" : "w-12 h-12 shrink-0"}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setHoverTooltip({
                          building,
                          anchorRect: {
                            left: rect.left,
                            top: rect.top,
                            width: rect.width,
                            height: rect.height,
                          },
                        })
                      }}
                      onMouseLeave={() => setHoverTooltip(null)}
                    >
                      <button
                        onClick={() => !isUsed && onSelect(building.name)}
                        disabled={isUsed}
                        className={`
                          w-full h-full border-2 flex items-center justify-center
                          ${categoryColors[category].split(' ')[0]}
                          ${categoryBgOpacity[category]}
                          ${isUsed ? 'grayscale opacity-50 cursor-not-allowed' : 'hover:brightness-125 cursor-pointer'}
                        `}
                      >
                        <img
                          src={getBuildingIconPath(building.name)}
                          alt={building.name}
                          className={isMobile ? "w-8 h-8" : "w-10 h-10"}
                        />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
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

export default MainBaseBuildingsSelector
