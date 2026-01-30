import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { MainBaseLayout, MainBaseState } from "./main-base"
import { mainBasesLayout, mainBasesState } from "./main-base"

export const FACTION_LABELS = ["harkonnen", "atreides", "ecaz", "smuggler", "vernius", "fremen", "corrino"];
export type FactionLabel = "harkonnen" | "atreides" | "ecaz" | "smuggler" | "vernius" | "fremen" | "corrino";

/** Coordonnées d'une cellule de bâtiment */
export interface BuildingCoords {
  rowIndex: number
  groupIndex: number
  cellIndex: number
}

/** Ordre des bâtiments par faction */
export type BuildingOrderState = Record<FactionLabel, BuildingCoords[]>

/** État initial de l'ordre des bâtiments (vide pour chaque faction) */
const initialBuildingOrder: BuildingOrderState = {
  harkonnen: [],
  atreides: [],
  ecaz: [],
  smuggler: [],
  vernius: [],
  fremen: [],
  corrino: [],
}

interface MainStore {
  selectedFaction: FactionLabel
  setSelectedFaction: (faction: FactionLabel) => void
  mainBaseState: Record<FactionLabel, MainBaseState>
  buildingOrder: BuildingOrderState
  setMainBaseCell: (rowIndex: number, groupIndex: number, cellIndex: number, buildingId: string | null) => void
}

export const useMainStore = create<MainStore>()(
  persist(
    (set, get) => ({
      selectedFaction: "atreides",
      setSelectedFaction: (faction) => set({ selectedFaction: faction }),
      mainBaseState: mainBasesState,
      buildingOrder: initialBuildingOrder,
      setMainBaseCell: (rowIndex, groupIndex, cellIndex, buildingId) => {
        const { selectedFaction, mainBaseState, buildingOrder } = get()
        const factionState = mainBaseState[selectedFaction]
        const row = factionState[rowIndex]
        const group = row[groupIndex]
        const newGroup = [...group]
        newGroup[cellIndex] = buildingId
        const newRow = row.map((g, i) => (i === groupIndex ? newGroup : g))
        const newFactionState = factionState.map((r, i) => (i === rowIndex ? newRow : r))

        // Gestion de l'ordre des bâtiments
        const factionOrder = buildingOrder[selectedFaction]
        // Retirer l'ancienne entrée pour cette cellule (si elle existe)
        const filteredOrder = factionOrder.filter(
          (coord) => !(coord.rowIndex === rowIndex && coord.groupIndex === groupIndex && coord.cellIndex === cellIndex)
        )
        // Si on ajoute un bâtiment, l'ajouter à la fin de l'ordre
        const newFactionOrder = buildingId !== null
          ? [...filteredOrder, { rowIndex, groupIndex, cellIndex }]
          : filteredOrder

        set({
          mainBaseState: {
            ...mainBaseState,
            [selectedFaction]: newFactionState,
          },
          buildingOrder: {
            ...buildingOrder,
            [selectedFaction]: newFactionOrder,
          },
        })
      },
    }),
    {
      name: "spicy-techs-main-store",
      version: 2,
      migrate: (persistedState, version) => {
        // Migration depuis l'ancienne version ou données corrompues
        if (version === 0 || !persistedState) {
          return { selectedFaction: "atreides", mainBaseState: mainBasesState, buildingOrder: initialBuildingOrder }
        }
        const state = persistedState as MainStore
        // Vérifie que mainBaseState est au bon format
        if (!state.mainBaseState || typeof state.mainBaseState !== "object") {
          return { ...state, mainBaseState: mainBasesState, buildingOrder: initialBuildingOrder }
        }
        // Vérifie chaque faction
        for (const faction of FACTION_LABELS) {
          const factionState = state.mainBaseState[faction as FactionLabel]
          if (!Array.isArray(factionState)) {
            return { ...state, mainBaseState: mainBasesState, buildingOrder: initialBuildingOrder }
          }
        }
        // Migration v1 -> v2 : ajouter buildingOrder si absent
        if (version === 1 || !state.buildingOrder) {
          return { ...state, buildingOrder: initialBuildingOrder }
        }
        return state
      },
    }
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

/** Retourne la liste des IDs de bâtiments utilisés dans la base actuelle */
export function useUsedBuildingIds(): string[] {
  const mainBaseState = useCurrentMainBaseState()
  const usedIds: string[] = []

  // Vérification défensive : mainBaseState doit être un tableau
  if (!Array.isArray(mainBaseState)) {
    return usedIds
  }

  for (const row of mainBaseState) {
    if (!Array.isArray(row)) continue
    for (const group of row) {
      if (!Array.isArray(group)) continue
      for (const cell of group) {
        if (cell !== null) {
          usedIds.push(cell)
        }
      }
    }
  }
  return usedIds
}

/** Retourne l'ordre des bâtiments pour la faction actuelle */
export function useCurrentBuildingOrder(): BuildingCoords[] {
  const selectedFaction = useMainStore((state) => state.selectedFaction)
  const buildingOrder = useMainStore((state) => state.buildingOrder)
  return buildingOrder[selectedFaction] ?? []
}

/** Retourne le numéro d'ordre d'un bâtiment (1-based) ou null si non trouvé */
export function getBuildingOrderNumber(
  order: BuildingCoords[],
  rowIndex: number,
  groupIndex: number,
  cellIndex: number
): number | null {
  const index = order.findIndex(
    (coord) => coord.rowIndex === rowIndex && coord.groupIndex === groupIndex && coord.cellIndex === cellIndex
  )
  return index >= 0 ? index + 1 : null
}

