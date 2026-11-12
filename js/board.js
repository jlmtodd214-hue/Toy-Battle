// SVG board renderer with eight original hand-drawn (procedural) themes.
import { TEAM, troopArtGroup } from './troops.js';
import { topOf, ownerOf, typeOf } from './engine.js';

export const W = 1000, H = 1600;
const BASE = 128, HQ = 176;

// deterministic pseudo random for decorations
function prng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hash = (str) => [...str].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7);

export const SPECIAL_ICON = {
  retreat: '<path d="M12 3l6 6h-4v6h-4V9H6z" fill="#fff" stroke="#1d1d1d" stroke-width="1.5" stroke-linejoin="round"/><rect x="4" y="17" width="16" height="4" rx="1.5" fill="#c8873a" stroke="#1d1d1d" stroke-width="1.5"/>',
  draw: '<rect x="5" y="5" width="11" height="15" rx="2" fill="#fff" stroke="#1d1d1d" stroke-width="1.5"/><text x="19" y="22" font-size="9" font-weight="900" text-anchor="middle" fill="#1d1d1d">+1</text>',
  push: '<path d="M12 4v16M4 12h16" stroke="#1d1d1d" stroke-width="2"/><path d="M12 2l3 4H9zM12 22l3-4H9zM2 12l4 3V9zM22 12l-4 3V9z" fill="#ff7a1a" stroke="#1d1d1d" stroke-width="1"/>',
  revive: '<rect x="5" y="9" width="12" height="12" rx="2" fill="#fff" stroke="#1d1d1d" stroke-width="1.5"/><path d="M12 8c-2-4-8-1-4 3l4 3 4-3c4-4-2-7-4-3z" fill="#ff5c7a" stroke="#1d1d1d" stroke-width="1.2"/>',
  snipe: '<circle cx="12" cy="12" r="7" fill="none" stroke="#1d1d1d" stroke-width="2"/><path d="M12 2v6M12 16v6M2 12h6M16 12h6" stroke="#1d1d1d" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="#e5484d"/>',
  shield: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" fill="#7df9ff" stroke="#1d1d1d" stroke-width="1.5"/><path d="M9 9l6 6M15 9l-6 6" stroke="#e5484d" stroke-width="2.2" stroke-linecap="round"/>',
};

const badge = (x, y, kind, r = 26) => `
  <g transform="translate(${x} ${y})"><circle r="${r}" fill="#fff" stroke="#1d1d1d" stroke-width="4"/>
  <g transform="translate(${-r * 0.7} ${-r * 0.7}) scale(${(r * 1.4) / 24})">${SPECIAL_ICON[kind]}</g></g>`;

const allowTag = (x, y, allow) => `
  <g transform="translate(${x} ${y})"><path d="M-44 -20 h88 l-10 40 h-68 z" fill="#ff9f1c" stroke="#7a3d00" stroke-width="4" stroke-linejoin="round"/>
  <text y="10" text-anchor="middle" font-size="30" font-weight="900" fill="#fff" stroke="#7a3d00" stroke-width="1.5">★/${allow.join('/')}</text></g>`;

// ------------------------------------------------------------------ themes
const rr = (x, y, w, h, r, attrs) => `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${r}" ${attrs}/>`;

