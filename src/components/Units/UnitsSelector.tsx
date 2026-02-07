import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useMainStore, useCurrentArmoryState } from "@/store"
import { getUnitIconPath, getHudImagePath } from "@/utils/assetPaths"
import { getEffectiveUnitCpCost } from "@/components/Armory/armory-utils"
import { getUnitsForFaction, type UnitData } from "./units-utils"
import {
  getHeroesForFaction,
  getHeroIconPath,
  type HeroData,
} from "./heroes-utils"
import UnitTooltip from "./UnitTooltip"
import { useIsMobile } from "@/hooks/useMediaQuery"

interface AnchorPosition {
  x: number
  y: number
}

export interface UnitsSelectorProps {
  onClose: () => void
  onSelect: (unitId: string | null) => void
  anchorPosition: AnchorPosition
  /** When true, popup top aligns with anchor y (opens below); when false, popup bottom aligns with anchor y (opens above). */
  anchorBelow?: boolean
  heroOnly?: boolean
  /** When adding units: remaining CP budget (65 - totalCP). Units with cpCost > this are disabled. */
  remainingCP?: number
}

const UnitsSelector = ({
  onClose,
  onSelect,
  anchorPosition,
  anchorBelow = false,
  heroOnly = false,
  remainingCP,
}: UnitsSelectorProps) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const armoryState = useCurrentArmoryState()
  const [pulseUnitId, setPulseUnitId] = useState<string | null>(null)
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleUnitClick = useCallback(
    (unitId: string, disabled: boolean) => {
      if (disabled) return
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current)
      setPulseUnitId(unitId)
      onSelect(unitId)
      pulseTimeoutRef.current = setTimeout(() => {
        setPulseUnitId(null)
        pulseTimeoutRef.current = null
      }, 220)
    },
    [onSelect]
  )

  const [hoverTooltip, setHoverTooltip] = useState<{
    unit: UnitData | HeroData
    anchorRect: { left: number; top: number; width: number; height: number }
  } | null>(null)

  // Close on outside click (allows click to propagate to other elements)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  useEffect(() => () => {
    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current)
  }, [])

  // Get available units or heroes for current faction
  const units = useMemo(
    () =>
      heroOnly
        ? getHeroesForFaction(selectedFaction)
        : getUnitsForFaction(selectedFaction),
    [selectedFaction, heroOnly]
  )

  // Position: mobile => centered; else anchorBelow => popup top at y (opens below); else popup bottom at y (opens above)
  const popupStyle = useMemo<React.CSSProperties>(
    () => {
      if (isMobile) {
        return {
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          maxWidth: "calc(100vw - 2rem)",
          maxHeight: "calc(100vh - 4rem)",
        }
      }
      return {
        position: "fixed",
        left: anchorPosition.x,
        ...(anchorBelow
          ? { top: anchorPosition.y }
          : { bottom: window.innerHeight - anchorPosition.y }),
      }
    },
    [anchorPosition.x, anchorPosition.y, anchorBelow, isMobile]
  )

  // Match Units panel: 64px slots, slot/hero bg; icon fills slot
  const slotBgUrl = heroOnly ? getHudImagePath("background_hero.webp") : null

  return (
    <>
      {/* Modal content */}
      <div
        ref={modalRef}
        className={`z-50 bg-zinc-900 border border-zinc-700 flex flex-col p-2 ${isMobile ? "overflow-auto" : ""}`}
        style={popupStyle}
      >

        {/* Units/Heroes grid - same slot style and size as Units panel */}
        <div className={`flex gap-2 flex-wrap ${isMobile ? "justify-center" : ""}`}>
          {units.map((unit) => {
            const effectiveCost = !heroOnly ? getEffectiveUnitCpCost(selectedFaction, unit.id, armoryState) : 0
            const overBudget = remainingCP != null && effectiveCost > remainingCP
            const disabled = !heroOnly && overBudget
            const unitForTooltip = !heroOnly ? { ...unit, cpCost: effectiveCost } : unit
            return (
              <div
                key={unit.id}
                className="shrink-0 flex items-center justify-center overflow-hidden"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setHoverTooltip({
                    unit: unitForTooltip,
                    anchorRect: {
                      left: rect.left,
                      top: rect.top,
                      width: rect.width,
                      height: rect.height,
                    },
                  })
                }}
                onMouseLeave={() => setHoverTooltip(null)}
              >
                <button
                  type="button"
                  onClick={() => handleUnitClick(unit.id, disabled)}
                  disabled={disabled}
                  className={`flex items-center ${isMobile ? "w-12 h-12" : "w-16 h-16"} justify-center bg-cover bg-center ${slotBgUrl ? "" : ""} ${disabled
                    ? "opacity-50 cursor-not-allowed grayscale"
                    : "hover:brightness-110 cursor-pointer"
                    }`}
                  style={slotBgUrl ? { backgroundImage: `url(${slotBgUrl})` } : undefined}
                >
                  <img
                    src={
                      heroOnly
                        ? getHeroIconPath(selectedFaction, (unit as HeroData).imageName)
                        : getUnitIconPath(selectedFaction, (unit as UnitData).name)
                    }
                    alt={unit.name}
                    loading="eager"
                    decoding="async"
                    className={`w-full h-full object-contain ${pulseUnitId === unit.id ? "unit-select-pulse" : ""}`}
                  />
                </button>
              </div>
            )
          })}
        </div>

      </div>

      {/* Hover tooltip */}
      {hoverTooltip && (
        <UnitTooltip
          unit={hoverTooltip.unit}
          anchorRect={hoverTooltip.anchorRect}
        />
      )}
    </>
  )
}

export default UnitsSelector
