/**
 * Main store: current build, saved builds list, panels, metadata. Single persist. Mutations call persistBuild().
 */
import { useMemo } from "react"
import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import type { SharedBuildPayload } from "../utils/mainBaseShare"
import type { MainBaseLayout, MainBaseState, MainBaseStatePerFaction } from "./main-base"
import { mainBasesState, getMainBaseLayoutForIndex, hasMainBaseVariant, initializeMainBaseState } from "./main-base"
import {
  type FactionLabel,
  type BuildingCoords,
  type ArmoryState,
  type UnitSlotsState,
  type CouncillorSlotsState,
  type OperationSlotsState,
  type PanelVisibility,
  type DevelopmentsSummary,
  type SelectedDevelopments,
  type BuildMetadata,
  type SavedBuild,
  type BuildSnapshot,
  type BuildSnapshotState,
  type BuildingOrderStatePerFaction,
  type CurrentBuildId,
  type MainStoreBuildingOrder,
  MAIN_BASE_VARIANT_FACTIONS,
  MAIN_STORE_PERSIST_KEY,
  HERO_SLOT_INDEX,
  OPERATION_SLOTS_COUNT,
  MAX_COUNCILLORS,
  DEFAULT_UNIT_SLOT_COUNT,
  MAX_UNIT_SLOT_COUNT,
  DEFAULT_AUTHOR,
  INITIAL_BUILD_NAME,
  deepClone,
  getBuildSnapshot,
  getDefaultBuildName,
  getUniqueBuildName,
  isFactionBaseEmpty,
} from "./types"
import {
  initialBuildingOrder,
  initialSelectedMainBaseIndex,
  initialArmoryState,
  initialUnitSlotsState,
  initialCouncillorSlotsState,
  initialOperationSlotsState,
  initialPanelVisibility,
  initialDevelopmentsSummary,
  createEmptyMetadata,
  normalizeLoadedBuild,
  createEmptyArmoryForFaction,
  createEmptyUnitSlotsForFaction,
  createEmptyCouncillorSlotsForFaction,
  createEmptyOperationSlotsForFaction,
  normalizeOptionalUrl,
} from "./initial"

export { useUIStore } from "./ui"
export type { MainBaseLayout, MainBaseState } from "./main-base"
export {
  FACTION_LABELS,
  UNITS_PER_FACTION,
  GEAR_SLOTS_PER_UNIT,
  MAX_COUNCILLORS,
  OPERATION_SLOTS_COUNT,
  MAIN_STORE_PERSIST_KEY,
  HERO_SLOT_INDEX,
  MAX_UNIT_SLOT_COUNT,
  MAX_UNIT_CP,
  DEFAULT_UNIT_SLOT_COUNT,
  deepClone,
  getDefaultBuildName,
  getUniqueBuildName,
  isFactionBaseEmpty,
} from "./types"
export type {
  FactionLabel,
  BuildingCoords,
  BuildingOrderState,
  ArmoryState,
  UnitSlotsState,
  CouncillorSlotsState,
  OperationSlotsState,
  PanelVisibility,
  DevelopmentsSummary,
  SelectedDevelopments,
  BuildMetadata,
  SavedBuild,
  BuildSnapshot,
  CurrentBuildId,
  NormalizedBuildFields,
} from "./types"
export { normalizeLoadedBuild } from "./initial"

/** Normalize loaded mainBaseState: ensure variant factions have [state0, state1] (old saves had single state). */
function normalizeMainBaseStateFromBuild(
  state: Record<FactionLabel, MainBaseStatePerFaction>
): Record<FactionLabel, MainBaseStatePerFaction> {
  const result = { ...state }
  for (const f of MAIN_BASE_VARIANT_FACTIONS) {
    const v = result[f]
    if (!Array.isArray(v) || v.length !== 2) {
      const defaultState = mainBasesState[f] as [MainBaseState, MainBaseState]
      result[f] = [v as MainBaseState, defaultState[1]]
    }
  }
  return result
}

/** Normalize loaded buildingOrder: ensure variant factions have [order0, order1]. */
function normalizeBuildingOrderFromBuild(
  order: Record<FactionLabel, BuildingOrderStatePerFaction>
): MainStoreBuildingOrder {
  const result = { ...order }
  for (const f of MAIN_BASE_VARIANT_FACTIONS) {
    const v = result[f]
    const isTupleOfArrays =
      Array.isArray(v) && v.length === 2 && Array.isArray(v[0]) && Array.isArray(v[1])
    if (!isTupleOfArrays) {
      let firstOrder: BuildingCoords[]
      if (!Array.isArray(v)) {
        firstOrder = []
      } else if (v.length === 2 && Array.isArray(v[0]) && Array.isArray(v[1])) {
        firstOrder = (v as [BuildingCoords[], BuildingCoords[]])[0]
      } else {
        firstOrder = v as BuildingCoords[]
      }
      result[f] = [firstOrder, []]
    }
  }
  return result as MainStoreBuildingOrder
}

/** Resolve the single main-base state for a faction (current base when tuple). */
function getMainBaseStateSlice(
  state: MainBaseStatePerFaction,
  baseIndex: 0 | 1
): MainBaseState {
  const isTuple = Array.isArray(state) && state.length === 2
  if (isTuple) return state[baseIndex] as MainBaseState
  return state as MainBaseState
}

