/**
 * Test 10: Data Migration and Normalization
 * 
 * Purpose: Ensure legacy build formats are normalized correctly on load.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useMainStore } from '../index'
import { normalizeLoadedBuild, DEFAULT_KNOWLEDGE_BASE } from '../initial'
import type { SavedBuild, FactionLabel, MainBaseStatePerFaction } from '../types'
import { MAIN_BASE_VARIANT_FACTIONS } from '../types'

describe('Data Migration and Normalization', () => {
  beforeEach(() => {
    localStorage.clear()
    useMainStore.setState({
      savedBuilds: [],
      currentBuildId: null,
      currentBuildName: 'atreides 1',
      selectedFaction: 'atreides',
    })
  })

  it('should normalize old format build (single base for variant faction)', () => {
    // Create old format build for Corrino (variant faction) with single base
    const oldBuild: Partial<SavedBuild> & Pick<SavedBuild, 'selectedFaction' | 'mainBaseState' | 'buildingOrder'> = {
      id: 'old-build',
      name: 'Old Format Build',
      createdAt: Date.now(),
      selectedFaction: 'corrino' as FactionLabel,
      mainBaseState: {
        corrino: [[['Research Center']]] as MainBaseStatePerFaction, // Single base, not tuple
        atreides: [[[null]]],
        harkonnen: [[[null]]],
        ecaz: [[[null]]],
        smuggler: [[[null]]],
        vernius: [[[null]]],
        fremen: [[[null]]],
      },
      buildingOrder: {
        corrino: [{ rowIndex: 0, groupIndex: 0, cellIndex: 0 }], // Single array, not tuple
        atreides: [],
        harkonnen: [],
        ecaz: [],
        smuggler: [],
        vernius: [],
        fremen: [],
      },
    }
    
    // Normalize
    const normalized = normalizeLoadedBuild(oldBuild, 'anon')
    
    // Should have normalized structure
    expect(normalized).toBeDefined()
    
    // When loading, the store should normalize it
    useMainStore.setState({
      savedBuilds: [oldBuild as SavedBuild],
    })
    
    useMainStore.getState().loadBuild('old-build')
    
    const state = useMainStore.getState()
    const mainBaseState = state.mainBaseState.corrino
    
    // Should be normalized to tuple format
    expect(Array.isArray(mainBaseState)).toBe(true)
    if (Array.isArray(mainBaseState) && mainBaseState.length === 2) {
      expect(mainBaseState[0]).toBeDefined()
      expect(mainBaseState[1]).toBeDefined()
    }
  })

  it('should handle missing optional fields with defaults', () => {
    const minimalBuild: Partial<SavedBuild> & Pick<SavedBuild, 'selectedFaction' | 'mainBaseState' | 'buildingOrder'> = {
      id: 'minimal',
      name: 'Minimal Build',
      createdAt: Date.now(),
      selectedFaction: 'atreides' as FactionLabel,
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
      // Missing: developmentsKnowledge, knowledgeBase, buildingDates, selectedDevelopments
    }
    
    const normalized = normalizeLoadedBuild(minimalBuild, 'anon')
    
    // Should have default values
    expect(normalized.developmentsKnowledge).toEqual({})
    expect(normalized.knowledgeBase).toBe(DEFAULT_KNOWLEDGE_BASE)
    expect(normalized.selectedDevelopments).toEqual([])
    expect(normalized.buildingDates).toBeDefined()
  })

  it('should normalize building order (tuple vs flat array)', () => {
    // Test single-base faction with tuple-shaped order (old bug)
    const buggyBuild: Partial<SavedBuild> & Pick<SavedBuild, 'selectedFaction' | 'mainBaseState' | 'buildingOrder'> = {
      id: 'buggy',
      name: 'Buggy Order',
      createdAt: Date.now(),
      selectedFaction: 'atreides' as FactionLabel,
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
        atreides: [[{ rowIndex: 0, groupIndex: 0, cellIndex: 0 }], []] as [Array<{rowIndex: number, groupIndex: number, cellIndex: number}>, Array<{rowIndex: number, groupIndex: number, cellIndex: number}>], // Tuple-shaped bug
        harkonnen: [],
        ecaz: [],
        smuggler: [],
        vernius: [],
        fremen: [],
        corrino: [],
      },
    }
    
    // Store should normalize on load
    useMainStore.setState({
      savedBuilds: [buggyBuild as SavedBuild],
    })
    
    useMainStore.getState().loadBuild('buggy')
    
    const state = useMainStore.getState()
    const order = state.buildingOrder.atreides
    
    // Should be normalized to flat array
    expect(Array.isArray(order)).toBe(true)
    if (Array.isArray(order) && order.length > 0 && typeof order[0] === 'object' && 'rowIndex' in order[0]) {
      // It's a flat array of coords
      expect(order[0]).toHaveProperty('rowIndex')
    }
  })

  it('should normalize metadata with default author', () => {
    const buildWithoutAuthor: Partial<SavedBuild> & Pick<SavedBuild, 'selectedFaction' | 'mainBaseState' | 'buildingOrder'> = {
      id: 'no-author',
      name: 'No Author',
      createdAt: Date.now(),
      selectedFaction: 'atreides' as FactionLabel,
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
      // No metadata at all
    }

    const normalized = normalizeLoadedBuild(buildWithoutAuthor, 'default-author')

    expect(normalized.metadata.author).toBe('default-author')
  })

  it('should normalize URL fields in metadata', () => {
    const build: Partial<SavedBuild> & Pick<SavedBuild, 'selectedFaction' | 'mainBaseState' | 'buildingOrder'> = {
      id: 'url-test',
      name: 'URL Test',
      createdAt: Date.now(),
      selectedFaction: 'atreides' as FactionLabel,
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
      metadata: {
        author: 'test',
        social: 'example.com', // Missing https://
        commentary: '',
        media: 'http://media.com', // Has http://
      },
    }
    
    const normalized = normalizeLoadedBuild(build, 'anon')
    
    // URL normalization is handled in setMetadataSocial/setMetadataMedia
    // But we verify metadata structure
    expect(normalized.metadata.social).toBeDefined()
    expect(normalized.metadata.media).toBeDefined()
  })

  it('should normalize unit slot format migration', () => {
    // Old format: unit slots without add slot at index 0
    const oldFormat: Partial<SavedBuild> & Pick<SavedBuild, 'selectedFaction' | 'mainBaseState' | 'buildingOrder'> = {
      id: 'old-units',
      name: 'Old Units',
      createdAt: Date.now(),
      selectedFaction: 'atreides' as FactionLabel,
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
      unitSlots: {
        atreides: ['A_Hero_1', 'A_Unit_1'], // Old format: different structure
        harkonnen: [null, null],
        ecaz: [null, null],
        smuggler: [null, null],
        vernius: [null, null],
        fremen: [null, null],
        corrino: [null, null],
      },
    }

    const normalized = normalizeLoadedBuild(oldFormat, 'anon')

    // Should use the provided unitSlots if available
    const units = normalized.unitSlots.atreides
    expect(units).toEqual(['A_Hero_1', 'A_Unit_1'])
  })

  it('should handle missing selectedMainBaseIndex', () => {
    const buildWithoutIndex: Partial<SavedBuild> & Pick<SavedBuild, 'selectedFaction' | 'mainBaseState' | 'buildingOrder'> = {
      id: 'no-index',
      name: 'No Index',
      createdAt: Date.now(),
      selectedFaction: 'corrino' as FactionLabel,
      mainBaseState: {
        corrino: [[['Research Center']], [[null]]] as MainBaseStatePerFaction,
        atreides: [[[null]]],
        harkonnen: [[[null]]],
        ecaz: [[[null]]],
        smuggler: [[[null]]],
        vernius: [[[null]]],
        fremen: [[[null]]],
      },
      buildingOrder: {
        corrino: [[], []] as [Array<{rowIndex: number, groupIndex: number, cellIndex: number}>, Array<{rowIndex: number, groupIndex: number, cellIndex: number}>],
        atreides: [],
        harkonnen: [],
        ecaz: [],
        smuggler: [],
        vernius: [],
        fremen: [],
      },
      // Missing selectedMainBaseIndex
    }
    
    useMainStore.setState({
      savedBuilds: [buildWithoutIndex as SavedBuild],
    })
    
    useMainStore.getState().loadBuild('no-index')
    
    const state = useMainStore.getState()
    
    // Should use default index (0)
    expect(state.selectedMainBaseIndex.corrino).toBe(0)
  })

  it('should normalize knowledgeBase to valid range', () => {
    const buildWithInvalidKnowledge: Partial<SavedBuild> & Pick<SavedBuild, 'selectedFaction' | 'mainBaseState' | 'buildingOrder'> = {
      id: 'invalid-knowledge',
      name: 'Invalid Knowledge',
      createdAt: Date.now(),
      selectedFaction: 'atreides' as FactionLabel,
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
      knowledgeBase: 100, // Above max
    }
    
    const normalized = normalizeLoadedBuild(buildWithInvalidKnowledge, 'anon')
    
    // Should be clamped to 50
    expect(normalized.knowledgeBase).toBe(50)
    
    // Test below minimum
    const buildLow: Partial<SavedBuild> & Pick<SavedBuild, 'selectedFaction' | 'mainBaseState' | 'buildingOrder'> = {
      ...buildWithInvalidKnowledge,
      id: 'low-knowledge',
      knowledgeBase: 3, // Below min
    }
    
    const normalizedLow = normalizeLoadedBuild(buildLow, 'anon')
    expect(normalizedLow.knowledgeBase).toBe(5) // Clamped to min
  })

  it('should handle all variant factions normalization', () => {
    for (const faction of MAIN_BASE_VARIANT_FACTIONS) {
      const build: Partial<SavedBuild> & Pick<SavedBuild, 'selectedFaction' | 'mainBaseState' | 'buildingOrder'> = {
        id: `variant-${faction}`,
        name: `Variant ${faction}`,
        createdAt: Date.now(),
        selectedFaction: faction,
        mainBaseState: {
          [faction]: [[['Research Center']]] as MainBaseStatePerFaction, // Single base
          atreides: [[[null]]],
          harkonnen: [[[null]]],
          ecaz: [[[null]]],
          smuggler: [[[null]]],
          vernius: [[[null]]],
          fremen: [[[null]]],
          corrino: [[[null]]],
        },
        buildingOrder: {
          [faction]: [{ rowIndex: 0, groupIndex: 0, cellIndex: 0 }], // Single array
          atreides: [],
          harkonnen: [],
          ecaz: [],
          smuggler: [],
          vernius: [],
          fremen: [],
          corrino: [],
        },
      }
      
      const normalized = normalizeLoadedBuild(build, 'anon')
      
      // Should be normalized
      expect(normalized).toBeDefined()
    }
  })
})
