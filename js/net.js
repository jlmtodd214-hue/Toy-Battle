// Online play over Firebase (anonymous auth + Firestore). Loaded lazily so the
// offline modes work without any configuration.
import { FIREBASE_CONFIG } from './config.js';
import { newGame } from './engine.js';
import { MAP_LIST } from './maps.js';

const V = '10.12.2';
let fb = null; // { auth, db, fs, user }

export function getConfig() {
  if (FIREBASE_CONFIG) return FIREBASE_CONFIG;
  try { const raw = localStorage.getItem('tt.firebase'); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

// Accepts either JSON or the JS snippet the Firebase console shows.
export function parseConfig(text) {
  const out = {};
  for (const k of ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']) {
    const m = text.match(new RegExp(`["']?${k}["']?\\s*:\\s*["']([^"']+)["']`));
    if (m) out[k] = m[1];
  }
  if (!out.apiKey || !out.projectId) throw new Error('Could not find apiKey and projectId in that text.');
  return out;
}

export function saveConfig(cfg) { localStorage.setItem('tt.firebase', JSON.stringify(cfg)); }

export async function connect() {
  if (fb) return fb;
  const cfg = getConfig();
  if (!cfg) throw new Error('Online play is not set up yet.');
  const [{ initializeApp }, authMod, fs] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
  ]);
  const app = initializeApp(cfg);
  const auth = authMod.getAuth(app);
  const db = fs.getFirestore(app);
  const user = await new Promise((resolve, reject) => {
    const off = authMod.onAuthStateChanged(auth, (u) => {
      if (u) { off(); resolve(u); }
    }, reject);
    authMod.signInAnonymously(auth).catch(reject);
  });
  fb = { auth, db, fs, user, uid: user.uid };
  return fb;
}

export const uid = () => fb?.uid;

// ---------------------------------------------------------------- profiles
export async function getProfile() {
  const { db, fs } = await connect();
  const snap = await fs.getDoc(fs.doc(db, 'users', fb.uid));
  return snap.exists() ? snap.data() : null;
}

export async function claimName(name) {
  name = name.trim();
  if (!/^[A-Za-z0-9_ -]{2,16}$/.test(name)) throw new Error('Use 2–16 letters, numbers, spaces, - or _.');
  const { db, fs } = await connect();
  const lower = name.toLowerCase();
  await fs.runTransaction(db, async (tx) => {
    const ref = fs.doc(db, 'usernames', lower);
    const snap = await tx.get(ref);
    if (snap.exists() && snap.data().uid !== fb.uid) throw new Error('That name is taken.');
    const meRef = fs.doc(db, 'users', fb.uid);
    const me = await tx.get(meRef);
    const old = me.exists() ? me.data().nameLower : null;
    if (old && old !== lower) tx.delete(fs.doc(db, 'usernames', old));
    tx.set(ref, { uid: fb.uid });
    tx.set(meRef, { name, nameLower: lower, updatedAt: fs.serverTimestamp() });
  });
  return name;
}

async function lookupName(name) {
  const { db, fs } = await connect();
  const snap = await fs.getDoc(fs.doc(db, 'usernames', name.trim().toLowerCase()));
  if (!snap.exists()) throw new Error(`No player called "${name}".`);
  const u = await fs.getDoc(fs.doc(db, 'users', snap.data().uid));
  return { uid: snap.data().uid, name: u.exists() ? u.data().name : name };
}

// ---------------------------------------------------------------- games
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const makeCode = () => Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
const randomMap = () => MAP_LIST[Math.floor(Math.random() * MAP_LIST.length)].id;

export async function createGame({ mapId, myName, invite = null, isPublic = false }) {
  const { db, fs } = await connect();
  let invited = null;
  if (invite) {
    invited = await lookupName(invite);
    if (invited.uid === fb.uid) throw new Error("You can't challenge yourself.");
  }
  const data = {
    code: makeCode(), mapId: mapId || randomMap(), status: 'waiting', public: isPublic,
    hostUid: fb.uid, hostName: myName,
    invitedUid: invited ? invited.uid : null, invitedName: invited ? invited.name : null,
    playerUids: invited ? [fb.uid, invited.uid] : [fb.uid],
    players: null, stateJson: null, version: 0, turnUid: null, winnerUid: null,
    createdAt: fs.serverTimestamp(), updatedAt: fs.serverTimestamp(),
  };
  const ref = await fs.addDoc(fs.collection(db, 'games'), data);
  return { id: ref.id, ...data };
}

