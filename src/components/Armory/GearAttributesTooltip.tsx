import type { GearItem } from "./armory-utils"
import TooltipWrapper from "@/components/shared/TooltipWrapper"
import AttributeLine from "@/utils/AttributeLine"

export interface GearAttributesTooltipProps {
  gear: GearItem
  anchorRect: { left: number; top: number; width: number; height: number }
}

function renderAttribute(
  attr: string | { desc: string; target_effects_list: string[] },
  index: number,
) {
  if (typeof attr === "string") {
    return (
      <li key={index}>
        <AttributeLine line={attr} className="text-zinc-300 text-sm" />
      </li>
    )
  }
  // Complex attribute with desc and target_effects_list
  return (
    <li key={index}>
      <AttributeLine line={attr.desc} className="text-zinc-300 text-sm" />
      {attr.target_effects_list.length > 0 && (
        <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
          {attr.target_effects_list.map((effect, i) => (
            <li key={i}>
              <AttributeLine line={effect} className="text-zinc-300 text-sm" />
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export default function GearAttributesTooltip({
  gear,
  anchorRect,
}: GearAttributesTooltipProps) {
  return (
    <TooltipWrapper anchorRect={anchorRect}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-zinc-700/80 bg-zinc-700">
        <div className="text-zinc-100 font-semibold text-sm uppercase tracking-wide">
          {gear.name}
        </div>
        {gear.unit.length > 0 && (
          <div className="text-zinc-400 text-xs mt-0.5">
            {gear.unit.join(", ")}
          </div>
        )}
      </div>

      {/* Attributes */}
      {gear.attributes.length > 0 ? (
        <ul className="list-disc list-inside space-y-0.5 text-zinc-400 px-3 py-2">
          {gear.attributes.map((attr, i) => renderAttribute(attr, i))}
        </ul>
      ) : (
        <div className="px-3 py-2 text-zinc-500 text-sm italic">
          No description available
        </div>
      )}
    </TooltipWrapper>
  )
}
