import { useState, useRef } from "react"
import { useMainStore, useCurrentOperationSlots, useUsedBuildingIds, OPERATION_SLOTS_COUNT } from "@/store"
import { getOperationIconPath, getHudImagePath } from "@/utils/assetPaths"
import { playCancelSlotSound, playMenuToggleSound, playSpyOperationSound } from "@/utils/sound"
import { usePanelTooltip } from "@/hooks/usePanelTooltip"
import { getOperationById } from "./operations-utils"
import OperationSelector from "./OperationSelector"
import OperationTooltip from "./OperationTooltip"
import PanelCorners from "@/components/PanelCorners"
import { PANEL_BORDER_HOVER_CLASS } from "@/components/shared/panelBorderHover"
import { usePanelHideOnRightClick } from "@/hooks/usePanelHideOnRightClick"

// Same slot size as Armory
const SLOT_PX = 48
const SLOT_GAP_PX = 8

interface AnchorPosition {
  x: number
  y: number
}

const Operations = () => {
  const operationSlots = useCurrentOperationSlots()
  const usedBuildingIds = useUsedBuildingIds()
  const setOperationSlot = useMainStore((s) => s.setOperationSlot)
  const hasIntelligenceAgency = usedBuildingIds.includes("Intelligence Agency")
  const toggleOperations = useMainStore((s) => s.toggleOperations)
  const operationsOpen = useMainStore((s) => s.panelVisibility.operationsOpen)
  const panelRightClickHide = usePanelHideOnRightClick(toggleOperations, operationsOpen)

  const gridRef = useRef<HTMLDivElement>(null)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null)
  const [anchorPosition, setAnchorPosition] = useState<AnchorPosition | null>(null)
  const [hoverTooltip, setHoverTooltip, showTooltip] = usePanelTooltip<{
    operation: { name: string; desc?: string; cost: { res: string; qty: number }[] }
    anchorRect: { left: number; top: number; width: number; height: number }
  }>(selectedSlotIndex !== null)

  const isSlotEnabled = (index: number): boolean => {
    if (index < 3) return true
    return hasIntelligenceAgency
  }

  const handleSlotClick = (e: React.MouseEvent, slotIndex: number) => {
    if (!isSlotEnabled(slotIndex)) return
    const isSameSlot = selectedSlotIndex === slotIndex
    if (isSameSlot) {
      playMenuToggleSound(false)
      setSelectedSlotIndex(null)
      setAnchorPosition(null)
      return
    }
    playMenuToggleSound(true)
    const rect = e.currentTarget.getBoundingClientRect()
    setAnchorPosition({ x: rect.left, y: rect.top })
    setSelectedSlotIndex(slotIndex)
  }

  const handleSelectOperation = (missionId: string | null) => {
    if (selectedSlotIndex === null) return
    if (missionId !== null) playSpyOperationSound()
    setOperationSlot(selectedSlotIndex, missionId)
    // Simulate next state to find first empty enabled slot
    const nextSlots = [...operationSlots]
    nextSlots[selectedSlotIndex] = missionId
    const nextEmptyIndex = nextSlots.findIndex(
      (id, i) => id == null && isSlotEnabled(i)
    )
    if (nextEmptyIndex >= 0 && gridRef.current) {
      const slotEl = gridRef.current.children[nextEmptyIndex] as HTMLElement | undefined
      if (slotEl) {
        const rect = slotEl.getBoundingClientRect()
        setAnchorPosition({ x: rect.left, y: rect.top })
        setSelectedSlotIndex(nextEmptyIndex)
        return
      }
    }
    setSelectedSlotIndex(null)
    setAnchorPosition(null)
  }

  const handleCloseSelector = () => {
    playMenuToggleSound(false)
    setSelectedSlotIndex(null)
    setAnchorPosition(null)
  }

  const handleSlotRightClick = (e: React.MouseEvent, slotIndex: number) => {
    e.preventDefault()
    const missionId = operationSlots[slotIndex]
    if (missionId !== null) {
      playCancelSlotSound()
      setOperationSlot(slotIndex, null)
      setHoverTooltip(null)
    }
  }

  const slotStyle = {
    width: SLOT_PX,
    height: SLOT_PX,
    minWidth: SLOT_PX,
    minHeight: SLOT_PX,
  }

  return (
    <>
      <div className="flex flex-col w-full shrink-0">
        <div className="flex justify-end items-center gap-1 mb-0 shrink-0">
          <h2 className="text-xs font-mono font-bold text-white/70 uppercase m-0">
            Operations
          </h2>
        </div>
        <div
          className={`relative w-full bg-zinc-900 box-border overflow-hidden p-4 flex justify-center ${PANEL_BORDER_HOVER_CLASS}`}
          {...panelRightClickHide}
        >
          <PanelCorners />
          <div
            ref={gridRef}
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${OPERATION_SLOTS_COUNT}, ${SLOT_PX}px)`,
              gap: `${SLOT_GAP_PX}px`,
            }}
          >
            {Array.from({ length: OPERATION_SLOTS_COUNT }).map((_, index) => {
              const missionId = operationSlots[index] ?? null
              const operation = missionId ? getOperationById(missionId) : null
              const hasOperation = missionId !== null && operation !== undefined
              const enabled = isSlotEnabled(index)
              const isAddSlot = !hasOperation
              const addBgUrl = enabled ? getHudImagePath("slot_add.webp") : getHudImagePath("slot_disabled.webp")
              const addHoverUrl = enabled ? getHudImagePath("slot_add_hover.webp") : null
              const cellBgUrl = isAddSlot ? addBgUrl : getHudImagePath("slot.webp")
              const cellHoverUrl = isAddSlot ? addHoverUrl : null

              return (
                <div
                  key={`op-${index}`}
                  role={enabled ? "button" : undefined}
                  tabIndex={enabled ? 0 : undefined}
                  className={`flex items-center justify-center overflow-hidden text-white text-xs font-medium relative bg-cover bg-center border border-zinc-700 ${cellHoverUrl ? "hover:bg-(image:--op-slot-hover)" : ""} ${isAddSlot && !enabled ? "opacity-70 brightness-[0.5] cursor-not-allowed" : "cursor-pointer hover:brightness-110"}`}
                  style={{ ...slotStyle, backgroundImage: `url(${cellBgUrl})`, ...(cellHoverUrl ? { ["--op-slot-hover" as string]: `url(${cellHoverUrl})` } : {}) }}
                  data-panel-slot
                  title={isAddSlot ? (enabled ? "Add operation" : "Requires Intelligence Agency") : operation?.name}
                  onClick={(e) => handleSlotClick(e, index)}
                  onContextMenu={(e) => handleSlotRightClick(e, index)}
                  onMouseEnter={
                    hasOperation && operation
                      ? (e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setHoverTooltip({
                          operation: {
                            name: operation.name,
                            desc: operation.desc,
                            cost: operation.cost ?? [],
                          },
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
                  onMouseLeave={hasOperation ? () => setHoverTooltip(null) : undefined}
                >
                  {hasOperation && operation && (
                    <img
                      src={getOperationIconPath(operation.id, operation.image)}
                      alt={operation.name}
                      loading="eager"
                      decoding="async"
                      className="w-full h-full object-contain p-0.5"
                    />
                  )}
                </div>
              )
            })}
          </div>

          {selectedSlotIndex !== null && anchorPosition && (
            <OperationSelector
              onClose={handleCloseSelector}
              onSelect={handleSelectOperation}
              anchorPosition={anchorPosition}
              usedOperationIds={operationSlots
                .map((id, i) => (i !== selectedSlotIndex && id != null ? id : null))
                .filter((id): id is string => id != null)}
            />
          )}
        </div>
      </div>

      {showTooltip && hoverTooltip && (
        <OperationTooltip
          operation={hoverTooltip.operation}
          anchorRect={hoverTooltip.anchorRect}
        />
      )}
    </>
  )
}

export default Operations
