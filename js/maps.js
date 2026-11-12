// Map (terrain) data. Coordinates live in a 1000 x 1600 board space.
// Blue H.Q. are always at the top of the data, red at the bottom; the board is
// rotated for the blue player so everyone sees their own H.Q. at the bottom.
//
// node: { x, y, hq?: 'red'|'blue', special?: string, allow?: number[] }
//   special: 'retreat' | 'draw' | 'push' | 'revive' | 'snipe' | 'shield' | 'restrict'
//   allow:   strengths allowed on a restricted base / H.Q. (the joker is always allowed)
// regions: { ring: [nodeIds around the closed zone, in order], medals }

export const SPECIALS = {
  retreat: { name: 'Fort Tower', text: 'You may return 1 of your other visible Troops on the Terrain to your rack.' },
  draw: { name: 'Cupcake Stand', text: 'You may draw 1 Troop from your reserve.' },
  push: { name: 'Toy Volcano', text: 'You may push 1 visible enemy Troop adjacent to this base onto a base adjacent to where it stood (placement rules ignored).' },
  revive: { name: 'Ghost Trunk', text: 'You may return 1 of your Troops from the discard to your rack.' },
  snipe: { name: 'Lookout Post', text: 'Point to 1 Troop on your opponent\'s rack. They cannot place it on their next turn.' },
  shield: { name: 'Force Field', text: 'Troop effects are not applied on this base.' },
  restrict: { name: 'Float Ring', text: 'Only Troops with the listed strengths (or the joker) can be placed here.' },
};

const M = [];

// 1. Backyard Fort ------------------------------------------------------------
M.push({
  id: 'fort', name: 'Backyard Fort', theme: 'fort', objective: 7,
  blurb: 'Fort Towers let you pull a Troop back to your rack.',
  nodes: {
    HB: { x: 500, y: 110, hq: 'blue' },
    L0: { x: 190, y: 260 }, R0: { x: 810, y: 260 },
    C1: { x: 500, y: 450 },
    L1: { x: 160, y: 540, special: 'retreat' }, R1: { x: 840, y: 540, special: 'retreat' },
    L2: { x: 190, y: 800 }, C2: { x: 500, y: 800 }, R2: { x: 810, y: 800 },
    L3: { x: 160, y: 1060, special: 'retreat' }, R3: { x: 840, y: 1060, special: 'retreat' },
    C3: { x: 500, y: 1150 },
    L4: { x: 190, y: 1340 }, R4: { x: 810, y: 1340 },
    HR: { x: 500, y: 1490, hq: 'red' },
  },
  edges: [
    ['HB', 'L0'], ['HB', 'R0'], ['L0', 'C1'], ['R0', 'C1'], ['L0', 'L1'], ['R0', 'R1'],
    ['L1', 'L2'], ['R1', 'R2'], ['L1', 'C2'], ['R1', 'C2'], ['C1', 'C2'], ['L2', 'C2'], ['C2', 'R2'],
    ['L3', 'L2'], ['R3', 'R2'], ['L3', 'C2'], ['R3', 'C2'], ['C3', 'C2'],
    ['L4', 'L3'], ['R4', 'R3'], ['L4', 'C3'], ['R4', 'C3'], ['HR', 'L4'], ['HR', 'R4'],
  ],
  regions: [
    { ring: ['HB', 'L0', 'C1', 'R0'], medals: 2 },
    { ring: ['L0', 'L1', 'C2', 'C1'], medals: 2 },
    { ring: ['R0', 'R1', 'C2', 'C1'], medals: 2 },
    { ring: ['L1', 'L2', 'C2'], medals: 2 },
    { ring: ['R1', 'R2', 'C2'], medals: 2 },
    { ring: ['L3', 'L2', 'C2'], medals: 2 },
    { ring: ['R3', 'R2', 'C2'], medals: 2 },
    { ring: ['L4', 'L3', 'C2', 'C3'], medals: 2 },
    { ring: ['R4', 'R3', 'C2', 'C3'], medals: 2 },
    { ring: ['HR', 'L4', 'C3', 'R4'], medals: 2 },
  ],
});

