# HYPERBULL — $HYPERBULL

Official site for **HYPERBULL**, a Solana meme coin.
Zero build step, zero dependencies — plain HTML, CSS and vanilla JS. Deploys to Vercel as-is.

> *Don't ask how high. Ask how fast.*

---

## Quick edits

Almost everything you need to change lives in **one place**: the `CONFIG` object at the top of [`main.js`](main.js).

```js
const CONFIG = {
  CA:    'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Solana contract address
  X_URL: 'https://x.com/'                        // X / Twitter profile link
};
```

The contract address is injected into every `[data-ca]` element (hero, How-to-Buy, footer) and the
X link into every `[data-x-link]` element (nav, hero, final CTA, footer). Change it once, it updates everywhere.

**Tokenomics numbers** (supply / tax / LP / mint authority) are plain HTML — edit them in the
`#tokenomics` section of [`index.html`](index.html).

---

## Structure

```
index.html        markup — all sections
styles.css        the whole design system
main.js           CONFIG + all effects
assets/           web-optimised images (logo, favicons, memes, OG image)
originals/        untouched source artwork (excluded from deploys via .vercelignore)
vercel.json       clean URLs + asset caching headers
```

## Effects

- Lightning-storm preloader with a charge meter
- Two full-page canvases: procedural lightning bolts (midpoint displacement) + drifting sparks
- Screen flash synced to strikes, perspective grid floor, scanlines, vignette
- Glitch + light-sweep hero title, scrambling section headings, count-up stats
- Scroll reveals, parallax artwork, 3D tilt cards, cursor glow, scroll progress bar
- Meme lightbox with keyboard navigation, one-click contract copy
- Everything respects `prefers-reduced-motion`

## Local preview

No tooling required — just open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Deploy

Import the repo on [vercel.com](https://vercel.com/new). Framework preset: **Other**.
No build command, output directory `.` — Vercel serves the static files directly.

---

*$HYPERBULL is a meme coin. No intrinsic value, no expectation of financial return. DYOR.*
