import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { SharedBuildPayload } from "../utils/mainBaseShare"
export { useUIStore } from "./ui"
import type { MainBaseLayout, MainBaseState } from "./main-base"
import { mainBasesLayout, mainBasesState } from "./main-base"

export const FACTION_LABELS = ["harkonnen", "atreides", "ecaz", "smuggler", "vernius", "fremen", "corrino"];
export type FactionLabel = "harkonnen" | "atreides" | "ecaz" | "smuggler" | "vernius" | "fremen" | "corrino";

/** Deep clone for serializable state (mainBaseState, buildingOrder). */
export function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x))
}

/** Building cell coordinates */
export interface BuildingCoords {
  rowIndex: number
  groupIndex: number
  cellIndex: number
}

/** Building order per faction */
export type BuildingOrderState = Record<FactionLabel, BuildingCoords[]>

/** Initial building order (empty per faction) */
const initialBuildingOrder: BuildingOrderState = {
  harkonnen: [],
  atreides: [],
  ecaz: [],
  smuggler: [],
  vernius: [],
  fremen: [],
  corrino: [],
}

/** Saved build (local list, id not in URL) */
export interface SavedBuild {
  id: string
  name: string
  createdAt: number
  selectedFaction: FactionLabel
  mainBaseState: Record<FactionLabel, MainBaseState>
  buildingOrder: BuildingOrderState
}

function generateBuildId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/** Snapshot to compare current state to last save (null = never saved) */
export type BuildSnapshot = string | null

/** Id of the saved build being edited (null = new / unsaved build) */
export type CurrentBuildId = string | null

interface MainStore {
  selectedFaction: FactionLabel
  mainBaseState: Record<FactionLabel, MainBaseState>
  buildingOrder: BuildingOrderState
  currentBuildName: string
  currentBuildId: CurrentBuildId
  savedBuilds: SavedBuild[]
  lastSavedSnapshot: BuildSnapshot
  setMainBaseCell: (rowIndex: number, groupIndex: number, cellIndex: number, buildingId: string | null) => void
  loadSharedBuild: (payload: SharedBuildPayload) => void
  setCurrentBuildName: (name: string) => void
  saveCurrentBuild: (name?: string) => void
  loadBuild: (id: string) => void
  deleteBuild: (id: string) => void
  renameBuild: (id: string, name: string) => void
  resetToDefault: () => void
  /** Saves current build if not empty, then switches to new faction with a fresh build and default name. */
  switchFaction: (faction: FactionLabel) => void
}

export function getBuildSnapshot(state: {
  selectedFaction: FactionLabel
  mainBaseState: Record<FactionLabel, MainBaseState>
  buildingOrder: BuildingOrderState
  currentBuildName: string
}): string {
  return JSON.stringify({
    selectedFaction: state.selectedFaction,
    mainBaseState: state.mainBaseState,
    buildingOrder: state.buildingOrder,
    currentBuildName: state.currentBuildName,
  })
}

/** Default build name: "faction N" with N = next number for that faction */
export function getDefaultBuildName(
  faction: FactionLabel,
  savedBuilds: SavedBuild[]
): string {
  const factionNumRegex = new RegExp(`^${faction}\\s+(\\d+)$`)
  const existingNums = savedBuilds
    .map((b) => b.name.match(factionNumRegex)?.[1])
    .filter(Boolean)
    .map((s) => parseInt(s!, 10))
  const nextNum = existingNums.length === 0 ? 1 : Math.max(...existingNums) + 1
  return `${faction} ${nextNum}`
}

/** Returns a unique name: if name exists (on other builds), appends " #1", " #2", etc. */
export function getUniqueBuildName(
  baseName: string,
  savedBuilds: SavedBuild[],
  excludeId?: string
): string {
  const others = savedBuilds.filter((b) => b.id !== excludeId)
  const exactOrWithNum = others.filter(
    (b) => b.name === baseName || b.name.startsWith(baseName + " #")
  )
  if (exactOrWithNum.length === 0) return baseName
  const suffix = baseName + " #"
  const nums = exactOrWithNum
    .filter((b) => b.name.startsWith(suffix))
    .map((b) => parseInt(b.name.slice(suffix.length), 10))
    .filter((n) => !Number.isNaN(n))
  const nextNum = nums.length === 0 ? 1 : Math.max(...nums) + 1
  return `${baseName} #${nextNum}`
}

