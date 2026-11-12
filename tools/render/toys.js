// 3D toy models. Units: ground at y=0, toys ~2.3 tall, facing +z (toward camera).
import { THREE, TEAM, plastic, matte, metal, glow, mesh, G, group, at, noiseTex } from './lib.js';

const SKIN = '#f1c6a0';
const GOLD = () => metal('#e2b04a', 0.25);
const STEEL = () => metal('#c9d1d9', 0.3);
const DARKMETAL = () => metal('#4b525a', 0.35);
const gloss = (c) => plastic(c, { rough: 0.12, clearcoat: 1 });
const eye = (x, y, z, r = 0.05) => mesh(G.sphere(r, 24, 16), gloss('#0d0d0d'), x, y, z);
const furBump = noiseTex(256, { blobs: 12000, contrast: 1.4, repeat: [3, 3], seed: 3 });
const fabricBump = noiseTex(256, { blobs: 6000, contrast: 0.6, repeat: [4, 4], seed: 5 });
const fur = (c) => plastic(c, { rough: 0.95, clearcoat: 0, bump: furBump, bumpScale: 4 });
const fabric = (c) => plastic(c, { rough: 0.8, clearcoat: 0, bump: fabricBump, bumpScale: 1.5 });

// Limb between two points.
function limb(a, b, r, mat, caps = true) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const m = mesh(caps ? G.cap(r, len) : G.cyl(r, r, len, 32), mat);
  m.position.copy(va.clone().add(vb).multiplyScalar(0.5));
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  return m;
}
const smile = (y, z, R = 0.1, col = '#7a2323') => mesh(G.torus(R, 0.016, Math.PI, 24), matte(col), 0, y, z, { rz: Math.PI });

// ------------------------------------------------------------------ 0 Bop
function bop(t) {
  const helix = [];
  for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 12; helix.push([Math.cos(a) * 0.2, 0.8 + i / 120 * 0.55, Math.sin(a) * 0.2]); }
  return group(
    mesh(G.box(1.2, 0.8, 1.2, 0.07), plastic(t.main), 0, 0.4, 0),
    mesh(G.box(1.26, 0.08, 1.26, 0.03), plastic(t.dark), 0, 0.78, 0),
    at(mesh(G.star(0.24, 0.1, 0.05), GOLD()), 0, 0.42, 0.6),
    at(mesh(G.star(0.2, 0.08, 0.05), GOLD()), 0.6, 0.42, 0, { ry: Math.PI / 2 }),
    mesh(G.cyl(0.04, 0.04, 0.3), STEEL(), 0.74, 0.45, 0, { rz: Math.PI / 2 }),
    mesh(G.box(0.05, 0.3, 0.06, 0.02), STEEL(), 0.88, 0.35, 0),
    mesh(G.sphere(0.07), plastic('#8b2b20'), 0.9, 0.2, 0.06),
    mesh(G.tube(helix, 0.032), STEEL()),
    mesh(G.sphere(0.42), plastic(SKIN, { rough: 0.35 }), 0, 1.68, 0),
    eye(-0.14, 1.74, 0.37, 0.055), eye(0.14, 1.74, 0.37, 0.055),
    mesh(G.sphere(0.07), matte('#ff8f8f'), -0.25, 1.6, 0.31, { s: [1, 0.6, 0.4] }),
    mesh(G.sphere(0.07), matte('#ff8f8f'), 0.25, 1.6, 0.31, { s: [1, 0.6, 0.4] }),
    mesh(G.sphere(0.05), gloss('#d6453d'), 0, 1.66, 0.42),
    smile(1.58, 0.38),
    mesh(G.hemi(0.44), fabric(t.main), 0, 1.8, 0, { s: [1, 0.85, 1] }),
    mesh(G.torus(0.43, 0.065), fabric(t.dark), 0, 1.8, 0, { rx: Math.PI / 2 }),
    mesh(G.sphere(0.13), fur('#f6f2ea'), 0, 2.2, 0),
  );
}

