// 3D board dioramas, rendered top-down (orthographic) into images.
// World units = board pixels: x = node.x - 500, z = node.y - 800, y = up.
import { THREE, TEAM, plastic, matte, metal, glow, mesh, G, group, at, prng, canvasTex, noiseTex } from './lib.js';
import { renderer, envTex } from './stage.js';
import { MAP_LIST, MAPS } from '../../js/maps.js';

export const MAP_IDS = MAP_LIST.map((m) => m.id);
const BW = 1000, BH = 1600, BASE = 128;
// Rendered image space: square, so wide phone screens still show real terrain at the sides.
export const IW = 1600, IH = 1600;

// ------------------------------------------------------------ texture painters
function speckle(g, w, h, r, n, cols, smin = 1, smax = 3) {
  for (let i = 0; i < n; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; const s = smin + r() * (smax - smin); g.beginPath(); g.arc(r() * w, r() * h, s, 0, 7); g.fill(); }
}
function blotches(g, w, h, r, n, cols, rmin, rmax, alpha = 0.25) {
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rad = rmin + r() * (rmax - rmin);
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const c = cols[Math.floor(r() * cols.length)];
    gr.addColorStop(0, c); gr.addColorStop(1, c + '00');
    g.globalAlpha = alpha; g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); g.globalAlpha = 1;
  }
}
const groundTex = (seed, draw) => { const r = prng(seed); return canvasTex(1250, 2000, (g, w, h) => draw(g, w, h, r)); };

