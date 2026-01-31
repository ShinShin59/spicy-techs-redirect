import type { GearItem } from "./armory-utils"

const OFFSET = 8

export interface GearAttributesTooltipProps {
  gear: GearItem
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
    // Match :: placeholders like ::s_percent::
    if (line.slice(i, i + 2) === "::") {
      const end = line.indexOf("::", i + 2)
      if (end !== -1) {
        segments.push({
          type: "value",
          text: "X", // Placeholder for dynamic values
        })
        i = end + 2
        continue
      }
    }
    if (/\d/.test(line[i])) {
      let j = i
      while (j < line.length && /[\d%]/.test(line[j])) j++
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
      line.slice(j, j + 2) !== "::" &&
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
            <span key={idx} className="text-amber-300 font-bold">
              {seg.text}
            </span>
          )
        }
        if (seg.type === "value") {
          return (
            <span key={idx} className="text-emerald-400 font-bold">
              {seg.text}
            </span>
          )
        }
        return <span key={idx}>{seg.text}</span>
      })}
    </span>
  )
}

function renderAttribute(
  attr: string | { desc: string; target_effects_list: string[] },
  index: number,
  gearTargetEffects?: string[]
) {
  if (typeof attr === "string") {
    // Check if this attribute contains ::target_effects:: placeholder
    const hasTargetEffectsPlaceholder = attr.includes("::target_effects::")
    const showTargetEffects = hasTargetEffectsPlaceholder && gearTargetEffects && gearTargetEffects.length > 0

    return (
      <li key={index}>
        <AttributeLine line={attr} />
        {showTargetEffects && (
          <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
            {gearTargetEffects.map((effect, i) => (
              <li key={i}>
                <AttributeLine line={effect} />
              </li>
            ))}
          </ul>
        )}
      </li>
    )
  }
  // Complex attribute with desc and target_effects_list
  return (
    <li key={index}>
      <AttributeLine line={attr.desc} />
      {attr.target_effects_list.length > 0 && (
        <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
          {attr.target_effects_list.map((effect, i) => (
            <li key={i}>
              <AttributeLine line={effect} />
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
          {gear.attributes.map((attr, i) => renderAttribute(attr, i, gear.target_effects))}
        </ul>
      ) : (
        <div className="px-3 py-2 text-zinc-500 text-sm italic">
          No description available
        </div>
      )}
    </div>
  )
}
