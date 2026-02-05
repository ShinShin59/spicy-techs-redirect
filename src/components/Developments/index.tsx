import { useMemo, useState } from "react"
import { useMainStore } from "@/store"
import { getDevelopmentsSlotPath, getHudImagePath } from "@/utils/assetPaths"
import { playDevelopmentsOpenSound, playDevelopmentsCloseSound } from "@/utils/sound"
import { totalCostOfOrder } from "@/utils/techCost"
import MonthEstimation from "@/components/MonthEstimation"
import { getLandstraadWindowPhrase } from "./developmentsCostUtils"
import { totalDaysOfOrder, type DevWithTierAndDomain } from "@/utils/knowledge"
import { useCurrentKnowledgeValue } from "@/hooks/useCurrentKnowledgeValue"
import PanelCorners from "@/components/PanelCorners"
import { PANEL_BORDER_HOVER_CLASS } from "@/components/shared/panelBorderHover"
import { usePanelHideOnRightClick } from "@/hooks/usePanelHideOnRightClick"
import DevelopmentsPicker from "./DevelopmentsPicker"
import developmentsData from "./developments.json"

const cellClass =
  "w-[64px] h-[64px] flex items-center justify-center overflow-hidden border border-zinc-700 text-white text-sm font-medium bg-cover bg-center"

/** Order: top-left, top-right, bottom-right, bottom-left (clockwise) → grid rows: [economic, military], [statecraft, green] */
const GRID_ORDER: (keyof import("@/store").DevelopmentsSummary)[] = [
  "economic",
  "military",
  "statecraft",
  "green",
]

const idToDev = new Map<string, DevWithTierAndDomain>(
  (developmentsData as { id: string; tier: number; domain: "economic" | "military" | "statecraft" | "green" }[]).map(
    (d) => [d.id, d]
  )
)

const Developments = () => {
  const developmentsSummary = useMainStore((s) => s.developmentsSummary)
  const selectedDevelopments = useMainStore((s) => s.selectedDevelopments)
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const mainBaseState = useMainStore((s) => s.mainBaseState)
  const developmentsKnowledge = useMainStore((s) => s.developmentsKnowledge)
  const knowledgeBase = useMainStore((s) => s.knowledgeBase)
  const buildingDates = useMainStore((s) => s.buildingDates)
  const [pickerOpen, setPickerOpen] = useState(false)
  const toggleDevelopments = useMainStore((s) => s.toggleDevelopments)
  const developmentsOpen = useMainStore((s) => s.panelVisibility.developmentsOpen)
  const panelRightClickHide = usePanelHideOnRightClick(toggleDevelopments, developmentsOpen)

  const currentKnowledgeValue = useCurrentKnowledgeValue()

  const totalCostAndDays = useMemo(() => {
    if (selectedDevelopments.length === 0) return null
    const cost = totalCostOfOrder(selectedDevelopments, idToDev)
    const days = Math.round(
      totalDaysOfOrder(selectedDevelopments, idToDev, {
        selectedFaction,
        mainBaseState,
        selectedDevelopments,
        developmentsKnowledge,
        knowledgeBase,
        buildingDates,
      })
    )
    return { cost, days }
  }, [selectedDevelopments, selectedFaction, mainBaseState, developmentsKnowledge, knowledgeBase, buildingDates])

  return (
    <div className="flex flex-col">
      <h2 className="text-xs font-mono font-bold text-white/70 uppercase m-0 ml-auto">
        Developments
      </h2>
      <button
        type="button"
        id="developments-grid"
        onClick={() => {
          playDevelopmentsOpenSound()
          setPickerOpen(true)
        }}
        className={`relative bg-zinc-900 w-[168px] gap-2 p-4 box-border overflow-hidden min-h-0 grid grid-cols-2 grid-rows-2 cursor-pointer text-left ${PANEL_BORDER_HOVER_CLASS}`}
        {...panelRightClickHide}
      >
        <PanelCorners />
        {GRID_ORDER.map((key) => {
          const value = developmentsSummary[key]
          return (
            <div
              key={key}
              className={cellClass}
              style={{ backgroundImage: `url(${getDevelopmentsSlotPath(key)})` }}
              data-panel-slot
            >
              <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {value}
              </span>
            </div>
          )
        })}
      </button>
      <div className="flex flex-col items-center pt-2 gap-1">
        <div className="flex items-center gap-2">
          <span
            className="tabular-nums text-[0.75rem]"
            style={{ color: "#D57E3B" }}
          >
            {currentKnowledgeValue}
          </span>
          <img
            src={getHudImagePath("ressources/knowledge.webp")}
            alt=""
            className="w-4 h-4 shrink-0"
            aria-hidden
          />
          <MonthEstimation totalDays={totalCostAndDays?.days ?? 0} />
        </div>
        {getLandstraadWindowPhrase(totalCostAndDays?.days ?? 0) && (
          <span className="text-[11px] text-zinc-500 tabular-nums">
            {getLandstraadWindowPhrase(totalCostAndDays?.days ?? 0)!}
          </span>
        )}
      </div>
      {pickerOpen && (
        <DevelopmentsPicker
          open={pickerOpen}
          onClose={() => {
            playDevelopmentsCloseSound()
            setPickerOpen(false)
          }}
        />
      )}
    </div>
  )
}

export default Developments
