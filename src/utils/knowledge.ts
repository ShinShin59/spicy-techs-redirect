import type { DevelopmentsKnowledge, FactionLabel } from "@/store"
import type { MainBaseStatePerFaction, MainBaseState } from "@/store/main-base"
import mainBuildingsData from "@/components/MainBase/MainBaseBuildingsSelector/main-buildings.json"
import { costToDays, costToResearchNext, DEFAULT_KNOWLEDGE_PER_DAY, type DevWithTier } from "./techCost"

type BuildingDatesPerFaction = Record<string, number> | [Record<string, number>, Record<string, number>]

function getBuildingAddDate(
  buildingDates: Record<FactionLabel, BuildingDatesPerFaction> | undefined,
  faction: FactionLabel,
  baseIndex: number,
  rowIndex: number,
  groupIndex: number,
  cellIndex: number
): number | undefined {
  if (!buildingDates) return undefined
  const factionDates = buildingDates[faction]
  if (!factionDates) return undefined
  const key = `${rowIndex}-${groupIndex}-${cellIndex}`
  const isTuple = Array.isArray(factionDates) && factionDates.length === 2
  if (isTuple) {
    const slice = (factionDates as [Record<string, number>, Record<string, number>])[baseIndex]
    return slice?.[key]
  }
  return (factionDates as Record<string, number>)[key]
}

/** When referenceDay is undefined, all buildings are counted (backward compat). */
function buildingActiveAt(buildDate: number | undefined, referenceDay: number | undefined): boolean {
  if (referenceDay === undefined) return true
  if (buildDate === undefined) return true // no date set = always active
  // At start of game (referenceDay=0), count all buildings (user may have set a date for planning).
  if (referenceDay === 0) return true
  // referenceDay = cumulative days at START of current dev (we've completed referenceDay days).
  // Building added at day D is available from the start of day D (inclusive).
  return buildDate <= referenceDay
}

/** Development domain (tech tree quadrant) */
export type DevelopmentDomain = "economic" | "military" | "statecraft" | "expansion"

type MainBuildingCategory = "Economy" | "Military" | "Statecraft"

interface MainBuildingMeta {
  name: string
  category: MainBuildingCategory
}

const mainBuildings = mainBuildingsData as MainBuildingMeta[]

const buildingNameToCategory = new Map<string, MainBuildingCategory>(
  mainBuildings.map((b) => [b.name, b.category])
)

/** True if this building contributes to the 25% category bonus when placed in a 1-slot block. */
export function buildingHasCategoryBonus(buildingName: string): boolean {
  return (
    buildingNameToCategory.has(buildingName) ||
    buildingName in BUILDING_CATEGORY_BONUS_OVERRIDES
  )
}

const CATEGORY_TO_DOMAIN: Record<MainBuildingCategory, DevelopmentDomain> = {
  Economy: "economic",
  Military: "military",
  Statecraft: "statecraft",
}

/**
 * Buildings that contribute category bonus to multiple domains when placed in a 1-slot block.
 * Overrides the normal single-category mapping from main-buildings.json.
 * Example: Fremen Bazaar counts for economic, military, AND statecraft.
 */
const BUILDING_CATEGORY_BONUS_OVERRIDES: Record<string, DevelopmentDomain[]> = {
  Bazaar: ["economic", "military", "statecraft"],
}

/**
 * When a specific building is present in the base for a faction, multiplies the category bonus
 * of all 1-slot buildings (including itself). Example: Corrino Emperor Monument doubles 25% → 50%.
 */
const CATEGORY_BONUS_AMPLIFIERS: {
  faction: FactionLabel
  building: string
  multiplier: number
}[] = [
    { faction: "corrino", building: "Emperor Monument", multiplier: 2 },
  ]

const LAY_OF_THE_LAND_ID = "LayoftheLand"

