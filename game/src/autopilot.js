// Autopilot deterministik + staged screenshot.
// Dua job, satu file: (1) main otomatis dengan logika game yang sama
// (teleport + doStationAction) untuk membuktikan shift bisa dimenangkan;
// (2) susun adegan deterministik untuk 4 screenshot (?shot=...).
import { LAYOUT, SHIFT_SECONDS } from './config.js';
import { INGREDIENTS, recipeById, recipeForPlate } from './recipes.js';
import { createGame, spawnTicket, startShift, updateClocks } from './state.js';
import { doStationAction, updateStations } from './stations.js';
import { makeCustomer } from './customers.js';

function byId(id) {
  return recipeById(id);
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
    G.revenue = 42000;
    G.streak = 2;
    G.bestStreak = 2;
    G.tickets = [];
    const ids = ['nasi-goreng', 'mie-goreng', 'ayam-geprek', 'nasi-ayam'];
    const pats = [34, 22, 41, 12];
    ids.forEach((rid, i) => {
      const recipe = byId(rid);
      G.tickets.push({
        id: ++G.ticketSeq,
        recipe,
        patience: pats[i],
        maxPatience: 48,
        customer: makeCustomerFrom(G, i),
        born: 0,
      });
    });
    // Wok: slot 0 masak nasi (setengah jalan), slot 1 telur MATANG.
    G.wok.slots = [
      { ing: 'nasi', t: 1.8, state: 'cooking' },
      { ing: 'telur', t: 3.0, state: 'done' },
    ];
    // Talenan: cabai sedang dipotong 60%.
    G.board = { ing: 'cabai', progress: 0.6, chopping: true };
    // Piring 0: mid-assembly 2/3 (nasi + telur) untuk Nasi Goreng.
    G.plates[0].items = ['nasi', 'telur'];
    // Piring 1: lengkap Mie Goreng → lonceng menyala di pass.
    G.plates[1].items = ['mie', 'telur', 'sayur'];
    G.pass.glow = 3;
    // Koki di wok (sedikit ke kanan supaya label WOK tidak tertutup topi).
    G.chef.x = LAYOUT.wok.x + LAYOUT.wok.w / 2 + 60;
    G.chef.targetX = G.chef.x;
    G.chef.carrying = { ing: 'cabai', state: 'raw' };
    return;
  }
  if (kind === 'serve') {
    G.time = 75;
    G.timeLeft = SHIFT_SECONDS - 75;
    G.revenue = 87000;
    G.streak = 3;
    G.bestStreak = 3;
    G.waveIndex = 1;
    G.tickets = [];
    ['ayam-geprek', 'mie-ayam'].forEach((rid, i) => {
      G.tickets.push({
        id: ++G.ticketSeq,
        recipe: byId(rid),
        patience: 30 - i * 9,
        maxPatience: 40,
        customer: makeCustomerFrom(G, i + 4),
        born: 0,
      });
    });
    G.wok.slots = [{ ing: 'ayam', t: 2.5, state: 'cooking' }, null];
    G.board = { ing: null, progress: 0, chopping: false };
    G.plates[0].items = ['ayam', 'cabai'];
    G.plates[1].items = [];
    G.pass.glow = 3;
    G.pass.flash = 0.5;
    G.chef.x = LAYOUT.pass.x + LAYOUT.pass.w / 2;
    G.chef.targetX = G.chef.x;
    G.chef.carrying = null;
    // Koin terbang + pesan bonus, seperti sesaat setelah menyajikan.
    // Floater di strip atas panel pass (tidak menutupi lonceng/bin).
    for (let i = 0; i < 10; i++) {
      G.coins.push({ x: 1052 + (G.rng() - 0.5) * 140, y: 400, vx: (G.rng() - 0.5) * 160, vy: -140 - G.rng() * 120, t: 0.2 });
    }
    G.floaters.push({ x: 1130, y: 320, text: '+Rp 18.000', color: '#ffd166', t: 0.2 });
    G.floaters.push({ x: 980, y: 320, text: 'STREAK x3!', color: '#ff7a2f', t: 0.2 });
    return;
  }
  if (kind === 'end') {
    G.time = SHIFT_SECONDS;
    G.timeLeft = 0;
    G.phase = 'won';
    G.over = { won: true, stars: 3, revenue: 214000, served: 14, burnt: 1, lost: 0, bestStreak: 5 };
    G.revenue = 214000;
    G.served = 14;
    return;
  }
}

