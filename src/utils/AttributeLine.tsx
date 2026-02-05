/**
 * React component that renders a parsed attribute line with color styling.
 *
 * - "bracket" segments -> amber/yellow (text-amber-300 font-bold)
 * - "value" segments -> green (text-emerald-400 font-bold)
 * - "normal" segments -> default text color
 */
import { parseAttributeLine } from "./attributeParsing"

export default function AttributeLine({ line, className = "text-zinc-300 text-xs" }: { line: string; className?: string }) {
  const segments = parseAttributeLine(line)
  return (
    <span className={className}>
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
