import type { FactionLabel } from "@/store"

const FACTION_ICON_PATH = "/images/faction_buttons_square"
const MAINBASE_ICONS_PATH = "/images/mainbase_icons"

export function getFactionIconPath(faction: FactionLabel): string {
  return `${FACTION_ICON_PATH}/${faction}.png`
}

export function getBuildingIconPath(buildingName: string): string {
  return `${MAINBASE_ICONS_PATH}/${buildingName.toLowerCase().replace(/ /g, "_")}.png`
}
