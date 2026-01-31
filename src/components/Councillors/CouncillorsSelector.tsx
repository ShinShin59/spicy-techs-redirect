import { useState, useMemo, useEffect, useRef } from "react"
import { useMainStore } from "@/store"
import { getCouncillorIconPath } from "@/utils/assetPaths"
import {
  getCouncillorsForFaction,
  type CouncillorData,
} from "./councillors-utils"
import CouncillorTooltip from "./CouncillorTooltip"

interface AnchorPosition {
  x: number
  y: number
}

interface CouncillorsSelectorProps {
  /** Currently selected councillor IDs [oldest, newest] */
  selectedIds: (string | null)[]
  onClose: () => void
  onSelect: (councillorId: string) => void
  anchorPosition: AnchorPosition
}

const CouncillorsSelector = ({
  selectedIds,
  onClose,
  onSelect,
  anchorPosition,
}: CouncillorsSelectorProps) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const [hoverTooltip, setHoverTooltip] = useState<{
    councillor: CouncillorData
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

  const councillors = useMemo(
    () => getCouncillorsForFaction(selectedFaction),
    [selectedFaction]
  )

  const popupStyle = useMemo<React.CSSProperties>(
    () => ({
      position: "fixed" as const,
      left: anchorPosition.x,
      bottom: window.innerHeight - anchorPosition.y,
    }),
    [anchorPosition.x, anchorPosition.y]
  )

  const handleClick = (councillor: CouncillorData) => {
    onSelect(councillor.id)
  }

  return (
    <>
      <div
        ref={modalRef}
        className="z-50 bg-zinc-900 border border-zinc-700 flex flex-col"
        style={popupStyle}
      >

        <div className="flex p-3 gap-2">
          {councillors.map((councillor) => {
            const isSelected = selectedIds.includes(councillor.id)
            return (
              <div
                key={councillor.id}
                className="w-16 h-16 shrink-0"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setHoverTooltip({
                    councillor,
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
                  onClick={() => handleClick(councillor)}
                  className={`
                    w-full h-full flex items-center justify-center border-2
                    ${isSelected
                      ? "border-zinc-400 bg-zinc-600"
                      : "border-zinc-600 bg-zinc-700/50 hover:brightness-125 hover:border-zinc-500"
                    }
                    cursor-pointer
                  `}
                >
                  <img
                    src={getCouncillorIconPath(councillor.image)}
                    alt={councillor.name}
                    loading="eager"
                    decoding="sync"
                    className="w-14 h-14 object-contain"
                  />
                </button>
              </div>
            )
          })}
        </div>

        {councillors.length === 0 && (
          <div className="px-4 py-2 text-zinc-500 text-sm">
            No councillors available for this faction
          </div>
        )}
      </div>

      {hoverTooltip && (
        <CouncillorTooltip
          councillor={hoverTooltip.councillor}
          anchorRect={hoverTooltip.anchorRect}
        />
      )}
    </>
  )
}

export default CouncillorsSelector