// Pelanggan deterministik dari rng game.
function makeCustomerFrom(G, i) {
  return makeCustomer(G.rng, 100 + i);
}

// ---------- autopilot: main sampai menang/kalah, tanpa render ----------
const DT = 1 / 60;

function teleport(G, x) {
  G.chef.x = x;
  G.chef.targetX = x;
  G.chef.moving = false;
}

function act(G, kind, data) {
  doStationAction(G, { kind, ...(data || {}) });
}

function binCx(ing) {
  const idx = ['nasi', 'mie', 'ayam', 'telur', 'cabai', 'sayur'].indexOf(ing);
  return LAYOUT.bins.x + idx * (LAYOUT.bins.w + LAYOUT.bins.gap) + LAYOUT.bins.w / 2;
}

function stepSim(G, dt) {
  updateClocks(G, dt);
  updateStations(G, dt);
}

// Satu langkah rencana autopilot (job-based, target TERKUNCI).
// ctx.locked = id resep yang sedang dibuat; dikunci saat piring kosong dan
// tiket dipilih, dibuka lagi saat piring disajikan. Tanpa kunci, piring
// berisi ['nasi'] akan dicocokkan ke resep pertama yang mengandung nasi
// (Nasi Goreng) padahal targetnya Nasi Ayam — autopilot membangun masakan
// yang tak dipesan dan macet menunggu tiketnya.
// Prioritas tiap tick: (1) ambil yang sudah matang/dipotong, (2) letakkan
// olahan ke piring, (3) masukkan bahan mentah ke stasiunnya, (4) ambil bahan
// baru dari bin — jadi dua slot wok + talenan bekerja paralel.
function planStep(G, ctx) {
  const chef = G.chef;
  // 1. Ada piring lengkap yang cocok tiket? Sajikan.
  for (let i = 0; i < G.plates.length; i++) {
    const r = recipeForPlate(G.plates[i].items);
    if (r && G.tickets.some((t) => t.recipe.id === r.id)) {
      teleport(G, LAYOUT.pass.x + LAYOUT.pass.w / 2);
      act(G, 'pass');
      ctx.locked = null;
      ctx.stuckSince = null;
      return true;
    }
  }
  // 2. Pilih target: kunci saat piring kosong DAN belum ada masakan yang
  //    dimulai; kunci HANYA dibuka saat piring disajikan / dikosongkan
  //    (bukan tiap tick saat piring kosong — kalau tidak, tiket baru yang
  //    muncul di tengah masak akan mengganti target sementara wok sudah
  //    berisi bahan resep lama, lalu bahan itu hangus tak terurus).
  let recipe = null;
  if (ctx.locked) {
    recipe = recipeById(ctx.locked);
  } else {
    const fresh = G.tickets.filter((t) => t.patience >= 18);
    const pool = fresh.length ? fresh : G.tickets;
    if (pool.length === 0) return false; // tidak ada pesanan: tunggu spawn
    const t0 = pool.reduce((a, b) => (b.patience > a.patience ? b : a), pool[0]);
    recipe = t0.recipe;
    ctx.locked = recipe.id;
  }
  const plate = G.plates[0].items;
  const missing = recipe.steps.filter((s) => !plate.includes(s.ing));
  if (missing.length === 0) {
    // Piring lengkap tapi tak ada tiket yang cocok: beri waktu 4 detik untuk
    // tiket cocok muncul, lalu kosongkan piring (ambil kembali + buang) dan
    // ganti target — jangan macet menunggu.
    if (ctx.stuckSince == null) ctx.stuckSince = G.time;
    if (G.time - ctx.stuckSince <= 4) return 'wait';
    if (!chef.carrying) {
      teleport(G, LAYOUT.plates.x + 66);
      act(G, 'plate', { index: 0 });
      return true;
    }
    teleport(G, LAYOUT.trash.x + LAYOUT.trash.w / 2);
    act(G, 'trash');
    if (G.plates[0].items.length === 0) {
      ctx.locked = null;
      ctx.stuckSince = null;
    }
    return true;
  }
  ctx.stuckSince = null;
  const needed = new Set(missing.map((s) => s.ing));
  // Bersihkan hangus dulu (biar slot wok tidak tersumbat).
  if (!chef.carrying) {
    const burntIdx = G.wok.slots.findIndex((s) => s && s.state === 'burnt');
    if (burntIdx !== -1) {
      teleport(G, LAYOUT.wok.x + LAYOUT.wok.w / 2);
      act(G, 'wok');
      return true;
    }
  }
  if (chef.carrying && chef.carrying.state === 'burnt') {
    teleport(G, LAYOUT.trash.x + LAYOUT.trash.w / 2);
    act(G, 'trash');
    return true;
  }
  // (1) Ambil yang sudah selesai dari wok / talenan.
  if (!chef.carrying) {
    const doneIdx = G.wok.slots.findIndex((s) => s && s.state === 'done' && needed.has(s.ing));
    if (doneIdx !== -1) {
      teleport(G, LAYOUT.wok.x + LAYOUT.wok.w / 2);
      act(G, 'wok');
      return true;
    }
    if (G.board.ing && needed.has(G.board.ing) && G.board.progress >= 1) {
      teleport(G, LAYOUT.board.x + LAYOUT.board.w / 2);
      act(G, 'board');
      return true;
    }
  }
  // (2) Tangan membawa olahan yang dibutuhkan? Letakkan ke piring.
  if (chef.carrying && (chef.carrying.state === 'cooked' || chef.carrying.state === 'chopped')) {
    if (needed.has(chef.carrying.ing)) {
      teleport(G, LAYOUT.plates.x + 66);
      act(G, 'plate', { index: 0 });
      return true;
    }
    teleport(G, LAYOUT.trash.x + LAYOUT.trash.w / 2);
    act(G, 'trash');
    return true;
  }
  // (3) Tangan membawa mentah yang dibutuhkan? Masukkan ke stasiunnya.
  //    Kalau stasiun penuh oleh bahan yang SUDAH selesai, buang bahan mentah
  //    yang dibawa (bahan mentah gratis) supaya tangan kosong dan bahan
  //    matang itu bisa diambil — kalau tidak, planner menunggu selamanya
  //    sementara bahan matang itu hangus.
  if (chef.carrying && chef.carrying.state === 'raw' && needed.has(chef.carrying.ing)) {
    const st = INGREDIENTS[chef.carrying.ing].station;
    if (st === 'wok') {
      if (G.wok.slots.some((s) => s === null)) {
        teleport(G, LAYOUT.wok.x + LAYOUT.wok.w / 2);
        act(G, 'wok');
        return true;
      }
      if (G.wok.slots.some((s) => s && s.state === 'done')) {
        teleport(G, LAYOUT.trash.x + LAYOUT.trash.w / 2);
        act(G, 'trash');
        return true;
      }
      return 'wait';
    }
    if (!G.board.ing) {
      teleport(G, LAYOUT.board.x + LAYOUT.board.w / 2);
      act(G, 'board');
      return true;
    }
    if (G.board.progress >= 1) {
      teleport(G, LAYOUT.trash.x + LAYOUT.trash.w / 2);
      act(G, 'trash');
      return true;
    }
    return 'wait';
  }
  // (4) Ambil bahan mentah yang belum diproses dari bin.
  if (!chef.carrying) {
    for (const s of missing) {
      if (s.station === 'wok') {
        const inWok = G.wok.slots.some((sl) => sl && sl.ing === s.ing);
        if (!inWok && G.wok.slots.some((sl) => sl === null)) {
          teleport(G, binCx(s.ing));
          act(G, 'bin', { ing: s.ing });
          return true;
        }
      } else {
        if (G.board.ing !== s.ing) {
          teleport(G, binCx(s.ing));
          act(G, 'bin', { ing: s.ing });
          return true;
        }
      }
    }
  }
  // Tangan penuh bahan lain: buang.
  if (chef.carrying) {
    teleport(G, LAYOUT.trash.x + LAYOUT.trash.w / 2);
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
        carry: G.chef.carrying ? G.chef.carrying.ing + ':' + G.chef.carrying.state : null,
        plate: [...G.plates[0].items],
        wok: G.wok.slots.map((s) => (s ? s.ing + ':' + s.state + ':' + s.t.toFixed(1) : null)),
        board: G.board.ing ? G.board.ing + ':' + G.board.progress.toFixed(2) : null,
        tickets: G.tickets.map((tk) => tk.recipe.id + ':' + Math.ceil(tk.patience)),
        rev: G.revenue,
        served: G.served,
      });
    }
    stepSim(G, DT);
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
