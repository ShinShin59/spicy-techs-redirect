import { useEffect, useRef, useState, type ReactNode } from "react"
import { useIsPortrait } from "@/hooks/useMediaQuery"

interface DrawerProps {
  side: "left" | "right"
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Optional aria-label for the panel */
  "aria-label"?: string
}

export default function Drawer({
  side,
  open,
  onClose,
  children,
  "aria-label": ariaLabel,
}: DrawerProps) {
  const [entered, setEntered] = useState(false)
  const isPortrait = useIsPortrait()
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      queueMicrotask(() => setEntered(false))
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true))
      })
      return () => cancelAnimationFrame(raf)
    }
    queueMicrotask(() => setEntered(false))
  }, [open])

  useEffect(() => {
    if (open) {
      restoreFocusRef.current = document.activeElement as HTMLElement | null
      const raf = requestAnimationFrame(() => {
        closeButtonRef.current?.focus()
      })
      return () => {
        cancelAnimationFrame(raf)
        ;(restoreFocusRef.current as HTMLElement | null)?.focus()
      }
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
        return
      }
      if (e.key === "Tab") {
        const panel = panelRef.current
        if (!panel) return
        const focusable = panel.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const list = Array.from(focusable) as HTMLElement[]
        if (list.length === 0) return
        const idx = list.indexOf(document.activeElement as HTMLElement)
        const next = e.shiftKey
          ? (idx <= 0 ? list[list.length - 1] : list[idx - 1])
          : idx >= list.length - 1
            ? list[0]
            : list[idx + 1]
        e.preventDefault()
        next?.focus()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  if (!open) return null

  const panelClass =
    side === "left"
      ? `drawer-panel drawer-panel-left ${entered ? "open" : ""}`
      : `drawer-panel drawer-panel-right ${entered ? "open" : ""}`

  return (
    <div
      className="fixed inset-0 z-40 flex"
      aria-modal="true"
      role="dialog"
      aria-label={ariaLabel}
    >
      {/* Backdrop */}
      <div
        className="drawer-backdrop absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      {/* Panel */}
      <div
        ref={panelRef}
        className={`${panelClass} relative z-10 h-full bg-zinc-900 border-zinc-700 shadow-xl overflow-hidden ${isPortrait ? "w-[min(320px,85vw)] max-w-full overflow-y-auto" : "w-full"
          } ${side === "left" ? "border-r" : "border-l"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="absolute top-1 right-1 z-20 p-1.5 rounded bg-transparent text-[#a67c00] hover:bg-black/20 transition-colors cursor-pointer flex items-center justify-center"
          aria-label="Close"
          title="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  )
}
