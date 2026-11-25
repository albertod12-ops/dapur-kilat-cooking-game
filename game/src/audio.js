// Suara sintesis WebAudio — tanpa file audio, tanpa network.
// Semua bunyi dibuat dari oscillator/noise di sini, orisinil.
let actx = null;
let muted = false;

export function ensureAudio() {
  if (typeof window === 'undefined') return;
  if (!actx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      actx = new AC();
    } catch {
      actx = null;
    }
  }
  if (actx && actx.state === 'suspended') actx.resume().catch(() => {});
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, vol, slideTo) {
  if (!actx || muted) return;
  try {
    const t0 = actx.currentTime;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g);
    g.connect(actx.destination);
    o.start(t0);
    o.stop(t0 + dur);
  } catch {
    // Suara tidak boleh mematikan game.
  }
}

function noiseBurst(dur, vol, filterFreq) {
  if (!actx || muted) return;
  try {
    const t0 = actx.currentTime;
    const len = Math.floor(actx.sampleRate * dur);
    const buf = actx.createBuffer(1, len, actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = actx.createBufferSource();
    src.buffer = buf;
    const f = actx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = filterFreq;
    const g = actx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(actx.destination);
    src.start(t0);
  } catch {
    // Suara tidak boleh mematikan game.
  }
}

// Desis wok saat bahan masuk.
export function sfxSizzle() {
  noiseBurst(0.5, 0.25, 5200);
}
// Ketok talenan.
export function sfxChop() {
  tone(180, 0.07, 'square', 0.12, 90);
}
// Ding saat masakan matang.
export function sfxDing() {
  tone(880, 0.18, 'sine', 0.16);
  setTimeout(() => tone(1318, 0.25, 'sine', 0.14), 90);
}
// Koin saat pesanan terlayani.
export function sfxCoin() {
  tone(988, 0.1, 'triangle', 0.18);
  setTimeout(() => tone(1319, 0.22, 'triangle', 0.18), 80);
}
// Buzz saat salah / ditolak.
export function sfxBuzz() {
  tone(140, 0.22, 'sawtooth', 0.12, 90);
}
// Pop saat ambil bahan.
export function sfxPop() {
  tone(520, 0.08, 'sine', 0.14, 760);
}
// Lonceng sajikan.
export function sfxBell() {
  tone(1568, 0.4, 'sine', 0.16);
  tone(2093, 0.5, 'sine', 0.1);
}
