import { useCurrentMainBaseLayout, useCurrentMainBaseState, useMainStore } from "../../store"

const MainBase = () => {
  const layout = useCurrentMainBaseLayout()
  const mainBaseState = useCurrentMainBaseState()
  const toggleMainBaseCell = useMainStore((state) => state.toggleMainBaseCell)

  return (
    <div
      id="main-base-grid"
      className="bg-red-500 w-[384px] h-[320px] flex flex-col justify-center items-center gap-12"
    >
      {layout.map((row, rowIndex) => (
        <div key={rowIndex} className="flex" id={`main-base-row-${rowIndex}`}>
          {row.map((building, groupIndex) => (
            <div
              key={groupIndex}
              className="flex mx-4"
              id={`main-base-building-block-${groupIndex}`}
            >
              {Array.from({ length: building }).map((_, cellIndex) => {
                const isActive = mainBaseState[rowIndex]?.[groupIndex]?.[cellIndex]
                return (
                  <div
                    key={cellIndex}
                    role="button"
                    tabIndex={0}
                    className={`w-[64px] h-[64px] cursor-pointer ${isActive ? "bg-amber-500" : "bg-blue-500"}`}
                    id={`main-base-building-${cellIndex}`}
                    onClick={() => toggleMainBaseCell(rowIndex, groupIndex, cellIndex)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        toggleMainBaseCell(rowIndex, groupIndex, cellIndex)
                      }
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default MainBase