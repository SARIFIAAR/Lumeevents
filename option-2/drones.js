/* LUME — Concept 2: the drone show. A swarm of lights that flies into formations as you scroll. */
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.170.0/three.module.min.js';

const canvas = document.getElementById('silk');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (canvas && !reduced) init();

function init() {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { canvas.remove(); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, .1, 60);
  camera.position.set(0, 0, 10);
  const HH = Math.tan((45 * Math.PI / 180) / 2) * 10;   /* half height of the view at z=0, ≈4.14 */

  const mobile = innerWidth < 900;
  const N = mobile ? 700 : 1500;
  let s = 3;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;

  /* ---------- formations ---------- */
  const F = {};
  const pad = (pts) => { const out = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const p = pts[i % pts.length]; out[i * 3] = p[0]; out[i * 3 + 1] = p[1]; out[i * 3 + 2] = p[2] || 0; } return out; };
  const aspect = () => innerWidth / innerHeight;

  F.swarm = () => { const pts = []; const W = HH * aspect() * 1.1; for (let i = 0; i < N; i++) pts.push([(rnd() - .5) * 2 * W, (rnd() - .5) * 2 * HH * 1.1, (rnd() - .5) * 3]); return pad(pts); };
  F.rings = () => { const pts = []; const R = 2.1; for (let k = 0; k < 2; k++) { const cx = k ? 1.05 : -1.05; for (let i = 0; i < N / 2; i++) { const a = (i / (N / 2)) * Math.PI * 2; const r = R + (i % 3) * .11; pts.push([cx + Math.cos(a) * r, Math.sin(a) * r, (rnd() - .5) * .3]); } } return pad(pts); };
  F.heart = () => { const pts = []; const M = Math.floor(N / 6); for (let layer = 0; layer < 6; layer++) { const sc = .32 + layer * .136; for (let i = 0; i < M; i++) { const t = (i / M) * Math.PI * 2; const x = 16 * Math.pow(Math.sin(t), 3), y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); pts.push([x / 16 * 2.9 * sc, (y / 16 * 2.9 + .3) * sc, (rnd() - .5) * .4]); } } return pad(pts); };
  F.burj = () => {
    /* a simplified Burj Khalifa: tapering tiers and a spire, drawn as columns of lights */
    const pts = []; const tiers = [[-3.6, -1.9, 1.5, 1.25], [-1.9, -.4, 1.05, .85], [-.4, 1.0, .68, .5], [1.0, 2.1, .36, .22], [2.1, 2.9, .14, .08]];
    tiers.forEach(([y0, y1, w0, w1]) => { const rows = Math.max(6, Math.round((y1 - y0) * 14)); for (let r = 0; r <= rows; r++) { const f = r / rows, y = y0 + (y1 - y0) * f, w = w0 + (w1 - w0) * f; const cols = Math.max(2, Math.round(w * 9)); for (let c = 0; c <= cols; c++) { const x = -w + (2 * w) * (c / cols); if (c === 0 || c === cols || r % 3 === 0) pts.push([x, y, (rnd() - .5) * .3]); } } });
    for (let i = 0; i <= 30; i++) pts.push([0, 2.9 + i * .033, 0]);
    /* ground line */
    for (let i = 0; i < 40; i++) pts.push([-3.2 + i * .164, -3.75, 0]);
    return pad(pts);
  };
  F.burst = () => { const pts = []; const rays = 28; for (let r = 0; r < rays; r++) { const a = (r / rays) * Math.PI * 2 + (r % 2) * .05; const len = 2.2 + (r % 2) * 1.0; const n = Math.round(len * 9); for (let i = 0; i <= n; i++) { const d = .35 + (i / n) * len; pts.push([Math.cos(a) * d, Math.sin(a) * d, (rnd() - .5) * .5]); } } for (let i = 0; i < 90; i++) { const a = i / 90 * Math.PI * 2; pts.push([Math.cos(a) * 3.55, Math.sin(a) * 3.55, 0]); } return pad(pts); };
  F.lume = () => {
    const c = document.createElement('canvas'); c.width = 420; c.height = 140; const g = c.getContext('2d');
    g.fillStyle = '#000'; g.font = '800 128px "Bricolage Grotesque", "Arial Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('LUME', 210, 72);
    const d = g.getImageData(0, 0, c.width, c.height).data; const pts = [];
    for (let y = 0; y < c.height; y += 4) for (let x = 0; x < c.width; x += 4) if (d[(y * c.width + x) * 4 + 3] > 128) pts.push([(x - 210) / 210 * 3.9 * aspect() * .9, -(y - 70) / 70 * 1.3, (rnd() - .5) * .3]);
    return pts.length ? pad(pts) : F.swarm();
  };

  /* ---------- geometry ---------- */
  const pos = new Float32Array(N * 3), size = new Float32Array(N), phase = new Float32Array(N), lag = new Float32Array(N), tint = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (rnd() - .5) * 2; pos[i * 3 + 1] = -HH - 2 - rnd() * 6; pos[i * 3 + 2] = 0; size[i] = .7 + rnd() * .9; phase[i] = rnd() * 6.28; lag[i] = rnd(); tint[i] = rnd(); }
  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(pos, 3); posAttr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', posAttr);
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  geo.setAttribute('aTint', new THREE.BufferAttribute(tint, 1));
  const uniforms = {
    uTime: { value: 0 }, uAlpha: { value: 0 }, uScale: { value: 1 }, uDim: { value: 1 },
    uA: { value: new THREE.Color(.80, .62, .30) }, uB: { value: new THREE.Color(.97, .86, .78) },
    uAT: { value: new THREE.Color(.80, .62, .30) }, uBT: { value: new THREE.Color(.97, .86, .78) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, depthTest: false,
    vertexShader: `
      attribute float aSize, aPhase, aTint; uniform float uTime, uScale;
      varying float vBlink, vTint;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vBlink = .75 + .25 * sin(uTime * 2.2 + aPhase * 7.0);
        vTint = aTint;
        gl_PointSize = aSize * uScale * 30.0 / -mv.z * 10.0;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      precision highp float;
      uniform vec3 uA, uB; uniform float uAlpha, uDim;
      varying float vBlink, vTint;
      void main(){
        float d = length(gl_PointCoord - .5) * 2.0;
        float core = 1.0 - smoothstep(.22, .40, d);      /* the LED */
        float halo = (1.0 - smoothstep(.25, 1.0, d)) * .75; /* its glow */
        vec3 col = mix(uA, uB, vTint * .18);
        float a = max(core, halo * (vTint < .5 ? 1.0 : .75)) * vBlink * uAlpha * uDim;
        gl_FragColor = vec4(mix(uB, col, core), a);
      }`
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  /* ---------- state ---------- */
  const OFFSET = { rings: [-1.6, 0, .92], heart: [-1.7, 0, .95], burj: [-1.7, .1, .92], burst: [-1.6, 0, .9], lume: [0, 1.15, .8] };
  let target = F.swarm(), current = 'swarm', intro = 0;
  const swarmBase = target.slice();
  const resize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); uniforms.uScale.value = innerHeight / 850; if (current === 'swarm' || current === 'lume') setForm(current, true); };
  resize(); addEventListener('resize', resize);

  function setForm(name, force) {
    if (!F[name] || (name === current && !force)) return;
    current = name; target = F[name]();
    const o = OFFSET[name];
    if (o && (innerWidth > 900 || name === 'lume')) for (let i = 0; i < N; i++) { target[i * 3] = target[i * 3] * o[2] + (innerWidth > 900 ? o[0] : 0); target[i * 3 + 1] = target[i * 3 + 1] * o[2] + o[1]; }
    if (name === 'swarm') swarmBase.set(target);
  }
  if (document.fonts) document.fonts.ready.then(() => { if (current === 'lume') setForm('lume', true); });

  let mx = 0, my = 0, tx = 0, ty = 0;
  addEventListener('mousemove', (e) => { mx = (e.clientX / innerWidth - .5) * 2; my = -(e.clientY / innerHeight - .5) * 2; }, { passive: true });

  window.__silk = {
    set: ({ a, b, amp }) => { if (a) uniforms.uAT.value.setRGB(a[0], a[1], a[2]); if (b) uniforms.uBT.value.setRGB(b[0], b[1], b[2]); if (amp != null) uniforms.uDim.value = Math.min(1, amp); },
    form: setForm,
    frame: (snap) => { uniforms.uAlpha.value = 1; intro = 1; if (snap) { pos.set(target); posAttr.needsUpdate = true; } renderer.render(scene, camera); },
  };

  let last = performance.now(), t = 0;
  const loop = (now) => {
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    uniforms.uTime.value = t;
    uniforms.uA.value.lerp(uniforms.uAT.value, .04); uniforms.uB.value.lerp(uniforms.uBT.value, .04);
    tx += (mx - tx) * .04; ty += (my - ty) * .04;
    camera.position.x = tx * .6; camera.position.y = ty * .4; camera.lookAt(0, 0, 0);
    const started = !document.body.classList.contains('is-loading') || !document.querySelector('.curtain');
    if (started) { uniforms.uAlpha.value = Math.min(1, uniforms.uAlpha.value + dt); intro = Math.min(1, intro + dt * .5); }
    const swarm = current === 'swarm';
    for (let i = 0; i < N; i++) {
      const k = i * 3, l = lag[i];
      let gx = target[k], gy = target[k + 1], gz = target[k + 2];
      if (swarm) { gx = swarmBase[k] + Math.sin(t * (.3 + l * .4) + phase[i]) * .9; gy = swarmBase[k + 1] + Math.cos(t * (.25 + l * .3) + phase[i] * 1.7) * .7; }
      else { gx += Math.sin(t * 1.3 + phase[i]) * .05; gy += Math.cos(t * 1.1 + phase[i]) * .05; }
      const e = (swarm ? .025 : .035) + l * .03;   /* every drone has its own lag, so they arrive as a wave */
      pos[k] += (gx - pos[k]) * e; pos[k + 1] += (gy - pos[k + 1]) * e; pos[k + 2] += (gz - pos[k + 2]) * e;
    }
    posAttr.needsUpdate = true;
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
