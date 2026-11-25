// Stasiun: bin bahan, wok, talenan, piring, pass, tempat sampah.
// Satu-satunya tempat logika interaksi tinggal: klik / E memanggil
// doStationAction, koki berjalan dulu (pending action) lalu aksi jalan.
// Carrying = {ing, state:'raw'|'cooked'|'chopped'} — piring hanya menerima
// yang sudah diolah, bukan bahan mentah.
import { BURN_AFTER, CHOP_SECONDS, LAYOUT } from './config.js';
import { INGREDIENTS, INGREDIENT_IDS, recipeForPlate } from './recipes.js';
import { formatRp } from './recipes.js';
import { addFloater, streakMult } from './state.js';
import { chefArrived, walkTo } from './chef.js';
import { sfxBell, sfxBuzz, sfxChop, sfxCoin, sfxDing, sfxPop, sfxSizzle } from './audio.js';

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function stationAt(x, y) {
  const L = LAYOUT;
  for (let i = 0; i < INGREDIENT_IDS.length; i++) {
    const r = { x: L.bins.x + i * (L.bins.w + L.bins.gap), y: L.bins.y, w: L.bins.w, h: L.bins.h };
    if (inRect(x, y, r)) return { kind: 'bin', ing: INGREDIENT_IDS[i], cx: r.x + r.w / 2 };
  }
  if (inRect(x, y, L.wok)) return { kind: 'wok', cx: L.wok.x + L.wok.w / 2 };
  if (inRect(x, y, L.board)) return { kind: 'board', cx: L.board.x + L.board.w / 2 };
  const p0 = { x: L.plates.x + 8, y: L.plates.y + 30, w: 116, h: 130 };
  const p1 = { x: L.plates.x + 136, y: L.plates.y + 30, w: 116, h: 130 };
  if (inRect(x, y, p0)) return { kind: 'plate', index: 0, cx: p0.x + p0.w / 2 };
  if (inRect(x, y, p1)) return { kind: 'plate', index: 1, cx: p1.x + p1.w / 2 };
  if (inRect(x, y, L.pass)) return { kind: 'pass', cx: L.pass.x + L.pass.w / 2 };
  if (inRect(x, y, L.trash)) return { kind: 'trash', cx: L.trash.x + L.trash.w / 2 };
  return null;
}

// Klik di lantai (bukan stasiun) = jalan ke sana.
export function floorPoint(x) {
  return Math.max(70, Math.min(1210, x));
}

// Klik mouse: jalan ke stasiun, aksi dieksekusi saat tiba.
export function clickAt(G, x, y) {
  if (G.phase !== 'play') return;
  const st = stationAt(x, y);
  if (!st) {
    walkTo(G, floorPoint(x));
    G.chef.action = null;
    return;
  }
  walkTo(G, st.cx);
  G.chef.action = st;
  if (chefArrived(G)) runPendingAction(G);
}

// Tombol E: interaksi dengan stasiun terdekat (dalam 90 px).
export function interactNearest(G) {
  if (G.phase !== 'play') return;
  const cx = G.chef.x;
  let best = null;
  let bestD = 95;
  const probes = [
    { kind: 'wok', cx: LAYOUT.wok.x + LAYOUT.wok.w / 2 },
    { kind: 'board', cx: LAYOUT.board.x + LAYOUT.board.w / 2 },
    { kind: 'plate', index: 0, cx: LAYOUT.plates.x + 66 },
    { kind: 'plate', index: 1, cx: LAYOUT.plates.x + 194 },
    { kind: 'pass', cx: LAYOUT.pass.x + LAYOUT.pass.w / 2 },
    { kind: 'trash', cx: LAYOUT.trash.x + LAYOUT.trash.w / 2 },
  ];
  for (const p of probes) {
    const d = Math.abs(p.cx - cx);
    if (d < bestD) { bestD = d; best = p; }
  }
  if (best) {
    walkTo(G, best.cx);
    G.chef.action = best;
    if (chefArrived(G)) runPendingAction(G);
  }
}

export function runPendingAction(G) {
  const a = G.chef.action;
  if (!a) return;
  G.chef.action = null;
  doStationAction(G, a);
}

