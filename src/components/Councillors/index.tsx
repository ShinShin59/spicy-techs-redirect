import { useState } from "react"
import { useMainStore, useCurrentCouncillorSlots } from "@/store"
import { getCouncillorIconPath } from "@/utils/assetPaths"
import { playSelectionSound } from "@/utils/sound"
import { usePanelTooltip } from "@/hooks/usePanelTooltip"
import { getCouncillorById, type CouncillorData } from "./councillors-utils"
import CouncillorsSelector from "./CouncillorsSelector"
import CouncillorTooltip from "./CouncillorTooltip"
import PanelCorners from "@/components/PanelCorners"

interface AnchorPosition {
  x: number
  y: number
}

const cellClass =
  "w-[64px] h-[64px] flex items-center justify-center overflow-hidden border border-zinc-700 text-white text-xs font-medium"

const Councillors = () => {
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const councillorSlots = useCurrentCouncillorSlots()
  const toggleCouncillor = useMainStore((s) => s.toggleCouncillor)

  const [selectorOpen, setSelectorOpen] = useState(false)
  const [anchorPosition, setAnchorPosition] = useState<AnchorPosition | null>(null)
  const [hoverTooltip, setHoverTooltip, showTooltip] = usePanelTooltip<{
    councillor: CouncillorData
    anchorRect: { left: number; top: number; width: number; height: number }
  }>(selectorOpen)

  const selectedIds = councillorSlots.filter(Boolean) as string[]

  const handleSlotClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setAnchorPosition({ x: rect.left, y: rect.top })
    setSelectorOpen(true)
  }

  const handleSelect = (councillorId: string) => {
    const isAdding = !selectedIds.includes(councillorId)
    if (isAdding) playSelectionSound()
    toggleCouncillor(councillorId)
  }

  const handleCloseSelector = () => {
    setSelectorOpen(false)
    setAnchorPosition(null)
  }

  return (
    <>
      <div className="flex flex-col">
        <h2 className="text-xs font-mono font-bold text-white/70 uppercase m-0 ml-auto">
          Councillors
        </h2>
        <div
          id="councillors-grid"
          className="relative bg-zinc-900 border border-zinc-700 w-[168px] gap-2 p-4 box-border overflow-y-auto min-h-0"
        >
          <PanelCorners />
          <div className="flex gap-2">
            {[0, 1].map((index) => {
              const councillorId = councillorSlots[index]
              const councillorData = councillorId
                ? getCouncillorById(selectedFaction, councillorId)
                : null
              const hasCouncillor =
                councillorId !== null &&
                councillorId !== undefined &&
                councillorData !== undefined

              return (
                <div
                  key={`councillor-slot-${index}`}
                  role="button"
                  tabIndex={0}
                  className={`${cellClass} relative cursor-pointer ${
                    hasCouncillor ? "bg-[url('/images/hud/slot.png')] bg-cover bg-center" : "bg-[url('/images/hud/slot.png')] bg-cover bg-center hover:brightness-110"
                  }`}
                  id={`councillors-slot-${index}`}
                  onClick={handleSlotClick}
                  onMouseEnter={
                    hasCouncillor && councillorData
                      ? (e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setHoverTooltip({
                            councillor: councillorData,
                            anchorRect: {
                              left: rect.left,
                              top: rect.top,
                              width: rect.width,
                              height: rect.height,
                            },
                          })
                        }
                      : undefined
                  }
                  onMouseLeave={
                    hasCouncillor ? () => setHoverTooltip(null) : undefined
                  }
                >
                  {hasCouncillor && councillorData && (
                    <img
                      src={getCouncillorIconPath(councillorData.image)}
                      alt={councillorData.name}
                      loading="eager"
                      decoding="sync"
                      className="w-16 h-16 object-contain"
                    />
                  )}
                </div>
              )
            })}
          </div>

          {selectorOpen && anchorPosition && (
            <CouncillorsSelector
              selectedIds={selectedIds}
              onClose={handleCloseSelector}
              onSelect={handleSelect}
              anchorPosition={anchorPosition}
            />
          )}
        </div>
      </div>

      {/* Hover tooltip (hidden when councillors selector is open) */}
      {showTooltip && hoverTooltip && (
        <CouncillorTooltip
          councillor={hoverTooltip.councillor}
          anchorRect={hoverTooltip.anchorRect}
        />
      )}
    </>
  )
}

export default Councillors
