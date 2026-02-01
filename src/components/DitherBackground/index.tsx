import Dither from "../Dither"

const DitherBackground = () => (
  <div
    className="fixed inset-0 pointer-events-none"
    style={{
      zIndex: -1,
      mixBlendMode: "soft-light",
      opacity: 0.9,
    }}
    aria-hidden
  >
    <Dither
      waveColor={[0.29411764705882354, 0.047058823529411764, 0.00392156862745098]}
      disableAnimation={false}
      enableMouseInteraction={false}
      mouseRadius={0.5}
      colorNum={4}
      pixelSize={1}
      waveAmplitude={0.45}
      waveFrequency={2.5}
      waveSpeed={0.01}
    />
  </div>
)

export default DitherBackground
