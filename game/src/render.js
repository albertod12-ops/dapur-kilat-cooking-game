// Semua gambar canvas: latar pasar malam, stasiun, koki, pelanggan, HUD,
// tiket, layar judul + akhir. Satu file, satu job: melukis state G.
//
// Layout v5 — "line kitchen" ala Copper & Thyme: satu garis counter
// horizontal; tiket di atas, papan menu + lampu gantung + rak di dinding
// belakang, stasiun (wok → talenan → piring → pass) di atas counter,
// bin bahan baris bersih di bawah, koki berjalan di depan counter.
import { H, LAYOUT, SHIFT_SECONDS, STATION_X, W, WAVE_NAMES, WIN_TARGET, binRect, fmtClock, fmtRp, ticketRect } from './config.js';
import { INGREDIENTS, RECIPES } from './recipes.js';
import { drawIngredient, drawPlate } from './food.js';
import { drawCustomerFace, moodOf } from './customers.js';
import { carryLabel } from './state.js';
import { recipeForPlateItems } from './stations.js';

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

// ---------- latar: langit, dinding belakang, counter, lantai ----------
function drawBackground(ctx, t) {
  // Langit malam di belakang baris tiket.
  const sky = ctx.createLinearGradient(0, 54, 0, 152);
  sky.addColorStop(0, '#171233');
  sky.addColorStop(1, '#2a1c55');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 54, W, 98);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 46; i++) {
    const x = (i * 211.7) % W;
    const y = 58 + ((i * 97.3) % 88);
    ctx.globalAlpha = (0.25 + 0.55 * Math.abs(Math.sin(t * 0.7 + i))) * 0.7;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
  // Dinding belakang warung: kayu hangat, papan horizontal.
  ctx.fillStyle = '#4a2c17';
  ctx.fillRect(0, 152, W, 144);
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 2;
  for (let y = 176; y < 296; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  // Lampu gantung: cahaya hangat di dinding + kap + bohlam.
  for (const x of [480, 640, 800]) {
    const glow = ctx.createRadialGradient(x, 240, 4, x, 240, 90);
    glow.addColorStop(0, 'rgba(255,179,71,0.20)');
    glow.addColorStop(1, 'rgba(255,179,71,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 90, 150, 180, 146);
    ctx.strokeStyle = '#2b1c10';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 152);
    ctx.lineTo(x, 214);
    ctx.stroke();
    ctx.fillStyle = '#ff7a2f';
    ctx.beginPath();
    ctx.moveTo(x - 20, 214);
    ctx.lineTo(x + 20, 214);
    ctx.lineTo(x + 12, 232);
    ctx.lineTo(x - 12, 232);
    ctx.closePath();
    ctx.fill();
    const pulse = 0.85 + 0.15 * Math.sin(t * 2 + x * 0.01);
    ctx.save();
    ctx.globalAlpha = 0.35 * pulse;
    ctx.fillStyle = '#ffb347';
    ctx.beginPath();
    ctx.arc(x, 240, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(x, 238, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  // Lampu string di atas dinding (pasar malam).
  ctx.strokeStyle = '#2b1c10';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(340, 158);
  ctx.quadraticCurveTo(640, 176, 990, 158);
  ctx.stroke();
  for (let i = 0; i <= 12; i++) {
    const fx = 340 + (i / 12) * 650;
    const fy = 158 + Math.sin((i / 12) * Math.PI) * 16;
    const cols = ['#ffb347', '#ff7a6e', '#7dc383', '#2ec4b6'];
    ctx.fillStyle = cols[i % 4];
    ctx.beginPath();
    ctx.arc(fx, fy + 6, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Rak + toples bumbu (kanan dinding).
  const jarColors = ['#ffb347', '#7dc383', '#e63946', '#2ec4b6', '#7c5cbf', '#d9a441'];
  for (let i = 0; i < 6; i++) {
    const jx = 1012 + i * 42;
    const jh = 30 + ((i * 7) % 3) * 6;
    const jy = 246 - jh;
    ctx.fillStyle = jarColors[i];
    rr(ctx, jx, jy, 30, jh, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    rr(ctx, jx + 4, jy + 4, 7, jh - 8, 3);
    ctx.fill();
    ctx.fillStyle = '#5d3718';
    ctx.fillRect(jx + 2, jy - 6, 26, 7);
  }
  ctx.fillStyle = '#5d3718';
  ctx.fillRect(1000, 246, 256, 9);
  ctx.fillStyle = '#7a4a22';
  ctx.fillRect(1000, 246, 256, 4);
  // Counter: permukaan atas kayu + badan depan berpanel.
  ctx.fillStyle = '#a06a33';
  ctx.fillRect(0, LAYOUT.counterTopY, W, 36);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(0, 296, W, 3);
  ctx.fillStyle = '#6b4220';
  ctx.fillRect(0, LAYOUT.counterBodyY, W, 138);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  for (let x = 96; x < W; x += 96) {
    ctx.beginPath();
    ctx.moveTo(x, 332);
    ctx.lineTo(x, 470);
    ctx.stroke();
  }
  // Lantai ubin gelap.
  ctx.fillStyle = '#241a33';
  ctx.fillRect(0, 470, W, 110);
  ctx.fillStyle = '#2e2140';
  for (let x = 0; x < W; x += 64) ctx.fillRect(x, 470, 32, 110);
  ctx.fillStyle = '#1d1428';
  for (let x = 32; x < W; x += 64) ctx.fillRect(x, 525, 32, 55);
}

// ---------- papan menu (dinding belakang, kiri) ----------
function drawMenuBoard(ctx) {
  const x = 24;
  const y = 158;
  const w = 306;
  const h = 128;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  rr(ctx, x + 3, y + 4, w, h, 8);
  ctx.fill();
  ctx.fillStyle = '#33302a';
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 4;
  rr(ctx, x, y, w, h, 8);
  ctx.stroke();
  text(ctx, 'MENU WARUNG SAJI', x + w / 2, y + 16, 13, '#ffd166', '800', 'center');
  RECIPES.forEach((r, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const rx = x + 14 + col * 150;
    const ry = y + 42 + row * 28;
    text(ctx, r.name, rx, ry, 12, '#fff3d6', '700');
    text(ctx, fmtRp(r.price), rx + 136, ry, 11, '#ffd166', '800', 'right');
  });
}

// ---------- HUD atas ----------
function drawTopBar(ctx, G) {
  ctx.fillStyle = 'rgba(12, 8, 28, 0.92)';
  ctx.fillRect(0, 0, W, LAYOUT.hudH);
  ctx.fillStyle = '#ffb347';
  ctx.fillRect(0, LAYOUT.hudH - 3, W, 3);
  text(ctx, 'PASAR MALAM: WARUNG SAJI', 18, 27, 24, '#ffd166', '800');
  const items = [
    ['PENDAPATAN', fmtRp(G.revenue) + ' / ' + fmtRp(WIN_TARGET), 250],
    ['STREAK', G.streak > 0 ? 'x' + G.streak : '-', 150],
    ['GELOMBANG', G.wave + ' ' + WAVE_NAMES[G.wave], 150],
  ];
  let x = 560;
  for (const [label, val, w] of items) {
    text(ctx, label, x, 16, 11, '#b9a8d8', '700');
    text(ctx, val, x, 38, 17, '#fff3d6', '800');
    x += w;
  }
  // Timer shift.
  const frac = G.timeLeft / SHIFT_SECONDS;
  const bx = 1100;
  const by = 14;
  const bw = 160;
  const bh = 26;
  ctx.fillStyle = '#3a2c55';
  rr(ctx, bx, by, bw, bh, 6);
  ctx.fill();
  const urgent = G.timeLeft < 30 && G.phase === 'play';
  ctx.fillStyle = urgent ? (Math.sin(G.time * 8) > 0 ? '#e63946' : '#ff7a6e') : '#2ec4b6';
  rr(ctx, bx + 2, by + 2, (bw - 4) * frac, bh - 4, 5);
  ctx.fill();
  text(ctx, fmtClock(G.timeLeft), bx + bw / 2, by + bh / 2, 15, '#ffffff', '800', 'center');
}

// ---------- tiket pesanan ----------
function drawTickets(ctx, G) {
  for (let i = 0; i < 4; i++) {
    const r = ticketRect(i);
    const x = r.x;
    const y = r.y;
    const tk = G.tickets[i];
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    rr(ctx, x + 3, y + 4, r.w, r.h, 10);
    ctx.fill();
    ctx.fillStyle = '#fff8e7';
    rr(ctx, x, y, r.w, r.h, 10);
    ctx.fill();
    if (!tk) {
      ctx.strokeStyle = '#c9bfa8';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      rr(ctx, x + 6, y + 6, r.w - 12, r.h - 12, 8);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'Menunggu pesanan…', x + r.w / 2, y + r.h / 2, 14, '#a89a7c', '600', 'center');
      ctx.restore();
      continue;
    }
    const mood = moodOf(tk.patience, tk.maxPatience);
    drawCustomerFace(ctx, tk.customer, x + 30, y + 32, 22, mood);
    text(ctx, tk.customer.name, x + 58, y + 12, 10, '#8a7a5c', '700');
    text(ctx, tk.recipe.name, x + 58, y + 30, 15, '#241a12', '800');
    text(ctx, fmtRp(tk.recipe.price), x + r.w - 12, y + 12, 13, '#b8860b', '800', 'right');
    text(ctx, Math.ceil(tk.patience) + ' dtk', x + r.w - 12, y + 30, 10, '#8a7a5c', '700', 'right');
    // Checklist bahan: centang bila sudah ada di piring.
    let cx = x + 58;
    for (const step of tk.recipe.steps) {
      const done = G.plate.some((p) => p.ing === step.ing);
      ctx.fillStyle = done ? '#2e7d32' : INGREDIENTS.find((g) => g.id === step.ing).base;
      ctx.beginPath();
      ctx.arc(cx + 7, y + 52, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#241a12';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (done) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx + 3, y + 52);
        ctx.lineTo(cx + 6, y + 55);
        ctx.lineTo(cx + 11, y + 48);
        ctx.stroke();
      }
      const nm = INGREDIENTS.find((g) => g.id === step.ing).name;
      text(ctx, nm, cx + 17, y + 52, 10, '#5d4a2a', '600');
      cx += 17 + nm.length * 6 + 10;
    }
    // Bar kesabaran.
    const pf = Math.max(0, tk.patience / tk.maxPatience);
    ctx.fillStyle = '#e5dcc4';
    rr(ctx, x + 12, y + r.h - 16, r.w - 24, 8, 4);
    ctx.fill();
    ctx.fillStyle = pf > 0.6 ? '#57b25e' : pf > 0.3 ? '#ffb347' : '#e63946';
    rr(ctx, x + 12, y + r.h - 16, (r.w - 24) * pf, 8, 4);
    ctx.fill();
    ctx.restore();
  }
}

// ---------- bin bahan (baris bersih di bawah) ----------
function drawBins(ctx, G, t) {
  for (let i = 0; i < INGREDIENTS.length; i++) {
    const ing = INGREDIENTS[i];
    const r = binRect(i);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    rr(ctx, r.x + 3, r.y + 4, r.w, r.h, 10);
    ctx.fill();
    ctx.fillStyle = '#8a5a2b';
    rr(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.fillStyle = '#a06a33';
    rr(ctx, r.x + 4, r.y + 4, r.w - 8, r.h - 8, 8);
    ctx.fill();
    drawIngredient(ctx, ing.id, r.x + 38, r.y + 46, 24, t);
    text(ctx, ing.name, r.x + 70, r.y + 34, 16, '#fff3d6', '800');
    const dest = RECIPES.some((rc) => rc.steps.some((s) => s.ing === ing.id && s.station === 'wok')) ? '→ WOK' : '→ TALENAN';
    text(ctx, dest, r.x + 70, r.y + 60, 11, '#ffd166', '700');
    if (G.chef.hand && G.chef.hand.ing === ing.id && G.chef.hand.state === 'raw') {
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 3;
      rr(ctx, r.x, r.y, r.w, r.h, 10);
      ctx.stroke();
    }
  }
}

// ---------- wok ----------
function drawWok(ctx, G, t) {
  const cx = STATION_X.wok;
  const cy = 312;
  // Kompor: badan gelap + kenop.
  ctx.fillStyle = '#2c2438';
  rr(ctx, cx - 90, cy + 8, 180, 40, 10);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = '#554a6e';
    ctx.beginPath();
    ctx.arc(cx - 55 + i * 55, cy + 28, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dfe6ea';
    ctx.beginPath();
    ctx.arc(cx - 55 + i * 55, cy + 28, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Api di bawah wok — lidah api terlihat menjilat tepi mangkuk.
  const flick = 0.8 + 0.2 * Math.sin(t * 9);
  const glow = ctx.createRadialGradient(cx, cy + 18, 4, cx, cy + 18, 110);
  glow.addColorStop(0, 'rgba(255,122,47,0.35)');
  glow.addColorStop(1, 'rgba(255,122,47,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 18, 110, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const fx of [cx - 70, cx, cx + 70]) {
    ctx.save();
    ctx.globalAlpha = flick * 0.9;
    ctx.fillStyle = '#ff7a2f';
    ctx.beginPath();
    ctx.moveTo(fx - 13, cy + 20);
    ctx.quadraticCurveTo(fx - 8, cy - 44, fx, cy - 52);
    ctx.quadraticCurveTo(fx + 8, cy - 44, fx + 13, cy + 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(fx - 6, cy + 20);
    ctx.quadraticCurveTo(fx - 4, cy - 30, fx, cy - 34);
    ctx.quadraticCurveTo(fx + 4, cy - 30, fx + 6, cy + 20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // Wok: mangkuk hitam besar.
  ctx.fillStyle = '#1d1826';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 100, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e2540';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 86, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  // Isi wok.
  if (G.wok) {
    if (G.wok.state === 'burnt') {
      ctx.fillStyle = '#241a12';
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 24, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, 'HANGUS!', cx, cy - 42, 13, '#ff7a6e', '800', 'center');
    } else {
      drawIngredient(ctx, G.wok.ing, cx, cy - 4, 24, t);
      const frac = Math.min(1, G.wok.t / 3.0);
      ctx.strokeStyle = G.wok.state === 'done' ? '#ffd166' : '#2ec4b6';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 32, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
      if (G.wok.state === 'done') text(ctx, 'MATANG!', cx, cy - 44, 13, '#ffd166', '800', 'center');
    }
  }
  text(ctx, 'WOK', cx, 356, 13, '#ffd166', '800', 'center');
}

// ---------- talenan ----------
function drawBoard(ctx, G, t) {
  const cx = STATION_X.board;
  const x = cx - 80;
  const y = 288;
  const w = 160;
  const h = 56;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  rr(ctx, x + 3, y + 4, w, h, 10);
  ctx.fill();
  ctx.fillStyle = '#c89a5e';
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = '#a67c3f';
  ctx.lineWidth = 2;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 10, y + i * 18);
    ctx.lineTo(x + w - 10, y + i * 18);
    ctx.stroke();
  }
  // Pisau.
  ctx.save();
  ctx.translate(x + w - 40, y + 8);
  ctx.rotate(0.5 + (G.board && G.board.state === 'chopping' ? Math.sin(t * 14) * 0.25 : 0));
  ctx.fillStyle = '#dfe6ea';
  ctx.fillRect(0, 0, 56, 11);
  ctx.fillStyle = '#5d3718';
  ctx.fillRect(-24, 0, 24, 11);
  ctx.restore();
  if (G.board) {
    drawIngredient(ctx, G.board.ing, cx, y + 30, 26, t);
    const frac = Math.min(1, G.board.t / 2.0);
    ctx.fillStyle = '#e5dcc4';
    rr(ctx, x + 20, y + h + 8, w - 40, 10, 5);
    ctx.fill();
    ctx.fillStyle = '#2ec4b6';
    rr(ctx, x + 20, y + h + 8, (w - 40) * frac, 10, 5);
    ctx.fill();
    text(ctx, G.board.state === 'done' ? 'SIAP DIAMBIL' : 'Memotong ' + Math.round(frac * 100) + '%', cx, y + h + 28, 12, '#fff3d6', '700', 'center');
  }
  text(ctx, 'TALENAN', cx, y + h + 46, 13, '#ffd166', '800', 'center');
}

// ---------- piring ----------
function drawPlateStation(ctx, G, t) {
  const cx = STATION_X.plate;
  const cy = 318;
  const recipe = recipeForPlateItems(G.plate);
  if (recipe) {
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 4);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 56, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    text(ctx, recipe.name + ' SIAP!', cx, cy - 66, 13, '#ffd166', '800', 'center');
  }
  drawPlate(ctx, cx, cy, 52, G.plate, t);
  text(ctx, G.plate.length + '/3', cx, cy + 30, 12, '#fff3d6', '700', 'center');
  text(ctx, 'PIRING', cx, 356, 13, '#ffd166', '800', 'center');
}

// ---------- pass + lonceng ----------
function drawPass(ctx, G, t) {
  const cx = STATION_X.pass;
  const x = cx - 110;
  const y = 268;
  const w = 220;
  const h = 96;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  rr(ctx, x + 3, y + 4, w, h, 10);
  ctx.fill();
  ctx.fillStyle = '#3d3352';
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.fillStyle = '#554a6e';
  rr(ctx, x + 10, y + 10, w - 20, 76, 8);
  ctx.fill();
  const ready = !!recipeForPlateItems(G.plate);
  const bx = cx;
  const by = y + 48;
  if (ready) {
    ctx.save();
    ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * 5);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(bx, by, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(bx - 24, by + 16);
  ctx.quadraticCurveTo(bx - 24, by - 14, bx, by - 14);
  ctx.quadraticCurveTo(bx + 24, by - 14, bx + 24, by + 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#b8860b';
  ctx.fillRect(bx - 28, by + 16, 56, 6);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(bx, by - 22, 5, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, ready ? 'SAJIKAN! [E]' : 'PASS — SAJIKAN', cx, 356, ready ? 16 : 13, ready ? '#ffd166' : '#b9a8d8', '800', 'center');
}

// ---------- tempat sampah ----------
function drawTrash(ctx, G) {
  const x = 70;
  const y = 300;
  const w = 100;
  const h = 64;
  ctx.fillStyle = G.trashFlash > 0 ? '#e63946' : '#4a4460';
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.fillStyle = '#2c2438';
  rr(ctx, x + 6, y - 6, w - 12, 10, 4);
  ctx.fill();
  text(ctx, 'SAMPAH', x + w / 2, y + 28, 11, '#fff3d6', '800', 'center');
  text(ctx, 'buang', x + w / 2, y + 48, 10, '#b9a8d8', '600', 'center');
}

// ---------- koki ----------
function drawChef(ctx, G, t) {
  const c = G.chef;
  const x = c.x;
  const y = LAYOUT.chefFeetY;
  const swing = c.moving ? Math.sin(c.walk) * 7 : 0;
  const bob = c.moving ? Math.abs(Math.sin(c.walk)) * 3 : Math.sin(t * 2) * 1.5;
  const lean = c.moving ? c.dir * 4 : 0;
  ctx.save();
  ctx.translate(x, y - bob);
  ctx.rotate((lean * Math.PI) / 180);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 34, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b2118';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, 6);
  ctx.lineTo(-6 + swing, 32);
  ctx.moveTo(6, 6);
  ctx.lineTo(6 - swing, 32);
  ctx.stroke();
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
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(0, -12, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff7a2f';
  ctx.beginPath();
  ctx.arc(0, -12, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-15, -26);
  ctx.lineTo(-22, -8 - swing * 0.6);
  ctx.moveTo(15, -26);
  ctx.lineTo(22, -8 + swing * 0.6);
  ctx.stroke();
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(0, -48, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-13, -76, 26, 18);
  ctx.beginPath();
  ctx.arc(0, -76, 13, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#e63946';
  ctx.fillRect(-13, -60, 26, 5);
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
  if (c.hand) {
    drawIngredient(ctx, c.hand.ing, 26, -58, 15, t);
    if (c.hand.state === 'burnt') {
      text(ctx, 'HANGUS!', 26, -82, 11, '#ff7a6e', '800', 'center');
    }
  }
  ctx.restore();
  const label = carryLabel(G);
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
    rr(ctx, 340, 380, 600, 76, 12);
    ctx.fill();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    rr(ctx, 340, 380, 600, 76, 12);
    ctx.stroke();
    text(ctx, b.text, 640, 406, 24, '#ffd166', '800', 'center');
    if (b.sub) text(ctx, b.sub, 640, 434, 14, '#fff3d6', '600', 'center');
    ctx.restore();
  }
}

function drawHelpBar(ctx, G) {
  ctx.fillStyle = 'rgba(12, 8, 28, 0.92)';
  ctx.fillRect(0, LAYOUT.helpY, W, H - LAYOUT.helpY);
  text(ctx, 'Klik bin / stasiun untuk jalan & beraksi  ·  A/D atau ←/→ jalan  ·  E aksi  ·  P jeda  ·  M suara  ·  ENTER mulai', 16, LAYOUT.helpY + 19, 14, '#b9a8d8', '600');
  if (G.paused) text(ctx, 'JEDA', W - 60, LAYOUT.helpY + 19, 16, '#ffd166', '800', 'right');
}

// ---------- layar judul + akhir ----------
function drawTitle(ctx, G, t) {
  ctx.fillStyle = 'rgba(10, 6, 24, 0.82)';
  ctx.fillRect(0, 0, W, H);
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
  ctx.fillStyle = 'rgba(255, 243, 214, 0.96)';
  rr(ctx, 240, 256, 800, 240, 14);
  ctx.fill();
  text(ctx, 'MENU — 6 MASAKAN', 640, 282, 16, '#8a5a2b', '800', 'center');
  RECIPES.forEach((r, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 280 + col * 400;
    const y = 312 + row * 62;
    text(ctx, r.name, x, y, 17, '#241a12', '800');
    text(ctx, fmtRp(r.price), x + 360, y, 16, '#b8860b', '800', 'right');
    const needs = r.steps.map((s) => {
      const nm = INGREDIENTS.find((g) => g.id === s.ing).name;
      return nm + (s.station === 'wok' ? ' (wok)' : ' (talenan)');
    }).join(' + ');
    text(ctx, needs, x, y + 22, 12, '#8a7a5c', '600');
    drawIngredient(ctx, r.steps[0].ing, x - 22, y, 13, t);
  });
  text(ctx, 'Target shift: ' + fmtRp(WIN_TARGET) + ' dalam 3:00  ·  3 gelombang: MULAI → JAM RAMAI → PUNCAK', 640, 524, 15, '#fff3d6', '700', 'center');
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
    ['Pendapatan', fmtRp(o.revenue) + ' / ' + fmtRp(WIN_TARGET)],
    ['Disajikan', String(o.served) + ' piring'],
    ['Streak terbaik', 'x' + o.bestStreak],
    ['Hangus', String(o.burnt)],
    ['Pelanggan pergi', String(o.lost)],
  ];
  rows.forEach(([k, v], i) => {
    const y = 292 + i * 34;
    text(ctx, k, 400, y, 16, '#5d4a2a', '600');
    text(ctx, v, 880, y, 16, '#241a12', '800', 'right');
  });
  text(ctx, o.won ? 'Warungmu ramai — pelanggan pulang senang!' : 'Target tidak tercapai — coba lagi, Koki!', 640, 478, 15, '#5d4a2a', '600', 'center');
  text(ctx, 'TEKAN ENTER UNTUK MAIN LAGI', 640, 510, 17, '#e63946', '800', 'center');
}

// ---------- entry ----------
export function drawGame(ctx, G, t) {
  drawBackground(ctx, t);
  drawMenuBoard(ctx);
  drawTopBar(ctx, G);
  drawTickets(ctx, G);
  drawBins(ctx, G, t);
  drawWok(ctx, G, t);
  drawBoard(ctx, G, t);
  drawPlateStation(ctx, G, t);
  drawPass(ctx, G, t);
  drawTrash(ctx, G);
  if (G.phase !== 'title' && G.phase !== 'won' && G.phase !== 'lost') drawChef(ctx, G, t);
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
