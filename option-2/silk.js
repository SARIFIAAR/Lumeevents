/* LUME — Concept 2: the silk. A single 3D ribbon behind the whole page. */
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
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 50);
  camera.position.set(0, 0, 7.5);

  const mobile = innerWidth < 900;
  const geo = new THREE.PlaneGeometry(14, 4.2, mobile ? 120 : 260, mobile ? 30 : 60);
  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: .9 }, uAmpT: { value: .9 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uA: { value: new THREE.Color(.055, .23, .19) }, uB: { value: new THREE.Color(.95, .84, .8) },
    uAT: { value: new THREE.Color(.055, .23, .19) }, uBT: { value: new THREE.Color(.95, .84, .8) },
    uScroll: { value: 0 },
    uAlpha: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, side: THREE.DoubleSide, depthWrite: false,
    vertexShader: `
      uniform float uTime, uAmp, uScroll; uniform vec2 uMouse;
      varying vec2 vUv; varying float vH; varying vec3 vN;
      /* simplex-ish noise */
      vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
      vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
      vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
      float snoise(vec2 v){
        const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
        vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
        vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
        vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod289(i);
        vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
        vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0); m=m*m; m=m*m;
        vec3 x=2.0*fract(p*C.www)-1.0; vec3 h=abs(x)-0.5; vec3 ox=floor(x+0.5); vec3 a0=x-ox;
        m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
        vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw; return 130.0*dot(m,g);
      }
      float surf(vec2 p, float t){
        float w = sin(p.x * .9 + t * .6) * .55;
        w += snoise(vec2(p.x * .45 + t * .12, p.y * .9 - t * .08)) * .7;
        w += snoise(vec2(p.x * 1.6 - t * .2, p.y * 2.2)) * .12;
        return w;
      }
      void main(){
        vUv = uv;
        vec3 p = position;
        float t = uTime;
        float h = surf(p.xy, t) * uAmp;
        /* the cursor presses the silk */
        float d = distance(p.xy * vec2(.28, 1.0), uMouse * vec2(2.0, 1.4));
        h += -exp(-d * d * 3.0) * .6 * uAmp;
        p.z = h;
        /* normal by finite differences for the sheen */
        float e = .05;
        float hx = surf(p.xy + vec2(e, 0.), t) * uAmp, hy = surf(p.xy + vec2(0., e), t) * uAmp;
        vN = normalize(vec3(-(hx - h) / e, -(hy - h) / e, 1.0));
        vH = h;
        /* ribbon twists slightly as you scroll */
        float ang = uScroll * .35;
        p.y += uScroll * .6;
        float c = cos(ang), s = sin(ang);
        p.yz = mat2(c, -s, s, c) * p.yz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      precision highp float;
      uniform vec3 uA, uB; uniform float uAlpha;
      varying vec2 vUv; varying float vH; varying vec3 vN;
      void main(){
        vec3 L = normalize(vec3(.4, .8, 1.0));
        float diff = clamp(dot(vN, L), 0.0, 1.0);
        float spec = pow(clamp(dot(reflect(-L, vN), vec3(0., 0., 1.)), 0.0, 1.0), 28.0);
        float mixv = smoothstep(-.9, .9, vH) * .7 + vUv.x * .3;
        vec3 col = mix(uA, uB, mixv);
        col = col * (.72 + diff * .38) + spec * .35;
        /* soft edges so the ribbon fades into the page */
        float edge = smoothstep(0.0, .18, vUv.y) * smoothstep(1.0, .82, vUv.y);
        gl_FragColor = vec4(col, edge * uAlpha);
      }`
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -.35; mesh.rotation.z = -.18; mesh.position.y = -.4;
  scene.add(mesh);

  const resize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
  resize(); addEventListener('resize', resize);

  let mx = 0, my = 0;
  addEventListener('mousemove', (e) => { mx = (e.clientX / innerWidth - .5) * 2; my = -(e.clientY / innerHeight - .5) * 2; }, { passive: true });

  window.__silk = {
    set: ({ a, b, amp }) => { if (a) uniforms.uAT.value.setRGB(a[0], a[1], a[2]); if (b) uniforms.uBT.value.setRGB(b[0], b[1], b[2]); if (amp != null) uniforms.uAmpT.value = amp; },
    frame: () => { uniforms.uAlpha.value = 1; renderer.render(scene, camera); },
  };

  let last = performance.now(), t = 0;
  const loop = (now) => {
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    uniforms.uTime.value = t;
    uniforms.uMouse.value.lerp(new THREE.Vector2(mx, my), .05);
    uniforms.uAmp.value += (uniforms.uAmpT.value - uniforms.uAmp.value) * .04;
    uniforms.uA.value.lerp(uniforms.uAT.value, .04); uniforms.uB.value.lerp(uniforms.uBT.value, .04);
    uniforms.uScroll.value += ((scrollY / innerHeight) - uniforms.uScroll.value) * .08;
    if (!document.body.classList.contains('is-loading')) uniforms.uAlpha.value = Math.min(1, uniforms.uAlpha.value + dt * .8);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
