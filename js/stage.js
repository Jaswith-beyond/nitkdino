/* Interactive 3D stages: mascot studio + packaging void. Own renderers, own orbit, safe asset fallbacks. */
const Stages = (function () {
  if (!window.THREE) return null;
  const list = [];

  function Orbit(canvas, o) {
    const s = { th: o.th, ph: o.ph, r: o.r, tx: o.t[0], ty: o.t[1], tz: o.t[2] };
    const g = Object.assign({}, s);
    let drag = false, lx = 0, ly = 0, idle = 0;
    canvas.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; ly = e.clientY; idle = 0; try { canvas.setPointerCapture(e.pointerId); } catch (x) {} });
    canvas.addEventListener('pointermove', e => {
      if (!drag) return;
      g.th -= (e.clientX - lx) * 0.008;
      g.ph = clamp(g.ph - (e.clientY - ly) * 0.006, 0.3, 1.65);
      lx = e.clientX; ly = e.clientY; idle = 0;
    });
    const up = () => { drag = false; idle = 0; };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', e => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      g.r = clamp(g.r * Math.exp(e.deltaY * 0.0016), o.min, o.max); idle = 0;
    }, { passive: false });
    return {
      s, g,
      zoom(k) { g.r = clamp(g.r * k, o.min, o.max); idle = 0; },
      go(p) { Object.assign(g, p); idle = -2; },
      update(dt, cam, auto) {
        idle += dt;
        if (auto && !drag && idle > 2.5 && !App.reduced) g.th += dt * 0.25;
        const d = 1 - Math.exp(-dt * 5.5);
        for (const k in s) s[k] += (g[k] - s[k]) * d;
        cam.position.set(s.tx + s.r * Math.sin(s.ph) * Math.sin(s.th), s.ty + s.r * Math.cos(s.ph), s.tz + s.r * Math.sin(s.ph) * Math.cos(s.th));
        cam.lookAt(s.tx, s.ty, s.tz);
      }
    };
  }

  function coneMat(a) {
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uA: { value: a } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec2 vUv; void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'varying vec3 vN; varying vec3 vV; varying vec2 vUv; uniform float uA; void main(){ float f=pow(abs(dot(normalize(vN),normalize(vV))),1.6); float a=f*pow(vUv.y,1.5)*uA; gl_FragColor=vec4(vec3(1.),a); }'
    });
  }
  function poolMat(a) {
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uA: { value: a } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'varying vec2 vUv; uniform float uA; void main(){ vec2 p=vUv-.5; float r=length(p)*2.; float ring=smoothstep(.02,0.,abs(r-.62))*.5+smoothstep(.015,0.,abs(r-.9))*.3+smoothstep(.01,0.,abs(r-.3))*.25; float pool=exp(-r*r*3.2)*.6; gl_FragColor=vec4(vec3(1.),(pool+ring)*(1.-smoothstep(.85,1.,r))*uA); }'
    });
  }
  function motes(n, w, h) {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * w; pos[i * 3 + 1] = Math.random() * h; pos[i * 3 + 2] = (Math.random() - 0.5) * w; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
    p.userData = { h, arr: pos };
    return p;
  }
  function stepMotes(p, dt) {
    const a = p.userData.arr, h = p.userData.h;
    for (let i = 1; i < a.length; i += 3) { a[i] += dt * 0.12; if (a[i] > h) a[i] = 0; }
    p.geometry.attributes.position.needsUpdate = true;
  }

  function base(canvas, frame, fov) {
    let r;
    try { r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); } catch (e) { return null; }
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.15;
    r.outputEncoding = THREE.sRGBEncoding;
    r.setClearColor(0x030303, 1);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030303);
    scene.fog = new THREE.FogExp2(0x030303, 0.03);
    scene.environment = V.env(r);
    const cam = new THREE.PerspectiveCamera(fov || 36, 1, 0.1, 100);
    const st = { r, scene, cam, visible: false, frame, resize() {
      const w = frame.clientWidth, h = frame.clientHeight;
      r.setSize(w, h, false); cam.aspect = w / Math.max(1, h); cam.updateProjectionMatrix();
    } };
    st.resize();
    if (window.ResizeObserver) new ResizeObserver(() => st.resize()).observe(frame);
    if (window.IntersectionObserver) new IntersectionObserver(es => { st.visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(frame);
    else st.visible = true;
    list.push(st);
    return st;
  }

  /* ---------- optional external model (GLB) with safe fallback ---------- */
  function trySwapModel(url, parent, procedural, targetH, onDone) {
    if (!url || !THREE.GLTFLoader) return;
    try {
      new THREE.GLTFLoader().load(url, gltf => {
        const m = gltf.scene, bb = new THREE.Box3().setFromObject(m), sz = bb.getSize(new THREE.Vector3());
        const sc = targetH / Math.max(0.001, sz.y), c = bb.getCenter(new THREE.Vector3());
        m.scale.setScalar(sc); m.position.set(-c.x * sc, -bb.min.y * sc, -c.z * sc);
        parent.add(m); procedural.visible = false; if (onDone) onDone();
      }, undefined, () => { /* missing file: keep the procedural mascot */ });
    } catch (e) {}
  }

  /* ================= MASCOT STUDIO ================= */
  function mascot(cfg) {
    const canvas = document.getElementById('mascotCanvas'), frame = document.getElementById('mascotFrame');
    const st = base(canvas, frame, 34); if (!st) return null;
    const { scene, cam } = st;
    const mat = V.chrome({ color: 0xe9ebee, roughness: 0.14, envMapIntensity: 1.25 });
    const pivot = new THREE.Group(); scene.add(pivot);
    const d = V.dino(mat, 0.13); pivot.add(d.group);
    const proc = d.group;
    const mir = V.dino(mat, 0.13); mir.group.scale.y = -1; pivot.add(mir.group);
    const ext = new THREE.Group(); pivot.add(ext);
    d.assemble(0); mir.assemble(0);

    const fl = new THREE.Mesh(new THREE.CircleGeometry(16, 64), new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.9, roughness: 0.3, transparent: true, opacity: 0.8, envMapIntensity: 0.5 }));
    fl.rotation.x = -Math.PI / 2; fl.position.y = 0.001; scene.add(fl);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(13, 13), poolMat(1)); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.01; scene.add(pool);

    const spot = new THREE.SpotLight(0xffffff, 3.2, 0, 0.42, 0.9, 1); spot.position.set(0, 11, 0.5); spot.target.position.set(0, 1, 0); scene.add(spot, spot.target);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(3.2, 11, 40, 1, true), coneMat(0.34)); cone.position.set(0, 5.5, 0); scene.add(cone);
    const r1 = new THREE.DirectionalLight(0xffffff, 2.6); r1.position.set(6, 4, -6); scene.add(r1);
    const r2 = new THREE.DirectionalLight(0xffffff, 2.0); r2.position.set(-6, 3, -5); scene.add(r2);
    const f1 = new THREE.DirectionalLight(0xffffff, 0.5); f1.position.set(0, 2, 8); scene.add(f1);
    const mo = motes(160, 9, 8); scene.add(mo);

    const orb = Orbit(canvas, { th: 0.9, ph: 1.32, r: 9, t: [0, 1.4, 0], min: 3, max: 15 });
    const presets = {
      front: { th: Math.PI / 2, ph: 1.4, r: 9.2, tx: 0, ty: 1.4, tz: 0 },
      side:  { th: 0, ph: 1.4, r: 9.2, tx: 0, ty: 1.4, tz: 0 },
      rear:  { th: -Math.PI / 2, ph: 1.4, r: 9.2, tx: 0, ty: 1.4, tz: 0 },
      close: { th: 1.15, ph: 1.4, r: 3.2, tx: 0.9, ty: 2.3, tz: 0 }
    };
    let reveal = 0, started = false, t0 = 0;
    st.update = function (dt, t) {
      if (!started && st.visible) { started = true; t0 = t; }
      if (started && reveal < 1) reveal = clamp((t - t0) / (App.reduced ? 0.2 : 2.4), 0, 1);
      const a = easeIO(reveal);
      d.assemble(a); mir.assemble(a);
      spot.intensity = 3.2 * smooth(reveal * 1.4); cone.material.uniforms.uA.value = 0.34 * smooth(reveal * 1.4 - 0.2);
      d.pose(0, false, true, t); mir.pose(0, false, true, t);
      stepMotes(mo, dt);
      orb.update(dt, cam, true);
      st.r.render(scene, cam);
    };
    trySwapModel(cfg.model, ext, proc, 2.8, () => { mir.group.visible = false; const s = document.getElementById('mSlot'); if (s) s.textContent = 'MEDIA SLOT: GLB'; });
    return { st, orb, presets };
  }

  /* ================= PACKAGING VOID ================= */
  function faceTexture(kind, cfgUrl) {
    const W = kind === 'side' ? 1024 : 1024, H = kind === 'side' ? 512 : 384;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 8;
    function draw() {
      ctx.fillStyle = '#0b0b0c'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.05)';
      for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) ctx.fillRect(x + 7, y + 7, 2, 2);
      ctx.strokeStyle = '#c0c0c0'; ctx.lineWidth = 3; ctx.strokeRect(14, 14, W - 28, H - 28);
      ctx.fillStyle = '#c0c0c0';
      const px = (rows, x, y, s) => rows.forEach((row, r) => { for (let c = 0; c < row.length; c++) if (row[c] === '#') ctx.fillRect(x + c * s, y + r * s, s, s); });
      if (kind === 'front') {
        const s = 11; px(V.DINO_BODY, 40, 40, s); px(V.DINO_LEG, 40 + 6 * s, 40 + 16 * s, s); px(V.DINO_LEG, 40 + 10 * s, 40 + 16 * s, s);
        ctx.fillStyle = '#fff'; ctx.textBaseline = 'alphabetic';
        ctx.font = '800 108px Syne, sans-serif'; ctx.fillText('MOSPHATE', 330, 190);
        ctx.fillStyle = '#c0c0c0'; ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillText('BEYOND THE PIXELS.', 334, 240);
        ctx.fillStyle = '#8b8e93'; ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText('[ EDITION - TBD ]', 334, 300);
      } else if (kind === 'back') {
        ctx.fillStyle = '#fff'; ctx.font = '14px "Press Start 2P", monospace'; ctx.fillText('MOSPHATE_OS', 50, 70);
        ctx.fillStyle = '#8b8e93'; ctx.font = '11px "Press Start 2P", monospace';
        ['[ PACKAGING DETAILS - PLACEHOLDER ]', '[ CONTENTS - PLACEHOLDER ]', '[ CARE NOTES - PLACEHOLDER ]'].forEach((l, i) => ctx.fillText(l, 50, 130 + i * 40));
        ctx.fillStyle = '#c0c0c0';
        for (let i = 0; i < 46; i++) ctx.fillRect(560 + i * 8, 220, (i * 7 % 3) + 2, 90);
        ctx.fillStyle = '#8b8e93'; ctx.font = '9px "Press Start 2P", monospace'; ctx.fillText('[ BARCODE - PLACEHOLDER ]', 560, 335);
      } else {
        ctx.fillStyle = '#c0c0c0';
        for (let i = 0; i < 4; i++) px(V.DINO_BODY, 40 + i * 250, 130, 5);
        ctx.fillStyle = '#fff'; ctx.font = '800 56px Syne, sans-serif'; ctx.fillText('MOSPHATE', 40, 90);
        ctx.fillStyle = '#8b8e93'; ctx.font = '11px "Press Start 2P", monospace'; ctx.fillText('STAY CONNECTED, STAY LIMITLESS.', 40, 440);
      }
      tex.needsUpdate = true;
    }
    draw();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    if (cfgUrl) {
      new THREE.TextureLoader().load(cfgUrl, t => { t.encoding = THREE.sRGBEncoding; tex.image = t.image; tex.needsUpdate = true; }, undefined, () => {});
    }
    return tex;
  }

  function packaging(cfg, ui) {
    const canvas = document.getElementById('packCanvas'), frame = document.getElementById('packFrame');
    const st = base(canvas, frame, 38); if (!st) return null;
    const { scene, cam } = st;
    scene.fog = new THREE.FogExp2(0x030303, 0.022);
    const Wd = 3.0, Hd = 1.1, Dd = 2.2, T = 0.07;
    const carbon = new THREE.MeshStandardMaterial({ color: 0x131314, metalness: 0.7, roughness: 0.38 });
    const silver = V.chrome({ color: 0xcfd1d5, roughness: 0.22 });
    const tF = faceTexture('front', cfg.front), tB = faceTexture('back', cfg.back), tS = faceTexture('side');
    const mk = t => new THREE.MeshStandardMaterial({ map: t, metalness: 0.35, roughness: 0.42 });
    const mF = mk(tF), mBk = mk(tB), mS = mk(tS);

    const root = new THREE.Group(); scene.add(root);
    const bx = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);

    // tray base + foam
    const baseP = bx(Wd, T, Dd, carbon); baseP.position.y = T / 2; root.add(baseP);
    const foam = bx(Wd - 0.3, 0.06, Dd - 0.3, new THREE.MeshStandardMaterial({ color: 0x08080a, roughness: 0.95, metalness: 0 })); foam.position.y = T + 0.03; root.add(foam);

    // folding walls (pivot at bottom edge)
    const walls = [];
    const wall = (w, rotAxis, sgn, px, pz) => {
      const gr = new THREE.Group(); gr.position.set(px, T, pz);
      const m = bx(w, Hd, 0.05, carbon); m.position.y = Hd / 2;
      const trim = bx(w, 0.04, 0.07, silver); trim.position.y = Hd; gr.add(m, trim);
      if (rotAxis === 'z') gr.rotation.y = Math.PI / 2;
      root.add(gr); walls.push({ gr, axis: rotAxis, sgn, px, pz });
    };
    wall(Wd, 'x', 1, 0, Dd / 2); wall(Wd, 'x', -1, 0, -Dd / 2);
    wall(Dd, 'z', -1, Wd / 2, 0); wall(Dd, 'z', 1, -Wd / 2, 0);

    // sleeve (four slabs) + lid cap, slides as one
    const sleeve = new THREE.Group(); root.add(sleeve);
    const sh = Hd * 0.98, ex = 0.09, sw = Wd + ex * 2, sd = Dd + ex * 2;
    const slabMats = (front, back, side) => [side, side, carbon, carbon, front, back];
    const sFront = bx(sw, sh, 0.06, slabMats(mF, mBk, mS)); sFront.position.set(0, sh / 2 + T, sd / 2);
    const sBack = bx(sw, sh, 0.06, slabMats(mF, mBk, mS)); sBack.position.set(0, sh / 2 + T, -sd / 2);
    const sR = bx(0.06, sh, sd, slabMats(mF, mBk, mS)); sR.position.set(sw / 2, sh / 2 + T, 0);
    const sL = bx(0.06, sh, sd, slabMats(mF, mBk, mS)); sL.position.set(-sw / 2, sh / 2 + T, 0);
    const lid = bx(sw + 0.06, 0.07, sd + 0.06, [carbon, carbon, mS, carbon, carbon, carbon]); lid.position.y = sh + T + 0.03;
    const edge = bx(sw + 0.1, 0.03, sd + 0.1, silver); edge.position.y = sh + T + 0.07;
    sleeve.add(sFront, sBack, sR, sL, lid, edge);

    // mascot inside
    const mat = V.chrome({ color: 0xe9ebee, roughness: 0.14 });
    const dn = V.dino(mat, 0.12); const dg = dn.group; dg.rotation.y = 0; root.add(dg);
    const ext = new THREE.Group(); root.add(ext);

    // void dressing
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), poolMat(0.9)); halo.rotation.x = -Math.PI / 2; halo.position.y = -1.7; scene.add(halo);
    const spot = new THREE.SpotLight(0xffffff, 0, 0, 0.5, 0.9, 1); spot.position.set(0, 12, 1); spot.target.position.set(0, 1, 0); scene.add(spot, spot.target);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(3.4, 13, 40, 1, true), coneMat(0)); cone.position.set(0, 6.2, 0); scene.add(cone);
    const r1 = new THREE.DirectionalLight(0xffffff, 2.2); r1.position.set(6, 3, -6); scene.add(r1);
    const r2 = new THREE.DirectionalLight(0xffffff, 1.6); r2.position.set(-7, 4, 4); scene.add(r2);
    const mo = motes(190, 12, 9); mo.position.y = -2; scene.add(mo);

    const orb = Orbit(canvas, { th: 0.5, ph: 1.28, r: 11.5, t: [0, 1.3, 0], min: 5, max: 18 });
    const P = {
      front: { th: 0, ph: 1.32, r: 10.5, tx: 0, ty: 1.2, tz: 0 },
      back:  { th: Math.PI, ph: 1.32, r: 10.5, tx: 0, ty: 1.2, tz: 0 },
      side:  { th: Math.PI / 2, ph: 1.32, r: 10.5, tx: 0, ty: 1.2, tz: 0 },
      exploded: { th: 0.75, ph: 1.2, r: 15, tx: 0, ty: 2.4, tz: 0 }
    };
    const S = { u: 0, e: 0, uT: 0, eT: 0, manual: null };
    function setUnbox(v) { S.manual = v; S.uT = v; if (v === 0) S.eT = 0; }
    function setExplode(v) { S.eT = v; if (v) { S.manual = 1; S.uT = 1; } }

    st.update = function (dt, t) {
      // scroll-linked unboxing unless the person took manual control
      const rc = document.getElementById('packaging').getBoundingClientRect();
      const sp = clamp((App.vh * 0.72 - rc.top) / (rc.height * 0.5), 0, 1);
      if (S.manual === null) S.uT = sp;
      else if (rc.bottom < 0 || rc.top > App.vh) { S.manual = null; }
      const d = 1 - Math.exp(-dt * 3.2);
      S.u += (S.uT - S.u) * d; S.e += (S.eT - S.e) * d;
      const u = easeIO(S.u), e = easeIO(S.e);

      root.position.y = 0.15 + Math.sin(t * 1.25) * 0.09 * (App.reduced ? 0 : 1);
      root.rotation.z = Math.sin(t * 0.7) * 0.012 * (App.reduced ? 0 : 1);
      sleeve.position.y = u * 3.8 + e * 1.2;
      walls.forEach(w => {
        const ang = smooth(u * 1.4 - 0.25) * 1.5;
        w.gr.position.x = w.px + (w.axis === 'z' ? w.sgn * -1 * e * 0.6 : 0);
        w.gr.position.z = w.pz + (w.axis === 'x' ? w.sgn * e * 0.6 : 0);
        if (w.axis === 'x') { w.gr.rotation.x = w.sgn * ang; w.gr.rotation.z = 0; }
        else { w.gr.rotation.x = 0; w.gr.rotation.z = w.sgn * ang; }
      });
      foam.position.y = T + 0.03 - e * 0.25;
      const rise = smooth(u * 1.5 - 0.35);
      const sc = lerp(0.36, 0.66, rise);
      dg.scale.setScalar(sc / 1);
      dg.position.set(0, T + 0.06 + rise * 1.05 + e * 1.4, 0);
      dg.rotation.y = rise * (t * 0.45);
      dn.assemble(1); dn.pose(0, false, true, t);
      spot.intensity = 3.4 * smooth(u * 1.3 - 0.1); cone.material.uniforms.uA.value = 0.36 * smooth(u * 1.3 - 0.1);
      halo.material.uniforms.uA.value = 0.7 + u * 0.5;
      stepMotes(mo, dt);
      orb.update(dt, cam, true);
      if (ui) ui(u, e);
      st.r.render(scene, cam);
    };
    trySwapModel(cfg.model, ext, root, 3.0, () => {});
    return { st, orb, presets: P, setUnbox, setExplode, S };
  }

  function frame(dt, t) { for (let i = 0; i < list.length; i++) if (list[i].visible && list[i].update) list[i].update(dt, t); }
  return { mascot, packaging, frame, list };
})();
