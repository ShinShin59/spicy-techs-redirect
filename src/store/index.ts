import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { SharedBuildPayload } from "../utils/mainBaseShare"
export { useUIStore } from "./ui"
import type { MainBaseLayout, MainBaseState } from "./main-base"
import { mainBasesLayout, mainBasesState } from "./main-base"

export const FACTION_LABELS = ["harkonnen", "atreides", "ecaz", "smuggler", "vernius", "fremen", "corrino"];
export type FactionLabel = "harkonnen" | "atreides" | "ecaz" | "smuggler" | "vernius" | "fremen" | "corrino";

/** Number of units per faction */
export const UNITS_PER_FACTION = 5
/** Number of gear slots per unit */
export const GEAR_SLOTS_PER_UNIT = 2

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

/** Armory state: 5 units × 2 gear slots per faction */
export type ArmoryState = Record<FactionLabel, (string | null)[][]>

/** Armory slot coordinates for ordering */
export interface ArmoryCoords {
  unitIndex: number
  slotIndex: number
}

/** Armory order per faction */
export type ArmoryOrderState = Record<FactionLabel, ArmoryCoords[]>

/** Unit slots state: array of unit IDs per faction */
export type UnitSlotsState = Record<FactionLabel, (string | null)[]>

/** Units order per faction (array of slot indices) */
export type UnitsOrderState = Record<FactionLabel, number[]>

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

/** Creates initial armory state for a faction (5 units × 2 slots, all null) */
function createEmptyArmoryForFaction(): (string | null)[][] {
  return Array.from({ length: UNITS_PER_FACTION }, () =>
    Array.from({ length: GEAR_SLOTS_PER_UNIT }, () => null)
  )
}

/** Initial armory state (empty for all factions) */
const initialArmoryState: ArmoryState = {
  harkonnen: createEmptyArmoryForFaction(),
  atreides: createEmptyArmoryForFaction(),
  ecaz: createEmptyArmoryForFaction(),
  smuggler: createEmptyArmoryForFaction(),
  vernius: createEmptyArmoryForFaction(),
  fremen: createEmptyArmoryForFaction(),
  corrino: createEmptyArmoryForFaction(),
}

/** Initial armory order (empty per faction) */
const initialArmoryOrder: ArmoryOrderState = {
  harkonnen: [],
  atreides: [],
  ecaz: [],
  smuggler: [],
  vernius: [],
  fremen: [],
  corrino: [],
}

/** Creates initial unit slots for a faction (empty array) */
function createEmptyUnitSlotsForFaction(): (string | null)[] {
  return []
}

/** Initial unit slots state (empty for all factions) */
const initialUnitSlotsState: UnitSlotsState = {
  harkonnen: createEmptyUnitSlotsForFaction(),
  atreides: createEmptyUnitSlotsForFaction(),
  ecaz: createEmptyUnitSlotsForFaction(),
  smuggler: createEmptyUnitSlotsForFaction(),
  vernius: createEmptyUnitSlotsForFaction(),
  fremen: createEmptyUnitSlotsForFaction(),
  corrino: createEmptyUnitSlotsForFaction(),
}

/** Initial units order (empty per faction) */
const initialUnitsOrder: UnitsOrderState = {
  harkonnen: [],
  atreides: [],
  ecaz: [],
  smuggler: [],
  vernius: [],
  fremen: [],
  corrino: [],
}

const DEFAULT_UNIT_SLOT_COUNT = 5
export const MAX_UNIT_SLOT_COUNT = 25

/** Panel visibility state */
export interface PanelVisibility {
  mainBaseOpen: boolean
  armoryOpen: boolean
  unitsOpen: boolean
  metadataOpen: boolean
}

const initialPanelVisibility: PanelVisibility = {
  mainBaseOpen: true,
  armoryOpen: true,
  unitsOpen: true,
  metadataOpen: false,
}

/** Build metadata (author, social, commentary) */
export interface BuildMetadata {
  author: string
  social: string
  commentary: string
}

const DEFAULT_AUTHOR = "anon"

function createEmptyMetadata(author: string = DEFAULT_AUTHOR): BuildMetadata {
  return { author, social: "", commentary: "" }
}

