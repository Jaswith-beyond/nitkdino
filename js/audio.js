/* Procedural 8-bit synth. Muted by default, zero audio files. */
const SFX = (function () {
  let ctx = null, on = false, master = null;
  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);
  }
  function tone(f0, f1, dur, type, vol, delay) {
    if (!on || !ctx) return;
    const t = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(vol || 1, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.03);
  }
  return {
    toggle() {
      on = !on;
      if (on) { init(); if (ctx && ctx.state === 'suspended') ctx.resume(); this.chime(); }
      return on;
    },
    isOn() { return on; },
    jump()  { tone(330, 780, 0.16, 'square', 0.9); },
    chime() { [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.12, 'square', 0.45, i * 0.065)); },
    tick()  { tone(1500, 1000, 0.03, 'square', 0.22); },
    point() { tone(880, 880, 0.06, 'square', 0.5); tone(1320, 1320, 0.12, 'square', 0.5, 0.08); },
    over()  { [392, 330, 262, 196].forEach((f, i) => tone(f, f * 0.9, 0.16, 'sawtooth', 0.5, i * 0.12)); },
    slam()  { tone(120, 40, 0.5, 'sawtooth', 0.9); tone(900, 200, 0.25, 'square', 0.35); },
    whoosh(){ tone(200, 1400, 0.5, 'sawtooth', 0.25); }
  };
})();
