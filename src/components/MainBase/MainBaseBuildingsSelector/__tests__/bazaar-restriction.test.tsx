/**
 * Test for Bazaar building restriction in Sietch (main base #2 for Fremen)
 * 
 * Tests that the Bazaar building cannot be added to the Sietch (base index 1)
 * for Fremen faction, but can be added to the Main Base (base index 0).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MainBaseBuildingsSelector from '../index'
import mainBuildingsData from '../main-buildings.json'

// Mock the store hook
const mockUseMainStore = vi.fn()
vi.mock('@/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store')>()
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useMainStore: (selector: any) => mockUseMainStore(selector),
  }
})

describe('MainBaseBuildingsSelector - Bazaar Restriction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock: return 'fremen' for selectedFaction selector
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseMainStore.mockImplementation((selector: any) => {
      const selectorStr = selector.toString()
      if (selectorStr.includes('selectedFaction')) {
        return 'fremen'
      }
      return undefined
    })
  })

  it('should exclude Bazaar from available buildings when Fremen is selected and base index is 1 (Sietch)', () => {
    const mockOnClose = vi.fn()
    const mockOnSelect = vi.fn()
    const anchorPosition = { x: 0, y: 0 }

    render(
      <MainBaseBuildingsSelector
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        usedBuildingNames={[]}
        anchorPosition={anchorPosition}
        selectedMainBaseIndex={1} // Sietch (base #2)
      />
    )

    // Bazaar should not be in the available buildings
    const bazaarButton = screen.queryByAltText('Bazaar')
    expect(bazaarButton).toBeNull()
  })

  it('should include Bazaar in available buildings when Fremen is selected and base index is 0 (Main Base)', () => {
    const mockOnClose = vi.fn()
    const mockOnSelect = vi.fn()
    const anchorPosition = { x: 0, y: 0 }

    render(
      <MainBaseBuildingsSelector
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        usedBuildingNames={[]}
        anchorPosition={anchorPosition}
        selectedMainBaseIndex={0} // Main Base (base #1)
      />
    )

    // Bazaar should be available in Main Base
    const bazaarButton = screen.queryByAltText('Bazaar')
    expect(bazaarButton).not.toBeNull()
  })

  it('should not interfere with other faction restrictions', () => {
    // Mock store to return Atreides faction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseMainStore.mockImplementation((selector: any) => {
      const selectorStr = selector.toString()
      if (selectorStr.includes('selectedFaction')) {
        return 'atreides'
      }
      return undefined
    })

    const mockOnClose = vi.fn()
    const mockOnSelect = vi.fn()
    const anchorPosition = { x: 0, y: 0 }

    render(
      <MainBaseBuildingsSelector
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        usedBuildingNames={[]}
        anchorPosition={anchorPosition}
        selectedMainBaseIndex={1}
      />
    )

    // Bazaar should not be available for non-Fremen factions (onlyForFaction: "fremen")
    // This test verifies the restriction logic doesn't break existing faction filtering
    const bazaarButton = screen.queryByAltText('Bazaar')
    expect(bazaarButton).toBeNull() // Not available for Atreides due to onlyForFaction
  })

  it('should verify Bazaar exists in buildings data and has correct properties', () => {
    const bazaar = mainBuildingsData.find((b) => b.name === 'Bazaar')
    expect(bazaar).toBeDefined()
    expect(bazaar?.onlyForFaction).toBe('fremen')
    expect(bazaar?.category).toBe('Statecraft')
  })
})
