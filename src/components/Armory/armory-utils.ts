import type { FactionLabel } from "../../store"
import unitsData from "../Units/units.json"
import armoryData from "./armory.json"

export interface GearItem {
  id: string
  name: string
  unit: string[]
  faction: string[]
  attributes: (string | { desc: string; target_effects_list: string[] })[]
  target_effects?: string[]
  image: string
}

export interface UnitData {
  id: string
  name: string
  desc: string
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
