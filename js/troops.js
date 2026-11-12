import { shade, C, E, R, P, box, bead } from './paint.js';
// Original toy characters. All art is inline SVG (viewBox 0 0 100 100), tinted by team.
export const TEAM = {
  red: { main: '#e5484d', dark: '#9b1c22', light: '#ffb3b5', name: 'Red' },
  blue: { main: '#3b7dd8', dark: '#173f7a', light: '#b6d4ff', name: 'Blue' },
};

export const TROOPS = {
  0: { name: 'Bop', title: 'Jack-in-the-Box', quote: 'Surprise!', effect: 'No effect. As a joker, Bop may be placed on top of any enemy Troop, and any enemy Troop may cover it.' },
  1: { name: 'Tinker', title: 'Wind-up Mouse', quote: 'Wind me up and watch me go!', effect: 'You may draw 2 Troops from your reserve and place them on your rack. (Only 1 if you already have 7.)' },
  2: { name: 'Rumble', title: 'Tin Drummer', quote: 'Fall in, troops!', effect: 'You may place 1 extra Troop on the Terrain and apply its effect. (Troop effects resolve first, then special base effects.)' },
  3: { name: 'Bricks', title: 'Block Golem', quote: 'Me smash. Gently.', effect: 'You may choose 1 visible enemy Troop adjacent to Bricks (one path away) and discard it face up.' },
  4: { name: 'Zip', title: 'Paper-Plane Ace', quote: 'Over the lines we go!', effect: 'You may ignore the connection rule and place Zip on any base. (To land on the enemy H.Q., which is not a base, Zip must be connected.)' },
  5: { name: 'Mags', title: 'Horseshoe Magnet', quote: 'Come to Mags!', effect: 'You may take, at random, 1 Troop from your opponent\'s rack and discard it face up.' },
  6: { name: 'Cuddles', title: 'Teddy Medic', quote: 'Group hug!', effect: 'You may draw 1 Troop from your reserve and place it on your rack.' },
  7: { name: 'Titan', title: 'Toy Mech', quote: 'Stomp mode: ON.', effect: 'No effect.' },
};

const SKIN = '#f0c39b', STEEL = '#b9c2cb', GOLD = '#e0a82e', WOOD = '#b98348', INK = '#1b1b1b';
const shadow = `<ellipse cx="50" cy="96" rx="33" ry="4.5" fill="#000" opacity=".32" filter="url(#f-blur2)"/>`;
const eyes = (x1, x2, y, r) => `<g class="eyes">${bead(x1, y, r)}${bead(x2, y, r)}</g>`;
const cheeks = (x1, x2, y) => `<circle cx="${x1}" cy="${y}" r="3" fill="#ff7b7b" opacity=".45" filter="url(#f-blur2)"/><circle cx="${x2}" cy="${y}" r="3" fill="#ff7b7b" opacity=".45" filter="url(#f-blur2)"/>`;
const stud = (cx, cy, c) => `${R(cx - 3.6, cy - 1.5, 7.2, 3.2, 0, shade(c, -0.1), 'h')}${E(cx, cy - 1.5, 3.6, 1.6, shade(c, 0.35), '')}`;

