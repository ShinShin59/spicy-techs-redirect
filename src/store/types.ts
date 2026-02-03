/**
 * Store types, constants, and pure helpers. No store refs, no main-base import.
 */

export const FACTION_LABELS = ["harkonnen", "atreides", "ecaz", "smuggler", "vernius", "fremen", "corrino"] as const
export type FactionLabel = (typeof FACTION_LABELS)[number]

export const UNITS_PER_FACTION = 5
export const GEAR_SLOTS_PER_UNIT = 2
export const MAX_COUNCILLORS = 2
export const OPERATION_SLOTS_COUNT = 5
export const MAIN_STORE_PERSIST_KEY = "spicy-techs-main-store"
export const HERO_SLOT_INDEX = 1
export const MAX_UNIT_SLOT_COUNT = 26
export const MAX_UNIT_CP = 65
export const DEFAULT_UNIT_SLOT_COUNT = 2
export const DEFAULT_AUTHOR = "anon"
export const INITIAL_BUILD_NAME = "atreides 1"

export function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x))
}

export interface BuildingCoords {
  rowIndex: number
  groupIndex: number
  cellIndex: number
}

export type BuildingOrderState = Record<FactionLabel, BuildingCoords[]>
export type ArmoryState = Record<FactionLabel, (string | null)[][]>
export type UnitSlotsState = Record<FactionLabel, (string | null)[]>
export type CouncillorSlotsState = Record<FactionLabel, (string | null)[]>
export type OperationSlotsState = Record<FactionLabel, (string | null)[]>

export interface PanelVisibility {
  mainBaseOpen: boolean
  armoryOpen: boolean
  unitsOpen: boolean
  councillorsOpen: boolean
  operationsOpen: boolean
  developmentsOpen: boolean
}

export interface DevelopmentsSummary {
  economic: number
  military: number
  green: number
  statecraft: number
}

export type SelectedDevelopments = string[]

export interface BuildMetadata {
  author: string
  social: string
  commentary: string
  media: string
}

/** Main base state shape (row → group → cell). Same as main-base.MainBaseState. */
export type MainBaseStateShape = (string | null)[][][]

export interface SavedBuild {
  id: string
  name: string
  createdAt: number
  selectedFaction: FactionLabel
  mainBaseState: Record<FactionLabel, MainBaseStateShape>
  buildingOrder: BuildingOrderState
  armoryState: ArmoryState
  unitSlotCount: number
  unitSlots: UnitSlotsState
  councillorSlots: CouncillorSlotsState
  operationSlots: OperationSlotsState
  panelVisibility: PanelVisibility
  developmentsSummary: DevelopmentsSummary
  selectedDevelopments?: SelectedDevelopments
  metadata: BuildMetadata
}

export type BuildSnapshot = string | null
export type CurrentBuildId = string | null

export interface NormalizedBuildFields {
  unitSlotCount: number
  armoryState: ArmoryState
  unitSlots: UnitSlotsState
  councillorSlots: CouncillorSlotsState
  operationSlots: OperationSlotsState
  panelVisibility: PanelVisibility
  developmentsSummary: DevelopmentsSummary
  selectedDevelopments: SelectedDevelopments
  metadata: BuildMetadata
}

export type BuildSnapshotState = {
  selectedFaction: FactionLabel
  mainBaseState: Record<FactionLabel, MainBaseStateShape>
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
}

export function getBuildSnapshot(state: BuildSnapshotState): string {
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

export function getDefaultBuildName(faction: FactionLabel, savedBuilds: SavedBuild[]): string {
  const factionNumRegex = new RegExp(`^${faction}\\s+(\\d+)$`)
  const existingNums = savedBuilds
    .map((b) => b.name.match(factionNumRegex)?.[1])
    .filter(Boolean)
    .map((s) => parseInt(s!, 10))
  const nextNum = existingNums.length === 0 ? 1 : Math.max(...existingNums) + 1
  return `${faction} ${nextNum}`
}

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

export function isFactionBaseEmpty(
  mainBaseState: Record<FactionLabel, MainBaseStateShape>,
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
