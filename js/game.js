// The in-game screen: board, HUD, hand (drag or tap to deploy), effect prompts.
import * as E from './engine.js';
import { MAPS, SPECIALS } from './maps.js';
import { renderStatic, renderDynamic, contentBox } from './board.js';
import { TROOPS, TEAM, cardHTML, cardBackHTML, troopArt } from './troops.js';
import { sfx } from './sfx.js';

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tName = (id) => `${TROOPS[E.typeOf(id)].name} (${E.typeOf(id) === 0 ? '★' : E.typeOf(id)})`;

export function describeEvent(e, viewer, names) {
  const who = e.color === viewer ? 'You' : esc(names[e.color]);
  const your = (id) => (E.ownerOf(id) === viewer ? 'your' : `${esc(names[E.ownerOf(id)])}'s`);
  switch (e.kind) {
    case 'place': return `${who} placed ${tName(e.id)}${e.covered ? ` on top of ${your(e.covered)} ${tName(e.covered)}` : ''}${e.extra ? ' (extra)' : ''}.`;
    case 'draw': return `${who} drew ${e.n} Troop${e.n > 1 ? 's' : ''}.`;
    case 'smash': return `${who} smashed ${your(e.id)} ${tName(e.id)}.`;
    case 'steal': return `${who} blasted ${your(e.id)} ${tName(e.id)} from the rack.`;
    case 'retreat': return `${who} pulled ${tName(e.id)} back to the rack.`;
    case 'push': return `${who} pushed ${your(e.id)} ${tName(e.id)}.`;
    case 'revive': return `${who} revived ${tName(e.id)}.`;
    case 'snipe': return `${who} pinned down a Troop on ${e.color === viewer ? "the opponent's" : 'your'} rack.`;
    case 'region': return `${who} captured a region: +${e.medals} medal${e.medals > 1 ? 's' : ''}!`;
    default: return '';
  }
}

export class GameView {
  constructor(root, opts) {
    this.root = root;
    this.o = opts; // { state, names, mode, myColor?, onCommit, onExit, botLevel }
    this.s = opts.state;
    this.m = MAPS[this.s.mapId];
    this.sel = null; // selected card id
    this.ghost = null; // { id, node }
    this.pushFrom = null;
    this.fresh = new Set();
    this.recent = new Set();
    this.recap = null;
    this.busy = false;
    this.root.innerHTML = this.shell();
    this.bind();
    window.addEventListener('resize', this._resize = () => this.fitBoard());
    this.showRecapFor(this.s, true);
    this.render();
  }

  get viewer() { return this.o.mode === 'local' ? this.s.current : this.o.myColor; }
  get myTurn() { return this.s.phase !== 'over' && this.s.current === this.viewer && !this.busy && !this.passScreen; }

  shell() {
    return `
    <div class="game">
      <header class="hud hud-top"></header>
      <div class="board-wrap"><div class="board-holder"><div class="bl-static"></div><div class="bl-dyn"></div></div><div class="toast-layer"></div></div>
      <footer class="hand-area">
        <div class="prompt"></div>
        <div class="hud-me"></div>
        <div class="hand-row">
          <button class="draw-btn" type="button"></button>
          <div class="hand"></div>
        </div>
        <div class="rack-meter"></div>
      </footer>
      <div class="turn-banner"></div>
      <div class="drag-layer"></div>
      <div class="sheet-layer"></div>
    </div>`;
  }

  $(sel) { return this.root.querySelector(sel); }

  // ------------------------------------------------------------ updates
  setState(s, { animate = true } = {}) {
    const prev = this.s;
    this.fresh = animate ? this.diffNodes(prev, s) : new Set();
    this.s = s;
    if (s.current !== prev.current || s.phase === 'over') { this.sel = null; this.ghost = null; this.pushFrom = null; }
    this.render();
  }

  // When a new remote state arrives (online) — show what the opponent did.
  receive(s) {
    if (s.turn === this.s.turn && JSON.stringify(s) === JSON.stringify(this.s)) return;
    const prev = this.s;
    this.setState(s);
    if (s.turn > prev.turn) this.showRecapFor(s);
  }