// 2. Candy Clouds -------------------------------------------------------------
M.push({
  id: 'clouds', name: 'Candy Clouds', theme: 'clouds', objective: 7,
  blurb: 'Cupcake Stands give you an extra draw.',
  nodes: {
    HB: { x: 500, y: 100, hq: 'blue' },
    L1: { x: 170, y: 330 }, S1: { x: 500, y: 430, special: 'draw' }, R1: { x: 830, y: 330 },
    L2: { x: 140, y: 800 }, M1: { x: 340, y: 800 }, S2: { x: 500, y: 800 }, M2: { x: 660, y: 800 }, R2: { x: 860, y: 800 },
    L3: { x: 170, y: 1270 }, S3: { x: 500, y: 1170, special: 'draw' }, R3: { x: 830, y: 1270 },
    HR: { x: 500, y: 1500, hq: 'red' },
  },
  edges: [
    ['HB', 'L1'], ['HB', 'R1'], ['HB', 'S1'], ['L1', 'S1'], ['R1', 'S1'],
    ['L1', 'L2'], ['R1', 'R2'], ['S1', 'S2'], ['L1', 'M1'], ['R1', 'M2'],
    ['L2', 'M1'], ['M1', 'S2'], ['S2', 'M2'], ['M2', 'R2'],
    ['L3', 'M1'], ['R3', 'M2'], ['L2', 'L3'], ['R2', 'R3'], ['S2', 'S3'],
    ['L3', 'S3'], ['R3', 'S3'], ['HR', 'L3'], ['HR', 'R3'], ['HR', 'S3'],
  ],
  regions: [
    { ring: ['HB', 'L1', 'S1'], medals: 1 },
    { ring: ['HB', 'R1', 'S1'], medals: 1 },
    { ring: ['L1', 'M1', 'S2', 'S1'], medals: 2 },
    { ring: ['R1', 'M2', 'S2', 'S1'], medals: 2 },
    { ring: ['L1', 'L2', 'M1'], medals: 1 },
    { ring: ['R1', 'R2', 'M2'], medals: 1 },
    { ring: ['L3', 'L2', 'M1'], medals: 1 },
    { ring: ['R3', 'R2', 'M2'], medals: 1 },
    { ring: ['L3', 'M1', 'S2', 'S3'], medals: 2 },
    { ring: ['R3', 'M2', 'S2', 'S3'], medals: 2 },
    { ring: ['HR', 'L3', 'S3'], medals: 1 },
    { ring: ['HR', 'R3', 'S3'], medals: 1 },
  ],
});

// 3. Lava Sandbox -------------------------------------------------------------
M.push({
  id: 'lava', name: 'Lava Sandbox', theme: 'lava', objective: 7,
  blurb: 'Toy Volcanoes shove enemy Troops around.',
  nodes: {
    HB: { x: 150, y: 120, hq: 'blue' },
    a: { x: 500, y: 300 }, b: { x: 830, y: 300 }, c: { x: 170, y: 360 },
    d: { x: 170, y: 640, special: 'push' }, e: { x: 500, y: 640 }, f: { x: 830, y: 640 },
    g: { x: 170, y: 960 }, h: { x: 500, y: 960 }, i: { x: 830, y: 960, special: 'push' },
    j: { x: 170, y: 1300 }, k: { x: 500, y: 1300 }, l: { x: 830, y: 1240 },
    HR: { x: 850, y: 1480, hq: 'red' },
  },
  edges: [
    ['HB', 'a'], ['HB', 'c'], ['a', 'b'], ['a', 'e'], ['b', 'f'], ['c', 'd'], ['c', 'e'],
    ['d', 'e'], ['e', 'f'], ['d', 'g'], ['e', 'h'], ['f', 'i'],
    ['g', 'h'], ['h', 'i'], ['g', 'j'], ['h', 'k'], ['i', 'l'], ['h', 'l'],
    ['j', 'k'], ['k', 'HR'], ['l', 'HR'],
  ],
  regions: [
    { ring: ['HB', 'a', 'e', 'c'], medals: 1 },
    { ring: ['c', 'e', 'd'], medals: 1 },
    { ring: ['a', 'b', 'f', 'e'], medals: 2 },
    { ring: ['d', 'e', 'h', 'g'], medals: 3 },
    { ring: ['e', 'f', 'i', 'h'], medals: 3 },
    { ring: ['h', 'i', 'l'], medals: 1 },
    { ring: ['g', 'h', 'k', 'j'], medals: 2 },
    { ring: ['h', 'l', 'HR', 'k'], medals: 1 },
  ],
});

