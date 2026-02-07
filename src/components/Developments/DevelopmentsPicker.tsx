import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { useMainStore, type FactionLabel } from "@/store"
import { getDevelopmentSpriteStyle, getDevelopmentPickerAssetPath, getHudImagePath } from "@/utils/assetPaths"
import { useIsMobile, useIsPortrait } from "@/hooks/useMediaQuery"
import { playCancelSlotSound, playMenuToggleSound } from "@/utils/sound"
import DevelopmentDetailTooltip, {
  type DevelopmentEntry,
  type DevelopmentDomain,
} from "./DevelopmentDetailTooltip"
import { costToResearchNext, DEFAULT_KNOWLEDGE_PER_DAY } from "@/utils/techCost"
import { getMinimumPathOrder } from "./developmentsCostUtils"
import {
  getKnowledgeBreakdownForDev,
  totalDaysOfOrder,
  type DevWithTierAndDomain,
  type KnowledgeContext,
} from "@/utils/knowledge"
import KnowledgeBadge from "@/components/KnowledgeBadge"
import PanelCorners from "@/components/PanelCorners"
import OrderBadge from "@/components/OrderBadge"
import developmentsData from "./developments.json"

const CROSS_IMAGE = getDevelopmentPickerAssetPath("cross_section.webp")

/** Single source of truth for development node scale (px). All layout dimensions are derived from this. */
const DEV_SCALE = 56
const DEV_SCALE_MOBILE = 36
const DEV_SCALE_MIN = 24

/** Quadrant padding for content size calculation */
const QUADRANT_PADDING_X = 52
const QUADRANT_PADDING_X_FILL = 28
const QUADRANT_PADDING_Y_FILL = 24

function getDevLayout(scale: number) {
  return {
    nodeWidth: Math.round(scale * 2.15),
    nodeHeight: Math.round(scale * 1),
    frameSize: Math.round(scale * 0.55),
    iconInnerSize: Math.round(scale * 0.35),
    counterSize: Math.round(scale * 0.39),
    flagSize: Math.round(scale * 0.39),
    gapX: Math.round(scale * 0.21),
    gapY: Math.round(scale * 0.36),
    nodePaddingTop: Math.round(scale * 0.40),
    nodePaddingX: Math.round(scale * 0.09),
    nodePaddingBottom: Math.round(scale * 0.09),
    iconRaise: Math.round(scale * 0.27),
    flagTopOffset: -5,
  } as const
}

const DOMAIN_ORDER: DevelopmentDomain[] = ["economic", "military", "statecraft", "expansion"]

const DOMAIN_LABELS: Record<DevelopmentDomain, string> = {
  economic: "economic",
  military: "military",
  statecraft: "statecraft",
  expansion: "expansion",
}

/** Category color names for borders/backgrounds (match theme: economy, military, statecraft, expansion) */
const DOMAIN_BORDER_CLASS: Record<DevelopmentDomain, string> = {
  economic: "border-economy",
  military: "border-military",
  statecraft: "border-statecraft",
  expansion: "border-expansion",
}

/** Category text colors for titles */
const DOMAIN_TEXT_CLASS: Record<DevelopmentDomain, string> = {
  economic: "text-economy",
  military: "text-military",
  statecraft: "text-statecraft",
  expansion: "text-expansion",
}

const DOMAIN_BG_SELECTED_CLASS: Record<DevelopmentDomain, string> = {
  economic: "bg-economy",
  military: "bg-military",
  statecraft: "bg-statecraft",
  expansion: "bg-expansion",
}

/** Frame filename prefix per domain (expansion → expansion). */
const FRAME_PREFIX: Record<DevelopmentDomain, string> = {
  economic: "economic",
  military: "military",
  statecraft: "statecraft",
  expansion: "expansion",
}

/** Background image per quadrant (4 grid). */
const QUADRANT_BG_FILES: Record<DevelopmentDomain, string> = {
  economic: "bg__economic.webp",
  military: "bg__military.webp",
  statecraft: "bg__statecraft.webp",
  expansion: "bg__expansion.webp",
}

const DEV_SELECTED_CIRCLE_IMAGE = getDevelopmentPickerAssetPath("selectedCircle.webp")
/** Pattern used as background on selected developments (blended with domain color). */
const SELECTED_PATTERN_IMAGE = getDevelopmentPickerAssetPath("completed_pattern.webp")

/** Flag image filename per faction (faction-exclusive techs). */
const FACTION_FLAG_FILES: Record<FactionLabel, string> = {
  atreides: "flag__atreides.webp",
  corrino: "flag__corrino.webp",
  ecaz: "flag__ecaz.webp",
  smuggler: "flag__smuggler.webp",
  vernius: "flag__vernius.webp",
  fremen: "flag_fremen.webp",
  harkonnen: "flag_harkonnen.webp",
}

const allDevelopments = developmentsData as DevelopmentEntry[]

