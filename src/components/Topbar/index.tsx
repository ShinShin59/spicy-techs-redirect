import { useState, useEffect } from "react"
import { useUIStore, useMainStore } from "@/store"
import FactionSelector from "@/components/FactionSelector"
import Button from "@/components/Button"

interface TopbarProps {
  onNew: () => void
  onFork: () => void
}

const Topbar = ({ onNew, onFork }: TopbarProps) => {
  const [logoVisible, setLogoVisible] = useState(false)
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const panelVisibility = useMainStore((s) => s.panelVisibility)
  const toggleMainBase = useMainStore((s) => s.toggleMainBase)
  const toggleArmory = useMainStore((s) => s.toggleArmory)
  const toggleUnits = useMainStore((s) => s.toggleUnits)
  const toggleCouncillors = useMainStore((s) => s.toggleCouncillors)
  const toggleMetadata = useMainStore((s) => s.toggleMetadata)

  const factionBgVar = `var(--color-faction-${selectedFaction})` as const
  const sideBgImage = "url(/images/hud/sides_left.png), url(/images/hud/sides_right.png)"

  useEffect(() => {
    document.fonts.load('1em "Dune Rise"').then(() => setLogoVisible(true))
  }, [])

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
        <Button onClick={onNew} aria-label="Create new build" mutedWhenUnpressed={false}>
          New
        </Button>
        <Button onClick={onFork} aria-label="Fork current build" mutedWhenUnpressed={false}>
          Fork
        </Button>
      </div>
      <div className="flex items-center gap-2 relative z-10">
        <Button
          onClick={toggleMainBase}
          aria-pressed={panelVisibility.mainBaseOpen}
          aria-label="Toggle Main Base"
          pressed={panelVisibility.mainBaseOpen}
          mutedWhenUnpressed
        >
          Main Base
        </Button>
        <Button
          onClick={toggleArmory}
          aria-pressed={panelVisibility.armoryOpen}
          aria-label="Toggle Armory"
          pressed={panelVisibility.armoryOpen}
          mutedWhenUnpressed
        >
          Armory
        </Button>
        <Button
          onClick={toggleUnits}
          aria-pressed={panelVisibility.unitsOpen}
          aria-label="Toggle Units"
          pressed={panelVisibility.unitsOpen}
          mutedWhenUnpressed
        >
          Units
        </Button>
        <Button
          onClick={toggleCouncillors}
          aria-pressed={panelVisibility.councillorsOpen}
          aria-label="Toggle Councillors"
          pressed={panelVisibility.councillorsOpen}
          mutedWhenUnpressed
        >
          Councillors
        </Button>
        <Button
          onClick={toggleMetadata}
          aria-pressed={panelVisibility.metadataOpen}
          aria-label="Toggle Metadata"
          pressed={panelVisibility.metadataOpen}
          mutedWhenUnpressed
        >
          Meta
        </Button>
        <Button
          onClick={toggleSidebar}
          aria-pressed={sidebarOpen}
          aria-label="Open build list"
          pressed={sidebarOpen}
          mutedWhenUnpressed
          primary
          className="ml-3"
        >
          Builds
        </Button>
      </div>
      {/* Logo – H1 with Dune Rise, halo rest animation, hidden until font loads then fades in */}
      <h1
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[130px] z-20 pointer-events-none font-display font-bold uppercase tracking-[0.12em] text-center text-5xl md:text-6xl transition-opacity duration-300 ${logoVisible ? "opacity-100" : "opacity-0"}`}
        style={{
          fontFamily: "var(--font-display)",
          filter: "drop-shadow(0 0 40px rgba(0,0,0,0.4)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
        }}
      >
        <span className="logo-title-halo">SPICY TECHS</span>
      </h1>
    </header>
  )
}

export default Topbar
