/* LUME — Concept 2 motion */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const hasSplit = hasGsap && typeof SplitText !== 'undefined';
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  if (hasSplit) gsap.registerPlugin(SplitText);
  const silk = () => window.__silk;

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduced && typeof Lenis !== 'undefined' && hasGsap) {
    lenis = new Lenis({ lerp: .1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (id) => { const el = $(id); if (!el) return; lenis ? lenis.scrollTo(el, { duration: 1.4 }) : el.scrollIntoView({ behavior: 'smooth' }); };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const id = a.getAttribute('href'); if (id.length > 1 && $(id)) { e.preventDefault(); closeMenu(); scrollTo(id); } }));

  /* ---------- nav, menu, progress ---------- */
  const nav = $('#nav'), burger = $('#burger'), menu = $('#menu'), progress = $('#progress');
  const onScroll = () => {
    const y = lenis ? lenis.scroll : scrollY;
    nav.classList.toggle('is-scrolled', y > 30);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  lenis ? lenis.on('scroll', onScroll) : addEventListener('scroll', onScroll, { passive: true });
  function closeMenu() { menu.classList.remove('is-open'); burger.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true'); if (lenis) lenis.start(); }
  burger.addEventListener('click', () => {
    if (menu.classList.contains('is-open')) return closeMenu();
    menu.classList.add('is-open'); burger.classList.add('is-open'); burger.setAttribute('aria-expanded', 'true'); menu.setAttribute('aria-hidden', 'false'); if (lenis) lenis.stop();
  });

  /* ---------- cursor ---------- */
  const cursor = $('#cursor'), cursorLabel = $('#cursorLabel');
  if (fine && !reduced) {
    document.body.classList.add('has-cursor');
    let cx = innerWidth / 2, cy = innerHeight / 2, x = cx, y = cy;
    addEventListener('mousemove', (e) => { cx = e.clientX; cy = e.clientY; cursor.style.opacity = 1; }, { passive: true });
    document.addEventListener('mouseleave', () => (cursor.style.opacity = 0));
    (function tick() { x += (cx - x) * .2; y += (cy - y) * .2; cursor.style.transform = `translate3d(${x}px,${y}px,0)`; requestAnimationFrame(tick); })();
    document.addEventListener('mouseover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      if (lab) { cursorLabel.textContent = lab.dataset.cursor; cursor.classList.add('is-label'); return; }
      if (e.target.closest('a,button,input,select,textarea,label')) cursor.classList.add('is-hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('[data-cursor]')) cursor.classList.remove('is-label');
      if (e.target.closest('a,button,input,select,textarea,label')) cursor.classList.remove('is-hover');
    });
  }

  /* ---------- magnetic ---------- */
  if (fine && !reduced && hasGsap) $$('[data-magnet]').forEach((el) => {
    el.addEventListener('mousemove', (e) => { const r = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .3, duration: .5, ease: 'power3.out' }); });
    el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .8, ease: 'elastic.out(1,.45)' }));
  });

  /* ---------- curtain + hero ---------- */
  const curtain = $('.curtain');
  let chars = null;
  if (hasSplit) { try { chars = SplitText.create('#heroTitle', { type: 'chars,words', charsClass: 'char' }).chars; } catch (e) {} }
  const heroTargets = chars || ['#heroTitle'];
  function heroIn(d) {
    const tl = gsap.timeline({ onComplete: () => document.body.classList.remove('is-loading') });
    tl.from(heroTargets, { yPercent: 120, rotate: 6, opacity: 0, duration: 1.3 * d, ease: 'power4.out', stagger: chars ? .03 * d : 0 })
      .from('[data-hero="eyebrow"] span', { y: 12, opacity: 0, duration: .7 * d, stagger: .08 }, '-=.9')
      .from('[data-hero="lede"]', { y: 24, opacity: 0, duration: .9 * d }, '-=.7')
      .from('[data-hero="cta"] .pill', { y: 24, opacity: 0, duration: .8 * d, stagger: .1 }, '-=.7')
      .from('[data-hero="hint"]', { opacity: 0, duration: .6 * d }, '-=.4')
      .from('.nav', { y: -16, opacity: 0, duration: .8 * d }, '-=.9');
  }
  document.body.classList.add('is-loading');
  if (!hasGsap || reduced) { if (curtain) curtain.remove(); document.body.classList.remove('is-loading'); }
  else {
    if (lenis) lenis.stop();
    const tl = gsap.timeline({ onComplete: () => { curtain.remove(); if (lenis) lenis.start(); } });
    tl.from('.curtain__word', { yPercent: 40, opacity: 0, duration: .8, ease: 'power3.out' })
      .to('.curtain__word', { letterSpacing: '.12em', opacity: 0, duration: .6, ease: 'power2.in' }, '+=.35')
      .to('.curtain__l', { xPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=.2')
      .to('.curtain__r', { xPercent: 100, duration: 1.1, ease: 'expo.inOut' }, '<')
      .add(() => heroIn(1), '-=.7');
  }

  /* ---------- word split ---------- */
  function splitWords(el, cls) { el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="${cls}">${w}</span>`).join(' '); return $$('.' + cls, el); }

  if (hasGsap && !reduced) {
    /* headline lines */
    if (hasSplit) $$('.h-big').forEach((el) => SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.2, ease: 'power4.out', stagger: .08, scrollTrigger: { trigger: el, start: 'top 88%', once: true } }) }));

    /* hero parallax + silk hand-off */
    gsap.to('#heroTitle', { yPercent: 25, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    /* chapters: pinned storytelling */
    const chaptersEl = $('.chapters'), items = $$('.chapter'), imgs = $$('.chapters__img'), bar = $('#chapterBar');
    const palettes = [ [.055, .23, .19, .95, .84, .8], [.78, .3, .38, .98, .86, .78], [.07, .07, .06, .93, .93, .9], [.95, .55, .35, .16, .5, .55] ];
    const setChapter = (i) => {
      items.forEach((el, k) => el.classList.toggle('is-active', k === i));
      imgs.forEach((el, k) => el.classList.toggle('is-active', k === i));
      const p = palettes[i]; if (silk()) silk().set({ a: p.slice(0, 3), b: p.slice(3), amp: .9 + i * .25 });
    };
    ScrollTrigger.matchMedia({
      '(min-width: 901px)': () => {
        ScrollTrigger.create({
          trigger: chaptersEl, start: 'top top', end: '+=' + (items.length * 90) + '%', pin: '#chaptersPin', scrub: true, anticipatePin: 1,
          onUpdate: (self) => { const i = Math.min(items.length - 1, Math.floor(self.progress * items.length)); setChapter(i); bar.style.transform = `scaleX(${self.progress})`; },
          onLeave: () => silk() && silk().set({ a: [.055, .23, .19], b: [.95, .84, .8], amp: .7 }),
          onEnterBack: () => setChapter(items.length - 1),
        });
      },
      '(max-width: 900px)': () => { items.forEach((el) => el.classList.add('is-active')); imgs.forEach((el, k) => el.classList.toggle('is-active', k === 0)); }
    });
    items.forEach((el, i) => el.addEventListener('mouseenter', () => { if (innerWidth > 900) setChapter(i); }));

    /* statement: words light up */
    const st = $('#statement');
    if (st) gsap.to(splitWords(st, 'w'), { opacity: 1, stagger: .05, ease: 'none', scrollTrigger: { trigger: st, start: 'top 75%', end: 'bottom 45%', scrub: .5 } });

    /* moments: clip-path wipe + parallax */
    $$('.moment').forEach((m, i) => {
      const fig = $('figure', m), img = $('img', m);
      gsap.to(fig, { clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'power4.inOut', scrollTrigger: { trigger: m, start: 'top 88%', once: true }, delay: (i % 3) * .08 });
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* stacked process cards: earlier cards shrink and fade as the next one arrives */
    ScrollTrigger.matchMedia({ '(min-width: 901px)': () => {
      const cards = $$('.stack__card');
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;
        gsap.to(card, { scale: .94 - (cards.length - 1 - i) * .015, opacity: .6, ease: 'none',
          scrollTrigger: { trigger: cards[i + 1], start: 'top 55%', end: 'top 12%', scrub: true } });
      });
    } });

    /* why list + founder + contact reveals */
    $$('.why__list li, .contact__list li').forEach((el) => gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));
    gsap.to('.founder__img', { clipPath: 'inset(0 0 0% 0)', duration: 1.4, ease: 'power4.inOut', scrollTrigger: { trigger: '.founder', start: 'top 70%', once: true } });
    gsap.from('.founder__text > *', { y: 30, opacity: 0, duration: 1, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: '.founder', start: 'top 70%', once: true } });
    gsap.from('.form', { y: 40, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.form', start: 'top 88%', once: true } });

    /* tickers skew with scroll velocity */
    const tracks = $$('.ticker__track');
    ScrollTrigger.create({ onUpdate: (self) => {
      const v = gsap.utils.clamp(-14, 14, self.getVelocity() / 120);
      tracks.forEach((t) => gsap.to(t, { skewX: -v, duration: .6, ease: 'power2.out', overwrite: 'auto' }));
    } });

    /* footer wordmark fills */
    const fb = $('#footerBig');
    gsap.to(fb, { '--fill': '100%', ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top 90%', end: 'bottom bottom', scrub: true } });

    /* silk reacts to sections */
    ScrollTrigger.create({ trigger: '.founder', start: 'top 60%', end: 'bottom 40%', onEnter: () => silk() && silk().set({ a: [.95, .84, .8], b: [.06, .23, .19], amp: .5 }), onLeaveBack: () => silk() && silk().set({ a: [.055, .23, .19], b: [.95, .84, .8], amp: .7 }) });
    ScrollTrigger.create({ trigger: '.contact', start: 'top 60%', onEnter: () => silk() && silk().set({ a: [.055, .23, .19], b: [.95, .84, .8], amp: 1.1 }), onLeaveBack: () => silk() && silk().set({ a: [.95, .84, .8], b: [.06, .23, .19], amp: .5 }) });

    if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  } else {
    $$('.moment figure, .founder__img').forEach((el) => (el.style.clipPath = 'none'));
    const st = $('#statement'); if (st) st.style.opacity = 1;
  }
})();
