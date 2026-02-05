import type { MainBuilding } from "../MainBaseBuildingsSelector"
import TooltipWrapper from "@/components/shared/TooltipWrapper"
import AttributeLine from "@/utils/AttributeLine"

const categoryBg: Record<MainBuilding["category"], string> = {
  Economy: "bg-economy",
  Military: "bg-military",
  Statecraft: "bg-statecraft",
}
const categoryBorder: Record<MainBuilding["category"], string> = {
  Economy: "border-economy",
  Military: "border-military",
  Statecraft: "border-statecraft",
}

export interface BuildingAttributesTooltipProps {
  building: MainBuilding
  /** Position d'ancrage (ex. getBoundingClientRect de la cellule/bouton) */
  anchorRect: { left: number; top: number; width: number; height: number }
}

export default function BuildingAttributesTooltip({
  building,
  anchorRect,
}: BuildingAttributesTooltipProps) {
  const bgClass = categoryBg[building.category]
  const borderClass = categoryBorder[building.category]

  return (
    <TooltipWrapper anchorRect={anchorRect} className={borderClass}>
      <div className={`px-3 py-2 border-b border-zinc-700/80 ${bgClass}`}>
        <div className="text-zinc-100 font-semibold text-sm uppercase tracking-wide">
          {building.name}
        </div>
      </div>
      {building.attributes.length > 0 ? (
        <div className="px-3 py-1.5 border-b border-zinc-700/50 space-y-1">
          <ul className="list-disc list-inside space-y-0.5 text-zinc-300 text-xs">
            {building.attributes.map((attr, i) => (
              <li key={i}>
                <AttributeLine line={attr} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {building.desc ? (
        <div className="px-3 py-2 text-gray-500 text-xs italic leading-snug">
          {building.desc}
        </div>
      ) : null}
    </TooltipWrapper>
  )
}
