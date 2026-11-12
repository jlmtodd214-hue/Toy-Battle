import { shade, C, E, R, P, box, bead } from './paint.js';
// Original toy characters. All art is inline SVG (viewBox 0 0 100 100), tinted by team.
export const TEAM = {
  red: { main: '#e5484d', dark: '#9b1c22', light: '#ffb3b5', name: 'Red' },
  blue: { main: '#3b7dd8', dark: '#173f7a', light: '#b6d4ff', name: 'Blue' },
};

export const TROOPS = {
  0: { name: 'Bop', title: 'Jack-in-the-Box', quote: 'Surprise!', effect: 'No effect. As a joker, Bop may be placed on top of any enemy Troop, and any enemy Troop may cover it.' },
  1: { name: 'Rattles', title: 'Skeleton Warrior', quote: 'I have a bone to pick!', effect: 'You may draw 2 Troops from your reserve and place them on your rack. (Only 1 if you already have 7.)' },
  2: { name: 'Rumble', title: 'Tin Drummer', quote: 'Fall in, troops!', effect: 'You may place 1 extra Troop on the Terrain and apply its effect. (Troop effects resolve first, then special base effects.)' },
  3: { name: 'Cosmo', title: 'Toy Astronaut', quote: 'One small step for toys!', effect: 'You may choose 1 visible enemy Troop adjacent to Cosmo (one path away) and discard it face up.' },
  4: { name: 'Dusty', title: 'Toy Cowboy', quote: 'Yee-haw, over the fence!', effect: 'You may ignore the connection rule and place Dusty on any base. (To land on the enemy H.Q., which is not a base, Dusty must be connected.)' },
  5: { name: 'Volt', title: 'Combat Robot', quote: 'Target locked.', effect: 'You may take, at random, 1 Troop from your opponent\'s rack and discard it face up.' },
  6: { name: 'Cuddles', title: 'Teddy Medic', quote: 'Group hug!', effect: 'You may draw 1 Troop from your reserve and place it on your rack.' },
  7: { name: 'Treads', title: 'Wind-up Tank', quote: 'Rolling out!', effect: 'No effect.' },
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

  // Toy skeleton warrior with sword and shield.
  1: (c) => {
    const BONE = '#ece4cf', BD = '#b9ae92';
    const bone = (x1, y1, x2, y2, w = 4) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${BD}" stroke-width="${w + 1.5}" stroke-linecap="round"/><path d="M${x1} ${y1} L${x2} ${y2}" stroke="${BONE}" stroke-width="${w}" stroke-linecap="round"/>`;
    return `${shadow}
    ${bone(43, 72, 40, 92)}${bone(57, 72, 60, 92)}
    ${E(38, 93, 6, 3, BONE)}${E(62, 93, 6, 3, BONE)}
    ${P('M38 66 Q50 60 62 66 L60 74 Q50 70 40 74 Z', BONE, 'v')}
    ${R(48, 44, 4, 24, 2, BONE, 'h')}
    ${[48, 53, 58].map((y) => `<path d="M38 ${y} Q50 ${y - 5} 62 ${y}" fill="none" stroke="${BD}" stroke-width="4.5" stroke-linecap="round"/><path d="M38 ${y} Q50 ${y - 5} 62 ${y}" fill="none" stroke="${BONE}" stroke-width="3" stroke-linecap="round"/>`).join('')}
    <g class="part-arm">${bone(38, 46, 26, 62)}
      ${C(20, 62, 15, c.main)}${C(20, 62, 10, shade(c.main, -0.2), 's')}${C(20, 62, 4, GOLD)}
      <circle cx="20" cy="62" r="15" fill="none" stroke="${GOLD}" stroke-width="2"/></g>
    <g class="part-arm2">${bone(62, 46, 76, 60)}
      ${P('M80 58 L92 14 L95 15 L84 59 Z', STEEL, 'h')}
      ${R(73, 56, 16, 4, 2, GOLD, 'v', 'transform="rotate(-15 81 58)"')}${C(78, 64, 3, '#7a4a24')}</g>
    <g class="part-head">
      ${C(50, 27, 14, BONE)}${R(43, 34, 14, 9, 4, BONE, 'v')}
      ${E(44.5, 27, 4.2, 4.8, '#1b1b1b', '')}${E(55.5, 27, 4.2, 4.8, '#1b1b1b', '')}
      <g class="eyes"><circle cx="44.5" cy="27.5" r="1.6" fill="${c.light}" filter="url(#f-glow)"/><circle cx="55.5" cy="27.5" r="1.6" fill="${c.light}" filter="url(#f-glow)"/></g>
      <path d="M50 31 l-2 4 h4 z" fill="#1b1b1b"/>
      <path d="M45 39.5 h10 M47 37.5 v4 M50 37.5 v4 M53 37.5 v4" stroke="#6f6650" stroke-width="1"/>
      ${P('M35 24 Q36 9 50 8 Q64 9 65 24 L60 22 Q50 18 40 22 Z', c.main, 'v')}
      ${P('M48 9 Q50 0 52 9 Z', c.light, 'v')}${R(46, 3, 8, 10, 3, shade(c.main, 0.2), 'h')}
    </g>`;
  },
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

  // Toy astronaut with mirrored visor and ray gun.
  3: (c) => {
    const SUIT = '#eef1f4';
    return `${shadow}
    ${R(18, 40, 64, 30, 10, '#c9cfd6', 'h')}
    ${R(36, 72, 12, 18, 5, SUIT, 'h')}${R(52, 72, 12, 18, 5, SUIT, 'h')}
    ${R(34, 86, 16, 9, 4, c.main, 'v')}${R(50, 86, 16, 9, 4, c.main, 'v')}
    <g class="part-arm">${R(18, 46, 12, 22, 6, SUIT, 'h')}${R(18, 56, 12, 5, 2, c.main, 'v')}${C(24, 70, 6, '#cfd5dc')}</g>
    <g class="part-arm2">${R(70, 46, 12, 18, 6, SUIT, 'h')}${R(70, 54, 12, 5, 2, c.main, 'v')}
      ${R(72, 62, 20, 8, 3, '#5d656e', 'h')}${R(76, 66, 5, 9, 2, '#3a3f45', 'v')}${C(93, 66, 3.5, '#9cff7a', '', 'filter="url(#f-glow)" class="part-light"')}</g>
    ${R(30, 42, 40, 34, 9, SUIT, 'r')}
    ${R(30, 64, 40, 7, 2, c.main, 'v')}
    ${R(39, 47, 22, 13, 3, '#5d656e', 'v')}
    <g filter="url(#f-glow)"><circle cx="44" cy="53.5" r="2" fill="#ff5c7a" class="part-light"/><circle cx="50" cy="53.5" r="2" fill="#ffd34d" class="part-light2"/><circle cx="56" cy="53.5" r="2" fill="#4ade80" class="part-light"/></g>
    <g class="part-head">
      ${C(50, 26, 17, SUIT)}
      ${E(50, 27, 12, 10, '#c7951f', 'r')}
      <path d="M41 23 Q46 19 53 20" stroke="#fff4c4" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".85"/>
      ${R(32, 22, 4, 10, 2, c.main, 'h')}${R(64, 22, 4, 10, 2, c.main, 'h')}
      <path d="M62 12 L67 2" stroke="#8e98a3" stroke-width="1.6"/><circle cx="67" cy="2" r="2" fill="${c.light}"/>
    </g>`;
  },
  // Toy cowboy with a spinning lasso.
  4: (c) => {
    const DENIM = '#3d5a8a', LEATHER = '#7a4a26', HAT = '#c9a26a';
    return `${shadow}
    ${R(38, 70, 10, 20, 4, DENIM, 'h')}${R(52, 70, 10, 20, 4, DENIM, 'h')}
    ${P('M34 96 L36 86 H48 L49 96 Z M51 96 L52 86 H64 L66 96 Z', LEATHER, 'v')}
    <g class="part-arm">${R(24, 46, 10, 22, 5, c.main, 'h')}${C(29, 70, 4.2, SKIN)}</g>
    ${R(34, 44, 32, 30, 7, c.main, 'v')}
    ${P('M34 46 L44 46 L44 70 L34 70 Z M56 46 L66 46 L66 70 L56 70 Z', LEATHER, 'v')}
    ${R(34, 68, 32, 5, 2, '#4a2d16', 'v')}${R(46, 67.5, 8, 6, 2, GOLD, 'v')}
    <g class="part-arm2">${R(66, 34, 10, 20, 5, c.main, 'h', 'transform="rotate(-25 71 44)"')}${C(78, 30, 4.2, SKIN)}
      <g class="part-lasso"><path d="M78 30 Q84 18 82 10" fill="none" stroke="#c49a5a" stroke-width="2"/>
      <ellipse cx="80" cy="6" rx="16" ry="5" fill="none" stroke="#a9803f" stroke-width="3.4"/><ellipse cx="80" cy="6" rx="16" ry="5" fill="none" stroke="#e0bd7c" stroke-width="1.4" stroke-dasharray="4 3"/></g></g>
    <g class="part-head">
      ${P('M40 44 L50 50 L60 44 L57 41 H43 Z', c.light, 'v')}
      ${C(50, 32, 10.5, SKIN)}${eyes(46, 54, 31.5, 1.9)}${cheeks(43, 57, 36)}
      <path d="M46.5 37 Q50 39.5 53.5 37" fill="none" stroke="#7a3a2a" stroke-width="1.2" stroke-linecap="round"/>
      ${E(50, 22, 22, 5, HAT)}
      ${P('M40 22 Q40 8 50 8 Q60 8 60 22 Q50 25 40 22 Z', HAT, 'h')}
      ${R(40, 18, 20, 3.5, 1.5, '#5a3a1e', '')}
    </g>`;
  },
  // Sleek combat robot with an arm blaster.
  5: (c) => {
    const WH = '#e7ebf0';
    return `${shadow}
    ${R(37, 74, 10, 18, 4, '#9aa4ae', 'h')}${R(53, 74, 10, 18, 4, '#9aa4ae', 'h')}
    ${C(42, 80, 4, c.main)}${C(58, 80, 4, c.main)}
    ${P('M33 96 L36 88 H48 L50 96 Z M50 96 L52 88 H64 L67 96 Z', WH, 'v')}
    ${P('M30 44 L44 36 L44 30 L56 30 L56 36 L70 44 L66 50 L34 50 Z', '#596370', 'v')}
    <g class="part-arm">${R(18, 46, 11, 20, 5, WH, 'h')}${C(23, 46, 8, c.main)}
      ${R(12, 62, 22, 11, 5, '#5d656e', 'h')}${R(8, 64, 8, 7, 2, '#3a3f45', 'h')}
      <circle cx="9" cy="67.5" r="3.2" fill="#7df9ff" filter="url(#f-glow)" class="part-light"/></g>
    <g class="part-arm2">${R(71, 46, 11, 20, 5, WH, 'h')}${C(77, 46, 8, c.main)}${C(77, 69, 6.5, '#8e98a3')}</g>
    ${P('M34 48 H66 L62 74 H38 Z', WH, 'r')}
    ${P('M42 52 H58 L56 64 H44 Z', c.main, 'v')}
    <circle cx="50" cy="58" r="3.2" fill="#7df9ff" filter="url(#f-glow)" class="part-light2"/>
    ${R(38, 70, 24, 6, 2, '#596370', 'v')}
    <g class="part-head">
      ${P('M36 32 Q36 10 50 10 Q64 10 64 32 Q50 36 36 32 Z', WH, 'r')}
      ${P('M38 20 Q50 14 62 20 L61 27 Q50 24 39 27 Z', '#0f1b26', 'v')}
      <path class="visor" d="M41 22 Q50 18.5 59 22" stroke="#7df9ff" stroke-width="2.6" fill="none" stroke-linecap="round" filter="url(#f-glow)"/>
      ${R(33, 18, 4, 12, 2, c.main, 'h')}${R(63, 18, 4, 12, 2, c.main, 'h')}
      <path d="M64 18 L70 6" stroke="#596370" stroke-width="1.8"/><circle cx="70" cy="6" r="2" fill="#ff5c7a" class="part-light"/>
    </g>`;
  },
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

  // Wind-up toy tank.
  7: (c) => `${shadow}
    ${R(10, 74, 80, 20, 10, '#2c2f33', 'v')}
    ${[20, 34, 48, 62, 76].map((x) => C(x + 2, 84, 6, '#8e98a3')).join('')}
    <path d="M14 76 h72 M14 92 h72" stroke="#4a4f55" stroke-width="2" stroke-dasharray="3 3"/>
    ${box(14, 56, 66, 18, 6, c.main)}
    ${P('M50 62 l2.5 5 5.5 .6 -4 3.7 1.1 5.4 -5 -2.8 -5 2.8 1.1 -5.4 -4 -3.7 5.5 -.6z', '#f3efe6', 'r')}
    <g class="part-head">
      ${R(56, 36, 40, 7, 3.5, '#6b737c', 'h')}${R(92, 34, 7, 11, 2, '#4a525a', 'h')}
      ${P('M28 56 Q30 34 50 32 Q70 34 72 56 Z', shade(c.main, -0.1), 'r')}
      ${R(40, 40, 18, 7, 3.5, '#1d2833', 'v')}
      ${E(52, 31, 9, 3.5, '#5d656e')}
      <path d="M36 40 V14" stroke="#4a525a" stroke-width="1.6"/>
      <path class="flag" d="M36 14 l14 4 -14 4z" fill="${c.light}"/>
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
  4: '<ellipse cx="13" cy="7" rx="8" ry="3.5" fill="none" stroke="#a9803f" stroke-width="2.2"/><path d="M6 21 Q4 13 9 9" fill="none" stroke="#a9803f" stroke-width="2"/><path d="M14 13l6 5-6 3z" fill="#1d1d1d"/>',
  5: '<rect x="3" y="5" width="11" height="15" rx="2" fill="#fff" stroke="#1d1d1d" stroke-width="1.5"/><path d="M5.5 9l6 7M11.5 9l-6 7" stroke="#e5484d" stroke-width="2.2" stroke-linecap="round"/><path d="M19 2l-4 8h4l-3 8" fill="none" stroke="#f2b705" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>',
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