const GROUNDS = {
  fort: (r) => groundTex(1, (g, w, h) => {
    g.fillStyle = '#5c9a38'; g.fillRect(0, 0, w, h);
    blotches(g, w, h, r, 120, ['#7cb84a', '#4a8a2c', '#8cc457', '#3f7a26'], 60, 220, 0.35);
    for (let i = 0; i < 60000; i++) {
      const x = r() * w, y = r() * h, l = 5 + r() * 9;
      g.strokeStyle = ['#4f8f2f', '#6aae3f', '#7fbf4a', '#3c7426', '#93cf5c'][Math.floor(r() * 5)];
      g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (r() - 0.5) * 4, y - l / 2, x + (r() - 0.5) * 6, y - l); g.stroke();
    }
    for (let i = 0; i < 260; i++) { const x = r() * w, y = r() * h; g.fillStyle = r() < 0.6 ? '#ffffff' : '#ffe066'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + Math.cos(k * 1.26) * 3, y + Math.sin(k * 1.26) * 3, 2.2, 0, 7); g.fill(); } g.fillStyle = '#f2b705'; g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); }
  }),
  clouds: (r) => groundTex(2, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f7c4e0'); gr.addColorStop(0.5, '#dccdf7'); gr.addColorStop(1, '#f7c4e0');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa'].forEach((c, i) => { g.globalAlpha = 0.55; g.fillStyle = c; g.fillRect(w * 0.38 + i * w * 0.04, 0, w * 0.04 + 1, h); });
    g.globalAlpha = 1; g.filter = 'blur(10px)'; g.drawImage(g.canvas, 0, 0); g.filter = 'none';
    blotches(g, w, h, r, 90, ['#ffffff', '#fff0f8'], 60, 180, 0.6);
    speckle(g, w, h, r, 900, ['#ffffff', '#fff4c2'], 1, 2.5);
  }),
  lava: (r) => groundTex(3, (g, w, h) => {
    g.fillStyle = '#3d2a22'; g.fillRect(0, 0, w, h);
    blotches(g, w, h, r, 140, ['#5a3e30', '#2a1c16', '#6b4a36'], 50, 200, 0.4);
    speckle(g, w, h, r, 30000, ['#2a1d17', '#57402f', '#6e5240', '#1e1410'], 0.6, 2.2);
    g.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      let x = r() * w, y = r() * h; g.strokeStyle = '#ff7a1a'; g.lineWidth = 1 + r() * 2; g.shadowColor = '#ff5a00'; g.shadowBlur = 8;
      g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 60; y += (r() - 0.5) * 60; g.lineTo(x, y); } g.stroke();
    }
    g.shadowBlur = 0;
  }),
  attic: (r) => groundTex(4, (g, w, h) => {
    const pw = w / 12;
    for (let i = 0; i < 12; i++) {
      const base = [100, 70, 50].map((v) => v + (r() - 0.5) * 30);
      let y0 = 0;
      while (y0 < h) {
        const len = 300 + r() * 600, sh = (r() - 0.5) * 20;
        g.fillStyle = `rgb(${base[0] + sh},${base[1] + sh},${base[2] + sh})`; g.fillRect(i * pw, y0, pw, len);
        for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(40,25,15,${0.15 + r() * 0.25})`; g.lineWidth = 1 + r() * 1.5; const x = i * pw + r() * pw; g.beginPath(); g.moveTo(x, y0); g.bezierCurveTo(x + (r() - 0.5) * 20, y0 + len / 3, x + (r() - 0.5) * 20, y0 + len * 0.66, x + (r() - 0.5) * 10, y0 + len); g.stroke(); }
        if (r() < 0.5) { const kx = i * pw + 15 + r() * (pw - 30), ky = y0 + r() * len; g.fillStyle = 'rgba(40,22,12,.6)'; g.beginPath(); g.ellipse(kx, ky, 6, 10, 0, 0, 7); g.fill(); }
        g.fillStyle = '#20140c'; g.fillRect(i * pw, y0 + len - 2, pw, 3);
        g.fillStyle = '#2a2a2a'; g.beginPath(); g.arc(i * pw + 12, y0 + len - 12, 3, 0, 7); g.arc(i * pw + pw - 12, y0 + len - 12, 3, 0, 7); g.fill();
        y0 += len;
      }
      g.fillStyle = '#1a0f08'; g.fillRect(i * pw + pw - 3, 0, 3, h);
    }
    g.strokeStyle = 'rgba(235,230,245,.35)'; g.lineWidth = 1.2;
    for (const [cx, cy, sx, sy] of [[0, 0, 1, 1], [w, 0, -1, 1], [0, h, 1, -1], [w, h, -1, -1]]) {
      for (let k = 0; k < 9; k++) { const a = (k / 8) * Math.PI / 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + sx * Math.cos(a) * 260, cy + sy * Math.sin(a) * 260); g.stroke(); }
      for (let ring = 1; ring < 6; ring++) { g.beginPath(); for (let k = 0; k < 9; k++) { const a = (k / 8) * Math.PI / 2, rr = ring * 45 + (k % 2) * 8; const x = cx + sx * Math.cos(a) * rr, y = cy + sy * Math.sin(a) * rr; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    }
    speckle(g, w, h, r, 1500, ['rgba(255,255,255,.18)'], 0.6, 1.6);
  }),
  bay: (r) => groundTex(5, (g, w, h) => {
    g.fillStyle = '#eef2f6'; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#6fcdf3'); gr.addColorStop(1, '#2f98d0');
    g.fillStyle = gr; g.beginPath(); g.roundRect(48, 48, w - 96, h - 96, 150); g.fill();
    g.save(); g.clip();
    for (let i = 0; i < 900; i++) { const x = r() * w, y = r() * h; g.strokeStyle = `rgba(255,255,255,${0.12 + r() * 0.25})`; g.lineWidth = 1.5 + r() * 2.5; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 20, y - 15, x + 40, y + 15, x + 60 + r() * 30, y + (r() - 0.5) * 20); g.stroke(); }
    g.restore();
  }),
  trenches: (r) => groundTex(6, (g, w, h) => {
    g.fillStyle = '#e4c584'; g.fillRect(0, 0, w, h);
    blotches(g, w, h, r, 120, ['#f2d89e', '#d4b06a', '#f7e3b5'], 60, 220, 0.4);
    for (let i = 0; i < 400; i++) { const x = r() * w, y = r() * h; g.strokeStyle = 'rgba(170,130,70,.35)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 30, y - 10, x + 60, y + 10, x + 100, y); g.stroke(); g.strokeStyle = 'rgba(255,248,225,.45)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y + 3); g.bezierCurveTo(x + 30, y - 7, x + 60, y + 13, x + 100, y + 3); g.stroke(); }
    speckle(g, w, h, r, 40000, ['#c9a462', '#f7e7c0', '#b38b4d', '#fff6dd'], 0.5, 1.4);
  }),
  pool: (r) => groundTex(7, (g, w, h) => {
    g.fillStyle = '#efcf9c'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 64) for (const y of [0, h - 45]) { g.fillStyle = r() < 0.5 ? '#f6dcae' : '#ead0a0'; g.fillRect(x + 2, y + 2, 60, 41); }
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#53cbe6'); gr.addColorStop(1, '#1f9ec6');
    g.fillStyle = gr; g.beginPath(); g.roundRect(62, 68, w - 124, h - 136, 80); g.fill();
    g.save(); g.clip();
    g.strokeStyle = 'rgba(210,250,255,.5)'; g.lineWidth = 2;
    for (let i = 0; i < 700; i++) { const x = r() * w, y = r() * h, s = 18 + r() * 30; g.beginPath(); for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI * 2; const rr = s * (0.7 + r() * 0.5); k ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.stroke(); }
    g.restore();
  }),
  rocket: (r) => groundTex(8, (g, w, h) => {
    g.fillStyle = '#262b40'; g.fillRect(0, 0, w, h);
    const pw = w / 4, ph = h / 8;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) {
      const v = 52 + (r() - 0.5) * 12; g.fillStyle = `rgb(${v},${v + 4},${v + 24})`; g.fillRect(i * pw + 4, j * ph + 4, pw - 8, ph - 8);
      for (let k = 0; k < 60; k++) { g.strokeStyle = `rgba(255,255,255,${r() * 0.05})`; g.beginPath(); const y = j * ph + 4 + r() * (ph - 8); g.moveTo(i * pw + 4, y); g.lineTo(i * pw + pw - 4, y); g.stroke(); }
      for (const [dx, dy] of [[14, 14], [pw - 14, 14], [14, ph - 14], [pw - 14, ph - 14]]) { g.fillStyle = '#8a92b0'; g.beginPath(); g.arc(i * pw + dx, j * ph + dy, 4.5, 0, 7); g.fill(); g.fillStyle = '#4a506a'; g.fillRect(i * pw + dx - 3, j * ph + dy - 0.8, 6, 1.6); }
    }
    g.fillStyle = 'rgba(125,249,255,.18)'; g.filter = 'blur(30px)'; g.fillRect(0, h / 2 - 50, w, 100); g.filter = 'none';
  }),
};

// ------------------------------------------------------------ path styles
function edgeFrame(a, b) {
  const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz);
  return { len, mx: (a.x + b.x) / 2, mz: (a.z + b.z) / 2, ang: -Math.atan2(dz, dx), ux: dx / len, uz: dz / len };
}
function strip(a, b, width, h, mat, y = 0) {
  const f = edgeFrame(a, b);
  return mesh(G.box(f.len, h, width, Math.min(h / 2.2, 4), 2), mat, f.mx, y + h / 2, f.mz, { ry: f.ang });
}
function rod(a, b, r, mat, y) {
  const f = edgeFrame(a, b);
  const m = mesh(G.cyl(r, r, f.len, 24), mat, f.mx, y, f.mz);
  m.rotation.set(0, f.ang, Math.PI / 2);
  return m;
}
function along(a, b, step, fn, margin = 60) {
  const f = edgeFrame(a, b), out = [];
  for (let d = margin; d < f.len - margin; d += step) out.push(fn(a.x + f.ux * d, a.z + f.uz * d, f, d));
  return out;
}

const dirtTex = noiseTex(256, { blobs: 9000, contrast: 1, repeat: [1, 1], seed: 21 });

const PATHS = {
  fort: (a, b, r) => [
    strip(a, b, 66, 1, matte('#6e5a36', { opacity: 0.6 })),
    strip(a, b, 50, 3, plastic('#c9a46a', { rough: 0.95, clearcoat: 0, bump: dirtTex, bumpScale: 3 })),
    ...along(a, b, 18, (x, z, f) => mesh(G.sphere(2 + r() * 3, 8, 6), matte(['#9c8d78', '#b3a58e', '#7d705e'][Math.floor(r() * 3)]), x + (r() - 0.5) * 40 * f.uz, 3, z - (r() - 0.5) * 40 * f.ux, { s: [1, 0.5, 1] })),
  ],
  clouds: (a, b) => [
    rod(a, b, 15, plastic('#ffffff', { rough: 0.3 }), 15),
    ...along(a, b, 26, (x, z, f) => { const m = mesh(G.torus(15.5, 3.2, Math.PI * 2, 24), plastic('#ff6fae', { rough: 0.3 }), x, 15, z); m.rotation.set(0, f.ang + Math.PI / 2, 0); return m; }, 40),
  ],
  lava: (a, b) => [
    ...[-1, 1].map((s) => { const f = edgeFrame(a, b); const m = rod({ x: a.x - f.uz * 26 * s, z: a.z + f.ux * 26 * s }, { x: b.x - f.uz * 26 * s, z: b.z + f.ux * 26 * s }, 2.5, matte('#8b6a3f'), 14); return m; }),
    ...along(a, b, 22, (x, z, f) => mesh(G.box(16, 6, 50, 2.5), plastic(['#b07c45', '#a06e3a', '#c08a50'][Math.floor(Math.random() * 3)], { rough: 0.8, clearcoat: 0 }), x, 8, z, { ry: f.ang }), 20),
  ],
  attic: (a, b) => {
    const f = edgeFrame(a, b);
    const tex = rugTex.clone(); tex.needsUpdate = true; tex.repeat.set(f.len / 120, 1);
    return [strip(a, b, 52, 2, matte('#ffffff', { map: tex }))];
  },
  bay: (a, b, r) => [
    rod(a, b, 5, plastic('#d9c08f', { rough: 0.9, clearcoat: 0, bump: dirtTex, bumpScale: 2 }), 6),
    ...along(a, b, 70, (x, z) => group(mesh(G.sphere(12), plastic('#e5484d', { rough: 0.25 }), 0, 8, 0), mesh(G.torus(12, 3), plastic('#ffffff', { rough: 0.25 }), 0, 8, 0, { rx: Math.PI / 2 })).translateX(x).translateZ(z)),
  ],
  trenches: (a, b) => [
    strip(a, b, 62, 2, matte('#6b4a28')),
    ...along(a, b, 15, (x, z, f) => mesh(G.box(12, 5, 46, 1.5), plastic(['#a8743f', '#986636', '#b5804a'][Math.floor(Math.random() * 3)], { rough: 0.85, clearcoat: 0 }), x, 4, z, { ry: f.ang }), 10),
  ],
  pool: (a, b) => [rod(a, b, 13, plastic('#f04e98', { rough: 0.35, clearcoat: 0.4 }), 13)],
  rocket: (a, b) => [
    strip(a, b, 38, 4, metal('#2d3150', 0.45)),
    strip(a, b, 8, 5.5, glow('#7df9ff', 1.8)),
    ...[-1, 1].map((s) => { const f = edgeFrame(a, b); return strip({ x: a.x - f.uz * 17 * s, z: a.z + f.ux * 17 * s }, { x: b.x - f.uz * 17 * s, z: b.z + f.ux * 17 * s }, 4, 7, metal('#8a92b0', 0.3)); }),
  ],
};
const rugTex = canvasTex(256, 128, (g, w, h) => {
  g.fillStyle = '#7b2d3a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#d9b25e'; g.fillRect(0, 14, w, 8); g.fillRect(0, h - 22, w, 8);
  g.fillStyle = '#2f4a6b'; for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x + 16, 34); g.lineTo(x + 30, h / 2); g.lineTo(x + 16, h - 34); g.lineTo(x + 2, h / 2); g.closePath(); g.fill(); }
  g.fillStyle = '#d9b25e'; for (let x = 0; x < w; x += 32) { g.beginPath(); g.arc(x + 16, h / 2, 5, 0, 7); g.fill(); }
}, { repeat: [1, 1] });

// ------------------------------------------------------------ bases
function cobbleSlab(edge, mortar, stones, r) {
  const parts = [mesh(G.box(BASE, 14, BASE, 14), plastic(edge, { rough: 0.85, clearcoat: 0, bump: dirtTex, bumpScale: 2 }), 0, 7, 0),
    mesh(G.box(BASE - 14, 2, BASE - 14, 1), matte(mortar), 0, 14.5, 0)];
  const cell = (BASE - 18) / 3;
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
    const w = cell - 4 - r() * 4, d = cell - 4 - r() * 4;
    parts.push(mesh(G.box(w, 7 + r() * 3, d, 5), plastic(stones[Math.floor(r() * stones.length)], { rough: 0.75, clearcoat: 0.05, bump: dirtTex, bumpScale: 1.5 }),
      -BASE / 2 + 9 + cell * (i + 0.5) + (r() - 0.5) * 3, 16, -BASE / 2 + 9 + cell * (j + 0.5) + (r() - 0.5) * 3, { ry: (r() - 0.5) * 0.15 }));
  }
  return group(parts);
}
const spongeBump = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); const r = prng(9); for (let i = 0; i < 90; i++) { g.fillStyle = `rgb(${60 + r() * 60},${60 + r() * 60},${60 + r() * 60})`; g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * 9, 3 + r() * 7, r() * 3, 0, 7); g.fill(); } }, { srgb: false });
const waffleBump = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#555'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; for (let i = 0; i <= 6; i++) { g.fillRect(i * 42 - 5, 0, 10, h); g.fillRect(0, i * 42 - 5, w, 10); } }, { srgb: false });

const BASES = {
  fort: (r) => cobbleSlab('#868b91', '#55595e', ['#b8bcc0', '#a5aaaf', '#c6c9cc', '#9da1a5'], r),
  clouds: () => group(mesh(G.box(BASE, 18, BASE, 20), plastic('#e9b45a', { rough: 0.6, clearcoat: 0.2, bump: waffleBump, bumpScale: 6 }), 0, 9, 0)),
  lava: (r) => cobbleSlab('#6e3424', '#331a12', ['#a4553a', '#b8643f', '#93482f', '#c06d47'], r),
  attic: (r) => { const col = ['#6b2f3a', '#2f4a6b', '#3d5e3a', '#5a3d6b'][Math.floor(r() * 4)];
    return group(mesh(G.box(BASE - 6, 20, BASE - 10, 4), matte('#efe6d0'), 4, 11, 4), mesh(G.box(BASE, 6, BASE - 2, 4), plastic(col, { rough: 0.6 }), 0, 24, 0),
      mesh(G.box(BASE, 6, BASE - 2, 4), plastic(col, { rough: 0.6 }), 0, 3, 0), mesh(G.box(14, 26, BASE - 2, 4), plastic(col, { rough: 0.6 }), -BASE / 2 + 7, 14, 0),
      ...[[-1, 0], [1, 0], [0, -1], [0, 1]].map(([sx, sz]) => mesh(G.box(sx ? 3 : 70, 1.5, sz ? 3 : 70, 0.5), metal('#d9b25e', 0.3), sx * 35 + 6, 27.5, sz * 35))); },
  bay: () => group(mesh(G.box(BASE, 24, BASE, 18), plastic('#f2c534', { rough: 0.9, clearcoat: 0, bump: spongeBump, bumpScale: 10 }), 0, 12, 0)),
  trenches: (r) => { const p = []; for (let row = 0; row < 3; row++) for (let k = 0; k < 2; k++) p.push(mesh(G.sphere(30, 24, 16), plastic('#d6c398', { rough: 0.95, clearcoat: 0, bump: dirtTex, bumpScale: 3 }), -29 + k * 58 + (row % 2) * 4, 12 + row * 2, -40 + row * 40, { s: [0.95, 0.42, 0.62] })); return group(p); },
  pool: () => group(mesh(G.torus(46, 18), plastic('#2c3040', { rough: 0.25, clearcoat: 1 }), 0, 18, 0, { rx: Math.PI / 2 })),
  rocket: () => group(mesh(G.box(BASE, 14, BASE, 14), metal('#a9b4c2', 0.42), 0, 7, 0),
    ...[-22, 0, 22].map((dz) => mesh(G.box(70, 2, 8, 1), metal('#6e7a8c', 0.5), 0, 14.5, dz)),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => mesh(G.cyl(4.5, 4.5, 2, 16), metal('#5d6878', 0.4), sx * 50, 14.6, sz * 50))),
};

// ------------------------------------------------------------ specials
const SPECIALS = {
  retreat: (r, theme) => group(BASES[theme](r),
    mesh(G.cyl(30, 34, 70, 32), plastic('#b0aaa1', { rough: 0.85, clearcoat: 0, bump: dirtTex, bumpScale: 3 }), 30, 50, -30),
    ...[...Array(8)].map((_, i) => mesh(G.box(12, 14, 12, 2), plastic('#bdb7ae', { rough: 0.85, clearcoat: 0 }), 30 + Math.cos(i / 8 * Math.PI * 2) * 28, 90, -30 + Math.sin(i / 8 * Math.PI * 2) * 28)),
    mesh(G.cyl(2, 2, 60), metal('#5a4630', 0.6), 30, 120, -30),
    mesh(new THREE.PlaneGeometry(38, 22), plastic('#e8c34a', { side: THREE.DoubleSide }), 50, 140, -30)),
  draw: () => group(
    mesh(G.cyl(52, 40, 50, 24), plastic('#c98a46', { rough: 0.7, clearcoat: 0 }), 0, 25, 0),
    mesh(G.sphere(58, 32, 24), plastic('#ffb3d6', { rough: 0.4 }), 0, 56, 0, { s: [1, 0.55, 1] }),
    mesh(G.sphere(36, 32, 24), plastic('#ffc6e0', { rough: 0.4 }), 0, 78, 0, { s: [1, 0.6, 1] }),
    mesh(G.sphere(13), plastic('#d4222f', { rough: 0.15, clearcoat: 1 }), 0, 98, 0),
    ...[...Array(26)].map((_, i) => { const a = i * 2.4, rr = 12 + (i % 5) * 9; return mesh(G.cap(1.6, 6), plastic(['#ffd43b', '#4dabf7', '#69db7c', '#fff'][i % 4]), Math.cos(a) * rr, 74 + (i % 3) * 4, Math.sin(a) * rr, { rz: a, rx: 1.2 }); })),
  push: () => group(
    mesh(G.cone(66, 80, 32), plastic('#5e3a26', { rough: 0.9, clearcoat: 0, bump: dirtTex, bumpScale: 4 }), 0, 40, 0),
    mesh(G.cyl(22, 22, 4, 32), new THREE.MeshBasicMaterial({ map: lavaTex }), 0, 78, 0),
    ...[0, 2.1, 4.2].map((a) => mesh(G.cap(5, 34), glow('#ff4a00', 1.0), Math.cos(a) * 30, 58, Math.sin(a) * 30, { rz: Math.cos(a) * 0.9, rx: -Math.sin(a) * 0.9 }))),
  revive: () => group(
    mesh(G.box(130, 60, 80, 8), plastic('#7a4b25', { rough: 0.7, clearcoat: 0.1, bump: dirtTex, bumpScale: 2 }), 0, 30, 10),
    mesh(new THREE.CylinderGeometry(40, 40, 130, 32, 1, false, 0, Math.PI), plastic('#93602f', { rough: 0.7, clearcoat: 0.1 }), 0, 60, 10, { rz: Math.PI / 2 }),
    ...[-45, 45].map((x) => mesh(G.box(10, 64, 84, 2), metal('#b08a3c', 0.35), x, 34, 10)),
    mesh(G.box(20, 22, 6, 3), metal('#d4a838', 0.3), 0, 40, 52),
    group(mesh(G.sphere(26), plastic('#f6f6fb', { rough: 0.5, opacity: 0.85 }), 0, 0, 0), mesh(G.cone(26, 40, 24), plastic('#f6f6fb', { rough: 0.5, opacity: 0.85 }), 0, -18, 0, { rx: Math.PI }),
      mesh(G.sphere(4), matte('#222'), -9, 4, 23), mesh(G.sphere(4), matte('#222'), 9, 4, 23)).translateY(130).translateZ(-10)),
  snipe: () => group(
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => mesh(G.cyl(4, 5, 90, 12), plastic('#7a5a34', { rough: 0.8, clearcoat: 0 }), sx * 40, 45, sz * 40)),
    mesh(G.box(110, 8, 110, 3), plastic('#8d6a3e', { rough: 0.8, clearcoat: 0 }), 0, 92, 0),
    mesh(G.cone(78, 34, 4), plastic('#4f7a3a', { rough: 0.7, clearcoat: 0 }), 0, 125, 0, { ry: Math.PI / 4 })),
  shield: () => group(
    mesh(G.box(BASE, 12, BASE, 12), metal('#5a6a80', 0.4), 0, 6, 0),
    mesh(G.box(BASE - 16, 10, BASE - 16, 10), glow('#7df9ff', 1.2), 0, 14, 0),
    mesh(G.box(BASE + 10, 40, BASE + 10, 16), plastic('#9ff6ff', { opacity: 0.25, rough: 0.05, emissive: '#3ad7ff', ei: 0.6 }), 0, 30, 0)),
  restrict: () => group(
    ...[[0, -46, 128, 36], [0, 46, 128, 36], [-46, 0, 36, 128], [46, 0, 36, 128]].map(([x, z, w, d]) => mesh(G.box(w, 30, d, 15), plastic('#f5a623', { rough: 0.3 }), x, 15, z)),
    ...[[0, -46, 20, 38], [0, 46, 20, 38], [-46, 0, 38, 20], [46, 0, 38, 20]].map(([x, z, w, d]) => mesh(G.box(w, 31, d, 10), plastic('#ffffff', { rough: 0.3 }), x, 15.5, z))),
};

// ------------------------------------------------------------ H.Q.
const HQS = {
  fort: (t) => group(
    mesh(G.cone(118, 160, 4), plastic(t.main, { rough: 0.75, clearcoat: 0, bump: dirtTex, bumpScale: 1 }), 0, 80, 0, { ry: Math.PI / 4 }),
    mesh(G.box(40, 70, 8, 4), matte('#2a1d14'), 0, 35, 82),
    mesh(G.cyl(3, 3, 60), metal('#5a4630', 0.6), 0, 185, 0),
    mesh(new THREE.PlaneGeometry(50, 28), plastic(t.light, { side: THREE.DoubleSide }), 26, 200, 0),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => mesh(G.cyl(3, 3, 14), matte('#8d7a5c'), sx * 110, 7, sz * 110))),
  clouds: (t) => group(
    mesh(G.box(170, 80, 120, 14), plastic(t.main, { rough: 0.35 }), 0, 40, 0),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => group(mesh(G.cyl(28, 28, 110, 32), plastic(t.light, { rough: 0.35 }), 0, 55, 0), mesh(G.cone(34, 50, 32), plastic(t.main, { rough: 0.35 }), 0, 135, 0), mesh(G.sphere(8), plastic('#f4c430', { rough: 0.2 }), 0, 162, 0)).translateX(sx * 80).translateZ(sz * 55)),
    ...[...Array(6)].map((_, i) => mesh(G.sphere(10), plastic(['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7'][i % 4], { rough: 0.2 }), -50 + i * 20, 84, 0, { s: [1, 0.7, 1] }))),
  lava: (t) => group(
    mesh(G.box(180, 40, 180, 6), plastic('#8c6a4c', { rough: 0.9, clearcoat: 0, bump: dirtTex, bumpScale: 3 }), 0, 20, 0),
    mesh(G.box(140, 40, 140, 6), plastic('#a07c5a', { rough: 0.9, clearcoat: 0, bump: dirtTex, bumpScale: 3 }), 0, 60, 0),
    mesh(G.box(100, 40, 100, 6), plastic('#b08c68', { rough: 0.9, clearcoat: 0, bump: dirtTex, bumpScale: 3 }), 0, 100, 0),
    mesh(G.box(70, 14, 70, 6), plastic(t.main, { rough: 0.4 }), 0, 127, 0),
    mesh(G.box(50, 60, 10, 4), plastic(t.dark), 0, 50, 91)),
  attic: (t) => group(
    mesh(G.box(180, 90, 120, 10), plastic(t.main, { rough: 0.5 }), 0, 45, 0),
    mesh(new THREE.CylinderGeometry(60, 60, 180, 48, 1, false, 0, Math.PI), plastic(shade(t.main), { rough: 0.5 }), 0, 90, 0, { rz: Math.PI / 2 }),
    ...[-60, 60].map((x) => mesh(G.box(12, 96, 124, 3), metal('#c9a23c', 0.3), x, 48, 0)),
    mesh(G.box(30, 36, 8, 4), metal('#d4a838', 0.3), 0, 80, 64)),
  bay: (t) => group(
    mesh(G.shape([[-70, -95], [70, -95], [80, 40], [0, 105], [-80, 40]], 34, 8), plastic(t.main, { rough: 0.3 }), 0, 0, 0, { rx: -Math.PI / 2 }),
    mesh(G.box(150, 6, 6, 3), plastic('#ffffff'), 0, 30, 60),
    mesh(G.box(70, 34, 56, 10), plastic(t.light, { rough: 0.35 }), 0, 51, 24),
    mesh(G.box(74, 6, 60, 3), plastic(t.dark), 0, 70, 24),
    ...[-28, 0, 28].map((x) => mesh(G.cyl(8, 8, 3, 20), plastic('#8fd0ee', { rough: 0.05 }), x, 60, 56, { rx: Math.PI / 2 })),
    mesh(G.cyl(4, 4, 150), metal('#6b4a2a', 0.6), 0, 110, -20),
    mesh(G.shape([[0, 0], [0, 120], [70, 10]], 2, 0), plastic('#ffffff', { side: THREE.DoubleSide, rough: 0.7, clearcoat: 0 }), 4, 50, -20)),
  trenches: (t) => group(
    mesh(G.box(180, 60, 140, 8), plastic('#e3bf78', { rough: 0.95, clearcoat: 0, bump: dirtTex, bumpScale: 4 }), 0, 30, 0),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => group(mesh(G.cyl(28, 32, 100, 24), plastic('#ecca86', { rough: 0.95, clearcoat: 0, bump: dirtTex, bumpScale: 4 }), 0, 50, 0),
      ...[...Array(6)].map((_, i) => mesh(G.box(12, 14, 12, 2), plastic('#ecca86', { rough: 0.95, clearcoat: 0 }), Math.cos(i * 1.047) * 24, 106, Math.sin(i * 1.047) * 24))).translateX(sx * 82).translateZ(sz * 62)),
    mesh(G.box(96, 30, 76, 6), plastic('#ecca86', { rough: 0.95, clearcoat: 0, bump: dirtTex, bumpScale: 4 }), 0, 75, 0),
    mesh(G.box(80, 10, 60, 4), plastic(t.main), 0, 95, 0),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => mesh(G.cone(30, 30, 24), plastic(t.main), sx * 82, 128, sz * 62)),
    mesh(G.cyl(3, 3, 80), metal('#5a4630', 0.6), 0, 120, 0),
    mesh(new THREE.PlaneGeometry(50, 28), plastic(t.main, { side: THREE.DoubleSide }), 26, 148, 0)),
  pool: (t, n) => group(
    mesh(G.box(172, 40, 152, 40), plastic(t.main, { rough: 0.2, clearcoat: 1 }), 0, 20, 0),
    mesh(G.box(110, 14, 92, 20), plastic(t.light, { rough: 0.2, clearcoat: 1 }), 0, 34, 0),
    ...[-40, 0, 40].map((x) => mesh(G.box(3, 41, 152, 1), plastic(shade(t.main)), x, 20, 0))),
  rocket: (t) => group(
    mesh(G.box(176, 16, 176, 20), metal(t.dark, 0.45), 0, 8, 0),
    mesh(G.box(150, 4, 150, 14), metal('#c9d2dd', 0.4), 0, 18, 0),
    ...[...Array(4)].map((_, i) => mesh(G.box(150, 4.4, 14, 2), plastic(i % 2 ? '#1d1d1d' : '#e8b931'), 0, 18.2, -60 + i * 40)),
    mesh(G.lathe([[0, 0], [34, 0], [38, 40], [34, 110], [20, 150], [0, 170]]), plastic('#eef1f5', { rough: 0.25 }), 0, 20, 0),
    ...[0, 1, 2, 3].map((i) => mesh(G.box(6, 50, 46, 3), plastic(t.main), Math.cos(i * Math.PI / 2) * 40, 40, Math.sin(i * Math.PI / 2) * 40, { ry: -i * Math.PI / 2 })),
    mesh(G.sphere(14), plastic('#7df9ff', { rough: 0.05 }), 0, 120, 30)),
};
function shade(hex) { const c = new THREE.Color(hex); c.offsetHSL(0, 0, -0.12); return '#' + c.getHexString(); }

// ------------------------------------------------------------ props
function bush(r, s = 1, greens = ['#2f6f2a', '#3e8a35', '#4f9e3f', '#367d2e']) {
  const g = group(...[...Array(7)].map(() => mesh(G.sphere(16 + r() * 12, 16, 12), plastic(greens[Math.floor(r() * greens.length)], { rough: 0.9, clearcoat: 0, bump: dirtTex, bumpScale: 4 }), (r() - 0.5) * 48, 14 + r() * 24, (r() - 0.5) * 48)));
  g.scale.setScalar(s); return g;
}
const rock = (r, s = 1, col = '#8d939a') => mesh(new THREE.DodecahedronGeometry(18, 0), plastic(col, { rough: 0.9, clearcoat: 0, bump: dirtTex, bumpScale: 3 }), 0, 6, 0, { s: [s * (1 + r() * 0.5), s * 0.6, s], ry: r() * 6 });
const margins = (r, n, fn, inset = 75) => [...Array(n)].map(() => { const o = fn(); o.position.x += (r() < 0.5 ? -BW / 2 + 15 + r() * inset : BW / 2 - 15 - r() * inset); o.position.z += (r() - 0.5) * BH * 0.98; return o; });

const lavaTex = canvasTex(256, 256, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); gr.addColorStop(0, '#ffe27a'); gr.addColorStop(0.4, '#ff9a1a'); gr.addColorStop(0.8, '#e8420a'); gr.addColorStop(1, '#8a1e00');
  g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = prng(4);
  for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(120,20,0,${0.3 + r() * 0.4})`; g.lineWidth = 2 + r() * 4; g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); }
});
function lavaPool(r) {
  const s = new THREE.Shape(); const n = 14;
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, rr = 70 + r() * 30; const x = Math.cos(a) * rr * 1.3, y = Math.sin(a) * rr; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  const rim = mesh(new THREE.ExtrudeGeometry(s, { depth: 6, bevelEnabled: true, bevelSize: 10, bevelThickness: 4 }), plastic('#2a1a12', { rough: 0.9, clearcoat: 0 }), 0, 0, 0, { rx: -Math.PI / 2 });
  const lava = mesh(new THREE.ShapeGeometry(s), new THREE.MeshBasicMaterial({ map: lavaTex }), 0, 10.5, 0, { rx: -Math.PI / 2, s: [0.86, 0.86, 1], cast: false });
  return group(rim, lava, ...[...Array(5)].map(() => mesh(G.sphere(5 + r() * 6), new THREE.MeshBasicMaterial({ color: '#ffcf4a' }), (r() - 0.5) * 120, 11, (r() - 0.5) * 80, { s: [1, 0.4, 1], cast: false })));
}

