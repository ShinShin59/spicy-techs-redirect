import { useState, useMemo } from "react"
import { useMainStore, type FactionLabel } from "@/store"
import BuildingAttributesTooltip from "../BuildingAttributesTooltip"
import mainBuildingsData from "./main-buildings.json"

export interface MainBuilding {
  name: string
  attributes: string[]
  category: 'Economy' | 'Military' | 'Statecraft'
  excludeFromFaction?: FactionLabel
  onlyForFaction?: FactionLabel
}

const mainBuildings = mainBuildingsData as MainBuilding[]

/** Génère le chemin de l'icône d'un bâtiment */
export function getBuildingIconPath(name: string): string {
  return `/images/mainbase_icons/${name.toLowerCase().replace(/ /g, "_")}.png`
}

// Précharger toutes les images des bâtiments au chargement du module
const preloadedImages: HTMLImageElement[] = []
mainBuildings.forEach((building) => {
  const img = new Image()
  img.src = getBuildingIconPath(building.name)
  preloadedImages.push(img)
})

interface AnchorPosition {
  x: number
  y: number
}

interface MainBaseBuildingsSelectorProps {
  onClose: () => void
  onSelect: (buildingName: string | null) => void
  /** Noms des bâtiments déjà présents dans la base */
  usedBuildingNames: string[]
  /** Position d'ancrage pour le popup */
  anchorPosition: AnchorPosition
}

const CATEGORIES = ['Economy', 'Military', 'Statecraft'] as const
type Category = typeof CATEGORIES[number]

const categoryColors: Record<Category, string> = {
  Economy: 'border-economy text-economy',
  Military: 'border-military text-military',
  Statecraft: 'border-statecraft text-statecraft',
}

const MainBaseBuildingsSelector = ({
  onClose,
  onSelect,
  usedBuildingNames,
  anchorPosition,
}: MainBaseBuildingsSelectorProps) => {
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const [hoverTooltip, setHoverTooltip] = useState<{
    building: MainBuilding
    anchorRect: { left: number; top: number; width: number; height: number }
  } | null>(null)

  // Mémoiser les bâtiments disponibles (ne change que si la faction change)
  const availableBuildings = useMemo(() => {
    return mainBuildings.filter((building) => {
      return (
        building.excludeFromFaction !== selectedFaction &&
        (!building.onlyForFaction || building.onlyForFaction === selectedFaction)
      )
    })
  }, [selectedFaction])

  // Mémoiser le groupement par catégorie
  const buildingsByCategory = useMemo(() => {
    return availableBuildings.reduce<Record<Category, MainBuilding[]>>(
      (acc, building) => {
        acc[building.category].push(building)
        return acc
      },
      { Economy: [], Military: [], Statecraft: [] }
    )
  }, [availableBuildings])

  // Mémoiser le style du popup
  const popupStyle = useMemo<React.CSSProperties>(() => ({
    position: 'fixed',
    left: anchorPosition.x,
    bottom: window.innerHeight - anchorPosition.y,
  }), [anchorPosition.x, anchorPosition.y])

  return (
    <>
      {/* Backdrop transparent pour fermer au clic extérieur */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        className="z-50 bg-zinc-900 border border-zinc-700 flex flex-col"
        style={popupStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="flex items-center justify-center gap-4 px-6 py-3 border-b border-zinc-700">
          <div className="flex-1 h-px bg-zinc-600" />
          <h2 className="text-lg font-bold tracking-wider text-zinc-200 uppercase">
            Buildings
          </h2>
          <div className="flex-1 h-px bg-zinc-600" />
        </div>

        {/* Categories container */}
        <div className="flex p-4 gap-4 shrink-0">
          {CATEGORIES.map((category) => (
            <div key={category} className="flex flex-col shrink-0">
              {/* Category header */}
              <div className={`flex items-center gap-2 mb-3 ${categoryColors[category]}`}>
                {/* Placeholder icon 16x16 */}
                <div className="w-4 h-4 bg-white shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">{category}</span>
              </div>

              {/* Buildings grid */}
              <div className="grid grid-cols-3 gap-1">
                {buildingsByCategory[category].map((building) => {
                  const isUsed = usedBuildingNames.includes(building.name)

                  return (
                    <button
                      key={building.name}
                      onClick={() => !isUsed && onSelect(building.name)}
                      disabled={isUsed}
                      className={`
                        w-12 h-12 border-2 bg-zinc-800 flex items-center justify-center shrink-0
                        ${categoryColors[category].split(' ')[0]}
                        ${isUsed ? 'grayscale opacity-50 cursor-not-allowed' : 'hover:brightness-125 cursor-pointer'}
                      `}
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
                      <img
                        src={getBuildingIconPath(building.name)}
                        alt={building.name}
                        className="w-10 h-10"
                      />
                    </button>
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
