import type { FactionLabel } from "../../store"
import heroesData from "./hero.json"

const BASE = import.meta.env.BASE_URL
const UNIT_ICONS_PATH = `${BASE}images/units`

export interface HeroData {
  id: string
  name: string
  faction: FactionLabel
  imageName: string
  desc: string
  stats?: { health?: number; power?: number; armor?: number; range?: number; minRange?: number }
  attributes?: string[]
}

/** Maps store faction label to heroes.json key */
const factionToHeroesKey: Record<FactionLabel, keyof typeof heroesData> = {
  harkonnen: "Harkonnen",
  atreides: "Atreides",
  ecaz: "Ecaz",
  smuggler: "Smugglers",
  vernius: "Vernius",
  fremen: "Fremen",
  corrino: "Corrino",
}

/** Get heroes for a faction (exactly 2 per faction) */
export function getHeroesForFaction(faction: FactionLabel): HeroData[] {
  const key = factionToHeroesKey[faction]
  return (heroesData[key] as HeroData[]) || []
}

/** Get a hero by ID for a specific faction */
export function getHeroById(faction: FactionLabel, heroId: string): HeroData | undefined {
  const heroes = getHeroesForFaction(faction)
  return heroes.find((h) => h.id === heroId)
}

/** Check if a unit ID is a hero ID */
export function isHeroId(id: string): boolean {
  return /^[AHFSECV]_Hero_[12]$/.test(id)
}

/** Get hero icon path from faction and image name */
export function getHeroIconPath(faction: FactionLabel, imageName: string): string {
  return `${UNIT_ICONS_PATH}/${faction}/${imageName}.png`
}