// ------------------------------------------------------------------ 1 Rattles (skeleton warrior)
function rattles(t) {
  const BONE = plastic('#efe6cf', { rough: 0.5, clearcoat: 0.2 });
  const parts = [];
  for (const s of [-1, 1]) {
    parts.push(limb([s * 0.16, 0.12, 0], [s * 0.17, 0.48, 0], 0.05, BONE), mesh(G.sphere(0.075), BONE, s * 0.17, 0.5, 0));
    parts.push(limb([s * 0.17, 0.5, 0], [s * 0.15, 0.8, 0], 0.055, BONE));
    parts.push(mesh(G.box(0.17, 0.08, 0.3, 0.035), BONE, s * 0.17, 0.05, 0.06));
  }
  const ribs = [1.08, 1.18, 1.28, 1.38].map((y, i) => mesh(G.torus(0.3 - i * 0.015 + (i === 1 ? 0.01 : 0), 0.034, Math.PI * 1.25), BONE, 0, y, -0.02, { rx: Math.PI / 2, rz: -Math.PI * 0.125 + Math.PI }));
  // torus in xz after rx; rotate so the open side faces back
  ribs.forEach((r) => { r.rotation.set(Math.PI / 2, 0, -Math.PI * 0.125 - Math.PI / 2 + Math.PI); });
  return group(parts, ribs,
    mesh(G.box(0.56, 0.16, 0.26, 0.07), BONE, 0, 0.84, 0),
    mesh(G.cyl(0.05, 0.05, 0.7), BONE, 0, 1.18, -0.06),
    mesh(G.box(0.06, 0.32, 0.05, 0.02), BONE, 0, 1.24, 0.28),
    mesh(G.cyl(0.04, 0.04, 0.72), BONE, 0, 1.46, -0.02, { rz: Math.PI / 2 }),
    // shield arm
    limb([-0.36, 1.45, 0], [-0.5, 1.15, 0.12], 0.045, BONE), limb([-0.5, 1.15, 0.12], [-0.55, 0.95, 0.3], 0.04, BONE),
    mesh(G.cyl(0.38, 0.38, 0.07, 64), plastic(t.main), -0.6, 1.0, 0.36, { rx: Math.PI / 2 }),
    mesh(G.torus(0.38, 0.035), GOLD(), -0.6, 1.0, 0.36),
    mesh(G.sphere(0.1), GOLD(), -0.6, 1.0, 0.4, { s: [1, 1, 0.6] }),
    mesh(G.torus(0.22, 0.015), GOLD(), -0.6, 1.0, 0.405),
    // sword arm
    limb([0.36, 1.45, 0], [0.52, 1.18, 0.1], 0.045, BONE), limb([0.52, 1.18, 0.1], [0.6, 1.0, 0.28], 0.04, BONE),
    mesh(G.sphere(0.06), BONE, 0.6, 1.0, 0.3),
    group(
      mesh(G.box(0.08, 0.95, 0.025, 0.012), STEEL(), 0, 0.62, 0),
      mesh(G.cone(0.04, 0.12, 4), STEEL(), 0, 1.15, 0, { ry: Math.PI / 4, s: [1, 1, 0.3] }),
      mesh(G.box(0.3, 0.05, 0.06, 0.02), GOLD(), 0, 0.13, 0),
      mesh(G.cyl(0.03, 0.03, 0.18), matte('#6b3e1f'), 0, 0.02, 0),
      mesh(G.sphere(0.045), GOLD(), 0, -0.08, 0),
    ).translateX(0.62).translateY(1.0).translateZ(0.32).rotateZ(-0.25),
    // skull
    mesh(G.sphere(0.3), BONE, 0, 1.8, 0, { s: [1, 1.05, 1] }),
    mesh(G.box(0.32, 0.15, 0.24, 0.06), BONE, 0, 1.55, 0.06),
    mesh(G.sphere(0.085), matte('#141414'), -0.11, 1.8, 0.25, { s: [1, 1.1, 0.5] }),
    mesh(G.sphere(0.085), matte('#141414'), 0.11, 1.8, 0.25, { s: [1, 1.1, 0.5] }),
    mesh(G.sphere(0.03), glow(t.light, 3), -0.11, 1.8, 0.29), mesh(G.sphere(0.03), glow(t.light, 3), 0.11, 1.8, 0.29),
    mesh(G.cone(0.035, 0.07, 3), matte('#141414'), 0, 1.68, 0.29, { rx: Math.PI }),
    ...[-0.09, -0.03, 0.03, 0.09].map((x) => mesh(G.box(0.045, 0.05, 0.02, 0.01), plastic('#fbf7ea'), x, 1.6, 0.18)),
    mesh(G.hemi(0.33), plastic(t.main), 0, 1.86, 0, { s: [1, 0.85, 1.05] }),
    mesh(G.box(0.06, 0.2, 0.5, 0.03), plastic(t.light), 0, 2.15, 0),
    mesh(G.torus(0.33, 0.025), plastic(t.dark), 0, 1.87, 0, { rx: Math.PI / 2, s: [1, 1.05, 1] }),
  );
}

