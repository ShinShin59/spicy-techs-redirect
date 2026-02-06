import TooltipWrapper from "@/components/shared/TooltipWrapper"
import AttributeLine from "@/utils/AttributeLine"

export interface OperationTooltipProps {
  operation: {
    name: string
    desc?: string
    cost: { res: string; qty: number }[]
    attributes?: (string | { desc: string; target_effects_list: string[] })[]
  }
  anchorRect: { left: number; top: number; width: number; height: number }
}

function renderAttribute(
  attr: string | { desc: string; target_effects_list: string[] },
  index: number,
) {
  if (typeof attr === "string") {
    return (
      <li key={index}>
        <AttributeLine line={attr} className="text-zinc-300 text-xs" />
      </li>
    )
  }
  // Complex attribute with desc and target_effects_list
  return (
    <li key={index}>
      <AttributeLine line={attr.desc} className="text-zinc-300 text-xs" />
      {attr.target_effects_list.length > 0 && (
        <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
          {attr.target_effects_list.map((effect, i) => (
            <li key={i}>
              <AttributeLine line={effect} className="text-zinc-300 text-xs" />
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function formatCost(cost: { res: string; qty: number }[]): string {
  if (!cost.length) return ""
  return cost.map((c) => `${c.qty} ${c.res}`).join(", ")
}

export default function OperationTooltip({
  operation,
  anchorRect,
}: OperationTooltipProps) {
  const costStr = formatCost(operation.cost ?? [])
  const hasAttributes = operation.attributes && operation.attributes.length > 0

  return (
    <TooltipWrapper anchorRect={anchorRect}>
      <div className="px-3 py-2 border-b border-zinc-700/80 bg-zinc flex items-center justify-between gap-2">
        <div className="text-zinc-100 font-semibold text-sm uppercase tracking-wide truncate">
          {operation.name}
        </div>
        {costStr && (
          <span className="text-xs font-medium text-zinc-400 shrink-0">
            {costStr}
          </span>
        )}
      </div>
      
      {/* Attributes */}
      {hasAttributes && (
        <div className="px-3 py-1.5 border-b border-zinc-700/50 space-y-1">
          <ul className="list-disc list-inside space-y-0.5 text-zinc-300 text-xs">
            {operation.attributes!.map((attr, i) => renderAttribute(attr, i))}
          </ul>
        </div>
      )}

      {/* Description */}
      {operation.desc ? (
        <div className="px-3 py-2 text-gray-500 text-xs italic leading-snug">
          {operation.desc}
        </div>
      ) : (
        !hasAttributes && (
          <div className="px-3 py-2 text-gray-500 text-xs italic">
            No description available
          </div>
        )
      )}
    </TooltipWrapper>
  )
}
