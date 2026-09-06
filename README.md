# Lume Events — website

Bespoke weddings, galas, proposals and brand moments in Dubai. "Make your event glow ✨"
Instagram: [@lumeeventsae](https://www.instagram.com/lumeeventsae/)

**Live (GitHub Pages, redeploys on every push to `main`):**
- Concept 1 — https://sarifiaar.github.io/Lumeevents/
- Concept 2 — https://sarifiaar.github.io/Lumeevents/option-2/

Static site, no build step required. Serve the folder with any static server (`python3 -m http.server`) and open `index.html`. Opening via `file://` breaks the ES-module hero, so always use a server.

## Layout
```
index.html            Concept 1 page structure & copy
css/style.css         Concept 1 design system (dark + light tokens at the top) + layout
js/main.js            preloader, cursor light, theme toggle, Lenis smooth scroll, reveals, pinned horizontal gallery
js/three-hero.js      Concept 1 WebGL particle hero (ES module, desktop only, 2D canvas fallback)
option-2/index.html   Concept 2 page structure & copy
option-2/style.css    Concept 2 design system + layout
option-2/main.js      Concept 2 curtain intro, pinned chapters, stacked cards, drone-show choreography
option-2/drones.js    Concept 2 Three.js drone show (fixed full-page canvas)
assets/               real photography (from the Evented deck), Alina's portrait, favicon PNG set
favicon.ico           gold "L" favicon (Bodoni 72)
build.py              inlines css/js/images into dist/ (single-file deploys + claude.ai Artifact previews)
```

## Two concepts
**Concept 1 (root)** — dark stage with a light theme toggle.
- Bodoni Moda display + Instrument Sans body. LUME Bodoni wordmark as the nav logo.
- Cursor acts as a light source; dimmer preloader; word-by-word manifesto; pinned horizontal "concepts" gallery above 900px (wheel scroll is passed through on tablet/mobile).
- Three.js hero: 1,100 light particles with depth of field, cursor parallax and scroll dolly. Desktop only, 2D bokeh canvas fallback elsewhere. SplitText headline reveals.
- Light theme: `:root[data-theme="light"]` tokens, `#themeToggle` (lights on/off) top-right, remembered in `localStorage` key `lume-theme`.
- Sections: hero, manifesto (`#about`), services, pillars (`#why`), work, venues, process, founder, Instagram feed, contact.

**Concept 2 (`option-2/`)** — light, sculptural.
- Bricolage Grotesque + Figtree. Emerald `#0E3B31` and blush `#F1D6CC` on pearl `#F4F1EB`.
- Full-page Three.js drone show behind the content: a swarm that forms rings, a heart, the Burj Khalifa, a starburst and finally the LUME wordmark as you scroll. Earlier silk-ribbon and confetti versions were replaced by the drones.
- Curtain intro, magnetic pills, pinned chapters, stacked process cards.
- Sections: hero, chapters, moments, process, founder, contact.

## Stack
- [GSAP 3.13.0](https://gsap.com) + ScrollTrigger + SplitText (cdnjs)
- [Lenis 1.1.18](https://lenis.darkroom.engineering) smooth scroll (jsdelivr)
- [Three.js 0.170](https://threejs.org) as an ES module (import map), both concepts
- Google Fonts: Bodoni Moda + Instrument Sans (Concept 1), Bricolage Grotesque + Figtree (Concept 2)
- No framework, no bundler, no npm.

## Content and brand rules
- All copy and the 12 photos came from the Evented.AE deck, re-branded. The brand is **LUME EVENTS**, never Evented.
- Founder section shows **Alina** only. The current portrait (`assets/alina.jpg`) is a 420×700 source; ask the client for a higher-resolution one.
- Concept cards under `#work` are concept directions, not past projects. Rename to real weddings/galas once a portfolio exists.

## Build
```
python3 build.py
```
Writes `dist/index.html` (full single-file page), `dist/artifact.html` and `dist/option-2.html` (head+body only, images inlined as base64, for claude.ai Artifact previews) and copies `assets/` and `favicon.ico`. `dist/` is git-ignored; GitHub Pages serves the source files directly.

## Debug helpers (browser console)
- Concept 1: `window.__lumeHero.frame(1)` renders one hero frame (useful for screenshots when rAF is throttled).
- Concept 2: `window.__silk.form('swarm' | 'rings' | 'heart' | 'burj' | 'burst' | 'lume')`, `window.__silk.set({ a, b, amp })` for colours/amplitude, `window.__silk.frame(snap)`. The canvas id is still `#silk` from the earlier ribbon version.

## Before launch — replace the placeholders
1. **Contact details** in both `index.html` and `option-2/index.html` (`#contact` and footer): `hello@lumeevents.ae`, WhatsApp `+971 50 000 0000` / `wa.me/971500000000`, the Threads link. The deck's `hello@evented.ae` and Evented phone number are not Lume's and were not used.
2. **Form**: currently `action="mailto:..."`. Swap for Formspree, Netlify Forms or a CRM endpoint.
3. **`og:image`** (Concept 1 only so far) points at `assets/hero-candlelit.jpg`; add a proper 1200×630 crop and add the tag to Concept 2.
4. Pick one concept for the final domain, or keep both and link them.

## Deploy
GitHub Pages is already enabled (branch `main`, folder `/`). Any other static host works too: Netlify, Vercel, Cloudflare Pages. Just push the source folder, no build needed.