// ------------------------------------------------------------------ 2 Rumble (tin drummer)
function rumble(t) {
  const zig = [];
  for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI * 2; zig.push([Math.sin(a) * 0.365, (i % 2 ? 0.48 : 0.78), Math.cos(a) * 0.365 + 0.4]); }
  return group(
    ...[-1, 1].map((s) => limb([s * 0.13, 0.2, 0], [s * 0.13, 0.7, 0], 0.09, plastic('#f4f1ea'))),
    ...[-1, 1].map((s) => mesh(G.box(0.2, 0.2, 0.3, 0.07), gloss('#151515'), s * 0.13, 0.1, 0.04)),
    mesh(G.cyl(0.3, 0.32, 0.66), plastic(t.main), 0, 1.02, 0),
    mesh(G.box(0.07, 0.78, 0.02, 0.01), plastic('#f6f3ec'), -0.1, 1.04, 0.3, { rz: 0.55 }),
    mesh(G.box(0.07, 0.78, 0.02, 0.01), plastic('#f6f3ec'), 0.1, 1.04, 0.3, { rz: -0.55 }),
    ...[0.9, 1.05, 1.2].map((y) => mesh(G.sphere(0.03), GOLD(), 0, y, 0.32)),
    mesh(G.cyl(0.33, 0.33, 0.06), GOLD(), 0, 0.72, 0),
    ...[-1, 1].map((s) => mesh(G.sphere(0.12), GOLD(), s * 0.33, 1.32, 0, { s: [1, 0.45, 1] })),
    ...[-1, 1].map((s) => limb([s * 0.33, 1.25, 0], [s * 0.3, 0.98, 0.32], 0.075, plastic(t.main))),
    ...[-1, 1].map((s) => mesh(G.sphere(0.07), plastic(SKIN), s * 0.3, 0.96, 0.36)),
    ...[-1, 1].map((s) => limb([s * 0.3, 0.98, 0.38], [s * 0.12, 0.84, 0.66], 0.022, matte('#b5803f'), false)),
    ...[-1, 1].map((s) => mesh(G.sphere(0.035), plastic('#e9d2a8'), s * 0.11, 0.83, 0.67)),
    mesh(G.sphere(0.24), plastic(SKIN, { rough: 0.4 }), 0, 1.56, 0),
    eye(-0.08, 1.6, 0.21, 0.035), eye(0.08, 1.6, 0.21, 0.035),
    mesh(G.sphere(0.05), matte('#ff8f8f'), -0.15, 1.5, 0.18, { s: [1, 0.6, 0.4] }), mesh(G.sphere(0.05), matte('#ff8f8f'), 0.15, 1.5, 0.18, { s: [1, 0.6, 0.4] }),
    smile(1.49, 0.22, 0.06),
    mesh(G.cyl(0.21, 0.19, 0.42), gloss('#171717'), 0, 1.93, 0),
    mesh(G.torus(0.21, 0.018), GOLD(), 0, 2.14, 0, { rx: Math.PI / 2 }),
    mesh(G.box(0.36, 0.04, 0.16, 0.02), gloss('#111'), 0, 1.73, 0.2, { rx: 0.25 }),
    at(mesh(G.shape([[-0.07, 0], [0.07, 0], [0.07, 0.1], [0, 0.15], [-0.07, 0.1]], 0.02, 0.01), GOLD()), 0, 1.86, 0.19),
    mesh(G.sphere(0.08), plastic(t.main), 0, 2.27, 0, { s: [0.7, 1.7, 0.7] }),
    // drum
    mesh(G.cyl(0.36, 0.36, 0.34, 64), plastic('#f6f2e8'), 0, 0.63, 0.4),
    mesh(G.cyl(0.35, 0.35, 0.02, 64), matte('#efe2c4'), 0, 0.81, 0.4),
    mesh(G.torus(0.365, 0.03), plastic(t.main), 0, 0.81, 0.4, { rx: Math.PI / 2 }),
    mesh(G.torus(0.365, 0.03), plastic(t.main), 0, 0.46, 0.4, { rx: Math.PI / 2 }),
    mesh(G.tube(zig, 0.01, true, 200), GOLD()),
  );
}