const THEMES = {
  fort: {
    bg(rnd) {
      let s = `<defs><linearGradient id="g-bg-fort" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6cc04a"/><stop offset="1" stop-color="#4fa83a"/></linearGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#g-bg-fort)"/>`;
      for (let i = 0; i < 16; i++) s += `<rect x="0" y="${i * 100}" width="${W}" height="50" fill="#fff" opacity=".05"/>`;
      for (let i = 0; i < 26; i++) {
        const x = rnd() < 0.5 ? rnd() * 70 : W - rnd() * 70, y = rnd() * H;
        s += `<g transform="translate(${x} ${y})"><circle r="30" fill="#2f7d32"/><circle cx="-18" cy="10" r="22" fill="#388e3c"/><circle cx="16" cy="12" r="20" fill="#43a047"/><circle cx="-6" cy="-8" r="10" fill="#66bb6a" opacity=".7"/></g>`;
      }
      for (let i = 0; i < 40; i++) s += `<g transform="translate(${rnd() * W} ${rnd() * H})" opacity=".85"><circle r="5" fill="#fff"/><circle r="2" fill="#ffd34d"/></g>`;
      return s;
    },
    path: (a, b) => `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#a87b45" stroke-width="54" stroke-linecap="round"/>
      <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#e6c48a" stroke-width="40" stroke-linecap="round"/>
      <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#c9a064" stroke-width="6" stroke-dasharray="2 26" stroke-linecap="round"/>`,
    base: (p) => `${rr(p.x, p.y + 8, BASE, BASE, 22, 'fill="#8a6a3d"')}${rr(p.x, p.y, BASE, BASE, 22, 'fill="#ecd6aa" stroke="#8a6a3d" stroke-width="5"')}
      ${rr(p.x, p.y, BASE - 30, BASE - 30, 14, 'fill="none" stroke="#c9a874" stroke-width="4" stroke-dasharray="14 8"')}`,
    special: (p, kind) => `${rr(p.x, p.y + 8, BASE, BASE, 22, 'fill="#6b4a2a"')}${rr(p.x, p.y, BASE, BASE, 22, 'fill="#cfa36a" stroke="#6b4a2a" stroke-width="5"')}
      <path d="M${p.x - 50} ${p.y - 48} h20 v14 h20 v-14 h20 v14 h20 v-14 h20 v30 h-100z" fill="#b98a52" stroke="#6b4a2a" stroke-width="4"/>
      <path d="M${p.x + 44} ${p.y - 40} v-50" stroke="#6b4a2a" stroke-width="5"/><path d="M${p.x + 44} ${p.y - 90} l34 12 -34 12z" fill="#ffd34d" stroke="#6b4a2a" stroke-width="3"/>
      ${badge(p.x - 52, p.y + 52, kind)}`,
    hq: (p, color) => { const c = TEAM[color]; return `
      <ellipse cx="${p.x}" cy="${p.y + 70}" rx="100" ry="22" fill="#000" opacity=".2"/>
      <path d="M${p.x - 95} ${p.y + 70} L${p.x} ${p.y - 80} L${p.x + 95} ${p.y + 70} Z" fill="${c.main}" stroke="#1d1d1d" stroke-width="6" stroke-linejoin="round"/>
      <path d="M${p.x - 48} ${p.y + 70} L${p.x} ${p.y - 80} L${p.x + 48} ${p.y + 70}" fill="none" stroke="#fff" stroke-width="10" opacity=".7"/>
      <path d="M${p.x - 26} ${p.y + 70} Q${p.x} ${p.y - 5} ${p.x + 26} ${p.y + 70} Z" fill="${c.dark}" stroke="#1d1d1d" stroke-width="5"/>
      <path d="M${p.x} ${p.y - 80} v-40" stroke="#1d1d1d" stroke-width="5"/><path class="flag" d="M${p.x} ${p.y - 120} l40 12 -40 12z" fill="${c.light}" stroke="#1d1d1d" stroke-width="3"/>`; },
  },

  clouds: {
    bg(rnd) {
      let s = `<defs><linearGradient id="g-bg-clouds" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd1ea"/><stop offset=".5" stop-color="#e3d4ff"/><stop offset="1" stop-color="#ffd1ea"/></linearGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#g-bg-clouds)"/>`;
      const bands = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa'];
      bands.forEach((col, i) => { s += `<path d="M${-200} ${H / 2 + 520} A ${700 - i * 30} ${700 - i * 30} 0 0 1 ${1200} ${H / 2 + 520}" fill="none" stroke="${col}" stroke-width="30" opacity=".35" transform="translate(0 ${-i * 0})"/>`; });
      for (let i = 0; i < 30; i++) {
        const x = rnd() * W, y = rnd() * H, k = 0.6 + rnd() * 1.2;
        s += `<g transform="translate(${x} ${y}) scale(${k})" opacity=".85"><circle r="40" fill="#fff"/><circle cx="40" cy="10" r="30" fill="#fff"/><circle cx="-42" cy="12" r="28" fill="#fff"/><circle cx="0" cy="20" r="34" fill="#fff6fb"/></g>`;
      }
      return s;
    },
    path: (a, b) => `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#f19ac8" stroke-width="44" stroke-linecap="round"/>
      <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#fff" stroke-width="32" stroke-linecap="round"/>
      <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#ff7eb6" stroke-width="32" stroke-dasharray="14 18"/>`,
    base: (p) => `${rr(p.x, p.y + 8, BASE, BASE, 40, 'fill="#e48fb9"')}${rr(p.x, p.y, BASE, BASE, 40, 'fill="#fff7fb" stroke="#e48fb9" stroke-width="5"')}
      ${rr(p.x - 14, p.y - 18, 60, 30, 15, 'fill="#fff" opacity=".9"')}`,
    special: (p, kind) => `<ellipse cx="${p.x}" cy="${p.y + 56}" rx="70" ry="16" fill="#000" opacity=".15"/>
      <path d="M${p.x - 58} ${p.y - 6} L${p.x - 44} ${p.y + 58} H${p.x + 44} L${p.x + 58} ${p.y - 6} Z" fill="#c8873a" stroke="#6b3e12" stroke-width="5"/>
      <path d="M${p.x - 40} ${p.y - 2} v56 M${p.x - 14} ${p.y} v58 M${p.x + 14} ${p.y} v58 M${p.x + 40} ${p.y - 2} v56" stroke="#a96a28" stroke-width="4"/>
      <path d="M${p.x - 66} ${p.y} q-6 -40 30 -46 q10 -36 36 -26 q26 -10 36 26 q36 6 30 46 z" fill="#ff9ccf" stroke="#b5487f" stroke-width="5"/>
      <circle cx="${p.x}" cy="${p.y - 72}" r="14" fill="#e5484d" stroke="#8b1a1a" stroke-width="4"/>
      ${[...Array(7)].map((_, i) => `<rect x="${p.x - 46 + i * 14}" y="${p.y - 30 + (i % 2) * 10}" width="6" height="12" rx="3" fill="${['#ffd43b', '#4dabf7', '#69db7c', '#fff'][i % 4]}" transform="rotate(${i * 25} ${p.x - 43 + i * 14} ${p.y - 24})"/>`).join('')}
      ${badge(p.x + 62, p.y + 46, kind)}`,
    hq: (p, color) => { const c = TEAM[color]; return `
      <ellipse cx="${p.x}" cy="${p.y + 72}" rx="96" ry="18" fill="#000" opacity=".15"/>
      <rect x="${p.x - 80}" y="${p.y - 30}" width="160" height="100" rx="20" fill="${c.main}" stroke="#1d1d1d" stroke-width="6"/>
      <path d="M${p.x - 80} ${p.y - 30} q20 -60 40 0 q20 -60 40 0 q20 -60 40 0 q20 -60 40 0" fill="${c.light}" stroke="#1d1d1d" stroke-width="6"/>
      <path d="M${p.x - 22} ${p.y + 70} v-38 a22 22 0 0 1 44 0 v38z" fill="${c.dark}" stroke="#1d1d1d" stroke-width="5"/>
      <circle cx="${p.x}" cy="${p.y - 74}" r="16" fill="#ffd43b" stroke="#1d1d1d" stroke-width="5"/>
      ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${p.x - 60 + i * 30}" cy="${p.y + 4}" r="5" fill="#fff" opacity=".8"/>`).join('')}`; },
  },

  lava: {
    bg(rnd, m) {
      let s = `<defs><radialGradient id="g-lava-r"><stop offset="0" stop-color="#fff176"/><stop offset=".45" stop-color="#ff9800"/><stop offset="1" stop-color="#d84315"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="#e7c07a"/>`;
      for (let i = 0; i < 400; i++) s += `<circle cx="${rnd() * W}" cy="${rnd() * H}" r="${1 + rnd() * 2.5}" fill="${rnd() < 0.5 ? '#c99a55' : '#f5d79b'}"/>`;
      m.regions.forEach((r, i) => {
        if (i % 2) return;
        const k = 1 + rnd() * 0.3;
        s += `<g transform="translate(${r.dx} ${r.dy}) scale(${k})"><path d="M-80 0 q-10 -50 40 -60 q40 -30 70 10 q50 0 40 50 q-10 50 -70 40 q-70 20 -80 -40z" fill="#8d3b12"/>
          <path d="M-66 0 q-6 -40 32 -48 q34 -24 58 8 q40 2 32 40 q-10 40 -58 32 q-58 16 -64 -32z" fill="url(#g-lava-r)"/>
          <circle cx="-30" cy="-14" r="8" fill="#ffecb3" opacity=".8"/><circle cx="24" cy="12" r="6" fill="#ffecb3" opacity=".8"/></g>`;
      });
      for (let i = 0; i < 10; i++) { const x = rnd() < 0.5 ? 30 + rnd() * 40 : W - 30 - rnd() * 40; s += `<path d="M${x} ${rnd() * H} l12 -30 l12 30z" fill="#4caf50" stroke="#1b5e20" stroke-width="3"/>`; }
      return s;
    },
    path: (a, b) => {
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      let sticks = '';
      for (let d = 30; d < len - 20; d += 22) sticks += `<rect x="${d - 8}" y="-22" width="16" height="44" rx="8" fill="#f2c27c" stroke="#a8692b" stroke-width="3"/>`;
      return `<g transform="translate(${a.x} ${a.y}) rotate(${ang})"><rect x="0" y="-8" width="${len}" height="16" fill="#a8692b"/>${sticks}</g>`;
    },
    base: (p) => `${rr(p.x, p.y + 8, BASE, BASE, 14, 'fill="#9c6b2f"')}${rr(p.x, p.y, BASE, BASE, 14, 'fill="#d9a85c" stroke="#9c6b2f" stroke-width="5"')}
      <path d="M${p.x - 64} ${p.y - 40} h18 v-14 h20 v14 h20 v-14 h20 v14 h20 v-14 h20 v14 h12" fill="none" stroke="#9c6b2f" stroke-width="5"/>
      <circle cx="${p.x - 30}" cy="${p.y + 20}" r="4" fill="#9c6b2f"/><circle cx="${p.x + 26}" cy="${p.y + 4}" r="3" fill="#9c6b2f"/>`,
    special: (p, kind) => `<ellipse cx="${p.x}" cy="${p.y + 58}" rx="80" ry="16" fill="#000" opacity=".2"/>
      <path d="M${p.x - 76} ${p.y + 58} L${p.x - 22} ${p.y - 50} H${p.x + 22} L${p.x + 76} ${p.y + 58} Z" fill="#7b4a2b" stroke="#3e2210" stroke-width="5" stroke-linejoin="round"/>
      <path d="M${p.x - 22} ${p.y - 50} q10 30 4 50 q14 -10 18 -50 q4 40 16 30 q-6 -20 6 -30z" fill="#ff7a1a" stroke="#b33c00" stroke-width="3"/>
      <ellipse cx="${p.x}" cy="${p.y - 50}" rx="24" ry="8" fill="#ffd34d" stroke="#b33c00" stroke-width="3"/>
      <g class="smoke"><circle cx="${p.x - 6}" cy="${p.y - 76}" r="12" fill="#bbb" opacity=".7"/><circle cx="${p.x + 10}" cy="${p.y - 96}" r="16" fill="#ccc" opacity=".6"/></g>
      ${badge(p.x + 60, p.y + 46, kind)}`,
    hq: (p, color) => { const c = TEAM[color]; return `
      <ellipse cx="${p.x}" cy="${p.y + 76}" rx="90" ry="18" fill="#000" opacity=".2"/>
      <path d="M${p.x - 70} ${p.y - 40} q70 -110 140 0" fill="none" stroke="#1d1d1d" stroke-width="10"/>
      <path d="M${p.x - 80} ${p.y - 40} L${p.x - 60} ${p.y + 76} H${p.x + 60} L${p.x + 80} ${p.y - 40} Z" fill="${c.main}" stroke="#1d1d1d" stroke-width="6" stroke-linejoin="round"/>
      <ellipse cx="${p.x}" cy="${p.y - 40}" rx="80" ry="18" fill="${c.dark}" stroke="#1d1d1d" stroke-width="6"/>
      <ellipse cx="${p.x}" cy="${p.y - 38}" rx="66" ry="11" fill="#e7c07a"/>
      <path d="M${p.x - 66} ${p.y + 10} H${p.x + 66}" stroke="#fff" stroke-width="10" opacity=".6"/>`; },
  },

  attic: {
    bg(rnd) {
      let s = `<rect width="${W}" height="${H}" fill="#3e2a47"/>`;
      for (let i = 0; i < 12; i++) s += `<rect x="${i * 84}" y="0" width="80" height="${H}" fill="${i % 2 ? '#47304f' : '#422c4b'}"/><line x1="${i * 84 + 82}" y1="0" x2="${i * 84 + 82}" y2="${H}" stroke="#2a1b31" stroke-width="4"/>`;
      for (let i = 0; i < 40; i++) { const x = Math.floor(rnd() * 12) * 84 + 20, y = rnd() * H; s += `<line x1="${x - 10}" y1="${y}" x2="${x + 50}" y2="${y}" stroke="#2a1b31" stroke-width="3"/>`; }
      for (const [x, y, sx, sy] of [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]]) {
        s += `<g transform="translate(${x} ${y}) scale(${sx} ${sy})" stroke="#d8d0e8" stroke-width="2" fill="none" opacity=".5">
          <path d="M0 0 L180 40 M0 0 L120 120 M0 0 L40 180"/><path d="M60 13 Q50 40 40 60 Q35 35 13 60"/><path d="M110 25 Q90 70 80 80 Q60 85 25 110"/></g>`;
      }
      for (let i = 0; i < 60; i++) s += `<circle cx="${rnd() * W}" cy="${rnd() * H}" r="${1 + rnd() * 2}" fill="#fff" opacity="${0.1 + rnd() * 0.3}"/>`;
      return s;
    },
    path: (a, b) => `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#7a4f8f" stroke-width="46" stroke-linecap="round"/>
      <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#a46cbf" stroke-width="34" stroke-linecap="round"/>
      <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#d9b3ea" stroke-width="4" stroke-dasharray="10 10"/>`,
    base: (p) => `${rr(p.x, p.y + 10, BASE, BASE - 10, 10, 'fill="#e9e1cf"')}${rr(p.x, p.y, BASE, BASE - 10, 10, 'fill="#6b4c8a" stroke="#2a1b31" stroke-width="5"')}
      ${rr(p.x, p.y, BASE - 34, BASE - 44, 6, 'fill="none" stroke="#ffd34d" stroke-width="3" opacity=".7"')}
      <rect x="${p.x - 64}" y="${p.y - 20}" width="10" height="40" fill="#5a3b78"/>`,
    special: (p, kind) => `<ellipse cx="${p.x}" cy="${p.y + 60}" rx="76" ry="14" fill="#000" opacity=".3"/>
      ${rr(p.x, p.y + 20, BASE + 10, 80, 10, 'fill="#8d5a2b" stroke="#2a1b31" stroke-width="5"')}
      <path d="M${p.x - 69} ${p.y - 20} q69 -40 138 0 v10 h-138z" fill="#a56b35" stroke="#2a1b31" stroke-width="5"/>
      <rect x="${p.x - 10}" y="${p.y}" width="20" height="24" rx="3" fill="#ffd34d" stroke="#2a1b31" stroke-width="4"/>
      <g class="ghost"><path d="M${p.x - 24} ${p.y - 20} v-40 a24 24 0 0 1 48 0 v40 l-8 -8 -8 8 -8 -8 -8 8 -8 -8z" fill="#fff" stroke="#2a1b31" stroke-width="4" opacity=".95"/>
      <circle cx="${p.x - 8}" cy="${p.y - 62}" r="4" fill="#2a1b31"/><circle cx="${p.x + 8}" cy="${p.y - 62}" r="4" fill="#2a1b31"/><ellipse cx="${p.x}" cy="${p.y - 48}" rx="5" ry="7" fill="#2a1b31"/></g>
      ${badge(p.x + 60, p.y + 50, kind)}`,
    hq: (p, color) => { const c = TEAM[color]; return `
      <ellipse cx="${p.x}" cy="${p.y + 74}" rx="96" ry="18" fill="#000" opacity=".35"/>
      ${rr(p.x, p.y + 20, 180, 110, 14, `fill="${c.main}" stroke="#1d1d1d" stroke-width="6"`)}
      <path d="M${p.x - 90} ${p.y - 30} q90 -80 180 0 v10 h-180z" fill="${c.dark}" stroke="#1d1d1d" stroke-width="6"/>
      <path d="M${p.x - 90} ${p.y + 20} h180" stroke="#ffd34d" stroke-width="10"/>
      <rect x="${p.x - 16}" y="${p.y - 8}" width="32" height="36" rx="5" fill="#ffd34d" stroke="#1d1d1d" stroke-width="5"/><circle cx="${p.x}" cy="${p.y + 8}" r="5" fill="#1d1d1d"/>
      <path d="M${p.x - 60} ${p.y + 50} l10 -10 10 10 10 -10 10 10" fill="none" stroke="#fff" stroke-width="5" opacity=".6"/>`; },
  },

  bay: {
    bg(rnd) {
      let s = `<defs><linearGradient id="g-bg-bay" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fd3f7"/><stop offset="1" stop-color="#3aa6dd"/></linearGradient></defs>
        <rect width="${W}" height="${H}" fill="#f4f7fb"/><rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="120" fill="url(#g-bg-bay)" stroke="#d5dde6" stroke-width="10"/>`;
      for (let i = 0; i < 30; i++) s += `<path d="M${rnd() * W} ${rnd() * H} q20 -12 40 0 t40 0" fill="none" stroke="#fff" stroke-width="4" opacity=".35"/>`;
      for (let i = 0; i < 60; i++) { const r = 4 + rnd() * 16; s += `<circle cx="${rnd() * W}" cy="${rnd() * H}" r="${r}" fill="#fff" fill-opacity=".25" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>`; }
      s += `<g transform="translate(${W - 120} ${H / 2})"><circle r="26" fill="#cfd8e3" stroke="#7d8792" stroke-width="5"/><path d="M0 -26 v-60" stroke="#7d8792" stroke-width="10"/></g>`;
      return s;
    },
    path: (a, b) => `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#2a6f97" stroke-width="20" stroke-linecap="round" opacity=".5"/>
      <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#fff3d6" stroke-width="12" stroke-linecap="round"/>
      <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#e5484d" stroke-width="22" stroke-dasharray="16 44" stroke-linecap="round"/>`,
    base: (p) => `${rr(p.x, p.y + 8, BASE, BASE, 26, 'fill="#c79a10"')}${rr(p.x, p.y, BASE, BASE, 26, 'fill="#ffd84d" stroke="#a37c00" stroke-width="5"')}
      <circle cx="${p.x - 30}" cy="${p.y - 26}" r="9" fill="#e6b800"/><circle cx="${p.x + 24}" cy="${p.y - 10}" r="7" fill="#e6b800"/><circle cx="${p.x - 10}" cy="${p.y + 26}" r="10" fill="#e6b800"/><circle cx="${p.x + 32}" cy="${p.y + 32}" r="6" fill="#e6b800"/>`,
    special: (p) => THEMES.bay.base(p),
    hq: (p, color) => { const c = TEAM[color]; return `
      <ellipse cx="${p.x}" cy="${p.y + 64}" rx="100" ry="20" fill="#0b4f7a" opacity=".35"/>
      <path d="M${p.x - 96} ${p.y + 10} H${p.x + 96} L${p.x + 70} ${p.y + 64} H${p.x - 70} Z" fill="${c.main}" stroke="#1d1d1d" stroke-width="6" stroke-linejoin="round"/>
      <path d="M${p.x - 90} ${p.y + 24} H${p.x + 90}" stroke="#fff" stroke-width="8"/>
      <path d="M${p.x - 6} ${p.y + 10} V${p.y - 100}" stroke="#1d1d1d" stroke-width="7"/>
      <path class="flag" d="M${p.x} ${p.y - 96} Q${p.x + 70} ${p.y - 50} ${p.x} ${p.y}" fill="#fff" stroke="#1d1d1d" stroke-width="5"/>
      <path d="M${p.x - 12} ${p.y - 86} Q${p.x - 64} ${p.y - 46} ${p.x - 12} ${p.y - 6}" fill="${c.light}" stroke="#1d1d1d" stroke-width="5"/>`; },
  },

  trenches: {
    bg(rnd) {
      let s = `<rect width="${W}" height="${H}" fill="#f2d68c"/>`;
      for (let i = 0; i < 50; i++) { const x = rnd() * W, y = rnd() * H; s += `<path d="M${x} ${y} q30 -14 60 0 q30 14 60 0" fill="none" stroke="#d9b866" stroke-width="5" stroke-linecap="round"/>`; }
      for (let i = 0; i < 10; i++) { const x = rnd() < 0.5 ? 40 + rnd() * 30 : W - 40 - rnd() * 30, y = rnd() * H; s += `<g transform="translate(${x} ${y}) rotate(${rnd() * 360})"><path d="M0 -26 l7 18 19 1 -15 12 5 19 -16 -10 -16 10 5 -19 -15 -12 19 -1z" fill="#ff8a65" stroke="#bf360c" stroke-width="3"/></g>`; }
      for (let i = 0; i < 8; i++) { const x = rnd() < 0.5 ? 40 + rnd() * 30 : W - 40 - rnd() * 30; s += `<path d="M${x - 24} ${rnd() * H} a24 24 0 0 1 48 0 z" fill="#f48fb1" stroke="#ad1457" stroke-width="3"/>`; }
      return s;
    },
    path: (a, b) => `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#8b5a2b" stroke-width="48" stroke-linecap="square"/>
      <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#c07d40" stroke-width="34" stroke-dasharray="20 6"/>`,
    base: (p) => `${rr(p.x, p.y + 8, BASE, BASE, 18, 'fill="#8d7752"')}${rr(p.x, p.y, BASE, BASE, 18, 'fill="#cdb98e" stroke="#7a6542" stroke-width="5"')}
      ${[-32, 0, 32].map((dy) => rr(p.x, p.y + dy, BASE - 22, 26, 13, 'fill="#e2d1a8" stroke="#7a6542" stroke-width="3"')).join('')}`,
    special: (p, kind) => `<ellipse cx="${p.x}" cy="${p.y + 62}" rx="72" ry="14" fill="#000" opacity=".2"/>
      <path d="M${p.x - 50} ${p.y + 60} L${p.x - 30} ${p.y - 30} M${p.x + 50} ${p.y + 60} L${p.x + 30} ${p.y - 30} M${p.x - 44} ${p.y + 30} L${p.x + 40} ${p.y} M${p.x + 44} ${p.y + 30} L${p.x - 40} ${p.y}" stroke="#2e7d32" stroke-width="10" stroke-linecap="round"/>
      ${rr(p.x, p.y - 44, 110, 50, 10, 'fill="#43a047" stroke="#1b5e20" stroke-width="5"')}
      <rect x="${p.x - 36}" y="${p.y - 52}" width="72" height="14" rx="6" fill="#1b5e20"/>
      ${badge(p.x + 58, p.y + 48, kind)}`,
    hq: (p, color) => { const c = TEAM[color]; return `
      <ellipse cx="${p.x}" cy="${p.y + 72}" rx="100" ry="18" fill="#000" opacity=".2"/>
      <path d="M${p.x - 90} ${p.y + 72} V${p.y - 10} h30 v-20 h30 v20 h60 v-20 h30 v20 h30 V${p.y + 72} Z" fill="#e7c47a" stroke="#8b6a2b" stroke-width="6" stroke-linejoin="round"/>
      <path d="M${p.x - 40} ${p.y - 10} V${p.y - 70} h20 v-14 h40 v14 h20 V${p.y - 10}" fill="#e7c47a" stroke="#8b6a2b" stroke-width="6" stroke-linejoin="round"/>
      <path d="M${p.x - 22} ${p.y + 72} v-36 a22 22 0 0 1 44 0 v36z" fill="#8b6a2b"/>
      <path d="M${p.x} ${p.y - 84} v-40" stroke="#1d1d1d" stroke-width="5"/><path class="flag" d="M${p.x} ${p.y - 124} l44 13 -44 13z" fill="${c.main}" stroke="#1d1d1d" stroke-width="3"/>
      <rect x="${p.x - 90}" y="${p.y + 20}" width="180" height="14" fill="${c.main}" opacity=".85"/>`; },
  },

  pool: {
    bg(rnd) {
      let s = `<defs><linearGradient id="g-bg-pool" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fd0e8"/><stop offset="1" stop-color="#2aa3c9"/></linearGradient></defs>
        <rect width="${W}" height="${H}" fill="#f9d9a8"/>`;
      for (let i = 0; i < 20; i++) s += `<rect x="${i * 52}" y="0" width="48" height="40" rx="6" fill="#f2c98a"/><rect x="${i * 52}" y="${H - 40}" width="48" height="40" rx="6" fill="#f2c98a"/>`;
      s += `<rect x="40" y="44" width="${W - 80}" height="${H - 88}" rx="70" fill="url(#g-bg-pool)" stroke="#fff" stroke-width="12"/>`;
      for (let i = 0; i < 60; i++) { const x = 60 + rnd() * (W - 120), y = 60 + rnd() * (H - 120); s += `<path d="M${x} ${y} q16 -10 32 0 q16 10 32 0" fill="none" stroke="#bff3ff" stroke-width="4" opacity=".6"/>`; }
      s += `<g transform="translate(120 ${H - 120})"><circle r="40" fill="#fff" stroke="#1d1d1d" stroke-width="4"/><path d="M-40 0 a40 40 0 0 1 80 0z" fill="#e5484d"/><path d="M0 -40 a40 40 0 0 1 0 80z" fill="#3b7dd8" opacity=".9"/></g>`;
      return s;
    },
    path: (a, b) => `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#b5179e" stroke-width="30" stroke-linecap="round"/>
      <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#f72585" stroke-width="22" stroke-linecap="round"/>
      <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#ff8fc7" stroke-width="6" stroke-linecap="round" transform="translate(-4 -4)"/>`,
    base: (p) => `<circle cx="${p.x}" cy="${p.y + 8}" r="66" fill="#1b2a4a" opacity=".35"/>
      <circle cx="${p.x}" cy="${p.y}" r="64" fill="#2c3e66" stroke="#111b30" stroke-width="5"/><circle cx="${p.x}" cy="${p.y}" r="30" fill="#4fc3e0" stroke="#111b30" stroke-width="5"/>
      <path d="M${p.x - 46} ${p.y - 30} a54 54 0 0 1 40 -22" fill="none" stroke="#fff" stroke-width="6" opacity=".45" stroke-linecap="round"/>`,
    special: (p, kind, node) => `${rr(p.x, p.y + 8, BASE, BASE, 34, 'fill="#c46a00" opacity=".5"')}
      ${rr(p.x, p.y, BASE, BASE, 34, 'fill="#ffb627" stroke="#8a4b00" stroke-width="5"')}
      ${rr(p.x, p.y, 56, 56, 16, 'fill="#4fc3e0" stroke="#8a4b00" stroke-width="5"')}
      <path d="M${p.x - 64} ${p.y} h36 M${p.x + 28} ${p.y} h36 M${p.x} ${p.y - 64} v36 M${p.x} ${p.y + 28} v36" stroke="#fff" stroke-width="14"/>
      ${allowTag(p.x, p.y + 82, node.allow)}`,
    hq: (p, color, node) => { const c = TEAM[color]; return `
      <ellipse cx="${p.x}" cy="${p.y + 10}" rx="96" ry="90" fill="#0b4f7a" opacity=".25"/>
      ${rr(p.x, p.y, 168, 150, 60, `fill="${c.main}" stroke="#1d1d1d" stroke-width="6"`)}
      ${rr(p.x, p.y, 96, 80, 30, `fill="${c.light}" stroke="#1d1d1d" stroke-width="5"`)}
      <path d="M${p.x - 64} ${p.y - 44} q20 -14 40 0" fill="none" stroke="#fff" stroke-width="8" opacity=".6" stroke-linecap="round"/>
      ${node.allow ? allowTag(p.x, p.y + 92, node.allow) : ''}`; },
  },

  rocket: {
    bg(rnd) {
      let s = `<defs><filter id="glow-r" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
        <radialGradient id="g-bg-rocket" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#2b2d6e"/><stop offset="1" stop-color="#11122e"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#g-bg-rocket)"/>`;
      for (let x = 0; x <= W; x += 125) s += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#3a3d86" stroke-width="3"/>`;
      for (let y = 0; y <= H; y += 125) s += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#3a3d86" stroke-width="3"/>`;
      for (let x = 0; x <= W; x += 125) for (let y = 0; y <= H; y += 125) s += `<circle cx="${x}" cy="${y}" r="5" fill="#5559b5"/>`;
      for (let i = 0; i < 80; i++) s += `<circle cx="${rnd() * W}" cy="${rnd() * H}" r="${rnd() * 2.5}" fill="#fff" opacity="${0.3 + rnd() * 0.7}"/>`;
      s += `<rect x="0" y="770" width="${W}" height="60" fill="#7df9ff" opacity=".18" filter="url(#glow-r)"/>`;
      return s;
    },
    path: (a, b) => `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#7df9ff" stroke-width="30" opacity=".45" filter="url(#glow-r)"/>
      <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#4b3f8f" stroke-width="30" stroke-linecap="round"/>
      <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#9ad7ff" stroke-width="12" stroke-dasharray="12 12"/>`,
    base: (p) => `${rr(p.x, p.y + 8, BASE, BASE, 24, 'fill="#6b7a8f"')}${rr(p.x, p.y, BASE, BASE, 24, 'fill="#dfe7f1" stroke="#6b7a8f" stroke-width="5"')}
      ${[-20, 0, 20].map((dy) => rr(p.x, p.y + dy, 64, 10, 5, 'fill="#b8c4d3"')).join('')}
      ${[[-48, -48], [48, -48], [-48, 48], [48, 48]].map(([dx, dy]) => `<circle cx="${p.x + dx}" cy="${p.y + dy}" r="5" fill="#8794a8"/>`).join('')}`,
    special: (p, kind) => `${rr(p.x, p.y, BASE + 30, BASE + 30, 34, 'fill="#7df9ff" opacity=".5" filter="url(#glow-r)"')}
      ${rr(p.x, p.y, BASE, BASE, 24, 'fill="#e9fdff" stroke="#7df9ff" stroke-width="6"')}
      <path class="zap" d="M${p.x - 60} ${p.y - 20} l20 10 -10 10 20 10" fill="none" stroke="#7df9ff" stroke-width="4"/>
      ${badge(p.x + 58, p.y + 58, kind)}`,
    hq: (p, color) => { const c = TEAM[color]; return `
      ${rr(p.x, p.y, 176, 176, 30, `fill="${c.dark}" stroke="#1d1d1d" stroke-width="6"`)}
      ${rr(p.x, p.y, 140, 140, 22, 'fill="#dfe7f1" stroke="#1d1d1d" stroke-width="4"')}
      <g class="rocket"><path d="M${p.x} ${p.y - 70} q34 30 26 90 h-52 q-8 -60 26 -90z" fill="#fff" stroke="#1d1d1d" stroke-width="5"/>
      <circle cx="${p.x}" cy="${p.y - 18}" r="12" fill="#7df9ff" stroke="#1d1d1d" stroke-width="4"/>
      <path d="M${p.x - 26} ${p.y + 6} l-20 30 h22z M${p.x + 26} ${p.y + 6} l20 30 h-22z" fill="${c.main}" stroke="#1d1d1d" stroke-width="4"/>
      <path d="M${p.x - 14} ${p.y + 20} h28 l-6 26 h-16z" fill="#ff9800" stroke="#1d1d1d" stroke-width="4"/></g>`; },
  },
};

