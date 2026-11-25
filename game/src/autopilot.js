// Autopilot deterministik + staged screenshot.
// Dua job, satu file: (1) main otomatis dengan logika game yang sama
// (teleport + doStationAction) untuk membuktikan shift bisa dimenangkan;
// (2) susun adegan deterministik untuk 4 screenshot (?shot=...).
import { COOK_TIME, SHIFT_SECONDS, STATION_X, binCenterX } from './config.js';
import { INGREDIENTS, RECIPES, RECIPE_BY_ID, missingItems, plateMatches, stationFor } from './recipes.js';
import { createGame, spawnTicket, startShift } from './state.js';
import { stepGame } from './sim.js';
import { doStationAction, recipeForPlateItems } from './stations.js';
import { makeCustomer } from './customers.js';

const DT = 1 / 60;

function teleport(G, x) {
  G.chef.x = x;
  G.chef.targetX = x;
  G.chef.moving = false;
}

function act(G, kind, data) {
  doStationAction(G, { kind, ...(data || {}) });
}

function binX(ing) {
  const idx = INGREDIENTS.findIndex((g) => g.id === ing);
  return binCenterX(idx);
}

// Susun adegan deterministik untuk screenshot. G sudah startShift.
export function stageShot(G, kind) {
  if (kind === 'start') {
    G.phase = 'title';
    return;
  }
  startShift(G);
  if (kind === 'play') {
    // Cover: semua C1 dalam satu pandangan.
    G.time = 15;
    G.timeLeft = SHIFT_SECONDS - 15;
    G.revenue = 42;
    G.streak = 2;
    G.bestStreak = 2;
    G.tickets = [];
    const ids = ['nasgor', 'miegor', 'geprek', 'nasiayam'];
    const pats = [34, 22, 41, 12];
    ids.forEach((rid, i) => {
      G.tickets.push({
        id: ++G.ticketSeq,
        recipe: RECIPE_BY_ID[rid],
        patience: pats[i],
        maxPatience: 48,
        customer: makeCustomer(G.rng, 100 + i),
        born: 0,
      });
    });
    // Wok: mie MATANG (siap diambil, untuk Mie Goreng).
    G.wok = { ing: 'mie', t: COOK_TIME, state: 'done' };
    // Talenan: cabai sedang dipotong 60% (untuk Nasi Goreng).
    G.board = { ing: 'cabai', t: 1.2, state: 'chopping' };
    // Piring: mid-assembly 2/3 (nasi + telur) untuk Nasi Goreng.
    G.plate = [
      { ing: 'nasi', state: 'cooked' },
      { ing: 'telur', state: 'cooked' },
    ];
    // Koki di wok, membawa ayam mentah (untuk Ayam Geprek).
    G.chef.x = STATION_X.wok + 40;
    G.chef.targetX = G.chef.x;
    G.chef.hand = { ing: 'ayam', state: 'raw' };
    return;
  }
  if (kind === 'serve') {
    G.time = 75;
    G.timeLeft = SHIFT_SECONDS - 75;
    G.revenue = 87;
    G.streak = 3;
    G.bestStreak = 3;
    G.wave = 2;
    G.tickets = [];
    ['geprek', 'mieayam'].forEach((rid, i) => {
      G.tickets.push({
        id: ++G.ticketSeq,
        recipe: RECIPE_BY_ID[rid],
        patience: 30 - i * 9,
        maxPatience: 40,
        customer: makeCustomer(G.rng, 104 + i),
        born: 0,
      });
    });
    G.wok = { ing: 'ayam', t: 1.5, state: 'cooking' };
    G.board = null;
    // Piring lengkap Ayam Geprek → lonceng menyala di pass.
    G.plate = [
      { ing: 'ayam', state: 'cooked' },
      { ing: 'cabai', state: 'chopped' },
    ];
    G.passGlow = 3;
    G.passFlash = 0.5;
    G.chef.x = STATION_X.pass;
    G.chef.targetX = G.chef.x;
    G.chef.hand = null;
    // Koin terbang + pesan bonus, seperti sesaat setelah menyajikan.
    for (let i = 0; i < 10; i++) {
      G.coins.push({ x: STATION_X.pass + (G.rng() - 0.5) * 140, y: 380, vx: (G.rng() - 0.5) * 160, vy: -140 - G.rng() * 120, t: 0.2 });
    }
    G.floaters.push({ x: STATION_X.pass + 20, y: 250, text: '+$18', color: '#ffd166', t: 0.2 });
    G.floaters.push({ x: 640, y: 200, text: 'STREAK x3!', color: '#ff7a2f', t: 0.2, big: true });
    G.banner = { text: 'DINNER RUSH!', sub: 'Orders are coming faster — target $90!', t: 0.5, dur: 2.6, big: true };
    return;
  }
  if (kind === 'end') {
    G.time = SHIFT_SECONDS;
    G.timeLeft = 0;
    G.phase = 'won';
    G.over = { won: true, stars: 3, revenue: 214, served: 14, burnt: 1, lost: 0, bestStreak: 5 };
    G.revenue = 214;
    G.served = 14;
    return;
  }
}

