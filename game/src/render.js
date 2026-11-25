// Everything the player sees: the kitchen, the order board, the counter, the stove,
// the plate, the bell and every screen. Pure canvas drawing, no images, no network.
import {
  BINS, CHOP_CLICKS, COOK_BURN_AT, COOK_PERFECT_FROM, COOK_SECONDS,
  INGREDIENTS, SHIFT_SECONDS, TARGET_COINS, VIEW,
} from './config.js';
import { LAYOUT } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const INK = '#2b1d12';
const CREAM = '#fff6e3';
const WOOD = '#b07a3e';
const WOOD_DARK = '#8a5a28';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = '700', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** Draw one ingredient as a little canvas picture. `size` is its bounding box. */
export function drawIngredient(ctx, id, x, y, size) {
  const c = size / 2;
  const cx = x + c;
  const cy = y + c;
  ctx.save();
  switch (id) {
    case 'bunBottom':
      ctx.fillStyle = '#e8a54b';
      rr(ctx, x + 4, cy - 2, size - 8, size * 0.42, 6); ctx.fill();
      ctx.fillStyle = '#d18a2e';
      ctx.fillRect(x + 8, cy + size * 0.28, size - 16, 3);
      break;
    case 'bunTop':
      ctx.fillStyle = '#e8a54b';
      ctx.beginPath(); ctx.arc(cx, cy + 6, c - 4, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f7e3b0';
      for (const [dx, dy] of [[-12, -8], [0, -14], [12, -8]]) {
        ctx.beginPath(); ctx.ellipse(cx + dx, cy + dy, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
      }
      break;
    case 'pattyRaw':
    case 'patty':
      ctx.fillStyle = id === 'patty' ? '#7a3b22' : '#b0563a';
      ctx.beginPath(); ctx.ellipse(cx, cy, c - 3, c * 0.55, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (const [dx, dy] of [[-10, -4], [4, 2], [12, -6]]) {
        ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 3, 0, Math.PI * 2); ctx.fill();
      }
      break;
    case 'lettuceRaw':
    case 'lettuce':
      ctx.fillStyle = '#7bc043';
      ctx.beginPath();
      ctx.moveTo(cx - c + 4, cy + 6);
      ctx.quadraticCurveTo(cx - c + 2, cy - c + 6, cx, cy - c + 8);
      ctx.quadraticCurveTo(cx + c - 2, cy - c + 6, cx + c - 4, cy + 6);
      ctx.quadraticCurveTo(cx, cy + c - 2, cx - c + 4, cy + 6);
      ctx.fill();
      ctx.strokeStyle = '#5da32e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy - c + 10); ctx.lineTo(cx, cy + c - 8); ctx.stroke();
      break;
    case 'tomatoRaw':
    case 'tomato': {
      ctx.fillStyle = '#e23b2e';
      ctx.beginPath(); ctx.arc(cx, cy, c - 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff7a68';
      ctx.beginPath(); ctx.arc(cx, cy, c - 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd9d4';
      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8, 4, 2, a, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#4da96b';
      ctx.beginPath(); ctx.arc(cx, cy - c + 4, 5, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'cheese':
      ctx.fillStyle = '#ffcf3d';
      ctx.beginPath(); ctx.moveTo(x + 4, y + size - 6); ctx.lineTo(cx, y + 6); ctx.lineTo(x + size - 4, y + size - 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8a90c';
      for (const [dx, dy] of [[-8, 8], [6, 12], [0, -2]]) {
        ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 3.5, 0, Math.PI * 2); ctx.fill();
      }
      break;
    case 'eggRaw':
      ctx.fillStyle = '#f7ead0';
      ctx.beginPath(); ctx.ellipse(cx, cy, c - 6, c - 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d8c49a'; ctx.lineWidth = 2; ctx.stroke();
      break;
    case 'egg':
      ctx.fillStyle = '#fff8ea';
      ctx.beginPath(); ctx.ellipse(cx, cy, c - 2, c - 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd94d';
      ctx.beginPath(); ctx.arc(cx, cy, c * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f2b705';
      ctx.beginPath(); ctx.arc(cx - 2, cy - 2, c * 0.28, 0, Math.PI * 2); ctx.fill();
      break;
    case 'cucumberRaw':
    case 'cucumber':
      ctx.fillStyle = '#4da96b';
      ctx.beginPath(); ctx.ellipse(cx, cy, c - 2, c * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#bfe8c8';
      ctx.beginPath(); ctx.ellipse(cx, cy, c - 9, c * 0.6 - 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8fd0a2';
      for (const dx of [-8, 0, 8]) { ctx.beginPath(); ctx.arc(cx + dx, cy, 2, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'sauce':
      ctx.fillStyle = '#ff8c42';
      rr(ctx, cx - 9, y + 12, 18, size - 22, 5); ctx.fill();
      ctx.fillStyle = '#d96a1e';
      ctx.fillRect(cx - 9, y + 12, 18, 8);
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx - 5, y + 26, 10, 12);
      break;
    case 'riceRaw':
    case 'rice':
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(cx, cy + 6, c - 4, c * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = id === 'rice' ? '#e8b64c' : '#f2ead8';
      ctx.beginPath(); ctx.ellipse(cx, cy, c - 4, c * 0.55, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = id === 'rice' ? '#c97b2d' : '#cbb98f';
      for (const [dx, dy] of [[-8, -4], [2, -8], [9, -3]]) { ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 2.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#3a6ea5';
      ctx.beginPath(); ctx.ellipse(cx, cy + 10, c - 2, 6, 0, 0, Math.PI); ctx.fill();
      break;
    case 'chickenRaw':
    case 'chicken':
      ctx.fillStyle = id === 'chicken' ? '#c97b2d' : '#e8a0a0';
      ctx.beginPath(); ctx.ellipse(cx, cy, c - 4, c * 0.62, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(cx - 6, cy - 6, 8, 5, 0.3, 0, Math.PI * 2); ctx.fill();
      break;
    case 'pastaRaw':
    case 'pasta':
      ctx.strokeStyle = id === 'pasta' ? '#f7c948' : '#f0d48a';
      ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x + 6, cy + i * 10);
        ctx.quadraticCurveTo(cx, cy + i * 10 - 8, x + size - 6, cy + i * 10);
        ctx.stroke();
      }
      if (id === 'pasta') {
        ctx.fillStyle = '#e23b2e';
        ctx.beginPath(); ctx.arc(cx - 8, cy + 4, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 10, cy - 2, 4, 0, Math.PI * 2); ctx.fill();
      }
      break;
    default:
      ctx.fillStyle = '#999';
      ctx.fillRect(x + 6, y + 6, size - 12, size - 12);
  }
  ctx.restore();
}

function drawTicket(ctx, ticket, x, y, w, h) {
  const frac = Math.max(0, ticket.patience / ticket.total);
  const urgent = frac < 0.35;
  ctx.save();
  ctx.fillStyle = urgent ? '#ffe1d6' : '#fffdf6';
  ctx.strokeStyle = urgent ? '#e23b2e' : '#d8c49a';
  ctx.lineWidth = urgent ? 3 : 2;
  rr(ctx, x, y, w, h, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = ticket.customer.color;
  ctx.beginPath(); ctx.arc(x + 24, y + 22, 13, 0, Math.PI * 2); ctx.fill();
  // The customer's mood follows their patience: happy, worried, furious.
  text(ctx, frac > 0.6 ? '😊' : frac > 0.35 ? '😐' : '😠', x + 24, y + 22, 15, '#fff', '800', 'center');
  text(ctx, ticket.customer.name.split(' ')[0], x + 42, y + 16, 13, INK);
  text(ctx, ticket.recipe.name, x + 42, y + 34, 13, '#7a5a28', '600');
  // Needed ingredients as mini icons, left to right.
  let ix = x + 12;
  for (const need of ticket.recipe.needs) {
    drawIngredient(ctx, need, ix, y + 48, 26);
    ix += 30;
  }
  // Patience bar.
  ctx.fillStyle = '#e8dcc8';
  rr(ctx, x + 12, y + h - 18, w - 24, 10, 5); ctx.fill();
  ctx.fillStyle = urgent ? '#e23b2e' : frac < 0.6 ? '#ff8c42' : '#7bc043';
  if (w - 24 > 4) { rr(ctx, x + 12, y + h - 18, Math.max(10, (w - 24) * frac), 10, 5); ctx.fill(); }
  text(ctx, `Rp${ticket.recipe.price}k`, x + w - 12, y + 16, 13, '#2b7a3a', '700', 'right');
  ctx.restore();
}

function drawBurner(ctx, slot, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#3c3c44';
  rr(ctx, x, y, w, h, 12); ctx.fill();
  ctx.fillStyle = '#222228';
  ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2 + 8, w * 0.32, h * 0.24, 0, 0, Math.PI * 2); ctx.fill();
  if (!slot) {
    ctx.strokeStyle = '#565660'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2 + 8, w * 0.32, h * 0.24, 0, 0, Math.PI * 2); ctx.stroke();
    return;
  }
  const t = slot.t;
  if (slot.burnt) {
    drawIngredient(ctx, slot.item, x + w / 2 - 26, y + 14, 52);
    ctx.fillStyle = 'rgba(20,10,5,0.55)';
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2 + 8, w * 0.3, h * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    text(ctx, 'GOSONG! Klik untuk buang', x + w / 2, y + h - 16, 12, '#ffb3a0', '700', 'center');
  } else {
    // Flame under the pan.
    const flick = 4 + Math.sin(Date.now() / 90 + x) * 2;
    ctx.fillStyle = '#ff8c42';
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 22, y + h - 26);
    ctx.quadraticCurveTo(x + w / 2, y + h - 26 - 18 - flick, x + w / 2 + 22, y + h - 26);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 12, y + h - 26);
    ctx.quadraticCurveTo(x + w / 2, y + h - 26 - 10 - flick / 2, x + w / 2 + 12, y + h - 26);
    ctx.closePath(); ctx.fill();
    // Pan with the ingredient.
    ctx.fillStyle = '#55555e';
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2 + 10, w * 0.34, h * 0.26, 0, 0, Math.PI * 2); ctx.fill();
    drawIngredient(ctx, slot.item, x + w / 2 - 24, y + 16, 48);
    // Steam rising off the pan.
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const now = Date.now() / 300;
    for (let i = 0; i < 3; i += 1) {
      const sy = y + 26 - ((now + i * 2.1) % 6) * 5;
      const sx = x + w / 2 - 18 + i * 18 + Math.sin(now + i) * 3;
      ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fill();
    }
    // Cook progress: grey -> green perfect zone -> red burn.
    const frac = Math.min(1, t / COOK_BURN_AT);
    const px = x + 14; const pw = w - 28;
    ctx.fillStyle = '#e8dcc8';
    rr(ctx, px, y + h - 30, pw, 10, 5); ctx.fill();
    const perfectX = px + (COOK_PERFECT_FROM / COOK_BURN_AT) * pw;
    const perfectW = ((COOK_SECONDS + 1.5) / COOK_BURN_AT) * pw;
    ctx.fillStyle = 'rgba(123,192,67,0.45)';
    ctx.fillRect(perfectX, y + h - 30, perfectW, 10);
    ctx.fillStyle = t >= COOK_SECONDS ? '#7bc043' : '#ff8c42';
    rr(ctx, px, y + h - 30, Math.max(8, pw * frac), 10, 5); ctx.fill();
    text(ctx, t >= COOK_SECONDS ? 'MATANG — ambil!' : 'Memasak…', x + w / 2, y + h - 44, 12, '#fff', '700', 'center');
  }
  ctx.restore();
}

export function createRenderer(canvas) {
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  const ctx = canvas.getContext('2d');

  function drawTopBar(state, screen) {
    ctx.fillStyle = '#5a2d18';
    ctx.fillRect(0, 0, VIEW.width, 80);
    text(ctx, '🍳 DAPUR KILAT', 24, 26, 30, '#ffd94d', '800');
    text(ctx, 'Sizzle & Serve — shift masak 150 detik', 24, 56, 14, '#f7e3b0', '500');
    const mins = Math.max(0, Math.ceil(state.timeLeft));
    const mm = Math.floor(mins / 60);
    const ss = String(mins % 60).padStart(2, '0');
    text(ctx, `⏱ ${mm}:${ss}`, 640, 30, 26, state.timeLeft < 30 ? '#ff8c7a' : '#fff', '800', 'center');
    const tfrac = Math.max(0, state.timeLeft / SHIFT_SECONDS);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    rr(ctx, 520, 52, 240, 10, 5); ctx.fill();
    ctx.fillStyle = tfrac < 0.2 ? '#ff5a45' : '#7bc043';
    rr(ctx, 520, 52, Math.max(8, 240 * tfrac), 10, 5); ctx.fill();
    text(ctx, `🪙 ${state.coins} / ${TARGET_COINS}`, 830, 30, 24, '#ffd94d', '800');
    text(ctx, `✅ ${state.served} disajikan   ❌ ${state.lost} hangus`, 830, 56, 14, '#f7e3b0', '600');
    if (state.combo >= 2) {
      text(ctx, `🔥 KOMBO x${state.combo}`, 1150, 30, 22, '#ff8c42', '800', 'center');
      text(ctx, `${Math.ceil(state.comboLeft)} dtk`, 1150, 56, 13, '#f7e3b0', '600', 'center');
    }
    if (state.timeLeft <= 30 && !state.over) {
      text(ctx, '🔥 JAM SIBUK', 640, 70, 13, '#ff8c7a', '800', 'center');
    }
    void screen;
  }

  function drawBoard(state) {
    const b = LAYOUT.board;
    ctx.fillStyle = '#7a4a21';
    rr(ctx, b.x - 8, b.y - 8, b.w + 16, b.h + 16, 14); ctx.fill();
    text(ctx, '📋 PAPAN PESANAN', b.x + 4, b.y - 22, 15, '#fff', '800');
    if (state.tickets.length === 0) {
      text(ctx, 'Belum ada pesanan — pelanggan segera datang…', b.x + 16, b.y + b.h / 2, 16, '#f7e3b0', '600');
      return;
    }
    state.tickets.forEach((ticket, i) => {
      const x = b.x + 8 + i * (LAYOUT.ticket.w + LAYOUT.ticket.gap);
      drawTicket(ctx, ticket, x, b.y + 6, LAYOUT.ticket.w, LAYOUT.ticket.h);
    });
  }

  function drawBins(state) {
    const bins = LAYOUT.bins;
    ctx.fillStyle = '#a06a35';
    rr(ctx, bins.x - 8, bins.y - 8, bins.w + 16, bins.h + 16, 14); ctx.fill();
    text(ctx, '🧺 BAHAN DI MEJA — klik / tekan 1–0 untuk ambil', bins.x + 4, bins.y - 22, 15, '#fff', '800');
    BINS.forEach((id, i) => {
      const x = bins.x + i * (bins.cell + bins.gap);
      const ing = INGREDIENTS[id];
      ctx.fillStyle = state.hand === id ? '#ffe9a8' : '#fffdf6';
      ctx.strokeStyle = state.hand === id ? '#ff8c42' : '#d8c49a';
      ctx.lineWidth = state.hand === id ? 3 : 2;
      rr(ctx, x, bins.y, bins.cell, bins.h, 10); ctx.fill(); ctx.stroke();
      drawIngredient(ctx, id, x + (bins.cell - 44) / 2, bins.y + 6, 44);
      text(ctx, ing.name, x + bins.cell / 2, bins.y + 66, 11, INK, '700', 'center');
      if (ing.key) text(ctx, `[${ing.key}]`, x + bins.cell - 8, bins.y + 14, 11, '#9a7a4a', '700', 'right');
    });
  }

  function drawWork(state) {
    const w = LAYOUT.work;
    ctx.fillStyle = '#c98f4e';
    rr(ctx, w.x - 8, w.y - 8, w.w + 16, w.h + 16, 14); ctx.fill();
    // Chopping board.
    const chop = LAYOUT.chop;
    ctx.fillStyle = '#8a5a28';
    rr(ctx, chop.x - 6, chop.y - 6, chop.w + 12, chop.h + 12, 12); ctx.fill();
    text(ctx, '🔪 TALENAN — klik 3x untuk potong', chop.x + 4, chop.y - 20, 14, '#fff', '800');
    ctx.fillStyle = '#e8c88a';
    rr(ctx, chop.x, chop.y, chop.w, chop.h, 10); ctx.fill();
    if (state.board) {
      drawIngredient(ctx, state.board.item, chop.x + chop.w / 2 - 40, chop.y + 30, 80);
      text(ctx, `${'●'.repeat(state.board.clicks)}${'○'.repeat(CHOP_CLICKS - state.board.clicks)}`, chop.x + chop.w / 2, chop.y + 150, 22, INK, '800', 'center');
      text(ctx, 'Klik lagi untuk memotong!', chop.x + chop.w / 2, chop.y + 178, 13, '#7a5a28', '700', 'center');
    } else {
      text(ctx, 'Taruh sayur mentah di sini', chop.x + chop.w / 2, chop.y + 90, 14, '#9a7a4a', '600', 'center');
      text(ctx, '(tomat / selada / timun) — [C]', chop.x + chop.w / 2, chop.y + 114, 13, '#b08a5a', '600', 'center');
    }
    // Stove.
    const stove = LAYOUT.stove;
    text(ctx, '🔥 KOMPOR — Q / W untuk ambil', stove.x + 4, stove.y - 20, 14, '#fff', '800');
    const half = stove.w / 2 - 4;
    drawBurner(ctx, state.stove[0], stove.x, stove.y, half, stove.h);
    drawBurner(ctx, state.stove[1], stove.x + half + 8, stove.y, half, stove.h);
    // Plate.
    const plate = LAYOUT.plate;
    ctx.fillStyle = '#8a5a28';
    rr(ctx, plate.x - 6, plate.y - 6, plate.w + 12, plate.h + 12, 12); ctx.fill();
    text(ctx, '🍽️ PIRING — susun pesanan di sini', plate.x + 4, plate.y - 20, 14, '#fff', '800');
    ctx.fillStyle = '#fdf6e3';
    rr(ctx, plate.x, plate.y, plate.w, plate.h, 10); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(plate.x + plate.w / 2, plate.y + 108, 118, 62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d8c49a'; ctx.lineWidth = 3; ctx.stroke();
    if (state.plate.length === 0) {
      text(ctx, 'Piring kosong', plate.x + plate.w / 2, plate.y + 108, 14, '#b08a5a', '600', 'center');
    } else {
      // Stack the plated ingredients upward from the plate.
      const n = state.plate.length;
      state.plate.forEach((id, i) => {
        const size = 54;
        const y = plate.y + 108 - 26 - i * 16;
        drawIngredient(ctx, id, plate.x + plate.w / 2 - size / 2, y - size / 2, size);
        void n;
      });
      text(ctx, `${state.plate.length} bahan di piring`, plate.x + plate.w / 2, plate.y + plate.h - 14, 12, '#7a5a28', '700', 'center');
    }
    // Bell + trash.
    const bell = LAYOUT.bell;
    const ready = state.plate.length > 0 && state.tickets.some((t) => {
      const count = (l) => { const m = new Map(); for (const x of l) m.set(x, (m.get(x) ?? 0) + 1); return m; };
      const a = count(state.plate); const b = count(t.recipe.needs);
      if (a.size !== b.size) return false;
      for (const [k, v] of a) if (b.get(k) !== v) return false;
      return true;
    });
    ctx.fillStyle = ready ? '#ffd94d' : '#d8c49a';
    ctx.strokeStyle = '#8a5a28'; ctx.lineWidth = 3;
    rr(ctx, bell.x, bell.y, bell.w, bell.h, 12); ctx.fill(); ctx.stroke();
    text(ctx, '🔔', bell.x + bell.w / 2, bell.y + 34, 30, INK, '800', 'center');
    text(ctx, ready ? 'SAJIKAN! [E]' : 'Lonceng [E]', bell.x + bell.w / 2, bell.y + 72, 12, INK, '800', 'center');
    const trash = LAYOUT.trash;
    ctx.fillStyle = '#e8dcc8';
    ctx.strokeStyle = '#8a5a28'; ctx.lineWidth = 3;
    rr(ctx, trash.x, trash.y, trash.w, trash.h, 12); ctx.fill(); ctx.stroke();
    text(ctx, '🗑️', trash.x + trash.w / 2, trash.y + 34, 30, INK, '800', 'center');
    text(ctx, 'Buang [T]', trash.x + trash.w / 2, trash.y + 72, 12, INK, '800', 'center');
    // Hand.
    const hand = LAYOUT.hand;
    ctx.fillStyle = '#fdf6e3';
    rr(ctx, hand.x, hand.y, hand.w, hand.h, 12); ctx.fill();
    ctx.strokeStyle = '#d8c49a'; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, 'TANGAN', hand.x + hand.w / 2, hand.y + 18, 13, '#7a5a28', '800', 'center');
    if (state.hand) {
      drawIngredient(ctx, state.hand, hand.x + 22, hand.y + 44, 60);
      text(ctx, INGREDIENTS[state.hand].name, hand.x + hand.w / 2, hand.y + 130, 12, INK, '700', 'center');
      const ing = INGREDIENTS[state.hand];
      const hint = ing.prep === 'chop' ? '→ talenan' : ing.prep === 'cook' ? '→ kompor' : '→ piring';
      text(ctx, hint, hand.x + hand.w / 2, hand.y + 152, 12, '#2b7a3a', '700', 'center');
    } else {
      text(ctx, '(kosong)', hand.x + hand.w / 2, hand.y + 90, 13, '#b08a5a', '600', 'center');
    }
  }

  function drawBottom(state) {
    text(ctx, 'Cara main: ambil bahan → potong di talenan / masak di kompor → susun di piring → bunyikan lonceng.  [P] jeda  [M] suara  [R] ulang', 24, 648, 14, '#f7e3b0', '600');
    text(ctx, `Shift ${Math.floor(state.elapsed / 60)}:${String(Math.floor(state.elapsed % 60)).padStart(2, '0')}  •  Target ${TARGET_COINS} koin`, 1256, 648, 14, '#f7e3b0', '600', 'right');
    if (state.message && state.messageT > 0) {
      ctx.fillStyle = 'rgba(43,29,18,0.85)';
      rr(ctx, 340, 668, 600, 36, 10); ctx.fill();
      text(ctx, state.message, 640, 686, 15, '#ffd94d', '700', 'center');
    }
  }

  function drawKitchen(state) {
    // Wall + floor.
    ctx.fillStyle = '#f3d9a4';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#e8c88a';
    for (let y = 80; y < 340; y += 34) {
      ctx.fillRect(0, y, VIEW.width, 2);
      for (let x = (y / 34) % 2 === 0 ? 0 : 34; x < VIEW.width; x += 68) ctx.fillRect(x, y, 2, 34);
    }
    ctx.fillStyle = '#c98f4e';
    ctx.fillRect(0, 620, VIEW.width, 100);
    ctx.fillStyle = '#8a5a28';
    ctx.fillRect(0, 616, VIEW.width, 4);
    drawTopBar(state);
    drawBoard(state);
    drawBins(state);
    drawWork(state);
    drawBottom(state);
  }

  function drawTitle(state, best) {
    drawKitchen(state);
    ctx.fillStyle = 'rgba(43,29,18,0.72)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = CREAM;
    rr(ctx, 290, 120, 700, 480, 20); ctx.fill();
    ctx.strokeStyle = '#ff8c42'; ctx.lineWidth = 4; ctx.stroke();
    text(ctx, '🍳 DAPUR KILAT', 640, 180, 52, '#c0392b', '800', 'center');
    text(ctx, 'Sizzle & Serve', 640, 226, 26, '#7a5a28', '700', 'center');
    text(ctx, 'Shift masak paling sibuk di kota! Pesanan datang terus —', 640, 292, 17, INK, '600', 'center');
    text(ctx, 'potong, masak, susun, sajikan sebelum pelanggan pergi.', 640, 318, 17, INK, '600', 'center');
    text(ctx, '🥩 Masak sampai zona hijau = sempurna  •  🔥 Jangan sampai gosong', 640, 362, 16, INK, '600', 'center');
    text(ctx, '🔔 Sajikan cepat = tip besar  •  🔥 Kombo = koin berlipat', 640, 390, 16, INK, '600', 'center');
    text(ctx, `🎯 Target shift: ${TARGET_COINS} koin dalam ${SHIFT_SECONDS} detik`, 640, 428, 17, '#2b7a3a', '800', 'center');
    text(ctx, '8 resep di menu  •  30 detik terakhir = jam sibuk', 640, 456, 15, INK, '600', 'center');
    if (best > 0) text(ctx, `Rekor koin: ${best}`, 640, 460, 16, INK, '700', 'center');
    ctx.fillStyle = '#e23b2e';
    rr(ctx, 480, 500, 320, 56, 14); ctx.fill();
    text(ctx, '▶  MULAI MASAK', 640, 528, 22, '#fff', '800', 'center');
    text(ctx, 'Klik di mana saja / tekan Spasi — mouse + keyboard (1–0, C, Q/W, E, T)', 640, 576, 13, '#7a5a28', '600', 'center');
  }

  function drawPaused(state) {
    drawKitchen(state);
    ctx.fillStyle = 'rgba(43,29,18,0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    text(ctx, '⏸ JEDA', 640, 330, 54, '#fff', '800', 'center');
    text(ctx, 'Tekan P / Esc untuk lanjut  •  R untuk mulai ulang', 640, 390, 18, '#f7e3b0', '600', 'center');
  }

  function drawOver(state, best) {
    drawKitchen(state);
    ctx.fillStyle = 'rgba(43,29,18,0.72)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = CREAM;
    rr(ctx, 340, 130, 600, 460, 20); ctx.fill();
    ctx.strokeStyle = state.won ? '#7bc043' : '#e23b2e'; ctx.lineWidth = 4; ctx.stroke();
    text(ctx, state.won ? '🏆 SHIFT BERHASIL!' : '⏰ SHIFT SELESAI', 640, 190, 40, state.won ? '#2b7a3a' : '#c0392b', '800', 'center');
    text(ctx, state.won ? 'Target tercapai — dapurmu legenda!' : `Target ${TARGET_COINS} koin belum tercapai — coba lagi!`, 640, 234, 17, INK, '600', 'center');
    text(ctx, `🪙 Koin: ${state.coins}`, 640, 300, 26, INK, '800', 'center');
    text(ctx, `✅ ${state.served} pesanan disajikan    ❌ ${state.lost} pesanan hangus`, 640, 346, 17, INK, '600', 'center');
    text(ctx, `Kombo terbaik: x${Math.max(1, state.combo)}   •   Rekor: ${Math.max(best, state.coins)} koin`, 640, 380, 16, '#7a5a28', '700', 'center');
    ctx.fillStyle = '#e23b2e';
    rr(ctx, 480, 430, 320, 56, 14); ctx.fill();
    text(ctx, '↻  MASAK LAGI [R]', 640, 458, 22, '#fff', '800', 'center');
    text(ctx, 'Klik di mana saja / tekan R untuk shift baru', 640, 540, 14, '#7a5a28', '600', 'center');
  }

  return {
    draw(state, screen, best) {
      if (screen === SCREEN_TITLE) drawTitle(state, best);
      else if (screen === SCREEN_PAUSED) drawPaused(state);
      else if (screen === SCREEN_OVER) drawOver(state, best);
      else drawKitchen(state);
    },
  };
}
