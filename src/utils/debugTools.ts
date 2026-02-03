import { getBuildStateObject, MAIN_STORE_PERSIST_KEY } from "@/store"
import { UI_STORAGE_KEY } from "@/store/ui"

/** Dev tool: no-op function (e.g. debug, reset). */
export type DebugToolFn = () => void

/** Registry of dev tools exposed on window for console use. Add entries to plug in new tools. */
export const DEBUG_TOOLS: Record<string, DebugToolFn> = {
  /** Log current build state as JSON (e.g. in console: debug()). */
  debug() {
    const state = getBuildStateObject()
    console.log("[spicy-techs] build state:", JSON.stringify(state, null, 2))
  },

  /**
   * Reset app data like "clear site data": clears persisted build + UI state from localStorage
   * and reloads the page so the app starts fresh.
   * Call from console: reset()
   */
  reset() {
    clearPersistedDataAndReload()
  },
}

/**
 * Clears all persisted app data (builds, settings) from localStorage and reloads the page.
 * Used by the "Clear data" button in settings and by the debug reset() console command.
 */
export function clearPersistedDataAndReload(): void {
  try {
    localStorage.removeItem(MAIN_STORE_PERSIST_KEY)
    localStorage.removeItem(UI_STORAGE_KEY)
    window.location.reload()
  } catch (e) {
    console.error("[spicy-techs] clear data failed:", e)
  }
}

/** Attach all registered debug tools to window so they can be called from the console (e.g. debug(), reset()). */
export function installDebugTools(): void {
  if (typeof window === "undefined") return
  const w = window as unknown as Record<string, DebugToolFn | undefined>
  for (const [name, fn] of Object.entries(DEBUG_TOOLS)) {
    w[name] = fn
  }
}
