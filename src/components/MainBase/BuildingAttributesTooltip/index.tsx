import type { MainBuilding } from "../MainBaseBuildingsSelector"

const OFFSET = 8

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
    <span className="text-zinc-300 text-sm">
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
  const style: React.CSSProperties = {
    position: "fixed",
    left: anchorRect.left + anchorRect.width + OFFSET,
    top: anchorRect.top,
    maxWidth: 320,
  }

  return (
    <div
      className="z-60 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 shadow-lg pointer-events-none"
      style={style}
    >
      <div className="text-zinc-100 font-semibold text-sm uppercase tracking-wide mb-1.5">
        {building.name}
      </div>
      {building.attributes.length > 0 ? (
        <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
          {building.attributes.map((attr, i) => (
            <li key={i}>
              <AttributeLine line={attr} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
