// Run with: node tests/engine.test.mjs
import assert from 'node:assert/strict';
import { MAP_LIST, MAPS } from '../js/maps.js';
import * as E from '../js/engine.js';
import { botTurnActions } from '../js/bot.js';

let passed = 0;
const test = (name, fn) => {
  try { fn(); passed++; } catch (e) { console.error('FAIL', name, '\n', e); process.exitCode = 1; }
};

// Build a bare state with chosen racks for targeted rule tests.
function bare(mapId, { red = [], blue = [], current = 'red' } = {}) {
  const s = E.newGame({ mapId, seed: 1, first: current });
  s.players.red.rack = [...red];
  s.players.blue.rack = [...blue];
  s.players.red.reserve = ['r7a', 'r7b', 'r6a', 'r6b', 'r5a'];
  s.players.blue.reserve = ['b7a', 'b7b', 'b6a', 'b6b', 'b5a'];
  return s;
}

test('maps are well formed', () => {
  for (const m of MAP_LIST) {
    for (const [u, v] of m.edges) assert.ok(m.nodes[u] && m.nodes[v], `${m.id} edge ${u}-${v}`);
    for (const r of m.regions) {
      for (let i = 0; i < r.ring.length; i++) {
        const a = r.ring[i], b = r.ring[(i + 1) % r.ring.length];
        assert.ok(m.adj[a].includes(b), `${m.id} region ring ${a}-${b} is not a path`);
      }
    }
    assert.ok(m.hqs.red.length && m.hqs.blue.length, m.id + ' has HQs');
    assert.ok(m.objective <= m.totalMedals, m.id + ' objective reachable');
  }
});

test('setup: 20 troops each, 3/4 on racks', () => {
  const s = E.newGame({ mapId: 'fort', seed: 42, first: 'red' });
  assert.equal(s.players.red.rack.length, 3);
  assert.equal(s.players.blue.rack.length, 4);
  assert.equal(s.players.red.rack.length + s.players.red.reserve.length, 20);
  assert.equal(s.players.blue.rack.length + s.players.blue.reserve.length, 20);
});

test('connection rule and covering', () => {
  let s = bare('fort', { red: ['r3a', 'r5a'], blue: ['b4a'] });
  assert.ok(E.canPlaceType(s, 'red', 3, 'L4'));
  assert.ok(!E.canPlaceType(s, 'red', 3, 'L3'), 'not connected');
  assert.ok(!E.canPlaceType(s, 'red', 3, 'HR'), 'own HQ');
  s = E.apply(s, { type: 'place', id: 'r3a', node: 'L4' });
  assert.equal(s.current, 'blue');
  // blue paper plane (4) ignores connection, covers red 3
  assert.ok(E.canPlaceType(s, 'blue', 4, 'L4'));
  s = E.apply(s, { type: 'place', id: 'b4a', node: 'L4' });
  assert.equal(E.topOf(s, 'L4'), 'b4a');
  // red 5 can cover blue 4; red 3 could not
  assert.ok(!E.canPlaceType(s, 'red', 3, 'L4'));
  assert.ok(E.canPlaceType(s, 'red', 5, 'L4'));
  // enemy-occupied base cuts connection: red cannot reach L3 through L4
  assert.ok(!E.canPlaceType(s, 'red', 5, 'L3'));
});

test('joker covers anything and is covered by anything', () => {
  const s = bare('fort', { red: ['r0a', 'r1a'] });
  s.stacks.L4 = ['b7a'];
  assert.ok(E.canPlaceType(s, 'red', 0, 'L4'));
  assert.ok(!E.canPlaceType(s, 'red', 1, 'L4'));
  s.stacks.L4 = ['b0a'];
  assert.ok(E.canPlaceType(s, 'red', 1, 'L4'));
});

test('plane cannot jump onto a force field, and effects do not trigger there', () => {
  const s = bare('rocket', { red: ['r4a', 'r6a'] });
  assert.ok(!E.canPlaceType(s, 'red', 4, 'x2'));
  assert.ok(E.canPlaceType(s, 'red', 4, 'c'));
  s.stacks.l = ['r7c']; s.stacks.i = ['r7a'];
  const s2 = E.apply(s, { type: 'place', id: 'r6a', node: 'x2' });
  assert.equal(s2.pending, null, 'teddy draw suppressed on force field');
  assert.equal(s2.current, 'blue');
});

test('restricted bases and HQ', () => {
  const s = bare('pool', { red: ['r1a', 'r3a', 'r0a'] });
  s.stacks.j = ['r7a']; s.stacks.g = ['r7b'];
  assert.ok(!E.canPlaceType(s, 'red', 3, 'i'));
  assert.ok(E.canPlaceType(s, 'red', 1, 'i'));
  assert.ok(E.canPlaceType(s, 'red', 0, 'i'));
});

test('HQ capture wins immediately', () => {
  const s = bare('attic', { red: ['r2a'] });
  s.stacks.a = ['r1a']; s.stacks.h = ['r1b']; s.stacks.d = ['r1c'];
  const s2 = E.apply(s, { type: 'place', id: 'r2a', node: 'HB' });
  assert.equal(s2.winner, 'red');
  assert.equal(s2.reason, 'hq');
});