// ------------------------------------------------------------------ rendering
function tokenSVG(s, nodeId, p, opts) {
  const st = s.stacks[nodeId];
  if (!st || !st.length) return '';
  const top = topOf(s, nodeId);
  const color = ownerOf(top), t = typeOf(top), c = TEAM[color];
  const depth = st.length;
  let under = '';
  for (let i = Math.min(depth - 1, 3); i >= 1; i--) {
    const below = st[st.length - 1 - i];
    under += rr(p.x + i * 7, p.y + i * 7, 112, 112, 18, `fill="${TEAM[ownerOf(below)].dark}" stroke="#1d1d1d" stroke-width="4"`);
  }
  const fresh = opts.fresh?.has(nodeId) ? ' fresh' : '';
  return `<g class="stack" data-node="${nodeId}">${under}
    <g transform="translate(${p.x} ${p.y})"><g class="token${fresh}">
      ${rr(0, 0, 112, 112, 18, `fill="${c.main}" stroke="#1d1d1d" stroke-width="5"`)}
      ${rr(0, 0, 96, 96, 12, `fill="${c.light}" opacity=".55"`)}
      <g class="bob t${t}"><g transform="translate(-46 -40) scale(.92)">${troopArtGroup(t, color)}</g></g>
      <circle cx="-46" cy="-46" r="20" fill="#fff" stroke="#1d1d1d" stroke-width="4"/>
      <text x="-46" y="-36" text-anchor="middle" font-size="28" font-weight="900" fill="${c.dark}">${t === 0 ? '★' : t}</text>
      ${depth > 1 ? `<g transform="translate(44 46)"><circle r="17" fill="#1d1d1d"/><text y="7" text-anchor="middle" font-size="20" font-weight="800" fill="#fff">${depth}</text></g>` : ''}
    </g></g></g>`;
}

