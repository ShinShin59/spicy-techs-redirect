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
  fremen: [[2, 2], [3], [2, 1]],
  corrino: [[3], [2], [1]],
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

export const mainBasesState: Record<FactionLabel, MainBaseState> = Object.fromEntries(
  (Object.entries(mainBasesLayout) as [FactionLabel, MainBaseLayout][]).map(
    ([faction, layout]) => [faction, initializeMainBaseState(layout)]
  )
) as Record<FactionLabel, MainBaseState>

/** Slot size and spacing in Main Base grid */
const SLOT_SIZE = 64
const GROUP_GAP = 32 // mx-4 on each group
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