  diffNodes(a, b) {
    const out = new Set();
    for (const n in b.stacks) if (E.topOf(a, n) !== E.topOf(b, n) && E.topOf(b, n)) out.add(n);
    return out;
  }

  showRecapFor(s, initial = false) {
    const viewer = this.viewer;
    if (s.phase === 'over' && initial) return;
    // last finished turn of the opponent
    const ends = s.log.filter((e) => e.kind === 'end');
    const last = ends[ends.length - 1];
    if (!last || last.color === viewer) return;
    const evs = s.log.filter((e) => e.turn === last.turn && e.color === last.color && !['end', 'skip', 'start'].includes(e.kind));
    if (!evs.length) return;
    this.recent = new Set(evs.flatMap((e) => [e.node, e.dest].filter(Boolean)));
    this.recap = { color: last.color, lines: evs.map((e) => describeEvent(e, viewer, this.o.names)).filter(Boolean) };
    if (!initial) sfx('turn');
  }

  // ------------------------------------------------------------ rendering
  render() {
    const s = this.s, m = this.m, me = this.viewer, op = E.other(me);
    const flip = me === 'blue';
    const highlight = this.highlights();
    const key = m.id + flip;
    if (this.staticKey !== key) { this.$('.bl-static').innerHTML = renderStatic(m, { flip }); this.staticKey = key; }
    this.$('.bl-dyn').innerHTML = renderDynamic(s, m, {
      flip, highlight, ghost: this.ghost, fresh: this.fresh, recent: this.recent,
    });
    this.$('.board-wrap').style.setProperty('--board-img', `url(assets/boards/${m.id}-${flip ? 'b' : 'r'}.jpg)`);
    this.fresh = new Set();

    // top HUD (opponent)
    const P = s.players;
    const lockedOp = E.lockedSlots(s, op);
    const sniping = this.myTurn && s.pending?.kind === 'snipe';
    this.$('.game').dataset.theme = m.theme;
    const plate = (c, who) => `
      <div class="plate ${c} ${s.current === c && s.phase !== 'over' ? 'active' : ''}">
        <div class="plate-avatar">${troopArt(who === 'op' ? 7 : 2, c)}</div>
        <div class="plate-info"><div class="pname">${esc(this.o.names[c])}</div><div class="plate-sub">Reserve ${P[c].reserve.length} · Rack ${P[c].rack.length}/8</div></div>
        <div class="plate-medals"><img src="assets/medal.png" alt=""><b>${P[c].medals}</b><small>/${m.objective}</small></div>
      </div>`;
    this.$('.hud-top').innerHTML = `
      <button class="icon-btn back" data-act="menu" aria-label="Menu">☰</button>
      ${plate(op, 'op')}
      <div class="op-rack ${sniping ? 'sniping' : ''}">${P[op].rack.map((_, i) => cardBackHTML(op, lockedOp[i], i)).join('')}</div>`;

    // my HUD
    const turnText = s.phase === 'over' ? 'Game over'
      : this.passScreen ? '' : s.current === me ? (s.pending ? 'Resolve effect' : 'Your turn') : `${esc(this.o.names[op])}'s turn…`;
    this.$('.hud-me').innerHTML = `
      ${plate(me, 'me')}
      <div class="turn-pill ${s.current === me ? 'mine' : ''}">${turnText}</div>
      <button class="discard-btn" data-act="discard">🗑 ${s.discard.length}</button>`;

    // rack meter (8 slots)
    const lockedMe = E.lockedSlots(s, me);
    this.$('.rack-meter').innerHTML = `<div class="rm-bar ${me}">${[...Array(8)].map((_, i) => `<i class="${i < P[me].rack.length ? (lockedMe[i] ? 'on pin' : 'on') : ''}"></i>`).join('')}</div><span class="rm-label">${P[me].rack.length}<small>/8</small></span>`;

    // big "your turn" banner when the turn comes to you
    const mineNow = this.myTurn && !s.pending;
    if (mineNow && !this.wasMine && s.phase !== 'over') {
      const tb = this.$('.turn-banner');
      tb.innerHTML = `<div class="tb-inner ${me}">YOUR TURN!</div>`;
      tb.classList.remove('show'); void tb.offsetWidth; tb.classList.add('show');
    }
    this.wasMine = mineNow;

    // draw button
    const canDraw = this.myTurn && !s.pending && E.canDraw(s, me);
    const n = E.drawableCount(s, me, 2);
    this.$('.draw-btn').className = `draw-btn ${me} ${canDraw ? '' : 'disabled'}`;
    this.$('.draw-btn').innerHTML = `<div class="db-card">${cardBackHTML(me)}<b>+${n || 2}</b></div><small>Draw · ${P[me].reserve.length} left</small>`;

    // hand: group duplicates
    const hand = this.$('.hand');
    if (this.passScreen) {
      hand.innerHTML = '';
    } else {
      const lockedMine = E.lockedSlots(s, me);
      const groups = new Map();
      P[me].rack.forEach((id, i) => {
        const key = E.typeOf(id) + (lockedMine[i] ? 'L' : '');
        if (!groups.has(key)) groups.set(key, { ids: [], locked: lockedMine[i], t: E.typeOf(id) });
        groups.get(key).ids.push(id);
      });
      const arr = [...groups.values()].sort((a, b) => a.t - b.t || a.locked - b.locked);
      const selectable = this.canSelectCards();
      hand.innerHTML = arr.map((g) => cardHTML(g.ids[0], {
        count: g.ids.length, locked: g.locked,
        extraClass: `${this.sel && E.typeOf(this.sel) === g.t && !g.locked ? 'selected' : ''} ${selectable && !g.locked && this.legalFor(g.t).length ? 'ready' : ''}`,
      })).join('') || '<div class="empty-hand">No Troops on your rack — draw!</div>';
    }

    this.renderPrompt();
    this.renderOverlay();
    const g = this.$('.game'), tray = this.$('.hand-area').offsetHeight, top = this.$('.hud-top').offsetHeight;
    g.style.setProperty('--tray-h', tray + 'px');
    g.style.setProperty('--top-h', Math.max(0, top - 22) + 'px');
    this.fitBoard();
  }

