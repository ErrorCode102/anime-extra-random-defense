/* ============ ANIME EXTRA RANDOM DEFENCE — three.js r186 render layer ============ */
/* Classic script + dynamic import so the game also runs when index.html is opened
   directly from disk (file://); the import map resolves the CDN modules. */
(async () => {
const THREE = await import('three');
const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js');
const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js');
const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');
const { OutputPass } = await import('three/addons/postprocessing/OutputPass.js');
const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');

const Game = window.Game;
const stage = document.getElementById('stage');
const canvas = document.getElementById('game');
const hint = document.getElementById('orbitHint');
const hitFlash = document.getElementById('hitFlash');

/* logical 2D -> world 3D (Y up) */
const WS = 0.04;
const wx = x => (x - 480) * WS;
const wz = y => (y - 320) * WS;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- shared caches ---------- */
const geoCache = new Map();
const geo = (key, make) => { if (!geoCache.has(key)) geoCache.set(key, make()); return geoCache.get(key); };
const matCache = new Map();
const std = (key, opts) => { if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial(opts)); return matCache.get(key); };
const basic = (key, opts) => { if (!matCache.has(key)) matCache.set(key, new THREE.MeshBasicMaterial(opts)); return matCache.get(key); };
const C = hex => new THREE.Color(hex);

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const GLOW = glowTexture();

const textTexCache = new Map();
function textTexture(txt, color, size) {
  const key = `${txt}|${color}|${size}`;
  if (textTexCache.has(key)) return textTexCache.get(key);
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  const px = Math.round(size * 3.4);
  g.font = `700 ${px}px Kanit, system-ui, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = color; g.shadowBlur = 18;
  g.lineWidth = 7; g.strokeStyle = 'rgba(10,8,22,0.9)';
  g.strokeText(txt, 128, 66); g.shadowBlur = 0;
  g.fillStyle = color; g.fillText(txt, 128, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  textTexCache.set(key, t); return t;
}

/* ---------- renderer / scene / camera ---------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (err) {
  const d = document.createElement('div'); d.id = 'webglFail';
  d.innerHTML = 'This device could not start WebGL.<br>The Moon Cell needs a WebGL-capable browser to render in 3D.';
  stage.appendChild(d);
  throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = C('#0d0b1e');
scene.fog = new THREE.Fog('#0d0b1e', 52, 105);

const camera = new THREE.PerspectiveCamera(50, 1.5, 0.1, 300);
camera.position.set(0, 21, 25);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0.5);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 13;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI * 0.46;
controls.minPolarAngle = Math.PI * 0.08;
controls.enablePan = false;
controls.rotateSpeed = 0.6;
controls.zoomSpeed = 0.8;

/* image-based lighting for PBR reflections */
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;

/* ---------- lights ---------- */
scene.add(new THREE.HemisphereLight('#7a6ae0', '#160f28', 0.55));
const key = new THREE.DirectionalLight('#fff0e0', 2.3);
key.position.set(18, 32, 14);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 1; key.shadow.camera.far = 90;
key.shadow.camera.left = -26; key.shadow.camera.right = 26;
key.shadow.camera.top = 26; key.shadow.camera.bottom = -26;
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
scene.add(key);
const rim = new THREE.DirectionalLight('#35e0ff', 1.25); rim.position.set(-22, 12, -18); scene.add(rim);
const fill = new THREE.DirectionalLight('#ff3d8e', 0.5); fill.position.set(2, 9, -26); scene.add(fill);
const coreLight = new THREE.PointLight('#8b5cff', 40, 40, 2); coreLight.position.set(0, 7, 0); scene.add(coreLight);

/* ---------- post processing ---------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(960, 640), 0.7, 0.55, 0.7);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------- world root (camera shake target) ---------- */
const world = new THREE.Group();
scene.add(world);

/* ============================ ARENA ============================ */
function buildArena() {
  /* floor dais */
  const floorMat = std('floor', { color: '#15122e', metalness: 0.55, roughness: 0.45 });
  const floor = new THREE.Mesh(geo('floor', () => new THREE.CylinderGeometry(22, 23.5, 1.4, 64)), floorMat);
  floor.position.y = -0.7; floor.receiveShadow = true; world.add(floor);
  const rimRing = new THREE.Mesh(geo('floorRim', () => new THREE.TorusGeometry(21.6, 0.16, 8, 96)),
    basic('floorRim', { color: '#6a4fd0', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending }));
  rimRing.rotation.x = Math.PI / 2; rimRing.position.y = 0.02; world.add(rimRing);
  /* faint concentric inlays */
  for (const r of [14, 18]) {
    const inlay = new THREE.Mesh(geo('inlay' + r, () => new THREE.TorusGeometry(r, 0.05, 6, 96)),
      basic('inlay', { color: '#3a2f70', transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending }));
    inlay.rotation.x = Math.PI / 2; inlay.position.y = 0.015; world.add(inlay);
  }

  /* ring road (unique segments of the 1.5-lap path) */
  const roadW = CFG.ring.w * WS;
  const roadMat = std('road', { color: '#1c1838', metalness: 0.35, roughness: 0.6, emissive: '#241d4a', emissiveIntensity: 0.5 });
  const edgeMat = basic('roadEdge', { color: '#35e0ff', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending });
  const segs = [
    [-30, 320, 200, 320], [200, 130, 760, 130], [760, 130, 760, 510],
    [760, 510, 200, 510], [200, 510, 200, 130], [760, 320, 990, 320],
  ];
  for (const [x1, y1, x2, y2] of segs) {
    const ax = wx(x1), az = wz(y1), bx = wx(x2), bz = wz(y2);
    const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
    const grp = new THREE.Group();
    grp.position.set((ax + bx) / 2, 0.06, (az + bz) / 2);
    grp.rotation.y = Math.atan2(-dz, dx);
    const bed = new THREE.Mesh(geo('roadBed', () => new THREE.BoxGeometry(1, 0.12, 1)), roadMat);
    bed.scale.set(len, 1, roadW); bed.receiveShadow = true; grp.add(bed);
    for (const s of [-1, 1]) {
      const edge = new THREE.Mesh(geo('roadEdge', () => new THREE.BoxGeometry(1, 0.07, 0.07)), edgeMat);
      edge.scale.x = len; edge.position.set(0, 0.07, s * (roadW / 2 - 0.03)); grp.add(edge);
    }
    world.add(grp);
  }

  /* gates: entry (cyan) & exit (red) */
  buildGate(wx(-30), wz(320), '#35e0ff');
  buildGate(wx(990), wz(320), '#ff3d5e');

  /* deployment boundary — free ground inside the logical arena */
  const bw = (PLACEMENT.maxX - PLACEMENT.minX) * WS, bh = (PLACEMENT.maxY - PLACEMENT.minY) * WS;
  const boundGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-bw / 2, 0, -bh / 2), new THREE.Vector3(bw / 2, 0, -bh / 2),
    new THREE.Vector3(bw / 2, 0, bh / 2), new THREE.Vector3(-bw / 2, 0, bh / 2),
  ]);
  const bound = new THREE.LineLoop(boundGeo, new THREE.LineBasicMaterial({ color: '#8b5cff', transparent: true, opacity: 0.35 }));
  bound.position.set(0, 0.04, 0); world.add(bound);
}

function buildGate(x, z, color) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const pillarMat = std('gatePillar' + color, { color: '#221c44', metalness: 0.7, roughness: 0.35, emissive: color, emissiveIntensity: 0.25 });
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(geo('pillar', () => new THREE.CylinderGeometry(0.28, 0.36, 4.2, 8)), pillarMat);
    p.position.set(0, 2.1, s * 1.7); p.castShadow = true; g.add(p);
    const cap = new THREE.Mesh(geo('gateCap', () => new THREE.OctahedronGeometry(0.4, 0)),
      std('gateCap' + color, { color, emissive: color, emissiveIntensity: 2.4, metalness: 0.3, roughness: 0.2 }));
    cap.position.set(0, 4.4, s * 1.7); g.add(cap);
  }
  const arch = new THREE.Mesh(geo('gateArch', () => new THREE.TorusGeometry(1.7, 0.12, 8, 24, Math.PI)),
    std('gateArch' + color, { color, emissive: color, emissiveIntensity: 1.8, metalness: 0.4, roughness: 0.3 }));
  arch.position.y = 4.2; arch.rotation.z = Math.PI; arch.rotation.y = Math.PI / 2; g.add(arch);
  const veil = new THREE.Mesh(geo('gateVeil', () => new THREE.PlaneGeometry(3.2, 4)),
    basic('gateVeil' + color, { color, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
  veil.position.y = 2.1; veil.rotation.y = Math.PI / 2; g.add(veil);
  world.add(g);
}

/* ground picking plane (logical y=0) */
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const groundHit = new THREE.Vector3();

/* range preview disc */
const rangeDisc = new THREE.Group();
const rangeFill = new THREE.Mesh(geo('rangeFill', () => new THREE.CircleGeometry(1, 48)),
  new THREE.MeshBasicMaterial({ color: '#35e0ff', transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
rangeFill.rotation.x = -Math.PI / 2;
const rangeEdge = new THREE.Mesh(geo('rangeEdge', () => new THREE.RingGeometry(0.97, 1, 64)),
  new THREE.MeshBasicMaterial({ color: '#35e0ff', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
rangeEdge.rotation.x = -Math.PI / 2;
rangeDisc.add(rangeFill, rangeEdge); rangeDisc.position.y = 0.09; rangeDisc.visible = false; world.add(rangeDisc);

/* ambient drifting motes */
const MOTES = 170;
const moteGeo = new THREE.BufferGeometry();
const motePos = new Float32Array(MOTES * 3), moteCol = new Float32Array(MOTES * 3), moteSeed = new Float32Array(MOTES);
const motePalette = [C('#8b5cff'), C('#35e0ff'), C('#ff3d8e'), C('#ffd23d')];
for (let i = 0; i < MOTES; i++) {
  const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 24;
  motePos[i * 3] = Math.cos(a) * r; motePos[i * 3 + 1] = Math.random() * 14; motePos[i * 3 + 2] = Math.sin(a) * r;
  const c = motePalette[i % motePalette.length];
  moteCol[i * 3] = c.r; moteCol[i * 3 + 1] = c.g; moteCol[i * 3 + 2] = c.b;
  moteSeed[i] = Math.random() * 100;
}
moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
moteGeo.setAttribute('color', new THREE.BufferAttribute(moteCol, 3));
const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
  size: 0.32, map: GLOW, vertexColors: true, transparent: true, opacity: 0.5,
  blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
}));
world.add(motes);

/* road flow dashes */
const DASHES = 22;
const dashGroup = new THREE.Group(); world.add(dashGroup);
const dashMat = basic('dash', { color: '#7af0ff', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
const dashes = [];
for (let i = 0; i < DASHES; i++) {
  const m = new THREE.Mesh(geo('dash', () => new THREE.BoxGeometry(0.5, 0.05, 0.16)), dashMat);
  m.position.y = 0.14; dashGroup.add(m); dashes.push(m);
}

buildArena();

/* ============================ UNIT FIGURES ============================ */
const skinMat = std('skin', { color: '#ffe3d0', roughness: 0.6, metalness: 0 });
const metalMat = std('metal', { color: '#cdd2e0', metalness: 0.9, roughness: 0.28 });
function clothMat(grade) {
  const g = GRADES[grade];
  return std('cloth' + grade, { color: C(g.color).multiplyScalar(0.55), roughness: 0.65, metalness: 0.12, emissive: C(g.color).multiplyScalar(0.18) });
}
function gemMat(grade) {
  const g = GRADES[grade];
  return std('gem' + grade, { color: g.color, emissive: g.color, emissiveIntensity: 1.6, metalness: 0.3, roughness: 0.2 });
}
function hairMat(hex) { return std('hair' + hex, { color: hex, roughness: 0.5, metalness: 0.1 }); }
function eyeMat(hex) { return std('eye' + hex, { color: hex, emissive: hex, emissiveIntensity: 1.1, roughness: 0.3 }); }

function buildWeapon(cls, accent) {
  const w = new THREE.Group();
  const acc = std('wacc' + accent, { color: accent, emissive: accent, emissiveIntensity: 1.4, metalness: 0.4, roughness: 0.3 });
  const add = (geometry, mat, x, y, z, rx = 0, rz = 0) => {
    const m = new THREE.Mesh(geometry, mat); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); m.castShadow = true; w.add(m); return m;
  };
  switch (cls) {
    case 'Saber': case 'Ruler':
      add(geo('blade', () => new THREE.BoxGeometry(0.09, 1.0, 0.16)), metalMat, 0, 0.5, 0, 0, -0.25);
      add(geo('bladeEdge', () => new THREE.BoxGeometry(0.04, 0.95, 0.05)), acc, 0.05, 0.5, 0.06, 0, -0.25);
      add(geo('hilt', () => new THREE.BoxGeometry(0.26, 0.08, 0.12)), acc, 0, 0.02, 0);
      break;
    case 'Lancer':
      add(geo('shaft', () => new THREE.CylinderGeometry(0.035, 0.035, 1.7, 6)), metalMat, 0, 0.6, 0, 0, -0.18);
      add(geo('spearTip', () => new THREE.ConeGeometry(0.12, 0.4, 6)), acc, 0.16, 1.5, 0, 0, -0.18);
      break;
    case 'Archer':
      add(geo('bow', () => new THREE.TorusGeometry(0.42, 0.04, 6, 16, Math.PI * 1.2)), acc, 0, 0.5, 0, 0, 0.4);
      break;
    case 'Caster':
      add(geo('staff', () => new THREE.CylinderGeometry(0.04, 0.05, 1.3, 6)), metalMat, 0, 0.55, 0);
      add(geo('orb', () => new THREE.IcosahedronGeometry(0.18, 0)), acc, 0, 1.28, 0);
      break;
    case 'Assassin':
      add(geo('dagger', () => new THREE.BoxGeometry(0.07, 0.55, 0.12)), metalMat, 0, 0.35, 0, 0, -0.4);
      add(geo('daggerEdge', () => new THREE.BoxGeometry(0.03, 0.5, 0.04)), acc, 0.04, 0.35, 0.05, 0, -0.4);
      break;
    case 'Berserker':
      add(geo('axeHandle', () => new THREE.CylinderGeometry(0.05, 0.05, 1.1, 6)), metalMat, 0, 0.5, 0, 0, -0.2);
      add(geo('axeHead', () => new THREE.BoxGeometry(0.5, 0.42, 0.1)), acc, 0.18, 1.0, 0, 0, -0.2);
      break;
    case 'Shielder':
      add(geo('shield', () => new THREE.CylinderGeometry(0.46, 0.46, 0.1, 6)), metalMat, 0, 0.55, 0.1, Math.PI / 2, 0);
      add(geo('shieldBoss', () => new THREE.OctahedronGeometry(0.16, 0)), acc, 0, 0.55, 0.2);
      break;
    case 'Rider':
      add(geo('reins', () => new THREE.TorusGeometry(0.3, 0.035, 6, 16)), acc, 0, 0.5, 0.1, 0.5, 0);
      break;
    case 'Alter Ego':
      add(geo('egoOrb', () => new THREE.IcosahedronGeometry(0.2, 0)), acc, 0.1, 0.9, 0.1);
      add(geo('egoOrb2', () => new THREE.IcosahedronGeometry(0.13, 0)), acc, -0.15, 1.15, -0.05);
      break;
    case 'Foreigner':
      add(geo('halo', () => new THREE.TorusGeometry(0.4, 0.03, 6, 24)), acc, 0, 1.0, 0, Math.PI / 2, 0);
      add(geo('fOrb', () => new THREE.IcosahedronGeometry(0.16, 0)), acc, 0, 1.0, 0);
      break;
    default:
      add(geo('wand', () => new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6)), acc, 0, 0.5, 0);
  }
  w.position.set(0.5, 0.55, 0.1);
  return w;
}

function makeUnit(def) {
  const g = new THREE.Group();
  const grade = def.grade;
  const robe = new THREE.Mesh(geo('robe', () => new THREE.CylinderGeometry(0.3, 0.5, 0.9, 14)), clothMat(grade));
  robe.position.y = 0.95; robe.castShadow = true; g.add(robe);
  const collar = new THREE.Mesh(geo('collar', () => new THREE.TorusGeometry(0.3, 0.07, 6, 14)), gemMat(grade));
  collar.rotation.x = Math.PI / 2; collar.position.y = 1.36; g.add(collar);
  const head = new THREE.Mesh(geo('head', () => new THREE.SphereGeometry(0.42, 18, 14)), skinMat);
  head.position.y = 1.66; head.castShadow = true; g.add(head);
  const hair = new THREE.Mesh(geo('hairCap', () => new THREE.SphereGeometry(0.46, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62)), hairMat(def.hair));
  hair.position.y = 1.7; hair.castShadow = true; g.add(hair);
  const tailGeo = geo('hairTail', () => new THREE.ConeGeometry(0.16, 0.7, 8));
  for (const s of [-1, 1]) {
    const tail = new THREE.Mesh(tailGeo, hairMat(def.hair));
    tail.position.set(s * 0.36, 1.5, -0.16); tail.rotation.set(0.3, 0, s * 0.35); g.add(tail);
  }
  const eyeGeo = geo('eye', () => new THREE.SphereGeometry(0.075, 10, 8));
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat(def.eye || GRADES[grade].color));
    eye.position.set(s * 0.15, 1.64, 0.36); g.add(eye);
  }
  const gem = new THREE.Mesh(geo('unitGem', () => new THREE.OctahedronGeometry(0.18, 0)), gemMat(grade));
  gem.position.y = 2.35; g.add(gem);
  const weapon = buildWeapon(def.cls, GRADES[grade].color); g.add(weapon);
  if (grade === 'EX' || grade === 'S' || grade === 'STAR') {
    const halo = new THREE.Mesh(geo('unitHalo', () => new THREE.TorusGeometry(0.62, 0.035, 6, 28)),
      basic('halo' + grade, { color: GRADES[grade].color, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending }));
    halo.rotation.x = Math.PI / 2; halo.position.y = 2.0; g.add(halo);
    g.userData.halo = halo;
  }
  g.userData.gem = gem; g.userData.weapon = weapon;
  g.scale.setScalar(1.2);
  return g;
}

/* ============================ ENEMIES ============================ */
function makeEnemy(e) {
  const g = new THREE.Group();
  const r = e.r * WS * 1.5;
  const coreMat = new THREE.MeshStandardMaterial({ color: e.color, emissive: e.color, emissiveIntensity: 0.6, metalness: 0.45, roughness: 0.25, flatShading: true });
  const core = new THREE.Mesh(geo('eCore', () => new THREE.IcosahedronGeometry(1, 0)), coreMat);
  core.scale.setScalar(r); core.castShadow = false; g.add(core);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: e.color, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.setScalar(r * 3.2); g.add(glow);
  if (e.boss) {
    const cage = new THREE.Mesh(geo('bossCage', () => new THREE.OctahedronGeometry(1, 0)),
      new THREE.MeshBasicMaterial({ color: e.color, wireframe: true, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending }));
    cage.scale.setScalar(r * 1.7); g.add(cage); g.userData.cage = cage;
    const crown = new THREE.Mesh(geo('bossCrown', () => new THREE.TorusGeometry(1, 0.08, 6, 20)),
      std('bossCrown', { color: '#ffd23d', emissive: '#ffd23d', emissiveIntensity: 2, metalness: 0.6, roughness: 0.3 }));
    crown.scale.setScalar(r * 1.2); crown.rotation.x = Math.PI / 2; crown.position.y = r * 1.1; g.add(crown);
  }
  /* contact shadow */
  const shadow = new THREE.Mesh(geo('eShadow', () => new THREE.CircleGeometry(1, 20)),
    basic('eShadow', { color: '#000000', transparent: true, opacity: 0.32, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.scale.setScalar(r * 1.3); shadow.position.y = 0.07; world.add(shadow);
  /* status ring */
  const status = new THREE.Mesh(geo('eStatus', () => new THREE.TorusGeometry(1, 0.06, 6, 20)),
    new THREE.MeshBasicMaterial({ color: '#35e0ff', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }));
  status.rotation.x = Math.PI / 2; status.scale.setScalar(r * 1.4); status.visible = false; g.add(status);
  /* hp bar */
  const barW = e.boss ? 2.0 : 1.05;
  const hpGroup = new THREE.Group();
  const bg = new THREE.Mesh(geo('hpBg', () => new THREE.PlaneGeometry(1, 0.13)),
    basic('hpBg', { color: '#1a1430', transparent: true, opacity: 0.9, depthWrite: false }));
  bg.scale.x = barW; hpGroup.add(bg);
  const fillGeo = geo('hpFill', () => { const gg = new THREE.PlaneGeometry(1, 0.1); gg.translate(0.5, 0, 0); return gg; });
  const fill = new THREE.Mesh(fillGeo, new THREE.MeshBasicMaterial({ color: e.boss ? '#ff3d5e' : '#3dff9a', transparent: true, depthWrite: false }));
  fill.position.set(-barW / 2, 0, 0.01); fill.scale.x = barW; hpGroup.add(fill);
  hpGroup.position.y = r + (e.boss ? 1.5 : 0.95); g.add(hpGroup);
  world.add(g);
  return { group: g, core, coreMat, glow, shadow, status, hpGroup, fill, barW, r };
}

/* ============================ EFFECT POOLS ============================ */
const projMap = new Map();
function makeProj() {
  const g = new THREE.Group();
  const core = new THREE.Mesh(geo('projCore', () => new THREE.SphereGeometry(0.16, 10, 8)),
    new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  g.add(core);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: '#ffffff', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.setScalar(0.9); g.add(glow);
  world.add(g);
  return { group: g, core, glow };
}

const beamMap = new Map();
function makeBeam(b) {
  const g = new THREE.Group();
  const mats = [];
  const col = C(b.color);
  const radius = b.w * WS * 0.6;
  const pts = b.pts;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = new THREE.Vector3(wx(pts[i].x), 1.0, wz(pts[i].y));
    const bb = new THREE.Vector3(wx(pts[i + 1].x), 1.0, wz(pts[i + 1].y));
    const segs = b.lightning ? 4 : 1;
    let prev = a;
    for (let s = 1; s <= segs; s++) {
      const t = s / segs;
      const cur = a.clone().lerp(bb, t);
      if (b.lightning && s < segs) {
        cur.x += (Math.random() - 0.5) * 0.5; cur.z += (Math.random() - 0.5) * 0.5; cur.y += (Math.random() - 0.5) * 0.4;
      }
      const dir = cur.clone().sub(prev); const len = dir.length();
      const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
      mats.push(mat);
      const m = new THREE.Mesh(geo('beamSeg', () => new THREE.CylinderGeometry(1, 1, 1, 6)), mat);
      m.scale.set(radius, len, radius);
      m.position.copy(prev).add(cur).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      g.add(m); prev = cur;
    }
  }
  world.add(g);
  return { group: g, mats };
}

const ringPool = [];
function ringMesh(i) {
  if (!ringPool[i]) {
    const m = new THREE.Mesh(geo('fxRing', () => new THREE.RingGeometry(0.86, 1, 40)),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 1, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.1; m.visible = false; world.add(m); ringPool[i] = m;
  }
  return ringPool[i];
}

/* particle point cloud */
const MAXP = 400;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(MAXP * 3), pCol = new Float32Array(MAXP * 3);
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
pGeo.setDrawRange(0, 0);
const points = new THREE.Points(pGeo, new THREE.PointsMaterial({
  size: 0.4, map: GLOW, vertexColors: true, transparent: true, opacity: 0.95,
  blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
}));
points.frustumCulled = false; world.add(points);

/* damage floats */
const floatPool = [];
function floatSprite(i) {
  if (!floatPool[i]) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, transparent: true, depthWrite: false }));
    s.visible = false; world.add(s); floatPool[i] = s;
  }
  return floatPool[i];
}

/* entity maps */
const unitMap = new Map();   // slot -> {group, uid, id}
const enemyMap = new Map();  // uid -> entry

/* ============================ SYNC ============================ */
const tmpColor = new THREE.Color();
let hoverGround = null;
let hoverValid = false;

function syncUnits(S, elapsed) {
  const live = new Set();
  S.field.forEach((u, i) => {
    if (!u) return;
    live.add(i);
    let ent = unitMap.get(i);
    if (!ent || ent.uid !== u.uid || ent.id !== u.id) {
      if (ent) { world.remove(ent.group); world.remove(ent.ring); ent.ring.material.dispose(); }
      const def = UNIT_BY_ID[u.id];
      const group = makeUnit(def);
      group.userData.uid = u.uid;
      group.position.set(wx(u.x), 0.1, wz(u.y));
      world.add(group);
      const ring = new THREE.Mesh(geo('unitSelRing', () => new THREE.RingGeometry(0.78, 0.92, 32)),
        new THREE.MeshBasicMaterial({ color: GRADES[def.grade].color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(wx(u.x), 0.08, wz(u.y)); ring.visible = false; world.add(ring);
      ent = { group, ring, uid: u.uid, id: u.id, def };
      unitMap.set(i, ent);
    }
    const g = ent.group;
    g.position.x = wx(u.x); g.position.z = wz(u.y);
    g.position.y = 0.1 + Math.sin(elapsed * 2 + i) * 0.05;
    g.userData.uid = u.uid;
    ent.ring.position.set(wx(u.x), 0.08, wz(u.y));
    const isSel = S.sel && S.sel.loc === 'field' && S.sel.idx === i;
    ent.ring.visible = isSel;
    if (isSel) { ent.ring.rotation.z = elapsed * 0.8; ent.ring.material.opacity = 0.65 + 0.3 * Math.sin(elapsed * 4); }
    if (g.userData.gem) { g.userData.gem.rotation.y = elapsed * 1.5; g.userData.gem.rotation.x = elapsed * 0.7; }
    if (g.userData.halo) g.userData.halo.rotation.z = elapsed * 0.8;
    /* face nearest enemy in range */
    const def = ent.def; let best = null, bd = Infinity;
    for (const e of S.enemies) {
      if (e.dead) continue;
      const p = pathPos(e.d);
      const d = (p.x - u.x) ** 2 + (p.y - u.y) ** 2;
      if (d < def.range * def.range && d < bd) { bd = d; best = p; }
    }
    if (best) {
      const ang = Math.atan2(wx(best.x) - g.position.x, wz(best.y) - g.position.z);
      let cur = g.rotation.y;
      let diff = ((ang - cur + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      g.rotation.y = cur + diff * 0.15;
    } else {
      g.rotation.y += 0.003;
    }
  });
  for (const [i, ent] of unitMap) {
    if (!live.has(i)) { world.remove(ent.group); world.remove(ent.ring); ent.ring.material.dispose(); unitMap.delete(i); }
  }
}

function syncEnemies(S, elapsed, dt) {
  const live = new Set();
  for (const e of S.enemies) {
    if (e.dead) continue;
    live.add(e.uid);
    let ent = enemyMap.get(e.uid);
    if (!ent) { ent = makeEnemy(e); enemyMap.set(e.uid, ent); }
    const p = pathPos(e.d);
    const X = wx(p.x), Z = wz(p.y);
    const hover = (e.boss ? 1.1 : 0.75) + Math.sin(elapsed * 3 + e.uid) * 0.12;
    ent.group.position.set(X, hover, Z);
    ent.core.rotation.y += dt * 1.4; ent.core.rotation.x += dt * 0.6;
    if (ent.group.userData.cage) { ent.group.userData.cage.rotation.y -= dt * 0.9; ent.group.userData.cage.rotation.z += dt * 0.4; }
    ent.shadow.position.set(X, 0.07, Z);
    const ratio = clamp(e.hp / e.maxHp, 0, 1);
    ent.fill.scale.x = Math.max(0.001, ent.barW * ratio);
    ent.fill.material.color.set(ratio > 0.5 ? '#3dff9a' : ratio > 0.25 ? '#ffd23d' : '#ff3d5e');
    ent.hpGroup.quaternion.copy(camera.quaternion);
    /* status */
    if (e.slowT > 0) { ent.status.visible = true; ent.status.material.color.set('#35e0ff'); }
    else if (e.stunT > 0) { ent.status.visible = true; ent.status.material.color.set('#ffd23d'); }
    else if (e.dots.length) { ent.status.visible = true; ent.status.material.color.set('#ff3d8e'); }
    else ent.status.visible = false;
    if (ent.status.visible) ent.status.rotation.z = elapsed * 2;
    ent.coreMat.emissiveIntensity = 0.55 + Math.sin(elapsed * 4 + e.uid) * 0.2;
  }
  for (const [uid, ent] of enemyMap) {
    if (!live.has(uid)) {
      world.remove(ent.group); world.remove(ent.shadow);
      ent.coreMat.dispose(); ent.fill.material.dispose(); ent.status.material.dispose();
      ent.glow.material.dispose();
      enemyMap.delete(uid);
    }
  }
}

function syncProjectiles(S) {
  const live = new Set();
  for (const pr of S.projectiles) {
    live.add(pr.uid);
    let ent = projMap.get(pr.uid);
    if (!ent) { ent = makeProj(); projMap.set(pr.uid, ent); }
    ent.group.position.set(wx(pr.x), 0.95, wz(pr.y));
    ent.core.material.color.set(pr.color);
    ent.glow.material.color.set(pr.color);
    const s = pr.fast ? 1.3 : 1;
    ent.glow.scale.setScalar(0.9 * s);
  }
  for (const [uid, ent] of projMap) {
    if (!live.has(uid)) { world.remove(ent.group); ent.core.material.dispose(); ent.glow.material.dispose(); projMap.delete(uid); }
  }
}

function syncBeams(S) {
  const live = new Set();
  for (const b of S.beams) {
    live.add(b.uid);
    let ent = beamMap.get(b.uid);
    if (!ent) { ent = makeBeam(b); beamMap.set(b.uid, ent); }
    const fade = clamp(1 - b.t / b.life, 0, 1);
    for (const m of ent.mats) m.opacity = fade;
  }
  for (const [uid, ent] of beamMap) {
    if (!live.has(uid)) { world.remove(ent.group); ent.mats.forEach(m => m.dispose()); beamMap.delete(uid); }
  }
}

function syncRings(S) {
  for (let i = 0; i < S.rings.length; i++) {
    const r = S.rings[i], m = ringMesh(i);
    m.visible = true;
    const t = r.t / r.life;
    const rad = r.r * WS * (0.25 + 0.75 * t);
    m.scale.setScalar(rad);
    m.position.set(wx(r.x), 0.1, wz(r.y));
    m.material.color.set(r.color);
    m.material.opacity = clamp(1 - t, 0, 1) * 0.9;
  }
  for (let i = S.rings.length; i < ringPool.length; i++) ringPool[i].visible = false;
}

function syncParticles(S) {
  const n = Math.min(S.particles.length, MAXP);
  for (let i = 0; i < n; i++) {
    const p = S.particles[i];
    pPos[i * 3] = wx(p.x);
    pPos[i * 3 + 1] = 0.6 + (p.t / p.life) * 1.4;
    pPos[i * 3 + 2] = wz(p.y);
    tmpColor.set(p.color).multiplyScalar(clamp(1 - p.t / p.life, 0, 1));
    pCol[i * 3] = tmpColor.r; pCol[i * 3 + 1] = tmpColor.g; pCol[i * 3 + 2] = tmpColor.b;
  }
  pGeo.setDrawRange(0, n);
  pGeo.attributes.position.needsUpdate = true;
  pGeo.attributes.color.needsUpdate = true;
}

function syncFloats(S) {
  for (let i = 0; i < S.floats.length; i++) {
    const f = S.floats[i], s = floatSprite(i);
    s.visible = true;
    s.material.map = textTexture(f.txt, f.color, f.size);
    s.material.opacity = clamp(1 - f.t / f.life, 0, 1);
    s.position.set(wx(f.x), 1.5 + f.t * 2.4, wz(f.y));
    const sc = (f.size / 12) * 1.5;
    s.scale.set(sc * 2, sc, 1);
  }
  for (let i = S.floats.length; i < floatPool.length; i++) floatPool[i].visible = false;
}

function syncPlacement(S, elapsed) {
  const benchSel = S.sel && S.sel.loc === 'bench' ? S.bench[S.sel.idx] : null;
  let showRange = false, rx = 0, rz = 0, rr = 0, rc = '#35e0ff';
  if (S.sel && S.sel.loc === 'field' && S.field[S.sel.idx]) {
    const u = S.field[S.sel.idx], def = UNIT_BY_ID[u.id];
    rx = wx(u.x); rz = wz(u.y); rr = def.range * WS; rc = GRADES[def.grade].color; showRange = true;
  } else if (benchSel && hoverGround) {
    const def = UNIT_BY_ID[benchSel.id];
    rx = wx(hoverGround.x); rz = wz(hoverGround.y); rr = def.range * WS;
    rc = hoverValid ? GRADES[def.grade].color : '#ff3d5e'; showRange = true;
  }
  rangeDisc.visible = showRange;
  if (showRange) {
    rangeDisc.position.set(rx, 0.09, rz);
    rangeDisc.scale.setScalar(rr);
    rangeFill.material.color.set(rc); rangeEdge.material.color.set(rc);
    rangeEdge.material.opacity = 0.4 + 0.2 * Math.sin(elapsed * 4);
  }
}

function syncAmbient(elapsed, dt) {
  /* motes drift */
  for (let i = 0; i < MOTES; i++) {
    let y = motePos[i * 3 + 1] + dt * (0.3 + (moteSeed[i] % 1) * 0.5);
    if (y > 15) y = 0;
    motePos[i * 3 + 1] = y;
    motePos[i * 3] += Math.sin(elapsed * 0.4 + moteSeed[i]) * dt * 0.25;
  }
  moteGeo.attributes.position.needsUpdate = true;
  /* road flow */
  for (let i = 0; i < DASHES; i++) {
    const d = (elapsed * 130 + i * PATH_LEN / DASHES) % PATH_LEN;
    const p = pathPos(d), p2 = pathPos(Math.min(PATH_LEN, d + 4));
    const m = dashes[i];
    m.position.set(wx(p.x), 0.15, wz(p.y));
    m.rotation.y = Math.atan2(-(wz(p2.y) - wz(p.y)), wx(p2.x) - wx(p.x));
  }
  coreLight.intensity = 34 + Math.sin(elapsed * 1.5) * 8;
}

/* ============================ INPUT ============================ */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downX = 0, downY = 0, downT = 0, dragged = false;

function setPointer(ev) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
}
function pickGround() {
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.ray.intersectPlane(groundPlane, groundHit);
  return hit ? { x: hit.x / WS + 480, y: hit.z / WS + 320 } : null;
}
function pickUnit() {
  raycaster.setFromCamera(pointer, camera);
  const groups = [...unitMap.values()].map(e => e.group);
  const hits = raycaster.intersectObjects(groups, true);
  if (!hits.length) return null;
  let obj = hits[0].object;
  while (obj && obj.userData.uid == null) obj = obj.parent;
  if (!obj) return null;
  const found = Game.unitByUid(obj.userData.uid);
  return found && found.loc === 'field' ? { loc: 'field', idx: found.idx } : null;
}
canvas.addEventListener('pointermove', ev => {
  setPointer(ev);
  if (ev.buttons) { dragged = true; return; }
  hoverGround = pickGround();
  const S = Game.S;
  const benchSel = S.sel && S.sel.loc === 'bench' ? S.bench[S.sel.idx] : null;
  hoverValid = !!(benchSel && hoverGround && Game.placementReason(hoverGround.x, hoverGround.y) === '');
  canvas.style.cursor = pickUnit() ? 'pointer' : benchSel ? (hoverValid ? 'copy' : 'not-allowed') : 'grab';
});
canvas.addEventListener('pointerdown', ev => {
  downX = ev.clientX; downY = ev.clientY; downT = performance.now(); dragged = false;
  canvas.style.cursor = 'grabbing';
  if (hint) hint.classList.add('hide');
});
canvas.addEventListener('pointerup', ev => {
  const dist = Math.hypot(ev.clientX - downX, ev.clientY - downY);
  if (dist > 7 || performance.now() - downT > 500 || dragged) { canvas.style.cursor = 'grab'; return; }
  setPointer(ev);
  const S = Game.S;
  const unitSel = pickUnit();
  if (unitSel) {
    Game.select(S.sel && S.sel.loc === 'field' && S.sel.idx === unitSel.idx ? null : unitSel);
    Game.AudioFX.click();
    canvas.style.cursor = 'pointer';
    return;
  }
  const benchSel = S.sel && S.sel.loc === 'bench' ? S.bench[S.sel.idx] : null;
  const ground = pickGround();
  if (benchSel && ground) {
    Game.tryPlace(Math.round(ground.x), Math.round(ground.y));
  } else {
    Game.select(null);
  }
  canvas.style.cursor = benchSel ? (hoverValid ? 'copy' : 'not-allowed') : 'grab';
});
canvas.addEventListener('pointerleave', () => { hoverGround = null; hoverValid = false; });
canvas.addEventListener('contextmenu', ev => ev.preventDefault());
setTimeout(() => { if (hint) hint.classList.add('hide'); }, 9000);

/* ============================ RESIZE ============================ */
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  const tb = document.getElementById('topbar');
  if (tb) document.documentElement.style.setProperty('--topbar-h', tb.offsetHeight + 'px');
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  bloom.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
new ResizeObserver(resize).observe(document.getElementById('topbar'));
resize();

/* ============================ LOOP ============================ */
const timer = new THREE.Timer();
timer.connect(document);
let elapsed = 0;

function frame(dt) {
  elapsed += dt;
  const S = Game.S;
  if (S.mode === 'play' && !S.paused) Game.update(dt * S.speed);

  syncAmbient(elapsed, dt);
  syncUnits(S, elapsed);
  syncEnemies(S, elapsed, dt);
  syncProjectiles(S);
  syncBeams(S);
  syncRings(S);
  syncParticles(S);
  syncFloats(S);
  syncPlacement(S, elapsed);

  /* camera shake via world offset */
  const sh = S.shake * 0.012;
  world.position.set((Math.random() - 0.5) * sh, 0, (Math.random() - 0.5) * sh);
  hitFlash.style.opacity = (S.leakFlash * 0.7).toFixed(3);

  controls.update();
  composer.render();
}

renderer.setAnimationLoop(() => {
  timer.update();
  frame(clamp(timer.getDelta(), 0, 0.1));
});
})();