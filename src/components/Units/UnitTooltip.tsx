import TooltipWrapper from "@/components/shared/TooltipWrapper"

export interface UnitTooltipProps {
  unit: {
    name: string
    desc?: string
    cpCost?: number
    stats?: { health?: number; power?: number; armor?: number; range?: number; minRange?: number }
    attributes?: string[]
  }
  anchorRect: { left: number; top: number; width: number; height: number }
}

export default function UnitTooltip({
  unit,
  anchorRect,
}: UnitTooltipProps) {
  const hasAttributes = unit.attributes && unit.attributes.length > 0
  const stats = unit.stats
  const hasStats = stats && (stats.health != null || stats.power != null || stats.armor != null)

  return (
    <TooltipWrapper anchorRect={anchorRect}>
      {/* Header: name + CP cost (same style as councillor tooltip) */}
      <div className="px-3 py-2 border-b border-zinc-700/80 bg-zinc flex items-center justify-between gap-2">
        <div className="text-zinc-100 font-semibold text-sm uppercase tracking-wide truncate">
          {unit.name}
        </div>
        {unit.cpCost != null && (
          <span className="text-xs font-medium text-zinc-400 shrink-0">
            {unit.cpCost} CP
          </span>
        )}
      </div>

      {/* Stats box: health, power, armor */}
      {hasStats && (
        <div className="px-3 py-1.5 border-b border-zinc-700/50">
          <div className="inline-flex gap-3 px-2 py-1.5 rounded bg-zinc-800/80 border border-zinc-600/50 text-xs">
            {stats.health != null && (
              <span className="text-zinc-300">
                <span className="text-zinc-500">HP</span> {stats.health}
              </span>
            )}
            {stats.power != null && (
              <span className="text-zinc-300">
                <span className="text-zinc-500">Pow</span> {stats.power}
              </span>
            )}
            {stats.armor != null && (
              <span className="text-zinc-300">
                <span className="text-zinc-500">Arm</span> {stats.armor}
              </span>
            )}
            {stats.range != null && (
              <span className="text-zinc-300">
                <span className="text-zinc-500">Rng</span> {stats.range}
                {stats.minRange != null && (
                  <> ({stats.minRange} min)</>
                )}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Attributes (unit effects / traits) */}
      {hasAttributes && (
        <div className="px-3 py-1.5 border-b border-zinc-700/50 space-y-1">
          <ul className="text-zinc-300 text-xs list-disc list-inside space-y-0.5">
            {unit.attributes!.map((attr, i) => (
              <li key={i}>{attr}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Description - gray italic small like councillor */}
      {unit.desc ? (
        <div className="px-3 py-2 text-gray-500 text-xs italic leading-snug">
          {unit.desc}
        </div>
      ) : (
        <div className="px-3 py-2 text-gray-500 text-xs italic">
          No description available
        </div>
      )}
    </TooltipWrapper>
  )
}
