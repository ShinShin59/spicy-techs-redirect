/**
 * Test 4: Build Sharing URL Encoding/Decoding
 * 
 * Purpose: Verify builds can be shared via URL and decoded correctly.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  encodeBuildPayload,
  decodeBuildPayload,
  getShareUrl,
  type SharedBuildPayload,
} from '../buildShare'
import type { FactionLabel } from '@/store/types'
import type { MainBaseState } from '@/store/main-base'

describe('Build Sharing URL Encoding/Decoding', () => {
  beforeEach(() => {
    // Reset window.location.search
    window.location.search = ''
  })

  function createTestPayload(): SharedBuildPayload {
    return {
      f: 'atreides' as FactionLabel,
      state: [[['Research Center']]] as MainBaseState,
      order: [{ rowIndex: 0, groupIndex: 0, cellIndex: 0 }],
      armory: [[null, null], [null, null], [null, null], [null, null], [null, null]],
      units: [null, null, 'A_Unit_1'],
      councillors: ['Councillor_1', null],
      operations: ['Operation_1', null, null, null, null],
      unitSlotCount: 3,
      panelVisibility: {
        mainBaseOpen: true,
        armoryOpen: true,
        unitsOpen: true,
        councillorsOpen: true,
        operationsOpen: true,
        developmentsOpen: true,
      },
      developmentsSummary: {
        economic: 1,
        military: 0,
        expansion: 0,
        statecraft: 0,
      },
      selectedDevelopments: ['Dev_1'],
      metadata: {
        author: 'Test Author',
        social: 'https://example.com',
        commentary: 'Test commentary',
        media: 'https://media.example.com',
      },
    }
  }

  it('should encode complete build with all components', () => {
    const payload = createTestPayload()
    const encoded = encodeBuildPayload(payload)

    expect(encoded).toBeTruthy()
    expect(typeof encoded).toBe('string')
    expect(encoded.length).toBeGreaterThan(0)
  })

  it('should decode shared build URL and verify state matches', () => {
    const originalPayload = createTestPayload()
    const encoded = encodeBuildPayload(originalPayload)

    // Simulate URL parameter
    window.location.search = `?build=${encoded}`
    const decoded = decodeBuildPayload(window.location.search)

    expect(decoded).not.toBeNull()
    expect(decoded!.f).toBe(originalPayload.f)
    expect(decoded!.state).toEqual(originalPayload.state)
    expect(decoded!.order).toEqual(originalPayload.order)
    expect(decoded!.armory).toEqual(originalPayload.armory)
    expect(decoded!.units).toEqual(originalPayload.units)
    expect(decoded!.councillors).toEqual(originalPayload.councillors)
    expect(decoded!.operations).toEqual(originalPayload.operations)
    expect(decoded!.unitSlotCount).toBe(originalPayload.unitSlotCount)
    expect(decoded!.panelVisibility).toEqual(originalPayload.panelVisibility)
    expect(decoded!.developmentsSummary).toEqual(originalPayload.developmentsSummary)
    expect(decoded!.selectedDevelopments).toEqual(originalPayload.selectedDevelopments)
    expect(decoded!.metadata).toEqual(originalPayload.metadata)
  })

  it('should handle missing optional fields gracefully', () => {
    const minimalPayload: SharedBuildPayload = {
      f: 'atreides' as FactionLabel,
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
        author: '',
        social: '',
        commentary: '',
        media: '',
      },
      // Missing: developmentsKnowledge, knowledgeBase, buildingDates
    }

    const encoded = encodeBuildPayload(minimalPayload)
    window.location.search = `?build=${encoded}`
    const decoded = decodeBuildPayload(window.location.search)

    expect(decoded).not.toBeNull()
    expect(decoded!.f).toBe('atreides')
    // Optional fields should be undefined or have defaults
    expect(decoded!.developmentsKnowledge).toBeUndefined()
    expect(decoded!.knowledgeBase).toBeUndefined()
  })

  it('should compress URL correctly using lz-string', () => {
    const payload = createTestPayload()
    payload.metadata.commentary = 'A'.repeat(1000) // Large payload

    const encoded = encodeBuildPayload(payload)
    const jsonString = JSON.stringify(payload)

    // Encoded should be shorter than raw JSON (compression working)
    expect(encoded.length).toBeLessThan(jsonString.length)

    // Should still decode correctly
    window.location.search = `?build=${encoded}`
    const decoded = decodeBuildPayload(window.location.search)
    expect(decoded).not.toBeNull()
    expect(decoded!.metadata.commentary).toBe(payload.metadata.commentary)
  })

  it('should encode and decode dual-base factions correctly', () => {
    const payload: SharedBuildPayload = {
      f: 'corrino' as FactionLabel,
      state: [[['Research Center']]] as MainBaseState,
      state2: [[['Embassy']]] as MainBaseState,
      order: [{ rowIndex: 0, groupIndex: 0, cellIndex: 0 }],
      order2: [{ rowIndex: 0, groupIndex: 0, cellIndex: 0 }],
      mainBaseIndex: 1,
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
        author: '',
        social: '',
        commentary: '',
        media: '',
      },
    }

    const encoded = encodeBuildPayload(payload)
    window.location.search = `?build=${encoded}`
    const decoded = decodeBuildPayload(window.location.search)

    expect(decoded).not.toBeNull()
    expect(decoded!.f).toBe('corrino')
    expect(decoded!.state2).toEqual(payload.state2)
    expect(decoded!.order2).toEqual(payload.order2)
    expect(decoded!.mainBaseIndex).toBe(1)
  })

  it('should handle corrupted/invalid URL parameters gracefully', () => {
    // Invalid base64-like string
    window.location.search = '?build=invalid!!!'
    const decoded1 = decodeBuildPayload(window.location.search)
    expect(decoded1).toBeNull()

    // Missing build parameter
    window.location.search = '?other=value'
    const decoded2 = decodeBuildPayload(window.location.search)
    expect(decoded2).toBeNull()

    // Invalid JSON after decompression
    // This is harder to test directly, but the try-catch should handle it
    window.location.search = '?build=invalid'
    const decoded3 = decodeBuildPayload(window.location.search)
    expect(decoded3).toBeNull()
  })

  it('should generate correct share URL', () => {
    const payload = createTestPayload()
    const encoded = encodeBuildPayload(payload)
    const url = getShareUrl(encoded)

    expect(url).toContain('build=')
    expect(url).toContain(encoded)
    expect(url.startsWith('http://localhost:3000/spicy-techs/')).toBe(true)
  })

  it('should handle empty arrays and null values correctly', () => {
    const payload: SharedBuildPayload = {
      f: 'atreides' as FactionLabel,
      state: [[[null]]] as MainBaseState,
      order: [],
      armory: [[null, null], [null, null], [null, null], [null, null], [null, null]],
      units: [null, null, null, null, null, null],
      councillors: [null, null],
      operations: [null, null, null, null, null],
      unitSlotCount: 2,
      panelVisibility: {
        mainBaseOpen: false,
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
        author: '',
        social: '',
        commentary: '',
        media: '',
      },
    }

    const encoded = encodeBuildPayload(payload)
    window.location.search = `?build=${encoded}`
    const decoded = decodeBuildPayload(window.location.search)

    expect(decoded).not.toBeNull()
    expect(decoded!.order).toEqual([])
    expect(decoded!.selectedDevelopments).toEqual([])
    expect(decoded!.units.every((u) => u === null)).toBe(true)
  })

  it('should preserve building dates if present', () => {
    const payload = createTestPayload()
    payload.buildingDates = { '0-0-0': 10, '0-0-1': 20 }

    const encoded = encodeBuildPayload(payload)
    window.location.search = `?build=${encoded}`
    const decoded = decodeBuildPayload(window.location.search)

    expect(decoded).not.toBeNull()
    expect(decoded!.buildingDates).toEqual(payload.buildingDates)
  })

  it('should preserve knowledge overrides if present', () => {
    const payload = createTestPayload()
    payload.developmentsKnowledge = { 'Dev_1': 15 }
    payload.knowledgeBase = 10

    const encoded = encodeBuildPayload(payload)
    window.location.search = `?build=${encoded}`
    const decoded = decodeBuildPayload(window.location.search)

    expect(decoded).not.toBeNull()
    expect(decoded!.developmentsKnowledge).toEqual(payload.developmentsKnowledge)
    expect(decoded!.knowledgeBase).toBe(10)
  })
})
