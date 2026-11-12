import * as E from './engine.js';
import { MAP_LIST, MAPS, SPECIALS } from './maps.js';
import { renderPreview } from './board.js';
import { TROOPS, cardHTML, troopArt } from './troops.js';
import { GameView } from './game.js';
import { botAction } from './bot.js';
import * as Net from './net.js';
import { sfx, isMuted, setMuted } from './sfx.js';

const app = document.getElementById('app');
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let view = null; // active GameView
let unsub = []; // firestore listeners
let profile = null;

function cleanup() {
  view?.destroy?.(); view = null;
  unsub.forEach((u) => { try { u(); } catch { /* ignore */ } });
  unsub = [];
}

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'app-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function screen(html, cls = '') {
  cleanup();
  app.innerHTML = `<div class="screen ${cls}">${html}</div>`;
  return app.firstElementChild;
}

const backBtn = (to = 'home') => `<button class="icon-btn" data-nav="${to}" aria-label="Back">‹</button>`;

// --------------------------------------------------------------- home
function home() {
  const online = !!Net.getConfig();
  const bot = store.get('tt.bot');
  const local = store.get('tt.local');
  const el = screen(`
    <div class="title-art">
      <div class="title-chars">${[0, 3, 7, 6, 4].map((t, i) => `<div class="tc tc${i}">${troopArt(t, i % 2 ? 'blue' : 'red', 'idle')}</div>`).join('')}</div>
      <h1 class="logo">Toybox<br><span>Tactics</span></h1>
    </div>
    <div class="menu">
      <button class="btn go big" data-nav="online">⚔️ Play Online</button>
      ${online ? '' : '<p class="note">Online play needs a one-time Firebase setup. <a href="#" data-nav="settings">Set up</a></p>'}
      <button class="btn big" data-nav="bot">🤖 Practice vs Bot</button>
      ${bot && bot.state.phase !== 'over' ? '<button class="btn small" data-nav="bot-resume">Resume bot game</button>' : ''}
      <button class="btn big" data-nav="local">📱 Pass &amp; Play</button>
      ${local && local.state.phase !== 'over' ? '<button class="btn small" data-nav="local-resume">Resume pass &amp; play</button>' : ''}
      <div class="row">
        <button class="btn ghosty" data-nav="rules">📖 How to play</button>
        <button class="btn ghosty" data-nav="settings">⚙️ Settings</button>
      </div>
    </div>`, 'home');
  void el;
}

// --------------------------------------------------------------- map picker
function mapPicker(title, onPick, { allowRandom = true, back = 'home' } = {}) {
  const el = screen(`
    <header class="topbar">${backBtn(back)}<h2>${title}</h2></header>
    <div class="map-grid">
      ${allowRandom ? `<button class="map-card random" data-map="random"><div class="mp-prev"><div class="dice">🎲</div></div><div class="mp-name">Random</div><div class="mp-blurb">Surprise me</div></button>` : ''}
      ${MAP_LIST.map((m) => `<button class="map-card" data-map="${m.id}"><div class="mp-prev">${renderPreview(m)}</div>
        <div class="mp-name">${m.name}</div><div class="mp-blurb">${m.blurb}</div><div class="mp-obj"><span class="medal-ico"></span>${m.objective} to win</div></button>`).join('')}
    </div>`, 'maps');
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-map]');
    if (!b) return;
    let id = b.dataset.map;
    if (id === 'random') id = MAP_LIST[Math.floor(Math.random() * MAP_LIST.length)].id;
    sfx('tap');
    onPick(id);
  });
}

// --------------------------------------------------------------- offline games
function startBot(mapId, level = 'normal') {
  const human = Math.random() < 0.5 ? 'red' : 'blue';
  const state = E.newGame({ mapId });
  const names = { [human]: 'You', [E.other(human)]: 'Toy Bot' };
  const g = { state, names, human, level };
  store.set('tt.bot', g);
  playBot(g);
}

function playBot(g) {
  cleanup();
  app.innerHTML = '<div class="screen game-screen"></div>';
  view = new GameView(app.firstElementChild, {
    state: g.state, names: g.names, mode: 'bot', myColor: g.human,
    onCommit: (s, v) => { g.state = s; store.set('tt.bot', g); runBot(v, g); },
    onExit: () => home(),
    onMenu: (v) => gameMenu(v, { resign: () => { g.state = forfeit(v.s, g.human); store.set('tt.bot', g); v.setState(g.state); } }),
    onRematch: () => startBot(g.state.mapId, g.level),
  });
  runBot(view, g);
}

