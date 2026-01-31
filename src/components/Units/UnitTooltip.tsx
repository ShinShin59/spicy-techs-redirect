import type { UnitData } from "./units-utils"

const OFFSET = 8

export interface UnitTooltipProps {
  unit: UnitData
  anchorRect: { left: number; top: number; width: number; height: number }
}

export default function UnitTooltip({
  unit,
  anchorRect,
}: UnitTooltipProps) {
  const style: React.CSSProperties = {
    position: "fixed",
    left: anchorRect.left + anchorRect.width + OFFSET,
    top: anchorRect.top,
    maxWidth: 320,
  }

  return (
    <div
      className="z-60 bg-zinc-900 border border-zinc-600 shadow-lg pointer-events-none overflow-hidden"
      style={style}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-zinc-700/80 bg-zinc-700">
        <div className="text-zinc-100 font-semibold text-sm uppercase tracking-wide">
          {unit.name}
        </div>
      </div>

      {/* Description */}
      {unit.desc ? (
        <div className="px-3 py-2 text-zinc-300 text-sm">
          {unit.desc}
        </div>
      ) : (
        <div className="px-3 py-2 text-zinc-500 text-sm italic">
          No description available
        </div>
      )}
    </div>
  )
}
