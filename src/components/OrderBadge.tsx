import { type MouseEvent, type ReactNode } from "react"

/** Shared style for order badges (Main Base and Developments). Single source of truth. */
export const ORDER_BADGE_CLASS =
  "absolute top-0.5 right-1 z-10 text-xs text-white bg-black/70 px-1.5 py-0.5 rounded-md ring-1 ring-white/15 shadow-sm min-w-[1.25rem] text-center"

/** Compact style: no border, smaller text, centered, lower opacity (e.g. Developments picker). */
const ORDER_BADGE_COMPACT_CLASS =
  "absolute top-0.5 right-1 z-10 text-[10px] text-white bg-black/40 px-1 py-0.5 rounded min-w-[1rem] flex items-center justify-center"

const ORDER_BADGE_INTERACTIVE_CLASS = "hover:bg-black/80 cursor-pointer pointer-events-auto"
const ORDER_BADGE_STATIC_CLASS = "pointer-events-none"

interface OrderBadgeProps {
  /** Display this number when provided */
  orderNumber?: number
  /** When orderNumber is not used, display children (e.g. ✓ for developments) */
  children?: ReactNode
  /** When both provided: left-click increments, right-click decrements. When omitted: display-only. */
  onIncrement?: () => void
  onDecrement?: () => void
  /** Use compact style: no border, smaller text, centered, lower opacity */
  compact?: boolean
}

/**
 * Order badge for slots (Main Base and Developments).
 * Interactive when onIncrement/onDecrement are provided; display-only otherwise.
 * Content: orderNumber if set, otherwise children.
 */
export default function OrderBadge({
  orderNumber,
  children,
  onIncrement,
  onDecrement,
  compact = false,
}: OrderBadgeProps) {
  const interactive = onIncrement != null && onDecrement != null
  const content = orderNumber != null ? orderNumber : children
  const badgeClass = compact ? ORDER_BADGE_COMPACT_CLASS : ORDER_BADGE_CLASS

  if (interactive) {
    const handleClick = (e: MouseEvent) => {
      e.stopPropagation()
      onIncrement!()
    }
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onDecrement!()
    }
    return (
      <button
        type="button"
        data-order-badge
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`${badgeClass} ${ORDER_BADGE_INTERACTIVE_CLASS}`}
      >
        {content}
      </button>
    )
  }

  return (
    <span className={`${badgeClass} ${ORDER_BADGE_STATIC_CLASS}`}>
      {content}
    </span>
  )
}
