import { useState, useEffect, useRef } from "react"
import { useMainStore } from "@/store"
import { useUIStore, type MobileActiveGroup } from "@/store/ui"
import FactionSelector from "@/components/FactionSelector"
import Button from "@/components/Button"
import { playMenuToggleSound } from "@/utils/sound"
import { useShareButton } from "@/hooks/useShareButton"
import { useIsMobile, useIsPortrait } from "@/hooks/useMediaQuery"
import { getHudImagePath } from "@/utils/assetPaths"

/** Tab to mobile panel group mapping. One panel per group. */
const TAB_TO_GROUP: Record<string, MobileActiveGroup> = {
  developments: 0,
  councillors: 1,
  mainBase: 2,
  units: 3,
  armory: 4,
  operations: 5,
}

const HamburgerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="3" x2="21" y1="6" y2="6" />
    <line x1="3" x2="21" y1="12" y2="12" />
    <line x1="3" x2="21" y1="18" y2="18" />
  </svg>
)

interface TopbarProps {
  onNew: () => void
  onReset: () => void
  onFork: () => void
}

const Topbar = ({ onNew, onReset, onFork }: TopbarProps) => {
  const [logoVisible, setLogoVisible] = useState(false)
  const [titleAnimation, setTitleAnimation] = useState<string | null>(null)
  const isInitialMount = useRef(true)
  const isMobile = useIsMobile()
  const isPortrait = useIsPortrait()
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const currentBuildId = useMainStore((s) => s.currentBuildId)
  const panelVisibility = useMainStore((s) => s.panelVisibility)
  const toggleMainBase = useMainStore((s) => s.toggleMainBase)
  const toggleArmory = useMainStore((s) => s.toggleArmory)
  const toggleUnits = useMainStore((s) => s.toggleUnits)
  const toggleCouncillors = useMainStore((s) => s.toggleCouncillors)
  const toggleDevelopments = useMainStore((s) => s.toggleDevelopments)
  const toggleOperations = useMainStore((s) => s.toggleOperations)
  const mobileActiveGroup = useUIStore((s) => s.mobileActiveGroup)
  const setMobileActiveGroup = useUIStore((s) => s.setMobileActiveGroup)
  const setMobileMetadataOpen = useUIStore((s) => s.setMobileMetadataOpen)
  const goPrev = () => setMobileActiveGroup(((mobileActiveGroup - 1 + 6) % 6) as MobileActiveGroup)
  const goNext = () => setMobileActiveGroup(((mobileActiveGroup + 1) % 6) as MobileActiveGroup)
  const lightweightMode = useUIStore((s) => s.lightweightMode)
  const { copied, handleShare } = useShareButton()

  const handleMobileTabClick = (tab: string) => {
    const group = TAB_TO_GROUP[tab]
    if (group === undefined) return
    setMobileActiveGroup(group)
    playMenuToggleSound(true)
    if (tab === "developments") {
      if (!panelVisibility.developmentsOpen) toggleDevelopments()
    } else if (tab === "councillors") {
      if (!panelVisibility.councillorsOpen) toggleCouncillors()
    } else if (tab === "mainBase") {
      if (!panelVisibility.mainBaseOpen) toggleMainBase()
    } else if (tab === "units") {
      if (!panelVisibility.unitsOpen) toggleUnits()
    } else if (tab === "armory" || tab === "operations") {
      if (!panelVisibility.armoryOpen) toggleArmory()
      if (!panelVisibility.operationsOpen) toggleOperations()
    }
  }

  const factionBgVar = `var(--color-faction-${selectedFaction})` as const
  const sideBgImage = `url(${getHudImagePath("sides_left.webp")}), url(${getHudImagePath("sides_right.webp")})`

  useEffect(() => {
    document.fonts.load('1em "Dune Rise"').then(() => setLogoVisible(true))
  }, [])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (lightweightMode) return
    // Trigger animation after render using requestAnimationFrame (more appropriate for animations)
    const rafId = requestAnimationFrame(() => {
      setTitleAnimation("title-anim-pulse-sharp")
    })
    const timeoutId = setTimeout(() => setTitleAnimation(null), 200)
    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(timeoutId)
    }
  }, [selectedFaction, currentBuildId, lightweightMode])

  return (
    <>
      <header
        className={`w-full shrink-0 flex items-center px-4 md:px-8 relative border-b-2 border-t-2 border-[#a67c00] shadow-[0_1px_0_#000,0_-1px_0_#000] after:content-[''] after:absolute after:inset-0 after:pointer-events-none after:bg-linear-to-r after:from-black/40 after:via-transparent after:to-black/40 ${isMobile ? "h-auto py-2" : "h-10 py-6"}`}
        style={{
          backgroundColor: factionBgVar,
          backgroundImage: sideBgImage,
          backgroundPosition: "left center, right center",
          backgroundRepeat: "no-repeat, no-repeat",
          backgroundSize: "auto 100%, auto 100%",
        }}
      >
        <div
          className={`flex items-center relative z-10 ${isMobile ? "flex-1 flex-col gap-1" : "justify-between w-full gap-2"}`}
        >
          {isMobile ? (
            <div className="flex items-center gap-2 w-full justify-between">
              <div
                className={`shrink-0 flex items-center ${isPortrait ? "flex-col gap-0.5" : "flex-row gap-2"
                  }`}
              >
                <button
                  type="button"
                  onClick={() => setMobileMetadataOpen(true)}
                  className="p-1.5 -m-1 rounded text-topbar-btn hover:bg-black/20 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                  aria-label="Open metadata, settings and builds"
                >
                  <HamburgerIcon />
                </button>
                <FactionSelector compact={isMobile} />
              </div>
              <div
                className={`shrink-0 gap-1.5 ${isPortrait ? "grid grid-cols-2" : "flex flex-row"
                  }`}
              >
                <Button onClick={onNew} aria-label="Create new build" mutedWhenUnpressed={false} size={isMobile ? "compact" : undefined}>
                  New
                </Button>
                <Button onClick={onReset} aria-label="Reset current build" mutedWhenUnpressed={false} size={isMobile ? "compact" : undefined}>
                  Reset
                </Button>
                <Button onClick={onFork} aria-label="Duplicate current build" mutedWhenUnpressed={false} size={isMobile ? "compact" : undefined}>
                  Duplicate
                </Button>
                <Button
                  onClick={handleShare}
                  aria-label="Share build link"
                  mutedWhenUnpressed={false}
                  className="topbar-share-btn"
                  size={isMobile ? "compact" : undefined}
                >
                  {copied ? "Copied" : "Share"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
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
              <Button
                onClick={handleShare}
                aria-label="Share build link"
                mutedWhenUnpressed={false}
                className="topbar-share-btn"
              >
                {copied ? "Copied" : "Share"}
              </Button>
            </div>
          )}
          {!isMobile && (
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
          )}
        </div>
        {/* Logo – desktop: absolute below header; mobile: in separate row with arrows */}
        {!isMobile && (
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
                backgroundImage: `url(${getHudImagePath("title_underline.webp")})`,
                backgroundSize: "auto 100%",
              }}
              aria-hidden
            />
          </h1>
        )}
      </header>
      {isMobile && (
        <div
          className={`flex items-center gap-1 py-1 shrink-0 ${isPortrait ? "justify-center mt-8" : "absolute left-4 top-[20%] justify-start"
            }`}
        >
          {isPortrait ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="shrink-0 p-1.5 rounded text-topbar-btn hover:bg-black/20 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Previous panel group"
              >
                <img src={getHudImagePath("settings/left.webp")} alt="" width={16} height={16} />
              </button>
              <h1
                className={`relative font-display font-bold uppercase tracking-widest text-center text-xl transition-opacity duration-300 flex flex-col items-center ${logoVisible ? "opacity-100" : "opacity-0"}`}
                style={{
                  fontFamily: "var(--font-display)",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                }}
              >
                <span className="absolute -top-0.5 right-0 text-[0.4rem] tracking-[0.15em] opacity-70" aria-hidden>
                  ALPHA
                </span>
                <span className={lightweightMode ? "logo-title-static" : "logo-title-halo"}>SPICY TECHS</span>
              </h1>
              <button
                type="button"
                onClick={goNext}
                className="shrink-0 p-1.5 rounded text-topbar-btn hover:bg-black/20 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Next panel group"
              >
                <img src={getHudImagePath("settings/right.webp")} alt="" width={16} height={16} />
              </button>
            </>
          ) : (
            <h1
              className={`font-display font-bold uppercase tracking-widest text-left text-xl transition-opacity duration-300 flex flex-col items-start ${logoVisible ? "opacity-100" : "opacity-0"}`}
              style={{
                fontFamily: "var(--font-display)",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
              }}
            >
              <span className="text-[0.4rem] tracking-[0.15em] opacity-70" aria-hidden>
                ALPHA
              </span>
              <span className={lightweightMode ? "logo-title-static" : "logo-title-halo"}>SPICY TECHS</span>
            </h1>
          )}
        </div>
      )}
      {isMobile && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 flex flex-col items-start justify-center gap-1 px-2 py-1.5 border-t-2 border-[#a67c00] shadow-[0_-1px_0_#000] pb-[env(safe-area-inset-bottom,0px)] max-w-[100vw]"
          style={{
            backgroundColor: factionBgVar,
            backgroundImage: sideBgImage,
            backgroundPosition: "left center, right center",
            backgroundRepeat: "no-repeat, no-repeat",
            backgroundSize: "auto 100%, auto 100%",
          }}
          aria-label="Panel navigation"
        >
          <div
            className={`flex items-center gap-1.5 justify-start w-full max-w-full ${isPortrait ? "flex-col" : "flex-row"
              }`}
          >
            {isPortrait ? (
              <>
                <div className="flex items-center gap-1.5 justify-start w-full max-w-full">
                  <Button
                    onClick={() => handleMobileTabClick("developments")}
                    size="compact"
                    className="text-xs"
                    aria-label="Developments"
                    pressed={mobileActiveGroup === 0}
                    mutedWhenUnpressed
                  >
                    Developments
                  </Button>
                  <Button
                    onClick={() => handleMobileTabClick("mainBase")}
                    aria-label="Main Base"
                    pressed={mobileActiveGroup === 2}
                    mutedWhenUnpressed
                    size="compact"
                  >
                    Main Base
                  </Button>
                  <Button
                    onClick={() => handleMobileTabClick("armory")}
                    aria-label="Armory"
                    pressed={mobileActiveGroup === 4}
                    mutedWhenUnpressed
                    size="compact"
                  >
                    Armory
                  </Button>
                </div>
                <div className="flex items-center gap-1.5 justify-start w-full max-w-full">
                  <Button
                    onClick={() => handleMobileTabClick("units")}
                    aria-label="Units"
                    pressed={mobileActiveGroup === 3}
                    mutedWhenUnpressed
                    size="compact"
                  >
                    Units
                  </Button>
                  <Button
                    onClick={() => handleMobileTabClick("councillors")}
                    aria-label="Councillors"
                    pressed={mobileActiveGroup === 1}
                    mutedWhenUnpressed
                    size="compact"
                  >
                    Councillors
                  </Button>
                  <Button
                    onClick={() => handleMobileTabClick("operations")}
                    aria-label="Operations"
                    pressed={mobileActiveGroup === 5}
                    mutedWhenUnpressed
                    size="compact"
                  >
                    Operations
                  </Button>
                  <a
                    href="https://discord.gg/wpVJJmM6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-2 text-gray-400 hover:text-[#5865F2] transition-colors grayscale hover:grayscale-0 ml-auto"
                    aria-label="Join our Discord"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  </a>
                </div>
              </>
            ) : (
              <>
                <Button
                  onClick={() => handleMobileTabClick("developments")}
                  size="compact"
                  className="text-xs"
                  aria-label="Developments"
                  pressed={mobileActiveGroup === 0}
                  mutedWhenUnpressed
                >
                  Developments
                </Button>
                <Button
                  onClick={() => handleMobileTabClick("mainBase")}
                  aria-label="Main Base"
                  pressed={mobileActiveGroup === 2}
                  mutedWhenUnpressed
                  size="compact"
                >
                  Main Base
                </Button>
                <Button
                  onClick={() => handleMobileTabClick("armory")}
                  aria-label="Armory"
                  pressed={mobileActiveGroup === 4}
                  mutedWhenUnpressed
                  size="compact"
                >
                  Armory
                </Button>
                <Button
                  onClick={() => handleMobileTabClick("units")}
                  aria-label="Units"
                  pressed={mobileActiveGroup === 3}
                  mutedWhenUnpressed
                  size="compact"
                >
                  Units
                </Button>
                <Button
                  onClick={() => handleMobileTabClick("councillors")}
                  aria-label="Councillors"
                  pressed={mobileActiveGroup === 1}
                  mutedWhenUnpressed
                  size="compact"
                >
                  Councillors
                </Button>
                <Button
                  onClick={() => handleMobileTabClick("operations")}
                  aria-label="Operations"
                  pressed={mobileActiveGroup === 5}
                  mutedWhenUnpressed
                  size="compact"
                >
                  Operations
                </Button>
                <a
                  href="https://discord.gg/wpVJJmM6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-2 text-gray-400 hover:text-[#5865F2] transition-colors grayscale hover:grayscale-0 ml-auto"
                  aria-label="Join our Discord"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </a>
              </>
            )}
          </div>
        </nav>
      )}
    </>
  )
}

export default Topbar
