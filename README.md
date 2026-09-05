# Lume Events — website

Bespoke events & experiences, Dubai. "Make your event glow." Instagram: [@lumeeventsae](https://www.instagram.com/lumeeventsae/)

Static site, no build step required. Open `index.html` or serve the folder.

```
index.html      page structure & copy
css/style.css   design system (tokens at the top) + layout
js/main.js      preloader, cursor light, bokeh canvas, smooth scroll, reveals, horizontal gallery
build.py        optional: inlines css/js into dist/ for a single-file deploy
```

## Two concepts
- **Concept 1** (root): dark stage, Bodoni, cursor light, Three.js particle hero. Live: https://sarifiaar.github.io/Lumeevents/
- **Concept 2** (`option-2/`): light, sculptural, Bricolage Grotesque, a Three.js silk ribbon behind the whole page, curtain intro, pinned chapters, stacked process cards. Live: https://sarifiaar.github.io/Lumeevents/option-2/

## Stack
- [GSAP 3.13](https://gsap.com) + ScrollTrigger + SplitText (free since 3.13), [Lenis](https://lenis.darkroom.engineering) smooth scroll (CDN, pinned versions)
- [Three.js 0.170](https://threejs.org) WebGL hero (`js/three-hero.js`, ES module): 1,100 light particles with depth of field, cursor parallax and scroll dolly. Desktop only; the 2D canvas is the fallback
- Google Fonts: Bodoni Moda (display) + Instrument Sans (body)
- Procedural "light study" visuals are drawn on `<canvas>` so the site works before real photography is added

## Before launch — replace the placeholders
1. **Contact details** in `index.html` → `#contact` and footer: `hello@lumeevents.ae`, the WhatsApp number `971500000000`, the Threads link.
2. **Form**: currently `mailto:`. Swap the `<form action>` for Formspree/Netlify Forms/your CRM endpoint.
3. **Photography**: each `.card`, `.tile` and `.svc__row` has a `data-scene`. To use a real photo, drop it in `assets/` and add
   `<img class="card__art" src="assets/your.jpg" alt="…">` in place of the `<canvas class="card__art">` (same for `.tile__art`). Also update `paintAllStatic()` in `js/main.js` if you remove all canvases.
4. **Concept cards** (`#work`) are concept directions, not past projects. Rename them to real weddings/galas once there is a portfolio.
5. `og:image` meta tag: add a 1200×630 image for link previews.

## Deploy
Any static host: GitHub Pages (Settings → Pages → branch `main`, folder `/`), Netlify, Vercel or Cloudflare Pages.
