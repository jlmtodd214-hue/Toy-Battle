// SVG board renderer. Two layers:
//  - static: terrain art (textures, paths, bases, H.Q.) — rendered once per map/orientation
//  - dynamic: medals, troops, highlights and tap targets — re-rendered every update
import { TEAM, troopArtGroup } from './troops.js';
import { topOf, ownerOf, typeOf } from './engine.js';
import { shade, C, E, R, P } from './paint.js';

export const W = 1000, H = 1600;
const BASE = 128, HQ = 176;

function prng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hash = (str) => [...str].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7);
const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];

export const SPECIAL_ICON = {
  retreat: '<path d="M12 3l6 6h-4v6h-4V9H6z" fill="#fff" stroke="#1d1d1d" stroke-width="1.5" stroke-linejoin="round"/><rect x="4" y="17" width="16" height="4" rx="1.5" fill="#c8873a" stroke="#1d1d1d" stroke-width="1.5"/>',
  draw: '<rect x="5" y="5" width="11" height="15" rx="2" fill="#fff" stroke="#1d1d1d" stroke-width="1.5"/><text x="19" y="22" font-size="9" font-weight="900" text-anchor="middle" fill="#1d1d1d">+1</text>',
  push: '<path d="M12 4v16M4 12h16" stroke="#1d1d1d" stroke-width="2"/><path d="M12 2l3 4H9zM12 22l3-4H9zM2 12l4 3V9zM22 12l-4 3V9z" fill="#ff7a1a" stroke="#1d1d1d" stroke-width="1"/>',
  revive: '<rect x="5" y="9" width="12" height="12" rx="2" fill="#fff" stroke="#1d1d1d" stroke-width="1.5"/><path d="M12 8c-2-4-8-1-4 3l4 3 4-3c4-4-2-7-4-3z" fill="#ff5c7a" stroke="#1d1d1d" stroke-width="1.2"/>',
  snipe: '<circle cx="12" cy="12" r="7" fill="none" stroke="#1d1d1d" stroke-width="2"/><path d="M12 2v6M12 16v6M2 12h6M16 12h6" stroke="#1d1d1d" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="#e5484d"/>',
  shield: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" fill="#7df9ff" stroke="#1d1d1d" stroke-width="1.5"/><path d="M9 9l6 6M15 9l-6 6" stroke="#e5484d" stroke-width="2.2" stroke-linecap="round"/>',
};

// Round enamel badge with the effect icon.
const badge = (x, y, kind, r = 25) => `<g transform="translate(${x} ${y})" filter="url(#b-drop-s)">
  ${C(0, 0, r + 4, '#c98a2c')}${C(0, 0, r, '#fbf6ea', 's')}
  <g transform="translate(${-r * 0.7} ${-r * 0.7}) scale(${(r * 1.4) / 24})">${SPECIAL_ICON[kind]}</g></g>`;

const allowTag = (x, y, allow) => `<g transform="translate(${x} ${y})" filter="url(#b-drop-s)">
  ${P('M-46 -20 h92 l-10 40 h-72 z', '#f39a1d', 'v')}
  <text y="10" text-anchor="middle" font-size="27" font-weight="900" fill="#fff" stroke="#8a4a00" stroke-width="1.2" font-family="Nunito, sans-serif">★ ${allow.join('/')}</text></g>`;

// ------------------------------------------------------------------ shared defs (board only)
const BOARD_DEFS = `
  <filter id="b-drop" x="-30%" y="-30%" width="170%" height="170%"><feDropShadow dx="7" dy="12" stdDeviation="7" flood-color="#000" flood-opacity=".45"/></filter>
  <filter id="b-drop-s" x="-30%" y="-30%" width="170%" height="170%"><feDropShadow dx="2" dy="4" stdDeviation="2.5" flood-color="#000" flood-opacity=".4"/></filter>
  <filter id="b-blur3" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="b-blur8" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="b-blur20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>
  <filter id="b-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="b-grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="7" result="n"/>
    <feColorMatrix in="n" type="saturate" values="0" result="g"/>
    <feComposite in="SourceGraphic" in2="g" operator="arithmetic" k1="0" k2="1" k3=".28" k4="-.14" result="c"/>
    <feComposite in="c" in2="SourceGraphic" operator="in"/></filter>
  <filter id="b-mottle" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency=".006" numOctaves="3" seed="11" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.05"/></filter>
  <filter id="b-water" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="turbulence" baseFrequency=".012 .02" numOctaves="2" seed="3" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -7 2.2"/></filter>
  <filter id="b-brushed" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency=".002 .5" numOctaves="2" seed="9" result="n"/>
    <feColorMatrix in="n" type="saturate" values="0" result="g"/>
    <feComposite in="SourceGraphic" in2="g" operator="arithmetic" k1="0" k2="1" k3=".25" k4="-.12" result="c"/>
    <feComposite in="c" in2="SourceGraphic" operator="in"/></filter>
  <radialGradient id="b-vignette" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>
  <radialGradient id="b-lava" cx=".5" cy=".5" r=".55"><stop offset="0" stop-color="#fff3b0"/><stop offset=".35" stop-color="#ffb21a"/><stop offset=".75" stop-color="#f05a0a"/><stop offset="1" stop-color="#8a1e00"/></radialGradient>
  <radialGradient id="b-tube" cx=".5" cy=".5" r=".5"><stop offset=".42" stop-color="#000" stop-opacity=".6"/><stop offset=".5" stop-color="#000" stop-opacity=".1"/>
    <stop offset=".64" stop-color="#fff" stop-opacity=".4"/><stop offset=".8" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>`;

