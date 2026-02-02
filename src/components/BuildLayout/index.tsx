import { useMemo, type ReactNode } from "react"
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
 * Main Base keeps definitive proportions (does not fill width when other panels are off).
 * Width adapts to faction layout (e.g. Harkonnen needs more for [3,2] row).
 */
const BuildLayout = ({ mainBase, units, councillors, armory, operations }: BuildLayoutProps) => {
  const hasTopRow = mainBase || units || councillors || armory || operations
  const selectedFaction = useMainStore((s) => s.selectedFaction)

  const mainBaseWidth = useMemo(() => {
    const layout = mainBasesLayout[selectedFaction]
    const minPx = getMainBaseMinWidth(layout)
    return `min(${minPx}px, 72vw)`
  }, [selectedFaction])

  return (
    <div className="flex flex-col gap-6">
      {hasTopRow && (
        <div className="flex gap-6 items-start">
          {councillors && (
            <div className="shrink-0 flex flex-col">
              {councillors}
            </div>
          )}
          <div className="shrink-0 flex flex-col gap-6" style={{ width: mainBaseWidth }}>
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
      )}
    </div>
  )
}

export default BuildLayout