const PROPS = {
  fort: (r) => [...margins(r, 22, () => bush(r, 0.9 + r() * 0.7)), ...margins(r, 8, () => rock(r, 1 + r()))],
  clouds: (r) => margins(r, 18, () => group(...[...Array(6)].map(() => mesh(G.sphere(22 + r() * 18), plastic('#ffffff', { rough: 0.8, clearcoat: 0 }), (r() - 0.5) * 70, 10 + r() * 20, (r() - 0.5) * 50))), 80),
  lava: (r, m, P) => [...margins(r, 16, () => bush(r, 0.8 + r() * 0.5, ['#1f5a2a', '#2c7a36', '#3c8d40'])), ...margins(r, 6, () => rock(r, 1, '#4a3a30')),
    ...m.regions.filter((_, i) => i % 2 === 0).map((rg) => { const p = P({ x: rg.x, y: rg.y }); const g = lavaPool(r); g.position.set(p.x, 0, p.z); return g; })],
  attic: (r) => [...margins(r, 10, () => mesh(G.sphere(9), plastic(['#e5484d', '#3b7dd8', '#ffd34d', '#69db7c'][Math.floor(r() * 4)], { rough: 0.05, clearcoat: 1, opacity: 0.85 }), 0, 9, 0)),
    ...margins(r, 6, () => mesh(G.box(36, 36, 36, 5), plastic(['#e5484d', '#3b7dd8', '#ffd34d', '#69db7c'][Math.floor(r() * 4)], { rough: 0.5 }), 0, 18, 0, { ry: r() * 2 }))],
  bay: (r) => [...[...Array(40)].map(() => mesh(G.sphere(5 + r() * 14), plastic('#ffffff', { opacity: 0.35, rough: 0.05, clearcoat: 1 }), (r() - 0.5) * 880, 6, (r() - 0.5) * 1480, { cast: false })),
    mesh(G.box(BW, 34, 40, 16), plastic('#f7f9fb', { rough: 0.2 }), 0, 17, -BH / 2 + 20), mesh(G.box(BW, 34, 40, 16), plastic('#f7f9fb', { rough: 0.2 }), 0, 17, BH / 2 - 20),
    mesh(G.box(40, 34, BH, 16), plastic('#f7f9fb', { rough: 0.2 }), -BW / 2 + 20, 17, 0), mesh(G.box(40, 34, BH, 16), plastic('#f7f9fb', { rough: 0.2 }), BW / 2 - 20, 17, 0),
    group(mesh(G.cyl(22, 22, 40, 24), metal('#c7cfd8', 0.2), 0, 30, 0), mesh(G.cyl(9, 9, 100, 16), metal('#c7cfd8', 0.2), -50, 50, 0, { rz: Math.PI / 2 })).translateX(BW / 2 - 40).translateZ(0)],
  trenches: (r) => [...margins(r, 9, () => mesh(G.star(26, 11, 6, 3), plastic('#f08a5d', { rough: 0.6, clearcoat: 0, bump: dirtTex, bumpScale: 3 }), 0, 2, 0, { rx: -Math.PI / 2, rz: r() * 6 })),
    ...margins(r, 8, () => mesh(G.hemi(16), plastic('#f3a5c0', { rough: 0.4 }), 0, 0, 0, { s: [1, 0.5, 1.2] })), ...margins(r, 10, () => rock(r, 0.6, '#b5a184'))],
  pool: (r) => [group(mesh(G.sphere(40), plastic('#ffffff', { map: beachTex, rough: 0.2 }), 0, 40, 0)).translateX(-BW / 2 + 130).translateZ(BH / 2 - 130)],
  rocket: (r) => [...margins(r, 6, () => mesh(G.box(50, 40, 50, 4), metal('#59607e', 0.5), 0, 20, 0, { ry: r() * 0.5 })),
    ...[...Array(6)].map((_, i) => mesh(G.box(8, 3, 70, 2), glow(i % 2 ? '#7df9ff' : '#ff5c9a', 1.5), i < 3 ? -BW / 2 + 30 : BW / 2 - 30, 2, -500 + (i % 3) * 500))],
};
const beachTex = canvasTex(256, 128, (g, w, h) => { ['#e5484d', '#ffffff', '#3b7dd8', '#ffffff', '#ffd34d', '#ffffff'].forEach((c, i) => { g.fillStyle = c; g.fillRect(i * w / 6, 0, w / 6 + 1, h); }); });

