import type { MouseEvent, ReactNode } from "react"
import { KNOWLEDGE_ICON_PATH } from "@/utils/assetPaths"
import type { KnowledgeModifierBreakdown } from "@/utils/knowledge"

const BADGE_BASE_CLASS =
  "absolute top-0.5 left-1 z-10 text-[10px] text-white px-1.5 py-0.5 rounded flex items-center justify-center min-w-[1.5rem] tabular-nums"

const BADGE_STATIC_CLASS = "bg-black/60 pointer-events-none"
const BADGE_INTERACTIVE_CLASS = "bg-black/70 hover:bg-black/80 cursor-pointer pointer-events-auto"

interface KnowledgeBadgeProps {
  /** Effective Knowledge/day value to display. */
  value: number
  /** Optional detailed breakdown, used by parent tooltip. */
  breakdown?: KnowledgeModifierBreakdown
  /** When provided, left-click increments, right-click decrements. */
  onIncrement?: () => void
  onDecrement?: () => void
  /** Optional children to render instead of the numeric value. */
  children?: ReactNode
}

export default function KnowledgeBadge({
  value,
  breakdown: _breakdown, // reserved for future inline display / tooltip
  onIncrement,
  onDecrement,
  children,
}: KnowledgeBadgeProps) {
  // _breakdown is reserved for future use
  void _breakdown
  const interactive = onIncrement != null && onDecrement != null
  const content = children ?? Math.round(value)
  const baseClass = `${BADGE_BASE_CLASS} ${interactive ? BADGE_INTERACTIVE_CLASS : BADGE_STATIC_CLASS
    }`

  if (!interactive) {
    return (
      <span className={baseClass} aria-label="Knowledge per day">
        <span
          className="inline-block w-3 h-3 mr-1 bg-center bg-no-repeat bg-contain"
          style={{ backgroundImage: `url(${KNOWLEDGE_ICON_PATH})` }}
          aria-hidden
        />
        {content}
      </span>
    )
  }

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    onIncrement?.()
  }

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDecrement?.()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={baseClass}
      aria-label="Adjust Knowledge per day for this development"
      data-knowledge-badge
    >
      <span
        className="inline-block w-3 h-3 mr-1 bg-center bg-no-repeat bg-contain"
        style={{ backgroundImage: `url(${KNOWLEDGE_ICON_PATH})` }}
        aria-hidden
      />
      {content}
    </button>
  )
}

