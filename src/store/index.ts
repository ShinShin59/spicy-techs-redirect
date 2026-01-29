import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { MainBaseLayout, MainBaseState } from "./main-base"
import { mainBasesLayout, mainBasesState } from "./main-base"

export const FACTION_LABELS = ["harkonnen", "atreides", "ecaz", "smuggler", "vernius"];
export type FactionLabel = "harkonnen" | "atreides" | "ecaz" | "smuggler" | "vernius";

interface MainStore {
  selectedFaction: FactionLabel
  setSelectedFaction: (faction: FactionLabel) => void
  mainBaseState: Record<FactionLabel, MainBaseState>
  toggleMainBaseCell: (rowIndex: number, groupIndex: number, cellIndex: number) => void
}

export const useMainStore = create<MainStore>()(
  persist(
    (set, get) => ({
      selectedFaction: "atreides",
      setSelectedFaction: (faction) => set({ selectedFaction: faction }),
      mainBaseState: mainBasesState,
      toggleMainBaseCell: (rowIndex, groupIndex, cellIndex) => {
        const { selectedFaction, mainBaseState } = get()
        const factionState = mainBaseState[selectedFaction]
        const row = factionState[rowIndex]
        const group = row[groupIndex]
        const newCellValue = !group[cellIndex]
        const newGroup = [...group]
        newGroup[cellIndex] = newCellValue
        const newRow = row.map((g, i) => (i === groupIndex ? newGroup : g))
        const newFactionState = factionState.map((r, i) => (i === rowIndex ? newRow : r))
        set({
          mainBaseState: {
            ...mainBaseState,
            [selectedFaction]: newFactionState,
          },
        })
      },
    }),
    { name: "spicy-techs-main-store" }
  )
)

export function useCurrentMainBaseLayout(): MainBaseLayout {
  const selectedFaction = useMainStore((state) => state.selectedFaction)
  return mainBasesLayout[selectedFaction]
}

export function useCurrentMainBaseState(): MainBaseState {
  const selectedFaction = useMainStore((state) => state.selectedFaction)
  const mainBaseState = useMainStore((state) => state.mainBaseState)
  return mainBaseState[selectedFaction]
}

