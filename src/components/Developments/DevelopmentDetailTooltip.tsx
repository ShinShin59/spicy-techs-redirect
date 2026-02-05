import { createPortal } from "react-dom"
import TooltipWrapper from "@/components/shared/TooltipWrapper"
import { TIME_ICON_PATH } from "@/utils/assetPaths"
import type { KnowledgeModifierBreakdown } from "@/utils/knowledge"

export type DevelopmentDomain = "economic" | "military" | "statecraft" | "green"

export interface DevelopmentEntry {
  id: string
  name: string
  desc?: string
  domain: DevelopmentDomain
  tier: number
  gridX: number
  gridY: number
  requires: string | null
  replaces: string | null
  gfx?: { file: string; size: number; x: number; y: number }
  attributes?: string[]
  /** Faction-specific replacement; only show when selectedFaction matches */
  faction?: string
}

const DOMAIN_LABELS: Record<DevelopmentDomain, string> = {
  economic: "Economic development",
  military: "Military development",
  statecraft: "Statecraft development",
  green: "Expansion development",
}

const domainColor: Record<DevelopmentDomain, string> = {
  economic: "text-amber-400",
  military: "text-red-400",
  statecraft: "text-cyan-400",
  green: "text-emerald-400",
}

const CURSOR_OFFSET = 12

const DEFAULT_KNOWLEDGE_PER_DAY = 5

export interface DevelopmentDetailTooltipProps {
  development: DevelopmentEntry
  /** When set, tooltip follows cursor at (x + offset, y + offset) */
  followCursor?: { x: number; y: number }
  /** When followCursor is not set, position relative to this rect */
  anchorRect?: { left: number; top: number; width: number; height: number }
  /** Research cost in Knowledge (current build order or "if researched next"). When set, shows ~days. */
  costKnowledge?: number
  /** Optional Knowledge/day breakdown for this development. */
  knowledgeBreakdown?: KnowledgeModifierBreakdown
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
        segments.push({ type: "bracket", text: line.slice(i + 1, end) })
        i = end + 1
      }
      continue
    }
    if (line[i] === ":" && line[i + 1] === ":") {
      const end = line.indexOf("::", i + 2)
      if (end !== -1) {
        segments.push({ type: "value", text: line.slice(i, end + 2) })
        i = end + 2
        continue
      }
    }
    if (/\d/.test(line[i])) {
      let j = i
      while (j < line.length && /\d/.test(line[j])) j++
      segments.push({ type: "value", text: line.slice(i, j) })
      i = j
      continue
    }
    if (line[i] === "+" || line[i] === "x" || line[i] === "*" || line[i] === "%") {
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
      line[j] !== "*" &&
      line[j] !== "%" &&
      !(line[j] === ":" && line[j + 1] === ":")
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

const tooltipContentClass =
  "z-[9999] max-w-[320px] bg-zinc-900/95 backdrop-blur-md border border-zinc-600 shadow-lg pointer-events-none overflow-hidden"

interface TooltipContentProps {
  development: DevelopmentEntry
  costKnowledge?: number
  knowledgeBreakdown?: KnowledgeModifierBreakdown
}

function TooltipContent({ development, costKnowledge, knowledgeBreakdown }: TooltipContentProps) {
  const categoryLabel = DOMAIN_LABELS[development.domain]
  const colorClass = domainColor[development.domain]
  const knowledgePerDay =
    knowledgeBreakdown?.effective ?? DEFAULT_KNOWLEDGE_PER_DAY
  const costDays =
    costKnowledge != null ? Math.round(costKnowledge / knowledgePerDay) : undefined
  return (
    <>
      <div className="px-3 py-2 border-b border-zinc-700/80 bg-zinc-800/90">
        <div className="flex items-center gap-2">
          <span className="text-zinc-100 font-semibold text-sm min-w-0 flex-1">{development.name}</span>
          {costDays != null && (
            <div
              className="relative w-6 h-6 shrink-0 bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${TIME_ICON_PATH})` }}
              aria-hidden
            >
              <span className="absolute inset-0 flex items-center justify-center text-zinc-300 text-[10px] font-medium tabular-nums">
                {costDays}
              </span>
            </div>
          )}
        </div>
        {knowledgeBreakdown && (
          <div className="mt-0.5 text-[10px] text-zinc-400">
            ~{Math.round(knowledgePerDay)} Knowledge / day
          </div>
        )}
        <div className={`text-xs ${colorClass}`}>{categoryLabel}</div>
      </div>
      {development.attributes && development.attributes.length > 0 ? (
        <div className="px-3 py-1.5 border-b border-zinc-700/50 space-y-1">
          <ul className="list-none space-y-0.5 text-zinc-300 text-xs">
            {development.attributes.map((attr, i) => (
              <li key={i}>
                <AttributeLine line={attr} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {development.desc ? (
        <div className="px-3 py-2 text-gray-400 text-xs italic leading-snug">
          {development.desc}
        </div>
      ) : null}
    </>
  )
}

export default function DevelopmentDetailTooltip({
  development,
  followCursor,
  anchorRect,
  costKnowledge,
  knowledgeBreakdown,
}: DevelopmentDetailTooltipProps) {
  const costProps = { costKnowledge, knowledgeBreakdown }
  if (followCursor) {
    return createPortal(
      <div
        className={tooltipContentClass}
        style={{
          position: "fixed",
          left: followCursor.x + CURSOR_OFFSET,
          top: followCursor.y + CURSOR_OFFSET,
        }}
      >
        <TooltipContent development={development} {...costProps} />
      </div>,
      document.body
    )
  }

  if (anchorRect) {
    return (
      <TooltipWrapper anchorRect={anchorRect} className="border-zinc-600" maxWidth={320}>
        <TooltipContent development={development} {...costProps} />
      </TooltipWrapper>
    )
  }

  return null
}
