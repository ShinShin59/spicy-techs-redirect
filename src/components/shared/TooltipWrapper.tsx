import { createPortal } from "react-dom"
import { useLayoutEffect, useRef, useState } from "react"

const DEFAULT_OFFSET = 8
const EDGE_BUFFER = 8

export interface TooltipWrapperProps {
  anchorRect: { left: number; top: number; width: number; height: number }
  /** Offset from anchor element (default 8) */
  offset?: number
  maxWidth?: number
  children: React.ReactNode
  /** Additional classes for the wrapper (e.g. custom borders) */
  className?: string
}

function clampToViewport(
  left: number,
  top: number,
  width: number,
  height: number
): { left: number; top: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Clamp horizontal: prefer right of anchor, flip to left if no room
  let clampedLeft = left
  if (clampedLeft + width > vw - EDGE_BUFFER) {
    clampedLeft = vw - width - EDGE_BUFFER
  }
  if (clampedLeft < EDGE_BUFFER) {
    clampedLeft = EDGE_BUFFER
  }

  // Clamp vertical
  let clampedTop = top
  if (clampedTop + height > vh - EDGE_BUFFER) {
    clampedTop = vh - height - EDGE_BUFFER
  }
  if (clampedTop < EDGE_BUFFER) {
    clampedTop = EDGE_BUFFER
  }

  return { left: clampedLeft, top: clampedTop }
}

/**
 * Shared tooltip container: fixed positioning, max z-index so tooltips
 * always appear above sidebars/modals. Renders via Portal to document.body
 * to escape parent stacking contexts (overflow, z-index).
 * Clamps position to viewport to avoid overflow on mobile and small screens.
 */
export default function TooltipWrapper({
  anchorRect,
  offset = DEFAULT_OFFSET,
  maxWidth = 320,
  children,
  className = "",
}: TooltipWrapperProps) {
  const ref = useRef<HTMLDivElement>(null)
  const baseLeft = anchorRect.left + anchorRect.width + offset
  const baseTop = anchorRect.top

  const [style, setStyle] = useState<React.CSSProperties>(() => ({
    position: "fixed" as const,
    left: baseLeft,
    top: baseTop,
    maxWidth,
  }))

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const { left, top } = clampToViewport(
      baseLeft,
      baseTop,
      rect.width,
      rect.height
    )

    setStyle((s) => ({
      ...s,
      left,
      top,
    }))
  }, [anchorRect.left, anchorRect.top, anchorRect.width, baseLeft, baseTop])

  const content = (
    <div
      ref={ref}
      className={`z-9999 bg-linear-to-b from-black/70 to-black/85 backdrop-blur-md border border-white/10 shadow-lg pointer-events-none overflow-hidden ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  )

  return createPortal(content, document.body)
}
