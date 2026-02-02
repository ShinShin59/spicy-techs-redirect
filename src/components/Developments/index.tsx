import { useState } from "react"
import { useMainStore } from "@/store"
import { getDevelopmentsSlotPath } from "@/utils/assetPaths"
import { playDevelopmentsOpenSound, playDevelopmentsCloseSound } from "@/utils/sound"
import PanelCorners from "@/components/PanelCorners"
import { PANEL_BORDER_HOVER_CLASS } from "@/components/shared/panelBorderHover"
import DevelopmentsPicker from "./DevelopmentsPicker"

const cellClass =
  "w-[64px] h-[64px] flex items-center justify-center overflow-hidden border border-zinc-700 text-white text-sm font-medium bg-cover bg-center"

/** Order: top-left, top-right, bottom-right, bottom-left (clockwise) → grid rows: [economic, military], [statecraft, green] */
const GRID_ORDER: (keyof import("@/store").DevelopmentsSummary)[] = [
  "economic",
  "military",
  "statecraft",
  "green",
]

const Developments = () => {
  const developmentsSummary = useMainStore((s) => s.developmentsSummary)
  const [pickerOpen, setPickerOpen] = useState(false)

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
        className={`relative bg-zinc-900 w-[168px] gap-2 p-4 box-border overflow-y-auto min-h-0 grid grid-cols-2 grid-rows-2 cursor-pointer text-left ${PANEL_BORDER_HOVER_CLASS}`}
      >
        <PanelCorners />
        {GRID_ORDER.map((key) => {
          const value = developmentsSummary[key]
          return (
            <div
              key={key}
              className={cellClass}
              style={{ backgroundImage: `url(${getDevelopmentsSlotPath(key)})` }}
            >
              <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {value}
              </span>
            </div>
          )
        })}
      </button>
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
