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

const src = (type, color) => `assets/troops/${type}-${color}.png`;

// Rendered 3D toy (see tools/render). Used on cards, avatars and overlays.
export function troopArt(type, color, cls = '') {
  return `<img class="troop-art t${type} ${cls}" src="${src(type, color)}" alt="" draggable="false">`;
}

// Same toy as an SVG <image>, positioned for the board tokens' 100-unit art box.
export function troopArtGroup(type, color) {
  return `<image href="${src(type, color)}" x="-16" y="-26" width="132" height="132"/>`;
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
