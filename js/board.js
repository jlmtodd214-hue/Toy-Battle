// SVG board renderer. Two layers:
//  - static: terrain art (textures, paths, bases, H.Q.) — rendered once per map/orientation
//  - dynamic: medals, troops, highlights and tap targets — re-rendered every update
import { TEAM, troopArtGroup } from './troops.js';
import { topOf, ownerOf, typeOf } from './engine.js';
import { shade, C, E, R, P } from './paint.js';

export const W = 1000, H = 1600;
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
const posFn = (m, flip) => (id) => { const n = m.nodes[id]; return flip ? { x: W - n.x, y: H - n.y } : { x: n.x, y: n.y }; };

// Terrain is a pre-rendered 3D image (tools/render); effect badges are drawn on top.
export function renderStatic(m, { flip = false, lite = false } = {}) {
  const P_ = posFn(m, flip);
  const src = lite ? `assets/boards/${m.id}-thumb.jpg` : `assets/boards/${m.id}-${flip ? 'b' : 'r'}.jpg`;
  let out = `<svg class="board board-static theme-${m.theme}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><defs>${BOARD_DEFS}</defs>`;
  out += `<image href="${src}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none"/>`;
  if (!lite) {
    for (const id in m.nodes) {
      const n = m.nodes[id], p = P_(id);
      if (n.special && n.special !== 'restrict') out += badge(p.x + 58, p.y + 54, n.special);
      if (n.allow) out += allowTag(p.x, p.y + (n.hq ? 96 : 84), n.allow);
    }
    out += `<rect width="${W}" height="${H}" fill="url(#b-vignette)" pointer-events="none"/>`;
  }
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
      else out += `<image class="medal" href="assets/medal.png" x="${x - 23}" y="${ry - 23}" width="46" height="46"/>`;
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