const ART = {
  // Jack-in-the-box: lacquered wood box, steel spring, painted wooden head.
  0: (c) => `${shadow}
    ${R(80, 71, 9, 3, 1.5, STEEL, 'v')}${C(92, 72, 4.2, '#8b2b20')}
    ${box(22, 62, 52, 32, 8, c.main)}
    <rect x="26" y="66" width="44" height="24" rx="2" fill="none" stroke="${shade(c.main, -0.35)}" stroke-width="1.2" opacity=".8"/>
    ${P('M48 70 l3 6.2 6.8 .8 -5 4.6 1.4 6.7 -6.2 -3.5 -6.2 3.5 1.4 -6.7 -5 -4.6 6.8 -.8z', GOLD, 'r')}
    <g class="part-spring">
      ${[0, 1, 2, 3, 4, 5].map((i) => `<ellipse cx="50" cy="${60 - i * 4}" rx="9" ry="2.4" fill="none" stroke="#6f7881" stroke-width="2.8"/><ellipse cx="50" cy="${59.4 - i * 4}" rx="9" ry="2.2" fill="none" stroke="#e8edf2" stroke-width="1" stroke-dasharray="6 22"/>`).join('')}
      <g class="part-head">
        ${C(50, 28, 15, SKIN)}
        ${eyes(44.5, 55.5, 27, 2.6)}${cheeks(39, 61, 32)}
        <path d="M44 33 Q50 38 56 33" fill="none" stroke="#9c2a2a" stroke-width="1.6" stroke-linecap="round"/>
        ${P('M34.5 22 Q36 6 50 5 Q64 6 65.5 22 Z', c.main, 'v')}
        ${R(33.5, 19.5, 33, 5.5, 2.7, shade(c.main, -0.25), 'v')}
        <g filter="url(#f-fur)">${C(50, 5, 5, '#f5f1e8')}</g>
      </g>
    </g>`,

  // Tin wind-up mouse.
  1: (c) => `${shadow}
    <path d="M22 80 Q6 78 8 64 Q9 56 15 58" fill="none" stroke="#6b5a55" stroke-width="2" stroke-linecap="round"/>
    ${C(35, 91, 5, '#262626')}${C(65, 91, 5, '#262626')}
    <g class="part-key">${R(78, 72, 9, 4, 1, GOLD, 'v')}${E(91, 66, 4.2, 6.5, GOLD)}${E(91, 80, 4.2, 6.5, GOLD)}${C(88, 74, 2.6, shade(GOLD, -0.2))}</g>
    ${E(50, 74, 30, 18, '#a7b0ba')}
    ${P('M21 70 Q50 63 79 70 L79 78 Q50 71 21 78 Z', c.main, 'v')}
    <path d="M24 82 Q50 88 76 82" fill="none" stroke="#7d8791" stroke-width="1"/>
    ${[30, 40, 50, 60, 70].map((x) => `<circle cx="${x}" cy="${x === 50 ? 64 : 65}" r="1" fill="#e6ebf0"/>`).join('')}
    <g class="part-head">
      ${C(30, 33, 12, '#a7b0ba')}${C(30, 33, 7, '#f0a7b8', 's')}
      ${C(70, 33, 12, '#a7b0ba')}${C(70, 33, 7, '#f0a7b8', 's')}
      ${E(50, 49, 20, 17, '#b5bec7')}
      ${E(50, 57, 9, 7, '#c8d0d7')}
      ${C(50, 55, 3.3, '#d94f7f')}
      ${eyes(42.5, 57.5, 46, 3.2)}
      <path d="M41 57 h-12 M41 59.5 l-11 3 M59 57 h12 M59 59.5 l11 3" stroke="#3b3b3b" stroke-width=".7"/>
    </g>`,

  // Tin drummer soldier.
  2: (c) => `${shadow}
    <g class="part-arm"><path d="M25 62 L9 43" stroke="${WOOD}" stroke-width="3" stroke-linecap="round"/>${C(9, 43, 3, shade(WOOD, 0.2))}${C(25, 62, 4.2, SKIN)}</g>
    <g class="part-arm2"><path d="M75 62 L91 43" stroke="${WOOD}" stroke-width="3" stroke-linecap="round"/>${C(91, 43, 3, shade(WOOD, 0.2))}${C(75, 62, 4.2, SKIN)}</g>
    ${R(33, 46, 34, 30, 6, c.main)}
    <path d="M35 47 L65 74 M65 47 L35 74" stroke="#f3efe6" stroke-width="3.2"/>
    ${[52, 60, 68].map((y) => C(50, y, 1.6, GOLD)).join('')}
    ${R(36, 44, 28, 4, 2, GOLD, 'v')}
    <g class="part-head">
      ${C(50, 36, 10, SKIN)}${eyes(46, 54, 35.5, 1.8)}${cheeks(43, 57, 39)}
      <path d="M47 40.5 Q50 42.5 53 40.5" fill="none" stroke="#9c2a2a" stroke-width="1.1" stroke-linecap="round"/>
      ${R(38.5, 7, 23, 21, 3, '#202020', 'h')}${R(37.5, 24, 25, 4, 2, '#111', 'v')}
      ${P('M50 12 l5 2.5 v5 l-5 3 -5 -3 v-5z', GOLD, 'r')}
      ${E(50, 5, 4, 6.5, c.main)}
      <path d="M41 28 Q50 46 59 28" fill="none" stroke="${GOLD}" stroke-width="1"/>
    </g>
    ${R(26, 71, 48, 18, 0, '#f3efe6', 'h')}
    <path d="M27 73 L35 87 L43 73 L51 87 L59 73 L67 87 L73 76" fill="none" stroke="${GOLD}" stroke-width="1.4"/>
    ${E(50, 89, 24, 5.5, shade(c.main, -0.15), 'h')}
    ${E(50, 71, 24, 6, '#efe5cf')}
    <ellipse cx="50" cy="71" rx="24" ry="6" fill="none" stroke="${c.main}" stroke-width="3"/>`,

  // Interlocking-brick golem.
  3: (c) => `${shadow}
    ${box(28, 79, 18, 15, 4, '#6e48b8')}${box(52, 79, 18, 15, 4, '#f08a00')}
    <g class="part-arm">${box(6, 49, 16, 16, 4, '#f2c11a')}${stud(12, 47, '#f2c11a')}${stud(18, 47, '#f2c11a')}</g>
    ${box(24, 46, 48, 33, 6, c.main)}
    ${[34, 46, 58, 70].map((x) => stud(x - 2, 42, c.main)).join('')}
    <g class="part-arm2">${box(78, 49, 16, 16, 4, '#3d9a45')}${stud(84, 47, '#3d9a45')}${stud(90, 47, '#3d9a45')}</g>
    <g class="part-head">
      ${box(32, 14, 32, 26, 6, '#f2c11a')}${stud(41, 10, '#f2c11a')}${stud(56, 10, '#f2c11a')}
      ${eyes(42, 54, 25, 3)}
      <path d="M37.5 19 l8 3 M58.5 19 l-8 3" stroke="#2a2a2a" stroke-width="2.2" stroke-linecap="round"/>
      ${R(41, 31, 14, 3.5, 1.7, '#3a2a12', '')}
    </g>`,

  // Folded paper plane with a peg-doll pilot.
  4: (c) => `<g class="part-fly">
    <ellipse cx="54" cy="94" rx="30" ry="4" fill="#000" opacity=".22" filter="url(#f-blur2)"/>
    ${P('M6 58 L96 30 L52 61 Z', '#fbfaf5', 'v')}
    <g class="part-head">
      ${C(46, 45, 9, SKIN)}
      ${P('M36.5 45 Q36 33 46 32 Q56 33 55.5 45 L53 45 Q52 39 46 39 Q40 39 39 45 Z', '#7a4a24', 'v')}
      ${E(38.5, 47, 2.6, 4.5, '#6a3f1e', '')}${E(53.5, 47, 2.6, 4.5, '#6a3f1e', '')}
      ${C(42, 38.5, 3.2, '#9ad6ee')}${C(50, 38.5, 3.2, '#9ad6ee')}
      <circle cx="42" cy="38.5" r="3.2" fill="none" stroke="${GOLD}" stroke-width="1.2"/><circle cx="50" cy="38.5" r="3.2" fill="none" stroke="${GOLD}" stroke-width="1.2"/>
      ${eyes(43, 49, 45.5, 1.7)}
      <path d="M43.5 50 Q46 51.6 48.5 50" fill="none" stroke="#9c2a2a" stroke-width="1" stroke-linecap="round"/>
      <g class="part-scarf">${P('M38 53 Q26 50 14 56 Q24 57 30 60 Q34 57 40 57 Z', c.main, 'v')}</g>
    </g>
    ${P('M6 58 L52 61 L44 77 Z', '#cdc8bb', 'v')}
    ${P('M52 61 L96 30 L44 77 Z', '#e4dfd2', 'v')}
    <path d="M96 30 L48 68" stroke="#bdb7a8" stroke-width=".8"/>
  </g>`,

  // Painted horseshoe magnet.
  5: (c) => `${shadow}
    <g class="part-spark" filter="url(#f-glow)"><path d="M10 22 l6 6 M5 36 h8 M90 22 l-6 6 M95 36 h-8" stroke="#ffe27a" stroke-width="2" stroke-linecap="round"/></g>
    ${P('M20 90 V46 a30 30 0 0 1 60 0 V90 H62 V46 a12 12 0 0 0 -24 0 V90 Z', c.main, 'r')}
    ${P('M20 90 V46 a30 30 0 0 1 60 0 V90 H62 V46 a12 12 0 0 0 -24 0 V90 Z', 'transparent', 'h')}
    ${R(20, 76, 18, 16, 1, STEEL, 'v')}${R(62, 76, 18, 16, 1, STEEL, 'v')}
    ${P('M66 70 l6 -3.5 6 3.5 v7 l-6 3.5 -6 -3.5z', '#8f99a3', 'r')}
    <g class="part-head">
      ${eyes(40, 60, 26, 3.6)}
      <path d="M43 35 Q50 40 57 35" fill="none" stroke="#2a1010" stroke-width="1.8" stroke-linecap="round"/>
    </g>
    <path d="M27 40 Q29 27 40 21" fill="none" stroke="#fff" stroke-width="2.4" opacity=".5" stroke-linecap="round"/>`,

  // Plush teddy medic.
  6: (c) => {
    const FUR = '#a8713f', LT = '#e3c49b';
    return `${shadow}<g filter="url(#f-fur)">
    <g class="part-arm">${E(18, 62, 9, 13, FUR)}</g>
    <g class="part-arm2">${E(82, 62, 9, 13, FUR)}</g>
    ${E(35, 89, 10, 7, FUR)}${E(65, 89, 10, 7, FUR)}
    ${E(35, 90, 5.5, 4, LT, 's')}${E(65, 90, 5.5, 4, LT, 's')}
    ${E(50, 70, 26, 23, FUR)}
    ${E(50, 74, 15, 13, LT, 's')}
    </g>
    <path d="M50 62 V86" stroke="#7a4f2a" stroke-width=".9" stroke-dasharray="2 2"/>
    ${C(50, 75, 6.5, '#f7f4ee')}<path d="M50 71 v8 M46 75 h8" stroke="${c.main}" stroke-width="3"/>
    ${P('M33 52 Q50 60 67 52 L66 57 Q50 64 34 57 Z', c.main, 'v')}
    <g class="part-head"><g filter="url(#f-fur)">
      ${C(28, 16, 9, FUR)}${C(28, 16, 5, LT, 's')}${C(72, 16, 9, FUR)}${C(72, 16, 5, LT, 's')}
      ${C(50, 32, 21, '#b17a46')}
      ${E(50, 40, 9.5, 7.5, LT, 's')}
    </g>
      ${E(50, 37, 3.8, 2.7, INK)}
      ${eyes(41, 59, 28, 3.3)}
      <path d="M50 40 v3 M46.5 44 Q50 46 53.5 44" fill="none" stroke="#3b2414" stroke-width="1" stroke-linecap="round"/>
      ${R(62, 31, 11, 4.5, 1.5, '#f2ece0', 'v', 'transform="rotate(28 67 33)"')}
    </g>`;
  },

  // Painted toy mech.
  7: (c) => `${shadow}
    ${R(28, 78, 15, 14, 3, '#7c8691', 'h')}${R(57, 78, 15, 14, 3, '#7c8691', 'h')}
    ${R(23, 89, 24, 7, 2, '#4a525a', 'v')}${R(53, 89, 24, 7, 2, '#4a525a', 'v')}
    <g class="part-arm">${R(4, 44, 16, 30, 6, c.main, 'h')}${R(2, 72, 20, 12, 3, STEEL, 'v')}${C(13, 44, 8, STEEL)}</g>
    <g class="part-arm2">${R(80, 44, 16, 30, 6, c.main, 'h')}${R(78, 72, 20, 12, 3, STEEL, 'v')}${C(87, 44, 8, STEEL)}</g>
    ${box(20, 42, 56, 36, 5, '#98a2ac')}
    ${R(27, 48, 42, 22, 4, c.main, 'v')}
    ${R(32, 53, 32, 12, 3, '#1d2833', 'v')}
    <g filter="url(#f-glow)"><circle cx="40" cy="59" r="2.6" fill="#ffd34d" class="part-light"/><circle cx="48" cy="59" r="2.6" fill="#4ade80" class="part-light2"/><circle cx="56" cy="59" r="2.6" fill="#ff5c7a" class="part-light"/></g>
    <g class="part-head">
      <path d="M50 3 V12" stroke="#4a525a" stroke-width="2.2"/><g class="part-light2">${C(50, 3, 3.4, '#e5484d')}</g>
      ${box(29, 14, 36, 25, 5, c.main)}
      ${R(33, 20, 28, 11, 5.5, '#122030', 'v')}
      <g filter="url(#f-glow)"><rect x="37" y="23.5" width="8" height="4" rx="2" fill="#7df9ff" class="visor"/><rect x="49" y="23.5" width="8" height="4" rx="2" fill="#7df9ff" class="visor"/></g>
    </g>`,
};

