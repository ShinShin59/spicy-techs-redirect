import { FACTION_LABELS, type FactionLabel, type DevelopmentsSummary } from "@/store"
import armoryData from "@/components/Armory/armory.json"
import mainBuildingsData from "@/components/MainBase/MainBaseBuildingsSelector/main-buildings.json"
import unitsData from "@/components/Units/units.json"
import heroesData from "@/components/Units/hero.json"
import councillorsData from "@/components/Councillors/councillors.json"

const FACTION_ICON_PATH = "/images/faction_buttons_square"
const HUD_IMAGES_PATH = "/images/hud"
const MAINBASE_ICONS_PATH = "/images/mainbase_icons"
const GEAR_ICONS_PATH = "/images/gear"
const UNIT_ICONS_PATH = "/images/units"
const COUNCILLOR_ICONS_PATH = "/images/councillors"
const OPERATIONS_ICONS_PATH = "/images/operations"

export function getFactionIconPath(faction: FactionLabel): string {
  return `${FACTION_ICON_PATH}/${faction}.png`
}

export function getBuildingIconPath(buildingName: string): string {
  return `${MAINBASE_ICONS_PATH}/${buildingName.toLowerCase().replace(/ /g, "_")}.png`
}

export function getGearIconPath(imageFileName: string): string {
  return `${GEAR_ICONS_PATH}/${imageFileName}`
}

export function getUnitIconPath(faction: FactionLabel, unitName: string): string {
  const fileName = unitName.toLowerCase().replace(/ /g, "_")
  return `${UNIT_ICONS_PATH}/${faction}/${fileName}.png`
}

export function getCouncillorIconPath(imageFileName: string): string {
  return `${COUNCILLOR_ICONS_PATH}/${imageFileName}`
}

/** Operation icon: use image filename from JSON if present, else placeholder. */
export function getOperationIconPath(_missionId: string, imageFileName?: string | null): string {
  if (imageFileName) {
    return `${OPERATIONS_ICONS_PATH}/${imageFileName}`
  }
  return getHudImagePath("operations_icon.png")
}

/** Set of URLs that have been preloaded */
const preloadedImages = new Set<string>()

/** Preload a single image and track it */
function preloadImage(src: string): void {
  if (preloadedImages.has(src)) return
  preloadedImages.add(src)
  const img = new Image()
  img.src = src
}

/** Check if an image URL has been preloaded */
export function isImagePreloaded(src: string): boolean {
  return preloadedImages.has(src)
}

/**
 * Preload all app images immediately at module load time.
 * This runs synchronously when this module is first imported,
 * before any React components render.
 */
export function getHudImagePath(fileName: string): string {
  return `${HUD_IMAGES_PATH}/${fileName}`
}

const DEVELOPMENTS_SLOT_IMAGES: Record<keyof DevelopmentsSummary, string> = {
  economic: "slot_economic.png",
  military: "slot_military.png",
  green: "slot_green.png",
  statecraft: "slot_statecraft.png",
}

export function getDevelopmentsSlotPath(category: keyof DevelopmentsSummary): string {
  return getHudImagePath(DEVELOPMENTS_SLOT_IMAGES[category])
}

/** Development icon from sprite sheet. gfx from developments.json: { file, size, x, y }. */
export function getDevelopmentSpriteStyle(gfx: { file: string; size: number; x: number; y: number } | undefined): Record<string, string | number> | null {
  if (!gfx?.file || gfx.size == null || gfx.x == null || gfx.y == null) return null
  const base = gfx.file.replace(/^UI\/developments\//, "").replace(/^UI\//, "")
  const url = getHudImagePath(base)
  const px = -(gfx.x * gfx.size)
  const py = -(gfx.y * gfx.size)
  return {
    backgroundImage: `url(${url})`,
    backgroundPosition: `${px}px ${py}px`,
    width: gfx.size,
    height: gfx.size,
  }
}

function initPreload(): void {
  // Preload HUD images (slot, background_hero, development sprite sheet)
  preloadImage(getHudImagePath("slot.png"))
  preloadImage(getHudImagePath("background_hero.png"))
  preloadImage(getHudImagePath("techIcons2.png"))

  // Preload faction icons
  FACTION_LABELS.forEach((faction) => {
    preloadImage(getFactionIconPath(faction as FactionLabel))
  })

  // Preload building icons
  const buildings = mainBuildingsData as { name: string }[]
  buildings.forEach((b) => {
    preloadImage(getBuildingIconPath(b.name))
  })

  // Preload gear icons
  const gearItems = armoryData as { image: string }[]
  const uniqueImages = new Set(gearItems.map((g) => g.image))
  uniqueImages.forEach((image) => {
    preloadImage(getGearIconPath(image))
  })

  // Preload unit icons
  const unitsByFaction = unitsData as Record<string, { name: string }[]>
  const factionToLabel: Record<string, FactionLabel> = {
    Atreides: "atreides",
    Harkonnen: "harkonnen",
    Fremen: "fremen",
    Smugglers: "smuggler",
    Corrino: "corrino",
    Ecaz: "ecaz",
    Vernius: "vernius",
  }
  Object.entries(unitsByFaction).forEach(([factionKey, units]) => {
    const faction = factionToLabel[factionKey]
    if (faction) {
      units.forEach((unit) => {
        preloadImage(getUnitIconPath(faction, unit.name))
      })
    }
  })

  // Preload hero icons
  const heroesByFaction = heroesData as Record<string, { imageName: string }[]>
  Object.entries(heroesByFaction).forEach(([factionKey, heroes]) => {
    const faction = factionToLabel[factionKey]
    if (faction && Array.isArray(heroes)) {
      heroes.forEach((hero) => {
        preloadImage(`${UNIT_ICONS_PATH}/${faction}/${hero.imageName}.png`)
      })
    }
  })

  // Preload councillor icons
  const councillorsByFaction = councillorsData as Record<string, { image: string }[]>
  Object.values(councillorsByFaction).forEach((councillors) => {
    if (Array.isArray(councillors)) {
      councillors.forEach((c) => preloadImage(getCouncillorIconPath(c.image)))
    }
  })
}

// Run preload immediately when module is imported (before React renders)
initPreload()
