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

/** Unit slots state: array of unit IDs per faction */
export type UnitSlotsState = Record<FactionLabel, (string | null)[]>

/** Councillor slots: max 2 per faction, order = [oldest, newest] for FIFO replacement */
export type CouncillorSlotsState = Record<FactionLabel, (string | null)[]>

/** Operation slots: 5 per faction (mission ids or null) */
export type OperationSlotsState = Record<FactionLabel, (string | null)[]>

/** Max councillors selectable per build */
export const MAX_COUNCILLORS = 2

/** Number of operation slots per faction */
export const OPERATION_SLOTS_COUNT = 5

/** Persist key for main store (localStorage); used by debug reset. */
export const MAIN_STORE_PERSIST_KEY = "spicy-techs-main-store"

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

/** Index of the hero slot (always second; first is add slot) */
export const HERO_SLOT_INDEX = 1

/** Creates initial unit slots for a faction (1 add slot + 1 hero slot; no empty unit slots by default) */
function createEmptyUnitSlotsForFaction(): (string | null)[] {
  return [null, null]
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

/** Creates initial councillor slots for a faction (2 slots, both null) */
function createEmptyCouncillorSlotsForFaction(): (string | null)[] {
  return [null, null]
}

/** Initial councillor slots state (empty for all factions) */
const initialCouncillorSlotsState: CouncillorSlotsState = {
  harkonnen: createEmptyCouncillorSlotsForFaction(),
  atreides: createEmptyCouncillorSlotsForFaction(),
  ecaz: createEmptyCouncillorSlotsForFaction(),
  smuggler: createEmptyCouncillorSlotsForFaction(),
  vernius: createEmptyCouncillorSlotsForFaction(),
  fremen: createEmptyCouncillorSlotsForFaction(),
  corrino: createEmptyCouncillorSlotsForFaction(),
}

/** Creates initial operation slots for a faction (5 slots, all null) */
function createEmptyOperationSlotsForFaction(): (string | null)[] {
  return Array.from({ length: OPERATION_SLOTS_COUNT }, () => null)
}

/** Initial operation slots state (empty for all factions) */
const initialOperationSlotsState: OperationSlotsState = {
  harkonnen: createEmptyOperationSlotsForFaction(),
  atreides: createEmptyOperationSlotsForFaction(),
  ecaz: createEmptyOperationSlotsForFaction(),
  smuggler: createEmptyOperationSlotsForFaction(),
  vernius: createEmptyOperationSlotsForFaction(),
  fremen: createEmptyOperationSlotsForFaction(),
  corrino: createEmptyOperationSlotsForFaction(),
}

const DEFAULT_UNIT_SLOT_COUNT = 2
export const MAX_UNIT_SLOT_COUNT = 26
/** Max total CP for units (hero not counted); units that would exceed this are disabled in the add selector */
export const MAX_UNIT_CP = 65

/** Panel visibility state */
export interface PanelVisibility {
  mainBaseOpen: boolean
  armoryOpen: boolean
  unitsOpen: boolean
  councillorsOpen: boolean
  operationsOpen: boolean
  developmentsOpen: boolean
}

/** Developments summary: one number per category (per build) */
export interface DevelopmentsSummary {
  economic: number
  military: number
  green: number
  statecraft: number
}

const initialDevelopmentsSummary: DevelopmentsSummary = {
  economic: 0,
  military: 0,
  green: 0,
  statecraft: 0,
}

/** Ordered list of selected development ids (source of truth for picker; summary derived in UI) */
export type SelectedDevelopments = string[]

const initialPanelVisibility: PanelVisibility = {
  mainBaseOpen: true,
  armoryOpen: true,
  unitsOpen: true,
  councillorsOpen: true,
  operationsOpen: true,
  developmentsOpen: true,
}

/** Build metadata (author, social, commentary, media) */
export interface BuildMetadata {
  author: string
  social: string
  commentary: string
  media: string
}

const DEFAULT_AUTHOR = "anon"

function createEmptyMetadata(author: string = DEFAULT_AUTHOR): BuildMetadata {
  return { author, social: "", commentary: "", media: "" }
}

function normalizeOptionalUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed
  return `https://${trimmed}`
}