const idToDev = new Map<string, DevelopmentEntry>(allDevelopments.map((d) => [d.id, d]))

/** Effective prerequisite: own requires, or (if replaces another) the replaced node's requires */
function getEffectiveRequires(d: DevelopmentEntry): string | null {
  if (d.requires) return d.requires
  if (d.replaces) {
    const replaced = idToDev.get(d.replaces)
    return replaced?.requires ?? null
  }
  return null
}

function computeSummary(ids: string[]): { economic: number; military: number; expansion: number; statecraft: number } {
  const byDomain = { economic: 0, military: 0, expansion: 0, statecraft: 0 }
  const idToDomain = new Map<string, DevelopmentDomain>()
  allDevelopments.forEach((d) => idToDomain.set(d.id, d.domain))
  ids.forEach((id) => {
    const domain = idToDomain.get(id)
    if (domain && domain in byDomain) byDomain[domain]++
  })
  return byDomain
}

function filterByFaction(devs: DevelopmentEntry[], selectedFaction: FactionLabel): DevelopmentEntry[] {
  const replacedIds = new Set(
    devs.filter((d) => d.replaces && (d.faction as FactionLabel) === selectedFaction).map((d) => d.replaces!)
  )
  return devs.filter(
    (d) =>
      (!d.faction || (d.faction as FactionLabel) === selectedFaction) && !replacedIds.has(d.id)
  )
}

interface DevelopmentsPickerProps {
  open: boolean
  onClose: () => void
}

