// Stasiun: bin bahan, wok, talenan, piring, pass, tempat sampah.
// Satu-satunya tempat logika interaksi tinggal: klik / E memanggil
// requestAction, koki berjalan dulu (pending action) lalu aksi jalan.
// Hand = {ing, state:'raw'|'cooked'|'chopped'} — piring hanya menerima
// yang sudah diolah, bukan bahan mentah.
import { BURN_GRACE, CHOP_TIME, COOK_TIME, LAYOUT, STATION_X, binCenterX, binRect, comboFor, fmtRp } from './config.js';
import { INGREDIENTS, ING_BY_ID, RECIPES, plateMatches, processedState, stationFor } from './recipes.js';
import { addFloater, burstCoins } from './state.js';
import { hasArrived, walkTo } from './chef.js';
import { sfxBell, sfxBuzz, sfxChop, sfxCoin, sfxDing, sfxPop, sfxSizzle } from './audio.js';

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// Stasiun apa yang diklik? Mengembalikan {kind, ...} + cx (tempat koki berdiri).
export function stationAt(x, y) {
  for (let i = 0; i < INGREDIENTS.length; i++) {
    const r = binRect(i);
    if (inRect(x, y, r)) return { kind: 'bin', ing: INGREDIENTS[i].id, cx: binCenterX(i) };
  }
  // Area counter: wok, talenan, piring, pass, sampah (y 240–470).
  if (y >= 240 && y <= 470) {
    if (x >= 380 && x < 540) return { kind: 'wok', cx: STATION_X.wok };
    if (x >= 580 && x < 740) return { kind: 'board', cx: STATION_X.board };
    if (x >= 780 && x < 940) return { kind: 'plate', cx: STATION_X.plate };
    if (x >= 980 && x < 1240) return { kind: 'pass', cx: STATION_X.pass };
    if (x >= 60 && x < 180) return { kind: 'trash', cx: STATION_X.trash };
  }
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
  if (hasArrived(G)) runPendingAction(G);
}