// ------------------------------------------------------------------ reusable pieces
// Path network drawn in passes so borders sit under every surface (clean joins).
function pathPasses(edges, P_, passes) {
  return passes.map((ps) => `<g ${ps.attrs || ''}>${edges.map(([u, v]) => {
    const a = P_(u), b = P_(v);
    return ps.custom ? ps.custom(a, b) : `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${ps.c}" stroke-width="${ps.w}" stroke-linecap="${ps.cap || 'round'}" ${ps.dash ? `stroke-dasharray="${ps.dash}"` : ''} ${ps.op ? `opacity="${ps.op}"` : ''}/>`;
  }).join('')}</g>`).join('');
}

// Scatter small things along each path.
function along(edges, P_, rnd, every, fn) {
  let s = '';
  for (const [u, v] of edges) {
    const a = P_(u), b = P_(v), len = Math.hypot(b.x - a.x, b.y - a.y);
    const nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
    for (let d = 70; d < len - 70; d += every * (0.6 + rnd() * 0.8)) {
      const t = d / len, off = (rnd() - 0.5);
      s += fn(a.x + (b.x - a.x) * t + nx * off * 30, a.y + (b.y - a.y) * t + ny * off * 30, rnd, Math.atan2(b.y - a.y, b.x - a.x));
    }
  }
  return s;
}

// A square slab paved with irregular stones.
function cobbleTile(p, size, pal, rnd, rx = 20) {
  const h = size / 2;
  let s = `<g filter="url(#b-drop)">${R(p.x - h, p.y - h, size, size, rx, pal.edge, 'v')}</g>`;
  s += R(p.x - h + 7, p.y - h + 7, size - 14, size - 14, rx - 6, pal.mortar, '');
  const n = 3, cell = (size - 18) / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const w = cell - 4 - rnd() * 4, hh = cell - 4 - rnd() * 4;
    const x0 = p.x - h + 9 + i * cell + (cell - w) / 2 + (rnd() - 0.5) * 2;
    const y0 = p.y - h + 9 + j * cell + (cell - hh) / 2 + (rnd() - 0.5) * 2;
    const col = shade(pick(rnd, pal.stones), (rnd() - 0.5) * 0.12);
    s += `<rect x="${x0 + 1.5}" y="${y0 + 3}" width="${w}" height="${hh}" rx="${7 + rnd() * 4}" fill="${shade(col, -0.45)}" opacity=".7"/>`;
    s += R(x0, y0, w, hh, 7 + rnd() * 4, col, 'r');
  }
  s += `<rect x="${p.x - h + 2}" y="${p.y - h + 2}" width="${size - 4}" height="${size - 4}" rx="${rx - 2}" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="3"/>`;
  return s;
}

function plankTile(p, size, base, rnd, rx = 12) {
  const h = size / 2, n = 4, pw = size / n;
  let s = `<g filter="url(#b-drop)">${R(p.x - h, p.y - h, size, size, rx, shade(base, -0.35), '')}</g>`;
  for (let i = 0; i < n; i++) {
    const col = shade(base, (rnd() - 0.5) * 0.2);
    s += R(p.x - h + i * pw + 2, p.y - h + 3, pw - 4, size - 6, 4, col, 'h');
    for (let k = 0; k < 3; k++) s += `<path d="M${p.x - h + i * pw + 6 + k * 8} ${p.y - h + 8} q${(rnd() - 0.5) * 8} ${size / 2} 0 ${size - 16}" fill="none" stroke="${shade(col, -0.25)}" stroke-width="1.2" opacity=".6"/>`;
    s += `<circle cx="${p.x - h + i * pw + pw / 2}" cy="${p.y - h + 14}" r="2.6" fill="#4b3a2a"/><circle cx="${p.x - h + i * pw + pw / 2}" cy="${p.y + h - 14}" r="2.6" fill="#4b3a2a"/>`;
  }
  return s;
}

const bush = (x, y, k, rnd, greens = ['#2e6b2a', '#3f8a35', '#4e9e3f']) => {
  let s = `<g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="6" cy="22" rx="42" ry="14" fill="#000" opacity=".3" filter="url(#b-blur8)"/>`;
  for (let i = 0; i < 7; i++) s += C(-24 + rnd() * 48, -14 + rnd() * 24, 14 + rnd() * 10, pick(rnd, greens), 'r');
  return s + '</g>';
};

const rock = (x, y, k, col = '#8d939a') => `<g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="4" cy="14" rx="26" ry="8" fill="#000" opacity=".3" filter="url(#b-blur3)"/>
  ${P('M-24 10 Q-26 -8 -10 -16 Q8 -24 20 -10 Q30 4 22 12 Z', col, 'r')}</g>`;

const shadowEllipse = (x, y, rx, ry, op = 0.35) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#000" opacity="${op}" filter="url(#b-blur8)"/>`;

