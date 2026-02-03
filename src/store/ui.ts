import { create } from "zustand"
import { persist } from "zustand/middleware"

const UI_STORAGE_KEY = "spicy-techs-ui"

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
    {
      name: UI_STORAGE_KEY,
      migrate: (persisted: unknown) => {
        const p = persisted as Record<string, unknown> | null
        if (!p || typeof p !== "object") {
          return {
            volume: DEFAULT_VOLUME,
            muted: false,
          } as UIStore
        }
        const { sidebarOpen: _removed, ...rest } = p
        const volume =
          typeof rest.volume === "number" ? rest.volume : DEFAULT_VOLUME
        const muted = typeof rest.muted === "boolean" ? rest.muted : false
        return { ...rest, volume, muted } as UIStore
      },
    }
  )
)