export function doStationAction(G, a) {
  const chef = G.chef;
  if (a.kind === 'bin') {
    if (chef.carrying) { sfxBuzz(); return; }
    chef.carrying = { ing: a.ing, state: 'raw' };
    sfxPop();
    return;
  }
  if (a.kind === 'wok') {
    const slots = G.wok.slots;
    if (chef.carrying && chef.carrying.state === 'raw' && INGREDIENTS[chef.carrying.ing].station === 'wok') {
      const free = slots.findIndex((s) => s === null);
      if (free === -1) { sfxBuzz(); addFloater(G, 186, 300, 'Wok penuh!', '#ff7a6e'); return; }
      slots[free] = { ing: chef.carrying.ing, t: 0, state: 'cooking' };
      chef.carrying = null;
      sfxSizzle();
      return;
    }
    if (!chef.carrying) {
      const done = slots.findIndex((s) => s && s.state === 'done');
      if (done !== -1) {
        chef.carrying = { ing: slots[done].ing, state: 'cooked' };
        slots[done] = null;
        sfxPop();
        return;
      }
      const burnt = slots.findIndex((s) => s && s.state === 'burnt');
      if (burnt !== -1) {
        chef.carrying = { ing: slots[burnt].ing, state: 'burnt' };
        slots[burnt] = null;
        sfxPop();
        return;
      }
    }
    sfxBuzz();
    return;
  }
  if (a.kind === 'board') {
    if (chef.carrying && chef.carrying.state === 'raw' && INGREDIENTS[chef.carrying.ing].station === 'board') {
      if (G.board.ing) { sfxBuzz(); return; }
      G.board.ing = chef.carrying.ing;
      G.board.progress = 0;
      G.board.chopping = true;
      chef.carrying = null;
      sfxChop();
      return;
    }
    if (!chef.carrying && G.board.ing && G.board.progress >= 1) {
      chef.carrying = { ing: G.board.ing, state: 'chopped' };
      G.board.ing = null;
      G.board.progress = 0;
      G.board.chopping = false;
      sfxPop();
      return;
    }
    sfxBuzz();
    return;
  }
  if (a.kind === 'plate') {
    const plate = G.plates[a.index];
    if (chef.carrying && (chef.carrying.state === 'cooked' || chef.carrying.state === 'chopped')) {
      if (plate.items.includes(chef.carrying.ing)) { sfxBuzz(); return; }
      if (plate.items.length >= 3) { sfxBuzz(); return; }
      plate.items.push(chef.carrying.ing);
      chef.carrying = null;
      sfxPop();
      const r = recipeForPlate(plate.items);
      if (r) {
        G.pass.glow = 3;
        addFloater(G, 780, 330, r.name + ' SIAP!', '#ffd166');
        sfxBell();
      }
      return;
    }
    // Tangan kosong + klik piring berisi: ambil kembali bahan terakhir
    // (jadi piring yang salah / tak ada pemesannya bisa dikosongkan).
    if (!chef.carrying && plate.items.length > 0) {
      const ing = plate.items.pop();
      chef.carrying = { ing, state: INGREDIENTS[ing].station === 'wok' ? 'cooked' : 'chopped' };
      sfxPop();
      return;
    }
    sfxBuzz();
    return;
  }
  if (a.kind === 'pass') {
    serveAtPass(G);
    return;
  }
  if (a.kind === 'trash') {
    if (chef.carrying) {
      if (chef.carrying.state === 'burnt') G.burnt++;
      chef.carrying = null;
      G.trash.flash = 0.4;
      sfxBuzz();
    }
    return;
  }
}

// Sajikan piring lengkap yang cocok dengan tiket tertua.
export function serveAtPass(G) {
  for (let i = 0; i < G.plates.length; i++) {
    const plate = G.plates[i];
    const recipe = recipeForPlate(plate.items);
    if (!recipe) continue;
    const ti = G.tickets.findIndex((t) => t.recipe.id === recipe.id);
    if (ti === -1) {
      addFloater(G, 1064, 300, 'Tidak ada yang pesan ' + recipe.name, '#ff7a6e');
      sfxBuzz();
      return;
    }
    const ticket = G.tickets[ti];
    G.tickets.splice(ti, 1);
    plate.items = [];
    const mult = streakMult(G);
    const earned = Math.round(recipe.price * mult);
    G.revenue += earned;
    G.served++;
    G.streak++;
    if (G.streak > G.bestStreak) G.bestStreak = G.streak;
    G.pass.flash = 0.5;
    burstCoins(G, 1064, 500, 10);
    addFloater(G, 1140, 300, '+' + formatRp(earned) + (mult > 1 ? '  x' + mult.toFixed(2) : ''), '#ffd166');
    if (G.streak >= 3) addFloater(G, 990, 300, 'STREAK x' + G.streak + '!', '#ff7a2f');
    sfxCoin();
    return;
  }
  sfxBuzz();
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

// Masak di wok + potong di talenan, tiap frame.
export function updateStations(G, dt) {
  if (G.phase !== 'play') return;
  for (const slot of G.wok.slots) {
    if (!slot) continue;
    slot.t += dt;
    const cook = INGREDIENTS[slot.ing].cook;
    if (slot.state === 'cooking' && slot.t >= cook) {
      slot.state = 'done';
      slot.t = cook;
      sfxDing();
    } else if (slot.state === 'done' && slot.t >= cook + BURN_AFTER) {
      slot.state = 'burnt';
      addFloater(G, 186, 300, 'Hangus!', '#ff7a6e');
    }
  }
  // Uap dari wok yang sedang masak.
  if (G.wok.slots.some((s) => s && s.state !== 'burnt') && G.rng() < dt * 6) {
    G.steam.push({ x: 150 + G.rng() * 70, y: 360, t: 0, life: 1.1 + G.rng() * 0.5 });
  }
  if (G.board.chopping && G.board.ing) {
    G.board.progress += dt / CHOP_SECONDS;
    if (G.rng() < dt * 8) sfxChop();
    if (G.board.progress >= 1) {
      G.board.progress = 1;
      G.board.chopping = false;
      sfxDing();
    }
  }
}
