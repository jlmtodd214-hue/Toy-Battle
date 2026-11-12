// SVG board renderer. Two layers:
//  - static: terrain art (textures, paths, bases, H.Q.) — rendered once per map/orientation
//  - dynamic: medals, troops, highlights and tap targets — re-rendered every update
import { TEAM } from './troops.js';
import { topOf, ownerOf, typeOf } from './engine.js';
import { C, P } from './paint.js';
import { LAYOUT } from './layout.js';

// Image space of the rendered boards (square; see tools/render).
export const W = 1600, H = 1600;
const BASE = 128, HQ = 176;

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

// ------------------------------------------------------------------ rendering
// Node positions on the angled renders: [x, y, scaleX, scaleY] in the 1000 x 1600 image space.
const lay = (m, flip) => LAYOUT[m.id][flip ? 'b' : 'r'];

// Terrain is a pre-rendered 3D image (tools/render); effect badges are drawn on top.
export function renderStatic(m, { flip = false, lite = false } = {}) {
  const L = lay(m, flip);
  const src = lite ? `assets/boards/${m.id}-thumb.jpg` : `assets/boards/${m.id}-${flip ? 'b' : 'r'}.jpg`;
  let out = `<svg class="board board-static theme-${m.theme}" viewBox="0 0 ${W} ${H}" ${lite ? 'preserveAspectRatio="xMidYMid slice"' : ''} xmlns="http://www.w3.org/2000/svg"><defs>${BOARD_DEFS}</defs>`;
  out += `<image href="${src}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none"/>`;
  if (!lite) {
    for (const id in m.nodes) {
      const n = m.nodes[id], [x, y, sx, sy] = L.nodes[id];
      if (n.special && n.special !== 'restrict') out += `<g transform="translate(${x + 60 * sx} ${y + 50 * sy}) scale(${sx})">${badge(0, 0, n.special)}</g>`;
      if (n.allow) out += `<g transform="translate(${x} ${y + (n.hq ? 92 : 80) * sy}) scale(${sx})">${allowTag(0, 0, n.allow)}</g>`;
    }
  }
  return out + '</svg>';
}

// A troop stands on its base as a 3D figure; covered troops show as stacked discs.
function tokenSVG(s, nodeId, [x, y, sx, sy], opts) {
  const st = s.stacks[nodeId];
  if (!st || !st.length) return '';
  const top = topOf(s, nodeId);
  const color = ownerOf(top), t = typeOf(top), c = TEAM[color];
  const depth = st.length, k = sx;
  let discs = '';
  const n = Math.min(depth, 4);
  for (let i = n - 1; i >= 0; i--) {
    const id = st[st.length - 1 - i], tc = TEAM[ownerOf(id)];
    discs += `<ellipse cx="0" cy="${i * 9 * sy}" rx="${56 * sx}" ry="${56 * sy}" fill="${i ? tc.dark : tc.main}" stroke="${i ? '#0008' : '#fff'}" stroke-width="${i ? 2 : 4}"/>`;
  }
  const fresh = opts.fresh?.has(nodeId) ? ' fresh' : '';
  return `<g class="stack" data-node="${nodeId}" transform="translate(${x} ${y})">
    <ellipse cx="${6 * sx}" cy="${(10 + (n - 1) * 9) * sy}" rx="${62 * sx}" ry="${60 * sy}" fill="#000" opacity=".35" filter="url(#f-blur2)"/>
    ${discs}
    <ellipse cx="0" cy="0" rx="${42 * sx}" ry="${42 * sy}" fill="${c.light}" opacity=".35"/>
    <g class="token${fresh}"><g class="bob t${t}">
      <image href="assets/troops/${t}-${color}.png" x="${-110 * k}" y="${-186 * k}" width="${220 * k}" height="${220 * k}"/>
    </g></g>
    <g transform="translate(${-66 * k} ${-140 * k}) scale(${k})">
      ${C(0, 0, 21, c.main)}<circle r="21" fill="none" stroke="#fff" stroke-width="3.5"/>
      <text y="9" text-anchor="middle" font-size="26" font-weight="900" fill="#fff" stroke="${c.dark}" stroke-width="1.5" font-family="'Lilita One', Nunito, sans-serif">${t === 0 ? '★' : t}</text>
    </g>
    ${depth > 1 ? `<g transform="translate(${64 * k} ${-134 * k}) scale(${k})">${C(0, 0, 16, '#222', 'r')}<text y="6.5" text-anchor="middle" font-size="18" font-weight="800" fill="#fff" font-family="Nunito, sans-serif">×${depth}</text></g>` : ''}
  </g>`;
}