// ------------------------------------------------------------------ 3 Cosmo (toy astronaut)
function cosmo(t) {
  const SUIT = fabric('#f1f2f4');
  return group(
    ...[-1, 1].map((s) => limb([s * 0.15, 0.25, 0], [s * 0.15, 0.68, 0], 0.11, SUIT)),
    ...[-1, 1].map((s) => mesh(G.torus(0.11, 0.025), plastic(t.main), s * 0.15, 0.45, 0, { rx: Math.PI / 2 })),
    ...[-1, 1].map((s) => mesh(G.box(0.24, 0.22, 0.34, 0.08), plastic(t.main), s * 0.15, 0.11, 0.03)),
    mesh(G.box(0.8, 0.74, 0.34, 0.08), plastic('#9aa3ad', { rough: 0.5 }), 0, 1.14, -0.3),
    mesh(G.box(0.72, 0.78, 0.5, 0.18), SUIT, 0, 1.08, 0),
    mesh(G.box(0.74, 0.1, 0.52, 0.04), plastic(t.main), 0, 0.78, 0),
    mesh(G.box(0.38, 0.22, 0.08, 0.03), plastic('#5e6670', { rough: 0.45 }), 0, 1.14, 0.27),
    mesh(G.sphere(0.03), glow('#ff5c7a'), -0.1, 1.14, 0.32), mesh(G.sphere(0.03), glow('#ffd34d'), 0, 1.14, 0.32), mesh(G.sphere(0.03), glow('#4ade80'), 0.1, 1.14, 0.32),
    mesh(G.box(0.16, 0.08, 0.02, 0.01), plastic(t.light), -0.18, 1.34, 0.26),
    // arms
    limb([-0.38, 1.32, 0], [-0.46, 0.92, 0.05], 0.1, SUIT), mesh(G.sphere(0.1), plastic(t.main), -0.47, 0.84, 0.06),
    limb([0.38, 1.32, 0], [0.48, 1.02, 0.28], 0.1, SUIT), mesh(G.sphere(0.1), plastic(t.main), 0.5, 0.98, 0.36),
    mesh(G.cyl(0.06, 0.07, 0.36), metal('#6b737c', 0.3), 0.5, 1.02, 0.56, { rx: Math.PI / 2 }),
    mesh(G.box(0.06, 0.16, 0.08, 0.02), metal('#3d434a', 0.4), 0.5, 0.92, 0.44),
    mesh(G.sphere(0.055), glow('#8dff6a', 2.5), 0.5, 1.02, 0.76),
    // helmet with gold visor
    mesh(G.sphere(0.38), plastic('#f5f6f8', { rough: 0.2 }), 0, 1.78, 0),
    mesh(G.sphere(0.31), metal('#d9a531', 0.06), 0, 1.79, 0.1),
    ...[-1, 1].map((s) => mesh(G.cyl(0.1, 0.1, 0.06), plastic(t.main), s * 0.37, 1.78, 0, { rz: Math.PI / 2 })),
    mesh(G.cyl(0.012, 0.012, 0.3), STEEL(), 0.22, 2.2, -0.05, { rz: -0.3 }),
    mesh(G.sphere(0.035), plastic(t.light), 0.27, 2.34, -0.05),
  );
}

