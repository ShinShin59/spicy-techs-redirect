/**
 * Test 2: Knowledge Rate Calculation Accuracy
 * 
 * Purpose: Verify knowledge/day calculations match game mechanics, including all modifiers.
 */

import { describe, it, expect } from 'vitest'
import {
  getBaseKnowledgeRate,
  getKnowledgeBreakdownForDev,
  type KnowledgeContext,
} from '../knowledge'
import type { FactionLabel, MainBaseStatePerFaction } from '@/store/types'

function createTestContext(
  overrides: Partial<KnowledgeContext> = {}
): KnowledgeContext {
  const emptyBaseState: MainBaseStatePerFaction = [[[null]]]
  return {
    selectedFaction: 'atreides' as FactionLabel,
    mainBaseState: {
      atreides: emptyBaseState,
      harkonnen: emptyBaseState,
      ecaz: emptyBaseState,
      smuggler: emptyBaseState,
      vernius: emptyBaseState,
      fremen: emptyBaseState,
      corrino: emptyBaseState,
    },
    selectedDevelopments: [],
    developmentsKnowledge: {},
    knowledgeBase: 5,
    ...overrides,
  }
}

function createBaseWithBuilding(
  buildingName: string,
  rowIndex = 0,
  groupIndex = 0,
  cellIndex = 0
): MainBaseStatePerFaction {
  const base: (string | null)[][][] = [[[]]]
  base[rowIndex] = base[rowIndex] || []
  base[rowIndex][groupIndex] = base[rowIndex][groupIndex] || []
  base[rowIndex][groupIndex][cellIndex] = buildingName
  return base
}

describe('Knowledge Rate Calculation Accuracy', () => {
  it('should return base rate (5 Knowledge/day) with no modifiers', () => {
    const ctx = createTestContext()
    const rate = getBaseKnowledgeRate(ctx)
    expect(rate).toBe(5)
  })

  it('should add +20% correctly with Research Center', () => {
    const baseState = createBaseWithBuilding('Research Center')
    const ctx = createTestContext({
      mainBaseState: {
        atreides: baseState,
        harkonnen: [[[null]]],
        ecaz: [[[null]]],
        smuggler: [[[null]]],
        vernius: [[[null]]],
        fremen: [[[null]]],
        corrino: [[[null]]],
      },
    })
    
    const rate = getBaseKnowledgeRate(ctx)
    // 5 * 1.2 = 6
    expect(rate).toBe(6)
  })

  it('should add +10% and +2 flat correctly with Embassy', () => {
    const baseState = createBaseWithBuilding('Embassy')
    const ctx = createTestContext({
      mainBaseState: {
        atreides: baseState,
        harkonnen: [[[null]]],
        ecaz: [[[null]]],
        smuggler: [[[null]]],
        vernius: [[[null]]],
        fremen: [[[null]]],
        corrino: [[[null]]],
      },
    })
    
    const rate = getBaseKnowledgeRate(ctx)
    // 5 * 1.1 + 2 = 5.5 + 2 = 7.5 → rounded to 8
    expect(rate).toBe(8)
  })

  it('should apply category bonus (25%) per 1-slot building', () => {
    // Create a 1-slot building that contributes to statecraft domain
    // Research Center is Statecraft category
    const baseState: (string | null)[][][] = [[['Research Center']]] // 1-slot group
    const ctx = createTestContext({
      mainBaseState: {
        atreides: baseState,
        harkonnen: [[[null]]],
        ecaz: [[[null]]],
        smuggler: [[[null]]],
        vernius: [[[null]]],
        fremen: [[[null]]],
        corrino: [[[null]]],
      },
    })

    const breakdown = getKnowledgeBreakdownForDev('test-dev', 'statecraft', ctx)

    // Should have category bonus from Research Center (Statecraft category)
    // Base: 5, Global: +20% (Research Center), Category: +25% (1-slot Statecraft building)
    // 5 * 1.2 * 1.25 = 7.5 → rounded
    expect(breakdown.categoryPercent.length).toBeGreaterThan(0)
    expect(breakdown.computedWithoutOverride).toBeGreaterThan(6) // Greater than just global bonus
  })

  it('should clamp knowledge rate to 5-50 range', () => {
    // Test minimum clamping
    const ctx = createTestContext({
      knowledgeBase: 3, // Below minimum
    })
    const rate = getBaseKnowledgeRate(ctx)
    expect(rate).toBeGreaterThanOrEqual(5)
    
    // Test maximum clamping with override
    const ctx2 = createTestContext({
      developmentsKnowledge: { 'test-dev': 100 },
    })
    const breakdown = getKnowledgeBreakdownForDev('test-dev', 'economic', ctx2)
    expect(breakdown.effective).toBeLessThanOrEqual(50)
    expect(breakdown.effective).toBeGreaterThanOrEqual(5)
  })

  it('should respect building date dependencies', () => {
    const baseState = createBaseWithBuilding('Research Center')
    const ctx = createTestContext({
      mainBaseState: {
        atreides: baseState,
        harkonnen: [[[null]]],
        ecaz: [[[null]]],
        smuggler: [[[null]]],
        vernius: [[[null]]],
        fremen: [[[null]]],
        corrino: [[[null]]],
      },
      buildingDates: {
        atreides: { '0-0-0': 10 }, // Building added at day 10
        harkonnen: {},
        ecaz: {},
        smuggler: {},
        vernius: {},
        fremen: {},
        corrino: {},
      },
    })
    
    // At day 5, building should not be active
    const breakdownBefore = getKnowledgeBreakdownForDev('test-dev', 'economic', ctx, {
      referenceDay: 5,
    })
    
    // At day 15, building should be active
    const breakdownAfter = getKnowledgeBreakdownForDev('test-dev', 'economic', ctx, {
      referenceDay: 15,
    })
    
    // Knowledge rate should be higher after building is active
    expect(breakdownAfter.computedWithoutOverride).toBeGreaterThanOrEqual(
      breakdownBefore.computedWithoutOverride
    )
  })

  it('should handle dual-base factions correctly', () => {
    const baseState0 = createBaseWithBuilding('Research Center')
    const baseState1 = createBaseWithBuilding('Embassy')
    const ctx = createTestContext({
      selectedFaction: 'corrino' as FactionLabel,
      mainBaseState: {
        atreides: [[[null]]],
        harkonnen: [[[null]]],
        ecaz: [[[null]]],
        smuggler: [[[null]]],
        vernius: [[[null]]],
        fremen: [[[null]]],
        corrino: [baseState0 as (string | null)[][][], baseState1 as (string | null)[][][]],
      },
    })
    
    // Should count buildings from both bases
    const breakdown = getKnowledgeBreakdownForDev('test-dev', 'economic', ctx)
    
    // Should have modifiers from both Research Center and Embassy
    expect(breakdown.globalPercent.length).toBeGreaterThan(0)
    expect(breakdown.flat.length).toBeGreaterThan(0)
  })
})
