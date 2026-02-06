import type { FactionLabel } from "@/store"
import operationsData from "./operations.json"

export interface OperationItem {
  id: string
  effects: { ope: string }
  cost: { res: string; qty: number }[]
  gfx: { file: string; size: number; x: number; y: number }
  image?: string
  props?: { onlyForFactions?: string[]; tip?: unknown }
  name: string
  desc: string
  attributes?: (string | { desc: string; target_effects_list: string[] })[]
}

const operations = operationsData as OperationItem[]

export function getOperationById(id: string): OperationItem | undefined {
  return operations.find((op) => op.id === id)
}

export function getOperationsForFaction(
  faction: FactionLabel
): OperationItem[] {
  return operations.filter((op) => {
    const onlyFor = op.props?.onlyForFactions
    if (!onlyFor || onlyFor.length === 0) return true
    return onlyFor.includes(faction)
  })
}
