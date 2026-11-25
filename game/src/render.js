// Semua gambar canvas: latar pasar malam, stasiun, koki, pelanggan, HUD,
// tiket, layar judul + akhir. Satu file, satu job: melukis state G.
import { CHEF_Y, H, LAYOUT, PALETTE, SHIFT_SECONDS, W, WAVES, WIN_TARGET } from './config.js';
import { INGREDIENTS, INGREDIENT_IDS, RECIPES, formatRp, recipeForPlate } from './recipes.js';
import { drawIngredient, drawPlate } from './food.js';
import { drawCustomerFace, moodOf } from './customers.js';
import { chefCarryLabel } from './state.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = (weight || '700') + ' ' + size + 'px system-ui, sans-serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function mmss(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

// ---------- latar ----------
function drawBackground(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, PALETTE.skyTop);
  g.addColorStop(0.45, PALETTE.skyMid);
  g.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Bintang.
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 60; i++) {
    const x = (i * 211.7) % W;
    const y = (i * 97.3) % 150;
    const a = 0.25 + 0.55 * Math.abs(Math.sin(t * 0.7 + i));
    ctx.globalAlpha = a * 0.7;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
  // Lampu string hangat.
  ctx.strokeStyle = '#3a2c14';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 62);
  ctx.quadraticCurveTo(640, 96, 1280, 62);
  ctx.stroke();
  for (let i = 0; i < 17; i++) {
    const x = 20 + i * 74;
    const y = 62 + Math.sin((x / 1280) * Math.PI) * 30;
    const glow = 0.75 + 0.25 * Math.sin(t * 2 + i * 1.3);
    ctx.save();
    ctx.globalAlpha = glow;
    ctx.fillStyle = PALETTE.amber;
    ctx.beginPath();
    ctx.arc(x, y + 8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = glow * 0.25;
    ctx.beginPath();
    ctx.arc(x, y + 8, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Kios kayu di belakang counter.
  ctx.fillStyle = PALETTE.stallWoodDark;
  ctx.fillRect(0, 300, W, 14);
  ctx.fillStyle = PALETTE.stallWood;
  ctx.fillRect(0, 314, W, 10);
  // Lantai.
  ctx.fillStyle = '#241a33';
  ctx.fillRect(0, 640, W, 28);
  ctx.fillStyle = '#2e2140';
  for (let x = 0; x < W; x += 64) ctx.fillRect(x, 640, 32, 28);
}

// ---------- HUD atas ----------
function drawTopBar(ctx, G) {
  const L = LAYOUT.topBar;
  ctx.fillStyle = 'rgba(12, 8, 28, 0.92)';
  ctx.fillRect(L.x, L.y, L.w, L.h);
  ctx.fillStyle = PALETTE.amber;
  ctx.fillRect(0, L.h - 3, W, 3);
  text(ctx, 'PASAR MALAM: WARUNG SAJI', 18, 30, 24, '#ffd166', '800');
  const right = [
    ['PENDAPATAN', formatRp(G.revenue) + ' / ' + formatRp(WIN_TARGET)],
    ['STREAK', G.streak > 0 ? 'x' + G.streak : '-'],
    ['GELOMBANG', (G.waveIndex + 1) + ' ' + WAVES[G.waveIndex].name],
  ];
  let x = 560;
  for (const [label, val] of right) {
    text(ctx, label, x, 18, 11, '#b9a8d8', '700');
    text(ctx, val, x, 40, 17, '#fff3d6', '800');
    x += label === 'PENDAPATAN' ? 250 : 150;
  }
  // Timer shift.
  const frac = G.timeLeft / SHIFT_SECONDS;
  const bx = 1100, by = 16, bw = 160, bh = 26;
  ctx.fillStyle = '#3a2c55';
  rr(ctx, bx, by, bw, bh, 6);
  ctx.fill();
  const urgent = G.timeLeft < 30 && G.phase === 'play';
  ctx.fillStyle = urgent ? (Math.sin(G.time * 8) > 0 ? '#e63946' : '#ff7a6e') : PALETTE.teal;
  rr(ctx, bx + 2, by + 2, (bw - 4) * frac, bh - 4, 5);
  ctx.fill();
  text(ctx, mmss(G.timeLeft), bx + bw / 2, by + bh / 2, 15, '#ffffff', '800', 'center');
}

// ---------- tiket pesanan ----------
function drawTickets(ctx, G, t) {
  const L = LAYOUT.tickets;
  for (let i = 0; i < 4; i++) {
    const x = L.x + i * (L.w + L.gap);
    const y = L.y;
    const tk = G.tickets[i];
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    rr(ctx, x + 3, y + 4, L.w, L.h, 10);
    ctx.fill();
    ctx.fillStyle = '#fff8e7';
    rr(ctx, x, y, L.w, L.h, 10);
    ctx.fill();
    if (!tk) {
      ctx.strokeStyle = '#c9bfa8';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      rr(ctx, x + 6, y + 6, L.w - 12, L.h - 12, 8);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'Menunggu pesanan…', x + L.w / 2, y + L.h / 2, 14, '#a89a7c', '600', 'center');
      ctx.restore();
      continue;
    }
    const mood = moodOf(tk.patience, tk.maxPatience);
    drawCustomerFace(ctx, tk.customer, x + 40, y + 46, 30, mood);
    text(ctx, tk.customer.name, x + 78, y + 16, 12, '#8a7a5c', '700');
    text(ctx, tk.recipe.name, x + 78, y + 36, 17, PALETTE.ink, '800');
    // Checklist bahan: centang bila sudah ada di salah satu piring.
    let cx = x + 78;
    for (const step of tk.recipe.steps) {
      const done = G.plates.some((p) => p.items.includes(step.ing));
      ctx.fillStyle = done ? '#2e7d32' : INGREDIENTS[step.ing].base;
      ctx.beginPath();
      ctx.arc(cx + 9, y + 62, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#241a12';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (done) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx + 4, y + 62);
        ctx.lineTo(cx + 8, y + 66);
        ctx.lineTo(cx + 14, y + 57);
        ctx.stroke();
      }
      text(ctx, INGREDIENTS[step.ing].name, cx + 22, y + 62, 11, '#5d4a2a', '600');
      cx += 22 + INGREDIENTS[step.ing].name.length * 7 + 12;
    }
    // Bar kesabaran.
    const pf = Math.max(0, tk.patience / tk.maxPatience);
    ctx.fillStyle = '#e5dcc4';
    rr(ctx, x + 14, y + L.h - 26, L.w - 28, 10, 5);
    ctx.fill();
    ctx.fillStyle = pf > 0.6 ? '#57b25e' : pf > 0.3 ? '#ffb347' : '#e63946';
    rr(ctx, x + 14, y + L.h - 26, (L.w - 28) * pf, 10, 5);
    ctx.fill();
    text(ctx, formatRp(tk.recipe.price), x + L.w - 14, y + L.h - 42, 15, '#b8860b', '800', 'right');
    text(ctx, Math.ceil(tk.patience) + ' dtk', x + L.w - 14, y + 16, 12, '#8a7a5c', '700', 'right');
    ctx.restore();
  }
}

// ---------- bin bahan ----------
function drawBins(ctx, G, t) {
  const L = LAYOUT.bins;
  for (let i = 0; i < INGREDIENT_IDS.length; i++) {
    const id = INGREDIENT_IDS[i];
    const ing = INGREDIENTS[id];
    const x = L.x + i * (L.w + L.gap);
    const y = L.y;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    rr(ctx, x + 3, y + 4, L.w, L.h, 10);
    ctx.fill();
    ctx.fillStyle = '#8a5a2b';
    rr(ctx, x, y, L.w, L.h, 10);
    ctx.fill();
    ctx.fillStyle = '#a06a33';
    rr(ctx, x + 4, y + 4, L.w - 8, L.h - 8, 8);
    ctx.fill();
    drawIngredient(ctx, id, x + 42, y + 40, 26, t);
    text(ctx, ing.name, x + 76, y + 28, 17, '#fff3d6', '800');
    text(ctx, ing.station === 'wok' ? '→ WOK' : '→ TALENAN', x + 76, y + 54, 12, '#ffd166', '700');
    if (G.chef.carrying && G.chef.carrying.ing === id && G.chef.carrying.state === 'raw') {
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 3;
      rr(ctx, x, y, L.w, L.h, 10);
      ctx.stroke();
    }
  }
}

// ---------- stasiun ----------
function drawWok(ctx, G, t) {
  const L = LAYOUT.wok;
  // Kompor.
  ctx.fillStyle = '#2c2438';
  rr(ctx, L.x, L.y + 90, L.w, 110, 12);
  ctx.fill();
  ctx.fillStyle = '#3d3352';
  rr(ctx, L.x + 8, L.y + 98, L.w - 16, 94, 8);
  ctx.fill();
  // Api di bawah wok — dua lapis (oranye luar, kuning dalam), berkedip.
  const flick = 0.8 + 0.2 * Math.sin(t * 9);
  for (let i = 0; i < 5; i++) {
    const fx = L.x + 60 + i * 45;
    const a = flick * (0.75 + 0.25 * Math.sin(t * 7 + i * 2));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = '#ff7a2f';
    ctx.beginPath();
    ctx.moveTo(fx - 16, L.y + 190);
    ctx.quadraticCurveTo(fx - 10, L.y + 146, fx, L.y + 152);
    ctx.quadraticCurveTo(fx + 10, L.y + 146, fx + 16, L.y + 190);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(fx - 8, L.y + 190);
    ctx.quadraticCurveTo(fx - 5, L.y + 164, fx, L.y + 168);
    ctx.quadraticCurveTo(fx + 5, L.y + 164, fx + 8, L.y + 190);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // Wok: mangkuk hitam besar.
  const cx = L.x + L.w / 2;
  const cy = L.y + 96;
  ctx.fillStyle = '#1d1826';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 118, 52, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e2540';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 104, 42, 0, 0, Math.PI * 2);
  ctx.fill();
  // Isi slot masak.
  G.wok.slots.forEach((slot, i) => {
    if (!slot) return;
    const sx = cx + (i === 0 ? -42 : 42);
    const sy = cy - 6;
    if (slot.state === 'burnt') {
      ctx.fillStyle = '#241a12';
      ctx.beginPath();
      ctx.arc(sx, sy, 26, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, 'HANGUS', sx, sy - 34, 12, '#ff7a6e', '800', 'center');
    } else {
      drawIngredient(ctx, slot.ing, sx, sy, 26, t);
      // Ring progress.
      const frac = Math.min(1, slot.t / INGREDIENTS[slot.ing].cook);
      ctx.strokeStyle = slot.state === 'done' ? '#ffd166' : '#2ec4b6';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(sx, sy, 34, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
      if (slot.state === 'done') text(ctx, 'MATANG!', sx, sy - 44, 13, '#ffd166', '800', 'center');
    }
  });
  text(ctx, 'WOK', cx, L.y + L.h - 8, 14, '#ffd166', '800', 'center');
}

function drawBoard(ctx, G, t) {
  const L = LAYOUT.board;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  rr(ctx, L.x + 3, L.y + 4, L.w, L.h, 10);
  ctx.fill();
  ctx.fillStyle = '#c89a5e';
  rr(ctx, L.x, L.y, L.w, L.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#a67c3f';
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(L.x + 10, L.y + i * 44);
    ctx.lineTo(L.x + L.w - 10, L.y + i * 44);
    ctx.stroke();
  }
  // Pisau.
  ctx.save();
  ctx.translate(L.x + L.w - 46, L.y + 34);
  ctx.rotate(0.5 + (G.board.chopping ? Math.sin(t * 14) * 0.25 : 0));
  ctx.fillStyle = '#dfe6ea';
  ctx.fillRect(0, 0, 62, 12);
  ctx.fillStyle = '#5d3718';
  ctx.fillRect(-26, 0, 26, 12);
  ctx.restore();
  if (G.board.ing) {
    drawIngredient(ctx, G.board.ing, L.x + L.w / 2, L.y + 108, 30, t);
    const frac = G.board.progress;
    ctx.fillStyle = '#e5dcc4';
    rr(ctx, L.x + 30, L.y + L.h - 30, L.w - 60, 12, 6);
    ctx.fill();
    ctx.fillStyle = '#2ec4b6';
    rr(ctx, L.x + 30, L.y + L.h - 30, (L.w - 60) * frac, 12, 6);
    ctx.fill();
    text(ctx, frac >= 1 ? 'SIAP DIAMBIL' : 'Memotong ' + Math.round(frac * 100) + '%', L.x + L.w / 2, L.y + L.h - 52, 13, '#fff3d6', '700', 'center');
  } else {
    text(ctx, 'TALENAN', L.x + L.w / 2, L.y + 108, 15, '#fff3d6', '800', 'center');
  }
  text(ctx, 'TALENAN', L.x + L.w / 2, L.y + L.h - 8, 14, '#ffd166', '800', 'center');
}

function drawPlatesArea(ctx, G, t) {
  const L = LAYOUT.plates;
  text(ctx, 'PIRING', L.x + L.w / 2, L.y + 8, 14, '#ffd166', '800', 'center');
  G.plates.forEach((plate, i) => {
    const px = L.x + 66 + i * 128;
    const py = L.y + 108;
    const recipe = recipeForPlate(plate.items);
    if (recipe) {
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 4);
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(px, py, 56, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      text(ctx, recipe.name + ' SIAP!', px, py - 66, 13, '#ffd166', '800', 'center');
    }
    drawPlate(ctx, px, py, 52, plate.items, t);
    text(ctx, plate.items.length + '/3', px, py + 40, 12, '#b9a8d8', '700', 'center');
  });
}

function drawPass(ctx, G, t) {
  const L = LAYOUT.pass;
  // Etalase saji.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  rr(ctx, L.x + 3, L.y + 4, L.w, L.h, 10);
  ctx.fill();
  ctx.fillStyle = '#3d3352';
  rr(ctx, L.x, L.y, L.w, L.h, 10);
  ctx.fill();
  ctx.fillStyle = '#554a6e';
  rr(ctx, L.x + 10, L.y + 10, L.w - 20, 90, 8);
  ctx.fill();
  // Lonceng emas.
  const ready = G.plates.some((p) => recipeForPlate(p.items));
  const bx = L.x + L.w / 2;
  const by = L.y + 60;
  if (ready) {
    ctx.save();
    ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * 5);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(bx, by, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(bx - 26, by + 18);
  ctx.quadraticCurveTo(bx - 26, by - 16, bx, by - 16);
  ctx.quadraticCurveTo(bx + 26, by - 16, bx + 26, by + 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#b8860b';
  ctx.fillRect(bx - 30, by + 18, 60, 6);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(bx, by - 24, 5, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, ready ? 'SAJIKAN! [E]' : 'PASS — SAJIKAN', bx, L.y + 128, ready ? 17 : 14, ready ? '#ffd166' : '#b9a8d8', '800', 'center');
  text(ctx, 'Serahkan piring lengkap', bx, L.y + 152, 12, '#b9a8d8', '600', 'center');
  // Piring siap di etalase (gambar kecil bila ada).
  const readyPlate = G.plates.find((p) => recipeForPlate(p.items));
  if (readyPlate) drawPlate(ctx, bx, L.y + 186, 26, readyPlate.items, t);
}

function drawTrash(ctx, G) {
  const L = LAYOUT.trash;
  ctx.fillStyle = G.trash.flash > 0 ? '#e63946' : '#4a4460';
  rr(ctx, L.x, L.y, L.w, L.h, 8);
  ctx.fill();
  ctx.fillStyle = '#2c2438';
  rr(ctx, L.x + 6, L.y - 8, L.w - 12, 12, 4);
  ctx.fill();
  text(ctx, 'SAMPAH', L.x + L.w / 2, L.y + L.h / 2 - 6, 11, '#fff3d6', '800', 'center');
  text(ctx, 'buang', L.x + L.w / 2, L.y + L.h / 2 + 12, 11, '#b9a8d8', '600', 'center');
}

// ---------- koki ----------
function drawChef(ctx, G, t) {
  const c = G.chef;
  const x = c.x;
  const y = CHEF_Y;
  const swing = c.moving ? Math.sin(c.walk) * 7 : 0;
  const bob = c.moving ? Math.abs(Math.sin(c.walk)) * 3 : Math.sin(t * 2) * 1.5;
  const lean = c.moving ? c.dir * 4 : 0;
  ctx.save();
  ctx.translate(x, y - bob);
  ctx.rotate((lean * Math.PI) / 180);
  // Bayangan.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 34, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Kaki.
  ctx.strokeStyle = '#2b2118';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, 6);
  ctx.lineTo(-6 + swing, 32);
  ctx.moveTo(6, 6);
  ctx.lineTo(6 - swing, 32);
  ctx.stroke();
  // Badan: baju putih + celemek merah.
  ctx.fillStyle = '#ffffff';
  rr(ctx, -17, -34, 34, 44, 10);
  ctx.fill();
  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.moveTo(-13, -30);
  ctx.lineTo(13, -30);
  ctx.lineTo(16, 10);
  ctx.lineTo(-16, 10);
  ctx.closePath();
  ctx.fill();
  // Lencana api di celemek.
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(0, -12, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff7a2f';
  ctx.beginPath();
  ctx.arc(0, -12, 3.4, 0, Math.PI * 2);
  ctx.fill();
  // Lengan.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-15, -26);
  ctx.lineTo(-22, -8 - swing * 0.6);
  ctx.moveTo(15, -26);
  ctx.lineTo(22, -8 + swing * 0.6);
  ctx.stroke();
  // Kepala.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(0, -48, 15, 0, Math.PI * 2);
  ctx.fill();
  // Topi koki putih tinggi + pita merah.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-13, -76, 26, 18);
  ctx.beginPath();
  ctx.arc(0, -76, 13, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#e63946';
  ctx.fillRect(-13, -60, 26, 5);
  // Mata + kumis + senyum.
  ctx.fillStyle = '#241a12';
  ctx.beginPath();
  ctx.arc(-5.5, -50, 1.8, 0, Math.PI * 2);
  ctx.arc(5.5, -50, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#241a12';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-7, -42);
  ctx.quadraticCurveTo(0, -39, 7, -42);
  ctx.stroke();
  ctx.strokeStyle = '#241a12';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, -38, 3.4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Bahan yang dibawa di atas kepala.
  if (c.carrying) {
    drawIngredient(ctx, c.carrying.ing, 26, -58, 15, t);
    if (c.carrying.state === 'burnt') {
      text(ctx, 'HANGUS!', 26, -82, 11, '#ff7a6e', '800', 'center');
    }
  }
  ctx.restore();
  // Label MEMBAWA.
  const label = chefCarryLabel(G);
  if (label) {
    ctx.fillStyle = 'rgba(12,8,28,0.85)';
    rr(ctx, x - 52, y + 40, 104, 22, 8);
    ctx.fill();
    text(ctx, 'MEMBAWA: ' + label, x, y + 51, 11, '#ffd166', '700', 'center');
  }
}

// ---------- partikel + banner ----------
function drawParticles(ctx, G) {
  for (const s of G.steam) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 0.4 * (1 - s.t / s.life));
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 8 + s.t * 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (const c of G.coins) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - c.t / 0.9);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  for (const f of G.floaters) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - f.t / 1.4);
    text(ctx, f.text, f.x, f.y - f.t * 34, 18, f.color, '800', 'center');
    ctx.restore();
  }
  if (G.banner) {
    const b = G.banner;
    const a = b.t < 0.3 ? b.t / 0.3 : b.t > b.dur - 0.4 ? (b.dur - b.t) / 0.4 : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    ctx.fillStyle = 'rgba(12,8,28,0.88)';
    rr(ctx, 340, 250, 600, 76, 12);
    ctx.fill();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    rr(ctx, 340, 250, 600, 76, 12);
    ctx.stroke();
    text(ctx, b.text, 640, 276, 24, '#ffd166', '800', 'center');
    if (b.sub) text(ctx, b.sub, 640, 304, 14, '#fff3d6', '600', 'center');
    ctx.restore();
  }
}

function drawHelpBar(ctx, G) {
  const L = LAYOUT.helpBar;
  ctx.fillStyle = 'rgba(12, 8, 28, 0.92)';
  ctx.fillRect(L.x, L.y, L.w, L.h);
  text(ctx, 'Klik bin / stasiun untuk jalan & beraksi  ·  A/D atau ←/→ jalan  ·  E aksi  ·  P jeda  ·  M suara  ·  ENTER mulai', 16, L.y + 26, 14, '#b9a8d8', '600');
  if (G.paused) text(ctx, 'JEDA', W - 60, L.y + 26, 16, '#ffd166', '800', 'right');
}

// ---------- layar judul + akhir ----------
function drawTitle(ctx, G, t) {
  ctx.fillStyle = 'rgba(10, 6, 24, 0.82)';
  ctx.fillRect(0, 0, W, H);
  // Kartu judul.
  ctx.fillStyle = '#fff3d6';
  rr(ctx, 190, 84, 900, 150, 16);
  ctx.fill();
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 4;
  rr(ctx, 190, 84, 900, 150, 16);
  ctx.stroke();
  text(ctx, 'PASAR MALAM', 640, 128, 34, '#8a5a2b', '800', 'center');
  text(ctx, 'WARUNG SAJI', 640, 178, 52, '#e63946', '800', 'center');
  text(ctx, 'Masak di wok, potong di talenan, sajikan sebelum pelanggan pergi!', 640, 214, 16, '#5d4a2a', '600', 'center');
  // Menu 6 resep.
  ctx.fillStyle = 'rgba(255, 243, 214, 0.96)';
  rr(ctx, 240, 256, 800, 240, 14);
  ctx.fill();
  text(ctx, 'MENU — 6 MASAKAN', 640, 282, 16, '#8a5a2b', '800', 'center');
  RECIPES.forEach((r, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 280 + col * 400;
    const y = 312 + row * 62;
    text(ctx, r.name, x, y, 17, PALETTE.ink, '800');
    text(ctx, formatRp(r.price), x + 360, y, 16, '#b8860b', '800', 'right');
    const needs = r.steps.map((s) => INGREDIENTS[s.ing].name + (s.station === 'wok' ? ' (wok)' : ' (talenan)')).join(' + ');
    text(ctx, needs, x, y + 22, 12, '#8a7a5c', '600');
    drawIngredient(ctx, r.steps[0].ing, x - 22, y, 13, t);
  });
  text(ctx, 'Target shift: ' + formatRp(WIN_TARGET) + ' dalam 2:30  ·  3 gelombang: MULAI → JAM RAMAI → PUNCAK', 640, 524, 15, '#fff3d6', '700', 'center');
  const pulse = 0.7 + 0.3 * Math.sin(t * 3);
  ctx.save();
  ctx.globalAlpha = pulse;
  text(ctx, 'TEKAN ENTER ATAU KLIK UNTUK MULAI', 640, 566, 20, '#ffd166', '800', 'center');
  ctx.restore();
  text(ctx, 'Koki Budi siap di dapur — A/D jalan, klik stasiun untuk beraksi', 640, 600, 13, '#b9a8d8', '600', 'center');
}

function drawEnd(ctx, G) {
  const o = G.over;
  ctx.fillStyle = 'rgba(10, 6, 24, 0.85)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff3d6';
  rr(ctx, 340, 130, 600, 400, 16);
  ctx.fill();
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 4;
  rr(ctx, 340, 130, 600, 400, 16);
  ctx.stroke();
  text(ctx, o.won ? 'SHIFT BERHASIL!' : 'SHIFT GAGAL', 640, 180, 40, o.won ? '#2e7d32' : '#e63946', '800', 'center');
  if (o.won) {
    for (let i = 0; i < 3; i++) {
      const sx = 640 + (i - 1) * 64;
      ctx.fillStyle = i < o.stars ? '#ffd166' : '#d8cdb4';
      ctx.beginPath();
      ctx.moveTo(sx, 208);
      ctx.lineTo(sx + 8, 226);
      ctx.lineTo(sx + 26, 228);
      ctx.lineTo(sx + 12, 240);
      ctx.lineTo(sx + 17, 258);
      ctx.lineTo(sx, 248);
      ctx.lineTo(sx - 17, 258);
      ctx.lineTo(sx - 12, 240);
      ctx.lineTo(sx - 26, 228);
      ctx.lineTo(sx - 8, 226);
      ctx.closePath();
      ctx.fill();
    }
  }
  const rows = [
    ['Pendapatan', formatRp(o.revenue) + ' / ' + formatRp(WIN_TARGET)],
    ['Disajikan', String(o.served) + ' piring'],
    ['Streak terbaik', 'x' + o.bestStreak],
    ['Hangus', String(o.burnt)],
    ['Pelanggan pergi', String(o.lost)],
  ];
  rows.forEach(([k, v], i) => {
    const y = 292 + i * 34;
    text(ctx, k, 400, y, 16, '#5d4a2a', '600');
    text(ctx, v, 880, y, 16, PALETTE.ink, '800', 'right');
  });
  text(ctx, o.won ? 'Warungmu ramai — pelanggan pulang senang!' : 'Target tidak tercapai — coba lagi, Koki!', 640, 478, 15, '#5d4a2a', '600', 'center');
  text(ctx, 'TEKAN ENTER UNTUK MAIN LAGI', 640, 510, 17, '#e63946', '800', 'center');
}

// ---------- entry ----------
export function drawGame(ctx, G, t) {
  drawBackground(ctx, t);
  drawTopBar(ctx, G);
  drawTickets(ctx, G, t);
  drawBins(ctx, G, t);
  drawWok(ctx, G, t);
  drawBoard(ctx, G, t);
  drawPlatesArea(ctx, G, t);
  drawPass(ctx, G, t);
  drawTrash(ctx, G);
  drawChef(ctx, G, t);
  drawParticles(ctx, G);
  drawHelpBar(ctx, G);
  if (G.phase === 'title') drawTitle(ctx, G, t);
  if (G.phase === 'won' || G.phase === 'lost') drawEnd(ctx, G);
  if (G.paused && G.phase === 'play') {
    ctx.fillStyle = 'rgba(10, 6, 24, 0.6)';
    ctx.fillRect(0, 0, W, H);
    text(ctx, 'JEDA — tekan P untuk lanjut', 640, 360, 30, '#ffd166', '800', 'center');
  }
}