// ---------- autopilot: main sampai menang/kalah, tanpa render ----------
// Satu langkah rencana (target TERKUNCI). Prioritas tiap tick:
// (1) sajikan piring lengkap yang cocok tiket, (2) ambil yang sudah
// matang/dipotong, (3) letakkan olahan ke piring, (4) masukkan bahan
// mentah ke stasiunnya, (5) ambil bahan baru dari bin — jadi wok +
// talenan bekerja paralel selagi koki mengambil bahan lain.
function planStep(G, ctx) {
  const hand = G.chef.hand;
  // 1. Piring lengkap yang cocok tiket? Sajikan.
  const ready = recipeForPlateItems(G.plate);
  if (ready && G.tickets.some((t) => t.recipe.id === ready.id)) {
    teleport(G, STATION_X.pass);
    act(G, 'pass');
    ctx.locked = null;
    ctx.stuckSince = null;
    return true;
  }
  // 2. Pilih target: kunci saat piring kosong; buka kunci bila tiket
  //    target sudah pergi dan piring kosong.
  let recipe = null;
  if (ctx.locked) {
    recipe = RECIPE_BY_ID[ctx.locked];
    const stillWanted = G.tickets.some((t) => t.recipe.id === ctx.locked);
    if (!stillWanted && G.plate.length === 0 && !hand) {
      ctx.locked = null;
      recipe = null;
    }
  }
  if (!recipe) {
    if (G.tickets.length === 0) return false; // tidak ada pesanan: tunggu spawn
    const t0 = G.tickets.reduce((a, b) => (b.patience < a.patience ? b : a), G.tickets[0]);
    recipe = t0.recipe;
    ctx.locked = recipe.id;
  }
  const missing = missingItems(G.plate, recipe);
  if (missing.length === 0) {
    // Piring lengkap tapi tak ada tiket yang cocok: beri waktu 4 detik
    // untuk tiket cocok muncul, lalu kosongkan piring dan ganti target.
    if (ctx.stuckSince == null) ctx.stuckSince = G.time;
    if (G.time - ctx.stuckSince <= 4) return 'wait';
    if (!hand) {
      teleport(G, STATION_X.plate);
      act(G, 'plate');
      return true;
    }
    teleport(G, STATION_X.trash);
    act(G, 'trash');
    if (G.plate.length === 0) {
      ctx.locked = null;
      ctx.stuckSince = null;
    }
    return true;
  }
  ctx.stuckSince = null;
  const needed = new Set(missing.map((m) => m.ing + ':' + m.state));
  // Bersihkan hangus dulu (biar wok tidak tersumbat).
  if (!hand && G.wok && G.wok.state === 'burnt') {
    teleport(G, STATION_X.wok);
    act(G, 'wok');
    return true;
  }
  if (hand && hand.state === 'burnt') {
    teleport(G, STATION_X.trash);
    act(G, 'trash');
    return true;
  }
  // (1) Ambil yang sudah selesai dari wok / talenan.
  if (!hand) {
    if (G.wok && G.wok.state === 'done' && needed.has(G.wok.ing + ':cooked')) {
      teleport(G, STATION_X.wok);
      act(G, 'wok');
      return true;
    }
    if (G.board && G.board.state === 'done' && needed.has(G.board.ing + ':chopped')) {
      teleport(G, STATION_X.board);
      act(G, 'board');
      return true;
    }
  }
  // (2) Tangan membawa olahan yang dibutuhkan? Letakkan ke piring.
  if (hand && (hand.state === 'cooked' || hand.state === 'chopped')) {
    if (needed.has(hand.ing + ':' + hand.state)) {
      teleport(G, STATION_X.plate);
      act(G, 'plate');
      return true;
    }
    teleport(G, STATION_X.trash);
    act(G, 'trash');
    return true;
  }
  // (3) Tangan membawa mentah yang dibutuhkan? Masukkan ke stasiunnya.
  if (hand && hand.state === 'raw' && missing.some((m) => m.ing === hand.ing)) {
    const st = stationFor(recipe, hand.ing);
    if (st === 'wok') {
      if (!G.wok) {
        teleport(G, STATION_X.wok);
        act(G, 'wok');
        return true;
      }
      if (G.wok.state === 'done') {
        // Stasiun sibuk oleh yang sudah matang: buang mentah (gratis)
        // supaya tangan kosong dan yang matang bisa diambil.
        teleport(G, STATION_X.trash);
        act(G, 'trash');
        return true;
      }
      return 'wait';
    }
    if (!G.board) {
      teleport(G, STATION_X.board);
      act(G, 'board');
      return true;
    }
    if (G.board.state === 'done') {
      teleport(G, STATION_X.trash);
      act(G, 'trash');
      return true;
    }
    return 'wait';
  }
  // (4) Ambil bahan mentah yang belum diproses dari bin.
  if (!hand) {
    for (const m of missing) {
      const st = stationFor(recipe, m.ing);
      if (st === 'wok') {
        const inWok = G.wok && G.wok.ing === m.ing;
        if (!inWok && !G.wok) {
          teleport(G, binX(m.ing));
          act(G, 'bin', { ing: m.ing });
          return true;
        }
      } else {
        if (!G.board || G.board.ing !== m.ing) {
          teleport(G, binX(m.ing));
          act(G, 'bin', { ing: m.ing });
          return true;
        }
      }
    }
  }
  // Tangan penuh bahan lain: buang.
  if (hand) {
    teleport(G, STATION_X.trash);
    act(G, 'trash');
    return true;
  }
  return 'wait';
}