// Decorations on the "table" around the board, seen at the sides on wide screens.
function surroundProps(theme, r) {
  const out = [];
  const place = (o) => { o.position.x += (r() < 0.5 ? -1 : 1) * (560 + r() * 520); o.position.z += (r() - 0.5) * 2200; out.push(o); return o; };
  const greens = { fort: ['#2f6f2a', '#3e8a35', '#4f9e3f', '#367d2e'], lava: ['#1f5a2a', '#2c7a36', '#3c8d40'] };
  const n = 46;
  for (let i = 0; i < n; i++) {
    switch (theme) {
      case 'fort': place(r() < 0.75 ? bush(r, 1 + r() * 1.2, greens.fort) : rock(r, 1.2 + r())); break;
      case 'lava': place(r() < 0.6 ? bush(r, 1 + r(), greens.lava) : rock(r, 1.4 + r(), '#4a3a30')); break;
      case 'clouds': place(group(...[...Array(6)].map(() => mesh(G.sphere(26 + r() * 22), plastic('#ffffff', { rough: 0.8, clearcoat: 0 }), (r() - 0.5) * 90, 10 + r() * 24, (r() - 0.5) * 60)))); break;
      case 'attic': place(r() < 0.5 ? mesh(G.box(40, 40, 40, 6), plastic(['#e5484d', '#3b7dd8', '#ffd34d', '#69db7c'][Math.floor(r() * 4)], { rough: 0.5 }), 0, 20, 0, { ry: r() * 2 }) : mesh(G.sphere(10), plastic(['#e5484d', '#3b7dd8', '#ffd34d', '#69db7c'][Math.floor(r() * 4)], { rough: 0.05, clearcoat: 1, opacity: 0.85 }), 0, 10, 0)); break;
      case 'bay': place(mesh(G.sphere(8 + r() * 16), plastic('#ffffff', { opacity: 0.45, rough: 0.05, clearcoat: 1 }), 0, 8, 0, { cast: false })); break;
      case 'trenches': place(r() < 0.4 ? mesh(G.star(26, 11, 6, 3), plastic('#f08a5d', { rough: 0.6, clearcoat: 0 }), 0, 2, 0, { rx: -Math.PI / 2, rz: r() * 6 }) : r() < 0.6 ? mesh(G.hemi(16), plastic('#f3a5c0', { rough: 0.4 }), 0, 0, 0, { s: [1, 0.5, 1.2] }) : rock(r, 0.7, '#b5a184')); break;
      case 'pool': if (i < 10) place(mesh(G.box(70, 6, 120, 4), plastic(['#e5484d', '#3b7dd8', '#ffd34d'][i % 3], { rough: 0.6, clearcoat: 0 }), 0, 3, 0, { ry: r() })); break;
      case 'rocket': if (i < 20) place(mesh(G.box(60, 44, 60, 5), metal('#59607e', 0.5), 0, 22, 0, { ry: r() * 0.6 })); break;
    }
  }
  return out;
}

