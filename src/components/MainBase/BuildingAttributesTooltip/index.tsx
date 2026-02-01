import type { MainBuilding } from "../MainBaseBuildingsSelector"
import TooltipWrapper from "@/components/shared/TooltipWrapper"

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

type Segment = { type: "bracket" | "value" | "normal"; text: string }

function parseAttributeLine(line: string): Segment[] {
  const segments: Segment[] = []
  let i = 0
  while (i < line.length) {
    if (line[i] === "[") {
      const end = line.indexOf("]", i)
      if (end === -1) {
        segments.push({ type: "normal", text: line[i] })
        i++
      } else {
        segments.push({
          type: "bracket",
          text: line.slice(i + 1, end),
        })
        i = end + 1
      }
      continue
    }
    if (/\d/.test(line[i])) {
      let j = i
      while (j < line.length && /\d/.test(line[j])) j++
      segments.push({ type: "value", text: line.slice(i, j) })
      i = j
      continue
    }
    if (line[i] === "+" || line[i] === "x" || line[i] === "*") {
      segments.push({ type: "value", text: line[i] })
      i++
      continue
    }
    let j = i
    while (
      j < line.length &&
      line[j] !== "[" &&
      !/\d/.test(line[j]) &&
      line[j] !== "+" &&
      line[j] !== "x" &&
      line[j] !== "*"
    ) {
      j++
    }
    if (j > i) {
      segments.push({ type: "normal", text: line.slice(i, j) })
    }
    i = j > i ? j : i + 1
  }
  return segments
}

function AttributeLine({ line }: { line: string }) {
  const segments = parseAttributeLine(line)
  return (
    <span className="text-zinc-300 text-xs">
      {segments.map((seg, idx) => {
        if (seg.type === "bracket") {
          return (
            <span
              key={idx}
              className="text-amber-300 font-bold"
            >
              {seg.text}
            </span>
          )
        }
        if (seg.type === "value") {
          return (
            <span
              key={idx}
              className="text-emerald-400 font-bold"
            >
              {seg.text}
            </span>
          )
        }
        return <span key={idx}>{seg.text}</span>
      })}
    </span>
  )
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
