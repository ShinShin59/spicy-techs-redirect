import { create } from "zustand"
import { persist } from "zustand/middleware"

const UI_STORAGE_KEY = "spicy-techs-ui"

interface UIStore {
  /** Whether the build list sidebar is open. */
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    { name: UI_STORAGE_KEY }
  )
)
