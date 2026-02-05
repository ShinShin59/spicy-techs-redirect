import { useState, useEffect, useRef } from "react"
import { useMainStore, useIsBuildUpToDate } from "@/store"
import { useUIStore } from "@/store/ui"
import FactionSelector from "@/components/FactionSelector"
import Button from "@/components/Button"
import { playMenuToggleSound } from "@/utils/sound"
import { useShareButton } from "@/hooks/useShareButton"
import { getHudImagePath } from "@/utils/assetPaths"

interface TopbarProps {
  onNew: () => void
  onReset: () => void
  onFork: () => void
}

const Topbar = ({ onNew, onReset, onFork }: TopbarProps) => {
  const [logoVisible, setLogoVisible] = useState(false)
  const [titleAnimation, setTitleAnimation] = useState<string | null>(null)
  const isInitialMount = useRef(true)
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const currentBuildId = useMainStore((s) => s.currentBuildId)
  const isBuildUpToDate = useIsBuildUpToDate()
  const panelVisibility = useMainStore((s) => s.panelVisibility)
  const toggleMainBase = useMainStore((s) => s.toggleMainBase)
  const toggleArmory = useMainStore((s) => s.toggleArmory)
  const toggleUnits = useMainStore((s) => s.toggleUnits)
  const toggleCouncillors = useMainStore((s) => s.toggleCouncillors)
  const toggleDevelopments = useMainStore((s) => s.toggleDevelopments)
  const toggleOperations = useMainStore((s) => s.toggleOperations)
  const lightweightMode = useUIStore((s) => s.lightweightMode)
  const { copied, handleShare } = useShareButton()

  const factionBgVar = `var(--color-faction-${selectedFaction})` as const
  const sideBgImage = `url(${getHudImagePath("sides_left.png")}), url(${getHudImagePath("sides_right.png")})`

  useEffect(() => {
    document.fonts.load('1em "Dune Rise"').then(() => setLogoVisible(true))
  }, [])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (lightweightMode) return
    setTitleAnimation("title-anim-pulse-sharp")
    const t = setTimeout(() => setTitleAnimation(null), 200)
    return () => clearTimeout(t)
  }, [selectedFaction, currentBuildId, lightweightMode])

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
        <Button onClick={onReset} aria-label="Reset current build" mutedWhenUnpressed={false}>
          Reset
        </Button>
        <Button onClick={onFork} aria-label="Duplicate current build" mutedWhenUnpressed={false}>
          Duplicate
        </Button>
        {!isBuildUpToDate && (
          <span className="text-amber-400 text-xs font-medium" title="Unsaved changes">•</span>
        )}
        <Button
          onClick={handleShare}
          aria-label="Share build link"
          mutedWhenUnpressed={false}
          className="topbar-share-btn"
        >
          {copied ? "Copied" : "Share"}
        </Button>
      </div>
      <div className="flex items-center gap-2 relative z-10">
        <Button
          onClick={() => {
            const willOpen = !panelVisibility.developmentsOpen
            toggleDevelopments()
            playMenuToggleSound(willOpen)
          }}
          aria-pressed={panelVisibility.developmentsOpen}
          aria-label="Toggle Developments"
          pressed={panelVisibility.developmentsOpen}
          mutedWhenUnpressed
        >
          Developments
        </Button>
        <Button
          onClick={() => {
            const willOpen = !panelVisibility.mainBaseOpen
            toggleMainBase()
            playMenuToggleSound(willOpen)
          }}
          aria-pressed={panelVisibility.mainBaseOpen}
          aria-label="Toggle Main Base"
          pressed={panelVisibility.mainBaseOpen}
          mutedWhenUnpressed
        >
          Main Base
        </Button>
        <Button
          onClick={() => {
            const willOpen = !panelVisibility.armoryOpen
            toggleArmory()
            playMenuToggleSound(willOpen)
          }}
          aria-pressed={panelVisibility.armoryOpen}
          aria-label="Toggle Armory"
          pressed={panelVisibility.armoryOpen}
          mutedWhenUnpressed
        >
          Armory
        </Button>
        <Button
          onClick={() => {
            const willOpen = !panelVisibility.unitsOpen
            toggleUnits()
            playMenuToggleSound(willOpen)
          }}
          aria-pressed={panelVisibility.unitsOpen}
          aria-label="Toggle Units"
          pressed={panelVisibility.unitsOpen}
          mutedWhenUnpressed
        >
          Units
        </Button>
        <Button
          onClick={() => {
            const willOpen = !panelVisibility.councillorsOpen
            toggleCouncillors()
            playMenuToggleSound(willOpen)
          }}
          aria-pressed={panelVisibility.councillorsOpen}
          aria-label="Toggle Councillors"
          pressed={panelVisibility.councillorsOpen}
          mutedWhenUnpressed
        >
          Councillors
        </Button>
        <Button
          onClick={() => {
            const willOpen = !panelVisibility.operationsOpen
            toggleOperations()
            playMenuToggleSound(willOpen)
          }}
          aria-pressed={panelVisibility.operationsOpen}
          aria-label="Toggle Operations"
          pressed={panelVisibility.operationsOpen}
          mutedWhenUnpressed
        >
          Operations
        </Button>
      </div>
      {/* Logo – H1 with Dune Rise, halo rest animation, hidden until font loads then fades in */}
      <h1
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[150px] z-20 pointer-events-none font-display font-bold uppercase tracking-[0.12em] text-center text-5xl md:text-6xl transition-opacity duration-300 flex flex-col items-center gap-2 ${logoVisible ? "opacity-100" : "opacity-0"}`}
        style={{
          fontFamily: "var(--font-display)",
          filter: "drop-shadow(0 0 40px rgba(0,0,0,0.4)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
        }}
      >
        <span
          className={`absolute top-0 right-0 text-[0.65rem] md:text-xs tracking-[0.2em] ${lightweightMode ? "logo-title-static" : "logo-title-halo"}`}
          aria-hidden
        >
          ALPHA
        </span>
        <span
          className={`inline-block ${titleAnimation ?? ""}`}
          onAnimationEnd={() => setTitleAnimation(null)}
        >
          <span className={lightweightMode ? "logo-title-static" : "logo-title-halo"}>SPICY TECHS</span>
        </span>
        <span
          className="block w-full max-w-[320px] h-2 shrink-0 bg-no-repeat bg-center"
          style={{
            backgroundImage: `url(${getHudImagePath("title_underline.png")})`,
            backgroundSize: "auto 100%",
          }}
          aria-hidden
        />
      </h1>
    </header>
  )
}

export default Topbar