export function runAutopilot(seed, trace) {
  const G = createGame(seed);
  startShift(G);
  const ctx = { locked: null, stuckSince: null };
  let guard = 0;
  const maxSteps = 40000;
  while (G.phase === 'play' && guard++ < maxSteps) {
    const did = planStep(G, ctx);
    if (trace) {
      trace.push({
        t: +G.time.toFixed(2),
        did,
        locked: ctx.locked,
        carry: G.chef.hand ? G.chef.hand.ing + ':' + G.chef.hand.state : null,
        plate: G.plate.map((p) => p.ing + ':' + p.state),
        wok: G.wok ? G.wok.ing + ':' + G.wok.state + ':' + G.wok.t.toFixed(1) : null,
        board: G.board ? G.board.ing + ':' + G.board.state + ':' + G.board.t.toFixed(1) : null,
        tickets: G.tickets.map((tk) => tk.recipe.id + ':' + Math.ceil(tk.patience)),
        rev: G.revenue,
        served: G.served,
      });
    }
    stepGame(G, DT);
  }
  return {
    phase: G.phase,
    won: G.phase === 'won',
    revenue: G.revenue,
    served: G.served,
    burnt: G.burnt,
    lost: G.lost,
    bestStreak: G.bestStreak,
    time: G.time,
    steps: guard,
  };
}
