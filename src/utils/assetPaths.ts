import { FACTION_LABELS, type FactionLabel, type DevelopmentsSummary } from "@/store"
import armoryData from "@/components/Armory/armory.json"
import mainBuildingsData from "@/components/MainBase/MainBaseBuildingsSelector/main-buildings.json"
import unitsData from "@/components/Units/units.json"
import heroesData from "@/components/Units/hero.json"
import councillorsData from "@/components/Councillors/councillors.json"
import operationsData from "@/components/Operations/operations.json"

const BASE = import.meta.env.BASE_URL

const FACTION_ICON_PATH = `${BASE}images/faction_buttons_square`
const HUD_IMAGES_PATH = `${BASE}images/hud`
const MAINBASE_ICONS_PATH = `${BASE}images/mainbase_icons`
const GEAR_ICONS_PATH = `${BASE}images/gear`
const UNIT_ICONS_PATH = `${BASE}images/units`
const COUNCILLOR_ICONS_PATH = `${BASE}images/councillors`
const OPERATIONS_ICONS_PATH = `${BASE}images/operations`

/** Time/days icon for development cost display (from developments/time.webp) */
export const TIME_ICON_PATH = `${HUD_IMAGES_PATH}/developments/time.webp`

/** Knowledge icon used for per-development research rate display (ressources/knowledge.webp) */
export const KNOWLEDGE_ICON_PATH = `${HUD_IMAGES_PATH}/ressources/knowledge.webp`

export function getFactionIconPath(faction: FactionLabel): string {
  return `${FACTION_ICON_PATH}/${faction}.webp`
}

export function getBuildingIconPath(buildingName: string): string {
  return `${MAINBASE_ICONS_PATH}/${buildingName.toLowerCase().replace(/ /g, "_")}.webp`
}

export function getGearIconPath(imageFileName: string): string {
  return `${GEAR_ICONS_PATH}/${imageFileName}`
}

export function getUnitIconPath(faction: FactionLabel, unitName: string): string {
  const fileName = unitName.toLowerCase().replace(/ /g, "_")
  return `${UNIT_ICONS_PATH}/${faction}/${fileName}.webp`
}

export function getCouncillorIconPath(imageFileName: string): string {
  return `${COUNCILLOR_ICONS_PATH}/${imageFileName}`
}

/** Operation icon: use image filename from JSON if present, else placeholder. */
export function getOperationIconPath(_missionId: string, imageFileName?: string | null): string {
  if (imageFileName) {
    return `${OPERATIONS_ICONS_PATH}/${imageFileName}`
  }
  return getHudImagePath("operations_icon.webp")
}

/** Set of URLs that have been queued for preload */
const preloadedImages = new Set<string>()

/** Promises for each preloaded image */
const preloadPromises: Promise<void>[] = []

/** Progress tracking */
let _totalImages = 0
let _loadedImages = 0

/** Preload a single image, returning a promise and updating progress */
function preloadImage(src: string): void {
  if (preloadedImages.has(src)) return
  preloadedImages.add(src)
  _totalImages++
  const p = new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = img.onerror = () => {
      _loadedImages++
      // Update the loading bar if it exists in the DOM
      const bar = document.getElementById("loading-bar-fill")
      if (bar) {
        const pct = _totalImages > 0 ? (_loadedImages / _totalImages) * 100 : 0
        bar.style.width = `${pct}%`
      }
      resolve()
    }
    img.src = src
  })
  preloadPromises.push(p)
}

/** Check if an image URL has been preloaded */
export function isImagePreloaded(src: string): boolean {
  return preloadedImages.has(src)
}

/** Promise that resolves when ALL preloaded images are done (loaded or errored). */
export function waitForPreload(): Promise<void> {
  return Promise.all(preloadPromises).then(() => { })
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
  economic: "slot_economic.webp",
  military: "slot_military.webp",
  expansion: "slot_green.webp",
  statecraft: "slot_statecraft.webp",
}

export function getDevelopmentsSlotPath(category: keyof DevelopmentsSummary): string {
  return getHudImagePath(DEVELOPMENTS_SLOT_IMAGES[category])
}

/** Development icon from sprite sheet. gfx from developments.json: { file, size, x, y }. Uses developments/ subfolder. */
export function getDevelopmentSpriteStyle(gfx: { file: string; size: number; x: number; y: number } | undefined): Record<string, string | number> | null {
  if (!gfx?.file || gfx.size == null || gfx.x == null || gfx.y == null) return null
  const base = gfx.file.replace(/^UI\/developments\//, "").replace(/^UI\//, "")
  const url = getHudImagePath(`developments/${base}`)
  const px = -(gfx.x * gfx.size)
  const py = -(gfx.y * gfx.size)
  return {
    backgroundImage: `url(${url})`,
    backgroundPosition: `${px}px ${py}px`,
    width: gfx.size,
    height: gfx.size,
  }
}

/** Picker assets (window, bg, frames) in developments/ folder */
export function getDevelopmentPickerAssetPath(fileName: string): string {
  return getHudImagePath(`developments/${fileName}`)
}

function initPreload(): void {
  // Preload HUD images (slot, background_hero, development sprite sheet, time/knowledge icons)
  preloadImage(getHudImagePath("slot.webp"))
  preloadImage(getHudImagePath("background_hero.webp"))
  preloadImage(getHudImagePath("developments/techIcons2.webp"))
  preloadImage(getHudImagePath("developments/time.webp"))
  preloadImage(getHudImagePath("ressources/knowledge.webp"))

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
        preloadImage(`${UNIT_ICONS_PATH}/${faction}/${hero.imageName}.webp`)
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

  // Preload operation icons
  const operations = operationsData as { image?: string | null }[]
  operations.forEach((op) => {
    if (op.image) {
      preloadImage(getOperationIconPath("", op.image))
    }
  })
}

// Run preload immediately when module is imported (before React renders)
initPreload()