// ------------------------------------------------------------------ 4 Dusty (toy cowboy)
function dusty(t) {
  const LEATHER = plastic('#7a4a26', { rough: 0.55, clearcoat: 0.3 });
  const FELT = fabric('#c9a26a');
  const lasso = [];
  for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2; lasso.push([0.45 + Math.cos(a) * 0.42, 2.32 + Math.sin(a) * 0.08, Math.sin(a) * 0.42]); }
  return group(
    ...[-1, 1].map((s) => mesh(G.cyl(0.1, 0.11, 0.32), LEATHER, s * 0.14, 0.2, 0)),
    ...[-1, 1].map((s) => mesh(G.box(0.18, 0.1, 0.32, 0.04), LEATHER, s * 0.14, 0.05, 0.06)),
    ...[-1, 1].map((s) => limb([s * 0.14, 0.36, 0], [s * 0.13, 0.78, 0], 0.095, fabric('#3d5a8a'))),
    mesh(G.cyl(0.27, 0.27, 0.08), LEATHER, 0, 0.83, 0),
    mesh(G.box(0.12, 0.09, 0.03, 0.015), GOLD(), 0, 0.83, 0.27),
    mesh(G.cyl(0.25, 0.27, 0.56), fabric(t.main), 0, 1.13, 0),
    mesh(new THREE.CylinderGeometry(0.275, 0.29, 0.5, 48, 1, true, 0.42, Math.PI * 2 - 0.84), plastic('#6e4120', { rough: 0.6, clearcoat: 0.2, side: THREE.DoubleSide }), 0, 1.1, 0),
    mesh(G.cone(0.14, 0.16, 3), fabric(t.light), 0, 1.33, 0.2, { rx: Math.PI, s: [1, 1, 0.5] }),
    // left arm down
    limb([-0.3, 1.32, 0], [-0.36, 0.92, 0.04], 0.08, fabric(t.main)), mesh(G.sphere(0.075), plastic(SKIN), -0.37, 0.86, 0.05),
    // right arm raised with lasso
    limb([0.3, 1.32, 0], [0.44, 1.78, 0.02], 0.08, fabric(t.main)), mesh(G.sphere(0.075), plastic(SKIN), 0.45, 1.86, 0.02),
    mesh(G.tube([[0.45, 1.9, 0.02], [0.47, 2.1, 0.01], [0.45, 2.3, 0]], 0.02), matte('#c49a5a')),
    mesh(G.tube(lasso, 0.022, true, 160), matte('#c49a5a')),
    // head
    mesh(G.sphere(0.23), plastic(SKIN, { rough: 0.4 }), 0, 1.58, 0),
    eye(-0.08, 1.62, 0.2, 0.033), eye(0.08, 1.62, 0.2, 0.033),
    mesh(G.box(0.07, 0.015, 0.02, 0.006), matte('#5a3a1e'), -0.08, 1.68, 0.21, { rz: 0.15 }), mesh(G.box(0.07, 0.015, 0.02, 0.006), matte('#5a3a1e'), 0.08, 1.68, 0.21, { rz: -0.15 }),
    mesh(G.sphere(0.035), plastic('#e9a98a'), 0, 1.57, 0.23),
    smile(1.5, 0.21, 0.06),
    mesh(G.lathe([[0, 0], [0.3, 0], [0.42, 0.02], [0.5, 0.09], [0.52, 0.11], [0.44, 0.06], [0.3, 0.035], [0, 0.035]]), FELT, 0, 1.74, 0),
    mesh(G.lathe([[0, 0], [0.23, 0], [0.24, 0.2], [0.19, 0.3], [0.05, 0.27], [0, 0.25]]), FELT, 0, 1.76, 0),
    mesh(G.cyl(0.24, 0.24, 0.05), matte('#4a2d16'), 0, 1.79, 0),
  );
}