/** Inputs required to compute Knowledge/day for a development. */
export interface KnowledgeContext {
  selectedFaction: FactionLabel
  mainBaseState: Record<FactionLabel, MainBaseStatePerFaction>
  selectedDevelopments: string[]
  developmentsKnowledge: DevelopmentsKnowledge
  /** Global Knowledge/day (5–50) used for all development time tooltips. */
  knowledgeBase: number
  /** Per-building add date (total days since 01.01.10192 AG). When set, building bonus applies only from that day. */
  buildingDates?: Record<FactionLabel, BuildingDatesPerFaction>
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

function hasBuildingInBases(
  bases: MainBaseState[],
  buildingName: string
): boolean {
  for (const base of bases) {
    if (!Array.isArray(base)) continue
    for (const row of base) {
      if (!Array.isArray(row)) continue
      for (const group of row) {
        if (!Array.isArray(group)) continue
        for (const cell of group) {
          if (cell === buildingName) return true
        }
      }
    }
  }
  return false
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
  ctx: KnowledgeContext,
  referenceDay?: number
): { label: string; percent: number }[] {
  const bases = getFactionBaseStates(ctx.mainBaseState, ctx.selectedFaction)
  let hasResearchCenter = false
  let hasEmbassy = false

  bases.forEach((base, baseIndex) => {
    if (!Array.isArray(base)) return
    base.forEach((row, rowIndex) => {
      if (!Array.isArray(row)) return
      row.forEach((group, groupIndex) => {
        if (!Array.isArray(group)) return
        group.forEach((cell, cellIndex) => {
          const addDate = getBuildingAddDate(
            ctx.buildingDates,
            ctx.selectedFaction,
            baseIndex,
            rowIndex,
            groupIndex,
            cellIndex
          )
          if (!buildingActiveAt(addDate, referenceDay)) return
          if (cell === "Research Center") hasResearchCenter = true
          if (cell === "Embassy") hasEmbassy = true
        })
      })
    })
  })

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
  domain: DevelopmentDomain,
  referenceDay?: number
): { label: string; percent: number }[] {
  const bases = getFactionBaseStates(ctx.mainBaseState, ctx.selectedFaction)
  const result: { label: string; percent: number }[] = []

  const categoryBonusPercent = 0.25
  const amplifier = CATEGORY_BONUS_AMPLIFIERS.find((a) => a.faction === ctx.selectedFaction)
  let amplifierActive = false
  if (amplifier && hasBuildingInBases(bases, amplifier.building)) {
    if (referenceDay === undefined) {
      amplifierActive = true
    } else {
      bases.forEach((base, baseIndex) => {
        if (!Array.isArray(base)) return
        base.forEach((row, rowIndex) => {
          if (!Array.isArray(row)) return
          row.forEach((group, groupIndex) => {
            if (!Array.isArray(group)) return
            group.forEach((cell, cellIndex) => {
              if (cell !== amplifier.building) return
              const addDate = getBuildingAddDate(
                ctx.buildingDates,
                ctx.selectedFaction,
                baseIndex,
                rowIndex,
                groupIndex,
                cellIndex
              )
              if (buildingActiveAt(addDate, referenceDay)) amplifierActive = true
            })
          })
        })
      })
    }
  }
  const effectivePercent = amplifierActive && amplifier
    ? categoryBonusPercent * amplifier.multiplier
    : categoryBonusPercent

  bases.forEach((base, baseIndex) => {
    if (!Array.isArray(base)) return
    base.forEach((row, rowIndex) => {
      if (!Array.isArray(row)) return
      row.forEach((group, groupIndex) => {
        if (!Array.isArray(group)) return
        // Only 1-slot groups contribute category bonus
        if (group.length !== 1) return
        const buildingName = group[0]
        if (!buildingName) return

        const addDate = getBuildingAddDate(
          ctx.buildingDates,
          ctx.selectedFaction,
          baseIndex,
          rowIndex,
          groupIndex,
          0
        )
        if (!buildingActiveAt(addDate, referenceDay)) return

        const overrideDomains = BUILDING_CATEGORY_BONUS_OVERRIDES[buildingName]
        const contributesToDomain = overrideDomains
          ? overrideDomains.includes(domain)
          : (() => {
            const category = buildingNameToCategory.get(buildingName)
            if (!category) return false
            return CATEGORY_TO_DOMAIN[category] === domain
          })()

        if (contributesToDomain) {
          result.push({ label: buildingName, percent: effectivePercent })
        }
      })
    })
  })

  return result
}

function getFlatKnowledgeModifiersFromBuildings(
  ctx: KnowledgeContext,
  referenceDay?: number
): { label: string; amount: number }[] {
  const bases = getFactionBaseStates(ctx.mainBaseState, ctx.selectedFaction)
  const result: { label: string; amount: number }[] = []

  bases.forEach((base, baseIndex) => {
    if (!Array.isArray(base)) return
    base.forEach((row, rowIndex) => {
      if (!Array.isArray(row)) return
      row.forEach((group, groupIndex) => {
        if (!Array.isArray(group)) return
        group.forEach((cell, cellIndex) => {
          if (cell !== "Embassy") return
          const addDate = getBuildingAddDate(
            ctx.buildingDates,
            ctx.selectedFaction,
            baseIndex,
            rowIndex,
            groupIndex,
            cellIndex
          )
          if (!buildingActiveAt(addDate, referenceDay)) return
          result.push({ label: "Embassy", amount: 2 })
        })
      })
    })
  })

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

const KNOWLEDGE_CLAMP_MIN = 5
const KNOWLEDGE_CLAMP_MAX = 50

export interface GetKnowledgeBreakdownOptions {
  /** Dev that comes before this one in the order; their knowledge is used for THIS dev's days. */
  previousDevId?: string | null
  /** Computed rate (with modifiers) for the previous dev. Used when no override is set. */
  previousDevComputedRate?: number
  /** Day (total days since start) at which we're researching this dev. Building bonuses apply only if addDate <= referenceDay. */
  referenceDay?: number
}

/** Clamps a Knowledge/day rate to the valid range. */
function clampKnowledgeRate(rate: number): number {
  return Math.max(KNOWLEDGE_CLAMP_MIN, Math.min(KNOWLEDGE_CLAMP_MAX, Math.round(rate)))
}

/**
 * Effective knowledge rate when no development is selected.
 * Includes global building modifiers (e.g. Research Center +20%, +2) but no domain-specific category bonus.
 */
export function getBaseKnowledgeRate(
  ctx: KnowledgeContext,
  referenceDay?: number
): number {
  const globalPercent = getGlobalKnowledgePercentModifiersFromBuildings(ctx, referenceDay)
  const flatFromBuildings = getFlatKnowledgeModifiersFromBuildings(ctx, referenceDay)
  const flatFromDevelopments = getFlatKnowledgeModifiersFromDevelopments(ctx)
  const flatSum = [...flatFromBuildings, ...flatFromDevelopments].reduce(
    (sum, m) => sum + m.amount,
    0
  )
  let globalFactor = 1
  for (const m of globalPercent) {
    globalFactor *= 1 + m.percent
  }
  const computed = DEFAULT_KNOWLEDGE_PER_DAY * globalFactor + flatSum
  return Math.round(Math.max(KNOWLEDGE_CLAMP_MIN, Math.min(KNOWLEDGE_CLAMP_MAX, computed)))
}

/**
 * Single source of truth: current knowledge/day value for display.
 * Reactive to: selectedDevelopments, developmentsKnowledge, mainBaseState, buildingDates, knowledgeBase.
 */
export function computeCurrentKnowledgeValue(
  ctx: KnowledgeContext,
  idToDev: Map<string, DevWithTierAndDomain>
): number {
  if (ctx.selectedDevelopments.length === 0) {
    return getBaseKnowledgeRate(ctx)
  }
  const lastId = ctx.selectedDevelopments[ctx.selectedDevelopments.length - 1]!
  const lastDev = idToDev.get(lastId)
  if (!lastDev) return ctx.knowledgeBase
  const previousDevId =
    ctx.selectedDevelopments.length > 1 ? ctx.selectedDevelopments[ctx.selectedDevelopments.length - 2]! : null
  const referenceDay =
    ctx.selectedDevelopments.length > 1
      ? Math.round(totalDaysOfOrder(ctx.selectedDevelopments.slice(0, -1), idToDev, ctx))
      : 0
  const previousDev = previousDevId != null ? idToDev.get(previousDevId) : null
  const previousDevReferenceDay =
    ctx.selectedDevelopments.length > 2
      ? Math.round(totalDaysOfOrder(ctx.selectedDevelopments.slice(0, -2), idToDev, ctx))
      : 0
  const previousDevComputedRate =
    previousDev != null
      ? getKnowledgeBreakdownForDev(previousDevId!, previousDev.domain, ctx, {
        referenceDay: previousDevReferenceDay,
      }).computedWithoutOverride
      : undefined
  const breakdown = getKnowledgeBreakdownForDev(lastId, lastDev.domain, ctx, {
    previousDevId,
    previousDevComputedRate,
    referenceDay,
  })
  return Math.round(
    Math.max(KNOWLEDGE_CLAMP_MIN, Math.min(KNOWLEDGE_CLAMP_MAX, breakdown.override ?? breakdown.computedWithoutOverride))
  )
}

export function getKnowledgeBreakdownForDev(
  devId: string,
  domain: DevelopmentDomain,
  ctx: KnowledgeContext,
  options?: GetKnowledgeBreakdownOptions
): KnowledgeModifierBreakdown {
  const base = DEFAULT_KNOWLEDGE_PER_DAY
  const referenceDay = options?.referenceDay

  const globalPercent = getGlobalKnowledgePercentModifiersFromBuildings(ctx, referenceDay)
  const categoryPercent = getCategoryKnowledgePercentModifiersFromBuildings(ctx, domain, referenceDay)
  const flatFromBuildings = getFlatKnowledgeModifiersFromBuildings(ctx, referenceDay)
  const flatFromDevelopments = getFlatKnowledgeModifiersFromDevelopments(ctx)
  const flat = [...flatFromBuildings, ...flatFromDevelopments]

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
  const previousDevId = options?.previousDevId ?? null

  // Effective rate for THIS dev's days: previous dev's rate (or initial for first dev).
  // When override is set, use it. Otherwise use computed rate (includes main base category bonus).
  let effective: number
  if (previousDevId != null && ctx.developmentsKnowledge[previousDevId] != null) {
    effective = clampKnowledgeRate(ctx.developmentsKnowledge[previousDevId]!)
  } else {
    const computedRate =
      previousDevId == null
        ? computedWithoutOverride
        : (options?.previousDevComputedRate ?? ctx.knowledgeBase)
    effective = clampKnowledgeRate(computedRate)
  }

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
    const previousDevId = i > 0 ? orderedIds[i - 1]! : null
    const previousDev = previousDevId != null ? idToDev.get(previousDevId) : null
    const previousDevComputedRate =
      previousDev != null
        ? getKnowledgeBreakdownForDev(previousDevId!, previousDev.domain, ctx, {
          referenceDay: totalDays,
        }).computedWithoutOverride
        : undefined
    const alreadyResearched = orderedIds.slice(0, i)
    const costKnowledge = costToResearchNext(dev, alreadyResearched, idToDev)
    const breakdown = getKnowledgeBreakdownForDev(id, dev.domain, ctx, {
      previousDevId,
      previousDevComputedRate,
      referenceDay: totalDays,
    })
    const daysForDev = costToDays(costKnowledge, breakdown.effective)
    totalDays += daysForDev
  }

  return totalDays
}