// ------------------------------------------------------------ assemble + render
export function buildBoard(mapId, flip) {
  const m = MAPS[mapId];
  const r = prng(mapId.length * 977 + 13);
  const P = (n) => (flip ? { x: 500 - n.x, z: 800 - n.y } : { x: n.x - 500, z: n.y - 800 });
  const scene = new THREE.Scene();
  scene.environment = envTex;
  const tex = GROUNDS[m.theme](r);
  const ground = mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0, bumpMap: dirtTex, bumpScale: 0.6, envMapIntensity: 0.25 }), 0, 0, 0, { rx: -Math.PI / 2, cast: false });
  if (flip) ground.rotation.z = Math.PI;
  scene.add(ground);
  const SURROUND = { fort: '#3d7426', clouds: '#e7c3e6', lava: '#2a1c16', attic: '#33221a', bay: '#d9e1e8', trenches: '#cfa962', pool: '#e2c18a', rocket: '#181c2d' };
  scene.add(mesh(new THREE.PlaneGeometry(6000, 8000), new THREE.MeshStandardMaterial({ color: SURROUND[m.theme], roughness: 1, bumpMap: dirtTex, bumpScale: 0.6 }), 0, -0.5, 0, { rx: -Math.PI / 2, cast: false }));

  const nodes = {};
  for (const id in m.nodes) nodes[id] = P(m.nodes[id]);
  for (const [u, v] of m.edges) PATHS[m.theme](nodes[u], nodes[v], r).forEach((o) => scene.add(o));
  // medal sockets
  for (const rg of m.regions) {
    const c = P({ x: rg.x, y: rg.y });
    for (let k = 0; k < rg.medals; k++) scene.add(mesh(G.cyl(20, 20, 1.5, 32), matte('#000000', { opacity: 0.35 }), c.x + (k - (rg.medals - 1) / 2) * 46, 0.8, c.z, { cast: false }));
  }
  for (const id in m.nodes) {
    const n = m.nodes[id], p = nodes[id], nr = prng(id.charCodeAt(0) * 131 + (id.charCodeAt(1) || 0) * 7 + m.id.length);
    let obj;
    if (n.hq) obj = HQS[m.theme](TEAM[n.hq], n);
    else if (n.special && n.special !== 'restrict') obj = n.special === 'retreat' ? SPECIALS.retreat(nr, m.theme) : SPECIALS[n.special](nr, m.theme);
    else if (n.special === 'restrict') obj = SPECIALS.restrict();
    else obj = BASES[m.theme](nr);
    obj.position.set(p.x, 0, p.z);
    if (flip && n.hq) obj.rotation.y = Math.PI;
    scene.add(obj);
  }
  for (const o of PROPS[m.theme](r, m, P) || []) scene.add(o);
  for (const o of surroundProps(m.theme, r)) scene.add(o);
  scene.traverse((o) => {
    if (!o.isMesh || o === ground) return;
    const mt = o.material;
    if (!mt.userData.boardAdj) { mt.userData.boardAdj = true; mt.envMapIntensity = (mt.envMapIntensity ?? 1) * 0.4; if (mt.emissiveIntensity > 1) mt.emissiveIntensity *= 0.55; }
  });

  const sun = new THREE.DirectionalLight('#fff1dc', 2.1);
  sun.position.set(-800, 1000, -1000);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -1000, right: 1000, top: 1100, bottom: -1100, near: 100, far: 3000 });
  sun.shadow.radius = 5; sun.shadow.bias = -0.0004;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight('#ffffff', '#55483c', m.theme === 'rocket' || m.theme === 'attic' || m.theme === 'lava' ? 0.45 : 0.55));
  return scene;
}

