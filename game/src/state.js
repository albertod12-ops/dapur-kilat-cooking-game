// State game: satu objek G yang dibawa ke mana-mana.
// Fase: 'title' (layar judul), 'play', 'won', 'lost'.
// Pesanan, gelombang, skor, streak, timer — semua di sini.
import {
  MAX_TICKETS, PATIENCE, SHIFT_SECONDS, SPAWN_EVERY, STAR_MARKS,
  WAVE_NAMES, WAVE_TARGETS, WIN_TARGET, waveFor,
} from './config.js';
import { RECIPES } from './recipes.js';
import { makeRng, pick } from './random.js';
import { makeCustomer } from './customers.js';

export function createGame(seed) {
  return {
    seed,
    rng: makeRng(seed),
    phase: 'title',
    time: 0,
    timeLeft: SHIFT_SECONDS,
    revenue: 0,
    served: 0,
    burnt: 0,
    lost: 0,
    streak: 0,
    bestStreak: 0,
    wave: 1,
    spawnTimer: 2.5,
    ticketSeq: 0,
    tickets: [],
    chef: { x: 640, targetX: 640, dir: 1, walk: 0, moving: false, hand: null, action: null },
    wok: null, // {ing, t, state:'cooking'|'done'|'burnt'}
    board: null, // {ing, t, state:'chopping'|'done'}
    plate: [], // [{ing, state}] maks 3
    passGlow: 0,
    passFlash: 0,
    trashFlash: 0,
    banner: null, // {text, sub, t, dur}
    floaters: [], // {x, y, text, color, t}
    coins: [], // {x, y, vx, vy, t}
    steam: [], // {x, y, t, life}
    paused: false,
    muted: false,
    over: null, // {won, stars, revenue, served, burnt, lost, bestStreak}
  };
}

export function spawnTicket(G) {
  if (G.tickets.length >= MAX_TICKETS) return false;
  let recipe = pick(G.rng, RECIPES);
  const last = G.tickets[G.tickets.length - 1];
  let guard = 0;
  while (last && recipe.id === last.recipe.id && guard++ < 8) recipe = pick(G.rng, RECIPES);
  const patience = PATIENCE[G.wave - 1];
  G.tickets.push({
    id: ++G.ticketSeq,
    recipe,
    patience,
    maxPatience: patience,
    customer: makeCustomer(G.rng, G.ticketSeq),
    born: G.time,
  });
  return true;
}

export function startShift(G) {
  G.phase = 'play';
  G.time = 0;
  G.timeLeft = SHIFT_SECONDS;
  G.revenue = 0;
  G.served = 0;
  G.burnt = 0;
  G.lost = 0;
  G.streak = 0;
  G.bestStreak = 0;
  G.wave = 1;
  G.spawnTimer = 1.2;
  G.tickets = [];
  G.wok = null;
  G.board = null;
  G.plate = [];
  G.passGlow = 0;
  G.chef.hand = null;
  G.chef.action = null;
  G.chef.x = 640;
  G.chef.targetX = 640;
  G.over = null;
  G.floaters = [];
  G.coins = [];
  G.steam = [];
  showBanner(G, 'GELOMBANG 1 — MULAI', 'Layani pelanggan, capai Rp 45.000');
  spawnTicket(G);
  spawnTicket(G);
}

export function showBanner(G, text, sub) {
  G.banner = { text, sub: sub || '', t: 0, dur: 2.6 };
}

export function addFloater(G, x, y, text, color) {
  G.floaters.push({ x, y, text, color: color || '#ffd166', t: 0 });
}

export function burstCoins(G, x, y, n) {
  for (let i = 0; i < n; i++) {
    G.coins.push({
      x: x + (G.rng() - 0.5) * 140,
      y,
      vx: (G.rng() - 0.5) * 160,
      vy: -140 - G.rng() * 120,
      t: 0,
    });
  }
}

// Update waktu, gelombang, kesabaran tiket, dan akhir shift.
export function updateClocks(G, dt) {
  if (G.phase !== 'play') return;
  G.time += dt;
  G.timeLeft = Math.max(0, SHIFT_SECONDS - G.time);
  const w = waveFor(G.revenue);
  if (w !== G.wave) {
    G.wave = w;
    showBanner(
      G,
      'GELOMBANG ' + w + ' — ' + WAVE_NAMES[w],
      w < 3
        ? 'Target Rp ' + WAVE_TARGETS[w - 1].toLocaleString('id-ID') + ' · pesanan makin cepat!'
        : 'Target akhir Rp 150.000 — puncak keramaian!',
    );
  }
  G.spawnTimer -= dt;
  if (G.spawnTimer <= 0) {
    spawnTicket(G);
    G.spawnTimer = SPAWN_EVERY[G.wave - 1];
  }
  for (let i = G.tickets.length - 1; i >= 0; i--) {
    const tk = G.tickets[i];
    tk.patience -= dt;
    if (tk.patience <= 0) {
      G.tickets.splice(i, 1);
      G.lost++;
      G.streak = 0;
      addFloater(G, 640, 310, 'Pelanggan pergi!', '#ff7a6e');
    }
  }
  if (G.banner) {
    G.banner.t += dt;
    if (G.banner.t > G.banner.dur) G.banner = null;
  }
  for (let i = G.floaters.length - 1; i >= 0; i--) {
    G.floaters[i].t += dt;
    if (G.floaters[i].t > 1.4) G.floaters.splice(i, 1);
  }
  for (let i = G.coins.length - 1; i >= 0; i--) {
    const c = G.coins[i];
    c.t += dt;
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.vy += 420 * dt;
    if (c.t > 0.9) G.coins.splice(i, 1);
  }
  for (let i = G.steam.length - 1; i >= 0; i--) {
    const s = G.steam[i];
    s.t += dt;
    s.y -= 26 * dt;
    if (s.t > s.life) G.steam.splice(i, 1);
  }
  if (G.passGlow > 0) G.passGlow -= dt;
  if (G.passFlash > 0) G.passFlash -= dt;
  if (G.trashFlash > 0) G.trashFlash -= dt;
  if (G.timeLeft <= 0) endShift(G);
}

export function endShift(G) {
  const won = G.revenue >= WIN_TARGET;
  let stars = 0;
  if (won) {
    stars = 1;
    if (G.revenue >= STAR_MARKS[1]) stars = 2;
    if (G.revenue >= STAR_MARKS[2]) stars = 3;
  }
  G.phase = won ? 'won' : 'lost';
  G.over = { won, stars, revenue: G.revenue, served: G.served, burnt: G.burnt, lost: G.lost, bestStreak: G.bestStreak };
}

// Label bahan yang dibawa koki (untuk indikator MEMBAWA).
export function carryLabel(G) {
  const h = G.chef.hand;
  if (!h) return null;
  const names = { nasi: 'Nasi', mie: 'Mie', ayam: 'Ayam', telur: 'Telur', cabai: 'Cabai', sayur: 'Sayur' };
  return names[h.ing] || h.ing;
}
