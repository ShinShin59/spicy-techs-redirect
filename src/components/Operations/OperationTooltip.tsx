import TooltipWrapper from "@/components/shared/TooltipWrapper"

export interface OperationTooltipProps {
  operation: {
    name: string
    desc?: string
    cost: { res: string; qty: number }[]
  }
  anchorRect: { left: number; top: number; width: number; height: number }
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
      {operation.desc ? (
        <div className="px-3 py-2 text-gray-500 text-xs italic leading-snug">
          {operation.desc}
        </div>
      ) : (
        <div className="px-3 py-2 text-gray-500 text-xs italic">
          No description available
        </div>
      )}
    </TooltipWrapper>
  )
}
