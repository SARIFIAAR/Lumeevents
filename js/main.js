/* =============================================================
   LUME EVENTS — motion
   GSAP + ScrollTrigger + Lenis. The visitor is the light source.
   ============================================================= */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const hasGsap = typeof gsap !== 'undefined';
  if (hasGsap && typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);
  const hasSplit = hasGsap && typeof SplitText !== 'undefined';
  if (hasSplit) gsap.registerPlugin(SplitText);

  /* ---------- Light scenes (procedural bokeh) ---------- */
  const SCENES = {
    candle:     { bg: ['#1b120c', '#0b0a0c'], hues: [[38, 90, 62], [28, 85, 55], [45, 70, 70]], count: 70, size: [6, 46], glow: .9 },
    chandelier: { bg: ['#171310', '#0b0a0c'], hues: [[46, 60, 78], [40, 55, 65], [50, 30, 90]], count: 120, size: [3, 22], glow: 1 },
    garden:     { bg: ['#12140f', '#0b0a0c'], hues: [[42, 80, 66], [90, 25, 40], [36, 70, 60]], count: 60, size: [5, 30], glow: .8 },
    neon:       { bg: ['#0e0b12', '#0b0a0c'], hues: [[42, 90, 70], [340, 60, 55], [40, 40, 90]], count: 40, size: [4, 60], glow: 1.1 },
    ivory:      { bg: ['#221d18', '#100e0e'], hues: [[40, 30, 92], [36, 40, 80], [44, 20, 98]], count: 90, size: [4, 34], glow: .7 },
    desert:     { bg: ['#1c1008', '#0b0a0c'], hues: [[22, 95, 55], [34, 90, 62], [12, 80, 45]], count: 55, size: [6, 52], glow: 1 },
    hero:       { bg: null, hues: [[42, 85, 68], [36, 70, 60], [48, 60, 80]], count: 110, size: [2, 40], glow: 1 }
  };

  function makeParticles(scene, w, h, seed) {
    let s = seed || 1;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const out = [];
    for (let i = 0; i < scene.count; i++) {
      const hue = scene.hues[Math.floor(rnd() * scene.hues.length)];
      out.push({
        x: rnd() * w, y: rnd() * h,
        r: scene.size[0] + rnd() * (scene.size[1] - scene.size[0]),
        z: .3 + rnd() * .7,
        a: .25 + rnd() * .6,
        hue, phase: rnd() * Math.PI * 2, speed: .2 + rnd() * .6,
        vx: (rnd() - .5) * .15, vy: -(.05 + rnd() * .2)
      });
    }
    return out;
  }

  function drawScene(ctx, ps, scene, w, h, t, mx, my) {
    if (scene.bg) {
      const g = ctx.createRadialGradient(w * .5, h * .6, 0, w * .5, h * .6, Math.max(w, h) * .8);
      g.addColorStop(0, scene.bg[0]); g.addColorStop(1, scene.bg[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    } else ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of ps) {
      const tw = .65 + .35 * Math.sin(t * p.speed + p.phase);
      const px = p.x + mx * 40 * p.z, py = p.y + my * 30 * p.z;
      const r = p.r * p.z;
      const [hh, ss, ll] = p.hue;
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      const alpha = p.a * tw * scene.glow;
      g.addColorStop(0, `hsla(${hh},${ss}%,${ll}%,${alpha})`);
      g.addColorStop(.35, `hsla(${hh},${ss}%,${ll}%,${alpha * .55})`);
      g.addColorStop(1, `hsla(${hh},${ss}%,${ll}%,0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function animateParticles(ps, w, h, dt) {
    for (const p of ps) {
      p.x += p.vx * dt * 60; p.y += p.vy * dt * 60;
      if (p.y < -p.r) { p.y = h + p.r; p.x = Math.random() * w; }
      if (p.x < -p.r) p.x = w + p.r; else if (p.x > w + p.r) p.x = -p.r;
    }
  }

  /* static light study on a canvas (cards, tiles, peek) */
  function paintStatic(canvas, sceneName, seed) {
    const scene = SCENES[sceneName] || SCENES.candle;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(2, Math.round(rect.width)), h = Math.max(2, Math.round(rect.height));
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
    const ps = makeParticles(scene, w, h, seed);
    drawScene(ctx, ps, scene, w, h, seed * 3.1, 0, 0);
    /* a soft floor glow, like a lit table edge */
    const g = ctx.createLinearGradient(0, h * .55, 0, h);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.35)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }

  function paintAllStatic() {
    $$('canvas.card__art, canvas.tile__art, canvas.founder__art').forEach((c, i) => {
      const name = c.closest('[data-scene]').dataset.scene;
      paintStatic(c, name, 11 + i * 7);
    });
  }
  paintAllStatic();

  /* ---------- Hero bokeh (live) ---------- */
  const heroCanvas = $('#bokeh');
  let mouseX = 0, mouseY = 0, tx = 0, ty = 0;
  if (heroCanvas && !reduced) {
    const ctx = heroCanvas.getContext('2d');
    let w, h, ps, last = performance.now();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const size = () => {
      w = heroCanvas.clientWidth; h = heroCanvas.clientHeight;
      heroCanvas.width = w * dpr; heroCanvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ps = makeParticles(SCENES.hero, w, h, 7);
    };
    size();
    let raf, visible = true;
    const loop = (now) => {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      tx += (mouseX - tx) * .04; ty += (mouseY - ty) * .04;
      animateParticles(ps, w, h, dt);
      drawScene(ctx, ps, SCENES.hero, w, h, now / 1000, tx, ty);
      if (visible) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !gl;
      if (visible) { last = performance.now(); raf = requestAnimationFrame(loop); }
    }).observe(heroCanvas);
    window.addEventListener('resize', size);
    let gl = false;
    document.addEventListener('lume:gl', () => { gl = true; visible = false; cancelAnimationFrame(raf); $('#hero').classList.add('has-gl'); });
  }

  /* ---------- Cursor light ---------- */
  const light = $('#light'), cursor = $('#cursor');
  if (fine && !reduced && light && cursor) {
    document.body.classList.add('has-cursor');
    let cx = innerWidth / 2, cy = innerHeight / 2, lx = cx, ly = cy, rx = cx, ry = cy;
    window.addEventListener('mousemove', (e) => {
      cx = e.clientX; cy = e.clientY;
      mouseX = (e.clientX / innerWidth - .5) * 2; mouseY = (e.clientY / innerHeight - .5) * 2;
      light.style.opacity = 1; cursor.style.opacity = 1;
    }, { passive: true });
    document.addEventListener('mouseleave', () => { light.style.opacity = 0; cursor.style.opacity = 0; });
    const tick = () => {
      lx += (cx - lx) * .08; ly += (cy - ly) * .08;
      rx += (cx - rx) * .22; ry += (cy - ry) * .22;
      light.style.transform = `translate3d(${lx}px,${ly}px,0)`;
      cursor.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      requestAnimationFrame(tick);
    };
    tick();
    const hoverables = 'a, button, .svc__row, .card, .tile, input, select, textarea, label';
    document.addEventListener('mouseover', (e) => { if (e.target.closest(hoverables)) cursor.classList.add('is-hover'); });
    document.addEventListener('mouseout', (e) => { if (e.target.closest(hoverables)) cursor.classList.remove('is-hover'); });
  }

  /* ---------- Magnetic elements ---------- */
  if (fine && !reduced && hasGsap) {
    $$('[data-magnet]').forEach((el) => {
      const strength = el.classList.contains('btn') ? .35 : .25;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        gsap.to(el, { x: x * strength, y: y * strength, duration: .6, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1,.4)' }));
    });
  }

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduced && typeof Lenis !== 'undefined' && hasGsap) {
    lenis = new Lenis({ lerp: .09, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (target) => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.6 });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1 && $(id)) { e.preventDefault(); closeMenu(); scrollTo(id); }
    });
  });

  /* ---------- Nav ---------- */
  const nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
  const onScroll = () => nav.classList.toggle('is-scrolled', (lenis ? lenis.scroll : window.scrollY) > 40);
  if (lenis) lenis.on('scroll', onScroll); else window.addEventListener('scroll', onScroll, { passive: true });
  function closeMenu() {
    menu.classList.remove('is-open'); burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start(); document.body.style.overflow = '';
  }
  burger.addEventListener('click', () => {
    const open = !menu.classList.contains('is-open');
    if (!open) return closeMenu();
    menu.classList.add('is-open'); burger.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true'); menu.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop(); document.body.style.overflow = 'hidden';
  });

  /* ---------- Lights on / off ---------- */
  const themeBtn = $('#themeToggle');
  const setTheme = (t, save) => {
    document.documentElement.setAttribute('data-theme', t);
    const meta = $('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', t === 'light' ? '#F6F1E8' : '#0B0A0C');
    if (save) { try { localStorage.setItem('lume-theme', t); } catch (e) {} }
    if (hasGsap && glowEm && !document.body.classList.contains('is-loading')) startGlow();
  };
  if (!document.documentElement.getAttribute('data-theme')) document.documentElement.setAttribute('data-theme', 'dark');
  if (themeBtn) themeBtn.addEventListener('click', () => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true);
  });

  /* ---------- Word splitting ---------- */
  function splitWords(el, cls) {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span class="${cls}">${w}</span>`).join(' ');
    return $$('.' + cls, el);
  }

  /* ---------- Preloader → hero sequence ---------- */
  const loader = $('#loader');
  let heroWords = $$('[data-hero="w"]');
  if (hasSplit) {
    try {
      const split = SplitText.create('.hero__title', { type: 'chars,words', charsClass: 'hero__char' });
      heroWords = split.chars;
    } catch (e) {}
  }
  const glowEm = $('.hero__word--glow em');
  document.body.classList.add('is-loading');

  const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  let breathe = null;
  function startGlow() {
    if (!hasGsap || !glowEm) return;
    if (breathe) breathe.kill();
    const g = cssVar('--glow-rgb') || '228,192,119';
    gsap.set(glowEm, { clearProps: 'color' });
    breathe = gsap.fromTo(glowEm,
      { textShadow: `0 0 60px rgba(${g},.75), 0 0 120px rgba(${g},.35)` },
      { textShadow: `0 0 40px rgba(${g},.55), 0 0 100px rgba(${g},.25)`, duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }
  function heroIn(fast) {
    if (!hasGsap) { document.body.classList.remove('is-loading'); return; }
    const g = cssVar('--glow-rgb') || '228,192,119';
    const tl = gsap.timeline({ onComplete: () => document.body.classList.remove('is-loading') });
    const d = fast ? .4 : 1;
    tl.from(heroWords, { yPercent: 110, opacity: 0, duration: 1.2 * d, ease: 'power4.out', stagger: (hasSplit ? .028 : .07) * d })
      .fromTo(glowEm, { textShadow: `0 0 0px rgba(${g},0)`, color: cssVar('--taupe-2') },
        { textShadow: `0 0 60px rgba(${g},.75), 0 0 120px rgba(${g},.35)`, color: cssVar('--champagne'), duration: 1.6 * d, ease: 'power2.inOut' }, '-=.8')
      .from('[data-hero="eyebrow"]', { opacity: 0, y: 10, duration: .8 * d }, '-=1.2')
      .from('[data-hero="lede"]', { opacity: 0, y: 24, duration: .9 * d, ease: 'power3.out' }, '-=1')
      .from('[data-hero="cta"] .btn', { opacity: 0, y: 24, duration: .9 * d, ease: 'power3.out', stagger: .1 }, '-=.8')
      .from('[data-hero="scroll"]', { opacity: 0, duration: .8 * d }, '-=.6')
      .from('.nav', { opacity: 0, y: -10, duration: .8 * d }, '-=.9');
    /* release the line masks so the glow can bleed, then keep it breathing */
    tl.add(() => {
      $('.hero__title').classList.add('is-in');
      startGlow();
    });
  }

  let seen = false;
  try { seen = sessionStorage.getItem('lume-seen') === '1'; sessionStorage.setItem('lume-seen', '1'); } catch (e) {}
  if (reduced || !hasGsap || !loader || seen) {
    if (loader) loader.remove();
    document.body.classList.remove('is-loading');
    if (hasGsap && !reduced) heroIn(true);
  } else {
    if (lenis) lenis.stop();
    const num = $('#loaderNum'), fill = $('#loaderFill'), word = $('.loader__word');
    const state = { v: 0 };
    const tl = gsap.timeline({
      onComplete: () => { loader.remove(); if (lenis) lenis.start(); heroIn(false); }
    });
    tl.to(state, { v: 100, duration: 1.3, ease: 'power2.inOut', onUpdate: () => { num.textContent = Math.round(state.v); } }, 0)
      .to(fill, { scaleX: 1, duration: 1.3, ease: 'power2.inOut' }, 0)
      .to(word, { opacity: 1, duration: 1.3, ease: 'power2.in' }, 0)
      .to(word, { textShadow: '0 0 40px rgba(228,192,119,.8)', color: '#E9D8B4', duration: .4 }, 1.05)
      .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'expo.inOut' }, 1.5);
    gsap.set(loader, { clipPath: 'inset(0 0 0% 0)' });
  }

  /* ---------- Scroll reveals ---------- */
  if (hasGsap && !reduced) {
    $$('[data-reveal]').forEach((el) => {
      gsap.fromTo(el, { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1.2, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onStart: () => el.classList.add('is-in')
      });
    });

    /* headlines rise line by line behind a mask */
    if (hasSplit) {
      $$('.section-head h2, .contact__title, .founder__text h2, .venues__text h2, .feed__head h2').forEach((el) => {
        SplitText.create(el, {
          type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, {
            yPercent: 110, duration: 1.3, ease: 'power4.out', stagger: .09,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true }
          })
        });
      });
    }

    /* manifesto: words light up as you read */
    const man = $('#manifesto');
    if (man) {
      const words = splitWords(man, 'w');
      gsap.to(words, {
        opacity: 1, stagger: .06, ease: 'none',
        scrollTrigger: { trigger: man, start: 'top 75%', end: 'bottom 45%', scrub: .6 }
      });
    }

    /* hero photo drifts slower than the page */
    gsap.to('.hero__photo', { yPercent: 12, scale: 1.06, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    /* hero parallax out */
    gsap.to('.hero__title', { yPercent: 18, opacity: .2, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    /* horizontal concepts (desktop) */
    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', () => {
      const track = $('#workTrack'), pin = $('#workPin');
      const getX = () => -(track.scrollWidth - innerWidth);
      const tween = gsap.to(track, {
        x: getX, ease: 'none',
        scrollTrigger: {
          trigger: pin, start: 'top 12%', end: () => '+=' + (track.scrollWidth - innerWidth),
          pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1
        }
      });
      /* cards drift slightly at different speeds for depth */
      $$('.card__art').forEach((art, i) => {
        gsap.fromTo(art, { xPercent: -6 }, { xPercent: 6, ease: 'none',
          scrollTrigger: { containerAnimation: tween, trigger: art.parentElement, start: 'left right', end: 'right left', scrub: true } });
      });
      return () => tween.kill();
    });
    mm.add('(max-width: 900px)', () => {
      const pin = $('#workPin');
      pin.setAttribute('data-lenis-prevent-wheel', '');
      return () => pin.removeAttribute('data-lenis-prevent-wheel');
    });

    /* contact glow drifts */
    gsap.to('.contact__glow', { x: '30vw', y: '20vh', ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true } });

    /* footer wordmark rises */
    gsap.from('.footer__big', { yPercent: 40, ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  } else if (!hasGsap) {
    $$('.manifesto__text').forEach((m) => (m.style.opacity = 1));
  }
  if (!hasGsap || reduced) { const m = $('#manifesto'); if (m) m.style.color = '#F5EFE4'; }

  /* ---------- Service peek: a photo follows the cursor ---------- */
  const peek = $('#svcPeek'), peekImg = $('#peekImg');
  if (fine && !reduced && peek) {
    let px = 0, py = 0, cx = 0, cy = 0, on = false;
    const hide = () => { on = false; peek.classList.remove('is-on'); };
    $$('.svc__row').forEach((row) => {
      row.addEventListener('mouseenter', (e) => {
        if (row.dataset.img && peekImg.getAttribute('src') !== row.dataset.img) peekImg.src = row.dataset.img;
        cx = e.clientX + 160; cy = e.clientY;
        if (!on) { px = cx; py = cy; }
        on = true; peek.classList.add('is-on');
      });
      row.addEventListener('mouseleave', hide);
    });
    const svc = $('#svc');
    svc.addEventListener('mousemove', (e) => { cx = e.clientX + 160; cy = e.clientY; });
    svc.addEventListener('mouseleave', hide);
    /* the list can scroll out from under a resting pointer */
    const checkStill = () => { if (!on) return; const r = svc.getBoundingClientRect(); const x = cx - 160; if (x < r.left || x > r.right || cy < r.top || cy > r.bottom) hide(); };
    if (lenis) lenis.on('scroll', checkStill); else window.addEventListener('scroll', checkStill, { passive: true });
    const follow = () => {
      px += (cx - px) * .12; py += (cy - py) * .12;
      if (on) peek.style.left = px + 'px', peek.style.top = py + 'px';
      requestAnimationFrame(follow);
    };
    follow();
  }

  /* ---------- Repaint static art on resize ---------- */
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { paintAllStatic(); if (hasGsap) ScrollTrigger.refresh(); }, 200); });

  /* ---------- Fonts ready → refresh layout ---------- */
  if (document.fonts && hasGsap) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
