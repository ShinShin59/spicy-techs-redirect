import TooltipWrapper from "@/components/shared/TooltipWrapper"

const CATEGORY_COLORS: Record<string, string> = {
  Economy: "text-economy",
  Military: "text-military",
  Statecraft: "text-statecraft",
  Expansion: "text-expansion",
}

export interface CouncillorTooltipProps {
  councillor: {
    name: string
    description: string
    category: string
    attributes: string[]
  }
  anchorRect: { left: number; top: number; width: number; height: number }
}

export default function CouncillorTooltip({
  councillor,
  anchorRect,
}: CouncillorTooltipProps) {
  return (
    <TooltipWrapper anchorRect={anchorRect}>
      <div className="px-3 py-2 border-b border-zinc-700/80 bg-zinc flex items-center justify-between gap-2">
        <div className="text-zinc-100 font-semibold text-sm uppercase tracking-wide truncate">
          {councillor.name}
        </div>
        <span
          className={`text-xs font-bold shadow-sm uppercase shrink-0 ${CATEGORY_COLORS[councillor.category] ?? "text-zinc-400"
            }`}
        >
          {councillor.category}
        </span>
      </div>

      <div className="px-3 py-1.5 border-b border-zinc-700/50 space-y-1">
        <ul className="text-zinc-300 text-xs list-disc list-inside space-y-0.5">
          {councillor.attributes.map((attr, i) => (
            <li key={i}>{attr}</li>
          ))}
        </ul>
      </div>

      <div className="px-3 py-2 text-gray-500 text-xs line-height-0.8 italic">
        {councillor.description}
      </div>
    </TooltipWrapper>
  )
}
