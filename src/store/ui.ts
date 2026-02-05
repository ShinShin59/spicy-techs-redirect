import { create } from "zustand"
import { persist } from "zustand/middleware"

/** Persist key for UI store (localStorage); used by debug reset. */
export const UI_STORAGE_KEY = "spicy-techs-ui"

const DEFAULT_VOLUME = 50

/**
 * Auto-detect low-end devices for first-time visitors.
 * If no persisted UI state exists, default lightweightMode to true on weaker hardware.
 */
function detectDefaultLightweightMode(): boolean {
  if (typeof window === "undefined") return false
  // If the user already has persisted settings, don't override — zustand hydrate handles it
  try {
    if (localStorage.getItem(UI_STORAGE_KEY)) return false
  } catch { /* localStorage unavailable */ }

  const nav = navigator as { hardwareConcurrency?: number; deviceMemory?: number }
  const lowCores = (nav.hardwareConcurrency ?? 8) <= 4
  const lowMemory = (nav.deviceMemory ?? 8) <= 4
  return lowCores || lowMemory
}

interface UIStore {
  volume: number
  muted: boolean
  lightweightMode: boolean
  setVolume: (value: number) => void
  setMuted: (muted: boolean) => void
  toggleMuted: () => void
  setLightweightMode: (value: boolean) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      volume: DEFAULT_VOLUME,
      muted: false,
      lightweightMode: detectDefaultLightweightMode(),
      setVolume: (value) =>
        set({ volume: Math.max(0, Math.min(100, Math.round(value))) }),
      setMuted: (muted) => set({ muted }),
      toggleMuted: () => set((s) => ({ muted: !s.muted })),
      setLightweightMode: (value) => set({ lightweightMode: value }),
    }),
    { name: UI_STORAGE_KEY }
  )
)