function runBot(v, g) {
  const step = () => {
    if (v !== view) return;
    const s = v.s;
    if (s.phase === 'over' || s.current === g.human) return;
    const next = E.apply(s, botAction(s, g.level));
    v.setState(next);
    g.state = next; store.set('tt.bot', g);
    if (next.phase === 'over' || next.current === g.human) {
      if (next.phase === 'over') sfx(next.winner === g.human ? 'win' : 'lose');
      v.showRecapFor(next); v.render();
      return;
    }
    v.botTimer = setTimeout(step, 750);
  };
  clearTimeout(v.botTimer);
  if (v.s.current !== g.human && v.s.phase !== 'over') v.botTimer = setTimeout(step, 900);
}

function forfeit(s, loser) {
  const n = JSON.parse(JSON.stringify(s));
  n.phase = 'over'; n.winner = E.other(loser); n.reason = 'resign'; n.pending = null;
  return n;
}

function setupLocal(mapId) {
  const el = screen(`
    <header class="topbar">${backBtn('home')}<h2>Pass &amp; Play</h2></header>
    <form class="form">
      <label>Red player<input name="red" value="Red" maxlength="16"></label>
      <label>Blue player<input name="blue" value="Blue" maxlength="16"></label>
      <button class="btn go big">Start</button>
    </form>`);
  el.querySelector('form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    const g = { state: E.newGame({ mapId }), names: { red: f.get('red') || 'Red', blue: f.get('blue') || 'Blue' } };
    store.set('tt.local', g);
    playLocal(g, true);
  });
}

function playLocal(g, fresh = false) {
  cleanup();
  app.innerHTML = '<div class="screen game-screen"></div>';
  view = new GameView(app.firstElementChild, {
    state: g.state, names: g.names, mode: 'local',
    onCommit: (s) => { g.state = s; store.set('tt.local', g); },
    onExit: () => home(),
    onMenu: (v) => gameMenu(v, { resign: () => { g.state = forfeit(v.s, v.s.current); store.set('tt.local', g); v.setState(g.state); } }),
    onRematch: () => { const n = { state: E.newGame({ mapId: g.state.mapId }), names: g.names }; store.set('tt.local', n); playLocal(n, true); },
  });
  if (g.state.phase !== 'over') { view.passScreen = true; view.render(); }
  void fresh;
}

function gameMenu(v, { resign }) {
  v.sheet(`<h3>Menu</h3>
    <div class="menu">
      <button class="btn" data-act="rules-sheet">📖 Quick rules</button>
      <button class="btn" data-act="toggle-sound">${isMuted() ? '🔇 Sound off' : '🔊 Sound on'}</button>
      ${v.s.phase !== 'over' ? '<button class="btn danger" data-act="resign">🏳️ Resign</button>' : ''}
      <button class="btn" data-act="exit">🏠 Leave game</button>
    </div>`);
  const layer = v.root.querySelector('.sheet-layer');
  layer.onclick = (ev) => {
    const a = ev.target.closest('[data-act]')?.dataset.act;
    if (a === 'toggle-sound') { setMuted(!isMuted()); gameMenu(v, { resign }); ev.stopPropagation(); }
    if (a === 'resign' && confirm('Resign this game?')) { layer.innerHTML = ''; resign(); ev.stopPropagation(); }
    if (a === 'rules-sheet') { v.sheet(rulesHTML(MAPS[v.s.mapId])); ev.stopPropagation(); }
  };
}

// --------------------------------------------------------------- online
async function ensureOnline() {
  if (!Net.getConfig()) { settings(true); return false; }
  const el = screen('<div class="center"><div class="spinner"></div><p>Connecting…</p></div>');
  try {
    await Net.connect();
    profile = await Net.getProfile();
  } catch (e) {
    el.innerHTML = `<div class="center"><p>Couldn't connect: ${esc(e.message)}</p><button class="btn" data-nav="home">Back</button></div>`;
    return false;
  }
  if (!profile) { nameScreen(); return false; }
  return true;
}

function nameScreen(after = lobby) {
  const el = screen(`
    <header class="topbar">${backBtn('home')}<h2>Pick a player name</h2></header>
    <form class="form"><p>Friends will find and challenge you by this name.</p>
      <label>Name<input name="name" maxlength="16" autocomplete="nickname" value="${esc(profile?.name || '')}" required></label>
      <div class="err"></div><button class="btn go big">Save</button></form>`);
  el.querySelector('form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const name = new FormData(ev.target).get('name');
    try { await Net.claimName(name); profile = await Net.getProfile(); after(); } catch (e) { el.querySelector('.err').textContent = e.message; }
  });
}

