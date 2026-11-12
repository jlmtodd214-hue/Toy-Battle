// Shared 3D helpers: materials, geometry shortcuts, procedural canvas textures.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export { THREE };

export const TEAM = {
  red: { main: '#d23c41', dark: '#8f1d22', light: '#ff9a9e' },
  blue: { main: '#2f6fc6', dark: '#173f7a', light: '#9cc6ff' },
};

// ------------------------------------------------------------ materials
const cache = new Map();
export function plastic(color, o = {}) {
  const key = 'p' + color + JSON.stringify(o);
  if (!cache.has(key)) cache.set(key, new THREE.MeshPhysicalMaterial({
    color, roughness: o.rough ?? 0.32, metalness: 0, clearcoat: o.clearcoat ?? 0.7, clearcoatRoughness: 0.18,
    emissive: o.emissive || '#000', emissiveIntensity: o.ei ?? 1, transparent: !!o.opacity, opacity: o.opacity ?? 1,
    side: o.side || THREE.FrontSide, envMapIntensity: o.env ?? 1.3, map: o.map || null, bumpMap: o.bump || null, bumpScale: o.bumpScale ?? 1,
  }));
  return cache.get(key);
}
export const matte = (color, o = {}) => plastic(color, { rough: 0.85, clearcoat: 0, ...o });
export function metal(color, rough = 0.28) {
  const key = 'm' + color + rough;
  if (!cache.has(key)) cache.set(key, new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.85, envMapIntensity: 2.6 }));
  return cache.get(key);
}
export const glow = (color, ei = 2.2) => plastic(color, { emissive: color, ei, rough: 0.2 });

// ------------------------------------------------------------ geometry
export function mesh(geo, mat, x = 0, y = 0, z = 0, opts = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (opts.rx) m.rotation.x = opts.rx;
  if (opts.ry) m.rotation.y = opts.ry;
  if (opts.rz) m.rotation.z = opts.rz;
  if (opts.s) Array.isArray(opts.s) ? m.scale.set(...opts.s) : m.scale.setScalar(opts.s);
  m.castShadow = opts.cast ?? true;
  m.receiveShadow = opts.recv ?? true;
  return m;
}
export const G = {
  sphere: (r, w = 48, h = 32) => new THREE.SphereGeometry(r, w, h),
  hemi: (r) => new THREE.SphereGeometry(r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
  box: (w, h, d, r = 0.04, seg = 4) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2.01, h / 2.01, d / 2.01)),
  cyl: (rt, rb, h, seg = 48) => new THREE.CylinderGeometry(rt, rb, h, seg),
  cap: (r, len) => new THREE.CapsuleGeometry(r, len, 12, 32),
  torus: (R, r, arc = Math.PI * 2, ts = 64) => new THREE.TorusGeometry(R, r, 20, ts, arc),
  cone: (r, h, seg = 48) => new THREE.ConeGeometry(r, h, seg),
  lathe: (pts, seg = 64) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg),
  tube: (pts, r, closed = false, seg = 120) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), closed), seg, r, 12, closed),
  star: (R, r, depth, bevel = 0.02) => {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? r : R;
      i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3 });
  },
  shape: (pts, depth, bevel = 0.02) => {
    const s = new THREE.Shape();
    pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 24 });
  },
};

export function group(...children) {
  const g = new THREE.Group();
  children.flat().forEach((c) => c && g.add(c));
  return g;
}
export function at(obj, x, y, z, opts = {}) {
  obj.position.set(x, y, z);
  if (opts.rx) obj.rotation.x = opts.rx;
  if (opts.ry) obj.rotation.y = opts.ry;
  if (opts.rz) obj.rotation.z = opts.rz;
  if (opts.s) Array.isArray(opts.s) ? obj.scale.set(...opts.s) : obj.scale.setScalar(opts.s);
  return obj;
}

// ------------------------------------------------------------ random + textures
export function prng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function canvasTex(w, h, draw, { repeat = null, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

// Speckle/noise texture (good as a bump map for fur, fabric, stone, sand).
export function noiseTex(size = 256, { contrast = 1, blobs = 4000, repeat = [2, 2], seed = 1, scale = 1 } = {}) {
  const r = prng(seed);
  return canvasTex(size, size, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < blobs; i++) {
      const v = Math.floor(128 + (r() - 0.5) * 255 * contrast);
      g.fillStyle = `rgb(${v},${v},${v})`;
      const s = (0.5 + r() * 2) * scale;
      g.fillRect(r() * w, r() * h, s, s);
    }
  }, { repeat, srgb: false });
}
