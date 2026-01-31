import { type MouseEvent } from "react"

interface OrderBadgeProps {
  orderNumber: number
  onIncrement: () => void
  onDecrement: () => void
}

/**
 * Clickable order badge displayed on slots.
 * Left-click: increment order (move later in sequence)
 * Right-click: decrement order (move earlier in sequence)
 */
export default function OrderBadge({ orderNumber, onIncrement, onDecrement }: OrderBadgeProps) {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    onIncrement()
  }

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDecrement()
  }

  return (
    <button
      type="button"
      data-order-badge
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className="absolute top-0.5 right-1 z-10 text-xs font-bold text-white bg-black/60 px-1 hover:bg-black/80 cursor-pointer pointer-events-auto"
    >
      {orderNumber}
    </button>
  )
}