async function lobby() {
  if (!(await ensureOnline())) return;
  const pendingJoin = sessionStorage.getItem('tt.join');
  if (pendingJoin) {
    sessionStorage.removeItem('tt.join');
    try { await Net.joinByCode(pendingJoin, profile.name); toast('Joined game!'); } catch (e) { toast(e.message); }
  }
  const el = screen(`
    <header class="topbar">${backBtn('home')}<h2>Online</h2><button class="chip" data-act="rename">👤 ${esc(profile.name)}</button></header>
    <div class="lobby-actions">
      <button class="btn go big" data-act="quick">⚡ Quick match</button>
      <div class="row"><button class="btn" data-act="new">✉️ Challenge friend</button><button class="btn" data-act="code">🔑 Join with code</button></div>
    </div>
    <h3 class="section">Your games</h3>
    <div class="game-list"><div class="center"><div class="spinner"></div></div></div>`, 'lobby');
  const list = el.querySelector('.game-list');
  let games = [];
  const me = Net.uid();
  const off = await Net.watchMyGames((gs, err) => {
    if (err) { list.innerHTML = `<p class="note">${esc(err.message)}</p>`; return; }
    games = gs;
    if (!gs.length) { list.innerHTML = '<p class="note">No games yet. Start a quick match or challenge a friend by name.</p>'; return; }
    list.innerHTML = gs.map((g) => {
      const map = MAPS[g.mapId];
      const myColor = g.players ? (g.players.red.uid === me ? 'red' : 'blue') : null;
      const opp = g.players ? g.players[E.other(myColor)].name : g.hostUid === me ? (g.invitedName || 'anyone') : g.hostName;
      let status = '', btns = '', cls = '';
      if (g.status === 'waiting' && g.hostUid === me) {
        status = g.invitedName ? `Waiting for ${esc(g.invitedName)} to accept` : `Waiting for opponent · code <b>${g.code}</b>`;
        btns = `${g.invitedName ? '' : `<button class="btn small" data-act="share" data-id="${g.id}">Share</button>`}<button class="btn small ghosty" data-act="remove" data-id="${g.id}">Cancel</button>`;
      } else if (g.status === 'waiting') {
        status = `${esc(g.hostName)} challenged you!`; cls = 'hot';
        btns = `<button class="btn small go" data-act="accept" data-id="${g.id}">Accept</button><button class="btn small ghosty" data-act="remove" data-id="${g.id}">Decline</button>`;
      } else if (g.status === 'active') {
        const mine = g.turnUid === me;
        status = mine ? '<b>Your turn!</b>' : 'Their turn'; cls = mine ? 'hot' : '';
        btns = `<button class="btn small ${mine ? 'go' : ''}" data-act="open" data-id="${g.id}">${mine ? 'Play' : 'View'}</button>`;
      } else {
        status = g.winnerUid === me ? '🏆 You won' : 'You lost';
        btns = `<button class="btn small" data-act="open" data-id="${g.id}">View</button><button class="btn small ghosty" data-act="remove" data-id="${g.id}">Hide</button>`;
      }
      return `<div class="game-item ${cls}"><div class="gi-map theme-${map.theme}"></div><div class="gi-main"><div class="gi-title">vs ${esc(opp)}</div>
        <div class="gi-sub">${map.name} · ${status}</div></div><div class="gi-btns">${btns}</div></div>`;
    }).join('');
  });
  unsub.push(off);

  el.addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-act]');
    if (!b) return;
    const g = games.find((x) => x.id === b.dataset.id);
    try {
      switch (b.dataset.act) {
        case 'rename': return nameScreen();
        case 'quick': {
          b.disabled = true;
          const r = await Net.quickMatch(profile.name);
          if (r.waiting) toast('Waiting for an opponent — the game will appear in your list when someone joins.');
          else openOnline(r.id);
          b.disabled = false;
          return;
        }
        case 'new': return newOnline();
        case 'code': {
          const code = prompt('Enter the 5-letter game code:');
          if (code) { const id = await Net.joinByCode(code, profile.name); openOnline(id); }
          return;
        }
        case 'share': return share(g);
        case 'accept': await Net.joinGame(g.id, profile.name); return openOnline(g.id);
        case 'remove': return Net.removeGame(g);
        case 'open': return openOnline(g.id);
      }
    } catch (e) { toast(e.message); b.disabled = false; }
  });
}