function normalizePanelVisibility(pv: Partial<PanelVisibility> | undefined): PanelVisibility {
  return {
    mainBaseOpen: pv?.mainBaseOpen ?? initialPanelVisibility.mainBaseOpen,
    armoryOpen: pv?.armoryOpen ?? initialPanelVisibility.armoryOpen,
    unitsOpen: pv?.unitsOpen ?? initialPanelVisibility.unitsOpen,
    councillorsOpen: pv?.councillorsOpen ?? initialPanelVisibility.councillorsOpen,
    operationsOpen: pv?.operationsOpen ?? initialPanelVisibility.operationsOpen,
    developmentsOpen: pv?.developmentsOpen ?? (pv as { knowledgeOpen?: boolean })?.knowledgeOpen ?? initialPanelVisibility.developmentsOpen,
  }
}

function normalizeMetadata(m: BuildMetadata | undefined, defaultAuthor: string): BuildMetadata {
  if (!m) return createEmptyMetadata(defaultAuthor)
  return {
    author: typeof m.author === "string" ? m.author : defaultAuthor,
    social: typeof m.social === "string" ? m.social : "",
    commentary: typeof m.commentary === "string" ? m.commentary : "",
    media: typeof m.media === "string" ? m.media : "",
  }
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
  unitSlotCount: number
  unitSlots: UnitSlotsState
  councillorSlots: CouncillorSlotsState
  operationSlots: OperationSlotsState
  panelVisibility: PanelVisibility
  developmentsSummary: DevelopmentsSummary
  /** Ordered list of selected development ids; may be missing on older saves */
  selectedDevelopments?: SelectedDevelopments
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
  /** Reset to default and save as a new build. */
  createNewBuild: () => void
  /** Duplicate current build (or save current state as new if unsaved). */
  forkCurrentBuild: () => void
  /** Saves current build if not empty, then switches to new faction with a fresh build and default name. */
  switchFaction: (faction: FactionLabel) => void
}

export function getBuildSnapshot(state: {
  selectedFaction: FactionLabel
  mainBaseState: Record<FactionLabel, MainBaseState>
  buildingOrder: BuildingOrderState
  armoryState: ArmoryState
  unitSlotCount: number
  unitSlots: UnitSlotsState
  councillorSlots: CouncillorSlotsState
  operationSlots: OperationSlotsState
  panelVisibility: PanelVisibility
  developmentsSummary: DevelopmentsSummary
  selectedDevelopments: SelectedDevelopments
  metadata: BuildMetadata
  currentBuildName: string
}): string {
  return JSON.stringify({
    selectedFaction: state.selectedFaction,
    mainBaseState: state.mainBaseState,
    buildingOrder: state.buildingOrder,
    armoryState: state.armoryState,
    unitSlotCount: state.unitSlotCount,
    unitSlots: state.unitSlots,
    councillorSlots: state.councillorSlots,
    operationSlots: state.operationSlots,
    panelVisibility: state.panelVisibility,
    developmentsSummary: state.developmentsSummary,
    selectedDevelopments: state.selectedDevelopments,
    metadata: state.metadata,
    currentBuildName: state.currentBuildName,
  })
}

