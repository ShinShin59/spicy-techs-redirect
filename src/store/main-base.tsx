import type { FactionLabel } from "./index"

export type MainBaseLayout = number[][]

/** State per cell: row → group (building) → cell (null = empty, string = building ID) */
export type MainBaseState = (string | null)[][][]

export const mainBasesLayout: Record<FactionLabel, MainBaseLayout> = {
  harkonnen: [[3, 2], [1, 2], [3]],
  atreides: [[1, 2], [3], [2, 1, 1]],
  ecaz: [[1, 3], [2], [3, 1]],
  smuggler: [[3], [2, 1, 1], [1, 1]],
  vernius: [[3], [3], [3]],
  fremen: [[3], [2], [1]],
  corrino: [[3], [2], [1]],
}

/** When present, faction has two main-base views with a title toggle (leftLabel | rightLabel). */
export type MainBaseVariant = {
  leftLabel: string
  rightLabel: string
  /** Second base layout; omit to use same as main layout. */
  secondLayout?: MainBaseLayout
}

export const mainBaseVariants: Partial<Record<FactionLabel, MainBaseVariant>> = {
  corrino: { leftLabel: "Base #1", rightLabel: "Base #2" },
  fremen: {
    leftLabel: "Main Base",
    rightLabel: "Sietchs",
    secondLayout: [[1, 1, 1, 1], [1, 1, 1]], // 2 rows: 4 and 3, spaced evenly
  },
  vernius: { leftLabel: "Main Base", rightLabel: "Reordered" },
  smuggler: {
    leftLabel: "Main Base",
    rightLabel: "UHQ",
    secondLayout: [[3], [3]], // 3x2
  },
}

export function hasMainBaseVariant(faction: FactionLabel): boolean {
  return mainBaseVariants[faction] != null
}

/** Layout for base index 0 (left) or 1 (right). Uses secondLayout when index is 1 and variant defines it. */
export function getMainBaseLayoutForIndex(faction: FactionLabel, baseIndex: 0 | 1): MainBaseLayout {
  const variant = mainBaseVariants[faction]
  if (!variant || baseIndex === 0) return mainBasesLayout[faction]
  return variant.secondLayout ?? mainBasesLayout[faction]
}

/**
 * Initializes base state from layout.
 * Each number n (group size) becomes an array of n `null`.
 * E.g. harkonnen [[3, 2], [1, 2], [3]] → [[[null,null,null],[null,null]], [[null],[null,null]], [[null,null,null]]]
 */
export function initializeMainBaseState(layout: MainBaseLayout): MainBaseState {
  return layout.map((row) =>
    row.map((count) => Array.from({ length: count }, () => null))
  )
}

/** Per-faction state: single base or [base0, base1] for factions with mainBaseVariants. */
export type MainBaseStatePerFaction = MainBaseState | [MainBaseState, MainBaseState]

function buildInitialMainBaseState(faction: FactionLabel): MainBaseStatePerFaction {
  if (!hasMainBaseVariant(faction)) {
    return initializeMainBaseState(mainBasesLayout[faction])
  }
  const layout0 = mainBasesLayout[faction]
  const layout1 = getMainBaseLayoutForIndex(faction, 1)
  return [initializeMainBaseState(layout0), initializeMainBaseState(layout1)]
}

export const mainBasesState: Record<FactionLabel, MainBaseStatePerFaction> = Object.fromEntries(
  (Object.keys(mainBasesLayout) as FactionLabel[]).map((faction) => [
    faction,
    buildInitialMainBaseState(faction),
  ])
) as Record<FactionLabel, MainBaseStatePerFaction>

/** Slot size and spacing in Main Base grid */
const SLOT_SIZE = 64
const GROUP_GAP = 32 // mx-4 on each group
const ROW_GAP = 48 // gap-12 between rows
const CONTAINER_PADDING = 32 // p-4

/**
 * Returns the minimum pixel width needed for a layout.
 * Used so Main Base can adapt (e.g. Harkonnen's [3,2] row needs more width than Atreides).
 */
export function getMainBaseMinWidth(layout: MainBaseLayout): number {
  let maxRowWidth = 0
  for (const row of layout) {
    const slotsWidth = row.reduce((sum, count) => sum + count * SLOT_SIZE, 0)
    const gapsWidth = row.length > 1 ? (row.length - 1) * GROUP_GAP : 0
    const rowWidth = slotsWidth + gapsWidth + CONTAINER_PADDING
    maxRowWidth = Math.max(maxRowWidth, rowWidth)
  }
  return Math.max(maxRowWidth, 300) // floor at 300px for narrow layouts
}

/**
 * Returns the minimum pixel height needed for a layout (so variant factions keep same height when switching base).
 */
export function getMainBaseMinHeight(layout: MainBaseLayout): number {
  if (layout.length === 0) return CONTAINER_PADDING * 2
  const rowsHeight = layout.length * SLOT_SIZE
  const gapsHeight = (layout.length - 1) * ROW_GAP
  return CONTAINER_PADDING * 2 + rowsHeight + gapsHeight
}