// Angled "arena" camera fitted so every base, H.Q. and standing troop is in frame.
function fitCamera(m, flip, aspect) {
  const P = (n) => (flip ? { x: 500 - n.x, z: 800 - n.y } : { x: n.x - 500, z: n.y - 800 });
  const cam = new THREE.PerspectiveCamera(34, aspect, 10, 30000);
  const el = (54 * Math.PI) / 180;
  const pts = [];
  for (const id in m.nodes) {
    const p = P(m.nodes[id]), r = m.nodes[id].hq ? 100 : 80;
    for (const [dx, dz] of [[-r, -r], [r, -r], [-r, r], [r, r]]) pts.push(new THREE.Vector3(p.x + dx, 0, p.z + dz));
    pts.push(new THREE.Vector3(p.x, 170, p.z));
  }
  let tz = 0, d = 3000;
  const place = () => { cam.position.set(0, Math.sin(el) * d, tz + Math.cos(el) * d); cam.lookAt(0, 0, tz); cam.updateMatrixWorld(); cam.updateProjectionMatrix(); };
  const extent = () => { let mx = 0, ymin = 9, ymax = -9; for (const v of pts) { const q = v.clone().project(cam); mx = Math.max(mx, Math.abs(q.x)); ymin = Math.min(ymin, q.y); ymax = Math.max(ymax, q.y); } return { mx, ymin, ymax }; };
  for (let it = 0; it < 8; it++) {
    let lo = 300, hi = 20000;
    for (let k = 0; k < 40; k++) { d = (lo + hi) / 2; place(); const e = extent(); (Math.max(e.mx, e.ymax, -e.ymin) > 0.97 ? (lo = d) : (hi = d)); }
    d = hi; place();
    const e = extent(), yc = (e.ymin + e.ymax) / 2;
    if (Math.abs(yc) < 0.003) break;
    tz -= yc * 400;
  }
  return { cam, P };
}