/** Current build state as a plain object (for debug / share payload). */
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
          developmentsSummary: initialDevelopmentsSummary,
          selectedDevelopments: [],
          metadata: createEmptyMetadata(g.defaultAuthor),
          currentBuildId: null,
          currentBuildName: getDefaultBuildName(faction, get().savedBuilds),
        })
        if (typeof window !== "undefined" && (window as { debug?: () => void }).debug) {
          (window as { debug: () => void }).debug()
        }
      },
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
      toggleCouncillors: () => {
        const { panelVisibility } = get()
        set({ panelVisibility: { ...panelVisibility, councillorsOpen: !panelVisibility.councillorsOpen } })
        get().saveCurrentBuild()
      },
      toggleOperations: () => {
        const { panelVisibility } = get()
        set({ panelVisibility: { ...panelVisibility, operationsOpen: !panelVisibility.operationsOpen } })
        get().saveCurrentBuild()
      },
      toggleDevelopments: () => {
        const { panelVisibility } = get()
        set({ panelVisibility: { ...panelVisibility, developmentsOpen: !panelVisibility.developmentsOpen } })
        get().saveCurrentBuild()
      },
      setSelectedDevelopments: (ids, summary) => {
        set({ selectedDevelopments: ids, developmentsSummary: summary })
        get().saveCurrentBuild()
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
        get().saveCurrentBuild()
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
        get().saveCurrentBuild()
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
        set({ metadata: { ...metadata, social: normalizeOptionalUrl(social) } })
        get().saveCurrentBuild()
      },
      setMetadataMedia: (media) => {
        const { metadata } = get()
        set({ metadata: { ...metadata, media: normalizeOptionalUrl(media) } })
        get().saveCurrentBuild()
      },
      setMetadataCommentary: (commentary) => {
        const { metadata } = get()
        set({ metadata: { ...metadata, commentary } })
        get().saveCurrentBuild()
      },
      addUnitSlot: () => {
        const g = get()
        const newSlotIndex = g.unitSlotCount
        set({ unitSlotCount: newSlotIndex + 1 })
        get().saveCurrentBuild()
        return newSlotIndex
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
        get().saveCurrentBuild()
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
        get().saveCurrentBuild()
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
        get().saveCurrentBuild()
      },
      loadSharedBuild: (payload) => {
        const { mainBaseState, buildingOrder, armoryState, unitSlots, councillorSlots, operationSlots, defaultAuthor } = get()
        const orderArray = Array.isArray(payload.order) ? payload.order : []
        const stateForFaction = Array.isArray(payload.state) ? payload.state : mainBasesState[payload.f]
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
        set({
          selectedFaction: payload.f,
          mainBaseState: { ...mainBaseState, [payload.f]: stateForFaction },
          buildingOrder: { ...buildingOrder, [payload.f]: orderArray },
          armoryState: { ...armoryState, [payload.f]: armoryForFaction },
          unitSlots: { ...unitSlots, [payload.f]: unitSlotsForFaction },
          councillorSlots: { ...councillorSlots, [payload.f]: councillorSlotsForFaction },
          operationSlots: { ...operationSlots, [payload.f]: operationSlotsForFaction },
          unitSlotCount: unitCount,
          panelVisibility: normalizePanelVisibility(payload.panelVisibility),
          developmentsSummary:
            payload.developmentsSummary && typeof payload.developmentsSummary === "object" && "economic" in payload.developmentsSummary
              ? payload.developmentsSummary as DevelopmentsSummary
              : initialDevelopmentsSummary,
          selectedDevelopments: Array.isArray(payload.selectedDevelopments) ? payload.selectedDevelopments : [],
          metadata: normalizeMetadata(payload.metadata, defaultAuthor),
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
        const unitSlotCount = typeof build.unitSlotCount === "number" ? build.unitSlotCount : DEFAULT_UNIT_SLOT_COUNT
        const armoryState = build.armoryState || initialArmoryState
        const unitSlots = build.unitSlots || initialUnitSlotsState
        const councillorSlots = build.councillorSlots || initialCouncillorSlotsState
        const operationSlots = build.operationSlots ?? initialOperationSlotsState
        const panelVisibility = normalizePanelVisibility(build.panelVisibility)
        const developmentsSummary = (build as SavedBuild & { developmentsSummary?: DevelopmentsSummary }).developmentsSummary ?? initialDevelopmentsSummary
        const selectedDevelopments = Array.isArray(build.selectedDevelopments) ? [...build.selectedDevelopments] : []
        const metadata = normalizeMetadata(build.metadata, defaultAuthor)
        const snapshot = getBuildSnapshot({
          selectedFaction: build.selectedFaction,
          mainBaseState: build.mainBaseState,
          buildingOrder: build.buildingOrder,
          armoryState,
          unitSlotCount,
          unitSlots,
          councillorSlots,
          operationSlots,
          panelVisibility,
          developmentsSummary,
          selectedDevelopments,
          metadata,
          currentBuildName: build.name,
        })
        set({
          selectedFaction: build.selectedFaction,
          mainBaseState: deepClone(build.mainBaseState),
          buildingOrder: deepClone(build.buildingOrder),
          armoryState: deepClone(armoryState),
          unitSlotCount,
          unitSlots: deepClone(unitSlots),
          councillorSlots: deepClone(councillorSlots),
          operationSlots: deepClone(operationSlots),
          panelVisibility,
          developmentsSummary: deepClone(developmentsSummary),
          selectedDevelopments,
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
        const unitSlots = build.unitSlots || initialUnitSlotsState
        const councillorSlots = build.councillorSlots || initialCouncillorSlotsState
        const operationSlots = build.operationSlots ?? initialOperationSlotsState
        const panelVisibility = normalizePanelVisibility(build.panelVisibility)
        const developmentsSummary = (build as SavedBuild & { developmentsSummary?: DevelopmentsSummary }).developmentsSummary ?? initialDevelopmentsSummary
        const selectedDevelopments = Array.isArray(build.selectedDevelopments) ? [...build.selectedDevelopments] : []
        const metadata = normalizeMetadata(build.metadata, defaultAuthor)
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
          unitSlotCount,
          unitSlots: deepClone(unitSlots),
          councillorSlots: deepClone(councillorSlots),
          operationSlots: deepClone(operationSlots),
          panelVisibility,
          developmentsSummary: deepClone(developmentsSummary),
          selectedDevelopments,
          metadata: deepClone(metadata),
        }
        const snapshot = getBuildSnapshot({
          selectedFaction: duplicated.selectedFaction,
          mainBaseState: duplicated.mainBaseState,
          buildingOrder: duplicated.buildingOrder,
          armoryState: duplicated.armoryState,
          unitSlotCount: duplicated.unitSlotCount,
          unitSlots: duplicated.unitSlots,
          councillorSlots: duplicated.councillorSlots,
          operationSlots: duplicated.operationSlots,
          panelVisibility: duplicated.panelVisibility,
          developmentsSummary: duplicated.developmentsSummary,
          selectedDevelopments: duplicated.selectedDevelopments ?? [],
          metadata: duplicated.metadata,
          currentBuildName: duplicated.name,
        })
        set({
          savedBuilds: [duplicated, ...savedBuilds],
          selectedFaction: duplicated.selectedFaction,
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
        get().saveCurrentBuild()
      },
      forkCurrentBuild: () => {
        const { currentBuildId } = get()
        if (currentBuildId !== null) {
          get().duplicateBuild(currentBuildId)
        } else {
          get().saveCurrentBuild()
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
      },
    }),
    { name: MAIN_STORE_PERSIST_KEY }
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
  const unitSlotCount = useMainStore((s) => s.unitSlotCount)
  const unitSlots = useMainStore((s) => s.unitSlots)
  const councillorSlots = useMainStore((s) => s.councillorSlots)
  const operationSlots = useMainStore((s) => s.operationSlots)
  const panelVisibility = useMainStore((s) => s.panelVisibility)
  const developmentsSummary = useMainStore((s) => s.developmentsSummary)
  const selectedDevelopments = useMainStore((s) => s.selectedDevelopments)
  const metadata = useMainStore((s) => s.metadata)
  const currentBuildName = useMainStore((s) => s.currentBuildName)
  const currentSnapshot = getBuildSnapshot({
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
    selectedDevelopments,
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

/** Returns the unit slots for the current faction. */
export function useCurrentUnitSlots(): (string | null)[] {
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const unitSlots = useMainStore((s) => s.unitSlots)
  return unitSlots[selectedFaction]
}

/** Returns the councillor slots for the current faction ([oldest, newest], max 2). */
export function useCurrentCouncillorSlots(): (string | null)[] {
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const councillorSlots = useMainStore((s) => s.councillorSlots)
  return councillorSlots[selectedFaction] ?? [null, null]
}

/** Returns the operation slots for the current faction (5 slots). */
export function useCurrentOperationSlots(): (string | null)[] {
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const operationSlots = useMainStore((s) => s.operationSlots)
  return operationSlots[selectedFaction] ?? createEmptyOperationSlotsForFaction()
}