export async function joinGame(gameId, myName) {
  const { db, fs } = await connect();
  const ref = fs.doc(db, 'games', gameId);
  await fs.runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Game not found.');
    const g = snap.data();
    if (g.status !== 'waiting') {
      if (g.playerUids.includes(fb.uid)) return; // already in
      throw new Error('That game has already started.');
    }
    if (g.hostUid === fb.uid) throw new Error('Waiting for someone else to join your game.');
    if (g.invitedUid && g.invitedUid !== fb.uid) throw new Error('This invite is for someone else.');
    const hostRed = Math.random() < 0.5;
    const players = {
      red: hostRed ? { uid: g.hostUid, name: g.hostName } : { uid: fb.uid, name: myName },
      blue: hostRed ? { uid: fb.uid, name: myName } : { uid: g.hostUid, name: g.hostName },
    };
    const state = newGame({ mapId: g.mapId });
    tx.update(ref, {
      status: 'active', players, playerUids: [g.hostUid, fb.uid],
      invitedUid: fb.uid, invitedName: myName,
      stateJson: JSON.stringify(state), version: 1,
      turnUid: players[state.current].uid, updatedAt: fs.serverTimestamp(),
    });
  });
  return gameId;
}

export async function joinByCode(code, myName) {
  const { db, fs } = await connect();
  const q = fs.query(fs.collection(db, 'games'), fs.where('code', '==', code.trim().toUpperCase()), fs.limit(5));
  const snap = await fs.getDocs(q);
  const doc = snap.docs.find((d) => d.data().status === 'waiting') || snap.docs[0];
  if (!doc) throw new Error('No game with that code.');
  return joinGame(doc.id, myName);
}

export async function quickMatch(myName) {
  const { db, fs } = await connect();
  const q = fs.query(fs.collection(db, 'games'), fs.where('status', '==', 'waiting'), fs.where('public', '==', true), fs.limit(20));
  const snap = await fs.getDocs(q);
  const mine = snap.docs.find((d) => d.data().hostUid === fb.uid);
  if (mine) return { id: mine.id, waiting: true };
  for (const d of snap.docs) {
    try { await joinGame(d.id, myName); return { id: d.id, waiting: false }; } catch { /* raced, try next */ }
  }
  const g = await createGame({ mapId: null, myName, isPublic: true });
  return { id: g.id, waiting: true };
}

export async function watchMyGames(cb) {
  const { db, fs } = await connect();
  const q = fs.query(fs.collection(db, 'games'), fs.where('playerUids', 'array-contains', fb.uid));
  return fs.onSnapshot(q, (snap) => {
    const games = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    games.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
    cb(games);
  }, (err) => cb(null, err));
}

export async function watchGame(id, cb) {
  const { db, fs } = await connect();
  return fs.onSnapshot(fs.doc(db, 'games', id), (snap) => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null), (e) => cb(null, e));
}

// Submit the state after finishing a turn. Fails if someone else wrote first.
export async function submitTurn(game, state) {
  const { db, fs } = await connect();
  const ref = fs.doc(db, 'games', game.id);
  await fs.runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const g = snap.data();
    if (g.version !== game.version) throw new Error('This game changed on another device. Reloading.');
    if (g.turnUid !== fb.uid) throw new Error("It's not your turn.");
    const over = state.phase === 'over';
    tx.update(ref, {
      stateJson: JSON.stringify(state), version: g.version + 1,
      turnUid: over ? null : g.players[state.current].uid,
      status: over ? 'finished' : 'active',
      winnerUid: over ? g.players[state.winner].uid : null,
      updatedAt: fs.serverTimestamp(),
    });
  });
}

export async function resign(game) {
  const { db, fs } = await connect();
  const ref = fs.doc(db, 'games', game.id);
  await fs.runTransaction(db, async (tx) => {
    const g = (await tx.get(ref)).data();
    if (g.status !== 'active') return;
    const state = JSON.parse(g.stateJson);
    const myColor = g.players.red.uid === fb.uid ? 'red' : 'blue';
    const winner = myColor === 'red' ? 'blue' : 'red';
    state.phase = 'over'; state.winner = winner; state.reason = 'resign'; state.pending = null;
    state.log.push({ turn: state.turn, kind: 'win', color: winner, reason: 'resign' });
    tx.update(ref, { stateJson: JSON.stringify(state), version: g.version + 1, status: 'finished', turnUid: null, winnerUid: g.players[winner].uid, updatedAt: fs.serverTimestamp() });
  });
}

export async function removeGame(game) {
  const { db, fs } = await connect();
  const ref = fs.doc(db, 'games', game.id);
  if (game.status === 'waiting' && game.hostUid === fb.uid) return fs.deleteDoc(ref);
  // decline an invite / hide a finished game: drop yourself from the list
  return fs.updateDoc(ref, {
    playerUids: game.playerUids.filter((u) => u !== fb.uid),
    ...(game.status === 'waiting' ? { invitedUid: null, invitedName: null } : {}),
    updatedAt: fs.serverTimestamp(),
  });
}
