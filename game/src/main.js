// Boot + satu loop: baca input tiap frame, majukan dunia dengan langkah
// tetap 1/60 detik, lukis apa yang ada. Layar: judul, main, jeda, akhir.
//
// ?seed=N mengunci keacakan. ?shot=start|play|serve|end (&seed=N) menyusun
// adegan itu, melukisnya, lalu set window.__shotReady.
// ?autopilot=1 (&seed=N) menjalankan autopilot headless sampai menang/kalah
// lalu set window.__result — untuk verifikasi, bukan untuk pemain.
import { H, STAR_MARKS, W } from './config.js';
import { createGame, startShift } from './state.js';
import { stepGame } from './sim.js';
import { walkTo } from './chef.js';
import { clickAt, interactNearest } from './stations.js';
import { drawGame } from './render.js';
import { ensureAudio, toggleMute } from './audio.js';
import { runAutopilot, stageShot } from './autopilot.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 7;
const autopilotMode = params.get('autopilot') === '1';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

const G = createGame(seed);
let t = 0;
let last = performance.now();
let acc = 0;
const STEP = 1 / 60;

const keys = new Set();
let mouseDown = false;

function toGameCoords(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * W,
    y: ((e.clientY - r.top) / r.height) * H,
  };
}

function startOrRestart() {
  ensureAudio();
  if (G.phase === 'title' || G.phase === 'won' || G.phase === 'lost') {
    startShift(G);
  }
}

canvas.addEventListener('mousedown', (e) => {
  ensureAudio();
  mouseDown = true;
  const p = toGameCoords(e);
  if (G.phase === 'title' || G.phase === 'won' || G.phase === 'lost') {
    startOrRestart();
    return;
  }
  clickAt(G, p.x, p.y);
});
canvas.addEventListener('mouseup', () => {
  mouseDown = false;
});
canvas.addEventListener('mousemove', (e) => {
  if (!mouseDown) return;
  const p = toGameCoords(e);
  walkTo(G, Math.max(70, Math.min(1210, p.x)));
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    startOrRestart();
    return;
  }
  if (e.key === 'p' || e.key === 'P') {
    if (G.phase === 'play') G.paused = !G.paused;
    return;
  }
  if (e.key === 'm' || e.key === 'M') {
    ensureAudio();
    G.muted = toggleMute();
    return;
  }
  if (e.key === 'e' || e.key === 'E') {
    ensureAudio();
    interactNearest(G);
    return;
  }
  keys.add(e.key.toLowerCase());
  if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

// Satu langkah simulasi 1/60 detik.
function step(dt) {
  t += dt;
  if (G.phase !== 'play' || G.paused) return;
  // Jalan keyboard: A/D atau panah (membatalkan aksi pending).
  const left = keys.has('a') || keys.has('arrowleft');
  const right = keys.has('d') || keys.has('arrowright');
  if (left && !right) {
    G.chef.action = null;
    walkTo(G, G.chef.x - 400 * dt);
    G.chef.targetX = Math.max(70, G.chef.x - 400 * dt);
  } else if (right && !left) {
    G.chef.action = null;
    walkTo(G, G.chef.x + 400 * dt);
    G.chef.targetX = Math.min(1210, G.chef.x + 400 * dt);
  }
  stepGame(G, dt);
}

function frame(now) {
  const dt = Math.min(0.25, (now - last) / 1000);
  last = now;
  acc += dt;
  while (acc >= STEP) {
    step(STEP);
    acc -= STEP;
  }
  drawGame(ctx, G, t);
  if (!window.__shotReady) window.__shotReady = true;
  requestAnimationFrame(frame);
}

if (autopilotMode) {
  // Verifikasi headless: main sampai selesai, laporkan hasil.
  const result = runAutopilot(seed);
  window.__result = result;
  document.getElementById('status').textContent = 'AUTOPILOT ' + JSON.stringify(result);
  // Lukis frame akhir untuk dilihat bila dibuka di browser.
  const G2 = createGame(seed);
  if (result.won) {
    G2.phase = 'won';
    G2.over = { won: true, stars: result.revenue >= STAR_MARKS[2] ? 3 : result.revenue >= STAR_MARKS[1] ? 2 : 1, revenue: result.revenue, served: result.served, burnt: result.burnt, lost: result.lost, bestStreak: result.bestStreak };
    G2.revenue = result.revenue;
    G2.served = result.served;
  } else {
    G2.phase = 'lost';
    G2.over = { won: false, stars: 0, revenue: result.revenue, served: result.served, burnt: result.burnt, lost: result.lost, bestStreak: result.bestStreak };
    G2.revenue = result.revenue;
    G2.served = result.served;
  }
  drawGame(ctx, G2, 0);
  window.__shotReady = true;
} else if (shot) {
  stageShot(G, shot);
  drawGame(ctx, G, 0.6);
  drawGame(ctx, G, 0.6);
  window.__shotReady = true;
  window.__game = G;
} else {
  window.__game = G;
  requestAnimationFrame(frame);
}