export function troopArt(type, color, cls = '') {
  const c = TEAM[color];
  return `<svg class="troop-art t${type} ${cls}" viewBox="-6 -12 112 112" aria-hidden="true">${ART[type](c)}</svg>`;
}

// Raw SVG group (for embedding inside the board SVG).
export function troopArtGroup(type, color) {
  return ART[type](TEAM[color]);
}

// Small effect icons (viewBox 0 0 24 24).
const ICON = {
  0: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" fill="#ffd34d" stroke="#1d1d1d" stroke-width="1.5"/>',
  1: '<rect x="3" y="6" width="9" height="13" rx="2" fill="#fff" stroke="#1d1d1d" stroke-width="1.5"/><rect x="7" y="4" width="9" height="13" rx="2" fill="#fff" stroke="#1d1d1d" stroke-width="1.5"/><text x="18.5" y="22" font-size="9" font-weight="900" text-anchor="middle" fill="#1d1d1d">+2</text>',
  2: '<rect x="4" y="9" width="9" height="12" rx="2" fill="#fff" stroke="#1d1d1d" stroke-width="1.5"/><path d="M17 3v10M12 8h10" stroke="#1d1d1d" stroke-width="2.5" stroke-linecap="round"/>',
  3: '<rect x="4" y="5" width="13" height="15" rx="2" fill="#fff" stroke="#1d1d1d" stroke-width="1.5"/><path d="M7 9l7 7M14 9l-7 7" stroke="#e5484d" stroke-width="2.5" stroke-linecap="round"/><circle cx="20" cy="12.5" r="2" fill="#1d1d1d"/>',
  4: '<path d="M2 13L22 5l-9 15-3-6z" fill="#fff" stroke="#1d1d1d" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 14L22 5" stroke="#1d1d1d" stroke-width="1.2"/>',
  5: '<path d="M4 4v8a6 6 0 0 0 12 0V4h-4v8a2 2 0 0 1-4 0V4z" fill="#e5484d" stroke="#1d1d1d" stroke-width="1.5"/><path d="M15 15l6 6M21 15l-6 6" stroke="#1d1d1d" stroke-width="2.2" stroke-linecap="round"/>',
  6: '<rect x="5" y="5" width="11" height="15" rx="2" fill="#fff" stroke="#1d1d1d" stroke-width="1.5"/><text x="19" y="22" font-size="9" font-weight="900" text-anchor="middle" fill="#1d1d1d">+1</text>',
  7: '<path d="M6 20V9l6-5 6 5v11z" fill="#9aa3ad" stroke="#1d1d1d" stroke-width="1.5"/>',
};
export const effectIcon = (t) => `<svg viewBox="0 0 24 24" class="fx-icon">${ICON[t]}</svg>`;
export const effectIconInner = (t) => ICON[t];

// A full card as HTML.
export function cardHTML(id, { count = 1, locked = false, extraClass = '' } = {}) {
  const t = +id[1];
  const color = id[0] === 'r' ? 'red' : 'blue';
  const tr = TROOPS[t];
  return `
  <div class="card ${color} ${locked ? 'locked' : ''} ${extraClass}" data-id="${id}" data-type="${t}">
    <div class="card-badge">${t === 0 ? '★' : t}</div>
    <div class="card-art">${troopArt(t, color, 'idle')}</div>
    <div class="card-name">${tr.name}</div>
    <div class="card-fx">${effectIcon(t)}</div>
    ${count > 1 ? `<div class="card-count">×${count}</div>` : ''}
    ${locked ? '<div class="card-lock">📌</div>' : ''}
  </div>`;
}

export function cardBackHTML(color, locked = false, idx = -1) {
  return `<div class="card-back ${color} ${locked ? 'locked' : ''}" data-index="${idx}"><span>${color === 'red' ? '♦' : '♣'}</span></div>`;
}