  // Zoom the board so the playable area fills the space between the HUD and the tray.
  fitBoard() {
    const holder = this.$('.board-holder');
    const cw = holder.clientWidth, ch = holder.clientHeight;
    if (!cw || !ch) return;
    const b = contentBox(this.m, this.viewer === 'blue');
    let w = b.x1 - b.x0, h = b.y1 - b.y0;
    const ca = cw / ch;
    if (w / h > ca) h = w / ca; else w = h * ca;
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    const vb = `${(cx - w / 2).toFixed(1)} ${(cy - h / 2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
    holder.querySelectorAll('svg.board').forEach((el) => el.setAttribute('viewBox', vb));
  }

  canSelectCards() {
    if (!this.myTurn) return false;
    const pd = this.s.pending;
    return !pd || pd.kind === 'extra';
  }

  legalFor(t) { return E.legalNodesForType(this.s, this.viewer, t); }

  highlights() {
    const out = [];
    if (!this.myTurn) return out;
    const pd = this.s.pending;
    if (this.sel && this.canSelectCards()) for (const n of this.legalFor(E.typeOf(this.sel))) out.push([n, 'place']);
    if (pd?.kind === 'smash') pd.targets.forEach((n) => out.push([n, 'target']));
    if (pd?.kind === 'retreat') pd.targets.forEach((n) => out.push([n, 'own']));
    if (pd?.kind === 'push') {
      if (!this.pushFrom) pd.targets.forEach((n) => out.push([n, 'target']));
      else E.pushDestinations(this.s, this.pushFrom).forEach((n) => out.push([n, 'dest']));
    }
    return out;
  }

  renderPrompt() {
    const el = this.$('.prompt');
    const s = this.s, pd = s.pending;
    let html = '';
    if (this.recap && !this.ghost) {
      html = `<div class="bar recap ${this.recap.color}"><div class="txt">${this.recap.lines.map((l) => `<div>${l}</div>`).join('')}</div>
        <button class="btn small" data-act="dismiss-recap">OK</button></div>`;
    } else if (this.ghost) {
      const t = E.typeOf(this.ghost.id);
      html = `<div class="bar confirm"><div class="txt"><b>Deploy ${TROOPS[t].name}?</b> <span>${TROOPS[t].effect}</span></div>
        <button class="btn ghosty small" data-act="cancel">✕</button><button class="btn go" data-act="confirm">Deploy</button></div>`;
    } else if (this.myTurn && pd) {
      const label = (txt, skip = true, extra = '') => `<div class="bar effect"><div class="txt">${txt}</div>${extra}${skip && !pd.mandatory ? '<button class="btn ghosty small" data-act="skip">Skip</button>' : ''}</div>`;
      const src = typeof pd.src === 'number' ? TROOPS[pd.src].name : SPECIALS[pd.src]?.name;
      switch (pd.kind) {
        case 'draw': html = label(`<b>${src}:</b> draw ${pd.n} Troop${pd.n > 1 ? 's' : ''} from your reserve?`, true, '<button class="btn go" data-act="use">Draw</button>'); break;
        case 'steal': html = label(`<b>${src}:</b> blast 1 random Troop off your opponent's rack and discard it?`, true, '<button class="btn go" data-act="use">Blast!</button>'); break;
        case 'extra': html = label(`<b>${src}:</b> pick a card and place 1 extra Troop.`); break;
        case 'smash': html = label(`<b>${src}:</b> tap an adjacent enemy Troop to smash it.`); break;
        case 'retreat': html = label(`<b>${src}:</b> tap one of your other Troops to return it to your rack.`); break;
        case 'push': html = this.pushFrom ? label(`<b>${src}:</b> tap where to push it.`, true, '<button class="btn ghosty small" data-act="push-back">Back</button>')
          : label(`<b>${src}:</b> tap an adjacent enemy Troop to push.`); break;
        case 'revive': html = label(`<b>${src}:</b> bring one of your Troops back from the discard.`, true, '<button class="btn go" data-act="revive">Choose</button>'); break;
        case 'snipe': html = label(`<b>${src}:</b> point at a card on your opponent's rack (top). They can't place it next turn.`, false); break;
      }
    } else if (this.sel && this.myTurn) {
      const t = E.typeOf(this.sel);
      const legal = this.legalFor(t).length;
      html = `<div class="bar info"><div class="txt"><b>${TROOPS[t].name}</b> · ${TROOPS[t].title}<br><span>${TROOPS[t].effect}</span>${legal ? '' : '<br><em>No legal slot right now.</em>'}</div></div>`;
    } else if (this.myTurn && !pd) {
      html = '<div class="bar hint"><div class="txt">Drag a card onto a glowing slot, or tap a card then a slot. Or draw 2.</div></div>';
    }
    el.innerHTML = html;
  }

  renderOverlay() {
    const layer = this.$('.sheet-layer');
    const s = this.s;
    if (this.passScreen) {
      layer.innerHTML = `<div class="overlay pass ${s.current}"><div class="panel">
        <h2>${esc(this.o.names[s.current])}'s turn</h2><p>Pass the phone, then tap when ready.</p>
        <button class="btn go big" data-act="ready">I'm ${esc(this.o.names[s.current])}</button></div></div>`;
      return;
    }
    if (s.phase === 'over' && !this.dismissedOver) {
      const won = this.o.mode === 'local' ? null : s.winner === this.viewer;
      const reason = { hq: 'H.Q. captured!', medals: 'Medal objective reached!', stuck: 'A player could not draw or place — most medals wins (ties go against the stuck player).', resign: 'Opponent resigned.' }[s.reason] || '';
      layer.innerHTML = `<div class="overlay over"><div class="panel ${s.winner}">
        <div class="trophy">${troopArt(7, s.winner, 'idle')}</div>
        <h2>${won === null ? `${esc(this.o.names[s.winner])} wins!` : won ? 'Victory!' : 'Defeat'}</h2>
        <p>${reason}</p><p class="score">${esc(this.o.names.red)} ${s.players.red.medals} – ${s.players.blue.medals} ${esc(this.o.names.blue)}</p>
        <div class="row"><button class="btn ghosty" data-act="see-board">See board</button>
        ${this.o.onRematch ? '<button class="btn go" data-act="rematch">Rematch</button>' : ''}
        <button class="btn" data-act="exit">Home</button></div></div></div>`;
      return;
    }
    if (!layer.querySelector('.sheet')) layer.innerHTML = '';
  }

  // ------------------------------------------------------------ sheets
  sheet(html) {
    this.$('.sheet-layer').innerHTML = `<div class="sheet-bg" data-act="close-sheet"></div><div class="sheet">${html}<button class="btn ghosty" data-act="close-sheet">Close</button></div>`;
  }

  nodeInfo(nodeId) {
    const n = this.m.nodes[nodeId];
    const st = this.s.stacks[nodeId] || [];
    let title = n.hq ? `${TEAM[n.hq].name} H.Q.` : n.special ? SPECIALS[n.special].name : 'Base';
    let text = n.hq ? 'Place a Troop on the enemy H.Q. to win instantly. It must be connected to your H.Q.' : n.special ? SPECIALS[n.special].text : 'An ordinary base.';
    if (n.allow) text += ` Allowed: ★ ${n.allow.join(', ')}.`;
    this.sheet(`<h3>${title}</h3><p>${text}</p>
      ${st.length ? `<h4>Stack (top first)</h4><div class="stack-list">${[...st].reverse().map((id) => cardHTML(id)).join('')}</div>` : ''}`);
  }

  // ------------------------------------------------------------ actions
  act(action) {
    let next;
    try { next = E.apply(this.s, action); } catch (e) { this.toast(e.message); return; }
    const prev = this.s;
    this.sel = null; this.ghost = null; this.pushFrom = null; this.recap = null; this.recent = new Set();
    const newRegions = next.log.slice(prev.log.length).filter((e) => e.kind === 'region' && e.color === this.viewer);
    if (action.type === 'place' || action.id) sfx('place');
    if (newRegions.length) { sfx('medal'); this.toast(`+${newRegions.reduce((a, e) => a + e.medals, 0)} medals!`, 'gold'); }
    const lines = next.log.slice(prev.log.length).filter((e) => ['smash', 'steal', 'push', 'revive', 'retreat'].includes(e.kind));
    for (const e of lines) this.toast(describeEvent(e, this.viewer, this.o.names));
    this.setState(next);
    const turnOver = next.phase === 'over' || next.current !== prev.current;
    if (turnOver) {
      if (next.phase === 'over') sfx(next.winner === this.viewer ? 'win' : 'lose');
      if (this.o.mode === 'local' && next.phase !== 'over') { this.passScreen = true; this.render(); }
      this.o.onCommit?.(next, this);
    }
  }

  toast(msg, cls = '') {
    const el = document.createElement('div');
    el.className = `toast ${cls}`;
    el.innerHTML = msg;
    this.$('.toast-layer').appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  tapNode(nodeId) {
    const s = this.s, pd = s.pending;
    if (!this.myTurn) return this.nodeInfo(nodeId);
    if (this.ghost) { this.ghost = null; this.render(); return; }
    if (this.sel && this.canSelectCards()) {
      if (this.legalFor(E.typeOf(this.sel)).includes(nodeId)) {
        this.ghost = { id: this.sel, node: nodeId };
        sfx('tap');
        return this.render();
      }
      this.sel = null;
      return this.render();
    }
    if (pd?.kind === 'smash' && pd.targets.includes(nodeId)) return this.act({ type: 'choose', node: nodeId });
    if (pd?.kind === 'retreat' && pd.targets.includes(nodeId)) return this.act({ type: 'choose', node: nodeId });
    if (pd?.kind === 'push') {
      if (!this.pushFrom && pd.targets.includes(nodeId)) { this.pushFrom = nodeId; return this.render(); }
      if (this.pushFrom && E.pushDestinations(s, this.pushFrom).includes(nodeId)) return this.act({ type: 'choose', node: this.pushFrom, dest: nodeId });
    }
    this.nodeInfo(nodeId);
  }

  confirmGhost() {
    const { id, node } = this.ghost;
    if (this.s.pending?.kind === 'extra') this.act({ type: 'choose', id, node });
    else this.act({ type: 'place', id, node });
  }

  pickCard(type) {
    const me = this.viewer;
    const avail = E.placeableRack(this.s, me).filter((id) => E.typeOf(id) === type);
    return avail[0] || null;
  }

  // ------------------------------------------------------------ input
  bind() {
    const root = this.root;
    root.addEventListener('click', (ev) => {
      const a = ev.target.closest('[data-act]');
      if (a) return this.onAct(a.dataset.act, a);
      const hit = ev.target.closest('.hit');
      if (hit && !this.dragging) return this.tapNode(hit.dataset.node);
      const back = ev.target.closest('.op-rack .card-back');
      if (back && this.myTurn && this.s.pending?.kind === 'snipe') {
        if (back.classList.contains('locked')) return this.toast('Already pinned.');
        return this.act({ type: 'choose', index: +back.dataset.index });
      }
      const card = ev.target.closest('.hand .card');
      if (card && !this.suppressClick) return this.onCardTap(card);
      const dbtn = ev.target.closest('.draw-btn');
      if (dbtn) return this.onDraw();
    });

    // drag & drop from the hand (Clash Royale style)
    const hand = this.$('.hand');
    hand.addEventListener('pointerdown', (ev) => {
      const card = ev.target.closest('.card');
      if (!card || card.classList.contains('locked') || !this.canSelectCards()) return;
      this.dragStart = { x: ev.clientX, y: ev.clientY, card, id: ev.pointerId };
    });
    window.addEventListener('pointermove', this._mv = (ev) => {
      const d = this.dragStart;
      if (!d || d.id !== ev.pointerId) return;
      const dx = ev.clientX - d.x, dy = ev.clientY - d.y;
      if (!this.dragging) {
        if (dy < -12 && Math.abs(dy) > Math.abs(dx)) this.beginDrag(d.card, ev);
        else if (Math.abs(dx) > 12) { this.dragStart = null; }
        return;
      }
      ev.preventDefault();
      this.moveDrag(ev);
    }, { passive: false });
    window.addEventListener('pointerup', this._up = (ev) => {
      if (this.dragging) this.endDrag(ev);
      this.dragStart = null;
    });
    window.addEventListener('pointercancel', this._cancel = () => { if (this.dragging) this.cancelDrag(); this.dragStart = null; });
  }

  destroy() {
    window.removeEventListener('pointermove', this._mv);
    window.removeEventListener('pointerup', this._up);
    window.removeEventListener('pointercancel', this._cancel);
    window.removeEventListener('resize', this._resize);
    clearTimeout(this.botTimer);
  }

  beginDrag(card, ev) {
    const type = +card.dataset.type;
    const id = this.pickCard(type);
    if (!id) return;
    this.dragging = { id, type, over: null };
    this.sel = id; this.ghost = null; this.recap = null;
    this.render();
    const fl = document.createElement('div');
    fl.className = 'drag-card';
    fl.innerHTML = cardHTML(id);
    this.$('.drag-layer').appendChild(fl);
    this.dragEl = fl;
    this.moveDrag(ev);
    sfx('tap');
  }

  moveDrag(ev) {
    const fl = this.dragEl;
    fl.style.transform = `translate(${ev.clientX}px, ${ev.clientY}px)`;
    fl.style.visibility = 'hidden';
    const under = document.elementFromPoint(ev.clientX, ev.clientY - 30);
    fl.style.visibility = '';
    const hit = under?.closest?.('.hit');
    const node = hit?.dataset.node || null;
    const legal = node && this.legalFor(this.dragging.type).includes(node);
    fl.classList.toggle('over-legal', !!legal);
    this.root.querySelectorAll('.hl g.hover, .hl .hover').forEach((g) => g.classList.remove('hover'));
    if (legal) this.root.querySelector(`.hl [data-node="${node}"]`)?.classList.add('hover');
    this.dragging.over = legal ? node : null;
  }

  endDrag() {
    const d = this.dragging;
    this.dragEl?.remove();
    this.dragging = null;
    this.suppressClick = true;
    setTimeout(() => { this.suppressClick = false; }, 50);
    if (d.over) { this.ghost = { id: d.id, node: d.over }; sfx('tap'); }
    this.render();
  }

  cancelDrag() { this.dragEl?.remove(); this.dragging = null; this.render(); }

  onCardTap(card) {
    if (!this.canSelectCards()) {
      const id = card.dataset.id;
      this.sheet(`<div class="card-detail">${cardHTML(id)}<div><h3>${TROOPS[E.typeOf(id)].name}</h3><p><i>“${TROOPS[E.typeOf(id)].quote}”</i></p><p>${TROOPS[E.typeOf(id)].effect}</p></div></div>`);
      return;
    }
    if (card.classList.contains('locked')) return this.toast('Pinned down this turn.');
    const type = +card.dataset.type;
    if (this.sel && E.typeOf(this.sel) === type) this.sel = null;
    else this.sel = this.pickCard(type);
    this.ghost = null; this.recap = null;
    sfx('tap');
    this.render();
  }

  onDraw() {
    if (!this.myTurn || this.s.pending) return;
    if (!E.canDraw(this.s, this.viewer)) return this.toast(this.s.players[this.viewer].rack.length >= E.RACK_MAX ? 'Your rack is full (8).' : 'Your reserve is empty.');
    this.sheet(`<h3>Draw ${E.drawableCount(this.s, this.viewer, 2)} Troop(s)?</h3><p>This uses your whole turn.</p><button class="btn go big" data-act="do-draw">Draw</button>`);
  }

  onAct(act, el) {
    switch (act) {
      case 'confirm': return this.confirmGhost();
      case 'cancel': this.ghost = null; return this.render();
      case 'skip': return this.act({ type: 'choose', skip: true });
      case 'use': return this.act({ type: 'choose', use: true });
      case 'push-back': this.pushFrom = null; return this.render();
      case 'dismiss-recap': this.recap = null; this.recent = new Set(); return this.render();
      case 'do-draw': this.$('.sheet-layer').innerHTML = ''; sfx('draw'); return this.act({ type: 'draw' });
      case 'close-sheet': this.$('.sheet-layer').innerHTML = ''; return this.renderOverlay();
      case 'ready': this.passScreen = false; this.showRecapFor(this.s); return this.render();
      case 'see-board': this.dismissedOver = true; return this.render();
      case 'exit': return this.o.onExit?.();
      case 'rematch': return this.o.onRematch?.();
      case 'revive': {
        const ids = this.s.pending.targets;
        this.sheet(`<h3>Revive a Troop</h3><div class="stack-list pick">${ids.map((id) => `<div data-act="revive-pick" data-id="${id}">${cardHTML(id)}</div>`).join('')}</div>`);
        return;
      }
      case 'revive-pick': {
        const id = el.dataset.id;
        this.$('.sheet-layer').innerHTML = '';
        return this.act({ type: 'choose', id });
      }
      case 'discard': {
        const d = this.s.discard;
        this.sheet(`<h3>Discard (${d.length})</h3>${d.length ? `<div class="stack-list">${[...d].reverse().map((id) => cardHTML(id)).join('')}</div>` : '<p>Empty.</p>'}`);
        return;
      }
      case 'menu': return this.o.onMenu ? this.o.onMenu(this) : this.o.onExit?.();
    }
  }
}