function share(g) {
  const url = `${location.origin}${location.pathname}?join=${g.code}`;
  const text = `Battle me in Toybox Tactics! Code: ${g.code}`;
  if (navigator.share) navigator.share({ title: 'Toybox Tactics', text, url }).catch(() => {});
  else { navigator.clipboard?.writeText(`${text} ${url}`); toast('Invite link copied!'); }
}

function newOnline() {
  mapPicker('Choose a map', (mapId) => {
    const el = screen(`
      <header class="topbar">${backBtn('online')}<h2>${MAPS[mapId].name}</h2></header>
      <form class="form">
        <label>Challenge a friend by player name<input name="invite" maxlength="16" placeholder="Their player name"></label>
        <button class="btn go big" name="mode" value="invite">Send challenge</button>
        <div class="or">or</div>
        <button class="btn big" name="mode" value="code" formnovalidate>Create invite link / code</button>
        <div class="err"></div>
      </form>`);
    el.querySelector('form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const mode = ev.submitter?.value;
      const invite = new FormData(ev.target).get('invite').trim();
      try {
        if (mode === 'invite') {
          if (!invite) throw new Error('Type their player name.');
          await Net.createGame({ mapId, myName: profile.name, invite });
          toast(`Challenge sent to ${invite}!`);
        } else {
          const g = await Net.createGame({ mapId, myName: profile.name });
          share(g);
        }
        lobby();
      } catch (e) { el.querySelector('.err').textContent = e.message; }
    });
  }, { back: 'online' });
}

async function openOnline(id) {
  cleanup();
  app.innerHTML = '<div class="screen game-screen"><div class="center"><div class="spinner"></div></div></div>';
  const holder = app.firstElementChild;
  let game = null;
  const me = Net.uid();
  const off = await Net.watchGame(id, (g, err) => {
    if (err || !g) { toast(err?.message || 'Game not found'); return lobby(); }
    game = g;
    if (g.status === 'waiting') {
      holder.innerHTML = `<div class="center"><h2>Waiting for opponent…</h2><p>Code: <b class="code">${g.code}</b></p>
        <button class="btn go" data-act="share">Share invite</button> <button class="btn ghosty" data-nav="online">Back</button></div>`;
      holder.querySelector('[data-act="share"]').onclick = () => share(g);
      return;
    }
    const state = JSON.parse(g.stateJson);
    const myColor = g.players.red.uid === me ? 'red' : 'blue';
    if (!view) {
      holder.innerHTML = '';
      view = new GameView(holder, {
        state, mode: 'online', myColor,
        names: { red: g.players.red.name, blue: g.players.blue.name },
        onCommit: async (s, v) => {
          try { await Net.submitTurn(game, s); } catch (e) { toast(e.message); v.setState(JSON.parse(game.stateJson), { animate: false }); }
        },
        onExit: () => lobby(),
        onMenu: (v) => gameMenu(v, { resign: () => Net.resign(game).catch((e) => toast(e.message)) }),
      });
    } else {
      // Server still shows the start of my own turn: keep my local, possibly mid-turn, state.
      const myUnchangedTurn = state.phase !== 'over' && state.current === myColor && state.turn === view.s.turn;
      if (!myUnchangedTurn) view.receive(state);
    }
  });
  unsub.push(off);
}

// --------------------------------------------------------------- settings & rules
function settings(fromOnline = false) {
  const cfg = Net.getConfig();
  const el = screen(`
    <header class="topbar">${backBtn('home')}<h2>Settings</h2></header>
    <div class="form">
      <label class="toggle"><input type="checkbox" name="mute" ${isMuted() ? '' : 'checked'}> Sound effects</label>
      <h3>Online play (Firebase)</h3>
      ${fromOnline ? '<p class="note">Online play needs a free Firebase project. See the README for the 5-minute setup, then paste the web config below.</p>' : ''}
      <p>Status: ${cfg ? `<b>configured</b> (project <code>${esc(cfg.projectId)}</code>)` : '<b>not configured</b>'}</p>
      <label>Paste Firebase web config<textarea name="cfg" rows="7" placeholder="const firebaseConfig = { apiKey: ..., projectId: ... }"></textarea></label>
      <div class="err"></div>
      <button class="btn go" data-act="save">Save config</button>
      ${cfg && !localStorage.getItem('tt.firebase') ? '' : cfg ? '<button class="btn ghosty" data-act="clear">Remove saved config</button>' : ''}
    </div>`);
  el.querySelector('[name=mute]').onchange = (e) => setMuted(!e.target.checked);
  el.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-act]')?.dataset.act;
    if (a === 'save') {
      try { Net.saveConfig(Net.parseConfig(el.querySelector('textarea').value)); toast('Saved! Reloading…'); setTimeout(() => location.reload(), 600); } catch (e) { el.querySelector('.err').textContent = e.message; }
    }
    if (a === 'clear') { localStorage.removeItem('tt.firebase'); location.reload(); }
  });
}