/** Resolve the single building order for a faction (current base when tuple). */
function getBuildingOrderSlice(
  order: BuildingOrderStatePerFaction,
  baseIndex: 0 | 1
): BuildingCoords[] {
  const isTuple = Array.isArray(order) && order.length === 2
  if (isTuple) return (order as [BuildingCoords[], BuildingCoords[]])[baseIndex]
  return (order ?? []) as BuildingCoords[]
}

interface MainStore {
  selectedFaction: FactionLabel
  selectedMainBaseIndex: Record<FactionLabel, 0 | 1>
  mainBaseState: Record<FactionLabel, MainBaseStatePerFaction>
  buildingOrder: MainStoreBuildingOrder
  armoryState: ArmoryState
  unitSlotCount: number
  unitSlots: UnitSlotsState
  councillorSlots: CouncillorSlotsState
  operationSlots: OperationSlotsState
  panelVisibility: PanelVisibility
  developmentsSummary: DevelopmentsSummary
  selectedDevelopments: SelectedDevelopments
  metadata: BuildMetadata
  defaultAuthor: string
  currentBuildName: string
  currentBuildId: CurrentBuildId
  savedBuilds: SavedBuild[]
  lastSavedSnapshot: BuildSnapshot
  setMainBaseCell: (rowIndex: number, groupIndex: number, cellIndex: number, buildingId: string | null) => void
  updateBuildingOrder: (newOrder: BuildingCoords[]) => void
  setSelectedMainBaseIndex: (index: 0 | 1) => void
  setArmorySlot: (unitIndex: number, slotIndex: number, gearName: string | null) => void
  setUnitSlot: (slotIndex: number, unitId: string | null) => void
  removeUnitSlot: (slotIndex: number) => void
  addUnitSlot: () => number | undefined
  setOperationSlot: (slotIndex: number, missionId: string | null) => void
  toggleCouncillor: (councillorId: string) => void
  toggleMainBase: () => void
  toggleArmory: () => void
  toggleUnits: () => void
  toggleCouncillors: () => void
  toggleOperations: () => void
  toggleDevelopments: () => void
  setSelectedDevelopments: (ids: string[], summary: DevelopmentsSummary) => void
  reorderDevelopment: (id: string, direction: 1 | -1) => void
  setMetadataAuthor: (author: string) => void
  setMetadataSocial: (social: string) => void
  setMetadataMedia: (media: string) => void
  setMetadataCommentary: (commentary: string) => void
  loadSharedBuild: (payload: SharedBuildPayload) => void
  setCurrentBuildName: (name: string) => void
  saveCurrentBuild: (name?: string) => void
  loadBuild: (id: string) => void
  duplicateBuild: (id: string) => void
  deleteBuild: (id: string) => void
  renameBuild: (id: string, name: string) => void
  resetToDefault: () => void
  createNewBuild: () => void
  forkCurrentBuild: () => void
  switchFaction: (faction: FactionLabel) => void
}

function generateBuildId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function getBuildStateObject() {
  const s = useMainStore.getState()
  return {
    selectedFaction: s.selectedFaction,
    mainBaseState: s.mainBaseState,
    buildingOrder: s.buildingOrder,
    armoryState: s.armoryState,
    unitSlotCount: s.unitSlotCount,
    unitSlots: s.unitSlots,
    councillorSlots: s.councillorSlots,
    operationSlots: s.operationSlots,
    panelVisibility: s.panelVisibility,
    developmentsSummary: s.developmentsSummary,
    selectedDevelopments: s.selectedDevelopments,
    metadata: s.metadata,
    currentBuildName: s.currentBuildName,
  }
}

export function getSharePayloadFromState(s: MainStore): SharedBuildPayload {
  const faction = s.selectedFaction
  const baseIndex = s.selectedMainBaseIndex[faction] ?? 0
  const statePayload: SharedBuildPayload = {
    f: faction,
    state: getMainBaseStateSlice(s.mainBaseState[faction], 0),
    order: getBuildingOrderSlice(s.buildingOrder[faction], 0),
    armory: s.armoryState[faction],
    units: s.unitSlots[faction],
    councillors: s.councillorSlots[faction],
    operations: s.operationSlots[faction],
    unitSlotCount: s.unitSlotCount,
    panelVisibility: s.panelVisibility,
    developmentsSummary: s.developmentsSummary,
    selectedDevelopments: s.selectedDevelopments,
    metadata: s.metadata,
  }
  if (hasMainBaseVariant(faction)) {
    const factionState = s.mainBaseState[faction]
    const factionOrder = s.buildingOrder[faction]
    const isTuple = Array.isArray(factionState) && factionState.length === 2
    if (isTuple) {
      statePayload.state2 = (factionState as [MainBaseState, MainBaseState])[1]
      statePayload.order2 = (factionOrder as [BuildingCoords[], BuildingCoords[]])[1]
      statePayload.mainBaseIndex = baseIndex
    }
  }
  return statePayload
}

