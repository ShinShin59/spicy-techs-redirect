/**
 * Initial state and normalization. Used by main store and load/duplicate/shared. Depends only on types.
 */

import type {
  ArmoryState,
  BuildingOrderState,
  UnitSlotsState,
  CouncillorSlotsState,
  OperationSlotsState,
  PanelVisibility,
  DevelopmentsSummary,
  BuildMetadata,
  NormalizedBuildFields,
  SavedBuild,
} from "./types"
import {
  UNITS_PER_FACTION,
  GEAR_SLOTS_PER_UNIT,
  OPERATION_SLOTS_COUNT,
  DEFAULT_UNIT_SLOT_COUNT,
  DEFAULT_AUTHOR,
} from "./types"

export const initialPanelVisibility: PanelVisibility = {
  mainBaseOpen: true,
  armoryOpen: true,
  unitsOpen: true,
  councillorsOpen: true,
  operationsOpen: true,
  developmentsOpen: true,
}

export const initialDevelopmentsSummary: DevelopmentsSummary = {
  economic: 0,
  military: 0,
  green: 0,
  statecraft: 0,
}

export const initialBuildingOrder: BuildingOrderState = {
  harkonnen: [],
  atreides: [],
  ecaz: [],
  smuggler: [],
  vernius: [],
  fremen: [],
  corrino: [],
}

export function createEmptyArmoryForFaction(): (string | null)[][] {
  return Array.from({ length: UNITS_PER_FACTION }, () =>
    Array.from({ length: GEAR_SLOTS_PER_UNIT }, () => null)
  )
}

export const initialArmoryState: ArmoryState = {
  harkonnen: createEmptyArmoryForFaction(),
  atreides: createEmptyArmoryForFaction(),
  ecaz: createEmptyArmoryForFaction(),
  smuggler: createEmptyArmoryForFaction(),
  vernius: createEmptyArmoryForFaction(),
  fremen: createEmptyArmoryForFaction(),
  corrino: createEmptyArmoryForFaction(),
}

export function createEmptyUnitSlotsForFaction(): (string | null)[] {
  return [null, null]
}

export const initialUnitSlotsState: UnitSlotsState = {
  harkonnen: createEmptyUnitSlotsForFaction(),
  atreides: createEmptyUnitSlotsForFaction(),
  ecaz: createEmptyUnitSlotsForFaction(),
  smuggler: createEmptyUnitSlotsForFaction(),
  vernius: createEmptyUnitSlotsForFaction(),
  fremen: createEmptyUnitSlotsForFaction(),
  corrino: createEmptyUnitSlotsForFaction(),
}

export function createEmptyCouncillorSlotsForFaction(): (string | null)[] {
  return [null, null]
}

export const initialCouncillorSlotsState: CouncillorSlotsState = {
  harkonnen: createEmptyCouncillorSlotsForFaction(),
  atreides: createEmptyCouncillorSlotsForFaction(),
  ecaz: createEmptyCouncillorSlotsForFaction(),
  smuggler: createEmptyCouncillorSlotsForFaction(),
  vernius: createEmptyCouncillorSlotsForFaction(),
  fremen: createEmptyCouncillorSlotsForFaction(),
  corrino: createEmptyCouncillorSlotsForFaction(),
}

export function createEmptyOperationSlotsForFaction(): (string | null)[] {
  return Array.from({ length: OPERATION_SLOTS_COUNT }, () => null)
}

export const initialOperationSlotsState: OperationSlotsState = {
  harkonnen: createEmptyOperationSlotsForFaction(),
  atreides: createEmptyOperationSlotsForFaction(),
  ecaz: createEmptyOperationSlotsForFaction(),
  smuggler: createEmptyOperationSlotsForFaction(),
  vernius: createEmptyOperationSlotsForFaction(),
  fremen: createEmptyOperationSlotsForFaction(),
  corrino: createEmptyOperationSlotsForFaction(),
}

export function createEmptyMetadata(author: string = DEFAULT_AUTHOR): BuildMetadata {
  return { author, social: "", commentary: "", media: "" }
}

export function normalizeOptionalUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed
  return `https://${trimmed}`
}

export function normalizePanelVisibility(pv: Partial<PanelVisibility> | undefined): PanelVisibility {
  return {
    mainBaseOpen: pv?.mainBaseOpen ?? initialPanelVisibility.mainBaseOpen,
    armoryOpen: pv?.armoryOpen ?? initialPanelVisibility.armoryOpen,
    unitsOpen: pv?.unitsOpen ?? initialPanelVisibility.unitsOpen,
    councillorsOpen: pv?.councillorsOpen ?? initialPanelVisibility.councillorsOpen,
    operationsOpen: pv?.operationsOpen ?? initialPanelVisibility.operationsOpen,
    developmentsOpen: pv?.developmentsOpen ?? (pv as { knowledgeOpen?: boolean })?.knowledgeOpen ?? initialPanelVisibility.developmentsOpen,
  }
}

export function normalizeMetadata(m: BuildMetadata | undefined, defaultAuthor: string): BuildMetadata {
  if (!m) return createEmptyMetadata(defaultAuthor)
  return {
    author: typeof m.author === "string" ? m.author : defaultAuthor,
    social: typeof m.social === "string" ? m.social : "",
    commentary: typeof m.commentary === "string" ? m.commentary : "",
    media: typeof m.media === "string" ? m.media : "",
  }
}

/**
 * Normalize optional/legacy fields from a loaded build or payload.
 */
export function normalizeLoadedBuild(
  build: Partial<SavedBuild> & Pick<SavedBuild, "selectedFaction" | "mainBaseState" | "buildingOrder">,
  defaultAuthor: string
): NormalizedBuildFields {
  const developmentsSummary =
    (build as SavedBuild & { developmentsSummary?: DevelopmentsSummary }).developmentsSummary ??
    initialDevelopmentsSummary
  return {
    unitSlotCount: typeof build.unitSlotCount === "number" ? build.unitSlotCount : DEFAULT_UNIT_SLOT_COUNT,
    armoryState: build.armoryState || initialArmoryState,
    unitSlots: build.unitSlots || initialUnitSlotsState,
    councillorSlots: build.councillorSlots || initialCouncillorSlotsState,
    operationSlots: build.operationSlots ?? initialOperationSlotsState,
    panelVisibility: normalizePanelVisibility(build.panelVisibility),
    developmentsSummary,
    selectedDevelopments: Array.isArray(build.selectedDevelopments) ? [...build.selectedDevelopments] : [],
    metadata: normalizeMetadata(build.metadata, defaultAuthor),
  }
}

