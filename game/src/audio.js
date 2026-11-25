// All sound is synthesised with WebAudio: sizzles, chops, dings and a little jingle.
// No audio files, no network. M toggles mute; the game starts silent until first input.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let musicTimer = null;

  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, gain, when = 0, slideTo = null) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, gain, when = 0, freq = 1200) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const g = ac.createGain();
    g.gain.value = gain;
    src.connect(filter).connect(g).connect(ac.destination);
    src.start(t0);
  }

  const api = {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    pick() { tone(520, 0.07, 'triangle', 0.12); },
    chop() { noise(0.08, 0.25, 0, 900); tone(180, 0.06, 'square', 0.08); },
    sizzle() { noise(0.35, 0.12, 0, 3200); },
    ding() { tone(880, 0.18, 'sine', 0.16); tone(1320, 0.25, 'sine', 0.12, 0.09); },
    serve() {
      tone(660, 0.1, 'triangle', 0.14);
      tone(880, 0.1, 'triangle', 0.14, 0.09);
      tone(1100, 0.22, 'triangle', 0.14, 0.18);
    },
    bad() { tone(220, 0.22, 'sawtooth', 0.1, 0, 140); },
    burn() { noise(0.4, 0.2, 0, 500); tone(160, 0.4, 'sawtooth', 0.1, 0, 90); },
    click() { tone(700, 0.05, 'triangle', 0.08); },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.13));
    },
    startMusic() {
      if (musicTimer !== null || muted) return;
      const notes = [262, 330, 392, 330, 294, 330, 392, 494];
      let i = 0;
      musicTimer = window.setInterval(() => {
        if (muted) return;
        tone(notes[i % notes.length], 0.16, 'sine', 0.04);
        i += 1;
      }, 340);
    },
    stopMusic() {
      if (musicTimer !== null) { window.clearInterval(musicTimer); musicTimer = null; }
    },
  };
  return api;
}
