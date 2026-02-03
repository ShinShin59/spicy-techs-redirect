import { useUIStore } from "@/store/ui"

const BASE = import.meta.env.BASE_URL
const SOUNDS_PATH = `${BASE}sounds`

/** Background music: single instance, looped, lower volume. */
const BACKGROUND_PATH = `${BASE}sounds/background-noise.m4a`
let backgroundAudio: HTMLAudioElement | null = null

function getEffectiveVolume(): number {
  const { volume, muted } = useUIStore.getState()
  return muted ? 0 : volume / 100
}

function applyVolumeToBackgroundMusic(): void {
  if (backgroundAudio) {
    backgroundAudio.volume = getEffectiveVolume()
  }
}

// Keep background music in sync when volume or mute changes
useUIStore.subscribe(applyVolumeToBackgroundMusic)

/**
 * Start background music (loops). Call on app load or after first user interaction.
 * Returns a promise that resolves when play() succeeds or rejects if autoplay is blocked.
 */
export function startBackgroundMusic(): Promise<void> {
  if (!backgroundAudio) {
    backgroundAudio = new Audio(BACKGROUND_PATH)
    backgroundAudio.loop = true
    backgroundAudio.volume = getEffectiveVolume()
  }
  return backgroundAudio.play()
}

/**
 * Get the full path for a sound file (filename with or without .mp3).
 */
export function getSoundPath(name: string): string {
  const base = name.endsWith(".mp3") ? name : `${name}.mp3`
  if (base.startsWith("/")) return `${BASE}${base.slice(1)}`
  if (base.startsWith(BASE)) return base
  return `${SOUNDS_PATH}/${base}`
}

/**
 * Play a single sound by path or filename.
 * Path can be full (e.g. "/sounds/Button_Spendresources.mp3") or just the filename.
 * Uses app volume and mute from UI store.
 */
export function playSound(pathOrName: string): void {
  const path = getSoundPath(pathOrName)
  const audio = new Audio(path)
  audio.volume = getEffectiveVolume()
  audio.play().catch(() => { })
}

/**
 * Create a function that alternates between two sounds on each call (e.g. for a toggle button).
 * First call plays pathA, second pathB, third pathA, etc.
 */
export function createToggleSound(pathA: string, pathB: string): () => void {
  let nextIsA = true
  return () => {
    playSound(nextIsA ? pathA : pathB)
    nextIsA = !nextIsA
  }
}

/**
 * Play a random sound from the given array of paths or filenames.
 */
export function playRandomSound(paths: string[]): void {
  if (paths.length === 0) return
  const path = paths[Math.floor(Math.random() * paths.length)]
  playSound(path)
}

// --- Convenience: common sound sets (filenames under /sounds) ---

/** Played when clearing a slot (right-click delete) in Units, MainBase, or Armory. */
const CANCEL_SLOT_SOUND = "cancel_unit.mp3"

export function playCancelSlotSound(): void {
  playSound(CANCEL_SLOT_SOUND)
}

/** Topbar panel/sidebar toggle: play open or close sound based on new state. */
const UI_MENU_OPEN = "UI_Mainmenu_Button_open.mp3"
const UI_MENU_CLOSE = "UI_Mainmenu_Button_close.mp3"

export function playMenuToggleSound(isOpening: boolean): void {
  playSound(isOpening ? UI_MENU_OPEN : UI_MENU_CLOSE)
}

/** Played when changing faction, selecting a build in the list, or picking a councillor. */
const UI_PICKCOUNCELOR = "UI_Mainmenu_Pickcouncelor.mp3"

export function playSelectionSound(): void {
  playSound(UI_PICKCOUNCELOR)
}

/** Played when choosing a building from the Main Base building picker. */
const MAIN_BASE_BUILDING = "main_base_building.mp3"

export function playMainBaseBuildingSound(): void {
  playSound(MAIN_BASE_BUILDING)
}

/** Played when setting an operation in the Operations panel. */
const UI_SPY_OPERATION = "UI_Spyoperation.mp3"

export function playSpyOperationSound(): void {
  playSound(UI_SPY_OPERATION)
}

export const BUTTON_SPENDRESOURCES_SOUNDS = [
  "Button_Spendresources.mp3",
  "Button_Spendresources_2.mp3",
  "Button_Spendresources_3.mp3",
  "Button_Spendresources_4.mp3",
]

/** Developments picker: random open sound when opening the modal. */
const BUTTON_DEVELOPMENTS_OPEN_SOUNDS = [
  "Button_Developments_Open_6.mp3",
  "Button_Developments_Open_8.mp3",
  "Button_Developments_Open_11.mp3",
]

/** Developments picker: random close sound when closing the modal. */
const BUTTON_DEVELOPMENTS_CLOSE_SOUNDS = [
  "Button_Developments_Close.mp3",
  "Button_Developments_Close_2.mp3",
  "Button_Developments_Close_3.mp3",
]

export function playDevelopmentsOpenSound(): void {
  playRandomSound(BUTTON_DEVELOPMENTS_OPEN_SOUNDS)
}

export function playDevelopmentsCloseSound(): void {
  playRandomSound(BUTTON_DEVELOPMENTS_CLOSE_SOUNDS)
}