// ------------------------------------------------------------------ 5 Volt (combat robot)
function volt(t) {
  const WH = plastic('#eef1f5', { rough: 0.22 });
  return group(
    ...[-1, 1].map((s) => mesh(G.box(0.2, 0.36, 0.24, 0.08), WH, s * 0.16, 0.27, 0)),
    ...[-1, 1].map((s) => mesh(G.sphere(0.08), DARKMETAL(), s * 0.16, 0.5, 0.02)),
    ...[-1, 1].map((s) => mesh(G.box(0.2, 0.3, 0.24, 0.08), WH, s * 0.16, 0.68, 0)),
    ...[-1, 1].map((s) => mesh(G.box(0.24, 0.1, 0.36, 0.04), plastic(t.main), s * 0.16, 0.05, 0.05)),
    mesh(G.box(0.46, 0.14, 0.3, 0.05), DARKMETAL(), 0, 0.86, 0),
    mesh(G.cyl(0.18, 0.2, 0.22), DARKMETAL(), 0, 0.98, 0),
    mesh(G.box(0.72, 0.52, 0.44, 0.14), WH, 0, 1.28, 0),
    mesh(G.box(0.36, 0.3, 0.06, 0.05), plastic(t.main), 0, 1.3, 0.21),
    mesh(G.cyl(0.08, 0.08, 0.05), glow('#7df9ff', 2.6), 0, 1.3, 0.25, { rx: Math.PI / 2 }),
    ...[-1, 1].map((s) => mesh(G.sphere(0.16), plastic(t.main), s * 0.45, 1.44, 0)),
    // blaster arm (left)
    limb([-0.48, 1.36, 0], [-0.52, 1.08, 0.12], 0.08, WH),
    mesh(G.cyl(0.1, 0.11, 0.5), DARKMETAL(), -0.52, 1.02, 0.36, { rx: Math.PI / 2 }),
    mesh(G.cyl(0.085, 0.085, 0.02), glow('#7df9ff', 3), -0.52, 1.02, 0.62, { rx: Math.PI / 2 }),
    mesh(G.torus(0.105, 0.02), plastic(t.main), -0.52, 1.02, 0.5),
    // fist arm (right)
    limb([0.48, 1.36, 0], [0.52, 0.98, 0.06], 0.08, WH), mesh(G.sphere(0.11), DARKMETAL(), 0.53, 0.9, 0.08),
    // head
    mesh(G.cyl(0.08, 0.1, 0.1), DARKMETAL(), 0, 1.58, 0),
    mesh(G.box(0.44, 0.36, 0.4, 0.15), WH, 0, 1.78, 0),
    mesh(G.box(0.38, 0.13, 0.06, 0.05), gloss('#0b131c'), 0, 1.8, 0.19),
    mesh(G.box(0.3, 0.03, 0.02, 0.01), glow('#7df9ff', 3), 0, 1.81, 0.225),
    ...[-1, 1].map((s) => mesh(G.cyl(0.07, 0.07, 0.06), plastic(t.main), s * 0.23, 1.78, 0, { rz: Math.PI / 2 })),
    mesh(G.cyl(0.012, 0.012, 0.26), STEEL(), 0.18, 2.06, -0.05, { rz: -0.35 }),
    mesh(G.sphere(0.03), glow('#ff5c7a'), 0.23, 2.18, -0.05),
  );
}

// ------------------------------------------------------------------ 6 Cuddles (teddy medic)
function cuddles(t) {
  const F = fur('#a8713f'), L = fur('#e3c49b');
  return group(
    ...[-1, 1].map((s) => mesh(G.sphere(0.22), F, s * 0.25, 0.2, 0.08, { s: [1, 0.85, 1.2] })),
    ...[-1, 1].map((s) => mesh(G.sphere(0.12), L, s * 0.25, 0.2, 0.32, { s: [1, 1, 0.3] })),
    mesh(G.sphere(0.48), F, 0, 0.72, 0, { s: [1, 1.05, 0.88] }),
    mesh(G.sphere(0.32), L, 0, 0.68, 0.24, { s: [1, 1.05, 0.5] }),
    mesh(G.cyl(0.11, 0.11, 0.02), plastic('#fbf8f2'), 0, 0.72, 0.4, { rx: Math.PI / 2 }),
    mesh(G.box(0.05, 0.15, 0.02, 0.01), plastic(t.main), 0, 0.72, 0.415), mesh(G.box(0.15, 0.05, 0.02, 0.01), plastic(t.main), 0, 0.72, 0.415),
    ...[-1, 1].map((s) => limb([s * 0.4, 0.95, 0], [s * 0.56, 0.62, 0.12], 0.13, F)),
    mesh(G.torus(0.27, 0.07), fabric(t.main), 0, 1.12, 0.02, { rx: Math.PI / 2 }),
    mesh(G.sphere(0.42), F, 0, 1.5, 0),
    ...[-1, 1].map((s) => mesh(G.sphere(0.15), F, s * 0.32, 1.83, -0.02)),
    ...[-1, 1].map((s) => mesh(G.sphere(0.09), L, s * 0.32, 1.83, 0.06, { s: [1, 1, 0.4] })),
    mesh(G.sphere(0.17), L, 0, 1.4, 0.34, { s: [1, 0.8, 0.75] }),
    mesh(G.sphere(0.055), gloss('#141414'), 0, 1.46, 0.47, { s: [1.3, 0.9, 0.8] }),
    eye(-0.15, 1.58, 0.36, 0.058), eye(0.15, 1.58, 0.36, 0.058),
    smile(1.35, 0.46, 0.05, '#3b2414'),
    mesh(G.box(0.12, 0.04, 0.02, 0.01), plastic('#f2ece0'), 0.27, 1.66, 0.3, { rz: 0.5 }),
  );
}

