import { useMemo } from "react"
import Dither from "../Dither"
import { useMainStore, type FactionLabel } from "@/store"

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

const DitherBackground = () => {
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const waveColor = FACTION_COLORS[selectedFaction]

  const waveDirection = useMemo((): [number, number] => {
    const angle = Math.random() * Math.PI * 2
    return [Math.cos(angle) * WAVE_SPEED, Math.sin(angle) * WAVE_SPEED]
  }, [selectedFaction])

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        mixBlendMode: "overlay",
        opacity: 0.7,
      }}
      aria-hidden
    >
      <Dither
        waveColor={waveColor}
        waveDirection={waveDirection}
        disableAnimation={false}
        enableMouseInteraction={false}
        mouseRadius={0.5}
        colorNum={4}
        pixelSize={1}
        waveAmplitude={0.45}
        waveFrequency={3}
      />
    </div>
  )
}

export default DitherBackground
