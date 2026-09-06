# CLAUDE.md — Lume Events website

Static marketing site for Lume Events (Dubai). Two concepts in one repo. Read `README.md` first for layout, stack and the placeholder list.

## Where things are
- Concept 1: `index.html`, `css/style.css`, `js/main.js`, `js/three-hero.js`
- Concept 2: `option-2/` (`index.html`, `style.css`, `main.js`, `drones.js`), shares `../assets`
- Photos, portrait, favicons: `assets/`
- `build.py` produces `dist/` (git-ignored). Not needed for GitHub Pages.

## Workflow
1. Edit the source files directly. There is no framework, bundler or npm.
2. Preview with `python3 -m http.server` from the repo root (never `file://`, the ES-module hero and drone show will not load).
3. Run `python3 build.py` if an Artifact preview or single-file export is wanted.
4. Commit and push to `origin main`. GitHub Pages redeploys in about a minute:
   - https://sarifiaar.github.io/Lumeevents/
   - https://sarifiaar.github.io/Lumeevents/option-2/

## Constraints and conventions
- Vanilla HTML/CSS/JS only. React-only libraries (Motion, R3F, shadcn, Aceternity) are ruled out.
- Pin CDN versions: GSAP 3.13.0 (cdnjs), Lenis 1.1.18 (jsdelivr), Three.js 0.170 (import map).
- Design tokens live at the top of each `style.css`. Concept 1 has dark (default) and light (`:root[data-theme="light"]`) sets; keep both in sync when adding colours.
- Keep the nav CTA and the lights toggle on one line at every breakpoint.
- The pinned horizontal gallery in Concept 1 is desktop-only (>900px). Below that Lenis must keep passing wheel events through.
- Concept 2's canvas id is `#silk` for historical reasons; the drone show lives in `drones.js` and is driven from `main.js` ScrollTriggers via `window.__silk`.

## Brand rules (from the client)
- The brand is LUME EVENTS. Never show "Evented" even though the copy and photos came from the Evented deck.
- Founder section: Alina only. Do not add Elzana.
- Tone: "Make your event glow". Bespoke, luxurious, Dubai. The goal is to beat top global event-company sites, so expect requests for more motion and sections.

## Known placeholders
`hello@lumeevents.ae`, WhatsApp `+971 50 000 0000`, `mailto:` form action, Threads link, `og:image`. Do not invent real contact details; leave the placeholders until the client supplies them.

## Gotchas
- The Chrome automation tool throttles `requestAnimationFrame`, so GSAP intros look stalled in screenshots. Call `window.__lumeHero.frame(1)` or `window.__silk.frame(1)` to force a frame; it is not a bug.
- The Alina portrait source is only 420×700px. Ask for a higher-res file before upscaling.
- No `gh` CLI on this machine and the stored token has no `workflow` scope, so do not add GitHub Actions. Push over https.
