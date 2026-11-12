// A simple practice opponent: greedy one-step look-ahead with a few heuristics.
import * as E from './engine.js';

function distances(m, from) {
  const d = {};
  const q = [...from];
  for (const f of from) d[f] = 0;
  while (q.length) {
    const u = q.shift();
    for (const w of m.adj[u]) if (d[w] === undefined) { d[w] = d[u] + 1; q.push(w); }
  }
  return d;
}

function scorePlacement(s, me, id, node, level) {
  const m = E.mapOf(s);
  const t = E.typeOf(id);
  let s2;
  try { s2 = E.apply(s, s.pending ? { type: 'choose', id, node } : { type: 'place', id, node }); } catch { return -Infinity; }
  if (s2.winner === me) return 1e6;
  if (s2.winner && s2.winner !== me) return -1e6;
  const dist = distances(m, m.hqs[E.other(me)]);
  let sc = 0;
  sc += 60 * (s2.players[me].medals - s.players[me].medals);
  sc -= 40 * (s2.players[E.other(me)].medals - s.players[E.other(me)].medals);
  const covered = E.topOf(s, node);
  if (covered && E.ownerOf(covered) !== me) sc += 10 + E.typeOf(covered) * 2;
  if (covered && E.ownerOf(covered) === me) sc -= 6;
  sc -= 3 * (dist[node] ?? 5);
  sc -= t === 0 ? 4 : t * 1.2;
  if ([1, 2, 3, 5, 6].includes(t) && m.nodes[node].special !== 'shield') sc += 4;
  if (m.nodes[node].special && m.nodes[node].special !== 'shield') sc += 5;
  // Is the enemy threatening our H.Q.? Prefer blocking nodes next to it.
  const myDist = distances(m, m.hqs[me]);
  if ((myDist[node] ?? 9) <= 1) sc += 6;
  if (level === 'easy') sc += Math.random() * 25;
  else sc += Math.random() * 3;
  return sc;
}

function bestPlacement(s, me, level) {
  let best = null;
  const seen = new Set();
  for (const id of E.placeableRack(s, me)) {
    const t = E.typeOf(id);
    if (seen.has(t)) continue;
    seen.add(t);
    for (const node of E.legalNodesForType(s, me, t)) {
      const sc = scorePlacement(s, me, id, node, level);
      if (!best || sc > best.sc) best = { id, node, sc };
    }
  }
  return best;
}

export function botAction(s, level = 'normal') {
  const me = s.current;
  const pd = s.pending;
  if (!pd) {
    const best = bestPlacement(s, me, level);
    const rack = s.players[me].rack.length;
    let drawScore = -Infinity;
    if (E.canDraw(s, me)) drawScore = rack <= 1 ? 40 : rack <= 3 ? 8 : -20;
    if (!best || drawScore > best.sc) {
      if (E.canDraw(s, me)) return { type: 'draw' };
    }
    return { type: 'place', id: best.id, node: best.node };
  }
  const topType = (n) => E.typeOf(E.topOf(s, n));
  switch (pd.kind) {
    case 'draw': return { type: 'choose', use: true };
    case 'steal': return { type: 'choose', use: true };
    case 'extra': {
      const best = bestPlacement(s, me, level);
      return best && best.sc > -60 ? { type: 'choose', id: best.id, node: best.node } : { type: 'choose', skip: true };
    }
    case 'smash': {
      const node = [...pd.targets].sort((a, b) => topType(b) - topType(a))[0];
      return { type: 'choose', node };
    }
    case 'push': {
      const node = [...pd.targets].sort((a, b) => topType(b) - topType(a))[0];
      const dests = E.pushDestinations(s, node);
      const rank = (d) => {
        const t = E.topOf(s, d);
        if (!t) return 0;
        return E.ownerOf(t) === me ? 2 : 1;
      };
      const dest = [...dests].sort((a, b) => rank(a) - rank(b))[0];
      return { type: 'choose', node, dest };
    }
    case 'retreat': {
      if (s.players[me].rack.length > 1) return { type: 'choose', skip: true };
      const node = [...pd.targets].sort((a, b) => topType(b) - topType(a))[0];
      return { type: 'choose', node };
    }
    case 'revive': {
      const id = [...pd.targets].sort((a, b) => E.typeOf(b) - E.typeOf(a))[0];
      return { type: 'choose', id };
    }
    case 'snipe': {
      const slots = E.lockedSlots(s, E.other(me));
      const free = slots.map((l, i) => (l ? -1 : i)).filter((i) => i >= 0);
      return { type: 'choose', index: free[Math.floor(Math.random() * free.length)] };
    }
  }
  return { type: 'choose', skip: true };
}

// Convenience for tests: the next action for the current player.
export function botTurnActions(s, _color, level) { return [botAction(s, level)]; }
