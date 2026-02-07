/**
 * Test 1: Build State Persistence and Recovery
 * 
 * Purpose: Ensure builds are saved and loaded correctly, including edge cases like dual-base factions.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useMainStore } from '../index'
import type { SavedBuild } from '../types'

describe('Build State Persistence and Recovery', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset store to initial state
    useMainStore.setState({
      savedBuilds: [],
      currentBuildId: null,
      currentBuildName: 'atreides 1',
      selectedFaction: 'atreides',
    })
  })

  it('should save a build with all components', () => {
    const store = useMainStore.getState()

    // Set up a complete build
    store.setMainBaseCell(0, 0, 0, 'Research Center')
    store.setUnitSlot(2, 'A_Unit_1')
    store.setArmorySlot(0, 0, 'Gear_1')
    store.toggleCouncillor('Councillor_1')
    store.setOperationSlot(0, 'Operation_1')
    store.setSelectedDevelopments(['Dev_1', 'Dev_2'], {
      economic: 1,
      military: 1,
      expansion: 0,
      statecraft: 0,
    })
    store.setMetadataAuthor('Test Author')
    store.setMetadataCommentary('Test commentary')

    // Save the build
    store.saveCurrentBuild('Test Build')

    const savedBuilds = useMainStore.getState().savedBuilds
    expect(savedBuilds.length).toBe(1)

    const saved = savedBuilds[0]!
    expect(saved.name).toBe('Test Build')
    expect(saved.selectedFaction).toBe('atreides')
    expect(saved.metadata.author).toBe('Test Author')
    expect(saved.metadata.commentary).toBe('Test commentary')
    expect(saved.selectedDevelopments).toEqual(['Dev_1', 'Dev_2'])
    expect(saved.unitSlots.atreides[2]).toBe('A_Unit_1')
  })

  it('should load a saved build and verify all state matches', () => {
    const store = useMainStore.getState()

    // Create and save a build
    store.setMainBaseCell(0, 0, 0, 'Research Center')
    store.setUnitSlot(2, 'A_Unit_1')
    store.setSelectedDevelopments(['Dev_1'], {
      economic: 1,
      military: 0,
      expansion: 0,
      statecraft: 0,
    })
    store.saveCurrentBuild('Load Test Build')

    const savedBuilds = useMainStore.getState().savedBuilds
    const buildId = savedBuilds[0]!.id

    // Reset state
    store.resetToDefault()
    expect(useMainStore.getState().currentBuildId).toBeNull()

    // Load the build
    store.loadBuild(buildId)

    const loaded = useMainStore.getState()
    expect(loaded.currentBuildId).toBe(buildId)
    expect(loaded.currentBuildName).toBe('Load Test Build')
    expect(loaded.selectedFaction).toBe('atreides')
    expect(loaded.unitSlots.atreides[2]).toBe('A_Unit_1')
    expect(loaded.selectedDevelopments).toEqual(['Dev_1'])
  })

  it('should save and load dual-base factions correctly', () => {
    const store = useMainStore.getState()

    // Test with Corrino (dual-base faction)
    store.switchFaction('corrino')
    store.setSelectedMainBaseIndex(0)
    store.setMainBaseCell(0, 0, 0, 'Research Center')

    // Switch to second base
    store.setSelectedMainBaseIndex(1)
    store.setMainBaseCell(0, 0, 0, 'Embassy')

    store.saveCurrentBuild('Dual Base Test')

    const savedBuilds = useMainStore.getState().savedBuilds
    const buildId = savedBuilds[0]!.id

    // Reset and load
    store.resetToDefault()
    store.loadBuild(buildId)

    const loaded = useMainStore.getState()
    expect(loaded.selectedFaction).toBe('corrino')

    // Verify both bases are saved
    const mainBaseState = loaded.mainBaseState.corrino
    expect(Array.isArray(mainBaseState)).toBe(true)
    expect(mainBaseState.length).toBe(2)

    const [base0, base1] = mainBaseState as [(string | null)[][][], (string | null)[][][]]
    expect(base0[0]?.[0]?.[0]).toBe('Research Center')
    expect(base1[0]?.[0]?.[0]).toBe('Embassy')
  })

  it('should preserve unsaved changes when switching builds', () => {
    const store = useMainStore.getState()

    // Create first build
    store.setMainBaseCell(0, 0, 0, 'Research Center')
    store.saveCurrentBuild('Build 1')
    const build1Id = useMainStore.getState().savedBuilds[0]!.id

    // Create second build
    store.resetToDefault()
    store.setMainBaseCell(0, 0, 0, 'Embassy')
    store.saveCurrentBuild('Build 2')
    const build2Id = useMainStore.getState().savedBuilds[0]!.id

    // Load build 1
    store.loadBuild(build1Id)
    expect(useMainStore.getState().currentBuildId).toBe(build1Id)

    // Make unsaved changes
    store.setMainBaseCell(0, 0, 1, 'New Building')

    // Switch to build 2 (should auto-save build 1)
    store.loadBuild(build2Id)

    // Reload build 1 and verify changes were saved
    store.loadBuild(build1Id)
    const state = useMainStore.getState()
    const baseState = state.mainBaseState.atreides
    expect(baseState[0]?.[0]?.[1]).toBe('New Building')
  })

  it('should handle localStorage corruption recovery', () => {
    // Simulate corrupted localStorage
    localStorage.setItem('spicy-techs-main-store', 'invalid json{')

    // Store should initialize with default state even with corrupted data
    const store = useMainStore.getState()
    expect(store.savedBuilds).toEqual([])
    expect(store.currentBuildId).toBeNull()

    // Should be able to create new builds after corruption
    store.setMainBaseCell(0, 0, 0, 'Research Center')
    store.saveCurrentBuild('Recovery Test')

    const savedBuilds = useMainStore.getState().savedBuilds
    expect(savedBuilds.length).toBe(1)
    expect(savedBuilds[0]!.name).toBe('Recovery Test')
  })

  it('should handle missing optional fields in saved builds', () => {
    // Create a minimal build without optional fields
    const minimalBuild: Partial<SavedBuild> & Pick<SavedBuild, 'selectedFaction' | 'mainBaseState' | 'buildingOrder'> = {
      id: 'test-id',
      name: 'Minimal Build',
      createdAt: Date.now(),
      selectedFaction: 'atreides',
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
      // Missing: developmentsKnowledge, knowledgeBase, buildingDates
    }

    // Manually add to savedBuilds and load
    useMainStore.setState({
      savedBuilds: [minimalBuild as SavedBuild],
    })

    useMainStore.getState().loadBuild('test-id')

    const state = useMainStore.getState()
    expect(state.developmentsKnowledge).toEqual({})
    expect(state.knowledgeBase).toBe(5) // Default value
  })
})
