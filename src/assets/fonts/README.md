# C&C Red Alert font

The app loads **`public/font/c_c_red_alert_inet/C&C Red Alert [LAN].woff2`** (see [Tailwind font docs](https://tailwindcss.com/docs/font-family#customizing-your-theme), [Vite + React fonts](https://stackoverflow.com/questions/77212739/fonts-not-loading-in-vite-react)).

- `@font-face` uses a quoted `url(...)` and no `format()` so Vite/browsers resolve it reliably.
- If the TTF was converted to WOFF2, use that converted file; renaming `.ttf` to `.woff2` will still trigger OTS errors.
