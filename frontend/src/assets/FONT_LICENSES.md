# Self-Hosted Font Licenses & Offline CSP Compliance

All UI and editorial typography for **LE SOUVENIR Photobooth V2** is self-hosted locally via Fontsource NPM packages and emitted as static font files under Vite `dist/assets/`. No external font requests (`fonts.googleapis.com` / `fonts.gstatic.com`) are made at runtime.

## Tauri CSP `'self'` Compliance

- `src-tauri/tauri.conf.json` enforces `default-src 'self'` (with `data:` permitted only under `img-src 'self' data:`; there is no `font-src data:` exception).
- `frontend/vite.config.ts` sets `build: { assetsInlineLimit: 0 }` so Vite never base64-inlines `.woff2` or `.woff` files as `data:` URIs inside CSS bundles.
- `frontend/index.html` contains zero external font `<link>` tags, ensuring offline WebView2 kiosk startup never triggers blocked network or CSP errors.
- `frontend/src/atelier/fonts.css` imports the local Fontsource weight/style CSS entrypoints (each containing `vietnamese`, `latin-ext`, and `latin` `unicode-range` subsets, plus `cyrillic` for Playfair Display).

---

## `@fontsource/be-vietnam-pro`

- **Installed Package Version:** `5.3.0` (Fontsource bundle of upstream Google Fonts `Be Vietnam Pro` `v12`)
- **Resolved Registry Tarball:** `https://registry.npmjs.org/@fontsource/be-vietnam-pro/-/be-vietnam-pro-5.3.0.tgz`
- **License:** `OFL-1.1` (SIL Open Font License, Version 1.1 — 26 February 2007, `https://openfontlicense.org` / `http://scripts.sil.org/OFL`)
- **Upstream Repository:** `https://github.com/bettergui/BeVietnamPro` (via `https://github.com/fontsource/font-files`, `fonts/google/be-vietnam-pro`)
- **CSS Variable Mapping (`theme-tokens.css`):** `--at-font-ui: 'Be Vietnam Pro', system-ui, 'Segoe UI', sans-serif;`
- **Imported Weights (`fonts.css`):** `400.css`, `500.css`, `600.css`, `700.css` (subsets: `vietnamese`, `latin-ext`, `latin`)
- **Copyright Notice (from `node_modules/@fontsource/be-vietnam-pro/LICENSE`):**
  > Copyright 2021 The Be Vietnam Pro Project Authors (https://github.com/bettergui/BeVietnamPro)

---

## `@fontsource/playfair-display`

- **Installed Package Version:** `5.3.0` (Fontsource bundle of upstream Google Fonts `Playfair Display` `v40`)
- **Resolved Registry Tarball:** `https://registry.npmjs.org/@fontsource/playfair-display/-/playfair-display-5.3.0.tgz`
- **License:** `OFL-1.1` (SIL Open Font License, Version 1.1 — 26 February 2007, `https://openfontlicense.org` / `http://scripts.sil.org/OFL`)
- **Upstream Repository:** `https://github.com/clauseggers/Playfair-Display` (via `https://github.com/fontsource/font-files`, `fonts/google/playfair-display`)
- **CSS Variable Mapping (`theme-tokens.css`):** `--at-font-editorial: 'Playfair Display', 'Be Vietnam Pro', serif;`
- **Imported Weights & Styles (`fonts.css`):** `400.css`, `500.css`, `600.css`, `700.css`, `400-italic.css`, `600-italic.css` (subsets: `vietnamese`, `latin-ext`, `latin`, `cyrillic`)
- **Copyright Notice & Reserved Font Name (from `node_modules/@fontsource/playfair-display/LICENSE`):**
  > Copyright 2017 The Playfair Display Project Authors (https://github.com/clauseggers/Playfair-Display), with Reserved Font Name "Playfair Display".

---

## SIL Open Font License 1.1 (`OFL-1.1`) Bundling Terms

1. Neither the Font Software nor any of its individual components, in Original or Modified Versions, may be sold by itself.
2. Original or Modified Versions of the Font Software may be bundled, redistributed, and/or sold with any software, provided that each copy contains the copyright notices above and the OFL-1.1 license (see `node_modules/@fontsource/be-vietnam-pro/LICENSE` and `node_modules/@fontsource/playfair-display/LICENSE`).
3. No Modified Version of the Font Software may use any Reserved Font Name (`"Playfair Display"`) unless explicit written permission is granted by the corresponding Copyright Holder.
4. Any distribution of the Font Software must remain under `OFL-1.1`.