// ------------------------------------------------------------------ themes
const THEMES = {
  fort: {
    bg(rnd, m, lite) {
      let s = `<rect width="${W}" height="${H}" fill="#5f9e3c"/>`;
      if (!lite) s += `<rect width="${W}" height="${H}" fill="#9cc95a" filter="url(#b-mottle)" opacity=".7"/>`;
      if (!lite) for (let i = 0; i < 1400; i++) {
        const x = rnd() * W, y = rnd() * H, h = 8 + rnd() * 10, c = pick(rnd, ['#4c8a2e', '#6aae3f', '#7fbf4a', '#3f7a28', '#8acb55']);
        s += `<path d="M${x} ${y} q${(rnd() - 0.5) * 6} ${-h / 2} ${(rnd() - 0.5) * 8} ${-h}" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
      }
      for (let i = 0; i < 36; i++) s += `<g transform="translate(${rnd() * W} ${rnd() * H})"><circle r="4.5" fill="#fff"/><circle r="4.5" fill="url(#ov-r)"/><circle r="1.8" fill="#f2c230"/></g>`;
      for (let i = 0; i < 18; i++) s += bush(rnd() < 0.5 ? 20 + rnd() * 50 : W - 20 - rnd() * 50, rnd() * H, 0.8 + rnd() * 0.6, rnd);
      for (let i = 0; i < 6; i++) s += rock(rnd() < 0.5 ? 50 : W - 50, rnd() * H, 0.8 + rnd() * 0.6);
      return s;
    },
    paths: (edges, P_, rnd) => pathPasses(edges, P_, [
      { c: '#3d5a1f', w: 70, op: 0.5, attrs: 'filter="url(#b-blur8)"' },
      { c: '#8a6a3c', w: 54 },
      { c: '#c9a46a', w: 44, attrs: 'filter="url(#b-grain)"' },
      { c: '#d9b77e', w: 18, op: 0.6 },
    ]) + along(edges, P_, rnd, 26, (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="${2 + r() * 3}" ry="${1.5 + r() * 2}" fill="${pick(r, ['#9c8d78', '#b3a58e', '#7d705e'])}"/>`),
    base: (p, n, rnd) => cobbleTile(p, BASE, { edge: '#8b8f94', mortar: '#5d6166', stones: ['#b5b9bd', '#a4a9ae', '#c4c7ca', '#9ea2a6'] }, rnd),
    special: (p, kind, n, rnd) => `${cobbleTile(p, BASE, { edge: '#8a6e4b', mortar: '#5a4630', stones: ['#c9a476', '#b8936a', '#d6b58a'] }, rnd)}
      <g filter="url(#b-drop)">
        ${R(p.x - 48, p.y - 70, 96, 40, 4, '#a9a39a', 'h')}
        ${[0, 1, 2, 3].map((i) => R(p.x - 48 + i * 26, p.y - 84, 18, 16, 2, '#b7b1a8', 'v')).join('')}
        ${R(p.x - 10, p.y - 58, 20, 28, 10, '#3a2c20', 'v')}
        <path d="M${p.x + 40} ${p.y - 84} v-44" stroke="#5a4630" stroke-width="4"/>
        <path class="flag" d="M${p.x + 40} ${p.y - 128} l36 10 -36 10z" fill="#e8c34a"/>
      </g>${badge(p.x - 50, p.y + 50, kind)}`,
    hq: (p, color) => { const c = TEAM[color]; return `
      ${shadowEllipse(p.x + 14, p.y + 76, 110, 26)}
      <path d="M${p.x - 104} ${p.y + 74} L${p.x - 116} ${p.y + 90} M${p.x + 104} ${p.y + 74} L${p.x + 116} ${p.y + 90}" stroke="#8d7a5c" stroke-width="2"/>
      ${P(`M${p.x - 100} ${p.y + 74} L${p.x} ${p.y - 84} L${p.x + 100} ${p.y + 74} Z`, c.main, 'h')}
      <path d="M${p.x - 50} ${p.y + 74} L${p.x} ${p.y - 84} M${p.x + 50} ${p.y + 74} L${p.x} ${p.y - 84}" stroke="${shade(c.main, -0.3)}" stroke-width="2" opacity=".6"/>
      ${P(`M${p.x - 30} ${p.y + 74} Q${p.x - 4} ${p.y} ${p.x} ${p.y - 6} Q${p.x + 4} ${p.y} ${p.x + 30} ${p.y + 74} Z`, '#2a1d14', 'v')}
      ${P(`M${p.x - 30} ${p.y + 74} Q${p.x - 18} ${p.y + 20} ${p.x} ${p.y - 6} L${p.x - 6} ${p.y + 74} Z`, shade(c.main, 0.1), 'v')}
      <path d="M${p.x} ${p.y - 84} v-46" stroke="#5a4630" stroke-width="5"/>
      <path class="flag" d="M${p.x} ${p.y - 130} l44 12 -44 12z" fill="${shade(c.main, 0.25)}"/>`; },
  },

  clouds: {
    bg(rnd, m, lite) {
      let s = `<defs><linearGradient id="g-bg-clouds" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f9c6e2"/><stop offset=".5" stop-color="#d9cdf8"/><stop offset="1" stop-color="#f9c6e2"/></linearGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#g-bg-clouds)"/>`;
      ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa'].forEach((col, i) => {
        s += `<rect x="${380 + i * 40}" y="0" width="40" height="${H}" fill="${col}" opacity=".55" ${lite ? '' : 'filter="url(#b-blur8)"'}/>`;
      });
      for (let i = 0; i < 26; i++) {
        const x = rnd() * W, y = rnd() * H, k = 0.7 + rnd() * 1.3;
        s += `<g transform="translate(${x} ${y}) scale(${k})" opacity=".95" ${lite ? '' : 'filter="url(#b-blur3)"'}>
          <ellipse cx="0" cy="26" rx="70" ry="14" fill="#c9a6d8" opacity=".5"/>
          ${C(0, 0, 40, '#ffffff', 'r')}${C(40, 10, 30, '#fff7fc', 'r')}${C(-42, 12, 28, '#fff7fc', 'r')}</g>`;
      }
      return s;
    },
    paths: (edges, P_) => pathPasses(edges, P_, [
      { c: '#b98fb0', w: 48, op: 0.45, attrs: 'filter="url(#b-blur8)" transform="translate(6 10)"' },
      { c: '#e6d7e8', w: 40 },
      { c: '#ffffff', w: 30 },
      { c: '#ff8cc0', w: 30, dash: '12 16', cap: 'butt' },
      { c: '#ffffff', w: 6, op: 0.7, attrs: 'transform="translate(-5 -6)"' },
    ]),
    base: (p) => { const h = BASE / 2; let s = `<g filter="url(#b-drop)">${R(p.x - h, p.y - h, BASE, BASE, 26, '#d9a24a', 'v')}</g>`;
      s += R(p.x - h + 8, p.y - h + 8, BASE - 16, BASE - 16, 18, '#f2c86c', 'r');
      for (let i = 1; i < 6; i++) s += `<path d="M${p.x - h + 8 + i * 19} ${p.y - h + 10} v${BASE - 20} M${p.x - h + 10} ${p.y - h + 8 + i * 19} h${BASE - 20}" stroke="#c98d2e" stroke-width="3" opacity=".8"/>`;
      return s; },
    special: (p, kind) => `${shadowEllipse(p.x + 10, p.y + 60, 76, 18)}
      <g filter="url(#b-drop)">
        ${P(`M${p.x - 58} ${p.y - 4} L${p.x - 44} ${p.y + 60} H${p.x + 44} L${p.x + 58} ${p.y - 4} Z`, '#c98a46', 'h')}
        ${[-40, -14, 14, 40].map((dx) => `<path d="M${p.x + dx} ${p.y} v58" stroke="#a46a30" stroke-width="3"/>`).join('')}
        ${P(`M${p.x - 66} ${p.y} q-8 -40 30 -46 q10 -36 36 -26 q26 -10 36 26 q38 6 30 46 z`, '#ffb3d6', 'r')}
        ${C(p.x, p.y - 74, 14, '#d4222f', 'r')}
        ${[...Array(9)].map((_, i) => `<rect x="${p.x - 50 + i * 12}" y="${p.y - 34 + (i % 3) * 9}" width="5" height="11" rx="2.5" fill="${['#ffd43b', '#4dabf7', '#69db7c', '#fff'][i % 4]}" transform="rotate(${i * 37} ${p.x - 48 + i * 12} ${p.y - 28})"/>`).join('')}
      </g>${badge(p.x + 62, p.y + 46, kind)}`,
    hq: (p, color) => { const c = TEAM[color]; return `${shadowEllipse(p.x + 12, p.y + 74, 100, 22)}
      <g filter="url(#b-drop)">
        ${R(p.x - 80, p.y - 30, 160, 102, 18, c.main, 'h')}
        ${[-60, -20, 20, 60].map((dx) => C(p.x + dx, p.y - 34, 22, c.light, 'r')).join('')}
        ${P(`M${p.x - 22} ${p.y + 72} v-36 a22 22 0 0 1 44 0 v36z`, shade(c.dark, -0.2), 'v')}
        ${C(p.x, p.y - 76, 16, '#f4c430', 'r')}
        ${[0, 1, 2, 3, 4].map((i) => C(p.x - 60 + i * 30, p.y + 6, 6, '#fff', 'r')).join('')}
      </g>`; },
  },

  lava: {
    bg(rnd, m, lite) {
      let s = `<rect width="${W}" height="${H}" fill="#4a3329"/>`;
      if (!lite) s += `<rect width="${W}" height="${H}" fill="#6b4a36" filter="url(#b-mottle)"/><rect width="${W}" height="${H}" fill="#5a3f30" filter="url(#b-grain)" opacity=".8"/>`;
      for (let i = 0; i < 18; i++) s += bush(rnd() < 0.5 ? 25 + rnd() * 40 : W - 25 - rnd() * 40, rnd() * H, 0.7 + rnd() * 0.5, rnd, ['#1f5a2a', '#2c7a36', '#3c8d40']);
      m.regions.forEach((r, i) => {
        if (i % 2) return;
        s += `<g transform="translate(${r.dx} ${r.dy})">
          <ellipse rx="125" ry="85" fill="#ff5a00" opacity=".55" filter="url(#b-blur20)"/>
          ${P('M-95 0 q-12 -58 46 -70 q46 -34 82 12 q58 0 46 58 q-12 58 -82 46 q-82 24 -92 -46z', '#3a2218', '')}
          <path d="M-80 0 q-8 -46 38 -56 q38 -28 66 10 q46 2 36 46 q-10 46 -66 36 q-66 18 -74 -36z" fill="url(#b-lava)"/>
          <circle cx="-30" cy="-14" r="8" fill="#fff6c8" opacity=".8" filter="url(#b-blur3)"/></g>`;
      });
      return s;
    },
    paths: (edges, P_) => pathPasses(edges, P_, [
      { c: '#000', w: 56, op: 0.45, attrs: 'filter="url(#b-blur8)" transform="translate(6 10)"' },
      { custom: (a, b) => {
        const len = Math.hypot(b.x - a.x, b.y - a.y), ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
        let st = `<g transform="translate(${a.x} ${a.y}) rotate(${ang})"><rect x="0" y="-26" width="${len}" height="4" fill="#6b4a2a"/><rect x="0" y="22" width="${len}" height="4" fill="#6b4a2a"/>`;
        for (let d = 20; d < len - 10; d += 24) st += R(d - 10, -24, 20, 48, 3, d % 48 ? '#a8763f' : '#9a6a36', 'h');
        return st + '</g>';
      }, attrs: 'filter="url(#b-grain)"' },
    ]),
    base: (p, n, rnd) => cobbleTile(p, BASE, { edge: '#7a3b26', mortar: '#3b1f15', stones: ['#a4553a', '#b8643f', '#93482f', '#c06d47'] }, rnd),
    special: (p, kind) => `${shadowEllipse(p.x + 12, p.y + 60, 86, 20)}
      <g filter="url(#b-drop)">
        ${P(`M${p.x - 78} ${p.y + 58} L${p.x - 24} ${p.y - 52} H${p.x + 24} L${p.x + 78} ${p.y + 58} Z`, '#5e3a26', 'h')}
        ${P(`M${p.x - 24} ${p.y - 52} q10 30 4 54 q14 -12 18 -54 q4 40 16 32 q-6 -22 6 -32z`, '#ff7a1a', '')}
        ${E(p.x, p.y - 52, 25, 8, '#ffd34d', 'r')}
      </g>
      <ellipse cx="${p.x}" cy="${p.y - 52}" rx="40" ry="18" fill="#ff8a00" opacity=".6" filter="url(#b-blur8)"/>
      <g class="smoke" filter="url(#b-blur3)"><circle cx="${p.x - 6}" cy="${p.y - 80}" r="13" fill="#9a9a9a" opacity=".7"/><circle cx="${p.x + 12}" cy="${p.y - 102}" r="17" fill="#b5b5b5" opacity=".55"/></g>
      ${badge(p.x + 60, p.y + 46, kind)}`,
    hq: (p, color) => { const c = TEAM[color]; return `${shadowEllipse(p.x + 14, p.y + 76, 104, 24)}
      <g filter="url(#b-drop)">
        ${R(p.x - 88, p.y - 20, 176, 96, 6, '#8c6a4c', 'h')}
        ${R(p.x - 72, p.y - 52, 144, 40, 6, '#a07c5a', 'h')}
        ${R(p.x - 52, p.y - 78, 104, 30, 6, '#b08c68', 'h')}
        ${R(p.x - 40, p.y - 6, 80, 82, 6, c.main, 'h')}
        ${R(p.x - 24, p.y + 12, 48, 64, 4, shade(c.dark, -0.3), 'v')}
        ${[...Array(5)].map((_, i) => `<rect x="${p.x - 86}" y="${p.y - 14 + i * 18}" width="44" height="3" fill="#6d4f36" opacity=".6"/><rect x="${p.x + 42}" y="${p.y - 14 + i * 18}" width="44" height="3" fill="#6d4f36" opacity=".6"/>`).join('')}
      </g>`; },
  },

  attic: {
    bg(rnd, m, lite) {
      let s = `<rect width="${W}" height="${H}" fill="#3b2b24"/>`;
      for (let i = 0; i < 12; i++) {
        const col = shade('#6b4a36', (rnd() - 0.5) * 0.25);
        s += R(i * 84, -10, 82, H + 20, 2, col, 'h');
        for (let k = 0; k < 7; k++) s += `<path d="M${i * 84 + 10 + rnd() * 62} 0 q${(rnd() - 0.5) * 20} ${H / 2} 0 ${H}" stroke="${shade(col, -0.25)}" stroke-width="1.5" fill="none" opacity=".6"/>`;
        for (let k = 0; k < 3; k++) { const y = rnd() * H; s += `<rect x="${i * 84}" y="${y}" width="82" height="3" fill="#24180f"/><circle cx="${i * 84 + 10}" cy="${y + 10}" r="2.5" fill="#2a2a2a"/><circle cx="${i * 84 + 72}" cy="${y + 10}" r="2.5" fill="#2a2a2a"/>`; }
      }
      if (!lite) s += `<rect width="${W}" height="${H}" fill="#3b2b24" filter="url(#b-grain)" opacity=".4"/>`;
      s += `<path d="M${W * 0.7} 0 L${W} 0 L${W * 0.4} ${H} L0 ${H} Z" fill="#fff2c8" opacity=".08" ${lite ? '' : 'filter="url(#b-blur20)"'}/>`;
      for (const [x, y, sx, sy] of [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]]) {
        s += `<g transform="translate(${x} ${y}) scale(${sx} ${sy})" stroke="#e8e2f0" stroke-width="1.5" fill="none" opacity=".45">
          <path d="M0 0 L190 44 M0 0 L130 130 M0 0 L44 190"/><path d="M64 15 Q54 44 42 64 Q38 38 15 64"/><path d="M118 27 Q96 74 86 86 Q64 90 27 118"/><path d="M170 40 Q140 110 120 120 Q100 140 40 170"/></g>`;
      }
      for (let i = 0; i < 60; i++) s += `<circle cx="${rnd() * W}" cy="${rnd() * H}" r="${1 + rnd() * 2}" fill="#fff" opacity="${0.1 + rnd() * 0.3}"/>`;
      return s;
    },
    paths: (edges, P_) => pathPasses(edges, P_, [
      { c: '#000', w: 54, op: 0.4, attrs: 'filter="url(#b-blur8)" transform="translate(5 8)"' },
      { c: '#5e2f3a', w: 48 },
      { c: '#8a4552', w: 40, attrs: 'filter="url(#b-grain)"' },
      { c: '#d9b25e', w: 30, dash: '4 6', cap: 'butt', op: 0.55 },
      { c: '#8a4552', w: 22 },
      { c: '#b8697a', w: 4, dash: '10 8', op: 0.8 },
    ]),
    base: (p, n, rnd) => { const h = BASE / 2, col = pick(rnd, ['#6b2f3a', '#2f4a6b', '#3d5e3a', '#5a3d6b']);
      return `<g filter="url(#b-drop)">${R(p.x - h + 6, p.y - h + 10, BASE - 6, BASE - 12, 6, '#efe6d0', 'v')}${R(p.x - h, p.y - h, BASE - 8, BASE - 10, 6, col, 'r')}</g>
        ${R(p.x - h, p.y - h, 14, BASE - 10, 4, shade(col, -0.3), 'h')}
        <rect x="${p.x - h + 26}" y="${p.y - h + 18}" width="${BASE - 46}" height="${BASE - 46}" rx="6" fill="none" stroke="#d9b25e" stroke-width="3" opacity=".75"/>
        ${[...Array(5)].map((_, i) => `<path d="M${p.x + h - 8} ${p.y - h + 14 + i * 22} h6" stroke="#cbbf9f" stroke-width="2"/>`).join('')}`; },
    special: (p, kind) => `${shadowEllipse(p.x + 12, p.y + 62, 84, 18)}
      <g filter="url(#b-drop)">
        ${R(p.x - 70, p.y - 10, 140, 76, 8, '#7a4b25', 'h')}
        ${P(`M${p.x - 70} ${p.y - 10} q70 -46 140 0 v8 h-140z`, '#93602f', 'v')}
        <path d="M${p.x - 70} ${p.y + 22} h140" stroke="#3d2a1a" stroke-width="5"/>
        ${R(p.x - 50, p.y - 18, 10, 84, 2, '#b08a3c', 'h')}${R(p.x + 40, p.y - 18, 10, 84, 2, '#b08a3c', 'h')}
        ${R(p.x - 11, p.y + 10, 22, 26, 3, '#d4a838', 'v')}
      </g>
      <g class="ghost" opacity=".85">${P(`M${p.x - 24} ${p.y - 22} v-38 a24 24 0 0 1 48 0 v38 l-8 -8 -8 8 -8 -8 -8 8 -8 -8z`, '#f4f4fa', 'r', 'filter="url(#b-blur3)" opacity=".35"')}
        ${P(`M${p.x - 22} ${p.y - 24} v-36 a22 22 0 0 1 44 0 v36 l-7 -7 -7.5 7 -7.5 -7 -7.5 7 -7 -7z`, '#f6f6fb', 'r')}
        <circle cx="${p.x - 8}" cy="${p.y - 62}" r="3.5" fill="#222"/><circle cx="${p.x + 8}" cy="${p.y - 62}" r="3.5" fill="#222"/><ellipse cx="${p.x}" cy="${p.y - 49}" rx="4" ry="6" fill="#333"/></g>
      ${badge(p.x + 62, p.y + 50, kind)}`,
    hq: (p, color) => { const c = TEAM[color]; return `${shadowEllipse(p.x + 14, p.y + 76, 106, 22)}
      <g filter="url(#b-drop)">
        ${R(p.x - 92, p.y - 20, 184, 96, 10, c.main, 'h')}
        ${P(`M${p.x - 92} ${p.y - 20} q92 -72 184 0 v10 h-184z`, shade(c.main, -0.15), 'v')}
        ${R(p.x - 92, p.y + 16, 184, 10, 2, '#c9a23c', 'v')}
        ${R(p.x - 66, p.y - 44, 10, 120, 2, '#c9a23c', 'h')}${R(p.x + 56, p.y - 44, 10, 120, 2, '#c9a23c', 'h')}
        ${R(p.x - 16, p.y - 4, 32, 38, 5, '#d4a838', 'v')}<circle cx="${p.x}" cy="${p.y + 12}" r="4.5" fill="#222"/>
      </g>`; },
  },

  bay: {
    bg(rnd, m, lite) {
      let s = `<rect width="${W}" height="${H}" fill="#e9eef3"/>`;
      s += `<g filter="url(#b-drop)">${R(18, 18, W - 36, H - 36, 130, '#f7f9fb', 'v')}</g>`;
      s += R(38, 38, W - 76, H - 76, 112, '#3aa3d8', 'r');
      if (!lite) s += `<rect x="38" y="38" width="${W - 76}" height="${H - 76}" rx="112" filter="url(#b-water)" opacity=".2"/>`;
      for (let i = 0; i < 70; i++) { const r = 4 + rnd() * 16, x = 80 + rnd() * (W - 160), y = 80 + rnd() * (H - 160);
        s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity=".15" stroke="#fff" stroke-opacity=".6" stroke-width="1.5"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.25}" fill="#fff" opacity=".7"/>`; }
      s += `<g transform="translate(${W - 110} ${H / 2})" filter="url(#b-drop-s)">${C(0, 0, 26, '#c7cfd8')}${R(-6, -96, 12, 72, 6, '#aeb7c1', 'h')}</g>`;
      return s;
    },
    paths: (edges, P_, rnd) => pathPasses(edges, P_, [
      { c: '#0d4f78', w: 26, op: 0.4, attrs: 'filter="url(#b-blur3)" transform="translate(4 8)"' },
      { c: '#cbb98f', w: 12 },
      { c: '#a8925f', w: 12, dash: '3 5', cap: 'butt' },
    ]) + along(edges, P_, rnd, 70, (x, y) => `<g filter="url(#b-drop-s)">${C(x, y, 11, '#e5484d')}<path d="M${x - 11} ${y} h22" stroke="#fff" stroke-width="5"/></g>`),
    base: (p, n, rnd) => { const h = BASE / 2;
      let s = `<g filter="url(#b-drop)">${R(p.x - h, p.y - h, BASE, BASE, 24, '#f2c534', 'r')}</g>`;
      for (let i = 0; i < 9; i++) s += E(p.x - 44 + rnd() * 88, p.y - 44 + rnd() * 88, 4 + rnd() * 6, 3 + rnd() * 5, '#c99a12', 's');
      return s + `<rect x="${p.x - h}" y="${p.y - h}" width="${BASE}" height="${BASE}" rx="24" fill="#f2c534" filter="url(#b-grain)" opacity=".35"/>`; },
    special: (p, kind, n, rnd) => THEMES.bay.base(p, n, rnd),
    hq: (p, color) => { const c = TEAM[color]; return `${shadowEllipse(p.x + 10, p.y + 68, 106, 22, 0.4)}
      <g filter="url(#b-drop)">
        ${P(`M${p.x - 100} ${p.y + 6} H${p.x + 100} L${p.x + 74} ${p.y + 66} H${p.x - 74} Z`, c.main, 'v')}
        ${R(p.x - 96, p.y + 18, 192, 8, 3, '#fff', 'v')}
        ${R(p.x - 50, p.y - 26, 100, 34, 6, '#f2efe8', 'v')}
        ${[-30, 0, 30].map((dx) => C(p.x + dx, p.y - 9, 7, '#8fd0ee')).join('')}
        <path d="M${p.x - 4} ${p.y - 26} V${p.y - 110}" stroke="#6b4a2a" stroke-width="6"/>
        <path class="flag" d="M${p.x} ${p.y - 108} l40 12 -40 12z" fill="${c.light}"/>
      </g>`; },
  },

  trenches: {
    bg(rnd, m, lite) {
      let s = `<rect width="${W}" height="${H}" fill="#e2c180"/>`;
      if (!lite) s += `<rect width="${W}" height="${H}" fill="#f2d79a" filter="url(#b-mottle)"/><rect width="${W}" height="${H}" fill="#e2c180" filter="url(#b-grain)" opacity=".7"/>`;
      for (let i = 0; i < 60; i++) { const x = rnd() * W, y = rnd() * H; s += `<path d="M${x} ${y} q30 -10 60 0 q30 10 60 0" fill="none" stroke="#c9a462" stroke-width="3" opacity=".6"/><path d="M${x} ${y + 3} q30 -10 60 0 q30 10 60 0" fill="none" stroke="#fff3d0" stroke-width="2" opacity=".5"/>`; }
      for (let i = 0; i < 9; i++) { const x = rnd() < 0.5 ? 40 + rnd() * 30 : W - 40 - rnd() * 30, y = rnd() * H;
        s += `<g transform="translate(${x} ${y}) rotate(${rnd() * 360})" filter="url(#b-drop-s)">${P('M0 -26 l7 18 19 1 -15 12 5 19 -16 -10 -16 10 5 -19 -15 -12 19 -1z', '#f08a5d', 'r')}</g>`; }
      for (let i = 0; i < 8; i++) { const x = rnd() < 0.5 ? 40 + rnd() * 30 : W - 40 - rnd() * 30;
        s += `<g filter="url(#b-drop-s)">${P(`M${x - 24} ${rnd() * H} a24 24 0 0 1 48 0 z`, '#f3a5c0', 'r')}</g>`; }
      return s;
    },
    paths: (edges, P_) => pathPasses(edges, P_, [
      { c: '#5a3a1a', w: 64, op: 0.45, attrs: 'filter="url(#b-blur8)"' },
      { c: '#7b5530', w: 52, cap: 'square' },
      { c: '#a37443', w: 40, dash: '14 5', cap: 'butt', attrs: 'filter="url(#b-grain)"' },
    ]),
    base: (p, n, rnd) => { const h = BASE / 2; let s = `<g filter="url(#b-drop)">${R(p.x - h, p.y - h, BASE, BASE, 16, '#8a7552', '')}</g>`;
      for (let row = 0; row < 3; row++) for (let k = 0; k < 2; k++) {
        const x = p.x - h + 6 + k * 58 + (row % 2) * 6, y = p.y - h + 6 + row * 39;
        s += R(x, y, 54, 36, 16, shade('#d4c094', (rnd() - 0.5) * 0.15), 'r');
        s += `<path d="M${x + 8} ${y + 18} h38" stroke="#a6916a" stroke-width="1.5" stroke-dasharray="3 3"/>`;
      }
      return s; },
    special: (p, kind) => `${shadowEllipse(p.x + 12, p.y + 64, 80, 18)}
      <g filter="url(#b-drop)">
        ${[[-50, 60, -30, -30], [50, 60, 30, -30]].map(([x1, y1, x2, y2]) => `<path d="M${p.x + x1} ${p.y + y1} L${p.x + x2} ${p.y + y2}" stroke="#7a5a34" stroke-width="10" stroke-linecap="round"/>`).join('')}
        <path d="M${p.x - 44} ${p.y + 30} L${p.x + 40} ${p.y} M${p.x + 44} ${p.y + 30} L${p.x - 40} ${p.y}" stroke="#8d6a3e" stroke-width="7"/>
        ${R(p.x - 56, p.y - 70, 112, 48, 6, '#9a7444', 'h')}
        ${R(p.x - 62, p.y - 76, 124, 12, 4, '#7a5a34', 'v')}
        ${R(p.x - 38, p.y - 58, 76, 14, 5, '#2e2418', 'v')}
      </g>${badge(p.x + 58, p.y + 50, kind)}`,
    hq: (p, color) => { const c = TEAM[color]; return `${shadowEllipse(p.x + 14, p.y + 76, 108, 22)}
      <g filter="url(#b-drop)">
        ${P(`M${p.x - 92} ${p.y + 74} V${p.y - 8} h30 v-20 h30 v20 h64 v-20 h30 v20 h30 V${p.y + 74} Z`, '#e3bf78', 'h')}
        ${P(`M${p.x - 40} ${p.y - 8} V${p.y - 72} h20 v-14 h40 v14 h20 V${p.y - 8}`, '#ecca86', 'h')}
        ${P(`M${p.x - 22} ${p.y + 74} v-34 a22 22 0 0 1 44 0 v34z`, '#7a5a2c', 'v')}
        ${R(p.x - 92, p.y + 20, 184, 12, 2, c.main, 'v')}
        <path d="M${p.x} ${p.y - 86} v-42" stroke="#5a4630" stroke-width="4"/>
        <path class="flag" d="M${p.x} ${p.y - 128} l44 12 -44 12z" fill="${c.main}"/>
      </g>
      <rect x="${p.x - 92}" y="${p.y - 86}" width="184" height="160" fill="#e3bf78" filter="url(#b-grain)" opacity=".25"/>`; },
  },

  pool: {
    bg(rnd, m, lite) {
      let s = `<rect width="${W}" height="${H}" fill="#e9c995"/>`;
      for (let i = 0; i < 20; i++) s += R(i * 52, 0, 48, 36, 6, '#f2d6a6', 'v') + R(i * 52, H - 36, 48, 36, 6, '#f2d6a6', 'v');
      s += `<g filter="url(#b-drop)">${R(36, 40, W - 72, H - 80, 74, '#ffffff', 'v')}</g>`;
      s += R(50, 54, W - 100, H - 108, 62, '#2fb0d4', 'r');
      if (!lite) s += `<rect x="50" y="54" width="${W - 100}" height="${H - 108}" rx="62" filter="url(#b-water)" opacity=".32"/>`;
      s += `<g transform="translate(130 ${H - 130})" filter="url(#b-drop)"><circle r="40" fill="#fff"/><path d="M-40 0 a40 40 0 0 1 80 0z" fill="#e5484d"/><path d="M0 -40 a40 40 0 0 1 0 80z" fill="#3b7dd8" opacity=".9"/><circle r="40" fill="url(#ov-r)"/></g>`;
      return s;
    },
    paths: (edges, P_) => pathPasses(edges, P_, [
      { c: '#0b5f7a', w: 30, op: 0.45, attrs: 'filter="url(#b-blur3)" transform="translate(5 9)"' },
      { c: '#c7196b', w: 28 },
      { c: '#f04e98', w: 22 },
      { c: '#ffb3d4', w: 6, op: 0.75, attrs: 'transform="translate(-3 -5)"' },
    ]),
    base: (p) => `${shadowEllipse(p.x + 8, p.y + 14, 64, 56, 0.45)}
      <circle cx="${p.x}" cy="${p.y}" r="64" fill="#2b2f38"/><circle cx="${p.x}" cy="${p.y}" r="64" fill="url(#b-tube)"/>
      <circle cx="${p.x}" cy="${p.y}" r="27" fill="#2fb0d4" opacity=".85"/>
      <path d="M${p.x - 44} ${p.y - 36} a56 56 0 0 1 40 -20" fill="none" stroke="#fff" stroke-width="6" opacity=".5" stroke-linecap="round"/>
      <circle cx="${p.x + 46}" cy="${p.y + 40}" r="5" fill="#d7a02a"/>`,
    special: (p, kind, n) => `${shadowEllipse(p.x + 8, p.y + 14, 66, 60, 0.45)}
      ${R(p.x - 64, p.y - 64, 128, 128, 40, '#f5a623', 'r')}
      ${R(p.x - 28, p.y - 28, 56, 56, 18, '#2fb0d4', '')}
      ${R(p.x - 28, p.y - 28, 56, 56, 18, 'transparent', 'r')}
      <path d="M${p.x - 64} ${p.y} h36 M${p.x + 28} ${p.y} h36 M${p.x} ${p.y - 64} v36 M${p.x} ${p.y + 28} v36" stroke="#fff" stroke-width="13" opacity=".9"/>
      ${allowTag(p.x, p.y + 84, n.allow)}`,
    hq: (p, color, n) => { const c = TEAM[color]; return `${shadowEllipse(p.x + 10, p.y + 20, 100, 86, 0.45)}
      ${R(p.x - 86, p.y - 76, 172, 152, 60, c.main, 'r')}
      ${R(p.x - 50, p.y - 42, 100, 84, 30, c.light, 'r')}
      ${[-40, 0, 40].map((dx) => `<path d="M${p.x + dx} ${p.y - 76} v34 M${p.x + dx} ${p.y + 42} v34" stroke="${shade(c.main, -0.25)}" stroke-width="3"/>`).join('')}
      ${n.allow ? allowTag(p.x, p.y + 94, n.allow) : ''}`; },
  },

  rocket: {
    bg(rnd, m, lite) {
      let s = `<rect width="${W}" height="${H}" fill="#2a2f45"/>`;
      for (let x = 0; x < W; x += 250) for (let y = 0; y < H; y += 200) {
        s += R(x + 4, y + 4, 242, 192, 10, shade('#3a4060', (rnd() - 0.5) * 0.12), 'v');
        for (const [dx, dy] of [[14, 14], [232, 14], [14, 182], [232, 182]]) s += C(x + dx, y + dy, 4, '#8a92b0');
      }
      if (!lite) s += `<rect width="${W}" height="${H}" fill="#3a4060" filter="url(#b-brushed)" opacity=".6"/>`;
      for (let i = 0; i < 40; i++) s += `<circle cx="${rnd() * W}" cy="${rnd() * H}" r="${0.8 + rnd() * 1.6}" fill="#9ff" opacity="${0.2 + rnd() * 0.5}"/>`;
      s += `<rect x="0" y="760" width="${W}" height="80" fill="#7df9ff" opacity=".25" ${lite ? '' : 'filter="url(#b-blur20)"'}/>`;
      return s;
    },
    paths: (edges, P_) => pathPasses(edges, P_, [
      { c: '#7df9ff', w: 34, op: 0.35, attrs: 'filter="url(#b-blur8)"' },
      { c: '#15182a', w: 34 },
      { c: '#4a4f72', w: 26, attrs: 'filter="url(#b-brushed)"' },
      { c: '#9ad7ff', w: 10, dash: '12 12', cap: 'butt' },
    ]),
    base: (p) => { const h = BASE / 2; return `<g filter="url(#b-drop)">${R(p.x - h, p.y - h, BASE, BASE, 22, '#9aa6b6', 'v')}</g>
      ${R(p.x - h + 8, p.y - h + 8, BASE - 16, BASE - 16, 16, '#d3dbe5', 'r')}
      <rect x="${p.x - h + 8}" y="${p.y - h + 8}" width="${BASE - 16}" height="${BASE - 16}" rx="16" fill="#d3dbe5" filter="url(#b-brushed)" opacity=".6"/>
      ${[-22, 0, 22].map((dy) => R(p.x - 34, p.y + dy - 4, 68, 8, 4, '#aab5c3', 'v')).join('')}
      ${[[-50, -50], [50, -50], [-50, 50], [50, 50]].map(([dx, dy]) => C(p.x + dx, p.y + dy, 4.5, '#7d889a')).join('')}`; },
    special: (p, kind) => { const h = BASE / 2; return `<rect x="${p.x - h - 16}" y="${p.y - h - 16}" width="${BASE + 32}" height="${BASE + 32}" rx="34" fill="#7df9ff" opacity=".5" filter="url(#b-blur8)"/>
      ${R(p.x - h, p.y - h, BASE, BASE, 22, '#5a6a80', 'v')}
      ${R(p.x - h + 8, p.y - h + 8, BASE - 16, BASE - 16, 16, '#bff8ff', 'r', 'opacity=".9"')}
      <path class="zap" d="M${p.x - 50} ${p.y - 30} l22 10 -12 10 22 10 -10 12" fill="none" stroke="#fff" stroke-width="3" filter="url(#b-glow)"/>
      ${badge(p.x + 58, p.y + 58, kind)}`; },
    hq: (p, color) => { const c = TEAM[color]; return `<g filter="url(#b-drop)">
      ${R(p.x - 88, p.y - 88, 176, 176, 28, shade(c.dark, -0.2), 'v')}
      ${R(p.x - 72, p.y - 72, 144, 144, 20, '#c9d2dd', 'r')}
      ${[...Array(8)].map((_, i) => `<path d="M${p.x - 72 + i * 18} ${p.y + 72} l18 -18" stroke="#e8b931" stroke-width="7"/>`).join('')}</g>
      <g class="rocket" filter="url(#b-drop-s)">
        ${P(`M${p.x} ${p.y - 74} q36 30 26 92 h-52 q-10 -62 26 -92z`, '#eef1f5', 'h')}
        ${C(p.x, p.y - 22, 12, '#7df9ff')}
        ${P(`M${p.x - 26} ${p.y + 4} l-20 32 h22z M${p.x + 26} ${p.y + 4} l20 32 h-22z`, c.main, 'v')}
        ${P(`M${p.x - 14} ${p.y + 18} h28 l-6 24 h-16z`, '#ff9800', 'v')}
      </g>`; },
  },
};

