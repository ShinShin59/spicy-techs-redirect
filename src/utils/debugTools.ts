import { getBuildStateObject, useMainStore, MAIN_STORE_PERSIST_KEY } from "@/store"
import { useUIStore, UI_STORAGE_KEY } from "@/store/ui"

/** Max number of recent state-change entries to keep for bug reports. */
const ACTION_LOG_MAX = 50

/** Recent state changes: which top-level store keys were updated. */
const actionLog: { t: number; keys: string[] }[] = []

/** Subscribe to main store and record which keys change on each update. */
function installActionLog() {
  if (typeof window === "undefined") return
  let prev: Record<string, unknown> = {}
  let first = true
  useMainStore.subscribe((state) => {
    if (first) {
      first = false
      prev = { ...state } as unknown as Record<string, unknown>
      return
    }
    const s = state as unknown as Record<string, unknown>
    const keys = Object.keys(s).filter(
      (k) =>
        k !== "lastSavedSnapshot" &&
        typeof s[k] !== "function" &&
        prev[k] !== s[k]
    )
    if (keys.length > 0) {
      actionLog.push({ t: Date.now(), keys })
      if (actionLog.length > ACTION_LOG_MAX) actionLog.shift()
    }
    prev = { ...state } as unknown as Record<string, unknown>
  })
}

/** Collect device/browser info useful for bug reports. */
function getDeviceInfo(): Record<string, unknown> {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return { error: "Not in browser" }
  }
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    languages: navigator.languages,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    devicePixelRatio: window.devicePixelRatio,
    screen: { w: window.screen?.width, h: window.screen?.height },
    touchSupport: "ontouchstart" in window,
    cookieEnabled: navigator.cookieEnabled,
    online: navigator.onLine,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    localStorage: (() => {
      try {
        return { available: !!window.localStorage, length: window.localStorage.length }
      } catch {
        return { available: false }
      }
    })(),
  }
}

/** Dev tool: no-op function (e.g. debug, reset). */
export type DebugToolFn = () => void

/** Full bug report payload: state, actions, device info. */
export interface BugReport {
  timestamp: string
  state: ReturnType<typeof getBuildStateObject>
  uiState: { volume: number; muted: boolean; lightweightMode: boolean }
  actionLog: { t: number; keys: string[] }[]
  deviceInfo: ReturnType<typeof getDeviceInfo>
}

/** Collect full bug report for sharing or pasting into issues. */
export function collectBugReport(): BugReport {
  return {
    timestamp: new Date().toISOString(),
    state: getBuildStateObject(),
    uiState: useUIStore.getState(),
    actionLog: [...actionLog],
    deviceInfo: getDeviceInfo(),
  }
}

/** Run debug: copy bug report to clipboard and print to console. */
export async function runDebug(): Promise<void> {
  const report = collectBugReport()
  const json = JSON.stringify(report, null, 2)
  console.log("[spicy-techs] bug report:", report)
  console.log("[spicy-techs] JSON (copied to clipboard):", json)
  await navigator.clipboard.writeText(json)
}

/** Registry of dev tools exposed on window for console use. Add entries to plug in new tools. */
export const DEBUG_TOOLS: Record<string, DebugToolFn> = {
  /** Copy bug report to clipboard and log to console. */
  debug() {
    runDebug()
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
  installActionLog()
  const w = window as unknown as Record<string, DebugToolFn | undefined>
  for (const [name, fn] of Object.entries(DEBUG_TOOLS)) {
    w[name] = fn
  }
}