export const useMainStore = create<MainStore>()(
  devtools(
    persist(
      (set, get) => {
        /** Centralized: persist current build into savedBuilds after any build-affecting mutation. */
        const persistBuild = () => get().saveCurrentBuild()
        return {
          selectedFaction: "atreides",
          switchFaction: (faction) => {
            const g = get()
            if (faction === g.selectedFaction) return
            if (!isFactionBaseEmpty(g.mainBaseState, g.selectedFaction)) {
              persistBuild()
            }
            set({
              selectedFaction: faction,
              unitSlotCount: DEFAULT_UNIT_SLOT_COUNT,
              developmentsSummary: initialDevelopmentsSummary,
              selectedDevelopments: [],
              metadata: createEmptyMetadata(g.defaultAuthor),
              currentBuildId: null,
              currentBuildName: getDefaultBuildName(faction, get().savedBuilds),
            })
          },
          selectedMainBaseIndex: initialSelectedMainBaseIndex,
          mainBaseState: mainBasesState,
          buildingOrder: initialBuildingOrder,
          armoryState: initialArmoryState,
          unitSlotCount: DEFAULT_UNIT_SLOT_COUNT,
          unitSlots: initialUnitSlotsState,
          councillorSlots: initialCouncillorSlotsState,
          operationSlots: initialOperationSlotsState,
          panelVisibility: initialPanelVisibility,
          developmentsSummary: initialDevelopmentsSummary,
          selectedDevelopments: [],
          metadata: createEmptyMetadata(),
          defaultAuthor: DEFAULT_AUTHOR,
          currentBuildName: INITIAL_BUILD_NAME,
          currentBuildId: null,
          savedBuilds: [],
          lastSavedSnapshot: null,
          toggleMainBase: () => {
            const { panelVisibility } = get()
            set({ panelVisibility: { ...panelVisibility, mainBaseOpen: !panelVisibility.mainBaseOpen } })
            persistBuild()
          },
          toggleArmory: () => {
            const { panelVisibility } = get()
            set({ panelVisibility: { ...panelVisibility, armoryOpen: !panelVisibility.armoryOpen } })
            persistBuild()
          },
          toggleUnits: () => {
            const { panelVisibility } = get()
            set({ panelVisibility: { ...panelVisibility, unitsOpen: !panelVisibility.unitsOpen } })
            persistBuild()
          },
          toggleCouncillors: () => {
            const { panelVisibility } = get()
            set({ panelVisibility: { ...panelVisibility, councillorsOpen: !panelVisibility.councillorsOpen } })
            persistBuild()
          },
          toggleOperations: () => {
            const { panelVisibility } = get()
            set({ panelVisibility: { ...panelVisibility, operationsOpen: !panelVisibility.operationsOpen } })
            persistBuild()
          },
          toggleDevelopments: () => {
            const { panelVisibility } = get()
            set({ panelVisibility: { ...panelVisibility, developmentsOpen: !panelVisibility.developmentsOpen } })
            persistBuild()
          },
          setSelectedDevelopments: (ids, summary) => {
            set({ selectedDevelopments: ids, developmentsSummary: summary })
            persistBuild()
          },
          reorderDevelopment: (id, direction) => {
            const { selectedDevelopments } = get()
            const i = selectedDevelopments.indexOf(id)
            if (i === -1) return
            const j = i + direction
            if (j < 0 || j >= selectedDevelopments.length) return
            const next = [...selectedDevelopments]
              ;[next[i], next[j]] = [next[j], next[i]]
            set({ selectedDevelopments: next })
            persistBuild()
          },
          setOperationSlot: (slotIndex, missionId) => {
            const { selectedFaction, operationSlots } = get()
            const factionSlots = operationSlots[selectedFaction] ?? createEmptyOperationSlotsForFaction()
            if (slotIndex < 0 || slotIndex >= OPERATION_SLOTS_COUNT) return
            const next = [...factionSlots]
            next[slotIndex] = missionId
            // When clearing, compact: shift remaining operations left (like Units)
            const final =
              missionId === null
                ? (() => {
                  const compacted = next.filter((id): id is string => id != null)
                  return [...compacted, ...Array(OPERATION_SLOTS_COUNT - compacted.length).fill(null)]
                })()
                : next
            set({
              operationSlots: {
                ...operationSlots,
                [selectedFaction]: final,
              },
            })
            persistBuild()
          },
          toggleCouncillor: (councillorId) => {
            const { selectedFaction, councillorSlots } = get()
            const slots = councillorSlots[selectedFaction]
            const current = slots.filter(Boolean) as string[]
            const isSelected = current.includes(councillorId)
            let newSlots: (string | null)[]
            if (isSelected) {
              newSlots = current.filter((id) => id !== councillorId)
              while (newSlots.length < MAX_COUNCILLORS) newSlots.push(null)
            } else if (current.length >= MAX_COUNCILLORS) {
              newSlots = [current[1], councillorId]
            } else {
              newSlots = [...current, councillorId]
              while (newSlots.length < MAX_COUNCILLORS) newSlots.push(null)
            }
            set({
              councillorSlots: {
                ...councillorSlots,
                [selectedFaction]: newSlots,
              },
            })
            persistBuild()
          },
          setMetadataAuthor: (author) => {
            const { metadata } = get()
            const trimmed = author.trim() || DEFAULT_AUTHOR
            set({
              metadata: { ...metadata, author: trimmed },
              // Update defaultAuthor if user specifies a non-default author
              defaultAuthor: trimmed !== DEFAULT_AUTHOR ? trimmed : get().defaultAuthor,
            })
            persistBuild()
          },
          setMetadataSocial: (social) => {
            const { metadata } = get()
            set({ metadata: { ...metadata, social: normalizeOptionalUrl(social) } })
            persistBuild()
          },
          setMetadataMedia: (media) => {
            const { metadata } = get()
            set({ metadata: { ...metadata, media: normalizeOptionalUrl(media) } })
            persistBuild()
          },
          setMetadataCommentary: (commentary) => {
            const { metadata } = get()
            set({ metadata: { ...metadata, commentary } })
            persistBuild()
          },
          addUnitSlot: () => {
            const g = get()
            const newSlotIndex = g.unitSlotCount
            set({ unitSlotCount: newSlotIndex + 1 })
            persistBuild()
            return newSlotIndex
          },
          setMainBaseCell: (rowIndex, groupIndex, cellIndex, buildingId) => {
            const { selectedFaction, selectedMainBaseIndex, mainBaseState, buildingOrder } = get()
            const baseIndex = selectedMainBaseIndex[selectedFaction] ?? 0
            const factionState = mainBaseState[selectedFaction]
            const currentState = getMainBaseStateSlice(factionState, baseIndex)
            const row = currentState[rowIndex]
            const group = row[groupIndex]
            const newGroup = [...group]
            newGroup[cellIndex] = buildingId
            const newRow = row.map((g, i) => (i === groupIndex ? newGroup : g))
            const newFactionState = currentState.map((r, i) => (i === rowIndex ? newRow : r))

            const factionOrder = buildingOrder[selectedFaction]
            const currentOrder = getBuildingOrderSlice(factionOrder, baseIndex)
            const filteredOrder = currentOrder.filter(
              (coord) => !(coord.rowIndex === rowIndex && coord.groupIndex === groupIndex && coord.cellIndex === cellIndex)
            )
            const newCurrentOrder = buildingId !== null
              ? [...filteredOrder, { rowIndex, groupIndex, cellIndex }]
              : filteredOrder

            const isTuple = Array.isArray(factionState) && factionState.length === 2
            const nextMainBaseState = isTuple
              ? {
                ...mainBaseState,
                [selectedFaction]: [baseIndex === 0 ? newFactionState : factionState[0], baseIndex === 1 ? newFactionState : factionState[1]] as [MainBaseState, MainBaseState],
              }
              : { ...mainBaseState, [selectedFaction]: newFactionState }

            const orderIsTuple = Array.isArray(factionOrder) && factionOrder.length === 2
            const nextBuildingOrder = orderIsTuple
              ? {
                ...buildingOrder,
                [selectedFaction]: [baseIndex === 0 ? newCurrentOrder : factionOrder[0], baseIndex === 1 ? newCurrentOrder : factionOrder[1]] as [BuildingCoords[], BuildingCoords[]],
              }
              : { ...buildingOrder, [selectedFaction]: newCurrentOrder }

            set({
              mainBaseState: nextMainBaseState,
              buildingOrder: nextBuildingOrder,
            })
            persistBuild()
          },
          setSelectedMainBaseIndex: (index) => {
            const { selectedFaction, selectedMainBaseIndex } = get()
            set({
              selectedMainBaseIndex: { ...selectedMainBaseIndex, [selectedFaction]: index },
            })
            persistBuild()
          },
          updateBuildingOrder: (newOrder) => {
            const { selectedFaction, selectedMainBaseIndex, buildingOrder } = get()
            const baseIndex = selectedMainBaseIndex[selectedFaction] ?? 0
            const factionOrder = buildingOrder[selectedFaction]
            const isTuple = Array.isArray(factionOrder) && factionOrder.length === 2
            const nextOrder = isTuple
              ? ([baseIndex === 0 ? newOrder : factionOrder[0], baseIndex === 1 ? newOrder : factionOrder[1]] as [BuildingCoords[], BuildingCoords[]])
              : newOrder
            set({
              buildingOrder: { ...buildingOrder, [selectedFaction]: nextOrder },
            })
            persistBuild()
          },
          setArmorySlot: (unitIndex, slotIndex, gearName) => {
            const { selectedFaction, armoryState } = get()
            const factionArmory = armoryState[selectedFaction]
            const newUnitGearSlots = [...factionArmory[unitIndex]]
            newUnitGearSlots[slotIndex] = gearName
            const newFactionArmory = factionArmory.map((slots, i) =>
              i === unitIndex ? newUnitGearSlots : slots
            )

            set({
              armoryState: {
                ...armoryState,
                [selectedFaction]: newFactionArmory,
              },
            })
            persistBuild()
          },
          setUnitSlot: (slotIndex, unitId) => {
            if (slotIndex === 0) return // Add slot is not writable
            const { selectedFaction, unitSlots } = get()
            const factionUnitSlots = [...unitSlots[selectedFaction]]
            // Ensure the array is large enough
            while (factionUnitSlots.length <= slotIndex) {
              factionUnitSlots.push(null)
            }
            factionUnitSlots[slotIndex] = unitId

            set({
              unitSlots: {
                ...unitSlots,
                [selectedFaction]: factionUnitSlots,
              },
            })
            persistBuild()
          },
          removeUnitSlot: (slotIndex) => {
            if (slotIndex === 0) return // Add slot: no-op
            const { selectedFaction, unitSlots, unitSlotCount } = get()
            const factionUnitSlots = [...unitSlots[selectedFaction]]
            // Hero slot (index 1): clear it, don't remove
            if (slotIndex === HERO_SLOT_INDEX) {
              factionUnitSlots[HERO_SLOT_INDEX] = null
              set({
                unitSlots: {
                  ...unitSlots,
                  [selectedFaction]: factionUnitSlots,
                },
              })
            } else {
              // Unit slot (2..N): remove slot and shift units down; decrement slot count
              factionUnitSlots.splice(slotIndex, 1)
              const newSlotCount = Math.max(DEFAULT_UNIT_SLOT_COUNT, unitSlotCount - 1)
              set({
                unitSlots: {
                  ...unitSlots,
                  [selectedFaction]: factionUnitSlots,
                },
                unitSlotCount: newSlotCount,
              })
            }
            persistBuild()
          },
          loadSharedBuild: (payload) => {
            const { mainBaseState, buildingOrder, selectedMainBaseIndex, armoryState, unitSlots, councillorSlots, operationSlots, defaultAuthor } = get()
            const orderArray = Array.isArray(payload.order) ? payload.order : []
            const payloadState = Array.isArray(payload.state) ? payload.state : null
            const hasSecondBase = hasMainBaseVariant(payload.f) && payload.state2 != null && Array.isArray(payload.state2)
            const stateForFaction: MainBaseStatePerFaction = hasMainBaseVariant(payload.f)
              ? hasSecondBase
                ? [payloadState as MainBaseState, payload.state2 as MainBaseState]
                : payloadState
                  ? [payloadState as MainBaseState, initializeMainBaseState(getMainBaseLayoutForIndex(payload.f, 1))]
                  : mainBasesState[payload.f]
              : (payloadState ?? (mainBasesState[payload.f] as MainBaseState))
            const orderForFaction: BuildingOrderStatePerFaction = hasMainBaseVariant(payload.f)
              ? hasSecondBase && Array.isArray(payload.order2)
                ? [orderArray, payload.order2]
                : orderArray.length > 0 || (payload.order2?.length ?? 0) > 0
                  ? [orderArray, payload.order2 ?? []]
                  : [[], []]
              : orderArray
            const armoryForFaction = Array.isArray(payload.armory) ? payload.armory : createEmptyArmoryForFaction()
            let unitSlotsForFaction = Array.isArray(payload.units) ? payload.units : createEmptyUnitSlotsForFaction()
            const councillorSlotsForFaction = Array.isArray(payload.councillors)
              ? payload.councillors
              : createEmptyCouncillorSlotsForFaction()
            let operationSlotsForFaction = Array.isArray(payload.operations)
              ? payload.operations.slice(0, OPERATION_SLOTS_COUNT)
              : createEmptyOperationSlotsForFaction()
            operationSlotsForFaction = Array.from({ length: OPERATION_SLOTS_COUNT }, (_, i) => operationSlotsForFaction[i] ?? null)
            // Ensure add slot at 0, hero at 1, length 6
            if (unitSlotsForFaction.length > 0) {
              const first = unitSlotsForFaction[0]
              if (first && /^[AHFSECV]_Hero_[12]$/.test(first)) {
                unitSlotsForFaction = [null, ...unitSlotsForFaction].slice(0, 6)
              } else if (first !== null) {
                unitSlotsForFaction = [null, null, ...unitSlotsForFaction].slice(0, 6)
              } else if (unitSlotsForFaction.length !== 6) {
                unitSlotsForFaction = [...unitSlotsForFaction, ...Array(6).fill(null)].slice(0, 6)
              }
            }
            const unitCount = typeof payload.unitSlotCount === "number"
              ? Math.max(DEFAULT_UNIT_SLOT_COUNT, Math.min(MAX_UNIT_SLOT_COUNT, payload.unitSlotCount))
              : Math.max(DEFAULT_UNIT_SLOT_COUNT, unitSlotsForFaction.length)
            const synthetic: Partial<SavedBuild> & Pick<SavedBuild, "selectedFaction" | "mainBaseState" | "buildingOrder"> = {
              selectedFaction: payload.f,
              mainBaseState: { ...mainBaseState, [payload.f]: stateForFaction },
              buildingOrder: { ...buildingOrder, [payload.f]: orderForFaction },
              armoryState: { ...armoryState, [payload.f]: armoryForFaction },
              unitSlots: { ...unitSlots, [payload.f]: unitSlotsForFaction },
              councillorSlots: { ...councillorSlots, [payload.f]: councillorSlotsForFaction },
              operationSlots: { ...operationSlots, [payload.f]: operationSlotsForFaction },
              unitSlotCount: unitCount,
              panelVisibility: payload.panelVisibility,
              developmentsSummary: payload.developmentsSummary,
              selectedDevelopments: payload.selectedDevelopments,
              metadata: payload.metadata,
            }
            const norm = normalizeLoadedBuild(synthetic, defaultAuthor)
            const sharedMainBaseIndex = payload.mainBaseIndex ?? 0
            set({
              selectedFaction: payload.f,
              selectedMainBaseIndex: { ...selectedMainBaseIndex, [payload.f]: sharedMainBaseIndex },
              mainBaseState: synthetic.mainBaseState,
              buildingOrder: synthetic.buildingOrder,
              armoryState: norm.armoryState,
              unitSlots: norm.unitSlots,
              councillorSlots: norm.councillorSlots,
              operationSlots: norm.operationSlots,
              unitSlotCount: norm.unitSlotCount,
              panelVisibility: norm.panelVisibility,
              developmentsSummary: norm.developmentsSummary,
              selectedDevelopments: norm.selectedDevelopments,
              metadata: norm.metadata,
              currentBuildName: "Shared build",
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
              armoryState,
              unitSlotCount,
              unitSlots,
              councillorSlots,
              operationSlots,
              panelVisibility,
              developmentsSummary,
              metadata,
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
              selectedMainBaseIndex: get().selectedMainBaseIndex,
              mainBaseState,
              buildingOrder,
              armoryState,
              unitSlotCount,
              unitSlots,
              councillorSlots,
              operationSlots,
              panelVisibility,
              developmentsSummary,
              selectedDevelopments: get().selectedDevelopments,
              metadata,
              currentBuildName: finalName,
            })
            if (existing) {
              const existingIndex = savedBuilds.findIndex((b) => b.id === existing.id)
              const updated: SavedBuild = {
                ...existing,
                name: finalName,
                selectedFaction,
                selectedMainBaseIndex: deepClone(get().selectedMainBaseIndex),
                mainBaseState: deepClone(mainBaseState),
                buildingOrder: deepClone(buildingOrder),
                armoryState: deepClone(armoryState),
                unitSlotCount,
                unitSlots: deepClone(unitSlots),
                councillorSlots: deepClone(councillorSlots),
                operationSlots: deepClone(operationSlots),
                panelVisibility: deepClone(panelVisibility),
                developmentsSummary: deepClone(developmentsSummary),
                selectedDevelopments: [...get().selectedDevelopments],
                metadata: deepClone(metadata),
                // Keep original createdAt - don't update on save
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
                selectedMainBaseIndex: deepClone(get().selectedMainBaseIndex),
                mainBaseState: deepClone(mainBaseState),
                buildingOrder: deepClone(buildingOrder),
                armoryState: deepClone(armoryState),
                unitSlotCount,
                unitSlots: deepClone(unitSlots),
                councillorSlots: deepClone(councillorSlots),
                operationSlots: deepClone(operationSlots),
                panelVisibility: deepClone(panelVisibility),
                developmentsSummary: deepClone(developmentsSummary),
                selectedDevelopments: [...get().selectedDevelopments],
                metadata: deepClone(metadata),
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
            const { savedBuilds, defaultAuthor } = get()
            const build = savedBuilds.find((b) => b.id === id)
            if (!build) return
            const norm = normalizeLoadedBuild(build, defaultAuthor)
            const snapshot = getBuildSnapshot({
              selectedFaction: build.selectedFaction,
              selectedMainBaseIndex: (build as SavedBuild & { selectedMainBaseIndex?: Record<FactionLabel, 0 | 1> }).selectedMainBaseIndex ?? initialSelectedMainBaseIndex,
              mainBaseState: build.mainBaseState,
              buildingOrder: build.buildingOrder,
              ...norm,
              currentBuildName: build.name,
            })
            const buildSelectedMainBase = (build as SavedBuild & { selectedMainBaseIndex?: Record<FactionLabel, 0 | 1> }).selectedMainBaseIndex
            set({
              selectedFaction: build.selectedFaction,
              selectedMainBaseIndex: buildSelectedMainBase ? deepClone(buildSelectedMainBase) : initialSelectedMainBaseIndex,
              mainBaseState: normalizeMainBaseStateFromBuild(deepClone(build.mainBaseState)),
              buildingOrder: normalizeBuildingOrderFromBuild(deepClone(build.buildingOrder)),
              armoryState: deepClone(norm.armoryState),
              unitSlotCount: norm.unitSlotCount,
              unitSlots: deepClone(norm.unitSlots),
              councillorSlots: deepClone(norm.councillorSlots),
              operationSlots: deepClone(norm.operationSlots),
              panelVisibility: norm.panelVisibility,
              developmentsSummary: deepClone(norm.developmentsSummary),
              selectedDevelopments: norm.selectedDevelopments,
              metadata: deepClone(norm.metadata),
              currentBuildName: build.name,
              currentBuildId: id,
              lastSavedSnapshot: snapshot,
            })
          },
          duplicateBuild: (id) => {
            const { savedBuilds, defaultAuthor } = get()
            const build = savedBuilds.find((b) => b.id === id)
            if (!build) return
            const norm = normalizeLoadedBuild(build, defaultAuthor)
            const newName = getUniqueBuildName(build.name + " (copy)", savedBuilds)
            const newId = generateBuildId()
            const dupSelectedMainBase = (build as SavedBuild & { selectedMainBaseIndex?: Record<FactionLabel, 0 | 1> }).selectedMainBaseIndex ?? initialSelectedMainBaseIndex
            const duplicated: SavedBuild = {
              id: newId,
              name: newName,
              createdAt: Date.now(),
              selectedFaction: build.selectedFaction,
              selectedMainBaseIndex: deepClone(dupSelectedMainBase),
              mainBaseState: deepClone(build.mainBaseState),
              buildingOrder: deepClone(build.buildingOrder),
              armoryState: deepClone(norm.armoryState),
              unitSlotCount: norm.unitSlotCount,
              unitSlots: deepClone(norm.unitSlots),
              councillorSlots: deepClone(norm.councillorSlots),
              operationSlots: deepClone(norm.operationSlots),
              panelVisibility: norm.panelVisibility,
              developmentsSummary: deepClone(norm.developmentsSummary),
              selectedDevelopments: norm.selectedDevelopments,
              metadata: deepClone(norm.metadata),
            }
            const snapshot = getBuildSnapshot({
              selectedFaction: duplicated.selectedFaction,
              selectedMainBaseIndex: dupSelectedMainBase,
              mainBaseState: duplicated.mainBaseState,
              buildingOrder: duplicated.buildingOrder,
              ...norm,
              currentBuildName: duplicated.name,
            })
            set({
              savedBuilds: [duplicated, ...savedBuilds],
              selectedFaction: duplicated.selectedFaction,
              selectedMainBaseIndex: deepClone(dupSelectedMainBase),
              mainBaseState: deepClone(duplicated.mainBaseState),
              buildingOrder: deepClone(duplicated.buildingOrder),
              armoryState: deepClone(duplicated.armoryState),
              unitSlotCount: duplicated.unitSlotCount,
              unitSlots: deepClone(duplicated.unitSlots),
              councillorSlots: deepClone(duplicated.councillorSlots),
              operationSlots: deepClone(duplicated.operationSlots),
              panelVisibility: duplicated.panelVisibility,
              developmentsSummary: deepClone(duplicated.developmentsSummary),
              selectedDevelopments: duplicated.selectedDevelopments ?? [],
              metadata: deepClone(duplicated.metadata),
              currentBuildName: duplicated.name,
              currentBuildId: newId,
              lastSavedSnapshot: snapshot,
            })
          },
          deleteBuild: (id) => {
            const { savedBuilds, currentBuildId, defaultAuthor } = get()
            const build = savedBuilds.find((b) => b.id === id)
            if (!build) return
            if (currentBuildId === id) {
              const newSaved = savedBuilds.filter((b) => b.id !== id)
              set({
                selectedFaction: "atreides",
                selectedMainBaseIndex: initialSelectedMainBaseIndex,
                mainBaseState: mainBasesState,
                buildingOrder: initialBuildingOrder,
                armoryState: initialArmoryState,
                unitSlotCount: DEFAULT_UNIT_SLOT_COUNT,
                unitSlots: initialUnitSlotsState,
                councillorSlots: initialCouncillorSlotsState,
                operationSlots: initialOperationSlotsState,
                panelVisibility: initialPanelVisibility,
                developmentsSummary: initialDevelopmentsSummary,
                selectedDevelopments: [],
                metadata: createEmptyMetadata(defaultAuthor),
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
            const { savedBuilds, defaultAuthor } = get()
            set({
              selectedFaction: "atreides",
              selectedMainBaseIndex: initialSelectedMainBaseIndex,
              mainBaseState: mainBasesState,
              buildingOrder: initialBuildingOrder,
              armoryState: initialArmoryState,
              unitSlotCount: DEFAULT_UNIT_SLOT_COUNT,
              unitSlots: initialUnitSlotsState,
              councillorSlots: initialCouncillorSlotsState,
              operationSlots: initialOperationSlotsState,
              panelVisibility: initialPanelVisibility,
              developmentsSummary: initialDevelopmentsSummary,
              selectedDevelopments: [],
              metadata: createEmptyMetadata(defaultAuthor),
              currentBuildName: getDefaultBuildName("atreides", savedBuilds),
              currentBuildId: null,
              lastSavedSnapshot: null,
            })
          },
          createNewBuild: () => {
            const { selectedFaction, savedBuilds, defaultAuthor } = get()
            set({
              selectedMainBaseIndex: initialSelectedMainBaseIndex,
              mainBaseState: mainBasesState,
              buildingOrder: initialBuildingOrder,
              armoryState: initialArmoryState,
              unitSlotCount: DEFAULT_UNIT_SLOT_COUNT,
              unitSlots: initialUnitSlotsState,
              councillorSlots: initialCouncillorSlotsState,
              operationSlots: initialOperationSlotsState,
              panelVisibility: initialPanelVisibility,
              developmentsSummary: initialDevelopmentsSummary,
              selectedDevelopments: [],
              metadata: createEmptyMetadata(defaultAuthor),
              currentBuildName: getDefaultBuildName(selectedFaction, savedBuilds),
              currentBuildId: null,
              lastSavedSnapshot: null,
            })
            persistBuild()
          },
          forkCurrentBuild: () => {
            const { currentBuildId } = get()
            if (currentBuildId !== null) {
              get().duplicateBuild(currentBuildId)
            } else {
              persistBuild()
            }
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
                selectedMainBaseIndex: g.selectedMainBaseIndex,
                mainBaseState: g.mainBaseState,
                buildingOrder: g.buildingOrder,
                armoryState: g.armoryState,
                unitSlotCount: g.unitSlotCount,
                unitSlots: g.unitSlots,
                operationSlots: g.operationSlots,
                councillorSlots: g.councillorSlots,
                panelVisibility: g.panelVisibility,
                developmentsSummary: g.developmentsSummary,
                selectedDevelopments: g.selectedDevelopments,
                metadata: g.metadata,
                currentBuildName: trimmed,
              })
            }
            set(updates)
            persistBuild()
          },
        }
      },
      {
        name: MAIN_STORE_PERSIST_KEY,
        version: 1,
        partialize: (s) => ({
          savedBuilds: s.savedBuilds,
          currentBuildId: s.currentBuildId,
          currentBuildName: s.currentBuildName,
          defaultAuthor: s.defaultAuthor,
          selectedFaction: s.selectedFaction,
          selectedMainBaseIndex: s.selectedMainBaseIndex,
          mainBaseState: s.mainBaseState,
          buildingOrder: s.buildingOrder,
          armoryState: s.armoryState,
          unitSlotCount: s.unitSlotCount,
          unitSlots: s.unitSlots,
          councillorSlots: s.councillorSlots,
          operationSlots: s.operationSlots,
          panelVisibility: s.panelVisibility,
          developmentsSummary: s.developmentsSummary,
          selectedDevelopments: s.selectedDevelopments,
          metadata: s.metadata,
        }),
        merge: (persisted, current) => {
          const p = persisted as Partial<MainStore> & Pick<MainStore, "currentBuildId" | "currentBuildName">
          const merged = { ...current, ...p }
          merged.lastSavedSnapshot =
            p.currentBuildId != null && p.mainBaseState != null
              ? getBuildSnapshot({
                selectedFaction: p.selectedFaction ?? current.selectedFaction,
                selectedMainBaseIndex: p.selectedMainBaseIndex ?? current.selectedMainBaseIndex,
                mainBaseState: p.mainBaseState ?? current.mainBaseState,
                buildingOrder: p.buildingOrder ?? current.buildingOrder,
                armoryState: p.armoryState ?? current.armoryState,
                unitSlotCount: p.unitSlotCount ?? current.unitSlotCount,
                unitSlots: p.unitSlots ?? current.unitSlots,
                councillorSlots: p.councillorSlots ?? current.councillorSlots,
                operationSlots: p.operationSlots ?? current.operationSlots,
                panelVisibility: p.panelVisibility ?? current.panelVisibility,
                developmentsSummary: p.developmentsSummary ?? current.developmentsSummary,
                selectedDevelopments: p.selectedDevelopments ?? current.selectedDevelopments,
                metadata: p.metadata ?? current.metadata,
                currentBuildName: p.currentBuildName ?? current.currentBuildName,
              } as BuildSnapshotState)
              : null
          return merged
        },
        migrate: (persisted, _version) => {
          // Future: bump version when schema changes and transform here, e.g. if (_version < 2) return migrateV1toV2(persisted)
          return persisted as MainStore
        },
      }
    ),
    { name: "MainStore", enabled: import.meta.env.DEV }
  ))

/** Single subscription: re-renders when selectedFaction or selectedMainBaseIndex changes. */
export function useCurrentMainBaseLayout(): MainBaseLayout {
  return useMainStore((s) => getMainBaseLayoutForIndex(s.selectedFaction, s.selectedMainBaseIndex[s.selectedFaction] ?? 0))
}

/** Single subscription: re-renders when selectedFaction, selectedMainBaseIndex, or that faction's mainBaseState changes. */
export function useCurrentMainBaseState(): MainBaseState {
  return useMainStore((s) =>
    getMainBaseStateSlice(s.mainBaseState[s.selectedFaction], s.selectedMainBaseIndex[s.selectedFaction] ?? 0)
  )
}

/** Returns the list of building IDs used in the current faction's main base(s). For variant factions, merges both bases. */
export function useUsedBuildingIds(): string[] {
  const state = useMainStore((s) => s.mainBaseState[s.selectedFaction])
  return useMemo(() => {
    const usedIds: string[] = []
    const isTuple = Array.isArray(state) && state.length === 2
    const toScan: MainBaseState[] = isTuple ? [state[0] as MainBaseState, state[1] as MainBaseState] : [state as MainBaseState]
    for (const mainBaseState of toScan) {
      if (!Array.isArray(mainBaseState)) continue
      for (const row of mainBaseState) {
        if (!Array.isArray(row)) continue
        for (const group of row) {
          if (!Array.isArray(group)) continue
          for (const cell of group) {
            if (cell !== null) usedIds.push(cell)
          }
        }
      }
    }
    return usedIds
  }, [state])
}

/** Single subscription: building order for the current faction's current base. */
export function useCurrentBuildingOrder(): BuildingCoords[] {
  return useMainStore((s) =>
    getBuildingOrderSlice(s.buildingOrder[s.selectedFaction], s.selectedMainBaseIndex[s.selectedFaction] ?? 0)
  )
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

/** Whether the current build is up to date with the last save (single subscription). */
export function useIsBuildUpToDate(): boolean {
  return useMainStore((s) => {
    if (s.lastSavedSnapshot === null) return false
    const currentSnapshot = getBuildSnapshot({
      selectedFaction: s.selectedFaction,
      selectedMainBaseIndex: s.selectedMainBaseIndex,
      mainBaseState: s.mainBaseState,
      buildingOrder: s.buildingOrder,
      armoryState: s.armoryState,
      unitSlotCount: s.unitSlotCount,
      unitSlots: s.unitSlots,
      councillorSlots: s.councillorSlots,
      operationSlots: s.operationSlots,
      panelVisibility: s.panelVisibility,
      developmentsSummary: s.developmentsSummary,
      selectedDevelopments: s.selectedDevelopments,
      metadata: s.metadata,
      currentBuildName: s.currentBuildName,
    })
    return currentSnapshot === s.lastSavedSnapshot
  })
}

/** Single subscription: whether the current faction base has at least one building. */
export function useIsBuildEmpty(): boolean {
  return useMainStore((s) => isFactionBaseEmpty(s.mainBaseState, s.selectedFaction))
}

/** Single subscription: armory state for the current faction (5 units × 2 slots). */
export function useCurrentArmoryState(): (string | null)[][] {
  return useMainStore((s) => s.armoryState[s.selectedFaction])
}

/** Single subscription: unit slots for the current faction. */
export function useCurrentUnitSlots(): (string | null)[] {
  return useMainStore((s) => s.unitSlots[s.selectedFaction])
}

/** Single subscription: councillor slots for the current faction ([oldest, newest], max 2). */
export function useCurrentCouncillorSlots(): (string | null)[] {
  return useMainStore((s) => s.councillorSlots[s.selectedFaction] ?? [null, null])
}

/** Single subscription: operation slots for the current faction (5 slots). */
export function useCurrentOperationSlots(): (string | null)[] {
  return useMainStore((s) => s.operationSlots[s.selectedFaction] ?? createEmptyOperationSlotsForFaction())
}