/** Saved build (local list, id not in URL) */
export interface SavedBuild {
  id: string
  name: string
  createdAt: number
  selectedFaction: FactionLabel
  mainBaseState: Record<FactionLabel, MainBaseState>
  buildingOrder: BuildingOrderState
  armoryState: ArmoryState
  armoryOrder: ArmoryOrderState
  unitSlotCount: number
  unitSlots: UnitSlotsState
  unitsOrder: UnitsOrderState
  panelVisibility: PanelVisibility
  metadata: BuildMetadata
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
  armoryState: ArmoryState
  armoryOrder: ArmoryOrderState
  unitSlotCount: number
  unitSlots: UnitSlotsState
  unitsOrder: UnitsOrderState
  panelVisibility: PanelVisibility
  metadata: BuildMetadata
  defaultAuthor: string
  currentBuildName: string
  currentBuildId: CurrentBuildId
  savedBuilds: SavedBuild[]
  lastSavedSnapshot: BuildSnapshot
  setMainBaseCell: (rowIndex: number, groupIndex: number, cellIndex: number, buildingId: string | null) => void
  updateBuildingOrder: (newOrder: BuildingCoords[]) => void
  setArmorySlot: (unitIndex: number, slotIndex: number, gearName: string | null) => void
  updateArmoryOrder: (newOrder: ArmoryCoords[]) => void
  setUnitSlot: (slotIndex: number, unitId: string | null) => void
  updateUnitsOrder: (newOrder: number[]) => void
  removeUnitSlot: (slotIndex: number) => void
  addUnitSlot: () => void
  toggleMainBase: () => void
  toggleArmory: () => void
  toggleUnits: () => void
  toggleMetadata: () => void
  setMetadataAuthor: (author: string) => void
  setMetadataSocial: (social: string) => void
  setMetadataCommentary: (commentary: string) => void
  loadSharedBuild: (payload: SharedBuildPayload) => void
  setCurrentBuildName: (name: string) => void
  saveCurrentBuild: (name?: string) => void
  loadBuild: (id: string) => void
  duplicateBuild: (id: string) => void
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
  armoryState: ArmoryState
  armoryOrder: ArmoryOrderState
  unitSlotCount: number
  unitSlots: UnitSlotsState
  unitsOrder: UnitsOrderState
  panelVisibility: PanelVisibility
  metadata: BuildMetadata
  currentBuildName: string
}): string {
  return JSON.stringify({
    selectedFaction: state.selectedFaction,
    mainBaseState: state.mainBaseState,
    buildingOrder: state.buildingOrder,
    armoryState: state.armoryState,
    armoryOrder: state.armoryOrder,
    unitSlotCount: state.unitSlotCount,
    unitSlots: state.unitSlots,
    unitsOrder: state.unitsOrder,
    panelVisibility: state.panelVisibility,
    metadata: state.metadata,
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
          unitSlotCount: DEFAULT_UNIT_SLOT_COUNT,
          metadata: createEmptyMetadata(g.defaultAuthor),
          currentBuildId: null,
          currentBuildName: getDefaultBuildName(faction, get().savedBuilds),
        })
      },
      mainBaseState: mainBasesState,
      buildingOrder: initialBuildingOrder,
      armoryState: initialArmoryState,
      armoryOrder: initialArmoryOrder,
      unitSlotCount: DEFAULT_UNIT_SLOT_COUNT,
      unitSlots: initialUnitSlotsState,
      unitsOrder: initialUnitsOrder,
      panelVisibility: initialPanelVisibility,
      metadata: createEmptyMetadata(),
      defaultAuthor: DEFAULT_AUTHOR,
      currentBuildName: INITIAL_BUILD_NAME,
      currentBuildId: null,
      savedBuilds: [],
      lastSavedSnapshot: null,
      toggleMainBase: () => {
        const { panelVisibility } = get()
        set({ panelVisibility: { ...panelVisibility, mainBaseOpen: !panelVisibility.mainBaseOpen } })
        get().saveCurrentBuild()
      },
      toggleArmory: () => {
        const { panelVisibility } = get()
        set({ panelVisibility: { ...panelVisibility, armoryOpen: !panelVisibility.armoryOpen } })
        get().saveCurrentBuild()
      },
      toggleUnits: () => {
        const { panelVisibility } = get()
        set({ panelVisibility: { ...panelVisibility, unitsOpen: !panelVisibility.unitsOpen } })
        get().saveCurrentBuild()
      },
      toggleMetadata: () => {
        const { panelVisibility } = get()
        set({ panelVisibility: { ...panelVisibility, metadataOpen: !panelVisibility.metadataOpen } })
        get().saveCurrentBuild()
      },
      setMetadataAuthor: (author) => {
        const { metadata } = get()
        const trimmed = author.trim() || DEFAULT_AUTHOR
        set({
          metadata: { ...metadata, author: trimmed },
          // Update defaultAuthor if user specifies a non-default author
          defaultAuthor: trimmed !== DEFAULT_AUTHOR ? trimmed : get().defaultAuthor,
        })
        get().saveCurrentBuild()
      },
      setMetadataSocial: (social) => {
        const { metadata } = get()
        set({ metadata: { ...metadata, social } })
        get().saveCurrentBuild()
      },
      setMetadataCommentary: (commentary) => {
        const { metadata } = get()
        set({ metadata: { ...metadata, commentary } })
        get().saveCurrentBuild()
      },
      addUnitSlot: () => {
        const g = get()
        if (g.unitSlotCount >= MAX_UNIT_SLOT_COUNT) return
        set({ unitSlotCount: g.unitSlotCount + 1 })
        get().saveCurrentBuild()
      },
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
      updateBuildingOrder: (newOrder) => {
        const { selectedFaction, buildingOrder } = get()
        set({
          buildingOrder: {
            ...buildingOrder,
            [selectedFaction]: newOrder,
          },
        })
        get().saveCurrentBuild()
      },
      setArmorySlot: (unitIndex, slotIndex, gearName) => {
        const { selectedFaction, armoryState, armoryOrder } = get()
        const factionArmory = armoryState[selectedFaction]
        const newUnitGearSlots = [...factionArmory[unitIndex]]
        newUnitGearSlots[slotIndex] = gearName
        const newFactionArmory = factionArmory.map((slots, i) =>
          i === unitIndex ? newUnitGearSlots : slots
        )

        // Update armory order
        const factionOrder = armoryOrder[selectedFaction]
        const coords: ArmoryCoords = { unitIndex, slotIndex }
        const filteredOrder = factionOrder.filter(
          (c) => !(c.unitIndex === unitIndex && c.slotIndex === slotIndex)
        )
        const newFactionOrder = gearName !== null
          ? [...filteredOrder, coords]
          : filteredOrder

        set({
          armoryState: {
            ...armoryState,
            [selectedFaction]: newFactionArmory,
          },
          armoryOrder: {
            ...armoryOrder,
            [selectedFaction]: newFactionOrder,
          },
        })
        get().saveCurrentBuild()
      },
      updateArmoryOrder: (newOrder) => {
        const { selectedFaction, armoryOrder } = get()
        set({
          armoryOrder: {
            ...armoryOrder,
            [selectedFaction]: newOrder,
          },
        })
        get().saveCurrentBuild()
      },
      setUnitSlot: (slotIndex, unitId) => {
        const { selectedFaction, unitSlots, unitsOrder } = get()
        const factionUnitSlots = [...unitSlots[selectedFaction]]
        // Ensure the array is large enough
        while (factionUnitSlots.length <= slotIndex) {
          factionUnitSlots.push(null)
        }
        factionUnitSlots[slotIndex] = unitId

        // Update units order
        const factionOrder = unitsOrder[selectedFaction]
        const filteredOrder = factionOrder.filter((i) => i !== slotIndex)
        const newFactionOrder = unitId !== null
          ? [...filteredOrder, slotIndex]
          : filteredOrder

        set({
          unitSlots: {
            ...unitSlots,
            [selectedFaction]: factionUnitSlots,
          },
          unitsOrder: {
            ...unitsOrder,
            [selectedFaction]: newFactionOrder,
          },
        })
        get().saveCurrentBuild()
      },
      updateUnitsOrder: (newOrder) => {
        const { selectedFaction, unitsOrder } = get()
        set({
          unitsOrder: {
            ...unitsOrder,
            [selectedFaction]: newOrder,
          },
        })
        get().saveCurrentBuild()
      },
      removeUnitSlot: (slotIndex) => {
        const { selectedFaction, unitSlots, unitsOrder, unitSlotCount } = get()
        const factionUnitSlots = [...unitSlots[selectedFaction]]
        // Remove the slot at the given index
        factionUnitSlots.splice(slotIndex, 1)
        // Decrease slot count (minimum DEFAULT_UNIT_SLOT_COUNT)
        const newSlotCount = Math.max(DEFAULT_UNIT_SLOT_COUNT, unitSlotCount - 1)

        // Update units order: remove the deleted index and decrement any indices greater than it
        const factionOrder = unitsOrder[selectedFaction]
        const newFactionOrder = factionOrder
          .filter((i) => i !== slotIndex)
          .map((i) => (i > slotIndex ? i - 1 : i))

        set({
          unitSlots: {
            ...unitSlots,
            [selectedFaction]: factionUnitSlots,
          },
          unitsOrder: {
            ...unitsOrder,
            [selectedFaction]: newFactionOrder,
          },
          unitSlotCount: newSlotCount,
        })
        get().saveCurrentBuild()
      },
      loadSharedBuild: (payload) => {
        const { mainBaseState, buildingOrder, armoryState, unitSlots, defaultAuthor } = get()
        const orderArray = Array.isArray(payload.order) ? payload.order : []
        const stateForFaction = Array.isArray(payload.state) ? payload.state : mainBasesState[payload.f]
        const armoryForFaction = Array.isArray(payload.armory) ? payload.armory : createEmptyArmoryForFaction()
        const unitSlotsForFaction = Array.isArray(payload.units) ? payload.units : createEmptyUnitSlotsForFaction()
        set({
          selectedFaction: payload.f,
          mainBaseState: { ...mainBaseState, [payload.f]: stateForFaction },
          buildingOrder: { ...buildingOrder, [payload.f]: orderArray },
          armoryState: { ...armoryState, [payload.f]: armoryForFaction },
          unitSlots: { ...unitSlots, [payload.f]: unitSlotsForFaction },
          unitSlotCount: DEFAULT_UNIT_SLOT_COUNT,
          metadata: createEmptyMetadata(defaultAuthor),
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
          armoryOrder,
          unitSlotCount,
          unitSlots,
          unitsOrder,
          panelVisibility,
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
          mainBaseState,
          buildingOrder,
          armoryState,
          armoryOrder,
          unitSlotCount,
          unitSlots,
          unitsOrder,
          panelVisibility,
          metadata,
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
            armoryState: deepClone(armoryState),
            armoryOrder: deepClone(armoryOrder),
            unitSlotCount,
            unitSlots: deepClone(unitSlots),
            unitsOrder: deepClone(unitsOrder),
            panelVisibility: deepClone(panelVisibility),
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
            mainBaseState: deepClone(mainBaseState),
            buildingOrder: deepClone(buildingOrder),
            armoryState: deepClone(armoryState),
            armoryOrder: deepClone(armoryOrder),
            unitSlotCount,
            unitSlots: deepClone(unitSlots),
            unitsOrder: deepClone(unitsOrder),
            panelVisibility: deepClone(panelVisibility),
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
        const unitSlotCount = typeof build.unitSlotCount === "number" ? build.unitSlotCount : DEFAULT_UNIT_SLOT_COUNT
        const armoryState = build.armoryState || initialArmoryState
        const armoryOrder = build.armoryOrder || initialArmoryOrder
        const unitSlots = build.unitSlots || initialUnitSlotsState
        const unitsOrder = build.unitsOrder || initialUnitsOrder
        const panelVisibility = build.panelVisibility || initialPanelVisibility
        const metadata = build.metadata || createEmptyMetadata(defaultAuthor)
        const snapshot = getBuildSnapshot({
          selectedFaction: build.selectedFaction,
          mainBaseState: build.mainBaseState,
          buildingOrder: build.buildingOrder,
          armoryState,
          armoryOrder,
          unitSlotCount,
          unitSlots,
          unitsOrder,
          panelVisibility,
          metadata,
          currentBuildName: build.name,
        })
        set({
          selectedFaction: build.selectedFaction,
          mainBaseState: deepClone(build.mainBaseState),
          buildingOrder: deepClone(build.buildingOrder),
          armoryState: deepClone(armoryState),
          armoryOrder: deepClone(armoryOrder),
          unitSlotCount,
          unitSlots: deepClone(unitSlots),
          unitsOrder: deepClone(unitsOrder),
          panelVisibility: deepClone(panelVisibility),
          metadata: deepClone(metadata),
          currentBuildName: build.name,
          currentBuildId: id,
          lastSavedSnapshot: snapshot,
        })
      },
      duplicateBuild: (id) => {
        const { savedBuilds, defaultAuthor } = get()
        const build = savedBuilds.find((b) => b.id === id)
        if (!build) return
        const unitSlotCount = typeof build.unitSlotCount === "number" ? build.unitSlotCount : DEFAULT_UNIT_SLOT_COUNT
        const armoryState = build.armoryState || initialArmoryState
        const armoryOrder = build.armoryOrder || initialArmoryOrder
        const unitSlots = build.unitSlots || initialUnitSlotsState
        const unitsOrder = build.unitsOrder || initialUnitsOrder
        const panelVisibility = build.panelVisibility || initialPanelVisibility
        const metadata = build.metadata || createEmptyMetadata(defaultAuthor)
        const newName = getUniqueBuildName(build.name + " (copy)", savedBuilds)
        const newId = generateBuildId()
        const duplicated: SavedBuild = {
          id: newId,
          name: newName,
          createdAt: Date.now(),
          selectedFaction: build.selectedFaction,
          mainBaseState: deepClone(build.mainBaseState),
          buildingOrder: deepClone(build.buildingOrder),
          armoryState: deepClone(armoryState),
          armoryOrder: deepClone(armoryOrder),
          unitSlotCount,
          unitSlots: deepClone(unitSlots),
          unitsOrder: deepClone(unitsOrder),
          panelVisibility: deepClone(panelVisibility),
          metadata: deepClone(metadata),
        }
        const snapshot = getBuildSnapshot({
          selectedFaction: duplicated.selectedFaction,
          mainBaseState: duplicated.mainBaseState,
          buildingOrder: duplicated.buildingOrder,
          armoryState: duplicated.armoryState,
          armoryOrder: duplicated.armoryOrder,
          unitSlotCount: duplicated.unitSlotCount,
          unitSlots: duplicated.unitSlots,
          unitsOrder: duplicated.unitsOrder,
          panelVisibility: duplicated.panelVisibility,
          metadata: duplicated.metadata,
          currentBuildName: duplicated.name,
        })
        set({
          savedBuilds: [duplicated, ...savedBuilds],
          selectedFaction: duplicated.selectedFaction,
          mainBaseState: deepClone(duplicated.mainBaseState),
          buildingOrder: deepClone(duplicated.buildingOrder),
          armoryState: deepClone(duplicated.armoryState),
          armoryOrder: deepClone(duplicated.armoryOrder),
          unitSlotCount: duplicated.unitSlotCount,
          unitSlots: deepClone(duplicated.unitSlots),
          unitsOrder: deepClone(duplicated.unitsOrder),
          panelVisibility: deepClone(duplicated.panelVisibility),
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
            mainBaseState: mainBasesState,
            buildingOrder: initialBuildingOrder,
            armoryState: initialArmoryState,
            armoryOrder: initialArmoryOrder,
            unitSlotCount: DEFAULT_UNIT_SLOT_COUNT,
            unitSlots: initialUnitSlotsState,
            unitsOrder: initialUnitsOrder,
            panelVisibility: initialPanelVisibility,
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
          mainBaseState: mainBasesState,
          buildingOrder: initialBuildingOrder,
          armoryState: initialArmoryState,
          armoryOrder: initialArmoryOrder,
          unitSlotCount: DEFAULT_UNIT_SLOT_COUNT,
          unitSlots: initialUnitSlotsState,
          unitsOrder: initialUnitsOrder,
          panelVisibility: initialPanelVisibility,
          metadata: createEmptyMetadata(defaultAuthor),
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
            armoryState: g.armoryState,
            armoryOrder: g.armoryOrder,
            unitSlotCount: g.unitSlotCount,
            unitSlots: g.unitSlots,
            unitsOrder: g.unitsOrder,
            panelVisibility: g.panelVisibility,
            metadata: g.metadata,
            currentBuildName: trimmed,
          })
        }
        set(updates)
      },
    }),
    {
      name: "spicy-techs-main-store",
      migrate: (persisted: unknown) => {
        const p = persisted as Record<string, unknown> | null
        if (!p || typeof p !== "object") return persisted as unknown as MainStore
        const migrated = { ...p } as Record<string, unknown>
        const defaultAuthor = typeof migrated.defaultAuthor === "string" ? migrated.defaultAuthor : DEFAULT_AUTHOR
        if (typeof migrated.unitSlotCount !== "number") {
          migrated.unitSlotCount = DEFAULT_UNIT_SLOT_COUNT
        }
        // Migrate armoryState if missing
        if (!migrated.armoryState) {
          migrated.armoryState = initialArmoryState
        }
        // Migrate armoryOrder if missing
        if (!migrated.armoryOrder) {
          migrated.armoryOrder = initialArmoryOrder
        }
        // Migrate unitSlots if missing
        if (!migrated.unitSlots) {
          migrated.unitSlots = initialUnitSlotsState
        }
        // Migrate unitsOrder if missing
        if (!migrated.unitsOrder) {
          migrated.unitsOrder = initialUnitsOrder
        }
        // Migrate panelVisibility if missing
        if (!migrated.panelVisibility) {
          migrated.panelVisibility = initialPanelVisibility
        }
        // Migrate metadata if missing
        if (!migrated.metadata) {
          migrated.metadata = createEmptyMetadata(defaultAuthor)
        }
        // Migrate defaultAuthor if missing
        if (!migrated.defaultAuthor) {
          migrated.defaultAuthor = DEFAULT_AUTHOR
        }
        const builds = migrated.savedBuilds
        if (Array.isArray(builds)) {
          migrated.savedBuilds = builds.map((b: Record<string, unknown>) => {
            const updated = { ...b }
            if (typeof (b as { unitSlotCount?: number }).unitSlotCount !== "number") {
              updated.unitSlotCount = DEFAULT_UNIT_SLOT_COUNT
            }
            if (!(b as { armoryState?: unknown }).armoryState) {
              updated.armoryState = initialArmoryState
            }
            if (!(b as { armoryOrder?: unknown }).armoryOrder) {
              updated.armoryOrder = initialArmoryOrder
            }
            if (!(b as { unitSlots?: unknown }).unitSlots) {
              updated.unitSlots = initialUnitSlotsState
            }
            if (!(b as { unitsOrder?: unknown }).unitsOrder) {
              updated.unitsOrder = initialUnitsOrder
            }
            if (!(b as { panelVisibility?: unknown }).panelVisibility) {
              updated.panelVisibility = initialPanelVisibility
            }
            if (!(b as { metadata?: unknown }).metadata) {
              updated.metadata = createEmptyMetadata(defaultAuthor)
            }
            return updated
          })
        }
        return migrated as unknown as MainStore
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
  const armoryState = useMainStore((s) => s.armoryState)
  const armoryOrder = useMainStore((s) => s.armoryOrder)
  const unitSlotCount = useMainStore((s) => s.unitSlotCount)
  const unitSlots = useMainStore((s) => s.unitSlots)
  const unitsOrder = useMainStore((s) => s.unitsOrder)
  const panelVisibility = useMainStore((s) => s.panelVisibility)
  const metadata = useMainStore((s) => s.metadata)
  const currentBuildName = useMainStore((s) => s.currentBuildName)
  const currentSnapshot = getBuildSnapshot({
    selectedFaction,
    mainBaseState,
    buildingOrder,
    armoryState,
    armoryOrder,
    unitSlotCount,
    unitSlots,
    unitsOrder,
    panelVisibility,
    metadata,
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

/** Returns the armory state for the current faction (5 units × 2 slots). */
export function useCurrentArmoryState(): (string | null)[][] {
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const armoryState = useMainStore((s) => s.armoryState)
  return armoryState[selectedFaction]
}

/** Returns the armory order for the current faction. */
export function useCurrentArmoryOrder(): ArmoryCoords[] {
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const armoryOrder = useMainStore((s) => s.armoryOrder)
  return armoryOrder[selectedFaction] ?? []
}

/** Get armory slot order number (1-based) or null if not found. */
export function getArmoryOrderNumber(
  order: ArmoryCoords[],
  unitIndex: number,
  slotIndex: number
): number | null {
  const index = order.findIndex(
    (c) => c.unitIndex === unitIndex && c.slotIndex === slotIndex
  )
  return index >= 0 ? index + 1 : null
}

/** Returns the unit slots for the current faction. */
export function useCurrentUnitSlots(): (string | null)[] {
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const unitSlots = useMainStore((s) => s.unitSlots)
  return unitSlots[selectedFaction]
}

/** Returns the units order for the current faction. */
export function useCurrentUnitsOrder(): number[] {
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const unitsOrder = useMainStore((s) => s.unitsOrder)
  return unitsOrder[selectedFaction] ?? []
}

/** Get unit slot order number (1-based) or null if not found. */
export function getUnitsOrderNumber(
  order: number[],
  slotIndex: number
): number | null {
  const index = order.indexOf(slotIndex)
  return index >= 0 ? index + 1 : null
}

