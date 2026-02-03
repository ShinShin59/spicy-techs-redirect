import { create } from "zustand"
import { persist } from "zustand/middleware"

/** Persist key for UI store (localStorage); used by debug reset. */
export const UI_STORAGE_KEY = "spicy-techs-ui"

const DEFAULT_VOLUME = 50

interface UIStore {
  volume: number
  muted: boolean
  setVolume: (value: number) => void
  setMuted: (muted: boolean) => void
  toggleMuted: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      volume: DEFAULT_VOLUME,
      muted: false,
      setVolume: (value) =>
        set({ volume: Math.max(0, Math.min(100, Math.round(value))) }),
      setMuted: (muted) => set({ muted }),
      toggleMuted: () => set((s) => ({ muted: !s.muted })),
    }),
    { name: UI_STORAGE_KEY }
  )
)