const INITIAL_BUILD_NAME = "atreides 1"

/** True if the faction base has no buildings. */
export function isFactionBaseEmpty(
  mainBaseState: Record<FactionLabel, MainBaseState>,
  faction: FactionLabel
): boolean {
  const state = mainBaseState[faction]
  if (!state || !Array.isArray(state)) return true
  for (const row of state) {
    if (!Array.isArray(row)) continue
    for (const group of row) {
      if (!Array.isArray(group)) continue
      for (const cell of group) {
        if (cell !== null) return false
      }
    }
  }
  return true
}

export const useMainStore = create<MainStore>()(
  persist(
    (set, get) => ({
      selectedFaction: "atreides",
      switchFaction: (faction) => {
        const g = get()
        if (faction === g.selectedFaction) return
        if (!isFactionBaseEmpty(g.mainBaseState, g.selectedFaction)) {
          get().saveCurrentBuild()
        }
        set({
          selectedFaction: faction,
          currentBuildId: null,
          currentBuildName: getDefaultBuildName(faction, get().savedBuilds),
        })
      },
      mainBaseState: mainBasesState,
      buildingOrder: initialBuildingOrder,
      currentBuildName: INITIAL_BUILD_NAME,
      currentBuildId: null,
      savedBuilds: [],
      lastSavedSnapshot: null,
      setMainBaseCell: (rowIndex, groupIndex, cellIndex, buildingId) => {
        const { selectedFaction, mainBaseState, buildingOrder } = get()
        const factionState = mainBaseState[selectedFaction]
        const row = factionState[rowIndex]
        const group = row[groupIndex]
        const newGroup = [...group]
        newGroup[cellIndex] = buildingId
        const newRow = row.map((g, i) => (i === groupIndex ? newGroup : g))
        const newFactionState = factionState.map((r, i) => (i === rowIndex ? newRow : r))

        const factionOrder = buildingOrder[selectedFaction]
        const filteredOrder = factionOrder.filter(
          (coord) => !(coord.rowIndex === rowIndex && coord.groupIndex === groupIndex && coord.cellIndex === cellIndex)
        )
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
        get().saveCurrentBuild()
      },
      loadSharedBuild: (payload) => {
        const { mainBaseState, buildingOrder } = get()
        const orderArray = Array.isArray(payload.order) ? payload.order : []
        const stateForFaction = Array.isArray(payload.state) ? payload.state : mainBasesState[payload.f]
        set({
          selectedFaction: payload.f,
          mainBaseState: { ...mainBaseState, [payload.f]: stateForFaction },
          buildingOrder: { ...buildingOrder, [payload.f]: orderArray },
          currentBuildId: null,
        })
      },
      setCurrentBuildName: (name) => {
        const { selectedFaction, savedBuilds } = get()
        set({
          currentBuildName:
            name.trim() || getDefaultBuildName(selectedFaction, savedBuilds),
        })
      },
      saveCurrentBuild: (name) => {
        const {
          selectedFaction,
          mainBaseState,
          buildingOrder,
          savedBuilds,
          currentBuildName,
          currentBuildId,
        } = get()
        const defaultName = getDefaultBuildName(selectedFaction, savedBuilds)
        const rawName =
          (name?.trim() || currentBuildName.trim() || defaultName).trim() || defaultName
        const existing =
          currentBuildId !== null
            ? savedBuilds.find((b) => b.id === currentBuildId)
            : null
        const finalName = getUniqueBuildName(rawName, savedBuilds, existing?.id)
        const snapshot = getBuildSnapshot({
          selectedFaction,
          mainBaseState,
          buildingOrder,
          currentBuildName: finalName,
        })
        if (existing) {
          const existingIndex = savedBuilds.findIndex((b) => b.id === existing.id)
          const updated: SavedBuild = {
            ...existing,
            name: finalName,
            selectedFaction,
            mainBaseState: deepClone(mainBaseState),
            buildingOrder: deepClone(buildingOrder),
            createdAt: Date.now(),
          }
          const newSavedBuilds = [...savedBuilds]
          newSavedBuilds[existingIndex] = updated
          set({
            savedBuilds: newSavedBuilds,
            lastSavedSnapshot: snapshot,
            currentBuildName: finalName,
          })
        } else {
          const saved: SavedBuild = {
            id: generateBuildId(),
            name: finalName,
            createdAt: Date.now(),
            selectedFaction,
            mainBaseState: deepClone(mainBaseState),
            buildingOrder: deepClone(buildingOrder),
          }
          set({
            savedBuilds: [saved, ...savedBuilds],
            lastSavedSnapshot: snapshot,
            currentBuildName: finalName,
            currentBuildId: saved.id,
          })
        }
      },
      loadBuild: (id) => {
        const { savedBuilds } = get()
        const build = savedBuilds.find((b) => b.id === id)
        if (!build) return
        const snapshot = getBuildSnapshot({
          selectedFaction: build.selectedFaction,
          mainBaseState: build.mainBaseState,
          buildingOrder: build.buildingOrder,
          currentBuildName: build.name,
        })
        set({
          selectedFaction: build.selectedFaction,
          mainBaseState: deepClone(build.mainBaseState),
          buildingOrder: deepClone(build.buildingOrder),
          currentBuildName: build.name,
          currentBuildId: id,
          lastSavedSnapshot: snapshot,
        })
      },
      deleteBuild: (id) => {
        const { savedBuilds, currentBuildId } = get()
        const build = savedBuilds.find((b) => b.id === id)
        if (!build) return
        if (currentBuildId === id) {
          const newSaved = savedBuilds.filter((b) => b.id !== id)
          set({
            selectedFaction: "atreides",
            mainBaseState: mainBasesState,
            buildingOrder: initialBuildingOrder,
            currentBuildName: getDefaultBuildName("atreides", newSaved),
            currentBuildId: null,
            lastSavedSnapshot: null,
            savedBuilds: newSaved,
          })
        } else {
          set({ savedBuilds: savedBuilds.filter((b) => b.id !== id) })
        }
      },
      resetToDefault: () => {
        const { savedBuilds } = get()
        set({
          selectedFaction: "atreides",
          mainBaseState: mainBasesState,
          buildingOrder: initialBuildingOrder,
          currentBuildName: getDefaultBuildName("atreides", savedBuilds),
          currentBuildId: null,
          lastSavedSnapshot: null,
        })
      },
      renameBuild: (id, name) => {
        const trimmed = name.trim()
        if (!trimmed) return
        const g = get()
        const newSavedBuilds = g.savedBuilds.map((b) => (b.id === id ? { ...b, name: trimmed } : b))
        const updates: Partial<MainStore> = { savedBuilds: newSavedBuilds }
        if (g.currentBuildId === id) {
          updates.currentBuildName = trimmed
          updates.lastSavedSnapshot = getBuildSnapshot({
            selectedFaction: g.selectedFaction,
            mainBaseState: g.mainBaseState,
            buildingOrder: g.buildingOrder,
            currentBuildName: trimmed,
          })
        }
        set(updates)
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

/** Returns the list of building IDs used in the current base. */
export function useUsedBuildingIds(): string[] {
  const mainBaseState = useCurrentMainBaseState()
  const usedIds: string[] = []
  if (!Array.isArray(mainBaseState)) return usedIds

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

/** Returns building order for the current faction. */
export function useCurrentBuildingOrder(): BuildingCoords[] {
  const selectedFaction = useMainStore((state) => state.selectedFaction)
  const buildingOrder = useMainStore((state) => state.buildingOrder)
  return buildingOrder[selectedFaction] ?? []
}

/** Returns a building's order number (1-based) or null if not found. */
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

/** Whether the current build is up to date with the last save. */
export function useIsBuildUpToDate(): boolean {
  const lastSavedSnapshot = useMainStore((s) => s.lastSavedSnapshot)
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const mainBaseState = useMainStore((s) => s.mainBaseState)
  const buildingOrder = useMainStore((s) => s.buildingOrder)
  const currentBuildName = useMainStore((s) => s.currentBuildName)
  const currentSnapshot = getBuildSnapshot({
    selectedFaction,
    mainBaseState,
    buildingOrder,
    currentBuildName,
  })
  return lastSavedSnapshot !== null && currentSnapshot === lastSavedSnapshot
}

/** Whether the current build (active faction) has at least one building. */
export function useIsBuildEmpty(): boolean {
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const mainBaseState = useMainStore((s) => s.mainBaseState)
  return isFactionBaseEmpty(mainBaseState, selectedFaction)
}

