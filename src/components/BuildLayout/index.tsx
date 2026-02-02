import { useMemo, useRef, useEffect, useState, type ReactNode } from "react"
import { useMainStore } from "@/store"
import { mainBasesLayout, getMainBaseMinWidth } from "@/store/main-base"

interface BuildLayoutProps {
  mainBase?: ReactNode
  units?: ReactNode
  councillors?: ReactNode
  developments?: ReactNode
  armory?: ReactNode
  operations?: ReactNode
}

/**
 * Layout container for the build tiles.
 * - Top row: Councillors | MainBase | Operations+Units | Armory (side by side)
 * Row height is driven by Main Base only; other columns scroll if taller.
 * Left column: Councillors on top, Developments below (when visible).
 * Operations sits on top of Units in the same column.
 */
const BuildLayout = ({ mainBase, units, councillors, developments, armory, operations }: BuildLayoutProps) => {
  const hasTopRow = mainBase || units || councillors || developments || armory || operations
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const mainBaseColRef = useRef<HTMLDivElement>(null)
  const [rowHeight, setRowHeight] = useState<number | null>(null)

  const mainBaseWidth = useMemo(() => {
    const layout = mainBasesLayout[selectedFaction]
    const minPx = getMainBaseMinWidth(layout)
    return `min(${minPx}px, 72vw)`
  }, [selectedFaction])

  // Measure main base column height when it has natural size (row not stretched), then fix row height
  useEffect(() => {
    if (!hasTopRow || !mainBase || !mainBaseColRef.current) return
    const el = mainBaseColRef.current
    const measure = () => {
      const h = el.getBoundingClientRect().height
      if (h > 0) setRowHeight(h)
    }
    const raf = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(raf)
  }, [hasTopRow, mainBase, selectedFaction])

  const rowStyle = rowHeight !== null ? { height: rowHeight } : undefined
  const alignStretch = rowHeight !== null
  const rowVisible = rowHeight !== null

  return (
    <div className="flex flex-col gap-6">
      {hasTopRow && (
        <div
          className={`flex gap-6 transition-opacity duration-75 ${alignStretch ? "items-stretch" : "items-start"} ${rowVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          style={rowStyle}
          aria-hidden={!rowVisible}
        >
          {(councillors || developments) && (
            <div className="shrink-0 flex flex-col min-h-0 overflow-y-auto">
              {councillors}
              <div className="flex-1 min-h-0" aria-hidden />
              {developments}
            </div>
          )}
          <div
            ref={mainBaseColRef}
            className="shrink-0 flex flex-col"
            style={{ width: mainBaseWidth }}
          >
            {mainBase}
          </div>
          {(operations || units) && (
            <div className="units-scroll-area shrink-0 flex flex-col gap-6 min-h-0 overflow-y-auto">
              {operations}
              {units}
            </div>
          )}
          {armory && (
            <div className="shrink-0 flex flex-col min-h-0 w-fit overflow-hidden">
              {armory}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default BuildLayout