export function renderDynamic(s, m, opts = {}) {
  const L = lay(m, !!opts.flip);
  let out = `<svg class="board board-dyn" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  out += '<g class="medals">';
  m.regions.forEach((r, i) => {
    const taken = s.taken[i];
    for (const [x, y, k] of L.medals[i]) {
      if (taken) out += `<ellipse cx="${x}" cy="${y}" rx="${17 * k}" ry="${12 * k}" fill="none" stroke="${TEAM[taken].main}" stroke-width="${4 * k}" stroke-dasharray="${6 * k} ${5 * k}"/>`;
      else out += `<image class="medal" href="assets/medal.png" x="${x - 26 * k}" y="${y - 30 * k}" width="${52 * k}" height="${52 * k}"/>`;
    }
  });
  out += '</g>';
  const ring = (id, rpx, cls, extra = '') => { const [x, y, sx, sy] = L.nodes[id]; return `<ellipse class="${cls}" cx="${x}" cy="${y}" rx="${rpx * sx}" ry="${rpx * sy}" fill="none" ${extra}/>`; };
  if (opts.recent) for (const id of opts.recent) out += `<g class="recent">${ring(id, 82, '', 'stroke="#ff9f1c" stroke-width="8"')}</g>`;
  if (opts.highlight) {
    out += '<g class="hl">';
    for (const [id, kind] of opts.highlight) out += `<g class="hl-${kind}" data-node="${id}">${ring(id, m.nodes[id].hq ? 104 : 80, 'hl-ring')}</g>`;
    out += '</g>';
  }
  // troops, far to near so nearer figures overlap farther ones
  const ids = Object.keys(s.stacks).filter((id) => s.stacks[id].length).sort((a, b) => L.nodes[a][1] - L.nodes[b][1]);
  out += '<g class="tokens">';
  for (const id of ids) out += tokenSVG(s, id, L.nodes[id], opts);
  out += '</g>';
  if (opts.ghost) {
    const [x, y, sx, sy] = L.nodes[opts.ghost.node], t = typeOf(opts.ghost.id), color = ownerOf(opts.ghost.id), c = TEAM[color];
    out += `<g class="ghost-token" transform="translate(${x} ${y})"><ellipse rx="${56 * sx}" ry="${56 * sy}" fill="${c.main}" stroke="#fff" stroke-width="5"/>
      <g class="bob t${t}"><image href="assets/troops/${t}-${color}.png" x="${-110 * sx}" y="${-186 * sx}" width="${220 * sx}" height="${220 * sx}"/></g></g>`;
  }
  // tap targets: base footprint plus the space a standing figure occupies, nearest on top
  out += '<g class="hits">';
  for (const id of Object.keys(m.nodes).sort((a, b) => L.nodes[a][1] - L.nodes[b][1])) {
    const [x, y, sx, sy] = L.nodes[id], w = (m.nodes[id].hq ? 190 : 150) * sx, up = 150 * sx, down = 75 * sy;
    out += `<rect class="hit" data-node="${id}" x="${x - w / 2}" y="${y - up}" width="${w}" height="${up + down}" fill="transparent"/>`;
  }
  return out + '</g></svg>';
}

// Bounding box (image space) of everything that matters: bases, H.Q. and standing troops.
export function contentBox(m, flip) {
  const L = lay(m, flip);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const id in L.nodes) {
    const [x, y, sx, sy] = L.nodes[id], hq = m.nodes[id].hq, r = (hq ? 110 : 88) * sx;
    x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r);
    y0 = Math.min(y0, y - (hq ? 150 : 200) * sx); y1 = Math.max(y1, y + (hq ? 105 : 85) * sy);
  }
  return { x0, x1, y0, y1 };
}

export function renderPreview(m) { return renderStatic(m, { lite: true }); }
