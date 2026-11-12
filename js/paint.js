// Shared SVG "materials": shading overlays, filters and shape helpers that give
// flat shapes a lit, toy-like 3D look. Global defs are injected once into the page.

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

// overlay kinds: r = sphere-ish, v = top-lit, h = cylinder, s = soft
const ovl = (k) => `fill="url(#ov-${k})"`;
export const C = (cx, cy, r, c, k = 'r', extra = '') =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" ${extra}/>${k ? `<circle cx="${cx}" cy="${cy}" r="${r}" ${ovl(k)}/>` : ''}`;
export const E = (cx, cy, rx, ry, c, k = 'r', extra = '') =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c}" ${extra}/>${k ? `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${ovl(k)}/>` : ''}`;
export const R = (x, y, w, h, rx, c, k = 'v', extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${c}" ${extra}/>${k ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ${ovl(k)}/>` : ''}`;
export const P = (d, c, k = 'v', extra = '') =>
  `<path d="${d}" fill="${c}" ${extra}/>${k ? `<path d="${d}" ${ovl(k)}/>` : ''}`;

// An extruded block seen slightly from above-right.
export function box(x, y, w, h, d, c, k = 'v') {
  return `<path d="M${x} ${y} l${d} ${-d} h${w} l${-d} ${d}z" fill="${shade(c, 0.28)}"/>
    <path d="M${x + w} ${y} l${d} ${-d} v${h} l${-d} ${d}z" fill="${shade(c, -0.32)}"/>
    ${R(x, y, w, h, 1.5, c, k)}`;
}

// Glossy painted bead eye.
export const bead = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#161616"/>
  <circle cx="${x}" cy="${y}" r="${r}" fill="url(#ov-r)"/>
  <circle cx="${x - r * 0.35}" cy="${y - r * 0.38}" r="${r * 0.32}" fill="#fff" opacity=".95"/>
  <circle cx="${x + r * 0.35}" cy="${y + r * 0.35}" r="${r * 0.14}" fill="#fff" opacity=".6"/>`;

export const DEFS = `
  <radialGradient id="ov-r" cx=".34" cy=".28" r=".85">
    <stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".22" stop-color="#fff" stop-opacity=".12"/>
    <stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>
  <linearGradient id="ov-v" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".35" stop-color="#fff" stop-opacity=".05"/>
    <stop offset=".75" stop-color="#000" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></linearGradient>
  <linearGradient id="ov-h" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#000" stop-opacity=".4"/><stop offset=".25" stop-color="#fff" stop-opacity=".35"/>
    <stop offset=".45" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
  <radialGradient id="ov-s" cx=".5" cy=".35" r=".75">
    <stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient>
  <filter id="f-ds" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.3" flood-color="#000" flood-opacity=".4"/></filter>
  <filter id="f-blur2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
  <filter id="f-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="f-fur" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="2.6" xChannelSelector="R" yChannelSelector="G"/></filter>`;

export function ensureDefs() {
  if (typeof document === 'undefined' || document.getElementById('paint-defs')) return;
  const holder = document.createElement('div');
  holder.innerHTML = `<svg id="paint-defs" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs>${DEFS}</defs></svg>`;
  document.body.prepend(holder.firstElementChild);
}
ensureDefs();
