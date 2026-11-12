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

const eyes = (x1, x2, y, r = 6) => `
  <g class="eyes">
    <circle cx="${x1}" cy="${y}" r="${r}" fill="#fff" stroke="#1d1d1d" stroke-width="2"/>
    <circle cx="${x2}" cy="${y}" r="${r}" fill="#fff" stroke="#1d1d1d" stroke-width="2"/>
    <circle cx="${x1 + 1}" cy="${y + 1}" r="${r * 0.45}" fill="#1d1d1d"/>
    <circle cx="${x2 + 1}" cy="${y + 1}" r="${r * 0.45}" fill="#1d1d1d"/>
    <circle cx="${x1 + 2}" cy="${y - 1}" r="${r * 0.18}" fill="#fff"/>
    <circle cx="${x2 + 2}" cy="${y - 1}" r="${r * 0.18}" fill="#fff"/>
  </g>`;

const OL = 'stroke="#1d1d1d" stroke-width="2.5" stroke-linejoin="round"';

const ART = {
  0: (c) => `
    <g class="part-spring">
      <path d="M50 66 l-12 -5 l24 -5 l-24 -5 l24 -5 l-12 -4" fill="none" stroke="#9aa3ad" stroke-width="5" stroke-linecap="round"/>
      <g class="part-head">
        <path d="M30 22 Q50 -4 70 22 Z" fill="${c.main}" ${OL}/>
        <circle cx="50" cy="5" r="5" fill="#ffd34d" ${OL}/>
        <circle cx="50" cy="30" r="16" fill="#ffe08a" ${OL}/>
        ${eyes(43, 57, 27, 5)}
        <path d="M41 35 Q50 44 59 35" fill="#c0392b" ${OL}/>
        <circle cx="37" cy="33" r="3" fill="#ff9aa2" opacity=".8"/><circle cx="63" cy="33" r="3" fill="#ff9aa2" opacity=".8"/>
      </g>
    </g>
    <rect x="22" y="64" width="56" height="32" rx="5" fill="${c.main}" ${OL}/>
    <rect x="22" y="64" width="56" height="8" rx="3" fill="${c.dark}" ${OL}/>
    <path d="M50 75 l3.5 7 7.5 1 -5.5 5 1.5 7.5 -7 -4 -7 4 1.5 -7.5 -5.5 -5 7.5 -1z" fill="#ffd34d" ${OL}/>
    <circle cx="80" cy="80" r="4" fill="#ffd34d" ${OL}/>`,

  1: (c) => `
    <g class="part-key"><path d="M78 56 h12 M90 50 v12 M84 46 a6 6 0 1 1 0.1 0 M84 66 a6 6 0 1 1 0.1 0" fill="#ffd34d" ${OL}/></g>
    <path d="M18 78 Q4 70 10 58" fill="none" stroke="#f4a3b4" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="50" cy="70" rx="30" ry="20" fill="#b9c0c9" ${OL}/>
    <g class="part-head">
      <circle cx="30" cy="30" r="13" fill="#b9c0c9" ${OL}/><circle cx="30" cy="30" r="7" fill="#f4a3b4"/>
      <circle cx="70" cy="30" r="13" fill="#b9c0c9" ${OL}/><circle cx="70" cy="30" r="7" fill="#f4a3b4"/>
      <ellipse cx="50" cy="45" rx="22" ry="19" fill="#c8ced6" ${OL}/>
      ${eyes(42, 58, 42, 5.5)}
      <circle cx="50" cy="55" r="4" fill="#f06292" ${OL}/>
      <path d="M38 55 h-10 M38 58 l-9 3 M62 55 h10 M62 58 l9 3" stroke="#1d1d1d" stroke-width="1.5"/>
    </g>
    <path d="M30 62 Q50 72 70 62 L68 70 Q50 78 32 70 Z" fill="${c.main}" ${OL}/>
    <ellipse cx="34" cy="88" rx="9" ry="5" fill="#f4a3b4" ${OL}/><ellipse cx="66" cy="88" rx="9" ry="5" fill="#f4a3b4" ${OL}/>`,

  2: (c) => `
    <g class="part-arm"><path d="M20 58 L8 40" stroke="#c8873a" stroke-width="4" stroke-linecap="round"/><circle cx="8" cy="40" r="4" fill="#fff" ${OL}/></g>
    <g class="part-arm2"><path d="M80 58 L92 40" stroke="#c8873a" stroke-width="4" stroke-linecap="round"/><circle cx="92" cy="40" r="4" fill="#fff" ${OL}/></g>
    <rect x="30" y="44" width="40" height="30" rx="6" fill="${c.main}" ${OL}/>
    <path d="M36 46 L64 72 M64 46 L36 72" stroke="#ffd34d" stroke-width="3"/>
    <g class="part-head">
      <rect x="34" y="2" width="32" height="24" rx="4" fill="${c.dark}" ${OL}/>
      <rect x="32" y="22" width="36" height="5" rx="2" fill="#1d1d1d"/>
      <circle cx="50" cy="12" r="5" fill="#ffd34d" ${OL}/>
      <path d="M50 2 Q56 -6 50 -10" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
      <circle cx="50" cy="36" r="11" fill="#ffd7b5" ${OL}/>
      ${eyes(45, 55, 35, 3.6)}
      <circle cx="41" cy="40" r="2.5" fill="#ff8a80"/><circle cx="59" cy="40" r="2.5" fill="#ff8a80"/>
    </g>
    <ellipse cx="50" cy="80" rx="26" ry="9" fill="#fff" ${OL}/>
    <rect x="24" y="72" width="52" height="16" fill="#fff" stroke="none"/>
    <path d="M24 72 v16 M76 72 v16" ${OL}/>
    <ellipse cx="50" cy="72" rx="26" ry="8" fill="#f1e6c8" ${OL}/>
    <path d="M26 76 L36 88 L46 76 L56 88 L66 76 L74 86" fill="none" stroke="${c.main}" stroke-width="3"/>
    <ellipse cx="50" cy="88" rx="26" ry="7" fill="none" ${OL}/>`,

  3: (c) => `
    <g class="part-arm"><rect x="4" y="44" width="20" height="20" rx="3" fill="#ffd34d" ${OL}/></g>
    <g class="part-arm2"><rect x="76" y="44" width="20" height="20" rx="3" fill="#4caf50" ${OL}/></g>
    <rect x="24" y="40" width="52" height="36" rx="4" fill="${c.main}" ${OL}/>
    <circle cx="37" cy="40" r="5" fill="${c.main}" ${OL}/><circle cx="63" cy="40" r="5" fill="${c.main}" ${OL}/>
    <rect x="26" y="76" width="20" height="18" rx="3" fill="#8e5bd8" ${OL}/>
    <rect x="54" y="76" width="20" height="18" rx="3" fill="#ff9800" ${OL}/>
    <g class="part-head">
      <rect x="30" y="8" width="40" height="32" rx="4" fill="#ffd34d" ${OL}/>
      <circle cx="42" cy="8" r="4.5" fill="#ffd34d" ${OL}/><circle cx="58" cy="8" r="4.5" fill="#ffd34d" ${OL}/>
      ${eyes(42, 58, 22, 5)}
      <path d="M38 14 l8 3 M62 14 l-8 3" stroke="#1d1d1d" stroke-width="3" stroke-linecap="round"/>
      <rect x="41" y="30" width="18" height="5" rx="2" fill="#1d1d1d"/>
    </g>`,

  4: (c) => `
    <g class="part-fly">
      <path d="M6 58 L94 30 L52 62 Z" fill="#fff" ${OL}/>
      <path d="M6 58 L94 30 L44 76 Z" fill="#e8edf3" ${OL}/>
      <path d="M44 76 L52 62" ${OL}/>
      <path d="M94 30 L36 64" stroke="#c9d3dd" stroke-width="2"/>
      <g class="part-head">
        <circle cx="46" cy="44" r="12" fill="#ffd7b5" ${OL}/>
        <path d="M34 42 Q46 24 58 42 Z" fill="${c.main}" ${OL}/>
        <rect x="36" y="38" width="20" height="8" rx="4" fill="#8fd3ff" ${OL}/>
        <circle cx="41" cy="42" r="2" fill="#fff"/><circle cx="51" cy="42" r="2" fill="#fff"/>
        <path d="M41 50 Q46 54 51 50" fill="none" stroke="#1d1d1d" stroke-width="2" stroke-linecap="round"/>
        <path d="M34 44 Q20 40 14 46" fill="none" stroke="${c.light}" stroke-width="4" stroke-linecap="round" class="part-scarf"/>
      </g>
      <path d="M6 58 Q-2 62 4 70" fill="none" stroke="#9aa3ad" stroke-width="2" stroke-dasharray="3 3"/>
    </g>`,

  5: (c) => `
    <g class="part-spark"><path d="M8 20 l6 6 M4 34 h8 M92 20 l-6 6 M96 34 h-8" stroke="#ffd34d" stroke-width="3" stroke-linecap="round"/></g>
    <path d="M20 90 V46 a30 30 0 0 1 60 0 V90 H62 V46 a12 12 0 0 0 -24 0 V90 Z" fill="${c.main}" ${OL}/>
    <rect x="20" y="76" width="18" height="16" fill="#dfe6ee" ${OL}/>
    <rect x="62" y="76" width="18" height="16" fill="#dfe6ee" ${OL}/>
    <g class="part-head">
      ${eyes(40, 60, 26, 5.5)}
      <path d="M42 36 Q50 42 58 36" fill="none" stroke="#1d1d1d" stroke-width="2.5" stroke-linecap="round"/>
    </g>
    <path d="M28 40 Q30 28 40 22" fill="none" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/>`,

  6: (c) => `
    <g class="part-arm"><ellipse cx="18" cy="62" rx="9" ry="13" fill="#c98b52" ${OL}/></g>
    <g class="part-arm2"><ellipse cx="82" cy="62" rx="9" ry="13" fill="#c98b52" ${OL}/></g>
    <ellipse cx="50" cy="70" rx="27" ry="24" fill="#c98b52" ${OL}/>
    <ellipse cx="50" cy="74" rx="16" ry="14" fill="#f0cfa2"/>
    <path d="M50 70 c-6 -8 -16 0 0 10 c16 -10 6 -18 0 -10" fill="#ff5c7a" ${OL}/>
    <g class="part-head">
      <circle cx="28" cy="16" r="9" fill="#c98b52" ${OL}/><circle cx="28" cy="16" r="4.5" fill="#f0cfa2"/>
      <circle cx="72" cy="16" r="9" fill="#c98b52" ${OL}/><circle cx="72" cy="16" r="4.5" fill="#f0cfa2"/>
      <circle cx="50" cy="32" r="22" fill="#d39a62" ${OL}/>
      ${eyes(41, 59, 28, 4.5)}
      <ellipse cx="50" cy="40" rx="9" ry="7" fill="#f0cfa2" ${OL}/>
      <ellipse cx="50" cy="37" rx="3.5" ry="2.5" fill="#1d1d1d"/>
      <rect x="64" y="34" width="10" height="4" fill="#fff" stroke="#ddd" transform="rotate(30 69 36)"/>
    </g>
    <path d="M38 52 L50 57 L38 62 Z M62 52 L50 57 L62 62 Z" fill="${c.main}" ${OL}/>
    <circle cx="50" cy="57" r="3" fill="${c.dark}"/>`,

  7: (c) => `
    <g class="part-arm"><rect x="4" y="42" width="16" height="34" rx="6" fill="${c.main}" ${OL}/><rect x="2" y="74" width="20" height="10" rx="3" fill="#7d8792" ${OL}/></g>
    <g class="part-arm2"><rect x="80" y="42" width="16" height="34" rx="6" fill="${c.main}" ${OL}/><rect x="78" y="74" width="20" height="10" rx="3" fill="#7d8792" ${OL}/></g>
    <rect x="18" y="38" width="64" height="40" rx="8" fill="#aab4bf" ${OL}/>
    <rect x="30" y="48" width="40" height="20" rx="4" fill="${c.dark}" ${OL}/>
    <circle cx="40" cy="58" r="4" fill="#ffd34d" class="part-light"/><circle cx="50" cy="58" r="4" fill="#4ade80" class="part-light2"/><circle cx="60" cy="58" r="4" fill="#ff5c7a" class="part-light"/>
    <rect x="26" y="78" width="18" height="18" rx="3" fill="#7d8792" ${OL}/>
    <rect x="56" y="78" width="18" height="18" rx="3" fill="#7d8792" ${OL}/>
    <g class="part-head">
      <path d="M50 4 V12" stroke="#1d1d1d" stroke-width="3"/><circle cx="50" cy="4" r="4" fill="#ff5c7a" ${OL} class="part-light2"/>
      <rect x="28" y="12" width="44" height="28" rx="7" fill="${c.main}" ${OL}/>
      <rect x="33" y="19" width="34" height="13" rx="6" fill="#1d2a3a" ${OL}/>
      <rect x="37" y="23" width="9" height="5" rx="2" fill="#7df9ff" class="visor"/>
      <rect x="54" y="23" width="9" height="5" rx="2" fill="#7df9ff" class="visor"/>
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
