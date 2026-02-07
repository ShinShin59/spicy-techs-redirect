import { useSyncExternalStore } from "react"

/**
 * Subscribe to a media query. Returns true when the query matches.
 * Re-renders when the match changes (e.g. resize, orientation).
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia(query)
      mq.addEventListener("change", onStoreChange)
      return () => mq.removeEventListener("change", onStoreChange)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}

/** True when viewport width <= 1024px (mobile breakpoint). */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 1024px)")
}

/** True when device is portrait (height > width). */
export function useIsPortrait(): boolean {
  return useMediaQuery("(orientation: portrait)")
}
