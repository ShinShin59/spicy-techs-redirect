import { useMemo, useState, useEffect, useRef, lazy, Suspense } from "react"
import { useMainStore, type FactionLabel } from "@/store"
import { useUIStore } from "@/store/ui"

const Dither = lazy(() => import("../Dither"))

/** Faction colors as [r, g, b] in 0–1 range (matches CSS --color-faction-*) */
const FACTION_COLORS: Record<FactionLabel, [number, number, number]> = {
  atreides: [38 / 255, 118 / 255, 76 / 255],
  harkonnen: [144 / 255, 18 / 255, 27 / 255],
  smuggler: [46 / 255, 113 / 255, 133 / 255],
  fremen: [202 / 255, 147 / 255, 41 / 255],
  corrino: [156 / 255, 131 / 255, 132 / 255],
  ecaz: [201 / 255, 96 / 255, 146 / 255],
  vernius: [60 / 255, 22 / 255, 109 / 255],
}

const WAVE_SPEED = 0.005
const BASE_AMPLITUDE = 0.45
const BASE_OPACITY = 0.7
const BOOST_SPEED_MULT = 2.8
const BOOST_AMPLITUDE_MULT = 1.7
const BOOST_OPACITY_MULT = 1.5
const BOOST_DURATION_MS = 450

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

const DitherBackground = () => {
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const lightweightMode = useUIStore((s) => s.lightweightMode)
  const waveColor = FACTION_COLORS[selectedFaction]

  const [speedMult, setSpeedMult] = useState(1)
  const [amplitudeMult, setAmplitudeMult] = useState(1)
  const [opacityMult, setOpacityMult] = useState(1)
  const animStartRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)

  const baseDirection = useMemo((): [number, number] => {
    const angle = Math.random() * Math.PI * 2
    return [Math.cos(angle) * WAVE_SPEED, Math.sin(angle) * WAVE_SPEED]
  }, [selectedFaction])

  useEffect(() => {
    setSpeedMult(BOOST_SPEED_MULT)
    setAmplitudeMult(BOOST_AMPLITUDE_MULT)
    setOpacityMult(BOOST_OPACITY_MULT)
    animStartRef.current = null

    const tick = (now: number) => {
      if (animStartRef.current === null) animStartRef.current = now
      const elapsed = now - animStartRef.current
      const progress = Math.min(elapsed / BOOST_DURATION_MS, 1)
      const eased = easeOutCubic(progress)

      setSpeedMult(BOOST_SPEED_MULT + (1 - BOOST_SPEED_MULT) * eased)
      setAmplitudeMult(BOOST_AMPLITUDE_MULT + (1 - BOOST_AMPLITUDE_MULT) * eased)
      setOpacityMult(BOOST_OPACITY_MULT + (1 - BOOST_OPACITY_MULT) * eased)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [selectedFaction])

  const waveDirection: [number, number] = [
    baseDirection[0] * speedMult,
    baseDirection[1] * speedMult,
  ]
  const waveAmplitude = BASE_AMPLITUDE * amplitudeMult
  const opacity = BASE_OPACITY * opacityMult

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        mixBlendMode: "overlay",
        opacity,
      }}
      aria-hidden
    >
      <Suspense fallback={null}>
        <Dither
          waveColor={waveColor}
          waveDirection={waveDirection}
          disableAnimation={lightweightMode}
          enableMouseInteraction={true}
          mouseRadius={1.}
          colorNum={6}
          pixelSize={2}
          waveAmplitude={waveAmplitude}
          waveFrequency={3}
        />
      </Suspense>
    </div>
  )
}

export default DitherBackground
