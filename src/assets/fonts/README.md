# Custom fonts

The app loads two custom fonts from `public/font/`:

1. **C&C Red Alert** – `public/font/c_c_red_alert_inet/C&C Red Alert [LAN].woff2` (default UI, `--font-sans`)
2. **Dune Rise** – `public/font/Dune_Rise/Dune_Rise.ttf` (logo / hero title, `--font-display`)

See [Tailwind font docs](https://tailwindcss.com/docs/font-family#customizing-your-theme), [Vite + React fonts](https://stackoverflow.com/questions/77212739/fonts-not-loading-in-vite-react).

- `@font-face` uses a quoted `url(...)` and no `format()` so Vite/browsers resolve it reliably.
- If a TTF was converted to WOFF2, use that converted file; renaming `.ttf` to `.woff2` will still trigger OTS errors.