// Screen positions (in the 1000 x 1600 board image space) of every node and medal slot.
export function boardLayout(mapId, flip) {
  const m = MAPS[mapId];
  const { cam, P } = fitCamera(m, flip, IW / IH);
  const px = (v) => { const q = v.clone().project(cam); return [(q.x + 1) / 2 * IW, (1 - q.y) / 2 * IH]; };
  const r3 = (n) => Math.round(n * 100) / 100;
  const nodes = {};
  for (const id in m.nodes) {
    const p = P(m.nodes[id]), y = m.nodes[id].hq ? 0 : 20;
    const c = px(new THREE.Vector3(p.x, y, p.z));
    const l = px(new THREE.Vector3(p.x - 64, y, p.z)), r = px(new THREE.Vector3(p.x + 64, y, p.z));
    const f = px(new THREE.Vector3(p.x, y, p.z - 64)), n = px(new THREE.Vector3(p.x, y, p.z + 64));
    nodes[id] = [r3(c[0]), r3(c[1]), r3((r[0] - l[0]) / 128), r3((n[1] - f[1]) / 128)];
  }
  const medals = m.regions.map((rg) => {
    const c = P({ x: rg.x, y: rg.y });
    return [...Array(rg.medals)].map((_, k) => {
      const x = c.x + (k - (rg.medals - 1) / 2) * 46;
      const a = px(new THREE.Vector3(x, 1, c.z)), l = px(new THREE.Vector3(x - 23, 1, c.z)), rr = px(new THREE.Vector3(x + 23, 1, c.z));
      return [r3(a[0]), r3(a[1]), r3((rr[0] - l[0]) / 46)];
    });
  });
  return { nodes, medals };
}

export function renderBoardImage(mapId, flip, width = 1200, quality = 0.86) {
  const h = Math.round(width * IH / IW);
  renderer.setPixelRatio(1);
  renderer.setSize(width, h);
  renderer.setClearColor(0x000000, 1);
  renderer.toneMappingExposure = 0.82;
  const scene = buildBoard(mapId, flip);
  const { cam } = fitCamera(MAPS[mapId], flip, IW / IH);
  scene.fog = null;
  renderer.render(scene, cam);
  renderer.toneMappingExposure = 1.05;
  return renderer.domElement.toDataURL('image/jpeg', quality);
}
