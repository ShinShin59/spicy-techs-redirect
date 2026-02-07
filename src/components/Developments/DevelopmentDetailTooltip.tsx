import { createPortal } from "react-dom"
import { useLayoutEffect, useRef, useState } from "react"
import TooltipWrapper from "@/components/shared/TooltipWrapper"
import { TIME_ICON_PATH } from "@/utils/assetPaths"
import type { KnowledgeModifierBreakdown } from "@/utils/knowledge"
import { getLandstraadWindowPhrase } from "./developmentsCostUtils"
import MonthEstimation from "@/components/MonthEstimation"
import AttributeLine from "@/utils/AttributeLine"

export type DevelopmentDomain = "economic" | "military" | "statecraft" | "expansion"

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
  attributes?: (string | { desc: string; target_effects_list: string[] })[]
  /** Faction-specific replacement; only show when selectedFaction matches */
  faction?: string
}

const DOMAIN_LABELS: Record<DevelopmentDomain, string> = {
  economic: "Economic development",
  military: "Military development",
  statecraft: "Statecraft development",
  expansion: "Expansion development",
}

const domainColor: Record<DevelopmentDomain, string> = {
  economic: "text-amber-400",
  military: "text-red-400",
  statecraft: "text-cyan-400",
  expansion: "text-emerald-400",
}

const CURSOR_OFFSET = 12
const EDGE_BUFFER = 8

const DEFAULT_KNOWLEDGE_PER_DAY = 5

function clampToViewport(
  left: number,
  top: number,
  width: number,
  height: number
): { left: number; top: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const clampedLeft = Math.max(EDGE_BUFFER, Math.min(left, vw - width - EDGE_BUFFER))
  const clampedTop = Math.max(EDGE_BUFFER, Math.min(top, vh - height - EDGE_BUFFER))
  return { left: clampedLeft, top: clampedTop }
}

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
  /** Days when this development is completed (for Landsraad estimation). Use this for per-dev tooltip. */
  daysToCompleteThisDev?: number
  /** Total days for the full build. Fallback when daysToCompleteThisDev not set. */
  totalBuildDays?: number
}

const tooltipContentClass =
  "z-[9999] max-w-[320px] bg-zinc-900/95 backdrop-blur-md border border-zinc-600 shadow-lg pointer-events-none overflow-hidden"

interface TooltipContentProps {
  development: DevelopmentEntry
  costKnowledge?: number
  knowledgeBreakdown?: KnowledgeModifierBreakdown
  daysToCompleteThisDev?: number
  totalBuildDays?: number
}

function FollowCursorTooltip({
  x,
  y,
  children,
}: {
  x: number
  y: number
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const baseLeft = x + CURSOR_OFFSET
  const baseTop = y + CURSOR_OFFSET

  const [style, setStyle] = useState<React.CSSProperties>(() => ({
    position: "fixed" as const,
    left: baseLeft,
    top: baseTop,
  }))

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const { left, top } = clampToViewport(baseLeft, baseTop, rect.width, rect.height)
    setStyle((s) => ({ ...s, left, top }))
  }, [baseLeft, baseTop])

  return (
    <div ref={ref} className={tooltipContentClass} style={style}>
      {children}
    </div>
  )
}

function TooltipContent({
  development,
  costKnowledge,
  knowledgeBreakdown,
  daysToCompleteThisDev,
  totalBuildDays,
}: TooltipContentProps) {
  const categoryLabel = DOMAIN_LABELS[development.domain]
  const colorClass = domainColor[development.domain]
  const knowledgePerDay =
    knowledgeBreakdown?.effective ?? DEFAULT_KNOWLEDGE_PER_DAY
  const costDays =
    costKnowledge != null ? Math.round(costKnowledge / knowledgePerDay) : undefined
  const daysForLandstraad =
    typeof daysToCompleteThisDev === "number"
      ? daysToCompleteThisDev
      : typeof totalBuildDays === "number"
        ? totalBuildDays
        : costDays ?? 0
  const landstraadPhrase = getLandstraadWindowPhrase(daysForLandstraad)
  return (
    <>
      <div className="px-3 py-2 border-b border-zinc-700/80 bg-zinc-800/90">
        <div className="flex items-center gap-2">
          <span className="text-zinc-100 font-semibold text-sm min-w-0 flex-1">{development.name}</span>
          {costDays != null && (
            <div
              id="knowledge-button"
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
        <div className={`text-xs ${colorClass}`}>{categoryLabel}</div>
      </div>
      {development.attributes && development.attributes.length > 0 ? (
        <div className="px-3 py-1.5 border-b border-zinc-700/50 space-y-1">
          <ul className="list-none space-y-0.5 text-zinc-300 text-xs">
            {development.attributes.map((attr, i) => {
              if (typeof attr === "string") {
                return (
                  <li key={i}>
                    <AttributeLine line={attr} />
                  </li>
                )
              }
              return (
                <li key={i}>
                  <AttributeLine line={attr.desc} />
                  {attr.target_effects_list.length > 0 && (
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                      {attr.target_effects_list.map((effect, j) => (
                        <li key={j}>
                          <AttributeLine line={effect} />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
      {development.desc ? (
        <div className="px-3 py-2 text-gray-400 text-xs italic leading-snug">
          {development.desc}
        </div>
      ) : null}
      {(landstraadPhrase || daysForLandstraad > 0) && (
        <div className="px-3 py-1 space-y-0.5 text-right">
          {landstraadPhrase && (
            <div className="text-xs text-zinc-500 tabular-nums">{landstraadPhrase}</div>
          )}
          <div className="flex justify-end">
            <MonthEstimation totalDays={daysForLandstraad} compact />
          </div>
        </div>
      )}
    </>
  )
}

export default function DevelopmentDetailTooltip({
  development,
  followCursor,
  anchorRect,
  costKnowledge,
  knowledgeBreakdown,
  daysToCompleteThisDev,
  totalBuildDays,
}: DevelopmentDetailTooltipProps) {
  const costProps = { costKnowledge, knowledgeBreakdown, daysToCompleteThisDev, totalBuildDays }
  if (followCursor) {
    return createPortal(
      <FollowCursorTooltip x={followCursor.x} y={followCursor.y}>
        <TooltipContent development={development} {...costProps} />
      </FollowCursorTooltip>,
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
