import { useMemo, useRef, useEffect, useState, type ReactNode } from "react"
import { useMainStore, useCurrentMainBaseLayout } from "@/store"
import { getMainBaseMinWidth, getMainBaseMinHeight, getMainBaseLayoutForIndex, hasMainBaseVariant } from "@/store/main-base"
import { useUIStore } from "@/store/ui"
import { useIsMobile } from "@/hooks/useMediaQuery"

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
 * - Desktop: Councillors | MainBase | Operations+Units | Armory (side by side)
 * - Mobile: One panel at a time. 0=developments, 1=councillors, 2=mainBase, 3=units, 4=armory, 5=operations
 */
const BuildLayout = ({ mainBase, units, councillors, developments, armory, operations }: BuildLayoutProps) => {
  const isMobile = useIsMobile()
  const mobileActiveGroup = useUIStore((s) => s.mobileActiveGroup)
  const hasTopRow = mainBase || units || councillors || developments || armory || operations
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const currentLayout = useCurrentMainBaseLayout()
  const mainBaseColRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const [rowHeight, setRowHeight] = useState<number | null>(null)

  const mainBaseWidth = useMemo(() => {
    const minPx = getMainBaseMinWidth(currentLayout)
    return `min(${minPx}px, 72vw)`
  }, [currentLayout])

  const mainBaseMinHeight = useMemo(() => {
    if (!hasMainBaseVariant(selectedFaction)) return undefined
    const h0 = getMainBaseMinHeight(getMainBaseLayoutForIndex(selectedFaction, 0))
    const h1 = getMainBaseMinHeight(getMainBaseLayoutForIndex(selectedFaction, 1))
    return Math.max(h0, h1)
  }, [selectedFaction])

  useEffect(() => {
    if (!hasTopRow) return
    const el = mainBase ? mainBaseColRef.current : rowRef.current
    if (!el) return
    const measure = () => {
      const h = el.getBoundingClientRect().height
      if (h > 0) setRowHeight(h)
    }
    const raf = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(raf)
  }, [hasTopRow, mainBase, selectedFaction, currentLayout])

  const rowStyle = rowHeight !== null ? { height: rowHeight } : undefined
  const alignStretch = rowHeight !== null
  const rowVisible = rowHeight !== null

  const renderContent = () => {
    if (isMobile) {
      if (mobileActiveGroup === 0) {
        return developments ? (
          <div className="shrink-0 flex flex-col min-h-0 overflow-hidden">
            {developments}
          </div>
        ) : null
      }
      if (mobileActiveGroup === 1) {
        return councillors ? (
          <div className="shrink-0 flex flex-col min-h-0 overflow-hidden">
            {councillors}
          </div>
        ) : null
      }
      if (mobileActiveGroup === 2) {
        return mainBase ? (
          <div
            ref={mainBaseColRef}
            className="shrink-0 flex flex-col"
            style={{ width: mainBaseWidth, minHeight: mainBaseMinHeight ?? undefined }}
          >
            {mainBase}
          </div>
        ) : null
      }
      if (mobileActiveGroup === 3) {
        return units ? (
          <div className="units-scroll-area shrink-0 flex flex-col min-h-0 overflow-y-auto">
            {units}
          </div>
        ) : null
      }
      if (mobileActiveGroup === 4) {
        return armory ? (
          <div className="shrink-0 flex flex-col min-h-0 w-fit overflow-hidden">
            {armory}
          </div>
        ) : null
      }
      if (mobileActiveGroup === 5) {
        return operations ? (
          <div className="shrink-0 flex flex-col min-h-0 overflow-y-auto">
            {operations}
          </div>
        ) : null
      }
      return null
    }

    return (
      <div
        ref={rowRef}
        className={`flex gap-6 transition-opacity duration-75 ${alignStretch ? "items-stretch" : "items-start"} ${rowVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={rowStyle}
        aria-hidden={!rowVisible}
      >
        {(councillors || developments) && (
          <div className="shrink-0 flex flex-col min-h-0 overflow-hidden">
            {councillors}
            <div className="flex-1 min-h-0" aria-hidden />
            {developments}
          </div>
        )}
        {mainBase && (
          <div
            ref={mainBaseColRef}
            className="shrink-0 flex flex-col"
            style={{ width: mainBaseWidth, minHeight: mainBaseMinHeight ?? undefined }}
          >
            {mainBase}
          </div>
        )}
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
    )
  }

  const content = renderContent()
  const hasMobileContent = isMobile && content

  return (
    <div className={`flex flex-col flex-1 min-w-0 w-full ${isMobile ? "gap-2" : "gap-6 items-center"}`}>
      {isMobile ? (
        <div className="flex-1 min-w-0 flex justify-center overflow-auto">
          {hasMobileContent ? content : (
            <p className="text-sm text-zinc-500 py-8">No panels in this group</p>
          )}
        </div>
      ) : (
        hasTopRow && content
      )}
    </div>
  )
}

export default BuildLayout