// ------------------------------------------------------------------ rendering
const posFn = (m, flip) => (id) => { const n = m.nodes[id]; return flip ? { x: W - n.x, y: H - n.y } : { x: n.x, y: n.y }; };

export function renderStatic(m, { flip = false, lite = false } = {}) {
  const th = THEMES[m.theme];
  const P_ = posFn(m, flip);
  for (const r of m.regions) { r.dx = flip ? W - r.x : r.x; r.dy = flip ? H - r.y : r.y; }
  const rnd = prng(hash(m.id));
  let out = `<svg class="board board-static theme-${m.theme}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><defs>${BOARD_DEFS}</defs>`;
  out += th.bg(rnd, m, lite);
  out += th.paths(m.edges, P_, rnd);
  // medal sockets
  for (const r of m.regions) for (let k = 0; k < r.medals; k++) {
    const x = r.dx + (k - (r.medals - 1) / 2) * 46;
    out += `<circle cx="${x}" cy="${r.dy + 2}" r="21" fill="#000" opacity=".35"/><circle cx="${x}" cy="${r.dy}" r="19" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>`;
  }
  for (const id in m.nodes) {
    const n = m.nodes[id], p = P_(id), nr = prng(hash(m.id + id));
    out += n.hq ? th.hq(p, n.hq, n) : n.special ? th.special(p, n.special, n, nr) : th.base(p, n, nr);
  }
  out += `<rect width="${W}" height="${H}" fill="url(#b-vignette)" pointer-events="none"/>`;
  return out + '</svg>';
}

