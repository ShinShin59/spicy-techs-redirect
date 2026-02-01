import { useState, useEffect } from "react"

/**
 * Tooltip state for panels that have a selector popup (Armory, Units, Councillors, MainBase).
 * When the selector is open, the panel tooltip is cleared and hidden so it doesn't overlap.
 *
 * @param selectorOpen - true when the panel's selector/popup is open
 * @returns [tooltip, setTooltip, showTooltip] - showTooltip is true only when tooltip is set AND selector is closed
 */
export function usePanelTooltip<T>(selectorOpen: boolean): [T | null, (v: T | null) => void, boolean] {
  const [tooltip, setTooltip] = useState<T | null>(null)

  useEffect(() => {
    if (selectorOpen) setTooltip(null)
  }, [selectorOpen])

  const showTooltip = tooltip !== null && !selectorOpen
  return [tooltip, setTooltip, showTooltip]
}
