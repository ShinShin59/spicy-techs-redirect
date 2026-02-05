import { useState, useMemo, useEffect, startTransition } from "react"

/**
 * Tooltip state for panels that have a selector popup (Armory, Units, Councillors, MainBase).
 * When the selector is open, the panel tooltip is cleared and hidden so it doesn't overlap.
 *
 * @param selectorOpen - true when the panel's selector/popup is open
 * @returns [tooltip, setTooltip, showTooltip] - showTooltip is true only when tooltip is set AND selector is closed
 */
export function usePanelTooltip<T>(selectorOpen: boolean): [T | null, (v: T | null) => void, boolean] {
  const [tooltip, setTooltip] = useState<T | null>(null)

  // Wrapper for setTooltip that prevents setting tooltip when selector is open
  const setTooltipWithGuard = useMemo(() => {
    return (v: T | null) => {
      // If selector is open, don't allow setting tooltip (it will be hidden anyway)
      if (selectorOpen) {
        return
      }
      setTooltip(v)
    }
  }, [selectorOpen])

  // Clear tooltip when selector opens - use startTransition to mark as non-urgent update
  // This avoids cascading renders while still clearing stale tooltip state
  useEffect(() => {
    if (selectorOpen && tooltip !== null) {
      startTransition(() => {
        setTooltip(null)
      })
    }
  }, [selectorOpen, tooltip])

  const showTooltip = tooltip !== null && !selectorOpen
  return [tooltip, setTooltipWithGuard, showTooltip]
}
