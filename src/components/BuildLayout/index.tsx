import { useRef, useState, useEffect, useMemo, type ReactNode } from "react"
import { MainBaseHeightContext } from "./mainBaseHeightContext"
import { useMainStore } from "@/store"
import { mainBasesLayout, getMainBaseMinWidth } from "@/store/main-base"

interface BuildLayoutProps {
  mainBase?: ReactNode
  units?: ReactNode
  councillors?: ReactNode
  armory?: ReactNode
  operations?: ReactNode
}

/**
 * Layout container for the build tiles.
 * - Top row: Councillors | MainBase | Units | Armory (side by side)
 * Armory grows to its content; Units match Main Base height when Main Base is visible.
 * Main Base keeps definitive proportions (does not fill width when other panels are off).
 * Width adapts to faction layout (e.g. Harkonnen needs more for [3,2] row).
 */
const BuildLayout = ({ mainBase, units, councillors, armory, operations }: BuildLayoutProps) => {
  const hasTopRow = mainBase || units || councillors || armory || operations
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const mainBaseRef = useRef<HTMLDivElement>(null)
  const [mainBaseHeight, setMainBaseHeight] = useState<number | null>(null)

  const mainBaseWidth = useMemo(() => {
    const layout = mainBasesLayout[selectedFaction]
    const minPx = getMainBaseMinWidth(layout)
    return `min(${minPx}px, 72vw)`
  }, [selectedFaction])

  useEffect(() => {
    if (!hasTopRow || !mainBase) {
      setMainBaseHeight(null)
      return
    }
    const el = mainBaseRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { height } = entries[0]?.contentRect ?? { height: 0 }
      setMainBaseHeight(height > 0 ? height : null)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [hasTopRow, mainBase])

  return (
    <div className="flex flex-col gap-6">
      {hasTopRow && (
        <MainBaseHeightContext.Provider value={mainBaseHeight}>
          <div className="flex gap-6 items-start">
            {councillors && (
              <div className="shrink-0 flex flex-col">
                {councillors}
              </div>
            )}
            <div ref={mainBaseRef} className="shrink-0 flex flex-col gap-6" style={{ width: mainBaseWidth }}>
              {mainBase}
              {operations}
            </div>
            {units}
            {armory && (
              <div className="shrink-0 flex flex-col">
                {armory}
              </div>
            )}
          </div>
        </MainBaseHeightContext.Provider>
      )}
    </div>
  )
}

export default BuildLayout
