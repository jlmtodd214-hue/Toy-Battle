// Rules engine. Pure functions over a plain JSON state, so it runs the same in
// the browser, in tests (node) and for the practice bot.
import { MAPS } from './maps.js';

export const RACK_MAX = 8;
export const COPIES = ['a', 'b', 'c'];
export const STRENGTHS = [0, 1, 2, 3, 4, 5, 6, 7]; // 0 = joker
export const COLORS = ['red', 'blue'];

export const other = (c) => (c === 'red' ? 'blue' : 'red');
export const typeOf = (id) => +id[1];
export const ownerOf = (id) => (id[0] === 'r' ? 'red' : 'blue');

// ---------------------------------------------------------------- randomness
function rand(s) {
  s.rng = (s.rng + 0x6d2b79f5) | 0;
  let t = s.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function shuffle(s, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand(s) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------- setup
export function newGame({ mapId, seed = (Math.random() * 2 ** 31) | 0, first = null }) {
  if (!MAPS[mapId]) throw new Error('Unknown map ' + mapId);
  const s = {
    v: 1, mapId, rng: seed | 0,
    players: {}, stacks: {}, taken: {}, discard: [],
    current: null, turn: 1, phase: 'action',
    queue: { troop: [], base: [] }, pending: null,
    winner: null, reason: null, log: [],
  };
  for (const c of COLORS) {
    const ids = [];
    for (const t of STRENGTHS) for (const k of COPIES) ids.push(c[0] + t + k);
    shuffle(s, ids);
    ids.splice(0, 4); // 4 Troops go back to the box unseen
    s.players[c] = { rack: [], reserve: ids, medals: 0, locked: [] };
  }
  s.current = first || (rand(s) < 0.5 ? 'red' : 'blue');
  drawInto(s, s.current, 3);
  drawInto(s, other(s.current), 4);
  log(s, { kind: 'start', color: s.current });
  return s;
}

// ---------------------------------------------------------------- helpers
export const mapOf = (s) => MAPS[s.mapId];
export const topOf = (s, node) => {
  const st = s.stacks[node];
  return st && st.length ? st[st.length - 1] : null;
};
const clone = (s) => JSON.parse(JSON.stringify(s));

function log(s, e) {
  s.log.push({ turn: s.turn, ...e });
  if (s.log.length > 120) s.log.splice(0, s.log.length - 120);
}

function drawInto(s, color, n) {
  const p = s.players[color];
  const k = Math.min(n, RACK_MAX - p.rack.length, p.reserve.length);
  for (let i = 0; i < k; i++) p.rack.push(p.reserve.pop());
  return k;
}

export const drawableCount = (s, color, n) => {
  const p = s.players[color];
  return Math.max(0, Math.min(n, RACK_MAX - p.rack.length, p.reserve.length));
};

export const canDraw = (s, color) => drawableCount(s, color, 2) > 0;

function allowed(node, t) {
  return !node.allow || t === 0 || node.allow.includes(t);
}

function canCover(color, t, topId) {
  if (ownerOf(topId) === color) return true;
  if (t === 0) return true; // the joker may cover any enemy Troop
  const tt = typeOf(topId);
  if (tt === 0) return true; // any Troop may cover an enemy joker
  return t > tt;
}

// Is `target` connected to one of `color`'s H.Q. through bases that `color` occupies?
export function isConnected(s, color, target) {
  const m = mapOf(s);
  const seen = new Set(m.hqs[color]);
  const q = [...m.hqs[color]];
  while (q.length) {
    const u = q.shift();
    for (const w of m.adj[u]) {
      if (w === target) return true;
      if (seen.has(w) || m.nodes[w].hq) continue;
      const top = topOf(s, w);
      if (top && ownerOf(top) === color) { seen.add(w); q.push(w); }
    }
  }
  return false;
}

export function canPlaceType(s, color, t, nodeId) {
  const node = mapOf(s).nodes[nodeId];
  if (!allowed(node, t)) return false;
  if (node.hq) return node.hq !== color && isConnected(s, color, nodeId);
  const top = topOf(s, nodeId);
  if (top && !canCover(color, t, top)) return false;
  // Paper-plane (4): ignore the connection rule for bases (not on Force Fields).
  if (t === 4 && node.special !== 'shield') return true;
  return isConnected(s, color, nodeId);
}

export function legalNodesForType(s, color, t) {
  return Object.keys(mapOf(s).nodes).filter((n) => canPlaceType(s, color, t, n));
}

export const placeableRack = (s, color) => {
  const p = s.players[color];
  const locked = [...p.locked];
  return p.rack.filter((id) => {
    const i = locked.indexOf(id);
    if (i >= 0) { locked.splice(i, 1); return false; }
    return true;
  });
};

export function anyPlacement(s, color) {
  const types = new Set(placeableRack(s, color).map(typeOf));
  for (const t of types) if (legalNodesForType(s, color, t).length) return true;
  return false;
}

// ---------------------------------------------------------------- core steps
function checkRegions(s) {
  const m = mapOf(s);
  for (const c of [s.current, other(s.current)]) {
    m.regions.forEach((r, i) => {
      if (s.taken[i]) return;
      if (r.bases.every((b) => { const t = topOf(s, b); return t && ownerOf(t) === c; })) {
        s.taken[i] = c;
        s.players[c].medals += r.medals;
        log(s, { kind: 'region', color: c, region: i, medals: r.medals });
      }
    });
    if (s.players[c].medals >= m.objective) return finish(s, c, 'medals');
  }
}

function finish(s, winner, reason) {
  s.winner = winner;
  s.reason = reason;
  s.phase = 'over';
  s.pending = null;
  log(s, { kind: 'win', color: winner, reason });
}

function removeFromRack(p, id) {
  const i = p.rack.indexOf(id);
  if (i < 0) throw new Error('Troop not on rack');
  p.rack.splice(i, 1);
  const j = p.locked.indexOf(id);
  if (j >= 0) p.locked.splice(j, 1);
}

function doPlace(s, color, id, nodeId, extra) {
  const m = mapOf(s);
  const node = m.nodes[nodeId];
  const t = typeOf(id);
  removeFromRack(s.players[color], id);
  const covered = topOf(s, nodeId);
  (s.stacks[nodeId] ||= []).push(id);
  log(s, { kind: 'place', color, id, node: nodeId, covered, extra: !!extra });
  if (node.hq) return finish(s, color, 'hq');
  checkRegions(s);
  if (s.phase === 'over') return;
  if (node.special !== 'shield' && [1, 2, 3, 5, 6].includes(t)) {
    s.queue.troop.unshift({ t, node: nodeId, id });
  }
  if (['retreat', 'draw', 'push', 'revive', 'snipe'].includes(node.special)) {
    s.queue.base.push({ special: node.special, node: nodeId, id });
  }
}

function enemyNeighbors(s, color, nodeId) {
  const m = mapOf(s);
  return m.adj[nodeId].filter((n) => {
    if (m.nodes[n].hq) return false;
    const t = topOf(s, n);
    return t && ownerOf(t) !== color;
  });
}

export function pushDestinations(s, from) {
  const m = mapOf(s);
  return m.adj[from].filter((n) => !m.nodes[n].hq);
}

function startTroopEffect(s, e) {
  const c = s.current;
  if (topOf(s, e.node) !== e.id) return; // no longer visible
  switch (e.t) {
    case 1: case 6: {
      const n = drawableCount(s, c, e.t === 1 ? 2 : 1);
      if (n) s.pending = { kind: 'draw', n, src: e.t, node: e.node };
      break;
    }
    case 2: {
      if (anyPlacement(s, c)) s.pending = { kind: 'extra', src: 2, node: e.node };
      break;
    }
    case 3: {
      const targets = enemyNeighbors(s, c, e.node);
      if (targets.length) s.pending = { kind: 'smash', src: 3, node: e.node, targets };
      break;
    }
    case 5: {
      if (s.players[other(c)].rack.length) s.pending = { kind: 'steal', src: 5, node: e.node };
      break;
    }
  }
}

function startBaseEffect(s, e) {
  const c = s.current;
  const m = mapOf(s);
  if (topOf(s, e.node) !== e.id) return;
  const p = s.players[c];
  switch (e.special) {
    case 'retreat': {
      if (p.rack.length >= RACK_MAX) break;
      const targets = Object.keys(s.stacks).filter((n) => {
        const t = topOf(s, n);
        return n !== e.node && t && ownerOf(t) === c;
      });
      if (targets.length) s.pending = { kind: 'retreat', src: 'retreat', node: e.node, targets };
      break;
    }
    case 'draw': {
      if (drawableCount(s, c, 1)) s.pending = { kind: 'draw', n: 1, src: 'draw', node: e.node };
      break;
    }
    case 'push': {
      const targets = enemyNeighbors(s, c, e.node).filter((n) => pushDestinations(s, n).length);
      if (targets.length) s.pending = { kind: 'push', src: 'push', node: e.node, targets };
      break;
    }
    case 'revive': {
      if (p.rack.length >= RACK_MAX) break;
      const targets = [...new Set(s.discard.filter((id) => ownerOf(id) === c))];
      if (targets.length) s.pending = { kind: 'revive', src: 'revive', node: e.node, targets };
      break;
    }
    case 'snipe': {
      const opp = s.players[other(c)];
      if (opp.rack.length > opp.locked.length) s.pending = { kind: 'snipe', src: 'snipe', node: e.node, mandatory: true };
      break;
    }
  }
  void m;
}

function advance(s) {
  while (!s.pending && s.phase !== 'over') {
    if (s.queue.troop.length) { startTroopEffect(s, s.queue.troop.shift()); continue; }
    if (s.queue.base.length) { startBaseEffect(s, s.queue.base.shift()); continue; }
    endTurn(s);
    return;
  }
}

function endTurn(s) {
  s.players[s.current].locked = []; // a pinned Troop is available again at the end of its owner's turn
  log(s, { kind: 'end', color: s.current });
  s.current = other(s.current);
  s.turn += 1;
  s.phase = 'action';
  s.queue = { troop: [], base: [] };
  if (!canDraw(s, s.current) && !anyPlacement(s, s.current)) {
    const me = s.players[s.current].medals;
    const op = s.players[other(s.current)].medals;
    finish(s, me > op ? s.current : other(s.current), 'stuck');
  }
}

// ---------------------------------------------------------------- public API
// action: { type: 'draw' }
//       | { type: 'place', id, node }
//       | { type: 'choose', skip?, use?, node?, dest?, id?, index? }
export function apply(state, action) {
  const s = clone(state);
  if (s.phase === 'over') throw new Error('Game is over');
  const c = s.current;
  const p = s.players[c];

  if (action.type === 'draw') {
    if (s.pending || s.phase !== 'action') throw new Error('Not now');
    const n = drawInto(s, c, 2);
    if (!n) throw new Error('Cannot draw');
    log(s, { kind: 'draw', color: c, n });
    endTurn(s);
    return s;
  }

  if (action.type === 'place') {
    if (s.pending || s.phase !== 'action') throw new Error('Not now');
    if (!placeableRack(s, c).includes(action.id)) throw new Error('Troop not available');
    if (!canPlaceType(s, c, typeOf(action.id), action.node)) throw new Error('Illegal placement');
    s.phase = 'resolving';
    doPlace(s, c, action.id, action.node, false);
    advance(s);
    return s;
  }

  if (action.type === 'choose') {
    const pd = s.pending;
    if (!pd) throw new Error('Nothing to choose');
    s.pending = null;
    if (action.skip) {
      if (pd.mandatory) throw new Error('This effect is mandatory');
      log(s, { kind: 'skip', color: c, src: pd.src });
      advance(s);
      return s;
    }
    switch (pd.kind) {
      case 'draw': {
        const n = drawInto(s, c, pd.n);
        log(s, { kind: 'draw', color: c, n, src: pd.src });
        break;
      }
      case 'extra': {
        if (!placeableRack(s, c).includes(action.id)) throw new Error('Troop not available');
        if (!canPlaceType(s, c, typeOf(action.id), action.node)) throw new Error('Illegal placement');
        doPlace(s, c, action.id, action.node, true);
        break;
      }
      case 'smash': {
        if (!pd.targets.includes(action.node)) throw new Error('Bad target');
        const id = s.stacks[action.node].pop();
        s.discard.push(id);
        log(s, { kind: 'smash', color: c, id, node: action.node });
        checkRegions(s);
        break;
      }
      case 'steal': {
        const opp = s.players[other(c)];
        const i = Math.floor(rand(s) * opp.rack.length);
        const id = opp.rack[i];
        removeFromRack(opp, id);
        s.discard.push(id);
        log(s, { kind: 'steal', color: c, id });
        break;
      }
      case 'retreat': {
        if (!pd.targets.includes(action.node)) throw new Error('Bad target');
        const id = s.stacks[action.node].pop();
        p.rack.push(id);
        log(s, { kind: 'retreat', color: c, id, node: action.node });
        checkRegions(s);
        break;
      }
      case 'push': {
        if (!pd.targets.includes(action.node)) throw new Error('Bad target');
        if (!pushDestinations(s, action.node).includes(action.dest)) throw new Error('Bad destination');
        const id = s.stacks[action.node].pop();
        (s.stacks[action.dest] ||= []).push(id);
        log(s, { kind: 'push', color: c, id, node: action.node, dest: action.dest });
        checkRegions(s);
        break;
      }
      case 'revive': {
        const i = s.discard.indexOf(action.id);
        if (i < 0 || ownerOf(action.id) !== c) throw new Error('Bad target');
        s.discard.splice(i, 1);
        p.rack.push(action.id);
        log(s, { kind: 'revive', color: c, id: action.id });
        break;
      }
      case 'snipe': {
        const opp = s.players[other(c)];
        const id = opp.rack[action.index];
        if (!id) throw new Error('Bad target');
        const lockedCount = opp.locked.filter((x) => x === id).length;
        const total = opp.rack.filter((x) => x === id).length;
        if (lockedCount >= total) throw new Error('Already pinned');
        opp.locked.push(id);
        log(s, { kind: 'snipe', color: c, index: action.index });
        break;
      }
      default:
        throw new Error('Unknown choice');
    }
    advance(s);
    return s;
  }
  throw new Error('Unknown action');
}

// Opponent's rack as the viewer sees it: which slots are pinned (laid down).
export function lockedSlots(s, color) {
  const p = s.players[color];
  const left = [...p.locked];
  return p.rack.map((id) => {
    const i = left.indexOf(id);
    if (i >= 0) { left.splice(i, 1); return true; }
    return false;
  });
}
