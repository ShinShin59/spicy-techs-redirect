import { useUIStore, useMainStore } from "@/store"
import FactionSelector from "@/components/FactionSelector"

interface TopbarProps {
  onNew: () => void
  onFork: () => void
}

const Topbar = ({ onNew, onFork }: TopbarProps) => {
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const panelVisibility = useMainStore((s) => s.panelVisibility)
  const toggleMainBase = useMainStore((s) => s.toggleMainBase)
  const toggleArmory = useMainStore((s) => s.toggleArmory)
  const toggleUnits = useMainStore((s) => s.toggleUnits)
  const toggleCouncillors = useMainStore((s) => s.toggleCouncillors)
  const toggleMetadata = useMainStore((s) => s.toggleMetadata)

  const btnBase =
    "w-28 h-9 shrink-0 px-4 py-1.5 text-sm font-normal cursor-pointer relative z-10 bg-no-repeat bg-center bg-contain transition-[background] flex items-center justify-center"
  const btnRest = "bg-[url('/images/hud/btn_rest.png')]"
  const btnHover = "hover:bg-[url('/images/hud/btn_hover.png')]"
  const panelBtnClass = (open: boolean) =>
    `${btnBase} ${btnRest} ${btnHover} text-topbar-btn ${open ? "!bg-[url('/images/hud/btn_hover.png')]" : ""}`

  const factionBgVar = `var(--color-faction-${selectedFaction})` as const
  const sideBgImage = "url(/images/hud/sides_left.png), url(/images/hud/sides_right.png)"

  return (
    <header
      className="w-full h-10 py-6 shrink-0 flex items-center justify-between px-8 relative border-b-2 border-t-2 border-[#a67c00] shadow-[0_1px_0_#000,0_-1px_0_#000] after:content-[''] after:absolute after:inset-0 after:pointer-events-none after:bg-linear-to-r after:from-black/40 after:via-transparent after:to-black/40"
      style={{
        backgroundColor: factionBgVar,
        backgroundImage: sideBgImage,
        backgroundPosition: "left center, right center",
        backgroundRepeat: "no-repeat, no-repeat",
        backgroundSize: "auto 100%, auto 100%",
      }}
    >
      <div className="flex items-center gap-2 relative z-10">
        <FactionSelector />
        <button
          type="button"
          onClick={onNew}
          aria-label="Create new build"
          className={`${btnBase} ${btnRest} ${btnHover} text-topbar-btn`}
        >
          New
        </button>
        <button
          type="button"
          onClick={onFork}
          aria-label="Fork current build"
          className={`${btnBase} ${btnRest} ${btnHover} text-topbar-btn`}
        >
          Fork
        </button>
      </div>
      <div className="flex items-center gap-2 relative z-10">
        <button
          type="button"
          onClick={toggleMainBase}
          aria-pressed={panelVisibility.mainBaseOpen}
          aria-label="Toggle Main Base"
          className={`${panelBtnClass(panelVisibility.mainBaseOpen)} relative z-10`}
        >
          Main Base
        </button>
        <button
          type="button"
          onClick={toggleArmory}
          aria-pressed={panelVisibility.armoryOpen}
          aria-label="Toggle Armory"
          className={`${panelBtnClass(panelVisibility.armoryOpen)} relative z-10`}
        >
          Armory
        </button>
        <button
          type="button"
          onClick={toggleUnits}
          aria-pressed={panelVisibility.unitsOpen}
          aria-label="Toggle Units"
          className={`${panelBtnClass(panelVisibility.unitsOpen)} relative z-10`}
        >
          Units
        </button>
        <button
          type="button"
          onClick={toggleCouncillors}
          aria-pressed={panelVisibility.councillorsOpen}
          aria-label="Toggle Councillors"
          className={`${panelBtnClass(panelVisibility.councillorsOpen)} relative z-10`}
        >
          Councillors
        </button>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-pressed={sidebarOpen}
          aria-label="Open build list"
          className={`${panelBtnClass(sidebarOpen)} relative z-10`}
        >
          Builds
        </button>
        <button
          type="button"
          onClick={toggleMetadata}
          aria-pressed={panelVisibility.metadataOpen}
          aria-label="Toggle Metadata"
          className={`${panelBtnClass(panelVisibility.metadataOpen)} relative z-10`}
        >
          Meta
        </button>
      </div>
      {/* Logo */}
      <img
        src="/images/hud/spicy_techs.png"
        alt=""
        aria-hidden
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[100px] z-20 pointer-events-none"
      />
    </header>
  )
}

export default Topbar
