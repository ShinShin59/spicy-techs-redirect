import { getHudImagePath } from "@/utils/assetPaths"

const CORNER_IMAGE = getHudImagePath("corner.png")

/** Base image is drawn for bottom-left; we rotate so the L vertex sits on each panel corner. */
const CORNERS = [
  { position: "bottom-0 left-0", transform: "rotate(0deg)", origin: "bottom left" },
  { position: "top-0 left-0", transform: "translateY(-100%) rotate(90deg)", origin: "bottom left" },
  { position: "top-0 right-0", transform: "translate(100%, -100%) rotate(180deg)", origin: "bottom left" },
  { position: "bottom-0 right-0", transform: "translateX(100%) rotate(270deg)", origin: "bottom left" },
] as const

interface PanelCornersProps {
  /** Optional class for the corner image (e.g. size). Defaults to w-3 h-3 opacity-50. */
  className?: string
}

/**
 * Renders four decorative corner images on a panel.
 * Base asset is for bottom-left; other corners are translated so the L vertex sits on the panel corner, then rotated.
 * Parent must have position: relative.
 */
export default function PanelCorners({ className = "w-3 h-3 opacity-20" }: PanelCornersProps) {
  return (
    <>
      {CORNERS.map(({ position, transform, origin }) => (
        <img
          key={position}
          src={CORNER_IMAGE}
          alt=""
          aria-hidden
          className={`absolute ${position} pointer-events-none object-bottom-left object-contain ${className}`}
          style={{
            transform,
            transformOrigin: origin,
          }}
        />
      ))}
    </>
  )
}
