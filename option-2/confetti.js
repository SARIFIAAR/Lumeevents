/* LUME — Concept 2: the celebration. A 3D confetti-and-petal burst behind the whole page. */
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.170.0/three.module.min.js';

const canvas = document.getElementById('silk');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (canvas && !reduced) init();

function init() {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { canvas.remove(); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, .1, 60);
  camera.position.set(0, 0, 10);

  const mobile = innerWidth < 900;
  const COUNT = mobile ? 260 : 720;
  const H = 16, W = 22, ZN = -8, ZF = 4;

  /* one small rectangle, instanced */
  const base = new THREE.PlaneGeometry(.22, .48, 1, 2);
  const geo = new THREE.InstancedBufferGeometry().copy(base);
  geo.instanceCount = COUNT;
  const offset = new Float32Array(COUNT * 3), dir = new Float32Array(COUNT * 3), axis = new Float32Array(COUNT * 3),
        phase = new Float32Array(COUNT), speed = new Float32Array(COUNT), size = new Float32Array(COUNT),
        tint = new Float32Array(COUNT), kind = new Float32Array(COUNT);
  let s = 7;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < COUNT; i++) {
    offset[i * 3] = (rnd() - .5) * W; offset[i * 3 + 1] = (rnd() - .5) * H; offset[i * 3 + 2] = ZN + rnd() * (ZF - ZN);
    /* cannon direction: up and out, in a fan */
    const a = (rnd() - .5) * 1.5, up = .5 + rnd() * .9;
    dir[i * 3] = Math.sin(a) * 1.6; dir[i * 3 + 1] = up * 1.9; dir[i * 3 + 2] = (rnd() - .5) * 1.2;
    const ax = new THREE.Vector3(rnd() - .5, rnd() - .5, rnd() - .5).normalize();
    axis[i * 3] = ax.x; axis[i * 3 + 1] = ax.y; axis[i * 3 + 2] = ax.z;
    phase[i] = rnd() * Math.PI * 2; speed[i] = .5 + rnd() * 1.2;
    kind[i] = rnd() < .38 ? 1 : 0;                  /* 1 = petal, 0 = strip */
    size[i] = (kind[i] ? 1.1 : .8) + rnd() * .8;
    tint[i] = rnd();
  }
  geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offset, 3));
  geo.setAttribute('aDir', new THREE.InstancedBufferAttribute(dir, 3));
  geo.setAttribute('aAxis', new THREE.InstancedBufferAttribute(axis, 3));
  geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1));
  geo.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(speed, 1));
  geo.setAttribute('aSize', new THREE.InstancedBufferAttribute(size, 1));
  geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 1));
  geo.setAttribute('aKind', new THREE.InstancedBufferAttribute(kind, 1));

  const uniforms = {
    uTime: { value: 0 }, uIntro: { value: 0 },
    uFall: { value: .9 }, uFallT: { value: .9 },
    uMouse: { value: new THREE.Vector3(0, 0, 0) },
    uA: { value: new THREE.Color(.055, .23, .19) }, uB: { value: new THREE.Color(.95, .84, .8) }, uC: { value: new THREE.Color(.85, .70, .42) },
    uAT: { value: new THREE.Color(.055, .23, .19) }, uBT: { value: new THREE.Color(.95, .84, .8) },
    uScroll: { value: 0 }, uAlpha: { value: 0 }, uH: { value: H },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, side: THREE.DoubleSide, depthWrite: false,
    vertexShader: `
      attribute vec3 aOffset, aDir, aAxis; attribute float aPhase, aSpeed, aSize, aTint, aKind;
      uniform float uTime, uIntro, uFall, uScroll, uH; uniform vec3 uMouse;
      varying vec2 vUv; varying float vTint, vKind, vLight;
      mat3 rot(vec3 a, float t){ float c=cos(t), s=sin(t), o=1.0-c;
        return mat3(o*a.x*a.x+c, o*a.x*a.y+a.z*s, o*a.x*a.z-a.y*s,
                    o*a.x*a.y-a.z*s, o*a.y*a.y+c, o*a.y*a.z+a.x*s,
                    o*a.x*a.z+a.y*s, o*a.y*a.z-a.x*s, o*a.z*a.z+c); }
      void main(){
        vUv = uv; vTint = aTint; vKind = aKind;
        float t = uTime;
        /* resting drift: slow fall with sway */
        vec3 p = aOffset;
        p.y = mod(p.y - t * aSpeed * .45 * uFall + uH * .5 + uScroll * 2.5, uH) - uH * .5;
        p.x += sin(t * .6 * aSpeed + aPhase) * .5;
        p.z += cos(t * .4 + aPhase) * .3;
        /* cannon burst from the bottom centre, blended into the drift */
        float e = 1.0 - pow(1.0 - uIntro, 3.0);
        vec3 burst = vec3(0.0, -7.5, -2.0) + aDir * e * 7.5 + vec3(0.0, -e * e * 2.5, 0.0);
        p = mix(burst, p, smoothstep(.15, 1.0, uIntro));
        /* the cursor pushes them away */
        vec3 d = p - uMouse; float dl = length(d.xy);
        p.xy += normalize(d.xy + .001) * exp(-dl * dl * .5) * 1.4;
        /* tumble */
        float ang = t * (1.2 + aSpeed) + aPhase + (1.0 - e) * 12.0;
        mat3 R = rot(normalize(aAxis), ang);
        vec3 local = position * aSize;
        if (aKind > .5) local.y *= .85;                      /* petals are rounder */
        vec3 n = R * vec3(0.0, 0.0, 1.0);
        vec3 world = p + R * local;
        vLight = abs(dot(n, normalize(vec3(.3, .6, 1.0))));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
      }`,
    fragmentShader: `
      precision highp float;
      uniform vec3 uA, uB, uC; uniform float uAlpha, uScroll;
      varying vec2 vUv; varying float vTint, vKind, vLight;
      void main(){
        /* petal mask: a soft rounded leaf; strips stay rectangular */
        vec2 c = vUv - .5;
        float petal = 1.0 - smoothstep(.42, .5, length(vec2(c.x * 1.15, c.y * (1.0 + .25 * sign(c.y)))));
        float mask = mix(1.0, petal, vKind);
        if (mask < .02) discard;
        vec3 col = vTint < .4 ? uA : (vTint < .75 ? uB : uC);
        /* metallic sheen on strips, matte on petals */
        float sheen = mix(pow(vLight, 3.0) * .9, vLight * .25, vKind);
        col = col * (.65 + vLight * .45) + sheen;
        /* past the hero the confetti steps back so text stays legible */
        float dim = mix(1.0, .42, smoothstep(.25, 1.0, uScroll));
        gl_FragColor = vec4(col, mask * uAlpha * dim);
      }`
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  scene.add(mesh);

  const resize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
  resize(); addEventListener('resize', resize);

  /* mouse in world units on the z = 0 plane */
  let mx = 0, my = 0;
  addEventListener('mousemove', (e) => {
    const nx = (e.clientX / innerWidth - .5) * 2, ny = -(e.clientY / innerHeight - .5) * 2;
    const hh = Math.tan((camera.fov * Math.PI / 180) / 2) * camera.position.z;
    mx = nx * hh * camera.aspect; my = ny * hh;
  }, { passive: true });

  window.__silk = {
    set: ({ a, b, amp }) => { if (a) uniforms.uAT.value.setRGB(a[0], a[1], a[2]); if (b) uniforms.uBT.value.setRGB(b[0], b[1], b[2]); if (amp != null) uniforms.uFallT.value = amp; },
    frame: () => { uniforms.uAlpha.value = 1; uniforms.uIntro.value = 1; renderer.render(scene, camera); },
  };

  let last = performance.now(), t = 0, started = false;
  const loop = (now) => {
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    uniforms.uTime.value = t;
    uniforms.uMouse.value.lerp(new THREE.Vector3(mx, my, 0), .08);
    uniforms.uFall.value += (uniforms.uFallT.value - uniforms.uFall.value) * .04;
    uniforms.uA.value.lerp(uniforms.uAT.value, .04); uniforms.uB.value.lerp(uniforms.uBT.value, .04);
    uniforms.uScroll.value += ((scrollY / innerHeight) - uniforms.uScroll.value) * .08;
    if (!document.body.classList.contains('is-loading') || !document.querySelector('.curtain')) started = true;
    if (started) {
      uniforms.uAlpha.value = Math.min(1, uniforms.uAlpha.value + dt * 1.5);
      uniforms.uIntro.value = Math.min(1, uniforms.uIntro.value + dt * .38);   /* the cannon takes ~2.6 s to settle */
    }
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