// 4. Haunted Attic ------------------------------------------------------------
M.push({
  id: 'attic', name: 'Haunted Attic', theme: 'attic', objective: 6,
  blurb: 'Ghost Trunks bring a fallen Troop back.',
  nodes: {
    HB: { x: 500, y: 100, hq: 'blue' },
    a: { x: 240, y: 290 }, b: { x: 760, y: 290 },
    c: { x: 500, y: 500 },
    d: { x: 140, y: 800, special: 'revive' }, e: { x: 500, y: 800 }, f: { x: 860, y: 800, special: 'revive' },
    g: { x: 500, y: 1100 },
    h: { x: 240, y: 1310 }, i: { x: 760, y: 1310 },
    HR: { x: 500, y: 1500, hq: 'red' },
  },
  edges: [
    ['HB', 'a'], ['HB', 'b'], ['a', 'c'], ['b', 'c'], ['a', 'd'], ['b', 'f'],
    ['c', 'e'], ['d', 'e'], ['e', 'f'], ['d', 'h'], ['f', 'i'], ['e', 'g'],
    ['h', 'g'], ['g', 'i'], ['HR', 'h'], ['HR', 'i'],
  ],
  regions: [
    { ring: ['HB', 'a', 'c', 'b'], medals: 2 },
    { ring: ['a', 'd', 'e', 'c'], medals: 2 },
    { ring: ['b', 'c', 'e', 'f'], medals: 2 },
    { ring: ['d', 'e', 'g', 'h'], medals: 2 },
    { ring: ['e', 'f', 'i', 'g'], medals: 2 },
    { ring: ['HR', 'h', 'g', 'i'], medals: 2 },
  ],
});

// 5. Bathtub Bay (asymmetric: blue has 2 H.Q., red has 1) ----------------------
M.push({
  id: 'bay', name: 'Bathtub Bay', theme: 'bay', objective: 5,
  blurb: 'No special bases, but Blue has two H.Q. and Red only one.',
  nodes: {
    HB1: { x: 130, y: 130, hq: 'blue' }, HB2: { x: 870, y: 130, hq: 'blue' },
    a: { x: 150, y: 420 }, b: { x: 500, y: 330 }, c: { x: 850, y: 420 },
    d: { x: 330, y: 680 }, e: { x: 680, y: 640 },
    f: { x: 150, y: 960 }, g: { x: 500, y: 980 }, h: { x: 850, y: 940 },
    i: { x: 300, y: 1260 }, j: { x: 700, y: 1260 },
    HR: { x: 500, y: 1490, hq: 'red' },
  },
  edges: [
    ['HB1', 'a'], ['HB1', 'b'], ['HB2', 'b'], ['HB2', 'c'],
    ['a', 'd'], ['b', 'd'], ['b', 'e'], ['c', 'e'], ['d', 'e'],
    ['a', 'f'], ['d', 'g'], ['e', 'g'], ['c', 'h'], ['e', 'h'],
    ['f', 'g'], ['g', 'h'], ['f', 'i'], ['g', 'i'], ['g', 'j'], ['h', 'j'],
    ['i', 'HR'], ['j', 'HR'],
  ],
  regions: [
    { ring: ['HB1', 'a', 'd', 'b'], medals: 1 },
    { ring: ['HB2', 'b', 'e', 'c'], medals: 1 },
    { ring: ['b', 'd', 'e'], medals: 1 },
    { ring: ['a', 'f', 'g', 'd'], medals: 2 },
    { ring: ['d', 'g', 'e'], medals: 1 },
    { ring: ['c', 'e', 'h'], medals: 1 },
    { ring: ['e', 'g', 'h'], medals: 1 },
    { ring: ['f', 'i', 'g'], medals: 1 },
    { ring: ['g', 'j', 'h'], medals: 1 },
    { ring: ['g', 'i', 'HR', 'j'], medals: 2 },
  ],
});

