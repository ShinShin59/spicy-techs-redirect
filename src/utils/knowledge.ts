import type { DevelopmentsKnowledge, FactionLabel } from "@/store"
import type { MainBaseStatePerFaction, MainBaseState } from "@/store/main-base"
import mainBuildingsData from "@/components/MainBase/MainBaseBuildingsSelector/main-buildings.json"
import { costToDays, costToResearchNext, DEFAULT_KNOWLEDGE_PER_DAY, type DevWithTier } from "./techCost"

/** Development domain (tech tree quadrant) */
export type DevelopmentDomain = "economic" | "military" | "statecraft" | "green"

type MainBuildingCategory = "Economy" | "Military" | "Statecraft"

interface MainBuildingMeta {
  name: string
  category: MainBuildingCategory
}

const mainBuildings = mainBuildingsData as MainBuildingMeta[]

const buildingNameToCategory = new Map<string, MainBuildingCategory>(
  mainBuildings.map((b) => [b.name, b.category])
)

const CATEGORY_TO_DOMAIN: Record<MainBuildingCategory, DevelopmentDomain> = {
  Economy: "economic",
  Military: "military",
  Statecraft: "statecraft",
}

const LAY_OF_THE_LAND_ID = "LayoftheLand"

/** Inputs required to compute Knowledge/day for a development. */
export interface KnowledgeContext {
  selectedFaction: FactionLabel
  mainBaseState: Record<FactionLabel, MainBaseStatePerFaction>
  selectedDevelopments: string[]
  developmentsKnowledge: DevelopmentsKnowledge
  /** Global Knowledge/day (5–50) used for all development time tooltips. */
  knowledgeBase: number
}

export interface KnowledgeModifierBreakdown {
  base: number
  globalPercent: { label: string; percent: number }[]
  categoryPercent: { label: string; percent: number }[]
  flat: { label: string; amount: number }[]
  computedWithoutOverride: number
  override?: number
  effective: number
}

function getFactionBaseStates(
  mainBaseState: Record<FactionLabel, MainBaseStatePerFaction>,
  faction: FactionLabel
): MainBaseState[] {
  const state = mainBaseState[faction]
  if (!state) return []
  const isTuple =
    Array.isArray(state) &&
    state.length === 2 &&
    Array.isArray(state[0]) &&
    Array.isArray(state[1])
  if (isTuple) {
    const [s0, s1] = state as [MainBaseState, MainBaseState]
    return [s0, s1]
  }
  return [state as MainBaseState]
}

function getGlobalKnowledgePercentModifiersFromBuildings(
  ctx: KnowledgeContext
): { label: string; percent: number }[] {
  const bases = getFactionBaseStates(ctx.mainBaseState, ctx.selectedFaction)
  let hasResearchCenter = false
  let hasEmbassy = false

  for (const base of bases) {
    if (!Array.isArray(base)) continue
    for (const row of base) {
      if (!Array.isArray(row)) continue
      for (const group of row) {
        if (!Array.isArray(group)) continue
        for (const cell of group) {
          if (cell === "Research Center") hasResearchCenter = true
          if (cell === "Embassy") hasEmbassy = true
        }
      }
    }
  }

  const result: { label: string; percent: number }[] = []
  if (hasResearchCenter) {
    result.push({ label: "Research Center", percent: 0.2 })
  }
  if (hasEmbassy) {
    result.push({ label: "Embassy", percent: 0.1 })
  }
  return result
}

function getCategoryKnowledgePercentModifiersFromBuildings(
  ctx: KnowledgeContext,
  domain: DevelopmentDomain
): { label: string; percent: number }[] {
  const bases = getFactionBaseStates(ctx.mainBaseState, ctx.selectedFaction)
  const result: { label: string; percent: number }[] = []

  for (const base of bases) {
    if (!Array.isArray(base)) continue
    for (const row of base) {
      if (!Array.isArray(row)) continue
      for (const group of row) {
        if (!Array.isArray(group)) continue
        // Only 1-slot groups contribute category bonus
        if (group.length !== 1) continue
        const buildingName = group[0]
        if (!buildingName) continue
        const category = buildingNameToCategory.get(buildingName)
        if (!category) continue
        const mappedDomain = CATEGORY_TO_DOMAIN[category]
        if (mappedDomain !== domain) continue
        result.push({ label: buildingName, percent: 0.25 })
      }
    }
  }

  return result
}

function getFlatKnowledgeModifiersFromDevelopments(
  ctx: KnowledgeContext
): { label: string; amount: number }[] {
  const result: { label: string; amount: number }[] = []
  if (ctx.selectedDevelopments.includes(LAY_OF_THE_LAND_ID)) {
    result.push({ label: "Lay of the Land", amount: 2 })
  }
  return result
}

export function getKnowledgeBreakdownForDev(
  devId: string,
  domain: DevelopmentDomain,
  ctx: KnowledgeContext
): KnowledgeModifierBreakdown {
  const base = DEFAULT_KNOWLEDGE_PER_DAY

  const globalPercent = getGlobalKnowledgePercentModifiersFromBuildings(ctx)
  const categoryPercent = getCategoryKnowledgePercentModifiersFromBuildings(ctx, domain)
  const flat = getFlatKnowledgeModifiersFromDevelopments(ctx)

  let globalFactor = 1
  for (const m of globalPercent) {
    globalFactor *= 1 + m.percent
  }

  let categoryFactor = 1
  for (const m of categoryPercent) {
    categoryFactor *= 1 + m.percent
  }

  const flatSum = flat.reduce((sum, m) => sum + m.amount, 0)

  const computedWithoutOverride = base * globalFactor * categoryFactor + flatSum
  const override = ctx.developmentsKnowledge[devId]
  // Effective rate for "days" is always the global knowledgeBase (clamped 5–50)
  const effective = Math.max(
    DEFAULT_KNOWLEDGE_PER_DAY,
    Math.min(50, Math.round(ctx.knowledgeBase))
  )

  return {
    base,
    globalPercent,
    categoryPercent,
    flat,
    computedWithoutOverride,
    override,
    effective,
  }
}

export interface DevWithTierAndDomain extends DevWithTier {
  domain: DevelopmentDomain
}

export function totalDaysOfOrder(
  orderedIds: string[],
  idToDev: Map<string, DevWithTierAndDomain>,
  ctx: KnowledgeContext
): number {
  let totalDays = 0

  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i]
    const dev = idToDev.get(id)
    if (!dev) continue
    const alreadyResearched = orderedIds.slice(0, i)
    const costKnowledge = costToResearchNext(dev, alreadyResearched, idToDev)
    const breakdown = getKnowledgeBreakdownForDev(id, dev.domain, ctx)
    totalDays += costToDays(costKnowledge, breakdown.effective)
  }

  return totalDays
}

