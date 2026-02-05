/**
 * Test 3: Development Cost Calculation
 * 
 * Purpose: Ensure research cost formula matches game's geometric progression.
 */

import { describe, it, expect } from 'vitest'
import {
  developmentCost,
  costToResearchNext,
  totalCostOfOrder,
  getStepsForTier,
  DEVELOPMENT_COST,
} from '../techCost'
import type { DevWithTier } from '../techCost'

describe('Development Cost Calculation', () => {
  it('should calculate first development cost correctly (~20.4 Knowledge for tier 0)', () => {
    const steps = getStepsForTier(0) // Should be 2
    expect(steps).toBe(2)
    
    const cost = developmentCost(steps, 0) // No previous steps
    // Formula: BaseCost × (ScalePerStep^0) × (ScalePerStep^2 - 1) / (ScalePerStep - 1)
    // = 10 × 1 × (1.036^2 - 1) / 0.036
    // ≈ 10 × (1.073296 - 1) / 0.036
    // ≈ 10 × 0.073296 / 0.036
    // ≈ 10 × 2.036
    // ≈ 20.36
    
    expect(cost).toBeCloseTo(20.36, 1)
  })

  it('should increase cost correctly with each researched development', () => {
    const dev1: DevWithTier = { id: 'dev1', tier: 0 }
    const dev2: DevWithTier = { id: 'dev2', tier: 0 }
    const dev3: DevWithTier = { id: 'dev3', tier: 0 }
    
    const idToDev = new Map([
      [dev1.id, dev1],
      [dev2.id, dev2],
      [dev3.id, dev3],
    ])
    
    const cost1 = costToResearchNext(dev1, [], idToDev)
    const cost2 = costToResearchNext(dev2, [dev1.id], idToDev)
    const cost3 = costToResearchNext(dev3, [dev1.id, dev2.id], idToDev)
    
    // Each subsequent development should cost more
    expect(cost2).toBeGreaterThan(cost1)
    expect(cost3).toBeGreaterThan(cost2)
    
    // Verify the scaling factor is applied
    const steps1 = getStepsForTier(dev1.tier)
    const totalStepsAfter1 = steps1
    
    // Cost2 should be approximately cost1 * scalePerStep^steps1
    const expectedCost2 = cost1 * Math.pow(DEVELOPMENT_COST.scalePerStep, totalStepsAfter1)
    expect(cost2).toBeCloseTo(expectedCost2, 0.5)
  })

  it('should calculate different tier costs correctly', () => {
    const tier0: DevWithTier = { id: 'tier0', tier: 0 }
    const tier1: DevWithTier = { id: 'tier1', tier: 1 }
    const tier2: DevWithTier = { id: 'tier2', tier: 2 }
    const tier3: DevWithTier = { id: 'tier3', tier: 3 }
    
    const idToDev = new Map([
      [tier0.id, tier0],
      [tier1.id, tier1],
      [tier2.id, tier2],
      [tier3.id, tier3],
    ])
    
    // All researched with no previous steps
    const cost0 = costToResearchNext(tier0, [], idToDev)
    const cost1 = costToResearchNext(tier1, [], idToDev)
    const cost2 = costToResearchNext(tier2, [], idToDev)
    const cost3 = costToResearchNext(tier3, [], idToDev)
    
    // Verify steps per tier
    expect(getStepsForTier(0)).toBe(2)
    expect(getStepsForTier(1)).toBe(3)
    expect(getStepsForTier(2)).toBe(4)
    expect(getStepsForTier(3)).toBe(5)
    
    // Higher tiers should generally cost more (though exact comparison depends on formula)
    // But tier 1 with 3 steps vs tier 0 with 2 steps: both have same base multiplier (scalePerStep^0)
    // So tier 1 should cost more due to more steps
    expect(cost1).toBeGreaterThan(cost0)
    expect(cost2).toBeGreaterThan(cost1)
    expect(cost3).toBeGreaterThan(cost2)
  })

  it('should calculate total cost for ordered sequence correctly', () => {
    const dev1: DevWithTier = { id: 'dev1', tier: 0 }
    const dev2: DevWithTier = { id: 'dev2', tier: 0 }
    const dev3: DevWithTier = { id: 'dev3', tier: 1 }
    
    const idToDev = new Map([
      [dev1.id, dev1],
      [dev2.id, dev2],
      [dev3.id, dev3],
    ])
    
    const order = [dev1.id, dev2.id, dev3.id]
    const totalCost = totalCostOfOrder(order, idToDev)
    
    // Calculate manually to verify
    const cost1 = costToResearchNext(dev1, [], idToDev)
    const cost2 = costToResearchNext(dev2, [dev1.id], idToDev)
    const cost3 = costToResearchNext(dev3, [dev1.id, dev2.id], idToDev)
    const manualTotal = cost1 + cost2 + cost3
    
    expect(totalCost).toBeCloseTo(manualTotal, 0.01)
  })

  it('should show that order matters (shallow-first vs deep-first)', () => {
    // Shallow-first: multiple tier 0 developments
    const shallow1: DevWithTier = { id: 's1', tier: 0 }
    const shallow2: DevWithTier = { id: 's2', tier: 0 }
    const shallow3: DevWithTier = { id: 's3', tier: 0 }
    
    // Deep-first: high tier development first
    const deep1: DevWithTier = { id: 'd1', tier: 3 }
    const deep2: DevWithTier = { id: 'd2', tier: 0 }
    const deep3: DevWithTier = { id: 'd3', tier: 0 }
    
    const idToDev = new Map([
      [shallow1.id, shallow1],
      [shallow2.id, shallow2],
      [shallow3.id, shallow3],
      [deep1.id, deep1],
      [deep2.id, deep2],
      [deep3.id, deep3],
    ])
    
    const shallowOrder = [shallow1.id, shallow2.id, shallow3.id]
    const deepOrder = [deep1.id, deep2.id, deep3.id]
    
    const shallowTotal = totalCostOfOrder(shallowOrder, idToDev)
    const deepTotal = totalCostOfOrder(deepOrder, idToDev)
    
    // Shallow-first should generally cost less total because:
    // - Early low-tier devs have lower base multiplier
    // - Later devs benefit from accumulated steps but at lower cost
    // Deep-first has high cost early, then subsequent devs are even more expensive
    
    // Verify they're different
    expect(shallowTotal).not.toBe(deepTotal)
    
    // Shallow-first should be cheaper (this is the key insight from the game)
    expect(shallowTotal).toBeLessThan(deepTotal)
  })

  it('should handle edge cases correctly', () => {
    // Empty order
    const emptyCost = totalCostOfOrder([], new Map())
    expect(emptyCost).toBe(0)
    
    // Single development
    const single: DevWithTier = { id: 'single', tier: 0 }
    const idToDev = new Map([[single.id, single]])
    const singleCost = totalCostOfOrder([single.id], idToDev)
    expect(singleCost).toBeGreaterThan(0)
    
    // Invalid tier (should clamp)
    // Should use clamped tier values
    const stepsNeg = getStepsForTier(-1)
    const stepsHigh = getStepsForTier(10)
    expect(stepsNeg).toBe(2) // Clamped to tier 0
    expect(stepsHigh).toBe(5) // Clamped to tier 3
  })

  it('should match the geometric progression formula exactly', () => {
    const steps = 3 // Tier 1
    const totalStepResearched = 5 // Already researched 5 steps
    
    const cost = developmentCost(steps, totalStepResearched)
    
    // Manual calculation
    const { baseCost, scalePerStep } = DEVELOPMENT_COST
    const exponent = totalStepResearched
    const geometric = (Math.pow(scalePerStep, steps) - 1) / (scalePerStep - 1)
    const expected = baseCost * Math.pow(scalePerStep, exponent) * geometric
    
    expect(cost).toBeCloseTo(expected, 10)
  })
})
