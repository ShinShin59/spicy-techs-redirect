import { create } from "zustand"
import { persist } from "zustand/middleware"

/** Persist key for UI store (localStorage); used by debug reset. */
export const UI_STORAGE_KEY = "spicy-techs-ui"

const DEFAULT_VOLUME = 50

/** Mobile breakpoint: 1024px. */
const MOBILE_BREAKPOINT_PX = 1024

function detectIsMobile(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`).matches
}

/**
 * Auto-detect low-end devices for first-time visitors.
 * If no persisted UI state exists, default lightweightMode to true on weaker hardware.
 */
function detectDefaultLightweightMode(): boolean {
  if (typeof window === "undefined") return false
  try {
    if (localStorage.getItem(UI_STORAGE_KEY)) return false
  } catch { /* localStorage unavailable */ }

  const nav = navigator as { hardwareConcurrency?: number; deviceMemory?: number }
  const lowCores = (nav.hardwareConcurrency ?? 8) <= 4
  const lowMemory = (nav.deviceMemory ?? 8) <= 4
  return lowCores || lowMemory
}

/**
 * For first-time mobile visitors: default lightweightMode and muted to true.
 */
function detectMobileDefaults(): { lightweightMode: boolean; muted: boolean } {
  if (typeof window === "undefined") return { lightweightMode: false, muted: false }
  try {
    if (localStorage.getItem(UI_STORAGE_KEY)) return { lightweightMode: false, muted: false }
  } catch { return { lightweightMode: false, muted: false } }

  const isMobile = detectIsMobile()
  const lowEnd = detectDefaultLightweightMode()
  return {
    lightweightMode: isMobile || lowEnd,
    muted: isMobile,
  }
}

/** 0=developments, 1=councillors, 2=mainBase, 3=units, 4=armory, 5=operations */
export type MobileActiveGroup = 0 | 1 | 2 | 3 | 4 | 5

interface UIStore {
  volume: number
  muted: boolean
  lightweightMode: boolean
  mobileActiveGroup: MobileActiveGroup
  mobileMetadataOpen: boolean
  setVolume: (value: number) => void
  setMuted: (muted: boolean) => void
  toggleMuted: () => void
  setLightweightMode: (value: boolean) => void
  setMobileActiveGroup: (group: MobileActiveGroup) => void
  setMobileMetadataOpen: (open: boolean) => void
}

const mobileDefaults = detectMobileDefaults()

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      volume: DEFAULT_VOLUME,
      muted: mobileDefaults.muted,
      lightweightMode: mobileDefaults.lightweightMode,
      mobileActiveGroup: 0,
      mobileMetadataOpen: false,
      setVolume: (value) =>
        set({ volume: Math.max(0, Math.min(100, Math.round(value))) }),
      setMuted: (muted) => set({ muted }),
      toggleMuted: () => set((s) => ({ muted: !s.muted })),
      setLightweightMode: (value) => set({ lightweightMode: value }),
      setMobileActiveGroup: (group) => set({ mobileActiveGroup: group }),
      setMobileMetadataOpen: (open) => set({ mobileMetadataOpen: open }),
    }),
    {
      name: UI_STORAGE_KEY,
      partialize: (s) => ({
        volume: s.volume,
        muted: s.muted,
        lightweightMode: s.lightweightMode,
        mobileActiveGroup: s.mobileActiveGroup,
      }),
    }
  )
)
