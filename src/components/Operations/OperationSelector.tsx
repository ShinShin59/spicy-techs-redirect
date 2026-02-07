import { useState, useMemo, useEffect, useRef } from "react"
import { useMainStore } from "@/store"
import { getOperationIconPath, getHudImagePath } from "@/utils/assetPaths"
import { getOperationsForFaction, type OperationItem } from "./operations-utils"
import OperationTooltip from "./OperationTooltip"
import { useIsMobile } from "@/hooks/useMediaQuery"

interface AnchorPosition {
  x: number
  y: number
}

interface OperationSelectorProps {
  onClose: () => void
  onSelect: (missionId: string | null) => void
  anchorPosition: AnchorPosition
  /** Operation IDs already used in other slots (excludes the slot being edited) */
  usedOperationIds?: string[]
}

// Same slot size as panel (Operations index)
const SLOT_PX = 48
const SLOT_PX_MOBILE = 40
const SLOT_GAP_PX = 8
const GRID_COLS = 4
const PADDING_PX = 12

const OperationSelector = ({
  onClose,
  onSelect,
  anchorPosition,
  usedOperationIds = [],
}: OperationSelectorProps) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const [hoverTooltip, setHoverTooltip] = useState<{
    operation: OperationItem
    anchorRect: { left: number; top: number; width: number; height: number }
  } | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  const availableOperations = useMemo(() => {
    const all = getOperationsForFaction(selectedFaction)
    const used = new Set(usedOperationIds)
    return all.filter((op) => !used.has(op.id))
  }, [selectedFaction, usedOperationIds])

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
        bottom: window.innerHeight - anchorPosition.y,
      }
    },
    [anchorPosition.x, anchorPosition.y, isMobile]
  )

  const gridWidth =
    GRID_COLS * SLOT_PX + (GRID_COLS - 1) * SLOT_GAP_PX + PADDING_PX * 2
  const slotPx = isMobile ? SLOT_PX_MOBILE : SLOT_PX

  return (
    <>
      <div
        ref={modalRef}
        className="z-50 bg-zinc-900 border border-zinc-700 flex flex-col overflow-auto"
        style={{
          ...popupStyle,
          ...(isMobile ? {} : { maxHeight: "70vh" }),
        }}
      >
        <div
          className={isMobile ? "flex flex-row flex-wrap justify-center gap-2 p-3" : "grid p-3"}
          style={
            isMobile
              ? undefined
              : {
                  width: gridWidth,
                  gridTemplateColumns: `repeat(${GRID_COLS}, ${SLOT_PX}px)`,
                  gridAutoRows: `${SLOT_PX}px`,
                  gap: SLOT_GAP_PX,
                }
          }
        >
          {availableOperations.map((op) => (
            <div
              key={op.id}
              className="shrink-0"
              style={{ width: slotPx, height: slotPx }}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                setHoverTooltip({
                  operation: op,
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
                onClick={() => onSelect(op.id)}
                className="w-full h-full bg-cover bg-center border border-zinc-700 flex items-center justify-center hover:brightness-110 cursor-pointer"
                style={{ backgroundImage: `url(${getHudImagePath("slot.webp")})` }}
              >
                <img
                  src={getOperationIconPath(op.id, op.image)}
                  alt={op.name}
                  className="w-full h-full object-contain p-0.5"
                />
              </button>
            </div>
          ))}
        </div>
      </div>
      {hoverTooltip && (
        <OperationTooltip
          operation={hoverTooltip.operation}
          anchorRect={hoverTooltip.anchorRect}
        />
      )}
    </>
  )
}

export default OperationSelector