function tokenSVG(s, nodeId, p, opts) {
  const st = s.stacks[nodeId];
  if (!st || !st.length) return '';
  const top = topOf(s, nodeId);
  const color = ownerOf(top), t = typeOf(top), c = TEAM[color];
  const depth = st.length;
  let under = '';
  for (let i = Math.min(depth - 1, 3); i >= 1; i--) {
    const below = st[st.length - 1 - i];
    under += R(p.x - 56 + i * 7, p.y - 56 + i * 7, 112, 112, 16, TEAM[ownerOf(below)].dark, 'v');
  }
  const fresh = opts.fresh?.has(nodeId) ? ' fresh' : '';
  return `<g class="stack" data-node="${nodeId}">
    <rect x="${p.x - 50}" y="${p.y - 44}" width="${112 + (depth - 1) * 7}" height="${112 + (depth - 1) * 7}" rx="16" fill="#000" opacity=".45" filter="url(#f-blur2)"/>
    ${under}
    <g transform="translate(${p.x} ${p.y})"><g class="token${fresh}">
      ${R(-56, -56, 112, 112, 16, c.main, 'v')}
      ${R(-49, -49, 98, 98, 11, shade(c.dark, -0.35), '')}
      ${R(-49, -49, 98, 98, 11, c.light, 's', 'opacity=".55"')}
      <rect x="-54" y="-54" width="108" height="108" rx="15" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
      <g class="bob t${t}"><g transform="translate(-47 -42) scale(.92)">${troopArtGroup(t, color)}</g></g>
      <g transform="translate(-46 -46)">${C(0, 0, 19, '#f3f5f8')}<circle r="19" fill="none" stroke="${c.dark}" stroke-width="3"/></g>
      <text x="-46" y="-37" text-anchor="middle" font-size="26" font-weight="900" fill="${c.dark}" font-family="Nunito, sans-serif">${t === 0 ? '★' : t}</text>
      ${depth > 1 ? `<g transform="translate(44 46)">${C(0, 0, 16, '#222', 'r')}<text y="7" text-anchor="middle" font-size="19" font-weight="800" fill="#fff" font-family="Nunito, sans-serif">${depth}</text></g>` : ''}
    </g></g></g>`;
}