// 6. Sandpit Trenches ---------------------------------------------------------
M.push({
  id: 'trenches', name: 'Sandpit Trenches', theme: 'trenches', objective: 8,
  blurb: 'Lookout Posts pin down a Troop in your opponent\'s hand.',
  nodes: {
    HB: { x: 500, y: 110, hq: 'blue' },
    a: { x: 170, y: 250 }, b: { x: 830, y: 250 },
    c: { x: 170, y: 560 }, s1: { x: 500, y: 470, special: 'snipe' }, d: { x: 830, y: 560 },
    e: { x: 330, y: 800 }, f: { x: 670, y: 800 },
    g: { x: 170, y: 1040 }, s2: { x: 500, y: 1130, special: 'snipe' }, h: { x: 830, y: 1040 },
    i: { x: 170, y: 1350 }, j: { x: 830, y: 1350 },
    HR: { x: 500, y: 1490, hq: 'red' },
  },
  edges: [
    ['HB', 'a'], ['HB', 'b'], ['a', 's1'], ['b', 's1'], ['a', 'c'], ['b', 'd'],
    ['c', 's1'], ['d', 's1'], ['c', 'e'], ['s1', 'e'], ['s1', 'f'], ['d', 'f'], ['e', 'f'],
    ['c', 'g'], ['e', 'g'], ['d', 'h'], ['f', 'h'],
    ['e', 's2'], ['f', 's2'], ['g', 's2'], ['h', 's2'],
    ['g', 'i'], ['h', 'j'], ['i', 's2'], ['j', 's2'], ['HR', 'i'], ['HR', 'j'],
  ],
  regions: [
    { ring: ['HB', 'a', 's1', 'b'], medals: 2 },
    { ring: ['a', 'c', 's1'], medals: 1 },
    { ring: ['b', 'd', 's1'], medals: 1 },
    { ring: ['c', 'e', 's1'], medals: 1 },
    { ring: ['s1', 'e', 'f'], medals: 1 },
    { ring: ['s1', 'f', 'd'], medals: 1 },
    { ring: ['c', 'g', 'e'], medals: 1 },
    { ring: ['d', 'h', 'f'], medals: 1 },
    { ring: ['e', 'f', 's2'], medals: 1 },
    { ring: ['e', 'g', 's2'], medals: 1 },
    { ring: ['f', 'h', 's2'], medals: 1 },
    { ring: ['g', 'i', 's2'], medals: 1 },
    { ring: ['h', 'j', 's2'], medals: 1 },
    { ring: ['HR', 'i', 's2', 'j'], medals: 2 },
  ],
});

// 7. Kiddie Pool (placement restrictions) ---------------------------------------
M.push({
  id: 'pool', name: 'Kiddie Pool', theme: 'pool', objective: 7,
  blurb: 'Float Rings and one H.Q. per side only accept certain strengths.',
  nodes: {
    HB1: { x: 150, y: 120, hq: 'blue', allow: [5, 6, 7] }, HB2: { x: 850, y: 120, hq: 'blue' },
    a: { x: 500, y: 270 },
    b: { x: 170, y: 480, special: 'restrict', allow: [1, 2] }, d: { x: 830, y: 480, special: 'restrict', allow: [3, 4, 5] },
    c: { x: 500, y: 560 },
    e: { x: 240, y: 800 }, m: { x: 500, y: 800, special: 'restrict', allow: [6, 7] }, f: { x: 760, y: 800 },
    g: { x: 500, y: 1040 },
    h: { x: 170, y: 1120, special: 'restrict', allow: [3, 4, 5] }, i: { x: 830, y: 1120, special: 'restrict', allow: [1, 2] },
    j: { x: 500, y: 1330 },
    HR1: { x: 150, y: 1480, hq: 'red' }, HR2: { x: 850, y: 1480, hq: 'red', allow: [5, 6, 7] },
  },
  edges: [
    ['HB1', 'a'], ['HB1', 'b'], ['HB2', 'a'], ['HB2', 'd'], ['a', 'c'], ['b', 'c'], ['c', 'd'],
    ['b', 'e'], ['d', 'f'], ['c', 'm'], ['e', 'm'], ['m', 'f'],
    ['e', 'h'], ['f', 'i'], ['m', 'g'], ['h', 'g'], ['g', 'i'], ['g', 'j'],
    ['h', 'HR1'], ['j', 'HR1'], ['j', 'HR2'], ['i', 'HR2'],
  ],
  regions: [
    { ring: ['HB1', 'a', 'c', 'b'], medals: 2 },
    { ring: ['HB2', 'a', 'c', 'd'], medals: 2 },
    { ring: ['b', 'c', 'm', 'e'], medals: 2 },
    { ring: ['d', 'c', 'm', 'f'], medals: 2 },
    { ring: ['e', 'm', 'g', 'h'], medals: 2 },
    { ring: ['f', 'm', 'g', 'i'], medals: 2 },
    { ring: ['HR1', 'h', 'g', 'j'], medals: 2 },
    { ring: ['HR2', 'i', 'g', 'j'], medals: 2 },
  ],
});

