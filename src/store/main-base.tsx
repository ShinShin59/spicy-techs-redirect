import type { FactionLabel } from "./index"

export type MainBaseLayout = number[][]

/** État par cellule : row → groupe (bâtiment) → cellule (false = vide) */
export type MainBaseState = boolean[][][]

export const mainBasesLayout: Record<FactionLabel, MainBaseLayout> = {
  harkonnen: [[3, 2], [1, 2], [3]],
  atreides: [[1, 2], [3], [2, 1, 1]],
  ecaz: [[1, 3], [2], [3, 1]],
  smuggler: [[3], [2, 1, 1], [1, 1]],
  vernius: [[3], [3], [3]],
}

/**
 * Initialise l'état de la base à partir du layout.
 * Chaque nombre n (taille d'un groupe) devient un tableau de n `false`.
 * Ex. harkonnen [[3, 2], [1, 2], [3]] → [[[false,false,false],[false,false]], [[false],[false,false]], [[false,false,false]]]
 */
export function initializeMainBaseState(layout: MainBaseLayout): MainBaseState {
  return layout.map((row) =>
    row.map((count) => Array.from({ length: count }, () => false))
  )
}

export const mainBasesState: Record<FactionLabel, MainBaseState> = Object.fromEntries(
  (Object.entries(mainBasesLayout) as [FactionLabel, MainBaseLayout][]).map(
    ([faction, layout]) => [faction, initializeMainBaseState(layout)]
  )
) as Record<FactionLabel, MainBaseState>