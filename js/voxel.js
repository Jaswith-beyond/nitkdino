/* Procedural voxel kit: chrome dino, cacti, clouds, pixel font, studio environment. */
const V = {};

V.DINO_BODY = [
  "...............#######",
  "..............########",
  "..............##.#####",
  "..............########",
  "..............########",
  "..............#####...",
  "..............#######.",
  "#............#####....",
  "#...........######....",
  "##.........########...",
  "###.......#########.#.",
  ".###....############..",
  "..############.#......",
  "...###########........",
  "....##########........",
  ".....########........."
];
V.DINO_LEG = ["##..", "##..", "##..", "###.", "####"];

V.FONT = {
  M: ["#...#", "##.##", "#.#.#", "#...#", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"]
};

/* Procedural studio environment: dark room with hot softboxes. This is what makes metal read as chrome. */
V.env = function (renderer) {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x020203);
  const box = (w, h, x, y, z, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(i, i, i), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  };
  box(22, 4, 0, 11, 0, 6);        // overhead strip
  box(3, 16, -12, 3, 2, 4.2);     // left tall
  box(3, 16, 12, 3, -2, 4.2);     // right tall
  box(26, 2, 0, 3, -13, 3.2);     // back rim strip
  box(10, 2, 0, -2, 12, 1.4);     // low front fill
  box(2, 10, 8, 4, 10, 2.2);
  box(30, 30, 0, -14, 0, 0.05);   // dim floor bounce
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.015);
  pm.dispose();
  return rt.texture;
};

V.chrome = function (o) {
  return new THREE.MeshStandardMaterial(Object.assign({ color: 0xdfe2e6, metalness: 1, roughness: 0.2 }, o || {}));
};

/* Instanced voxel cloud with a scatter->assemble animation (a = 0..1). */
V.make = function (cells, geo, mat, spread) {
  const n = cells.length;
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  mesh.frustumCulled = false;
  const rs = new Float32Array(n * 4);
  const col = new THREE.Color();
  for (let i = 0; i < n; i++) {
    rs[i * 4] = (Math.random() - 0.5) * spread;
    rs[i * 4 + 1] = (Math.random() - 0.1) * spread * 0.7;
    rs[i * 4 + 2] = (Math.random() - 0.5) * spread;
    rs[i * 4 + 3] = Math.random();
    const b = 0.86 + Math.random() * 0.14;
    mesh.setColorAt(i, col.setRGB(b, b, b));
  }
  const o = new THREE.Object3D();
  let last = -1;
  const api = {
    mesh, n,
    set(a) {
      a = Math.max(0, Math.min(1, a));
      if (a === last) return;
      last = a;
      for (let i = 0; i < n; i++) {
        const c = cells[i];
        const k = Math.max(0, Math.min(1, a * 1.7 - rs[i * 4 + 3] * 0.7));
        const e = 1 - Math.pow(1 - k, 3);
        o.position.set(rs[i * 4] * (1 - e) + c[0] * e, rs[i * 4 + 1] * (1 - e) + c[1] * e, rs[i * 4 + 2] * (1 - e) + c[2] * e);
        o.scale.setScalar(a >= 1 ? 1 : Math.max(0.0001, e));
        o.updateMatrix();
        mesh.setMatrixAt(i, o.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.visible = a > 0.001;
    }
  };
  api.set(1);
  return api;
};

V.dino = function (mat, vox) {
  vox = vox || 0.12;
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(vox * 0.94, vox * 0.94, vox * 0.94);
  const yb = 5 * vox, B = V.DINO_BODY, bc = [];
  B.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] !== '#') continue;
      for (let d = 0; d < 6; d++) bc.push([(c - 11) * vox, yb + (B.length - r - 0.5) * vox, (d - 2.5) * vox]);
    }
  });
  const body = V.make(bc, geo, mat, 9);
  const bodyG = new THREE.Group();
  bodyG.add(body.mesh);
  g.add(bodyG);
  const L = V.DINO_LEG, lc = [];
  L.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] !== '#') continue;
      for (let d = 0; d < 3; d++) lc.push([c * vox + vox * 0.5, -(r + 0.5) * vox, (d - 1) * vox]);
    }
  });
  const mk = (x, z) => {
    const gr = new THREE.Group();
    gr.position.set(x, yb, z);
    const p = V.make(lc, geo, mat, 6);
    gr.add(p.mesh); g.add(gr);
    return { g: gr, p };
  };
  const A = mk((6 - 11) * vox, -vox * 1.1), Bq = mk((10 - 11) * vox, vox * 1.1);
  return {
    group: g, vox, yb, bodyG, legA: A.g, legB: Bq.g,
    parts: [body, A.p, Bq.p],
    height: (B.length + 5) * vox,
    assemble(a) { this.parts.forEach(p => p.set(a)); },
    /* ph = run phase, air = airborne, idle = standing on a stage */
    pose(ph, air, idle, t) {
      if (idle) {
        this.legA.rotation.z = 0; this.legB.rotation.z = 0;
        this.legA.position.y = yb; this.legB.position.y = yb;
        this.bodyG.position.y = Math.sin(t * 1.6) * vox * 0.2;
        this.bodyG.rotation.z = 0;
        return;
      }
      if (air) {
        this.legA.rotation.z = 0.55; this.legB.rotation.z = -0.45;
        this.legA.position.y = yb; this.legB.position.y = yb;
        this.bodyG.position.y = 0; this.bodyG.rotation.z = 0.07;
        return;
      }
      const s = Math.sin(ph), c = Math.cos(ph);
      this.legA.rotation.z = s * 0.75;
      this.legB.rotation.z = -s * 0.75;
      this.legA.position.y = yb + Math.max(0, c) * vox * 0.7;
      this.legB.position.y = yb + Math.max(0, -c) * vox * 0.7;
      this.bodyG.position.y = Math.abs(s) * vox * 0.5;
      this.bodyG.rotation.z = Math.sin(ph * 2) * 0.014;
    }
  };
};

