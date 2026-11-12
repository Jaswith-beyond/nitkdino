/* Shared app state */
const App = window.App = {
  t: 0, reduced: false, scrollY: 0, vh: window.innerHeight, mx: 0, my: 0,
  fIdx: 0, fp: 0, boosted: 0, onBoot: null, onGame: null
};
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const easeOut3 = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeIO = t => { t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

const World = (function () {
  if (!window.THREE) return null;
  const canvas = document.getElementById('world');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  } catch (e) { return null; }

  const PR = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(PR);
  renderer.setClearColor(0x050505, 1);
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  scene.environment = V.env(renderer);
  const cam = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);

  /* ---------- materials ---------- */
  const mDino = V.chrome({ color: 0xe6e8ec, roughness: 0.16 });
  const mCactus = V.chrome({ color: 0xb4b7bc, roughness: 0.32 });
  const mCloud = new THREE.MeshBasicMaterial({ color: 0xbfc2c6, transparent: true, opacity: 0.5 });
  const mLogo = V.chrome({ color: 0xf4f5f7, roughness: 0.12, emissive: 0xffffff, emissiveIntensity: 0 });
  const mMount = new THREE.MeshStandardMaterial({ color: 0x0f0f10, metalness: 0.6, roughness: 0.5, emissive: 0x040404 });

  /* ---------- lights ---------- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.04));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-6, 9, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 3.2); rim.position.set(9, 5, -10); scene.add(rim);
  const pl = new THREE.PointLight(0xffffff, 1.4, 20); pl.position.set(0, 5, 3); scene.add(pl);

  /* ---------- floor ---------- */
  const floorMat = new THREE.ShaderMaterial({
    extensions: { derivatives: true },
    uniforms: { uOff: { value: 0 }, uMode: { value: new THREE.Vector3(1, 0, 0) }, uCam: { value: new THREE.Vector3() }, uFar: { value: 110 }, uBoot: { value: 0 } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: [
      'varying vec3 vW; uniform float uOff,uFar,uBoot; uniform vec3 uMode,uCam;',
      'float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }',
      'float ln(float x,float w){ float f=abs(fract(x-.5)-.5); float fw=fwidth(x); return 1.-smoothstep(0.,fw*w,f); }',
      'void main(){',
      '  vec2 p=vec2(vW.x+uOff,vW.z);',
      '  float dist=length(vW-uCam);',
      '  float fog=1.-smoothstep(uFar*.18,uFar,dist);',
      '  vec2 q=floor(p*2.);',
      '  float sp=step(.962,hash(q))*.5+step(.994,hash(q+7.3))*.55;',
      '  float band=step(.5,hash(floor(p*.25)))*.03;',
      '  vec3 desert=vec3(.045+band)+vec3(sp);',
      '  float g1=max(ln(p.x/2.,1.1),ln(p.y/2.,1.1));',
      '  float g2=max(ln(p.x/10.,1.8),ln(p.y/10.,1.8));',
      '  vec3 lab=vec3(.018)+vec3(g1*.2+g2*.55);',
      '  float pool=exp(-dot(vW.xz,vW.xz)*.011);',
      '  vec3 stage=vec3(.012)+vec3(pool*.2)+vec3(g2*.07*pool+g1*.03*pool);',
      '  vec3 col=desert*uMode.x+lab*uMode.y+stage*uMode.z;',
      '  float lane=smoothstep(.07,.0,abs(vW.z+1.25))*step(.45,fract(p.x*.35));',
      '  float lane2=smoothstep(.05,.0,abs(vW.z-1.9))*step(.7,fract(p.x*.2+.3));',
      '  col+=(lane*.9+lane2*.35)*uMode.x;',
      '  float scan=smoothstep(0.,1.,uBoot*3.-length(vW.xz)*.05);',
      '  col*=fog*clamp(scan,0.,1.);',
      '  gl_FragColor=vec4(col,1.);',
      '}'
    ].join('\n')
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  /* ---------- sun ---------- */
  const sunMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uI: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: [
      'varying vec2 vUv; uniform float uT,uI;',
      'void main(){',
      '  vec2 p=vUv-.5; float r=length(p);',
      '  float disk=smoothstep(.34,.335,r);',
      '  float k=-p.y; float keep=p.y>=0.?1.:step(clamp(k*1.9,0.,1.),fract(p.y*20.+uT*.15));',
      '  float halo=exp(-r*7.)*.45+exp(-r*22.)*.35;',
      '  vec3 c=mix(vec3(.62,.64,.68),vec3(1.),smoothstep(-.3,.3,p.y));',
      '  float a=disk*keep;',
      '  gl_FragColor=vec4(c*(a*1.25+halo)*uI,1.);',
      '}'
    ].join('\n')
  });
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), sunMat);
  sun.position.set(46, 15, -62);
  scene.add(sun);

  /* ---------- far voxel skyline ---------- */
  const mCount = 84, mountains = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mMount, mCount);
  const dm = new THREE.Object3D();
  for (let i = 0; i < mCount; i++) {
    const a = (-175 + Math.random() * 200) * Math.PI / 180, R = 96 + Math.random() * 14;
    const w = 4 + Math.random() * 6, h = 3 + Math.pow(Math.random(), 1.6) * 20;
    dm.position.set(Math.cos(a) * R, h / 2 - 0.2, Math.sin(a) * R);
    dm.rotation.y = -a; dm.scale.set(w, h, w); dm.updateMatrix();
    mountains.setMatrixAt(i, dm.matrix);
  }
  mountains.frustumCulled = false;
  const mountG = new THREE.Group(); mountG.add(mountains); scene.add(mountG);

  /* ---------- stars + dust ---------- */
  function pixPoints(n, spawn, sizeMin, sizeMax) {
    const pos = new Float32Array(n * 3), s = new Float32Array(n), ph = new Float32Array(n);
    for (let i = 0; i < n; i++) { const p = spawn(); pos.set(p, i * 3); s[i] = sizeMin + Math.random() * (sizeMax - sizeMin); ph[i] = Math.random(); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aS', new THREE.BufferAttribute(s, 1));
    g.setAttribute('aP', new THREE.BufferAttribute(ph, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uPx: { value: PR }, uI: { value: 1 } },
      vertexShader: 'attribute float aS; attribute float aP; uniform float uT,uPx; varying float vA; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=aS*uPx*clamp(60./(-mv.z),.6,1.6); vA=.4+.6*sin(uT*1.6+aP*40.); }',
      fragmentShader: 'varying float vA; uniform float uI; void main(){ gl_FragColor=vec4(vec3(1.),vA*uI); }'
    });
    return new THREE.Points(g, m);
  }
  const stars = pixPoints(700, () => {
    const u = Math.random() * Math.PI * 2, v = Math.random() * 0.48 + 0.04, r = 170;
    return [Math.cos(u) * Math.cos(v) * r, Math.sin(v) * r, Math.sin(u) * Math.cos(v) * r];
  }, 2, 4.2);
  scene.add(stars);
  const dust = pixPoints(340, () => [(Math.random() - 0.35) * 110, 0.3 + Math.random() * 9, (Math.random() - 0.5) * 30], 2.2, 4.5);
  dust.material.uniforms.uI.value = 0.55;
  const dustG = new THREE.Group(); dustG.add(dust); scene.add(dustG);
  const dustArr = dust.geometry.attributes.position.array;

  /* ---------- dino ---------- */
  const dino = V.dino(mDino, 0.12);
  scene.add(dino.group);

  /* ---------- decorative cacti + clouds ---------- */
  const deco = [];
  function reroll(o) {
    o.x += 135;
    const side = Math.random() < 0.5 ? -1 : 1;
    o.z = side * (3.4 + Math.random() * 16);
  }
  for (let i = 0; i < 24; i++) {
    const c = V.cactus(mCactus, 0.9 + Math.random() * 1.4, Math.random() < 0.55);
    const o = { obj: c, x: (Math.random() * 2 - 0.45) * 65, z: 0, y: 0, sf: 1, born: 0.7 + Math.random() * 2.3, cloud: false };
    o.z = (Math.random() < 0.5 ? -1 : 1) * (3.4 + Math.random() * 16);
    c.rotation.y = Math.random() * 6;
    scene.add(c); deco.push(o);
  }
  for (let i = 0; i < 10; i++) {
    const c = V.cloud(mCloud);
    const s = 0.8 + Math.random() * 1.2;
    c.scale.setScalar(s);
    deco.push({ obj: c, x: (Math.random() * 2 - 0.4) * 70, z: -22 - Math.random() * 40, y: 7 + Math.random() * 9, sf: 0.1 + Math.random() * 0.1, born: 1.0 + Math.random() * 2, cloud: true });
    scene.add(c);
  }

  /* ---------- lane obstacles (the playable cacti) ---------- */
  const lane = [];
  for (let i = 0; i < 8; i++) {
    const k = 1 + Math.floor(Math.random() * 3), h = 1.0 + Math.random() * 0.7;
    const g = new THREE.Group();
    for (let j = 0; j < k; j++) {
      const c = V.cactus(mCactus, h * (0.85 + Math.random() * 0.25), j % 2 === 0);
      c.position.x = (j - (k - 1) / 2) * 0.62; g.add(c);
    }
    g.visible = false; scene.add(g);
    lane.push({ obj: g, x: 0, w: 0.34 + (k - 1) * 0.62, h: h, on: false, passed: false });
  }

  /* ---------- hero logo + finale emblem (voxel assembly) ---------- */
  const logo = V.textVox('MOSPHATE', 0.26, 3, mLogo, 1, 46);
  const logoG = new THREE.Group(); logoG.add(logo.mesh); logoG.position.set(0, 7.1, -8); scene.add(logoG);

  const mEmb = V.chrome({ color: 0xffffff, roughness: 0.1, emissive: 0xffffff, emissiveIntensity: 0.06 });
  const emb = V.textVox('MOSPHATE', 0.5, 3, mEmb, 1, 70);
  const embG = new THREE.Group(); embG.add(emb.mesh);
  embG.position.set(52, 12.5, -11); embG.rotation.y = -Math.PI / 2; scene.add(embG);
  emb.set(0);
  const EN = 1700, embPts = V.textPoints('MOSPHATE', 0.5, 1).pts;
  const eStart = new Float32Array(EN * 3), eEnd = new Float32Array(EN * 3), eR = new Float32Array(EN), ePos = new Float32Array(EN * 3);
  for (let i = 0; i < EN; i++) {
    const p = embPts[Math.floor(Math.random() * embPts.length)];
    eEnd[i * 3] = p[0] + (Math.random() - 0.5) * 0.4; eEnd[i * 3 + 1] = p[1] + (Math.random() - 0.5) * 0.4; eEnd[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
    eStart[i * 3] = (Math.random() - 0.5) * 120; eStart[i * 3 + 1] = (Math.random() - 0.5) * 70; eStart[i * 3 + 2] = (Math.random() - 0.5) * 120;
    eR[i] = Math.random();
  }
  const eGeo = new THREE.BufferGeometry();
  eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
  const eMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.42, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const ePts = new THREE.Points(eGeo, eMat); ePts.frustumCulled = false; embG.add(ePts);
  let lastEa = -1;

  /* ---------- post-processing ---------- */
  let composer = null, bloom = null, fin = null;
  const finU = {
    tDiffuse: { value: null }, uTime: { value: 0 }, uPix: { value: 1 }, uAb: { value: 0.0012 }, uVig: { value: 0.5 },
    uScan: { value: 0.1 }, uGrain: { value: 0.035 }, uRes: { value: new THREE.Vector2(1, 1) }, uExp: { value: 1.0 }
  };
  try {
    if (THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass && THREE.ShaderPass) {
      const sz = renderer.getDrawingBufferSize(new THREE.Vector2());
      const opts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
      let rt;
      if (renderer.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget) { rt = new THREE.WebGLMultisampleRenderTarget(sz.x, sz.y, opts); rt.samples = 4; }
      else rt = new THREE.WebGLRenderTarget(sz.x, sz.y, opts);
      composer = new THREE.EffectComposer(renderer, rt);
      composer.addPass(new THREE.RenderPass(scene, cam));
      bloom = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.55, 0.65, 0.82);
      composer.addPass(bloom);
      fin = new THREE.ShaderPass({
        uniforms: finU,
        vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: [
          'uniform sampler2D tDiffuse; uniform float uTime,uPix,uAb,uVig,uScan,uGrain,uExp; uniform vec2 uRes; varying vec2 vUv;',
          'float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }',
          'void main(){',
          '  vec2 uv=vUv;',
          '  if(uPix>1.01){ vec2 g=uRes/uPix; uv=(floor(uv*g)+.5)/g; }',
          '  vec2 d=uv-.5; float ab=uAb*(.5+dot(d,d)*3.);',
          '  vec3 c; c.r=texture2D(tDiffuse,uv+d*ab).r; c.g=texture2D(tDiffuse,uv).g; c.b=texture2D(tDiffuse,uv-d*ab).b;',
          '  c*=uExp;',
          '  c=(c*(2.51*c+.03))/(c*(2.43*c+.59)+.14);',
          '  c=pow(clamp(c,0.,1.),vec3(1./2.2));',
          '  float sl=step(.5,fract(gl_FragCoord.y/3.)); c*=1.-uScan*(1.-sl);',
          '  c*=1.-uVig*dot(d,d)*2.2;',
          '  c+=(h(uv*uRes+uTime)-.5)*uGrain;',
          '  float l=dot(c,vec3(.299,.587,.114)); c=mix(vec3(l),c,.12)*vec3(.985,.995,1.);',
          '  gl_FragColor=vec4(c,1.);',
          '}'
        ].join('\n')
      });
      composer.addPass(fin);
    }
  } catch (e) { composer = null; }

  /* ---------- chapters ---------- */
  const KF = [
    { p: [1.5, 2.3, 11.5], t: [0.2, 3.0, 0],  m: [1, 0, 0],     s: 1.0,  b: 0.55 },
    { p: [-5.5, 1.7, 6.2], t: [2.2, 1.5, 0],  m: [.15, .85, 0], s: 0.8,  b: 0.5 },
    { p: [0, 2.6, 15],     t: [0, 2, 0],      m: [0, .15, .85], s: 0.25, b: 0.4 },
    { p: [-9, 2.6, 10],    t: [0, 2, 0],      m: [0, .05, .95], s: 0.25, b: 0.4 },
    { p: [6, 6.5, 9],      t: [1, 0.2, -2],   m: [0, 1, 0],     s: 0.5,  b: 0.5 },
    { p: [1, 1.3, 7.5],    t: [7, 1.6, 0],    m: [.85, .15, 0], s: 1.3,  b: 0.6 },
    { p: [-4.5, 3.4, 10.5],t: [0, 2.2, -3],   m: [0, .9, .1],   s: 0.5,  b: 0.45 },
    { p: [-10, 2.2, 0.8],  t: [30, 4, -7],    m: [1, 0, 0],     s: 2.0,  b: 0.9 }
  ];
  const cur = { p: new THREE.Vector3(1.5, 2.3, 11.5), t: new THREE.Vector3(0, 2, 0) };
  const want = { p: new THREE.Vector3(), t: new THREE.Vector3(), m: new THREE.Vector3(), s: 1, b: 0.5 };

  /* ---------- game ---------- */
  const G = { state: 'idle', score: 0, hi: 0, spawn: 1.5, dead: 0, nextMile: 100, lastShown: -1 };
  try { G.hi = parseInt(localStorage.getItem('mosphate-hi') || '0', 10) || 0; } catch (e) {}
  let dy = 0, vy = 0, air = false, ph = 0, deadTilt = 0, flash = 0, shake = 0, slammed = false;
  const boot = { t: 0, done: false };

  function emit() { if (App.onGame) App.onGame(G.state, Math.floor(G.score), G.hi); }
  function resetLane() { lane.forEach(o => { o.on = false; o.obj.visible = false; }); }
  function jump() {
    if (!boot.done) return;
    if (G.state === 'dead') {
      if (G.dead < 0.55) return;
      G.state = 'run'; G.score = 0; G.nextMile = 100; G.spawn = 1.2; resetLane(); emit();
    } else if (G.state === 'idle') {
      G.state = 'run'; G.score = 0; G.nextMile = 100; G.spawn = 1.3; emit();
    }
    if (!air) { vy = 10.2; air = true; SFX.jump(); }
  }
  function die() {
    G.state = 'dead'; G.dead = 0; flash = 0.8; shake = 0.2; SFX.over();
    const s = Math.floor(G.score);
    if (s > G.hi) { G.hi = s; try { localStorage.setItem('mosphate-hi', String(s)); } catch (e) {} }
    emit();
  }

  /* ---------- resize ---------- */
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    cam.aspect = w / h; cam.updateProjectionMatrix();
    if (composer) { composer.setPixelRatio(PR); composer.setSize(w, h); bloom.setSize(w, h); }
    const dbs = renderer.getDrawingBufferSize(new THREE.Vector2());
    finU.uRes.value.set(dbs.x, dbs.y);
  }
  resize();

  /* ---------- frame ---------- */
  const tmpV = new THREE.Vector3();
  function frame(dt, t) {
    const reduced = App.reduced;
    if (!boot.done) {
      boot.t += dt * (reduced ? 20 : 1);
      if (boot.t >= 4.3) { boot.done = true; document.body.classList.add('booted'); }
      if (App.onBoot) App.onBoot(boot.t);
    }
    const bt = boot.done ? 99 : boot.t;

    /* chapter blend */
    const f = clamp(App.fIdx, 0, KF.length - 1), i0 = Math.floor(f), i1 = Math.min(i0 + 1, KF.length - 1), k = smooth(f - i0);
    const A = KF[i0], B = KF[i1];
    const aspect = cam.aspect, fitK = clamp(1.3 / aspect, 1, 2.2);
    tmpV.set(lerp(A.t[0], B.t[0], k), lerp(A.t[1], B.t[1], k), lerp(A.t[2], B.t[2], k));
    want.t.copy(tmpV);
    want.p.set(lerp(A.p[0], B.p[0], k), lerp(A.p[1], B.p[1], k), lerp(A.p[2], B.p[2], k));
    want.p.sub(want.t).multiplyScalar(fitK).add(want.t);
    want.m.set(lerp(A.m[0], B.m[0], k), lerp(A.m[1], B.m[1], k), lerp(A.m[2], B.m[2], k));
    want.s = lerp(A.s, B.s, k); want.b = lerp(A.b, B.b, k);

    /* speed */
    const heroVis = App.scrollY < App.vh * 0.85;
    let spd = 9 * want.s * (reduced ? 0.4 : 1);
    if (App.boosted > 0) { spd *= 1 + App.boosted * 3; App.boosted = Math.max(0, App.boosted - dt * 0.8); }
    if (G.state === 'run') spd *= 1 + Math.min(G.score / 500, 0.7);
    if (G.state === 'dead') spd *= Math.max(0.05, 1 - G.dead * 3);
    const bootSpd = bt < 99 ? easeOut3((bt - 0.45) / 1.6) : 1;
    spd *= bootSpd;
    floorMat.uniforms.uOff.value = (floorMat.uniforms.uOff.value + spd * dt) % 2000;

    /* camera */
    if (!boot.done) {
      const e = easeIO(bt / 3.9);
      const off = new THREE.Vector3().copy(want.p).sub(want.t);
      off.applyAxisAngle(new THREE.Vector3(0, 1, 0), (1 - e) * -1.1);
      off.multiplyScalar(lerp(0.34, 1, e));
      off.y += (1 - e) * -0.4;
      const tg = new THREE.Vector3(0, 1.3, 0).lerp(want.t, e);
      cur.t.copy(tg); cur.p.copy(tg).add(off);
    } else {
      const d = 1 - Math.exp(-dt * (reduced ? 8 : 2.6));
      cur.p.lerp(want.p, d); cur.t.lerp(want.t, d);
    }
    const par = reduced ? 0 : 1;
    cam.position.copy(cur.p);
    cam.position.x += App.mx * 0.9 * par + Math.sin(t * 0.37) * 0.18 * par;
    cam.position.y += -App.my * 0.45 * par + Math.sin(t * 0.51) * 0.1 * par;
    if (shake > 0) { cam.position.x += (Math.random() - 0.5) * shake; cam.position.y += (Math.random() - 0.5) * shake; shake = Math.max(0, shake - dt * 0.5); }
    cam.lookAt(cur.t);
    cam.fov = 50 + (spd > 14 ? Math.min((spd - 14) * 0.9, 9) : 0);
    cam.updateProjectionMatrix();

    /* floor + modes */
    const modeMul = bt < 99 ? clamp((bt - 0.3) / 1.6, 0, 1) : 1;
    floorMat.uniforms.uMode.value.copy(want.m).multiplyScalar(modeMul);
    floorMat.uniforms.uCam.value.copy(cam.position);
    floorMat.uniforms.uBoot.value = bt < 99 ? clamp(bt / 2.6, 0, 1) : 1;

    /* sun */
    const sunK = smooth((App.fIdx - 6.0) / 1.0);
    sun.position.set(lerp(46, 92, sunK), lerp(15, 13, sunK), lerp(-62, -12, sunK));
    sun.lookAt(cam.position);
    sunMat.uniforms.uT.value = t;
    sunMat.uniforms.uI.value = lerp(1, 0.28, want.m.z) * clamp((bt - 0.8) / 1.5, 0, 1);

    mountG.rotation.y += dt * 0.004 * spd;

    /* dust + stars */
    stars.material.uniforms.uT.value = t; dust.material.uniforms.uT.value = t;
    stars.material.uniforms.uI.value = clamp((bt - 0.6) / 1.5, 0, 1);
    for (let i = 0; i < dustArr.length; i += 3) {
      dustArr[i] -= spd * dt * 1.15;
      if (dustArr[i] < -40) dustArr[i] += 110;
    }
    dust.geometry.attributes.position.needsUpdate = true;
    dustG.position.x = -App.mx * 1.4 * par; dustG.position.y = App.my * 0.5 * par;

    /* deco */
    for (let i = 0; i < deco.length; i++) {
      const o = deco[i];
      o.x -= spd * dt * o.sf;
      if (o.x < -62) { if (o.cloud) o.x += 135; else reroll(o); }
      const s = bt < 99 ? easeOut3((bt - o.born) / 0.8) : 1;
      o.obj.position.set(o.x, o.y, o.z);
      const sc = o.cloud ? (o.obj.userData.s || (o.obj.userData.s = o.obj.scale.x)) : 1;
      o.obj.scale.setScalar(Math.max(0.0001, s * sc));
    }

    /* dino */
    dino.assemble(bt < 99 ? easeOut3((bt - 0.15) / 1.1) : 1);
    if (air) { vy -= 26 * dt; dy += vy * dt; if (dy <= 0) { dy = 0; vy = 0; air = false; } }
    ph += dt * spd * 1.05;
    dino.pose(ph, air, false, t);
    dino.group.position.y = dy;
    deadTilt = lerp(deadTilt, G.state === 'dead' ? -0.45 : 0, 1 - Math.exp(-dt * 10));
    dino.group.rotation.z = deadTilt;
    pl.position.set(dino.group.position.x + 0.5, 5 + dy, 3);

    /* game */
    if (G.state !== 'idle' && !heroVis) { G.state = 'idle'; resetLane(); emit(); }
    if (G.state === 'run') {
      G.score += dt * spd * 1.15;
      G.spawn -= dt;
      if (G.spawn <= 0) {
        const free = lane.filter(o => !o.on);
        if (free.length) {
          const o = free[Math.floor(Math.random() * free.length)];
          o.on = true; o.passed = false; o.x = 38; o.obj.visible = true;
        }
        G.spawn = (1.15 + Math.random() * 1.1) * (9 / Math.max(spd, 6)) + 0.45;
      }
      if (G.score >= G.nextMile) { G.nextMile += 100; SFX.point(); emit(); }
      const s = Math.floor(G.score);
      if (s !== G.lastShown) { G.lastShown = s; emit(); }
    } else if (G.state === 'dead') G.dead += dt;
    for (let i = 0; i < lane.length; i++) {
      const o = lane[i];
      if (!o.on) continue;
      if (G.state !== 'idle') o.x -= spd * dt;
      o.obj.position.set(o.x, 0, 0);
      if (o.x < -14) { o.on = false; o.obj.visible = false; continue; }
      if (G.state === 'run' && Math.abs(o.x - 0.15) < (o.w / 2 + 0.55) && dy < o.h * 0.86) die();
    }

    /* logo (boot assembly + slam) */
    const la = bt < 99 ? easeIO((bt - 1.5) / 2.1) : 1;
    logo.set(la);
    if (bt >= 3.6 && !slammed) { slammed = true; flash = 1; shake = 0.35; SFX.slam(); }
    if (bt < 99 && !slammed && la > 0.6) mLogo.emissiveIntensity = (la - 0.6) * 0.5;
    else mLogo.emissiveIntensity = lerp(mLogo.emissiveIntensity, 0.12, 1 - Math.exp(-dt * 3));
    logoG.position.y = 7.1 + Math.sin(t * 0.8) * 0.12;

    /* finale emblem */
    const ea = smooth((App.fp - 0.06) / 0.7);
    if (ea !== lastEa) {
      lastEa = ea;
      emb.set(ea);
      for (let i = 0; i < EN; i++) {
        const kk = easeOut3(clamp(ea * 1.5 - eR[i] * 0.5, 0, 1));
        ePos[i * 3] = lerp(eStart[i * 3], eEnd[i * 3], kk);
        ePos[i * 3 + 1] = lerp(eStart[i * 3 + 1], eEnd[i * 3 + 1], kk);
        ePos[i * 3 + 2] = lerp(eStart[i * 3 + 2], eEnd[i * 3 + 2], kk);
      }
      eGeo.attributes.position.needsUpdate = true;
      eMat.opacity = ea <= 0 ? 0 : (1 - smooth((ea - 0.55) / 0.4)) * 0.85;
      mEmb.emissiveIntensity = 0.06 + smooth((ea - 0.85) / 0.15) * 0.55;
    }
    const es = clamp(0.95 / aspect, 1, 2.3);
    embG.scale.setScalar(es);

    /* post */
    flash = Math.max(0, flash - dt * 1.6);
    if (bloom) bloom.strength = want.b + flash * 1.6;
    finU.uTime.value = t;
    finU.uPix.value = bt < 3.5 ? 1 + (1 - easeOut3(bt / 3.4)) * 26 : 1;
    finU.uAb.value = 0.0012 + flash * 0.012 + Math.max(0, spd - 12) * 0.00018;
    finU.uScan.value = reduced ? 0.04 : 0.1;
    finU.uGrain.value = reduced ? 0.015 : 0.035;
    finU.uExp.value = 1.0 + flash * 0.25;

    if (composer) composer.render(dt); else renderer.render(scene, cam);
  }

  return { frame, resize, jump, G, boot, emit, KF, canvas };
})();
