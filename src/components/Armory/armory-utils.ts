import type { FactionLabel } from "../../store"
import unitsData from "../Units/units.json"
import armoryData from "./armory.json"

export interface GearItem {
  id: string
  name: string
  unit: string[]
  faction: string[]
  attributes: (string | { desc: string; target_effects_list: string[] })[]
  image: string
  /** When set, this gear overrides the unit's CP cost to this value when equipped. */
  unitCpCost?: number
}

export interface UnitData {
  id: string
  name: string
  desc: string
  cpCost?: number
  equipment: string[]
}

const gearItems = armoryData as GearItem[]

// Build a lookup map by id for fast access
const gearById = new Map<string, GearItem>(
  gearItems.map((g) => [g.id, g])
)

/** Maps store faction label to units.json key */
const factionToUnitsKey: Record<FactionLabel, keyof typeof unitsData> = {
  harkonnen: "Harkonnen",
  atreides: "Atreides",
  ecaz: "Ecaz",
  smuggler: "Smugglers",
  vernius: "Vernius",
  fremen: "Fremen",
  corrino: "Corrino",
}

/** Get units for a faction */
export function getUnitsForFaction(faction: FactionLabel): UnitData[] {
  const key = factionToUnitsKey[faction]
  return (unitsData[key] as UnitData[]) || []
}

/** Get gear item by name */
export function getGearByName(name: string): GearItem | undefined {
  return gearItems.find((g) => g.name === name)
}

/** Get gear item by id (equipment ID from units.json) */
export function getGearById(id: string): GearItem | undefined {
  return gearById.get(id)
}

/** Get available gear for a unit (based on equipment array) */
export function getGearOptionsForUnit(unit: UnitData): GearItem[] {
  return unit.equipment
    .map((equipId) => getGearById(equipId))
    .filter((g): g is GearItem => g !== undefined)
}

/**
 * Effective CP cost for a unit given current armory (gear can override via unitCpCost).
 * Uses the unit's row in the faction list to resolve equipped gear.
 */
export function getEffectiveUnitCpCost(
  faction: FactionLabel,
  unitId: string,
  factionArmory: (string | null)[][]
): number {
  const units = getUnitsForFaction(faction)
  const unit = units.find((u) => u.id === unitId)
  const base = unit?.cpCost ?? 0
  const unitIndex = units.findIndex((u) => u.id === unitId)
  if (unitIndex < 0) return base
  const gearRow = factionArmory[unitIndex] ?? []
  const overrides = gearRow
    .filter((name): name is string => name != null)
    .map((name) => getGearByName(name))
    .filter((g): g is GearItem => g != null && g.unitCpCost != null)
    .map((g) => g.unitCpCost!)
  return overrides.length > 0 ? Math.min(...overrides) : base
}
