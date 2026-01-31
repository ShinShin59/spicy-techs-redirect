import type { FactionLabel } from "../../store"
import unitsData from "./units.json"

export interface UnitData {
  id: string
  name: string
  desc: string
  equipment: string[]
}

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

/** Get a unit by its ID for a specific faction */
export function getUnitById(faction: FactionLabel, unitId: string): UnitData | undefined {
  const units = getUnitsForFaction(faction)
  return units.find((u) => u.id === unitId)
}

/** Get a unit by its name for a specific faction */
export function getUnitByName(faction: FactionLabel, unitName: string): UnitData | undefined {
  const units = getUnitsForFaction(faction)
  return units.find((u) => u.name === unitName)
}
