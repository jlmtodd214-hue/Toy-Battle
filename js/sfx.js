// Tiny synthesized sound effects (no audio files needed).
let ctx = null;
let muted = false;
try { muted = localStorage.getItem('tt.muted') === '1'; } catch { /* ignore */ }
export const isMuted = () => muted;
export function setMuted(v) { muted = v; try { localStorage.setItem('tt.muted', v ? '1' : '0'); } catch { /* ignore */ } }

const SOUNDS = {
  tap: [[660, 0.04, 'triangle']],
  place: [[220, 0.08, 'square'], [440, 0.1, 'triangle']],
  draw: [[520, 0.06, 'triangle'], [780, 0.08, 'triangle']],
  medal: [[784, 0.08, 'triangle'], [988, 0.08, 'triangle'], [1319, 0.16, 'triangle']],
  turn: [[440, 0.07, 'sine'], [660, 0.1, 'sine']],
  win: [[523, 0.1, 'triangle'], [659, 0.1, 'triangle'], [784, 0.1, 'triangle'], [1047, 0.3, 'triangle']],
  lose: [[392, 0.15, 'sawtooth'], [330, 0.15, 'sawtooth'], [262, 0.3, 'sawtooth']],
};

export function sfx(name) {
  if (muted || !SOUNDS[name]) return;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    let t = ctx.currentTime;
    for (const [f, d, type] of SOUNDS[name]) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d);
      t += d * 0.9;
    }
  } catch { /* audio unavailable */ }
}