V._ub = null;
V.cactus = function (mat, h, arms) {
  V._ub = V._ub || new THREE.BoxGeometry(1, 1, 1);
  const g = new THREE.Group(), w = 0.34;
  const box = (sx, sy, sz, x, y, z) => {
    const m = new THREE.Mesh(V._ub, mat);
    m.scale.set(sx, sy, sz); m.position.set(x, y, z); g.add(m);
  };
  box(w, h, w, 0, h / 2, 0);
  if (arms) {
    const ay = h * 0.52;
    box(0.3, 0.2, 0.2, -0.27, ay, 0); box(0.2, 0.5, 0.2, -0.42, ay + 0.15, 0);
    box(0.3, 0.2, 0.2, 0.27, ay - 0.22, 0); box(0.2, 0.42, 0.2, 0.42, ay - 0.1, 0);
  }
  return g;
};

V.cloud = function (mat) {
  V._ub = V._ub || new THREE.BoxGeometry(1, 1, 1);
  const g = new THREE.Group();
  [[-1.2, 0, 3.2], [-2.4, 0.34, 6], [-0.6, 0.68, 3.4], [-3.4, 0.0, 1.6]].forEach(r => {
    const m = new THREE.Mesh(V._ub, mat);
    m.scale.set(r[2], 0.34, 0.7); m.position.set(r[0] + r[2] / 2, r[1], 0); g.add(m);
  });
  return g;
};

/* Pixel font -> points (centered). sub>1 subdivides each font pixel for denser text. */
V.textPoints = function (str, vox, sub) {
  sub = sub || 1;
  const pts = [], v = vox / sub;
  let x = 0;
  for (const ch of str) {
    const rows = V.FONT[ch];
    rows.forEach((row, r) => {
      for (let i = 0; i < row.length; i++) {
        if (row[i] !== '#') continue;
        for (let a = 0; a < sub; a++) for (let b = 0; b < sub; b++)
          pts.push([(x + i) * vox + a * v, (6 - r) * vox + b * v]);
      }
    });
    x += 6;
  }
  const w = (x - 1) * vox;
  return { pts: pts.map(p => [p[0] - w / 2, p[1] - 3.5 * vox]), w, v };
};

V.textVox = function (str, vox, depth, mat, sub, spread) {
  const t = V.textPoints(str, vox, sub);
  const cells = [];
  t.pts.forEach(p => { for (let d = 0; d < depth; d++) cells.push([p[0], p[1], (d - (depth - 1) / 2) * t.v]); });
  const geo = new THREE.BoxGeometry(t.v * 0.9, t.v * 0.9, t.v * 0.9);
  const api = V.make(cells, geo, mat, spread || 40);
  api.width = t.w; api.pts = t.pts;
  return api;
};
