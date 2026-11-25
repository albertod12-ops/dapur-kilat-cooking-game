// State game: satu objek G yang dibawa ke mana-mana.
// Fase: 'title' (layar judul), 'play', 'won', 'lost'.
// Pesanan, gelombang, skor, streak, timer — semua di sini.
import { MAX_TICKETS, SHIFT_SECONDS, STREAK_MAX, STREAK_STEP, WAVES, WIN_TARGET } from './config.js';
import { INGREDIENTS, RECIPES } from './recipes.js';
import { mulberry32, pick } from './random.js';
import { makeCustomer } from './customers.js';

export function createGame(seed) {
  const rng = mulberry32(seed);
  const G = {
    seed,
    rng,
    phase: 'title',
    time: 0, // detik sejak shift mulai
    timeLeft: SHIFT_SECONDS,
    revenue: 0,
    served: 0,
    burnt: 0,
    lost: 0,
    streak: 0,
    bestStreak: 0,
    waveIndex: 0,
    spawnTimer: 2.5,
    ticketSeq: 0,
    tickets: [],
    chef: { x: 640, targetX: 640, dir: 1, walk: 0, moving: false, carrying: null, action: null, actionT: 0 },
    wok: { slots: [null, null] }, // {ing, t, state:'cooking'|'done'|'burnt'}
    board: { ing: null, progress: 0, chopping: false },
    plates: [{ items: [] }, { items: [] }],
    pass: { glow: 0, flash: 0 },
    trash: { flash: 0 },
    banner: null, // {text, sub, t, dur}
    floaters: [], // {x, y, text, color, t}
    coins: [], // partikel koin terbang {x,y,vx,vy,t}
    steam: [], // partikel uap {x,y,t,life}
    paused: false,
    muted: false,
    over: null, // {won, stars}
    log: [],
  };
  return G;
}

export function waveFor(time) {
  for (let i = 0; i < WAVES.length; i++) {
    if (time < WAVES[i].until) return i;
  }
  return WAVES.length - 1;
}

export function waveOf(G) {
  return WAVES[G.waveIndex];
}

export function streakMult(G) {
  return Math.min(1 + STREAK_STEP * Math.max(0, G.streak - 1), STREAK_MAX);
}

export function spawnTicket(G) {
  if (G.tickets.length >= MAX_TICKETS) return false;
  const wave = waveOf(G);
  // Resep acak, hindari dua tiket sama berturut-turut bila memungkinkan.
  let recipe = pick(G.rng, RECIPES);
  const last = G.tickets[G.tickets.length - 1];
  if (last && RECIPES.length > 1) {
    let guard = 0;
    while (recipe.id === last.recipe.id && guard++ < 8) recipe = pick(G.rng, RECIPES);
  }
  const id = ++G.ticketSeq;
  G.tickets.push({
    id,
    recipe,
    patience: wave.patience,
    maxPatience: wave.patience,
    customer: makeCustomer(G.rng, id),
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
  G.waveIndex = 0;
  G.spawnTimer = 1.2;
  G.tickets = [];
  G.wok.slots = [null, null];
  G.board = { ing: null, progress: 0, chopping: false };
  G.plates = [{ items: [] }, { items: [] }];
  G.pass.glow = 0;
  G.chef.carrying = null;
  G.chef.x = 640;
  G.chef.targetX = 640;
  G.over = null;
  G.floaters = [];
  G.coins = [];
  showBanner(G, 'GELOMBANG 1 — MULAI', 'Layani pelanggan, capai ' + formatTarget(WAVES[0].target));
  spawnTicket(G);
  spawnTicket(G);
}

function formatTarget(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

export function showBanner(G, text, sub) {
  G.banner = { text, sub: sub || '', t: 0, dur: 2.6 };
}

export function addFloater(G, x, y, text, color) {
  G.floaters.push({ x, y, text, color: color || '#ffd166', t: 0 });
}

// Update waktu, gelombang, kesabaran tiket, dan akhir shift.
export function updateClocks(G, dt) {
  if (G.phase !== 'play') return;
  G.time += dt;
  G.timeLeft = Math.max(0, SHIFT_SECONDS - G.time);
  const wi = waveFor(G.time);
  if (wi !== G.waveIndex) {
    G.waveIndex = wi;
    const w = WAVES[wi];
    showBanner(G, 'GELOMBANG ' + (wi + 1) + ' — ' + w.name, 'Target ' + formatTarget(w.target) + ' · pesanan makin cepat!');
  }
  // Spawn pesanan baru.
  G.spawnTimer -= dt;
  if (G.spawnTimer <= 0) {
    spawnTicket(G);
    G.spawnTimer = waveOf(G).spawnEvery;
  }
  // Kesabaran tiket.
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
  // Banner + floater + partikel menua.
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
  if (G.pass.glow > 0) G.pass.glow -= dt;
  if (G.pass.flash > 0) G.pass.flash -= dt;
  if (G.trash.flash > 0) G.trash.flash -= dt;
  // Akhir shift.
  if (G.timeLeft <= 0) endShift(G);
}

export function endShift(G) {
  const won = G.revenue >= WIN_TARGET;
  let stars = 0;
  if (won) {
    stars = 1;
    if (G.revenue >= 200000) stars = 2;
    if (G.revenue >= 260000) stars = 3;
  }
  G.phase = won ? 'won' : 'lost';
  G.over = { won, stars, revenue: G.revenue, served: G.served, burnt: G.burnt, lost: G.lost, bestStreak: G.bestStreak };
}

// Label bahan yang dibawa koki (untuk indikator MEMBAWA).
export function chefCarryLabel(G) {
  const c = G.chef.carrying;
  if (!c) return null;
  return INGREDIENTS[c.ing].name + (c.state === 'burnt' ? ' (hangus!)' : '');
}
