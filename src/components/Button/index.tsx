import type { ButtonHTMLAttributes, ReactNode } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "topbar"
  pressed?: boolean
  mutedWhenUnpressed?: boolean
  primary?: boolean
  children: ReactNode
}

const Button = ({
  variant = "topbar",
  pressed = false,
  mutedWhenUnpressed = false,
  primary = false,
  className = "",
  children,
  ...props
}: ButtonProps) => {
  const base =
    "w-28 h-9 shrink-0 px-4 py-1.5 text-sm font-normal cursor-pointer relative z-10 flex items-center justify-center transition-all duration-150 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0"

  const topbarStyles =
    "bg-no-repeat bg-center bg-contain text-topbar-btn bg-[url('/images/hud/btn_rest.png')] hover:bg-[url('/images/hud/btn_hover.png')] hover:brightness-[0.85]"

  const primaryStyles = primary
    ? "font-semibold"
    : ""

  const pressedStyles = pressed
    ? "!bg-[url('/images/hud/btn_hover.png')]"
    : mutedWhenUnpressed
      ? "opacity-50 grayscale hover:opacity-75 hover:grayscale-0"
      : ""

  const classes =
    variant === "topbar"
      ? `${base} ${topbarStyles} ${primaryStyles} ${pressedStyles} ${className}`.trim()
      : `${base} ${className}`.trim()

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}

export default Button
