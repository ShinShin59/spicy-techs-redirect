import { useUIStore } from "@/store/ui"

/**
 * Full-screen grayscale dither pattern overlay.
 * Tiles the pattern, sits on top of all content; pointer-events: none so clicks pass through.
 * Animation: inner layer moves so the tiling pattern drifts (transform-based for reliability).
 */
const TILE_SIZE = 1024

const DitherOverlay = () => {
  const lightweightMode = useUIStore((s) => s.lightweightMode)
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 5 }}
      aria-hidden
    >
      <div
        className={lightweightMode ? "" : "dither-overlay-drift"}
        style={{
          position: "absolute",
          left: -TILE_SIZE,
          top: -TILE_SIZE,
          width: `calc(100% + ${TILE_SIZE * 2}px)`,
          height: `calc(100% + ${TILE_SIZE * 2}px)`,
          backgroundImage: `url(${import.meta.env.BASE_URL}images/dither-tiling.webp)`,
          backgroundRepeat: "repeat",
          backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
          opacity: 0.05,
          filter: "grayscale(100%)"
        }}
      />
    </div>
  )
}

export default DitherOverlay
