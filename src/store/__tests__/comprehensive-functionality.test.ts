/**
 * Comprehensive Working Tests
 *
 * These tests are designed to work with the actual implementation
 * based on testing the real behavior of the store.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useMainStore } from '../index'
import { getKnowledgeBreakdownForDev } from '../../utils/knowledge'
import { costToResearchNext, totalCostOfOrder } from '../../utils/techCost'
import { encodeBuildPayload, decodeBuildPayload } from '../../utils/buildShare'
import { normalizeLoadedBuild } from '../initial'
import type { MainBaseState } from '../main-base'

describe('Comprehensive Working Tests', () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset to a clean state
    useMainStore.setState({
      selectedFaction: 'atreides',
      selectedDevelopments: [],
      developmentsSummary: { economic: 0, military: 0, expansion: 0, statecraft: 0 },
      unitSlots: {
        atreides: [null, null],
        harkonnen: [null, null],
        ecaz: [null, null],
        smuggler: [null, null],
        vernius: [null, null],
        fremen: [null, null],
        corrino: [null, null],
      },
      armoryState: {
        atreides: [[null, null], [null, null], [null, null], [null, null], [null, null]],
        harkonnen: [[null, null], [null, null], [null, null], [null, null], [null, null]],
        ecaz: [[null, null], [null, null], [null, null], [null, null], [null, null]],
        smuggler: [[null, null], [null, null], [null, null], [null, null], [null, null]],
        vernius: [[null, null], [null, null], [null, null], [null, null], [null, null]],
        fremen: [[null, null], [null, null], [null, null], [null, null], [null, null]],
        corrino: [[null, null], [null, null], [null, null], [null, null], [null, null]],
      },
      savedBuilds: [],
      currentBuildId: null,
      currentBuildName: 'atreides 1',
    })
  })

  describe('Development Management', () => {
    it('should set and track selected developments', () => {
      const store = useMainStore.getState()

      // Initial state
      expect(store.selectedDevelopments).toEqual([])
      expect(store.developmentsSummary.economic).toBe(0)

      // Set developments
      store.setSelectedDevelopments(['test-dev-1', 'test-dev-2'], {
        economic: 2,
        military: 0,
        expansion: 0,
        statecraft: 0,
      })

      // Check state updated
      const updated = useMainStore.getState()
      expect(updated.selectedDevelopments).toEqual(['test-dev-1', 'test-dev-2'])
      expect(updated.developmentsSummary.economic).toBe(2)
    })

    it('should handle development knowledge overrides', () => {
      const store = useMainStore.getState()

      store.setSelectedDevelopments(['test-dev'], {
        economic: 1,
        military: 0,
        expansion: 0,
        statecraft: 0,
      })

      // Set knowledge override
      store.setDevelopmentKnowledge('test-dev', 25)

      const updated = useMainStore.getState()
      expect(updated.developmentsKnowledge['test-dev']).toBe(25)

      // Test clamping
      store.setDevelopmentKnowledge('test-dev', 100)
      expect(useMainStore.getState().developmentsKnowledge['test-dev']).toBe(50)

      store.setDevelopmentKnowledge('test-dev', 3)
      expect(useMainStore.getState().developmentsKnowledge['test-dev']).toBe(5)
    })
  })

  describe('Unit and Gear Management', () => {
    it('should manage unit slots correctly', () => {
      const store = useMainStore.getState()

      // Initial state - only 2 slots
      expect(store.unitSlots.atreides).toEqual([null, null])

      // Add unit to slot 2 (expands array)
      store.setUnitSlot(2, 'Test Unit')

      const updated = useMainStore.getState()
      expect(updated.unitSlots.atreides.length).toBeGreaterThanOrEqual(3)
      expect(updated.unitSlots.atreides[2]).toBe('Test Unit')
    })

    it('should manage gear slots correctly', () => {
      const store = useMainStore.getState()

      // Initial state
      expect(store.armoryState.atreides[0][0]).toBeNull()

      // Set gear
      store.setArmorySlot(0, 0, 'Test Gear')

      const updated = useMainStore.getState()
      expect(updated.armoryState.atreides[0][0]).toBe('Test Gear')

      // Remove gear
      store.setArmorySlot(0, 0, null)
      expect(useMainStore.getState().armoryState.atreides[0][0]).toBeNull()
    })

    it('should handle unit slot count management', () => {
      const store = useMainStore.getState()

      const initialCount = store.unitSlotCount
      expect(initialCount).toBe(2)

      // Add slot
      const newSlotIndex = store.addUnitSlot()
      expect(newSlotIndex).toBeDefined()
      expect(useMainStore.getState().unitSlotCount).toBe(initialCount + 1)
    })
  })

  describe('Main Base Operations', () => {
    it('should place and remove buildings correctly', () => {
      const store = useMainStore.getState()

      // Atreides layout: [[1, 2], [3], [2, 1, 1]]
      // Row 0, Group 1, Cell 0 should exist
      const initialState = store.mainBaseState.atreides[0]?.[1]?.[0]
      expect(initialState).toBeNull()

      // Place building
      store.setMainBaseCell(0, 1, 0, 'Research Center')

      const afterPlacement = useMainStore.getState()
      expect(afterPlacement.mainBaseState.atreides[0]?.[1]?.[0]).toBe('Research Center')

      // Remove building
      store.setMainBaseCell(0, 1, 0, null)

      const afterRemoval = useMainStore.getState()
      expect(afterRemoval.mainBaseState.atreides[0]?.[1]?.[0]).toBeNull()
    })

    it('should track building construction order', () => {
      const store = useMainStore.getState()

      // Place buildings in sequence
      store.setMainBaseCell(0, 1, 0, 'Building 1')
      store.setMainBaseCell(0, 1, 1, 'Building 2')

      const updated = useMainStore.getState()
      const order = updated.buildingOrder.atreides

      // Should have 2 buildings in order
      expect(order.length).toBe(2)
      expect(order).toContainEqual({ rowIndex: 0, groupIndex: 1, cellIndex: 0 })
      expect(order).toContainEqual({ rowIndex: 0, groupIndex: 1, cellIndex: 1 })
    })
  })

  describe('Build Persistence', () => {
    it('should save and load builds', () => {
      const store = useMainStore.getState()

      // Create a build
      store.setSelectedDevelopments(['test-dev'], {
        economic: 1,
        military: 0,
        expansion: 0,
        statecraft: 0,
      })
      store.setUnitSlot(2, 'Test Unit')

      // Save build
      store.saveCurrentBuild('Test Build')

      const saved = useMainStore.getState().savedBuilds
      expect(saved.length).toBe(1)
      expect(saved[0]!.name).toBe('Test Build')

      // Load build
      store.loadBuild(saved[0]!.id)

      const loaded = useMainStore.getState()
      expect(loaded.selectedDevelopments).toEqual(['test-dev'])
      expect(loaded.unitSlots.atreides[2]).toBe('Test Unit')
    })
  })

  describe('Faction Switching', () => {
    it('should switch factions and maintain state isolation', () => {
      const store = useMainStore.getState()

      // Set up Atreides
      store.switchFaction('atreides')
      store.setSelectedDevelopments(['atreides-dev'], {
        economic: 1,
        military: 0,
        expansion: 0,
        statecraft: 0,
      })

      // Switch to Harkonnen
      store.switchFaction('harkonnen')
      expect(useMainStore.getState().selectedFaction).toBe('harkonnen')
      expect(useMainStore.getState().selectedDevelopments).toEqual([]) // Reset on faction switch

      // Set up Harkonnen
      store.setSelectedDevelopments(['harkonnen-dev'], {
        economic: 0,
        military: 1,
        expansion: 0,
        statecraft: 0,
      })

      // Switch back to Atreides
      store.switchFaction('atreides')
      expect(useMainStore.getState().selectedFaction).toBe('atreides')
      expect(useMainStore.getState().selectedDevelopments).toEqual([]) // Reset again
    })
  })

  describe('Knowledge Calculations', () => {
    it('should calculate base knowledge rate', () => {
      const ctx = {
        selectedFaction: 'atreides' as const,
        mainBaseState: useMainStore.getState().mainBaseState,
        selectedDevelopments: [],
        developmentsKnowledge: {},
        knowledgeBase: 5,
      }

      const breakdown = getKnowledgeBreakdownForDev('test-dev', 'economic', ctx)
      expect(breakdown.base).toBe(5)
      expect(breakdown.computedWithoutOverride).toBe(5) // Base rate with no modifiers
    })

    it('should apply building modifiers correctly', () => {
      const store = useMainStore.getState()

      // Place Research Center
      store.setMainBaseCell(0, 1, 0, 'Research Center')

      const ctx = {
        selectedFaction: 'atreides' as const,
        mainBaseState: useMainStore.getState().mainBaseState,
        selectedDevelopments: [],
        developmentsKnowledge: {},
        knowledgeBase: 5,
      }

      const breakdown = getKnowledgeBreakdownForDev('test-dev', 'statecraft', ctx)

      // Should have Research Center +20% modifier
      const researchCenterBonus = breakdown.globalPercent.find(m => m.label === 'Research Center')
      expect(researchCenterBonus).toBeDefined()
      expect(researchCenterBonus!.percent).toBe(0.2)
    })
  })

  describe('Development Costs', () => {
    it('should calculate research costs correctly', () => {
      const dev = { id: 'test-dev', tier: 0 }
      const idToDev = new Map([['test-dev', dev]])

      // First development cost
      const cost = costToResearchNext(dev, [], idToDev)
      expect(cost).toBeCloseTo(20.36, 1)

      // Second development cost (after first)
      const cost2 = costToResearchNext(dev, ['test-dev'], idToDev)
      expect(cost2).toBeGreaterThan(cost)
    })

    it('should calculate total cost for development order', () => {
      const dev1 = { id: 'dev1', tier: 0 }
      const dev2 = { id: 'dev2', tier: 0 }
      const idToDev = new Map([
        ['dev1', dev1],
        ['dev2', dev2],
      ])

      const totalCost = totalCostOfOrder(['dev1', 'dev2'], idToDev)
      expect(totalCost).toBeGreaterThan(0)

      // Calculate manually to verify
      const cost1 = costToResearchNext(dev1, [], idToDev)
      const cost2 = costToResearchNext(dev2, ['dev1'], idToDev)
      expect(totalCost).toBeCloseTo(cost1 + cost2, 0.01)
    })
  })

  describe('Build Sharing', () => {
    it('should encode and decode build payloads', () => {
      const payload = {
        f: 'atreides' as const,
        state: [[[null]]] as MainBaseState,
        order: [],
        armory: [[null, null], [null, null], [null, null], [null, null], [null, null]],
        units: [null, null],
        councillors: [null, null],
        operations: [null, null, null, null, null],
        unitSlotCount: 2,
        panelVisibility: {
          mainBaseOpen: true,
          armoryOpen: false,
          unitsOpen: false,
          councillorsOpen: false,
          operationsOpen: false,
          developmentsOpen: false,
        },
        developmentsSummary: {
          economic: 0,
          military: 0,
          expansion: 0,
          statecraft: 0,
        },
        selectedDevelopments: [],
        metadata: {
          author: 'Test',
          social: '',
          commentary: '',
          media: '',
        },
      }

      const encoded = encodeBuildPayload(payload)
      expect(encoded).toBeTruthy()

      // Simulate URL parameter
      const search = `?build=${encoded}`
      const decoded = decodeBuildPayload(search)

      expect(decoded).not.toBeNull()
      expect(decoded!.f).toBe(payload.f)
      expect(decoded!.selectedDevelopments).toEqual(payload.selectedDevelopments)
    })
  })

  describe('Data Migration', () => {
    it('should normalize legacy build formats', () => {
      const legacyBuild = {
        selectedFaction: 'atreides' as const,
        mainBaseState: {
          atreides: [[[null]]],
          harkonnen: [[[null]]],
          ecaz: [[[null]]],
          smuggler: [[[null]]],
          vernius: [[[null]]],
          fremen: [[[null]]],
          corrino: [[[null]]],
        },
        buildingOrder: {
          atreides: [],
          harkonnen: [],
          ecaz: [],
          smuggler: [],
          vernius: [],
          fremen: [],
          corrino: [],
        },
        // Missing optional fields
      }

      const normalized = normalizeLoadedBuild(legacyBuild, 'anon')

      expect(normalized.unitSlotCount).toBe(2) // Default
      expect(normalized.developmentsKnowledge).toEqual({})
      expect(normalized.knowledgeBase).toBe(5)
    })
  })
})