test('regions award medals once', () => {
  let s = bare('attic', { red: ['r7a'], blue: ['b1a'] });
  s.stacks.h = ['r1a']; s.stacks.g = ['r1b'];
  s = E.apply(s, { type: 'place', id: 'r7a', node: 'i' });
  assert.equal(s.players.red.medals, 2);
  assert.equal(s.taken[5], 'red');
});

test('drummer extra placement resolves troop effects before base effects', () => {
  let s = bare('clouds', { red: ['r2a', 'r6a'] });
  s = E.apply(s, { type: 'place', id: 'r2a', node: 'S3' });
  assert.equal(s.pending.kind, 'extra');
  s = E.apply(s, { type: 'choose', id: 'r6a', node: 'L3' });
  assert.equal(s.pending.kind, 'draw');
  assert.equal(s.pending.src, 6, 'teddy first');
  s = E.apply(s, { type: 'choose', use: true });
  assert.equal(s.pending.src, 'draw', 'then cupcake stand');
  s = E.apply(s, { type: 'choose', skip: true });
  assert.equal(s.current, 'blue');
});

test('bricks smashes an adjacent enemy', () => {
  let s = bare('fort', { red: ['r3a'] });
  s.stacks.L4 = ['r1a']; s.stacks.L3 = ['r1b']; s.stacks.L2 = []; s.stacks.C2 = ['b2a'];
  s = E.apply(s, { type: 'place', id: 'r3a', node: 'L2' });
  assert.equal(s.pending.kind, 'smash');
  s = E.apply(s, { type: 'choose', node: 'C2' });
  assert.deepEqual(s.discard, ['b2a']);
});

test('magnet steals from rack, lookout pins a troop', () => {
  let s = bare('trenches', { red: ['r5a', 'r1a'], blue: ['b7a', 'b6a'] });
  s.stacks.i = ['r7a'];
  s = E.apply(s, { type: 'place', id: 'r5a', node: 's2' });
  assert.equal(s.pending.kind, 'steal');
  s = E.apply(s, { type: 'choose', use: true });
  assert.equal(s.players.blue.rack.length, 1);
  assert.equal(s.pending.kind, 'snipe');
  assert.throws(() => E.apply(s, { type: 'choose', skip: true }));
  s = E.apply(s, { type: 'choose', index: 0 });
  assert.equal(s.current, 'blue');
  assert.equal(s.players.blue.locked.length, 1);
  assert.equal(E.placeableRack(s, 'blue').length, 0);
  s = E.apply(s, { type: 'draw' });
  assert.equal(s.players.blue.locked.length, 0, 'unpinned at end of their turn');
});

test('fort tower retreat and ghost trunk revive and volcano push', () => {
  let s = bare('fort', { red: ['r6a'] });
  s.stacks.L4 = ['r1a']; s.stacks.L3 = ['r1b']; s.stacks.L2 = ['r2b'];
  s = E.apply(s, { type: 'place', id: 'r6a', node: 'L1' });
  s = E.apply(s, { type: 'choose', skip: true }); // teddy draw
  assert.equal(s.pending.kind, 'retreat');
  s = E.apply(s, { type: 'choose', node: 'L2' });
  assert.ok(s.players.red.rack.includes('r2b'));

  s = bare('attic', { red: ['r7a'] });
  s.discard = ['r3a', 'b3a'];
  s.stacks.h = ['r1a'];
  s = E.apply(s, { type: 'place', id: 'r7a', node: 'd' });
  assert.deepEqual(s.pending.targets, ['r3a']);
  s = E.apply(s, { type: 'choose', id: 'r3a' });
  assert.ok(s.players.red.rack.includes('r3a'));

  s = bare('lava', { red: ['r7a'] });
  s.stacks.k = ['r1a']; s.stacks.h = ['r1b']; s.stacks.f = ['b2a'];
  s = E.apply(s, { type: 'place', id: 'r7a', node: 'i' });
  assert.equal(s.pending.kind, 'push');
  assert.deepEqual(s.pending.targets, ['f']);
  s = E.apply(s, { type: 'choose', node: 'f', dest: 'b' });
  assert.equal(E.topOf(s, 'b'), 'b2a');
});

test('random bot games always terminate without errors', () => {
  for (const m of MAP_LIST) {
    for (let g = 0; g < 25; g++) {
      let s = E.newGame({ mapId: m.id, seed: g * 7919 + 3 });
      let steps = 0;
      while (s.phase !== 'over' && steps < 2000) {
        for (const a of botTurnActions(s, s.current, g % 2 ? 'easy' : 'normal')) {
          s = E.apply(s, a);
          steps++;
          if (s.phase === 'over' || (!s.pending && s.phase === 'action')) break;
        }
      }
      assert.equal(s.phase, 'over', `${m.id} game ${g} ended`);
    }
  }
});

console.log(`${passed} tests passed`);
void MAPS;
