import { createPortal } from "react-dom"

const DEFAULT_OFFSET = 8

export interface TooltipWrapperProps {
  anchorRect: { left: number; top: number; width: number; height: number }
  /** Offset from anchor element (default 8) */
  offset?: number
  maxWidth?: number
  children: React.ReactNode
  /** Additional classes for the wrapper (e.g. custom borders) */
  className?: string
}

/**
 * Shared tooltip container: fixed positioning, max z-index so tooltips
 * always appear above sidebars/modals. Renders via Portal to document.body
 * to escape parent stacking contexts (overflow, z-index).
 */
export default function TooltipWrapper({
  anchorRect,
  offset = DEFAULT_OFFSET,
  maxWidth = 320,
  children,
  className = "",
}: TooltipWrapperProps) {
  const style: React.CSSProperties = {
    position: "fixed",
    left: anchorRect.left + anchorRect.width + offset,
    top: anchorRect.top,
    maxWidth,
  }

  const content = (
    <div
      className={`z-9999 bg-linear-to-b from-black/70 to-black/85 backdrop-blur-md border border-white/10 shadow-lg pointer-events-none overflow-hidden ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  )

  return createPortal(content, document.body)
}