// Tombol E: interaksi dengan stasiun terdekat (dalam 100 px).
export function interactNearest(G) {
  if (G.phase !== 'play') return;
  const cx = G.chef.x;
  const probes = [
    { kind: 'trash', cx: STATION_X.trash },
    { kind: 'wok', cx: STATION_X.wok },
    { kind: 'board', cx: STATION_X.board },
    { kind: 'plate', cx: STATION_X.plate },
    { kind: 'pass', cx: STATION_X.pass },
  ];
  let best = null;
  let bestD = 100;
  for (const p of probes) {
    const d = Math.abs(p.cx - cx);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  if (best) {
    walkTo(G, best.cx);
    G.chef.action = best;
    if (hasArrived(G)) runPendingAction(G);
  }
}

export function runPendingAction(G) {
  const a = G.chef.action;
  if (!a) return;
  G.chef.action = null;
  doStationAction(G, a);
}

export function doStationAction(G, a) {
  const hand = G.chef.hand;
  if (a.kind === 'bin') {
    if (hand) {
      sfxBuzz();
      return;
    }
    G.chef.hand = { ing: a.ing, state: 'raw' };
    sfxPop();
    return;
  }
  if (a.kind === 'wok') {
    if (hand && hand.state === 'raw' && stationForRecipe(hand.ing) === 'wok') {
      if (G.wok) {
        sfxBuzz();
        addFloater(G, STATION_X.wok, 250, 'Wok penuh!', '#ff7a6e');
        return;
      }
      G.wok = { ing: hand.ing, t: 0, state: 'cooking' };
      G.chef.hand = null;
      sfxSizzle();
      return;
    }
    if (!hand && G.wok && G.wok.state === 'done') {
      G.chef.hand = { ing: G.wok.ing, state: 'cooked' };
      G.wok = null;
      sfxPop();
      return;
    }
    if (!hand && G.wok && G.wok.state === 'burnt') {
      G.chef.hand = { ing: G.wok.ing, state: 'burnt' };
      G.wok = null;
      sfxPop();
      return;
    }
    sfxBuzz();
    return;
  }
  if (a.kind === 'board') {
    if (hand && hand.state === 'raw' && stationForRecipe(hand.ing) === 'board') {
      if (G.board) {
        sfxBuzz();
        return;
      }
      G.board = { ing: hand.ing, t: 0, state: 'chopping' };
      G.chef.hand = null;
      sfxChop();
      return;
    }
    if (!hand && G.board && G.board.state === 'done') {
      G.chef.hand = { ing: G.board.ing, state: 'chopped' };
      G.board = null;
      sfxPop();
      return;
    }
    sfxBuzz();
    return;
  }
  if (a.kind === 'plate') {
    if (hand && (hand.state === 'cooked' || hand.state === 'chopped')) {
      if (G.plate.length >= 3) {
        sfxBuzz();
        return;
      }
      if (G.plate.some((p) => p.ing === hand.ing)) {
        sfxBuzz();
        return;
      }
      G.plate.push({ ing: hand.ing, state: hand.state });
      G.chef.hand = null;
      sfxPop();
      const r = recipeForPlateItems(G.plate);
      if (r) {
        G.passGlow = 3;
        addFloater(G, STATION_X.plate, 250, r.name + ' SIAP!', '#ffd166');
        sfxBell();
      }
      return;
    }
    // Tangan kosong + klik piring berisi: ambil kembali bahan terakhir
    // (jadi piring yang salah / tak ada pemesannya bisa dikosongkan).
    if (!hand && G.plate.length > 0) {
      const last = G.plate.pop();
      G.chef.hand = { ing: last.ing, state: last.state };
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
    if (hand) {
      if (hand.state === 'burnt') G.burnt++;
      G.chef.hand = null;
      G.trashFlash = 0.4;
      sfxBuzz();
    }
    return;
  }
}

// Stasiun pengolahan sebuah bahan (semua resep sepakat untuk bahan yang sama).
function stationForRecipe(ing) {
  for (const r of RECIPES) {
    const step = r.steps.find((s) => s.ing === ing);
    if (step) return step.station;
  }
  return null;
}

// Resep yang cocok dengan isi piring saat ini (atau null).
export function recipeForPlateItems(plate) {
  for (const r of RECIPES) {
    if (plateMatches(plate, r)) return r;
  }
  return null;
}

// Sajikan piring lengkap yang cocok dengan tiket yang menunggu.
export function serveAtPass(G) {
  const recipe = recipeForPlateItems(G.plate);
  if (!recipe) {
    sfxBuzz();
    return;
  }
  const ti = G.tickets.findIndex((t) => t.recipe.id === recipe.id);
  if (ti === -1) {
    addFloater(G, STATION_X.pass, 250, 'Tidak ada yang pesan ' + recipe.name, '#ff7a6e');
    sfxBuzz();
    return;
  }
  G.tickets.splice(ti, 1);
  G.plate = [];
  const mult = comboFor(G.streak);
  const earned = Math.round(recipe.price * mult);
  G.revenue += earned;
  G.served++;
  G.streak++;
  if (G.streak > G.bestStreak) G.bestStreak = G.streak;
  G.passFlash = 0.5;
  burstCoins(G, STATION_X.pass, 380, 10);
  addFloater(G, STATION_X.pass + 60, 250, '+' + fmtRp(earned) + (mult > 1 ? '  x' + mult : ''), '#ffd166');
  if (G.streak >= 3) addFloater(G, STATION_X.pass - 80, 250, 'STREAK x' + G.streak + '!', '#ff7a2f');
  sfxCoin();
}

// Masak di wok + potong di talenan, tiap frame.
export function updateStations(G, dt) {
  if (G.phase !== 'play') return;
  if (G.wok) {
    G.wok.t += dt;
    if (G.wok.state === 'cooking' && G.wok.t >= COOK_TIME) {
      G.wok.state = 'done';
      G.wok.t = COOK_TIME;
      sfxDing();
    } else if (G.wok.state === 'done' && G.wok.t >= COOK_TIME + BURN_GRACE) {
      G.wok.state = 'burnt';
      addFloater(G, STATION_X.wok, 250, 'Hangus!', '#ff7a6e');
    }
  }
  // Uap dari wok yang sedang masak.
  if (G.wok && G.wok.state !== 'burnt' && G.rng() < dt * 6) {
    G.steam.push({ x: STATION_X.wok - 40 + G.rng() * 80, y: 300, t: 0, life: 1.1 + G.rng() * 0.5 });
  }
  if (G.board && G.board.state === 'chopping') {
    G.board.t += dt;
    if (G.rng() < dt * 8) sfxChop();
    if (G.board.t >= CHOP_TIME) {
      G.board.t = CHOP_TIME;
      G.board.state = 'done';
      sfxDing();
    }
  }
}