export function renderDynamic(s, m, opts = {}) {
  const P_ = posFn(m, !!opts.flip);
  const flip = !!opts.flip;
  let out = `<svg class="board board-dyn" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  out += '<g class="medals">';
  m.regions.forEach((r, i) => {
    const rx = flip ? W - r.x : r.x, ry = flip ? H - r.y : r.y;
    const taken = s.taken[i];
    for (let k = 0; k < r.medals; k++) {
      const x = rx + (k - (r.medals - 1) / 2) * 46;
      if (taken) out += `<circle cx="${x}" cy="${ry}" r="17" fill="none" stroke="${TEAM[taken].main}" stroke-width="4" stroke-dasharray="6 5"/>`;
      else out += `<g class="medal" transform="translate(${x} ${ry})">${C(0, 0, 19, '#8a6414')}${C(0, -1, 16, '#f1c232')}
        <path d="M0 -10 l3 6 6.5 .8 -4.8 4.4 1.3 6.5 -6 -3.4 -6 3.4 1.3 -6.5 -4.8 -4.4 6.5 -.8z" fill="#fff3b8" opacity=".9"/></g>`;
    }
  });
  out += '</g>';
  if (opts.recent) for (const id of opts.recent) { const p = P_(id); out += `<g class="recent"><rect x="${p.x - 75}" y="${p.y - 75}" width="150" height="150" rx="26" fill="none" stroke="#ff9f1c" stroke-width="8"/></g>`; }
  out += '<g class="tokens">';
  for (const id in s.stacks) out += tokenSVG(s, id, P_(id), opts);
  out += '</g>';
  if (opts.highlight) {
    out += '<g class="hl">';
    for (const [id, kind] of opts.highlight) {
      const p = P_(id), size = m.nodes[id].hq ? HQ + 14 : BASE + 26;
      out += `<g class="hl-${kind}" data-node="${id}"><rect class="hl-ring" fill="none" x="${p.x - size / 2}" y="${p.y - size / 2}" width="${size}" height="${size}" rx="30"/></g>`;
    }
    out += '</g>';
  }
  if (opts.ghost) {
    const p = P_(opts.ghost.node), t = typeOf(opts.ghost.id), color = ownerOf(opts.ghost.id), c = TEAM[color];
    out += `<g class="ghost-token" transform="translate(${p.x} ${p.y})">${R(-56, -56, 112, 112, 16, c.main, 'v', 'stroke="#fff" stroke-width="6"')}
      <g class="bob t${t}"><g transform="translate(-47 -42) scale(.92)">${troopArtGroup(t, color)}</g></g></g>`;
  }
  out += '<g class="hits">';
  for (const id in m.nodes) {
    const p = P_(id), size = m.nodes[id].hq ? HQ + 20 : BASE + 30;
    out += `<rect class="hit" data-node="${id}" x="${p.x - size / 2}" y="${p.y - size / 2}" width="${size}" height="${size}" fill="transparent"/>`;
  }
  return out + '</g></svg>';
}

export function renderPreview(m) { return renderStatic(m, { lite: true }); }