// ------------------------------------------------------------------ 7 Treads (wind-up tank)
function treads(t) {
  const RUB = plastic('#2a2d31', { rough: 0.8, clearcoat: 0, bump: fabricBump, bumpScale: 2 });
  const wheels = [];
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) wheels.push(mesh(G.cyl(0.12, 0.12, 0.05), STEEL(), s * 0.74, 0.18, -0.56 + i * 0.28, { rz: Math.PI / 2 }));
  const treadBars = [];
  for (const s of [-1, 1]) for (let i = 0; i < 12; i++) treadBars.push(mesh(G.box(0.36, 0.03, 0.05, 0.01), RUB, s * 0.55, 0.345, -0.68 + i * 0.124));
  return group(
    ...[-1, 1].map((s) => mesh(G.box(0.36, 0.33, 1.52, 0.15), RUB, s * 0.55, 0.17, 0)),
    wheels, treadBars,
    mesh(G.box(1.1, 0.34, 1.36, 0.08), plastic(t.main), 0, 0.48, 0),
    mesh(G.box(1.0, 0.2, 0.3, 0.08), plastic(t.main), 0, 0.42, 0.66, { rx: 0.5 }),
    at(mesh(G.star(0.17, 0.07, 0.03), plastic('#f6f2e8')), 0, 0.52, 0.69),
    ...[-1, 1].map((s) => mesh(G.sphere(0.06), glow('#ffe08a', 1.6), s * 0.4, 0.52, 0.69)),
    mesh(G.cyl(0.42, 0.48, 0.28), plastic(t.dark), 0, 0.78, -0.05),
    mesh(G.hemi(0.4), plastic(t.main), 0, 0.9, -0.05, { s: [1, 0.55, 1] }),
    mesh(G.cyl(0.06, 0.065, 0.95), metal('#5d656e', 0.35), 0, 0.92, 0.55, { rx: Math.PI / 2 }),
    mesh(G.cyl(0.09, 0.09, 0.14), metal('#3d434a', 0.4), 0, 0.92, 1.02, { rx: Math.PI / 2 }),
    mesh(G.cyl(0.13, 0.13, 0.05), metal('#5d656e', 0.35), 0.12, 1.12, -0.15),
    mesh(G.cyl(0.01, 0.01, 0.7), STEEL(), -0.25, 1.35, -0.25),
    mesh(new THREE.PlaneGeometry(0.28, 0.17), plastic(t.light, { side: THREE.DoubleSide }), -0.11, 1.62, -0.25),
  );
}

export const TOYS = { 0: bop, 1: rattles, 2: rumble, 3: cosmo, 4: dusty, 5: volt, 6: cuddles, 7: treads };

export function medalCoin() {
  return group(
    mesh(G.cyl(0.9, 0.9, 0.22, 64), GOLD(), 0, 0.11, 0),
    mesh(G.torus(0.86, 0.06), metal('#b8861f', 0.3), 0, 0.22, 0, { rx: Math.PI / 2 }),
    at(mesh(G.star(0.5, 0.22, 0.06), metal('#f7d36a', 0.2)), 0, 0.22, 0, { rx: -Math.PI / 2 }),
  );
}

export { TEAM };