// 8. Rocket Room (anti-effect bases) -------------------------------------------
M.push({
  id: 'rocket', name: 'Rocket Room', theme: 'rocket', objective: 8,
  blurb: 'Force Fields switch off Troop effects.',
  nodes: {
    HB: { x: 170, y: 130, hq: 'blue' },
    a: { x: 500, y: 160 }, b: { x: 170, y: 380 }, d: { x: 830, y: 330 },
    c: { x: 500, y: 440 },
    e: { x: 160, y: 640 }, f: { x: 840, y: 620 },
    x1: { x: 290, y: 800, special: 'shield' }, x2: { x: 500, y: 800, special: 'shield' }, x3: { x: 710, y: 800, special: 'shield' },
    g: { x: 160, y: 980 }, h: { x: 840, y: 960 },
    i: { x: 500, y: 1160 },
    j: { x: 170, y: 1270 }, k: { x: 830, y: 1220 }, l: { x: 500, y: 1440 },
    HR: { x: 830, y: 1470, hq: 'red' },
  },
  edges: [
    ['HB', 'a'], ['HB', 'b'], ['a', 'c'], ['a', 'd'], ['c', 'd'], ['b', 'c'], ['b', 'e'],
    ['c', 'f'], ['d', 'f'], ['c', 'x2'], ['x1', 'x2'], ['e', 'x1'], ['f', 'x3'], ['x2', 'x3'],
    ['e', 'g'], ['x1', 'g'], ['h', 'f'], ['h', 'x3'],
    ['HR', 'l'], ['HR', 'k'], ['l', 'i'], ['l', 'j'], ['i', 'j'], ['k', 'i'], ['k', 'h'],
    ['i', 'g'], ['j', 'g'], ['i', 'x2'],
  ],
  regions: [
    { ring: ['HB', 'a', 'c', 'b'], medals: 2 },
    { ring: ['a', 'd', 'c'], medals: 1 },
    { ring: ['c', 'd', 'f'], medals: 1 },
    { ring: ['b', 'c', 'x2', 'x1', 'e'], medals: 2 },
    { ring: ['c', 'f', 'x3', 'x2'], medals: 2 },
    { ring: ['e', 'x1', 'g'], medals: 1 },
    { ring: ['h', 'x3', 'f'], medals: 1 },
    { ring: ['i', 'g', 'x1', 'x2'], medals: 2 },
    { ring: ['k', 'i', 'x2', 'x3', 'h'], medals: 2 },
    { ring: ['i', 'j', 'g'], medals: 1 },
    { ring: ['l', 'j', 'i'], medals: 1 },
    { ring: ['HR', 'l', 'i', 'k'], medals: 2 },
  ],
});

// Derived data ----------------------------------------------------------------
for (const m of M) {
  m.adj = {};
  for (const id in m.nodes) m.adj[id] = [];
  for (const [u, v] of m.edges) { m.adj[u].push(v); m.adj[v].push(u); }
  m.hqs = { red: [], blue: [] };
  for (const id in m.nodes) if (m.nodes[id].hq) m.hqs[m.nodes[id].hq].push(id);
  m.totalMedals = 0;
  for (const r of m.regions) {
    r.bases = r.ring.filter((id) => !m.nodes[id].hq);
    r.x = r.ring.reduce((s, id) => s + m.nodes[id].x, 0) / r.ring.length;
    r.y = r.ring.reduce((s, id) => s + m.nodes[id].y, 0) / r.ring.length;
    m.totalMedals += r.medals;
  }
}

export const MAPS = Object.fromEntries(M.map((m) => [m.id, m]));
export const MAP_LIST = M;
