import { useUIStore } from "@/store/ui"

const AnimatedBackground = () => {
  const lightweightMode = useUIStore((s) => s.lightweightMode)
  return (
    <div
      className={`fixed inset-0 -z-10 ${lightweightMode ? "" : "animate-gradient-shift"}`}
      style={{
        background: `
          radial-gradient(
            ellipse 120% 60% at 50% -10%,
            rgba(14, 12, 9, 0.7) 0%,
            rgba(10, 9, 7, 0.3) 40%,
            transparent 70%
          ),
          linear-gradient(
            135deg,
            #060609 0%,
            #0a0b09 20%,
            #0c0a08 40%,
            #0b0906 60%,
            #090807 80%,
            #060609 100%
          )
        `,
        backgroundSize: lightweightMode ? "100% 100%, 100% 100%" : "100% 100%, 400% 400%",
      }}
      aria-hidden
    />
  )
}

export default AnimatedBackground