export default function DevelopmentsPicker({ open, onClose }: DevelopmentsPickerProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const isMobile = useIsMobile()
  const isPortrait = useIsPortrait()
  const isLandscape = isMobile && !isPortrait
  const [activeDomainIndex, setActiveDomainIndex] = useState(0)
  const selectedDevelopments = useMainStore((s) => s.selectedDevelopments)
  const setSelectedDevelopments = useMainStore((s) => s.setSelectedDevelopments)
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const mainBaseState = useMainStore((s) => s.mainBaseState)
  const developmentsKnowledge = useMainStore((s) => s.developmentsKnowledge)
  const setDevelopmentKnowledge = useMainStore((s) => s.setDevelopmentKnowledge)
  const clearDevelopmentKnowledge = useMainStore((s) => s.clearDevelopmentKnowledge)
  const knowledgeBase = useMainStore((s) => s.knowledgeBase)
  const buildingDates = useMainStore((s) => s.buildingDates)

  const [hoverTooltip, setHoverTooltip] = useState<{
    development: DevelopmentEntry
    x: number
    y: number
  } | null>(null)

  const filteredDevelopments = useMemo(
    () => filterByFaction(allDevelopments, selectedFaction),
    [selectedFaction]
  )

  const byDomain = useMemo(() => {
    const map: Record<DevelopmentDomain, DevelopmentEntry[]> = {
      economic: [],
      military: [],
      statecraft: [],
      expansion: [],
    }
    filteredDevelopments.forEach((d) => {
      if (map[d.domain]) map[d.domain].push(d)
    })
    DOMAIN_ORDER.forEach((domain) => {
      map[domain].sort((a, b) => a.tier - b.tier || a.gridX - b.gridX || a.gridY - b.gridY)
    })
    return map
  }, [filteredDevelopments])

  const selectedSet = useMemo(() => new Set(selectedDevelopments), [selectedDevelopments])

  /** Selected ids that cannot be deselected: direct prerequisites of others, or faction-exclusive techs that replace such a prerequisite */
  const cannotDeselectIds = useMemo(() => {
    const requiredBySelected = new Set<string>()
    selectedDevelopments.forEach((id) => {
      const dev = idToDev.get(id)
      if (dev == null) return
      const req = getEffectiveRequires(dev)
      if (req != null) requiredBySelected.add(req)
    })
    const set = new Set<string>(requiredBySelected)
    selectedDevelopments.forEach((id) => {
      const dev = idToDev.get(id)
      if (dev?.replaces != null && requiredBySelected.has(dev.replaces)) set.add(id)
    })
    return set
  }, [selectedDevelopments])

  /** Selected ids + ids that are replaced by a selected development (so "Foot In the Door" satisfies "IntelligenceNetwork" for prerequisites) */
  const satisfiedPrereqIds = useMemo(() => {
    const set = new Set(selectedDevelopments)
    selectedDevelopments.forEach((id) => {
      const dev = idToDev.get(id)
      if (dev?.replaces) set.add(dev.replaces)
    })
    return set
  }, [selectedDevelopments])

  const getOrderNumber = useCallback(
    (id: string): number | null => {
      const i = selectedDevelopments.indexOf(id)
      return i === -1 ? null : i + 1
    },
    [selectedDevelopments]
  )

  /** Cost in Knowledge for a dev: at its position in selection, or if added next. */
  const getCostForTooltip = useCallback(
    (d: DevelopmentEntry): { costKnowledge: number } => {
      const idx = selectedDevelopments.indexOf(d.id)
      const alreadyResearched = idx >= 0 ? selectedDevelopments.slice(0, idx) : selectedDevelopments
      const costKnowledge = costToResearchNext(d, alreadyResearched, idToDev)
      return { costKnowledge }
    },
    [selectedDevelopments]
  )

  const isAvailable = useCallback(
    (d: DevelopmentEntry): boolean => {
      const req = getEffectiveRequires(d)
      return req == null || satisfiedPrereqIds.has(req)
    },
    [satisfiedPrereqIds]
  )

  const handleSelect = useCallback(
    (d: DevelopmentEntry) => {
      if (!isAvailable(d) || selectedSet.has(d.id)) return
      playCancelSlotSound()
      const nextIds = [...selectedDevelopments, d.id]
      const lastId = selectedDevelopments[selectedDevelopments.length - 1] ?? null
      // Only set override when adding a dev that has a previous one (so next devs use this rate)
      if (lastId != null) {
        const lastKnowledge =
          developmentsKnowledge[lastId] != null
            ? developmentsKnowledge[lastId]!
            : (() => {
              const lastDev = idToDev.get(lastId)
              return lastDev != null
                ? getKnowledgeBreakdownForDev(lastId, lastDev.domain, {
                  selectedFaction,
                  mainBaseState,
                  selectedDevelopments,
                  developmentsKnowledge,
                  knowledgeBase,
                  buildingDates,
                }).computedWithoutOverride
                : knowledgeBase
            })()
        setDevelopmentKnowledge(d.id, lastKnowledge)
      }
      setSelectedDevelopments(nextIds, computeSummary(nextIds))
    },
    [
      selectedDevelopments,
      setSelectedDevelopments,
      setDevelopmentKnowledge,
      developmentsKnowledge,
      knowledgeBase,
      isAvailable,
      selectedSet,
      selectedFaction,
      mainBaseState,
      buildingDates,
    ]
  )

  const handleDeselect = useCallback(
    (d: DevelopmentEntry) => {
      if (!selectedSet.has(d.id) || cannotDeselectIds.has(d.id)) return
      playMenuToggleSound(false)
      const next = selectedDevelopments.filter((id) => id !== d.id)
      setSelectedDevelopments(next, computeSummary(next))
    },
    [selectedSet, selectedDevelopments, setSelectedDevelopments, cannotDeselectIds]
  )

  const handleResetDomain = useCallback(
    (domain: DevelopmentDomain) => {
      const next = selectedDevelopments.filter((id) => {
        const dev = idToDev.get(id)
        return dev == null || dev.domain !== domain
      })
      if (next.length === selectedDevelopments.length) return
      playMenuToggleSound(false)
      selectedDevelopments.forEach((id) => {
        const dev = idToDev.get(id)
        if (dev?.domain === domain) clearDevelopmentKnowledge(id)
      })
      setSelectedDevelopments(next, computeSummary(next))
    },
    [selectedDevelopments, setSelectedDevelopments, clearDevelopmentKnowledge]
  )

  const handleResetAll = useCallback(() => {
    if (selectedDevelopments.length === 0) return
    playMenuToggleSound(false)
    selectedDevelopments.forEach((id) => clearDevelopmentKnowledge(id))
    setSelectedDevelopments([], { economic: 0, military: 0, expansion: 0, statecraft: 0 })
  }, [selectedDevelopments, setSelectedDevelopments, clearDevelopmentKnowledge])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open, onClose])

  const goPrev = useCallback(() => {
    setActiveDomainIndex((i) => (i - 1 + 4) % 4)
  }, [])
  const goNext = useCallback(() => {
    setActiveDomainIndex((i) => (i + 1) % 4)
  }, [])

  const isScrollingProgrammatically = useRef(false)

  useEffect(() => {
    if (!isMobile || !open || !sliderRef.current) return
    const slide = slideRefs.current[activeDomainIndex]
    if (slide) {
      isScrollingProgrammatically.current = true
      slide.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" })
      const t = setTimeout(() => { isScrollingProgrammatically.current = false }, 50)
      return () => clearTimeout(t)
    }
  }, [isMobile, open, activeDomainIndex])

  useEffect(() => {
    if (!isMobile || !sliderRef.current) return
    const container = sliderRef.current
    const handleScroll = () => {
      if (isScrollingProgrammatically.current) return
      const containerWidth = container.offsetWidth
      const scrollLeft = container.scrollLeft
      const index = Math.round(scrollLeft / containerWidth)
      if (index >= 0 && index < 4) {
        setActiveDomainIndex(index)
      }
    }
    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [isMobile])

  if (!open) return null

  const knowledgeContext: KnowledgeContext = {
    selectedFaction,
    mainBaseState,
    selectedDevelopments,
    developmentsKnowledge,
    knowledgeBase,
    buildingDates,
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70" aria-hidden />
      <div
        ref={modalRef}
        className={`group/modal fixed z-50 flex bg-zinc-950 flex-col overflow-hidden shadow-2xl ${isMobile
          ? `inset-0 ${isLandscape ? "p-2" : "p-4"}`
          : "left-1/2 top-1/2 max-h-[90vh] w-max max-w-[95vw] -translate-x-1/2 -translate-y-1/2 rounded border border-zinc-700 p-6"
          }`}
      >
        {!isMobile && (
          <img src={CROSS_IMAGE} alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-50 z-0 object-center" />
        )}
        <PanelCorners />
        <button
          type="button"
          className={`absolute top-2 right-2 w-4 h-4 flex items-center justify-center text-lg grayscale cursor-pointer scale-50 z-20 opacity-0! transition-opacity group-hover/modal:opacity-75! hover:opacity-100!`}
          onClick={(e) => {
            e.stopPropagation()
            handleResetAll()
          }}
          aria-label="Reset all development trees"
          title="Reset all development trees"
        >
          ⛔
        </button>
        <div className={`flex flex-1 flex-col min-h-0 bg-zinc-950 ${isMobile ? (isLandscape ? "gap-1 overflow-visible" : "gap-2 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden") : "gap-6 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"}`}>
          {isMobile ? (
            <>
              <div className="flex items-center justify-between gap-2 shrink-0 w-full">
                <button
                  type="button"
                  onClick={goPrev}
                  className="shrink-0 p-1.5 rounded hover:bg-zinc-800 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                  aria-label="Previous domain"
                >
                  <img src={getHudImagePath("settings/left.webp")} alt="" width={16} height={16} />
                </button>
                <span
                  className={`font-medium text-sm capitalize min-w-[80px] text-center ${DOMAIN_TEXT_CLASS[DOMAIN_ORDER[activeDomainIndex]]}`}
                >
                  {DOMAIN_LABELS[DOMAIN_ORDER[activeDomainIndex]]}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={goNext}
                    className="shrink-0 p-1.5 rounded hover:bg-zinc-800 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                    aria-label="Next domain"
                  >
                    <img src={getHudImagePath("settings/right.webp")} alt="" width={16} height={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onClose()
                    }}
                    className="shrink-0 p-1.5 rounded bg-transparent text-[#a67c00] hover:bg-black/20 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                    aria-label="Close development picker"
                    title="Close"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div
                ref={sliderRef}
                className={`flex overflow-x-auto snap-x snap-mandatory flex-1 min-h-0 [-webkit-overflow-scrolling:touch] [touch-action:pan-x] ${isLandscape ? "gap-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "gap-4 -mx-2 px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-contain"}`}
              >
                {DOMAIN_ORDER.map((domain, index) => (
                  <div
                    key={domain}
                    ref={(el) => { slideRefs.current[index] = el }}
                    className={`snap-center shrink-0 w-full min-w-full flex flex-col min-h-0 [-webkit-overflow-scrolling:touch] ${isLandscape ? "overflow-hidden [touch-action:pan-x]" : "overflow-auto [touch-action:pan-y] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-contain"}`}
                  >
                    <Quadrant
                      domain={domain}
                      developments={byDomain[domain]}
                      selectedSet={selectedSet}
                      selectedDevelopments={selectedDevelopments}
                      lastSelectedId={selectedDevelopments[selectedDevelopments.length - 1] ?? null}
                      cannotDeselectIds={cannotDeselectIds}
                      isAvailable={isAvailable}
                      getOrderNumber={getOrderNumber}
                      onSelect={handleSelect}
                      onDeselect={handleDeselect}
                      onResetDomain={() => handleResetDomain(domain)}
                      onHover={setHoverTooltip}
                      knowledgeContext={knowledgeContext}
                      setDevelopmentKnowledge={setDevelopmentKnowledge}
                      totalDaysOfOrder={totalDaysOfOrder}
                      compact={isMobile}
                      fillSpace={isMobile && !isPortrait}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-6">
                <Quadrant
                  domain="economic"
                  developments={byDomain.economic}
                  selectedSet={selectedSet}
                  selectedDevelopments={selectedDevelopments}
                  lastSelectedId={selectedDevelopments[selectedDevelopments.length - 1] ?? null}
                  cannotDeselectIds={cannotDeselectIds}
                  isAvailable={isAvailable}
                  getOrderNumber={getOrderNumber}
                  onSelect={handleSelect}
                  onDeselect={handleDeselect}
                  onResetDomain={() => handleResetDomain("economic")}
                  onHover={setHoverTooltip}
                  knowledgeContext={knowledgeContext}
                  setDevelopmentKnowledge={setDevelopmentKnowledge}
                  totalDaysOfOrder={totalDaysOfOrder}
                />
                <Quadrant
                  domain="military"
                  developments={byDomain.military}
                  selectedSet={selectedSet}
                  selectedDevelopments={selectedDevelopments}
                  lastSelectedId={selectedDevelopments[selectedDevelopments.length - 1] ?? null}
                  cannotDeselectIds={cannotDeselectIds}
                  isAvailable={isAvailable}
                  getOrderNumber={getOrderNumber}
                  onSelect={handleSelect}
                  onDeselect={handleDeselect}
                  onResetDomain={() => handleResetDomain("military")}
                  onHover={setHoverTooltip}
                  knowledgeContext={knowledgeContext}
                  setDevelopmentKnowledge={setDevelopmentKnowledge}
                  totalDaysOfOrder={totalDaysOfOrder}
                />
              </div>
              <div className="flex gap-6">
                <Quadrant
                  domain="statecraft"
                  developments={byDomain.statecraft}
                  selectedSet={selectedSet}
                  selectedDevelopments={selectedDevelopments}
                  lastSelectedId={selectedDevelopments[selectedDevelopments.length - 1] ?? null}
                  cannotDeselectIds={cannotDeselectIds}
                  isAvailable={isAvailable}
                  getOrderNumber={getOrderNumber}
                  onSelect={handleSelect}
                  onDeselect={handleDeselect}
                  onResetDomain={() => handleResetDomain("statecraft")}
                  onHover={setHoverTooltip}
                  knowledgeContext={knowledgeContext}
                  setDevelopmentKnowledge={setDevelopmentKnowledge}
                  totalDaysOfOrder={totalDaysOfOrder}
                />
                <Quadrant
                  domain="expansion"
                  developments={byDomain.expansion}
                  selectedSet={selectedSet}
                  selectedDevelopments={selectedDevelopments}
                  lastSelectedId={selectedDevelopments[selectedDevelopments.length - 1] ?? null}
                  cannotDeselectIds={cannotDeselectIds}
                  isAvailable={isAvailable}
                  getOrderNumber={getOrderNumber}
                  onSelect={handleSelect}
                  onDeselect={handleDeselect}
                  onResetDomain={() => handleResetDomain("expansion")}
                  onHover={setHoverTooltip}
                  knowledgeContext={knowledgeContext}
                  setDevelopmentKnowledge={setDevelopmentKnowledge}
                  totalDaysOfOrder={totalDaysOfOrder}
                />
              </div>
            </>
          )}
        </div>
      </div>
      {open && isMobile && isPortrait && (
        <div
          className="fixed bottom-24 left-1/2 z-60 -translate-x-1/2 rounded- bg-zinc-800/95 px-4 py-2 text-sm text-white shadow-lg animate-toast-fade-in text-center"
          role="status"
          aria-live="polite"
        >
          Prefer landscape mode to view developments
        </div>
      )}
      {hoverTooltip && (() => {
        const dev = hoverTooltip.development
        const idx = selectedDevelopments.indexOf(dev.id)
        // For unselected devs, show cumulative total including unselected prerequisites (deep devs)
        const orderForTotal =
          idx >= 0
            ? selectedDevelopments
            : [
              ...selectedDevelopments,
              ...getMinimumPathOrder(dev.id).filter((id) => !selectedSet.has(id)),
              dev.id,
            ]
        const devIdx = orderForTotal.indexOf(dev.id)
        const referenceDay =
          devIdx > 0
            ? Math.round(
              totalDaysOfOrder(
                orderForTotal.slice(0, devIdx),
                idToDev as unknown as Map<string, DevWithTierAndDomain>,
                knowledgeContext
              )
            )
            : 0
        const previousDevId = devIdx > 0 ? orderForTotal[devIdx - 1]! : null
        const previousDev = previousDevId != null ? idToDev.get(previousDevId) : null
        const previousDevReferenceDay =
          devIdx > 1
            ? Math.round(
              totalDaysOfOrder(
                orderForTotal.slice(0, devIdx - 1),
                idToDev as unknown as Map<string, DevWithTierAndDomain>,
                knowledgeContext
              )
            )
            : 0
        const previousDevComputedRate =
          previousDev != null
            ? getKnowledgeBreakdownForDev(previousDevId!, previousDev.domain, knowledgeContext, {
              referenceDay: previousDevReferenceDay,
            }).computedWithoutOverride
            : undefined
        const knowledgeBreakdown = getKnowledgeBreakdownForDev(dev.id, dev.domain, knowledgeContext, {
          previousDevId,
          previousDevComputedRate,
          referenceDay,
        })
        const { costKnowledge } = getCostForTooltip(dev)
        const daysToCompleteThisDev =
          referenceDay +
          Math.round(costKnowledge / (knowledgeBreakdown.effective || DEFAULT_KNOWLEDGE_PER_DAY))
        return (
          <DevelopmentDetailTooltip
            development={dev}
            followCursor={{ x: hoverTooltip.x, y: hoverTooltip.y }}
            costKnowledge={costKnowledge}
            knowledgeBreakdown={knowledgeBreakdown}
            daysToCompleteThisDev={daysToCompleteThisDev}
          />
        )
      })()}
    </>
  )
}

const RESET_BUTTON_CLASS =
  "absolute top-2 right-2 w-4 h-4 flex items-center justify-center text-lg grayscale cursor-pointer scale-50"

interface QuadrantProps {
  domain: DevelopmentDomain
  developments: DevelopmentEntry[]
  selectedSet: Set<string>
  selectedDevelopments: string[]
  lastSelectedId: string | null
  cannotDeselectIds: Set<string>
  isAvailable: (d: DevelopmentEntry) => boolean
  getOrderNumber: (id: string) => number | null
  onSelect: (d: DevelopmentEntry) => void
  onDeselect: (d: DevelopmentEntry) => void
  onResetDomain: () => void
  onHover: React.Dispatch<React.SetStateAction<{ development: DevelopmentEntry; x: number; y: number } | null>>
  knowledgeContext: KnowledgeContext
  setDevelopmentKnowledge: (id: string, value: number) => void
  totalDaysOfOrder: (
    orderedIds: string[],
    idToDev: Map<string, DevWithTierAndDomain>,
    ctx: KnowledgeContext
  ) => number
  /** Use smaller nodes on mobile to reduce overflow */
  compact?: boolean
  /** When true, fill available width and adapt node scale to container (mobile landscape) */
  fillSpace?: boolean
}

/** Compute scale so grid fits in availableWidth and availableHeight. */
function scaleFromAvailableSize(
  availableWidth: number,
  availableHeight: number,
  cols: number,
  rows: number
): number {
  if (cols <= 0 || rows <= 0) return DEV_SCALE_MOBILE
  const widthDenom = cols * 2.15 + (cols - 1) * 0.21
  const heightDenom = rows * 1 + (rows - 1) * 0.36
  const scaleFromWidth = availableWidth / widthDenom
  const scaleFromHeight = availableHeight / heightDenom
  const scale = Math.min(scaleFromWidth, scaleFromHeight)
  return Math.round(Math.max(DEV_SCALE_MIN, Math.min(DEV_SCALE, scale)))
}

function Quadrant({
  domain,
  developments,
  selectedSet,
  selectedDevelopments,
  lastSelectedId,
  cannotDeselectIds,
  isAvailable,
  getOrderNumber,
  onSelect,
  onDeselect,
  onResetDomain,
  onHover,
  knowledgeContext,
  setDevelopmentKnowledge,
  totalDaysOfOrder,
  compact = false,
  fillSpace = false,
}: QuadrantProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [adaptiveScale, setAdaptiveScale] = useState<number | null>(null)

  const maxX = useMemo(
    () => (developments.length ? Math.max(...developments.map((d) => d.gridX)) : 0),
    [developments]
  )
  const maxY = useMemo(
    () => (developments.length ? Math.max(...developments.map((d) => d.gridY)) : 0),
    [developments]
  )
  const cols = maxX + 1
  const rows = maxY + 1

  const effectiveScale =
    fillSpace && adaptiveScale != null ? adaptiveScale : compact ? DEV_SCALE_MOBILE : DEV_SCALE
  const layout = useMemo(() => getDevLayout(effectiveScale), [effectiveScale])
  const gridContentWidth = cols * layout.nodeWidth + (cols - 1) * layout.gapX

  useEffect(() => {
    if (!fillSpace || !containerRef.current) return
    const el = containerRef.current
    const updateScale = () => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      const paddingX = fillSpace ? QUADRANT_PADDING_X_FILL : QUADRANT_PADDING_X
      const availableW = Math.max(0, w - paddingX)
      const availableH = fillSpace ? Math.max(0, h - QUADRANT_PADDING_Y_FILL) : Infinity
      setAdaptiveScale(scaleFromAvailableSize(availableW, availableH, cols, rows))
    }
    updateScale()
    const ro = new ResizeObserver(updateScale)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fillSpace, cols, rows])

  const nodeState = (d: DevelopmentEntry): "locked" | "available" | "selected" => {
    if (selectedSet.has(d.id)) return "selected"
    return isAvailable(d) ? "available" : "locked"
  }

  /** Unselected: light dark bg + category border. Selected: category bg. Locked: no hover. No outline/ring. */
  const getNodeClasses = (d: DevelopmentEntry, state: "locked" | "available" | "selected") => {
    const border = DOMAIN_BORDER_CLASS[d.domain]
    const base = "rounded border transition-colors flex flex-col items-center justify-start outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 box-border"
    if (state === "selected") {
      const cannotDeselect = cannotDeselectIds.has(d.id)
      return `${base} ${border} ${DOMAIN_BG_SELECTED_CLASS[d.domain]} ring-2 ring-black ring-inset ${cannotDeselect ? "cursor-not-allowed" : "cursor-pointer"} text-white`
    }
    if (state === "locked") {
      return `${base} ${border} bg-zinc-950 cursor-not-allowed`
    }
    return `${base} ${border} bg-zinc-950 cursor-pointer`
  }

  const getFrameImage = (domain: DevelopmentDomain, selected: boolean) =>
    getDevelopmentPickerAssetPath(`frame_${FRAME_PREFIX[domain]}_${selected}.webp`)

  const quadrantBg = getDevelopmentPickerAssetPath(QUADRANT_BG_FILES[domain])

  return (
    <div
      ref={containerRef}
      className={`group/quadrant relative min-h-[140px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-contain [-webkit-overflow-scrolling:touch] bg-zinc-900/80 border border-transparent rounded-lg ${fillSpace ? "w-full min-w-0 flex-1 min-h-0 overflow-hidden pl-3 pr-4 pt-3 pb-3 flex flex-col justify-center" : "w-max min-w-0 overflow-auto pl-5 pr-8 pt-5 pb-5"}`}
    >
      <button
        type="button"
        className={`${RESET_BUTTON_CLASS} z-20 opacity-0! transition-opacity group-hover/quadrant:opacity-75! hover:opacity-100!`}
        onClick={(e) => {
          e.stopPropagation()
          onResetDomain()
        }}
        aria-label={`Reset ${DOMAIN_LABELS[domain]} tree`}
        title={`Reset ${DOMAIN_LABELS[domain]} tree`}
      >
        ⛔
      </button>
      {/* Domain grid background as filigree at 50% opacity */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-10 border border-transparent rounded-lg"
        style={{ backgroundImage: `url(${quadrantBg})` }}
        aria-hidden
      />
      <div
        className={`relative z-10 grid ${fillSpace ? "mx-auto" : ""}`}
        style={{
          width: gridContentWidth,
          gridTemplateColumns: `repeat(${cols}, ${layout.nodeWidth}px)`,
          gridTemplateRows: `repeat(${rows}, ${layout.nodeHeight}px)`,
          gap: `${layout.gapY}px ${layout.gapX}px`,
        }}
      >
        {developments.map((d) => {
          const state = nodeState(d)
          const orderNumber = getOrderNumber(d.id)
          const spriteStyle = getDevelopmentSpriteStyle(d.gfx)
          const frameImage = getFrameImage(d.domain, state === "selected")
          const idx = selectedDevelopments.indexOf(d.id)
          const referenceDay =
            idx > 0
              ? Math.round(
                totalDaysOfOrder(
                  selectedDevelopments.slice(0, idx),
                  idToDev as unknown as Map<string, DevWithTierAndDomain>,
                  knowledgeContext
                )
              )
              : 0
          const previousDevId = idx >= 0 ? (selectedDevelopments[idx - 1] ?? null) : null
          const previousDev = previousDevId != null ? idToDev.get(previousDevId) : null
          const previousDevReferenceDay =
            idx > 1
              ? Math.round(
                totalDaysOfOrder(
                  selectedDevelopments.slice(0, idx - 1),
                  idToDev as unknown as Map<string, DevWithTierAndDomain>,
                  knowledgeContext
                )
              )
              : 0
          const previousDevComputedRate =
            previousDev != null
              ? getKnowledgeBreakdownForDev(previousDevId!, previousDev.domain, knowledgeContext, {
                referenceDay: previousDevReferenceDay,
              }).computedWithoutOverride
              : undefined
          const knowledgeBreakdown =
            state === "selected"
              ? getKnowledgeBreakdownForDev(d.id, d.domain, knowledgeContext, {
                previousDevId,
                previousDevComputedRate,
                referenceDay,
              })
              : null
          return (
            <div
              key={d.id}
              className={`relative group ${getNodeClasses(d, state)}`}
              style={{
                gridColumn: d.gridX + 1,
                gridRow: d.gridY + 1,
                width: layout.nodeWidth,
                height: layout.nodeHeight,
                paddingTop: layout.nodePaddingTop,
                paddingLeft: layout.nodePaddingX,
                paddingRight: layout.nodePaddingX,
                paddingBottom: layout.nodePaddingBottom,
              }}
              onClick={(e) => {
                if (e.button !== 0) return
                if (state === "locked") return
                onSelect(d)
              }}
              onContextMenu={(e) => {
                e.preventDefault()
                onDeselect(d)
              }}
              onMouseEnter={(e) => {
                onHover({ development: d, x: e.clientX, y: e.clientY })
              }}
              onMouseMove={(e) => {
                onHover((prev) =>
                  prev && prev.development.id === d.id ? { ...prev, x: e.clientX, y: e.clientY } : prev
                )
              }}
              onMouseLeave={() => onHover(null)}
            >
              {/* Pattern overlay: selected devs always; unselected only if faction-exclusive */}
              {(state === "selected" || d.faction) && (
                <div
                  className="absolute inset-0 pointer-events-none z-0"
                  style={{
                    backgroundImage: `url(${SELECTED_PATTERN_IMAGE})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "repeat",
                  }}
                  aria-hidden
                />
              )}
              {/* Selected gradient overlay: soft black to transparent top-to-bottom, above pattern but below icon */}
              {state === "selected" && (
                <div
                  className="absolute inset-0 pointer-events-none z-0"
                  style={{
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)",
                  }}
                  aria-hidden
                />
              )}
              {/* Faction flag: top-left, ~10% from left, a tad higher */}
              {d.faction && FACTION_FLAG_FILES[d.faction as FactionLabel] && (
                <div
                  className="absolute left-[10%] z-10 bg-contain bg-center bg-no-repeat pointer-events-none"
                  style={{
                    top: layout.flagTopOffset,
                    width: layout.flagSize,
                    height: layout.flagSize,
                    backgroundImage: `url(${getDevelopmentPickerAssetPath(FACTION_FLAG_FILES[d.faction as FactionLabel])})`,
                  }}
                />
              )}
              {/* Icon + frame: always centered horizontally (left 50% + translate -50%), raised; z-10 so above gradient */}
              <div
                className="absolute top-0 z-10 flex items-center justify-center bg-contain bg-center bg-no-repeat shrink-0 pointer-events-none"
                style={{
                  left: "50%",
                  width: layout.frameSize,
                  height: layout.frameSize,
                  transform: `translate(-50%, -${layout.iconRaise}px)`,
                  backgroundImage: `url(${frameImage})`,
                }}
              >
                {spriteStyle && d.gfx && (
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full" aria-hidden>
                    <div
                      className="shrink-0 bg-no-repeat"
                      style={{
                        ...spriteStyle,
                        width: d.gfx.size,
                        height: d.gfx.size,
                        transform: `translate(-50%, -50%) scale(${layout.iconInnerSize / d.gfx.size})`,
                        transformOrigin: "center center",
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                      }}
                    />
                  </div>
                )}
              </div>
              {/* Light white animated radial glow around the icon container (last selected only) */}
              {state === "selected" && d.id === lastSelectedId && (
                <div
                  className="absolute top-0 left-1/2 pointer-events-none rounded-full flex items-center justify-center"
                  style={{
                    width: layout.frameSize * 1.8,
                    height: layout.frameSize * 1.8,
                    transform: `translate(-50%, -${layout.iconRaise}px)`,
                    zIndex: 0,
                  }}
                >
                  <div
                    className="dev-last-selected-glow w-full h-full rounded-full"
                    style={{
                      background: "radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 40%, transparent 70%)",
                    }}
                  />
                </div>
              )}
              {/* Selected circle overlay on icon for the last selected tech */}
              {state === "selected" && d.id === lastSelectedId && (
                <div
                  className="absolute top-0 flex items-center justify-center bg-contain bg-center bg-no-repeat shrink-0 pointer-events-none z-10"
                  style={{
                    left: "50%",
                    width: layout.frameSize,
                    height: layout.frameSize,
                    transform: `translate(-50%, -${layout.iconRaise}px)`,
                    backgroundImage: `url(${DEV_SELECTED_CIRCLE_IMAGE})`,
                  }}
                />
              )}
              {/* Order badge: shared with Main Base (OrderBadge display-only, compact in picker) */}
              {orderNumber !== null && <OrderBadge orderNumber={orderNumber} compact />}
              {state === "selected" && orderNumber === null && <OrderBadge compact>✓</OrderBadge>}
              {/* Knowledge badge: this dev's value (used for NEXT devs' days). Only last selected is visible & editable. */}
              {state === "selected" && d.id === lastSelectedId && knowledgeBreakdown && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <KnowledgeBadge
                    value={Math.round(
                      Math.max(
                        5,
                        Math.min(50, knowledgeBreakdown.override ?? knowledgeBreakdown.computedWithoutOverride)
                      )
                    )}
                    breakdown={knowledgeBreakdown}
                    onIncrement={
                      d.id === lastSelectedId
                        ? () =>
                          setDevelopmentKnowledge(
                            d.id,
                            (knowledgeBreakdown.override ?? knowledgeBreakdown.computedWithoutOverride) + 1
                          )
                        : undefined
                    }
                    onDecrement={
                      d.id === lastSelectedId
                        ? () =>
                          setDevelopmentKnowledge(
                            d.id,
                            (knowledgeBreakdown.override ?? knowledgeBreakdown.computedWithoutOverride) - 1
                          )
                        : undefined
                    }
                  />
                </div>
              )}
              <span
                className={`text-center pb-1 w-4/5 leading-tight line-clamp-2 overflow-hidden ${compact ? "text-[0.45rem]" : "text-xs"} ${state === "selected" ? "text-white" : "text-zinc-200"}`}
              >
                {d.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

