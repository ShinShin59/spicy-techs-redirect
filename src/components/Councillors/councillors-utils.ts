import type { FactionLabel } from "@/store"
import councillorsData from "./councillors.json"

const factionToKey: Record<FactionLabel, string> = {
  atreides: "Atreides",
  harkonnen: "Harkonnen",
  smuggler: "Smugglers",
  fremen: "Fremen",
  corrino: "Corrino",
  ecaz: "Ecaz",
  vernius: "Vernius",
}

export interface CouncillorData {
  id: string
  name: string
  description: string
  category: string
  attributes: string[]
  image: string
}

const councillorsByFaction = councillorsData as Record<string, CouncillorData[]>

export function getCouncillorsForFaction(faction: FactionLabel): CouncillorData[] {
  const key = factionToKey[faction]
  return councillorsByFaction[key] ?? []
}

export function getCouncillorById(
  faction: FactionLabel,
  councillorId: string
): CouncillorData | undefined {
  const councillors = getCouncillorsForFaction(faction)
  return councillors.find((c) => c.id === councillorId)
}
