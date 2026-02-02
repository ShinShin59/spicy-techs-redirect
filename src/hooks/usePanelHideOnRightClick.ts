import { useCallback } from "react"
import { playMenuToggleSound } from "@/utils/sound"

/**
 * Returns props to attach to a toggleable panel's background so that right-click
 * on empty background hides the panel. Right-click on a slot (element with
 * data-panel-slot) does not hide the panel so slot actions (e.g. delete) can run.
 */
export function usePanelHideOnRightClick(
  toggle: () => void,
  isOpen: boolean
): { onContextMenu: (e: React.MouseEvent) => void } {
  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!isOpen) return
      // Don't hide when right-clicking on a slot (marked with data-panel-slot)
      const slot = (e.target as HTMLElement).closest("[data-panel-slot]")
      if (slot && e.currentTarget.contains(slot)) return
      e.preventDefault()
      toggle()
      playMenuToggleSound(false)
    },
    [toggle, isOpen]
  )
  return { onContextMenu }
}
