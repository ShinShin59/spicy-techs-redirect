/**
 * Reusable hook for managing ordered lists with increment/decrement functionality.
 * Works with any array-based order system.
 */

/**
 * Get the 1-based order number for an item at the given index in the order array.
 */
export function getOrderNumber<T>(
  orderArray: T[],
  item: T,
  isEqual: (a: T, b: T) => boolean
): number | null {
  const index = orderArray.findIndex((o) => isEqual(o, item))
  return index >= 0 ? index + 1 : null
}

/**
 * Increment the order of an item (move it later in the sequence).
 * Returns a new array with the item swapped with the next one.
 */
export function incrementOrder<T>(
  orderArray: T[],
  item: T,
  isEqual: (a: T, b: T) => boolean
): T[] {
  const index = orderArray.findIndex((o) => isEqual(o, item))
  if (index < 0 || index >= orderArray.length - 1) return orderArray
  
  const newArray = [...orderArray]
  // Swap with next item
  const temp = newArray[index + 1]
  newArray[index + 1] = newArray[index]
  newArray[index] = temp
  return newArray
}

/**
 * Decrement the order of an item (move it earlier in the sequence).
 * Returns a new array with the item swapped with the previous one.
 */
export function decrementOrder<T>(
  orderArray: T[],
  item: T,
  isEqual: (a: T, b: T) => boolean
): T[] {
  const index = orderArray.findIndex((o) => isEqual(o, item))
  if (index <= 0) return orderArray
  
  const newArray = [...orderArray]
  // Swap with previous item
  const temp = newArray[index - 1]
  newArray[index - 1] = newArray[index]
  newArray[index] = temp
  return newArray
}

/**
 * Add an item to the end of the order array if not already present.
 */
export function addToOrder<T>(
  orderArray: T[],
  item: T,
  isEqual: (a: T, b: T) => boolean
): T[] {
  const exists = orderArray.some((o) => isEqual(o, item))
  if (exists) return orderArray
  return [...orderArray, item]
}

/**
 * Remove an item from the order array.
 */
export function removeFromOrder<T>(
  orderArray: T[],
  item: T,
  isEqual: (a: T, b: T) => boolean
): T[] {
  return orderArray.filter((o) => !isEqual(o, item))
}

// Specific coordinate types and helpers for common use cases

/** Building cell coordinates (for MainBase) */
export interface BuildingCoords {
  rowIndex: number
  groupIndex: number
  cellIndex: number
}

export const buildingIsEqual = (a: BuildingCoords, b: BuildingCoords): boolean =>
  a.rowIndex === b.rowIndex && a.groupIndex === b.groupIndex && a.cellIndex === b.cellIndex

/** Armory slot coordinates */
export interface ArmoryCoords {
  unitIndex: number
  slotIndex: number
}

export const armoryIsEqual = (a: ArmoryCoords, b: ArmoryCoords): boolean =>
  a.unitIndex === b.unitIndex && a.slotIndex === b.slotIndex

/** Unit slot index (just a number, but we wrap for consistency) */
export type UnitOrderIndex = number

export const unitIsEqual = (a: UnitOrderIndex, b: UnitOrderIndex): boolean => a === b