function rulesHTML(map = null) {
  return `
  <div class="rules">
    ${map ? `<div class="rule-map"><h3>${map.name}</h3><p>${map.blurb} Medal objective: <b>${map.objective}</b>.</p></div>` : ''}
    <h3>Goal</h3>
    <p>Win instantly by <b>placing a Troop on the enemy H.Q.</b> or by <b>reaching the map's medal objective</b>. If a player can neither draw nor place on their turn, the game ends: most medals wins, and a tie goes against the player who couldn't act.</p>
    <h3>Setup</h3>
    <p>Each player has 24 Troops (3 copies of strengths 1–7 and the ★ joker). 4 random Troops are removed unseen. The first player starts with 3 Troops on their rack, the other with 4.</p>
    <h3>Your turn: do ONE</h3>
    <ul><li><b>Draw 2</b> Troops from your reserve (rack max 8; draw 1 if only 1 fits or is left).</li>
    <li><b>Place 1 Troop</b>, then apply its effect, then the special base's effect.</li></ul>
    <h3>Where can I place?</h3>
    <ul><li>An empty base, a base with your own Troop on top, or a base whose top enemy Troop is <b>strictly weaker</b>. Place on top: only the top Troop occupies the base.</li>
    <li>The enemy H.Q. (never your own). The H.Q. is <b>not</b> a base.</li>
    <li>The slot must be <b>connected</b> to your H.Q. by paths passing only through bases you occupy. Empty or enemy bases cut the line.</li></ul>
    <h3>Regions & medals</h3>
    <p>A region is a closed zone surrounded by paths and bases. The moment you occupy <b>all bases</b> around it, you take its medals for good (even if you lose control later). Already-taken regions give nothing.</p>
    <h3>Troops</h3>
    <div class="troop-list">${[0, 1, 2, 3, 4, 5, 6, 7].map((t) => `<div class="troop-row">${cardHTML('r' + t + 'a')}<div><b>${TROOPS[t].name}</b> · ${TROOPS[t].title}<br><i>“${TROOPS[t].quote}”</i><br>${TROOPS[t].effect}</div></div>`).join('')}</div>
    <h3>Special bases</h3>
    <p class="note">You may only interact with visible (top) Troops. If a special base would put you over 8 Troops on your rack, you can't apply it.</p>
    <ul>${Object.values(SPECIALS).map((sp) => `<li><b>${sp.name}:</b> ${sp.text}</li>`).join('')}
    <li><b>Bathtub Bay:</b> no special bases, but Blue has two H.Q. and Red has one. Capturing any enemy H.Q. wins.</li></ul>
  </div>`;
}

function rules() {
  screen(`<header class="topbar">${backBtn('home')}<h2>How to play</h2></header>${rulesHTML()}`, 'rules-screen');
}

// --------------------------------------------------------------- navigation
app.addEventListener('click', (ev) => {
  const n = ev.target.closest('[data-nav]');
  if (!n) return;
  ev.preventDefault();
  sfx('tap');
  const to = n.dataset.nav;
  if (to === 'home') home();
  else if (to === 'online') lobby();
  else if (to === 'bot') mapPicker('Practice vs Bot', (id) => startBot(id));
  else if (to === 'bot-resume') playBot(store.get('tt.bot'));
  else if (to === 'local') mapPicker('Pass & Play', (id) => setupLocal(id));
  else if (to === 'local-resume') playLocal(store.get('tt.local'));
  else if (to === 'rules') rules();
  else if (to === 'settings') settings();
});

// Invite links: ?join=CODE
const params = new URLSearchParams(location.search);
if (params.get('join')) {
  sessionStorage.setItem('tt.join', params.get('join'));
  history.replaceState(null, '', location.pathname);
  lobby();
} else {
  home();
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