export function renderBoard(s, m, opts = {}) {
  const th = THEMES[m.theme];
  const flip = !!opts.flip;
  const P = (id) => { const n = m.nodes[id]; return flip ? { x: W - n.x, y: H - n.y } : { x: n.x, y: n.y }; };
  for (const r of m.regions) { r.dx = flip ? W - r.x : r.x; r.dy = flip ? H - r.y : r.y; }
  const rnd = prng(hash(m.id));
  let out = `<svg class="board theme-${m.theme}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  out += `<g class="bg">${th.bg(rnd, m)}</g>`;
  out += '<g class="paths">';
  for (const [u, v] of m.edges) out += th.path(P(u), P(v));
  out += '</g>';

  // medals
  out += '<g class="medals">';
  m.regions.forEach((r, i) => {
    const n = r.medals, taken = s.taken[i];
    for (let k = 0; k < n; k++) {
      const off = (k - (n - 1) / 2) * 46;
      const x = r.dx + off, y = r.dy;
      if (taken) out += `<circle cx="${x}" cy="${y}" r="18" fill="none" stroke="${TEAM[taken].main}" stroke-width="4" stroke-dasharray="6 5" opacity=".9"/>`;
      else out += `<g class="medal" transform="translate(${x} ${y})"><circle r="21" fill="#1d1d1d"/><circle r="17" fill="#ffd34d" stroke="#b8860b" stroke-width="3"/>
        <path d="M0 -10 l3 6 6.5 .8 -4.8 4.4 1.3 6.5 -6 -3.4 -6 3.4 1.3 -6.5 -4.8 -4.4 6.5 -.8z" fill="#fff6c2"/></g>`;
    }
  });
  out += '</g>';

  // nodes
  out += '<g class="nodes">';
  for (const id in m.nodes) {
    const n = m.nodes[id], p = P(id);
    let g = '';
    if (n.hq) g = th.hq(p, n.hq, n);
    else if (n.special) g = th.special(p, n.special, n);
    else g = th.base(p, n);
    out += `<g class="node" data-node="${id}">${g}</g>`;
  }
  out += '</g>';

  // recent move markers
  if (opts.recent) for (const id of opts.recent) { const p = P(id); out += `<g class="recent">${rr(p.x, p.y, 150, 150, 26, 'fill="none" stroke="#ff9f1c" stroke-width="8"')}</g>`; }

  // troops
  out += '<g class="tokens">';
  for (const id in s.stacks) out += tokenSVG(s, id, P(id), opts);
  out += '</g>';

  // highlights
  if (opts.highlight) {
    out += '<g class="hl">';
    for (const [id, kind] of opts.highlight) {
      const p = P(id), n = m.nodes[id];
      const size = n.hq ? HQ + 14 : BASE + 26;
      out += `<g class="hl-${kind}${opts.hover === id ? ' hover' : ''}" data-node="${id}">${rr(p.x, p.y, size, size, 30, 'class="hl-ring" fill="none"')}</g>`;
    }
    out += '</g>';
  }
  if (opts.ghost) {
    const p = P(opts.ghost.node);
    const t = typeOf(opts.ghost.id), color = ownerOf(opts.ghost.id), c = TEAM[color];
    out += `<g class="ghost-token" transform="translate(${p.x} ${p.y})">${rr(0, 0, 112, 112, 18, `fill="${c.main}" stroke="#fff" stroke-width="6"`)}
      <g class="bob t${t}"><g transform="translate(-46 -40) scale(.92)">${troopArtGroup(t, color)}</g></g></g>`;
  }

  // hit targets (on top)
  out += '<g class="hits">';
  for (const id in m.nodes) {
    const p = P(id), n = m.nodes[id];
    const size = n.hq ? HQ + 20 : BASE + 30;
    out += `<rect class="hit" data-node="${id}" x="${p.x - size / 2}" y="${p.y - size / 2}" width="${size}" height="${size}" fill="transparent"/>`;
  }
  out += '</g></svg>';
  return out;
}

// Mini preview for the map picker.
export function renderPreview(m) {
  const empty = { stacks: {}, taken: {} };
  return renderBoard(empty, m, {});
}
