/* =============================================================
   LUME EVENTS — WebGL hero
   A volume of candle-light particles with depth of field.
   Loads only on desktop with WebGL; the 2D canvas remains the fallback.
   ============================================================= */
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.170.0/three.module.min.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktop = matchMedia('(min-width: 901px)').matches;
const hero = document.getElementById('hero');
if (hero && desktop && !reduced) init();

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
  } catch (e) { return; }
  const canvas = renderer.domElement;
  canvas.className = 'hero__gl';
  canvas.setAttribute('aria-hidden', 'true');
  hero.insertBefore(canvas, document.getElementById('bokeh'));
  document.dispatchEvent(new CustomEvent('lume:gl'));

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, .1, 100);
  camera.position.set(0, 0, 0);

  /* ---------- particles ---------- */
  const COUNT = 1100, DEPTH = 34, NEAR = 2, RANGE_Y = 22;
  const pos = new Float32Array(COUNT * 3), size = new Float32Array(COUNT), phase = new Float32Array(COUNT),
        speed = new Float32Array(COUNT), tint = new Float32Array(COUNT);
  let s = 11;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < COUNT; i++) {
    const z = -(NEAR + rnd() * DEPTH);
    const spread = (-z) * 1.05;
    pos[i * 3] = (rnd() - .5) * spread * 2.2;
    pos[i * 3 + 1] = (rnd() - .5) * RANGE_Y;
    pos[i * 3 + 2] = z;
    const big = rnd() < .12;
    size[i] = big ? 1.6 + rnd() * 2.6 : .25 + rnd() * .9;
    phase[i] = rnd() * Math.PI * 2;
    speed[i] = .15 + rnd() * .7;
    tint[i] = rnd();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  geo.setAttribute('aTint', new THREE.BufferAttribute(tint, 1));

  const uniforms = {
    uTime: { value: 0 },
    uScale: { value: 300 },
    uFocus: { value: 11 },      /* focal plane distance: points here are crisp, others bloom */
    uFocusRange: { value: 12 },
    uLight: { value: 0 },       /* 0 = lights off (dark theme), 1 = lights on */
    uFade: { value: 0 },        /* eased in after the preloader */
    uRangeY: { value: RANGE_Y },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aSize, aPhase, aSpeed, aTint;
      uniform float uTime, uScale, uFocus, uFocusRange, uRangeY;
      varying float vBlur, vTwinkle, vTint;
      void main() {
        vec3 p = position;
        p.y = mod(p.y + uTime * aSpeed * .35 + uRangeY * .5, uRangeY) - uRangeY * .5;
        p.x += sin(uTime * .25 * aSpeed + aPhase) * .35;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float dist = -mv.z;
        vBlur = clamp(abs(dist - uFocus) / uFocusRange, 0.0, 1.0);
        vTwinkle = .6 + .4 * sin(uTime * (1.2 + aSpeed) + aPhase);
        vTint = aTint;
        float sz = aSize * (1.0 + vBlur * 2.6);
        gl_PointSize = sz * uScale / dist;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      precision highp float;
      uniform float uLight, uFade;
      varying float vBlur, vTwinkle, vTint;
      void main() {
        vec2 c = gl_PointCoord - .5;
        float d = length(c);
        float soft = mix(.08, .45, vBlur);                 /* crisp near focus, bloomed away from it */
        float a = smoothstep(.5, .5 - soft, d);
        a *= (1.0 - vBlur * .72) * vTwinkle * uFade;
        vec3 gold = vec3(.95, .78, .45), champagne = vec3(1.0, .93, .78), white = vec3(1.0, .98, .93);
        vec3 col = vTint < .65 ? mix(gold, champagne, vTint / .65) : mix(champagne, white, (vTint - .65) / .35);
        vec3 deep = vec3(.62, .46, .18), bronze = vec3(.75, .58, .28);
        vec3 lightCol = mix(deep, bronze, vTint);
        col = mix(col, lightCol, uLight);
        gl_FragColor = vec4(col, a * mix(1.0, .55, uLight));
      }`
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  /* ---------- theme ---------- */
  const applyTheme = () => {
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    uniforms.uLight.value = light ? 1 : 0;
    mat.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    mat.needsUpdate = true;
  };
  applyTheme();
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---------- size ---------- */
  let w = 1, h = 1;
  const resize = () => {
    w = hero.clientWidth; h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    uniforms.uScale.value = h * .42;
  };
  resize();
  addEventListener('resize', resize);

  /* ---------- input ---------- */
  let mx = 0, my = 0, tx = 0, ty = 0;
  addEventListener('mousemove', (e) => {
    mx = (e.clientX / innerWidth - .5) * 2; my = (e.clientY / innerHeight - .5) * 2;
  }, { passive: true });

  /* ---------- loop ---------- */
  let visible = true, raf = 0, last = performance.now(), t = 0;
  const target = new THREE.Vector3(0, 0, -12);
  const loop = (now) => {
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    tx += (mx - tx) * .04; ty += (my - ty) * .04;
    const sy = scrollY;
    camera.position.x = tx * 1.6;
    camera.position.y = -ty * 1.0 - sy * .004;
    camera.position.z = -sy * .006;
    camera.lookAt(target.x + tx * .4, target.y - ty * .2, target.z);
    uniforms.uTime.value = t;
    uniforms.uFocus.value = 11 + Math.sin(t * .18) * 3;          /* the focus breathes slowly */
    if (!document.body.classList.contains('is-loading')) uniforms.uFade.value = Math.min(1, uniforms.uFade.value + dt * .6);
    renderer.render(scene, camera);
    if (visible) raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  /* debug/inspection hook: render one frame on demand */
  window.__lumeHero = { frame: (fade) => { if (fade != null) uniforms.uFade.value = fade; uniforms.uTime.value += .016; renderer.render(scene, camera); return renderer.info.render.frame; }, uniforms };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) { last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
  }).observe(hero);
}
