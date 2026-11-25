// Dapur Kilat v3 — everything the player sees, redrawn to look delicious.
// Bright saturated warung: teal wall, golden counter, glossy food with sparkle,
// and customers you can actually see. Pure canvas drawing, no images, no network.
import {
  BINS, CHEF_Y, CHOP_CLICKS, COOK_BURN_AT, COOK_PERFECT_FROM, COOK_SECONDS,
  INGREDIENTS, SHIFT_SECONDS, TARGET_COINS, VIEW,
} from './config.js';
import { LAYOUT } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const INK = '#33200f';
const CREAM = '#fff8e7';
const GOLD = '#ffd94d';
const RED = '#e23b2e';
const TEAL = '#1e7f8e';
const TEAL_DARK = '#14606c';

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

/** Radial gradient, light from the top-left, for round glossy food. */
function rg(ctx, cx, cy, r, c0, c1) {
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  return g;
}

function lg(ctx, x, y, w, h, c0, c1, vertical = true) {
  const g = vertical
    ? ctx.createLinearGradient(x, y, x, y + h)
    : ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  return g;
}

/** Soft drop shadow under a piece of food. */
function foodShadow(ctx, cx, cy, rx, ry, alpha = 0.22) {
  ctx.fillStyle = `rgba(60,30,10,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** White gloss highlight, top-left of a piece of food. */
function gloss(ctx, cx, cy, rx, ry, alpha = 0.5) {
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

/** Tiny four-point sparkle star. `t` animates it. */
function sparkle(ctx, x, y, r, t) {
  const tw = 0.55 + 0.45 * Math.sin(t * 3 + x);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.6);
  ctx.globalAlpha = tw;
  ctx.fillStyle = '#fff7c0';
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.quadraticCurveTo(0, 0, 0, r);
  ctx.quadraticCurveTo(0, 0, -r, 0);
  ctx.quadraticCurveTo(0, 0, 0, -r);
  ctx.fill();
  ctx.restore();
}

/** Draw one ingredient as a glossy, appetising little picture. `size` is its box. */
export function drawIngredient(ctx, id, x, y, size, t = 0) {
  const c = size / 2;
  const cx = x + c;
  const cy = y + c;
  ctx.save();
  switch (id) {
    case 'bunBottom': {
      foodShadow(ctx, cx, cy + c * 0.55, c * 0.85, c * 0.22);
      ctx.fillStyle = rg(ctx, cx, cy, c - 2, '#f7c26a', '#d18a2e');
      rr(ctx, x + 4, cy - 4, size - 8, size * 0.44, 7); ctx.fill();
      ctx.fillStyle = '#a8651a';
      ctx.fillRect(x + 8, cy + size * 0.3, size - 16, 3);
      gloss(ctx, cx - 8, cy - 2, 12, 4, 0.5);
      break;
    }
    case 'bunTop': {
      foodShadow(ctx, cx, cy + c * 0.6, c * 0.85, c * 0.22);
      ctx.fillStyle = rg(ctx, cx, cy + 4, c - 2, '#ffc95e', '#dd9a33');
      ctx.beginPath(); ctx.arc(cx, cy + 8, c - 4, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff3cf';
      for (const [dx, dy] of [[-12, -8], [0, -15], [12, -8], [-6, -4], [7, -3]]) {
        ctx.beginPath(); ctx.ellipse(cx + dx, cy + dy, 3.2, 2, 0.3, 0, Math.PI * 2); ctx.fill();
      }
      gloss(ctx, cx - 9, cy - 6, 11, 5, 0.55);
      break;
    }
    case 'pattyRaw':
    case 'patty': {
      foodShadow(ctx, cx, cy + c * 0.5, c * 0.9, c * 0.22);
      ctx.fillStyle = id === 'patty'
        ? rg(ctx, cx, cy, c - 2, '#8a4a28', '#5e2c14')
        : rg(ctx, cx, cy, c - 2, '#d97a5e', '#a84a34');
      ctx.beginPath(); ctx.ellipse(cx, cy, c - 3, c * 0.58, 0, 0, Math.PI * 2); ctx.fill();
      if (id === 'patty') {
        ctx.strokeStyle = 'rgba(60,25,8,0.55)'; ctx.lineWidth = 3;
        for (const dx of [-12, -4, 4, 12]) {
          ctx.beginPath(); ctx.moveTo(cx + dx - 5, cy - 10); ctx.lineTo(cx + dx + 5, cy + 10); ctx.stroke();
        }
        gloss(ctx, cx - 10, cy - 7, 12, 4, 0.4);
        sparkle(ctx, cx + 14, cy - 12, 5, t);
      } else {
        gloss(ctx, cx - 10, cy - 7, 12, 4, 0.35);
      }
      break;
    }
    case 'lettuceRaw':
    case 'lettuce': {
      foodShadow(ctx, cx, cy + c * 0.55, c * 0.85, c * 0.2);
      ctx.fillStyle = rg(ctx, cx, cy, c - 2, '#a5e063', '#4da32e');
      ctx.beginPath();
      ctx.moveTo(cx - c + 4, cy + 6);
      ctx.quadraticCurveTo(cx - c + 2, cy - c + 6, cx, cy - c + 8);
      ctx.quadraticCurveTo(cx + c - 2, cy - c + 6, cx + c - 4, cy + 6);
      ctx.quadraticCurveTo(cx, cy + c - 2, cx - c + 4, cy + 6);
      ctx.fill();
      ctx.strokeStyle = '#3d8a22'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy - c + 10); ctx.lineTo(cx, cy + c - 8); ctx.stroke();
      gloss(ctx, cx - 8, cy - 8, 10, 4, 0.5);
      // Dewdrop.
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(cx + 10, cy + 2, 2.5, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'tomatoRaw':
    case 'tomato': {
      foodShadow(ctx, cx, cy + c * 0.55, c * 0.85, c * 0.22);
      ctx.fillStyle = rg(ctx, cx, cy, c - 3, '#ff6a55', '#c81f12');
      ctx.beginPath(); ctx.arc(cx, cy, c - 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff8a76';
      ctx.beginPath(); ctx.arc(cx, cy, c - 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd9d4';
      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8, 4, 2, a, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#2f8a4a';
      ctx.beginPath(); ctx.arc(cx, cy - c + 5, 5, 0, Math.PI * 2); ctx.fill();
      gloss(ctx, cx - 9, cy - 10, 8, 5, 0.65);
      if (id === 'tomato') sparkle(ctx, cx + 13, cy - 11, 4.5, t + 1);
      break;
    }
    case 'cheese': {
      foodShadow(ctx, cx, cy + c * 0.55, c * 0.85, c * 0.2);
      ctx.fillStyle = rg(ctx, cx, cy, c - 2, '#ffe066', '#f2a90c');
      ctx.beginPath(); ctx.moveTo(x + 4, y + size - 6); ctx.lineTo(cx, y + 6); ctx.lineTo(x + size - 4, y + size - 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d18a06';
      for (const [dx, dy] of [[-8, 8], [6, 12], [0, -2]]) {
        ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 3.5, 0, Math.PI * 2); ctx.fill();
      }
      gloss(ctx, cx - 6, cy - 2, 10, 4, 0.5);
      break;
    }
    case 'eggRaw': {
      foodShadow(ctx, cx, cy + c * 0.5, c * 0.85, c * 0.2);
      ctx.fillStyle = rg(ctx, cx, cy, c - 3, '#fdf3da', '#e3cd9e');
      ctx.beginPath(); ctx.ellipse(cx, cy, c - 6, c - 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c9ad72'; ctx.lineWidth = 2; ctx.stroke();
      gloss(ctx, cx - 8, cy - 7, 9, 4, 0.6);
      break;
    }
    case 'egg': {
      foodShadow(ctx, cx, cy + c * 0.5, c * 0.9, c * 0.2);
      ctx.fillStyle = rg(ctx, cx, cy, c - 2, '#fffdf4', '#f2e3bd');
      ctx.beginPath(); ctx.ellipse(cx, cy, c - 2, c - 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rg(ctx, cx, cy, c * 0.52, '#ffdf4d', '#f28c0c');
      ctx.beginPath(); ctx.arc(cx, cy, c * 0.5, 0, Math.PI * 2); ctx.fill();
      gloss(ctx, cx - 6, cy - 8, 7, 4, 0.7);
      sparkle(ctx, cx + 14, cy - 10, 5, t + 2);
      break;
    }
    case 'cucumberRaw':
    case 'cucumber': {
      foodShadow(ctx, cx, cy + c * 0.55, c * 0.85, c * 0.2);
      ctx.fillStyle = rg(ctx, cx, cy, c - 2, '#6fc98a', '#2f8a4a');
      ctx.beginPath(); ctx.ellipse(cx, cy, c - 2, c * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#cdeeda';
      ctx.beginPath(); ctx.ellipse(cx, cy, c - 9, c * 0.6 - 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8fd0a2';
      for (const dx of [-8, 0, 8]) { ctx.beginPath(); ctx.arc(cx + dx, cy, 2, 0, Math.PI * 2); ctx.fill(); }
      gloss(ctx, cx - 8, cy - 6, 9, 3.5, 0.55);
      break;
    }
    case 'sauce': {
      foodShadow(ctx, cx, cy + c * 0.55, c * 0.6, c * 0.2);
      ctx.fillStyle = rg(ctx, cx, cy, c - 4, '#ff9a4d', '#e05e12');
      rr(ctx, cx - 9, y + 12, 18, size - 22, 5); ctx.fill();
      ctx.fillStyle = '#b84a08';
      ctx.fillRect(cx - 9, y + 12, 18, 8);
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx - 5, y + 26, 10, 12);
      gloss(ctx, cx - 4, y + 18, 3, 8, 0.6);
      break;
    }
    case 'riceRaw':
    case 'rice': {
      foodShadow(ctx, cx, cy + c * 0.55, c * 0.9, c * 0.22);
      ctx.fillStyle = rg(ctx, cx, cy, c - 2, '#fffbe8', '#f0d48a');
      ctx.beginPath(); ctx.ellipse(cx, cy + 6, c - 4, c * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = id === 'rice' ? rg(ctx, cx, cy - 4, c - 3, '#ffcf5e', '#d98a1e') : rg(ctx, cx, cy - 4, c - 3, '#fffdf4', '#e8dcc0');
      ctx.beginPath(); ctx.ellipse(cx, cy, c - 4, c * 0.55, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = id === 'rice' ? '#a8651a' : '#c9ad72';
      for (const [dx, dy] of [[-8, -4], [2, -8], [9, -3]]) { ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 2.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#3a6ea5';
      ctx.beginPath(); ctx.ellipse(cx, cy + 10, c - 2, 6, 0, 0, Math.PI); ctx.fill();
      gloss(ctx, cx - 8, cy - 6, 9, 4, 0.5);
      if (id === 'rice') sparkle(ctx, cx + 13, cy - 9, 4.5, t);
      break;
    }
    case 'chickenRaw':
    case 'chicken': {
      foodShadow(ctx, cx, cy + c * 0.5, c * 0.85, c * 0.22);
      ctx.fillStyle = id === 'chicken'
        ? rg(ctx, cx, cy, c - 2, '#e8a54b', '#a8651a')
        : rg(ctx, cx, cy, c - 2, '#f2b8b8', '#d97a7a');
      ctx.beginPath(); ctx.ellipse(cx, cy, c - 4, c * 0.62, 0.3, 0, Math.PI * 2); ctx.fill();
      if (id === 'chicken') {
        ctx.fillStyle = 'rgba(120,60,10,0.5)';
        for (const [dx, dy] of [[-8, -2], [2, 4], [10, -6], [-2, -9]]) {
          ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 2.5, 0, Math.PI * 2); ctx.fill();
        }
        gloss(ctx, cx - 8, cy - 8, 10, 4, 0.5);
        sparkle(ctx, cx + 13, cy - 10, 5, t + 1.5);
      } else {
        gloss(ctx, cx - 8, cy - 8, 10, 4, 0.4);
      }
      break;
    }
    case 'pastaRaw':
    case 'pasta': {
      foodShadow(ctx, cx, cy + c * 0.55, c * 0.9, c * 0.2);
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
        gloss(ctx, cx - 8, cy - 10, 10, 3.5, 0.5);
        sparkle(ctx, cx + 14, cy - 8, 4.5, t + 0.5);
      }
      break;
    }
    default:
      ctx.fillStyle = '#999';
      ctx.fillRect(x + 6, y + 6, size - 12, size - 12);
  }
  ctx.restore();
}

/** Skin tone per customer, so every face reads as a different person. */
const SKIN = {
  'Mbak Rani': '#f2c29a',
  'Pak Dedi': '#c98d5f',
  'Nona Sari': '#f7d3ae',
  'Bang Joko': '#d9a06a',
  'Kak Lilis': '#f2c29a',
  'Om Budi': '#e0aa72',
};

/**
 * A customer as a little bust: face, hair/hat/hijab, shoulders and apron.
 * (x, y) is the head centre, r the head radius. mood: 'happy' | 'worried' | 'angry'.
 * Drawn with paths, never emoji, so it stays crisp when the screenshot shrinks.
 */
function drawCustomer(ctx, customer, mood, x, y, r) {
  const skin = SKIN[customer.name] ?? '#f2c29a';
  const col = customer.color;
  ctx.save();
  // Shoulders + apron.
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x - r * 1.25, y + r * 2.1);
  ctx.quadraticCurveTo(x - r * 1.25, y + r * 0.9, x - r * 0.7, y + r * 0.75);
  ctx.lineTo(x + r * 0.7, y + r * 0.75);
  ctx.quadraticCurveTo(x + r * 1.25, y + r * 0.9, x + r * 1.25, y + r * 2.1);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.28, y + r * 0.8);
  ctx.lineTo(x, y + r * 1.15);
  ctx.lineTo(x + r * 0.28, y + r * 0.8);
  ctx.lineTo(x + r * 0.28, y + r * 0.7);
  ctx.lineTo(x - r * 0.28, y + r * 0.7);
  ctx.closePath(); ctx.fill();
  // Head.
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  // Hair / hat / hijab per person.
  if (customer.name === 'Mbak Rani' || customer.name === 'Kak Lilis') {
    // Hijab: coloured hood framing the face.
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y - r * 0.1, r * 1.08, Math.PI * 0.95, Math.PI * 2.05); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r * 0.86, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(x, y + r * 0.05, r * 0.82, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(x, y - r * 0.95, r * 0.5, r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
  } else if (customer.name === 'Pak Dedi') {
    // Cap + moustache.
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y - r * 0.15, r * 1.02, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillRect(x - r, y - r * 0.25, r * 2, r * 0.22);
    ctx.beginPath(); ctx.ellipse(x, y - r * 0.28, r * 1.15, r * 0.3, 0, 0, Math.PI); ctx.fill();
  } else if (customer.name === 'Nona Sari') {
    // Long dark hair framing the face.
    ctx.fillStyle = '#3a2418';
    ctx.beginPath(); ctx.arc(x, y - r * 0.1, r * 1.06, Math.PI * 0.92, Math.PI * 2.08); ctx.closePath(); ctx.fill();
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(x, y + r * 0.06, r * 0.84, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a2418';
    ctx.fillRect(x - r * 1.05, y - r * 0.2, r * 0.22, r * 1.5);
    ctx.fillRect(x + r * 0.83, y - r * 0.2, r * 0.22, r * 1.5);
  } else if (customer.name === 'Bang Joko') {
    // Green bandana with a knot.
    ctx.fillStyle = col;
    ctx.fillRect(x - r, y - r * 0.85, r * 2, r * 0.5);
    ctx.beginPath(); ctx.arc(x + r * 0.95, y - r * 0.7, r * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 1.15, y - r * 0.45, r * 0.22, 0, Math.PI * 2); ctx.fill();
  } else {
    // Om Budi: round hat with a brim.
    ctx.fillStyle = '#8a5a28';
    ctx.beginPath(); ctx.ellipse(x, y - r * 0.55, r * 1.25, r * 0.32, 0, 0, Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - r * 0.55, r * 0.62, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = GOLD;
    ctx.fillRect(x - r * 0.6, y - r * 0.62, r * 1.2, r * 0.14);
  }
  // Eyes.
  const ey = y - r * 0.08;
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath(); ctx.arc(x - r * 0.34, ey, r * 0.11, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.34, ey, r * 0.11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x - r * 0.34 + 1.5, ey - 1.5, r * 0.04, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.34 + 1.5, ey - 1.5, r * 0.04, 0, Math.PI * 2); ctx.fill();
  // Brows + mouth follow the mood.
  ctx.strokeStyle = '#2b1d12'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  ctx.beginPath();
  if (mood === 'angry') {
    ctx.moveTo(x - r * 0.52, ey - r * 0.42); ctx.lineTo(x - r * 0.16, ey - r * 0.22);
    ctx.moveTo(x + r * 0.52, ey - r * 0.42); ctx.lineTo(x + r * 0.16, ey - r * 0.22);
  } else if (mood === 'worried') {
    ctx.moveTo(x - r * 0.52, ey - r * 0.2); ctx.lineTo(x - r * 0.16, ey - r * 0.38);
    ctx.moveTo(x + r * 0.52, ey - r * 0.2); ctx.lineTo(x + r * 0.16, ey - r * 0.38);
  } else {
    ctx.moveTo(x - r * 0.5, ey - r * 0.32); ctx.lineTo(x - r * 0.16, ey - r * 0.38);
    ctx.moveTo(x + r * 0.5, ey - r * 0.32); ctx.lineTo(x + r * 0.16, ey - r * 0.38);
  }
  ctx.stroke();
  const my = y + r * 0.42;
  ctx.beginPath();
  if (mood === 'angry') {
    ctx.arc(x, my + r * 0.35, r * 0.28, Math.PI * 1.15, Math.PI * 1.85);
  } else if (mood === 'worried') {
    ctx.moveTo(x - r * 0.22, my); ctx.lineTo(x + r * 0.22, my);
  } else {
    ctx.arc(x, my - r * 0.08, r * 0.3, Math.PI * 0.15, Math.PI * 0.85);
  }
  ctx.stroke();
  if (customer.name === 'Pak Dedi') {
    // Moustache.
    ctx.fillStyle = '#4a3220';
    ctx.beginPath(); ctx.ellipse(x, my - r * 0.18, r * 0.34, r * 0.1, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawTicket(ctx, ticket, x, y, w, h, t) {
  const frac = Math.max(0, ticket.patience / ticket.total);
  const urgent = frac < 0.35;
  const mood = frac > 0.6 ? 'happy' : frac > 0.35 ? 'worried' : 'angry';
  ctx.save();
  // Card with a soft shadow and a mood-coloured top strip.
  ctx.fillStyle = 'rgba(40,20,5,0.35)';
  rr(ctx, x + 2, y + 4, w, h, 10); ctx.fill();
  ctx.fillStyle = '#fffdf6';
  rr(ctx, x, y, w, h, 10); ctx.fill();
  ctx.strokeStyle = urgent ? RED : '#e8c88a'; ctx.lineWidth = urgent ? 3 : 2; ctx.stroke();
  ctx.fillStyle = urgent ? RED : mood === 'worried' ? '#ff8c42' : '#58b368';
  rr(ctx, x, y, w, 8, 4); ctx.fill();
  // Customer bust, left.
  drawCustomer(ctx, ticket.customer, mood, x + 26, y + 26, 15);
  // Name + dish + price.
  text(ctx, ticket.customer.name.split(' ')[0], x + 50, y + 16, 13, INK);
  text(ctx, ticket.recipe.name, x + 50, y + 33, 13, '#8a5a28', '600');
  text(ctx, `Rp${ticket.recipe.price}k`, x + w - 10, y + 16, 14, '#1e7a34', '800', 'right');
  // Needed ingredients as glossy mini icons.
  let ix = x + 12;
  for (const need of ticket.recipe.needs) {
    drawIngredient(ctx, need, ix, y + 52, 24, t);
    ix += 27;
  }
  // Patience bar.
  ctx.fillStyle = '#eadfc8';
  rr(ctx, x + 12, y + h - 14, w - 24, 9, 4.5); ctx.fill();
  ctx.fillStyle = urgent ? RED : frac < 0.6 ? '#ff8c42' : '#58b368';
  rr(ctx, x + 12, y + h - 14, Math.max(10, (w - 24) * frac), 9, 4.5); ctx.fill();
  ctx.restore();
}

function drawBurner(ctx, slot, x, y, w, h, t) {
  ctx.save();
  // Steel stove body with a brushed top.
  ctx.fillStyle = lg(ctx, x, y, w, h, '#4a4a55', '#2c2c34');
  rr(ctx, x, y, w, h, 12); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  rr(ctx, x + 6, y + 6, w - 12, 10, 5); ctx.fill();
  ctx.fillStyle = '#1d1d24';
  ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2 + 8, w * 0.32, h * 0.24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#6a6a78'; ctx.lineWidth = 2; ctx.stroke();
  if (!slot) {
    ctx.strokeStyle = '#565660';
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2 + 8, w * 0.32, h * 0.24, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    return;
  }
  if (slot.burnt) {
    drawIngredient(ctx, slot.item, x + w / 2 - 26, y + 14, 52, t);
    ctx.fillStyle = 'rgba(20,10,5,0.55)';
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2 + 8, w * 0.3, h * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    text(ctx, 'GOSONG! Klik untuk buang', x + w / 2, y + h - 16, 12, '#ffb3a0', '700', 'center');
    ctx.restore();
    return;
  }
  // Flame under the pan.
  const flick = 4 + Math.sin(t * 6 + x) * 2;
  ctx.fillStyle = '#ff7a2a';
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
  ctx.strokeStyle = '#8a8a98'; ctx.lineWidth = 2; ctx.stroke();
  drawIngredient(ctx, slot.item, x + w / 2 - 24, y + 16, 48, t);
  // Steam rising off the pan.
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (let i = 0; i < 3; i += 1) {
    const sy = y + 26 - (((t * 1.4) + i * 2.1) % 6) * 5;
    const sx = x + w / 2 - 18 + i * 18 + Math.sin(t * 2 + i) * 3;
    ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fill();
  }
  // Cook progress: grey -> green perfect zone -> red burn.
  const frac = Math.min(1, slot.t / COOK_BURN_AT);
  const px = x + 14; const pw = w - 28;
  ctx.fillStyle = '#e8dcc8';
  rr(ctx, px, y + h - 30, pw, 10, 5); ctx.fill();
  const perfectX = px + (COOK_PERFECT_FROM / COOK_BURN_AT) * pw;
  const perfectW = ((COOK_SECONDS + 1.5) / COOK_BURN_AT) * pw;
  ctx.fillStyle = 'rgba(88,179,104,0.5)';
  ctx.fillRect(perfectX, y + h - 30, perfectW, 10);
  ctx.fillStyle = slot.t >= COOK_SECONDS ? '#58b368' : '#ff8c42';
  rr(ctx, px, y + h - 30, Math.max(8, pw * frac), 10, 5); ctx.fill();
  text(ctx, slot.t >= COOK_SECONDS ? 'MATANG — ambil!' : 'Memasak…', x + w / 2, y + h - 44, 12, '#fff', '700', 'center');
  ctx.restore();
}

/**
 * Koki Budi — the visible cook. An original Indonesian chef: tall white toque
 * with a red band, warm brown skin, black moustache, white shirt, red apron.
 * He walks the floor in front of the counter (feet at CHEF_Y), legs and arms
 * swinging with `chef.phase` while he moves, body bobbing and leaning into
 * the walk. Drawn with paths, never emoji, so he stays crisp when shrunk.
 */
function drawChef(ctx, chef, t) {
  const x = chef.x;
  const feetY = CHEF_Y;
  const moving = chef.moving;
  const dir = Math.max(-1, Math.min(1, (chef.targetX - chef.x) / 40));
  const lean = moving ? dir * 3 : 0;
  const bob = moving ? Math.abs(Math.sin(chef.phase)) * 2.5 : Math.sin(t * 2) * 1;
  const swing = moving ? Math.sin(chef.phase) * 6 : 0;
  const hipY = feetY - 24 - bob;
  const shoulderY = feetY - 42 - bob;
  const headY = feetY - 50 - bob;
  const headR = 11;
  ctx.save();
  // Warm halo so the chef reads against dark stations (stove, bins).
  const halo = ctx.createRadialGradient(x, feetY - 34, 4, x, feetY - 34, 52);
  halo.addColorStop(0, 'rgba(255,220,140,0.28)');
  halo.addColorStop(1, 'rgba(255,220,140,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(x - 52, feetY - 86, 104, 104);
  // Soft shadow on the floor.
  ctx.fillStyle = 'rgba(40,20,5,0.3)';
  ctx.beginPath(); ctx.ellipse(x, feetY + 2, 24, 5, 0, 0, Math.PI * 2); ctx.fill();
  // Legs: dark trousers, alternating with the walk cycle.
  ctx.fillStyle = '#2e2a33';
  ctx.beginPath(); ctx.ellipse(x - 7 + swing, feetY - 11, 5, 12, 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 7 - swing, feetY - 11, 5, 12, -0.12, 0, Math.PI * 2); ctx.fill();
  // Shoes.
  ctx.fillStyle = '#1d1a20';
  ctx.beginPath(); ctx.ellipse(x - 7 + swing, feetY - 2, 7, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 7 - swing, feetY - 2, 7, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  // Body: white shirt, red apron with a little flame badge.
  ctx.fillStyle = '#fdf6e3';
  rr(ctx, x - 14 + lean, shoulderY - 2, 28, 22, 8); ctx.fill();
  ctx.fillStyle = '#c22e1f';
  rr(ctx, x - 10 + lean, shoulderY + 4, 20, 17, 5); ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath(); ctx.arc(x + lean, shoulderY + 12, 4, 0, Math.PI * 2); ctx.fill();
  // Arms swinging opposite the legs.
  ctx.strokeStyle = '#f2c29a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 12 + lean, shoulderY + 2);
  ctx.lineTo(x - 17 + lean - swing * 0.7, shoulderY + 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 12 + lean, shoulderY + 2);
  ctx.lineTo(x + 17 + lean + swing * 0.7, shoulderY + 14);
  ctx.stroke();
  // Head.
  ctx.fillStyle = '#c98d5f';
  ctx.beginPath(); ctx.arc(x + lean, headY, headR, 0, Math.PI * 2); ctx.fill();
  // Eyes + smile + moustache.
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath(); ctx.arc(x + lean - 4, headY - 1, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + lean + 4, headY - 1, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2b1d12'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x + lean, headY + 2, 4, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath(); ctx.ellipse(x + lean, headY + 4.5, 5.5, 1.8, 0, 0, Math.PI * 2); ctx.fill();
  // Tall white toque with a red band.
  ctx.fillStyle = '#fffdf6';
  ctx.beginPath();
  ctx.moveTo(x + lean - 10, headY - headR + 2);
  ctx.quadraticCurveTo(x + lean - 12, headY - headR - 12, x + lean - 5, headY - headR - 13);
  ctx.quadraticCurveTo(x + lean, headY - headR - 18, x + lean + 5, headY - headR - 13);
  ctx.quadraticCurveTo(x + lean + 12, headY - headR - 12, x + lean + 10, headY - headR + 2);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c22e1f';
  ctx.fillRect(x + lean - 10, headY - headR + 1, 20, 4);
  ctx.restore();
}

export function createRenderer(canvas) {
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  const ctx = canvas.getContext('2d');

  function drawTopBar(state) {
    ctx.fillStyle = lg(ctx, 0, 0, VIEW.width, 80, '#c22e1f', '#e8542a');
    ctx.fillRect(0, 0, VIEW.width, 80);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, 74, VIEW.width, 6);
    // Bunting flags along the bottom edge of the header.
    const flags = ['#ffd94d', '#58b368', '#4db2e8', '#ff8c42', '#e26ee5'];
    for (let i = 0; i < 16; i += 1) {
      const fx = 30 + i * 78;
      ctx.fillStyle = flags[i % flags.length];
      ctx.beginPath();
      ctx.moveTo(fx, 80); ctx.lineTo(fx + 16, 80); ctx.lineTo(fx + 8, 94); ctx.closePath(); ctx.fill();
    }
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 2;
    text(ctx, '🍳 DAPUR KILAT', 24, 26, 30, GOLD, '800');
    ctx.restore();
    text(ctx, 'Sizzle & Serve — shift masak 150 detik', 24, 56, 14, '#ffe9b0', '500');
    const mins = Math.max(0, Math.ceil(state.timeLeft));
    const mm = Math.floor(mins / 60);
    const ss = String(mins % 60).padStart(2, '0');
    // Timer pill.
    ctx.fillStyle = 'rgba(40,15,5,0.55)';
    rr(ctx, 540, 12, 200, 34, 17); ctx.fill();
    text(ctx, `⏱ ${mm}:${ss}`, 640, 30, 26, state.timeLeft < 30 ? '#ff9a8a' : '#fff', '800', 'center');
    const tfrac = Math.max(0, state.timeLeft / SHIFT_SECONDS);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    rr(ctx, 520, 52, 240, 12, 6); ctx.fill();
    ctx.fillStyle = tfrac < 0.2 ? '#ff5a45' : '#7ee081';
    rr(ctx, 520, 52, Math.max(10, 240 * tfrac), 12, 6); ctx.fill();
    // Coins.
    ctx.fillStyle = rg(ctx, 806, 28, 15, '#ffe98a', '#e8a90c');
    ctx.beginPath(); ctx.arc(806, 28, 15, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#a8651a'; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, 'Rp', 806, 28, 12, '#8a5a28', '800', 'center');
    text(ctx, `${state.coins} / ${TARGET_COINS}`, 830, 30, 24, GOLD, '800');
    text(ctx, `✅ ${state.served} disajikan   ❌ ${state.lost} hangus`, 830, 56, 14, '#ffe9b0', '600');
    if (state.combo >= 2) {
      ctx.fillStyle = 'rgba(40,15,5,0.55)';
      rr(ctx, 1080, 12, 150, 34, 17); ctx.fill();
      text(ctx, `🔥 KOMBO x${state.combo}`, 1155, 30, 20, '#ff9a4d', '800', 'center');
      text(ctx, `${Math.ceil(state.comboLeft)} dtk`, 1155, 56, 13, '#ffe9b0', '600', 'center');
    }
    if (state.timeLeft <= 30 && !state.over) {
      text(ctx, '🔥 JAM SIBUK', 640, 70, 13, '#ff9a8a', '800', 'center');
    }
  }

  function drawBoard(state, t) {
    const b = LAYOUT.board;
    // Wooden serving counter with a drop shadow and a dark front edge.
    ctx.fillStyle = 'rgba(40,20,5,0.35)';
    rr(ctx, b.x - 6, b.y - 4, b.w + 16, b.h + 16, 14); ctx.fill();
    ctx.fillStyle = lg(ctx, b.x, b.y, b.w, b.h, '#e07b28', '#c05f14');
    rr(ctx, b.x - 8, b.y - 8, b.w + 16, b.h + 16, 14); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    rr(ctx, b.x - 8, b.y - 8, b.w + 16, 10, 7); ctx.fill();
    text(ctx, '📋 PAPAN PESANAN', b.x + 4, b.y - 22, 15, '#fff', '800');
    if (state.tickets.length === 0) {
      text(ctx, 'Belum ada pesanan — pelanggan segera datang…', b.x + 16, b.y + b.h / 2, 16, '#ffe9b0', '600');
      return;
    }
    state.tickets.forEach((ticket, i) => {
      const x = b.x + 8 + i * (LAYOUT.ticket.w + LAYOUT.ticket.gap);
      drawTicket(ctx, ticket, x, b.y + 6, LAYOUT.ticket.w, LAYOUT.ticket.h, t);
    });
  }

  function drawBins(state, t) {
    const bins = LAYOUT.bins;
    ctx.fillStyle = 'rgba(40,20,5,0.35)';
    rr(ctx, bins.x - 6, bins.y - 4, bins.w + 16, bins.h + 16, 14); ctx.fill();
    ctx.fillStyle = lg(ctx, bins.x, bins.y, bins.w, bins.h, '#3d9db5', '#2a7f96');
    rr(ctx, bins.x - 8, bins.y - 8, bins.w + 16, bins.h + 16, 14); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    rr(ctx, bins.x - 8, bins.y - 8, bins.w + 16, 10, 7); ctx.fill();
    text(ctx, '🧺 BAHAN DI MEJA — klik / tekan 1–0 untuk ambil', bins.x + 4, bins.y - 22, 15, '#fff', '800');
    BINS.forEach((id, i) => {
      const x = bins.x + i * (bins.cell + bins.gap);
      const ing = INGREDIENTS[id];
      const picked = state.hand === id;
      ctx.fillStyle = 'rgba(40,20,5,0.3)';
      rr(ctx, x + 2, bins.y + 4, bins.cell, bins.h, 10); ctx.fill();
      ctx.fillStyle = picked ? '#ffe9a8' : '#fffdf6';
      ctx.strokeStyle = picked ? '#ff8c42' : ing.color;
      ctx.lineWidth = picked ? 3 : 2.5;
      rr(ctx, x, bins.y, bins.cell, bins.h, 10); ctx.fill(); ctx.stroke();
      drawIngredient(ctx, id, x + (bins.cell - 44) / 2, bins.y + 6, 44, t);
      text(ctx, ing.name, x + bins.cell / 2, bins.y + 66, 11, INK, '700', 'center');
      if (ing.key) {
        ctx.fillStyle = '#e8dcc8';
        rr(ctx, x + bins.cell - 22, bins.y + 6, 16, 16, 4); ctx.fill();
        text(ctx, ing.key, x + bins.cell - 14, bins.y + 14, 11, '#7a5a28', '800', 'center');
      }
    });
  }

  function drawWork(state, t) {
    const w = LAYOUT.work;
    // Big wooden work counter with a front face and a drop shadow.
    ctx.fillStyle = 'rgba(40,20,5,0.35)';
    rr(ctx, w.x - 6, w.y - 4, w.w + 16, w.h + 16, 14); ctx.fill();
    ctx.fillStyle = lg(ctx, w.x, w.y, w.w, w.h, '#d99a4e', '#b87a2e');
    rr(ctx, w.x - 8, w.y - 8, w.w + 16, w.h + 16, 14); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    rr(ctx, w.x - 8, w.y - 8, w.w + 16, 10, 7); ctx.fill();
    // Counter front face (darker planks) along the bottom of the work area.
    ctx.fillStyle = '#8a5a28';
    rr(ctx, w.x - 8, w.y + w.h - 26, w.w + 16, 34, 8); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let px = w.x + 40; px < w.x + w.w; px += 80) ctx.fillRect(px, w.y + w.h - 26, 3, 34);
    // Chopping board.
    const chop = LAYOUT.chop;
    ctx.fillStyle = 'rgba(40,20,5,0.3)';
    rr(ctx, chop.x - 4, chop.y - 2, chop.w + 12, chop.h + 12, 12); ctx.fill();
    text(ctx, '🔪 TALENAN — klik 3x untuk potong', chop.x + 4, chop.y - 20, 14, '#fff', '800');
    ctx.fillStyle = lg(ctx, chop.x, chop.y, chop.w, chop.h, '#f2d49a', '#e0b96e');
    rr(ctx, chop.x, chop.y, chop.w, chop.h, 10); ctx.fill();
    ctx.strokeStyle = '#b98a3e'; ctx.lineWidth = 2; ctx.stroke();
    if (state.board) {
      drawIngredient(ctx, state.board.item, chop.x + chop.w / 2 - 40, chop.y + 30, 80, t);
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
    drawBurner(ctx, state.stove[0], stove.x, stove.y, half, stove.h, t);
    drawBurner(ctx, state.stove[1], stove.x + half + 8, stove.y, half, stove.h, t);
    // Plate.
    const plate = LAYOUT.plate;
    ctx.fillStyle = 'rgba(40,20,5,0.3)';
    rr(ctx, plate.x - 4, plate.y - 2, plate.w + 12, plate.h + 12, 12); ctx.fill();
    text(ctx, '🍽️ PIRING — susun pesanan di sini', plate.x + 4, plate.y - 20, 14, '#fff', '800');
    ctx.fillStyle = '#fdf6e3';
    rr(ctx, plate.x, plate.y, plate.w, plate.h, 10); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(plate.x + plate.w / 2, plate.y + 108, 118, 62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e8b64c'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.beginPath(); ctx.ellipse(plate.x + plate.w / 2, plate.y + 108, 100, 50, 0, 0, Math.PI * 2); ctx.fill();
    if (state.plate.length === 0) {
      text(ctx, 'Piring kosong', plate.x + plate.w / 2, plate.y + 108, 14, '#b08a5a', '600', 'center');
    } else {
      state.plate.forEach((id, i) => {
        const size = 54;
        const y = plate.y + 108 - 26 - i * 16;
        drawIngredient(ctx, id, plate.x + plate.w / 2 - size / 2, y - size / 2, size, t);
      });
      text(ctx, `${state.plate.length} bahan di piring`, plate.x + plate.w / 2, plate.y + plate.h - 14, 12, '#7a5a28', '700', 'center');
      // Steam off a hot dish: a cooked item is still warm on the plate.
      const HOT = new Set(['patty', 'egg', 'rice', 'chicken', 'pasta']);
      if (state.plate.some((id) => HOT.has(id))) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        for (let i = 0; i < 3; i += 1) {
          const sy = plate.y + 44 - (((t * 1.2) + i * 2.3) % 6) * 5;
          const sx = plate.x + plate.w / 2 - 20 + i * 20 + Math.sin(t * 2 + i * 2) * 3;
          ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    // Bell + trash.
    const bell = LAYOUT.bell;
    const ready = state.plate.length > 0 && state.tickets.some((tk) => {
      const count = (l) => { const m = new Map(); for (const x of l) m.set(x, (m.get(x) ?? 0) + 1); return m; };
      const a = count(state.plate); const b = count(tk.recipe.needs);
      if (a.size !== b.size) return false;
      for (const [k, v] of a) if (b.get(k) !== v) return false;
      return true;
    });
    ctx.fillStyle = 'rgba(40,20,5,0.3)';
    rr(ctx, bell.x + 2, bell.y + 4, bell.w, bell.h, 12); ctx.fill();
    ctx.fillStyle = ready ? rg(ctx, bell.x + bell.w / 2, bell.y + bell.h / 2, 60, '#ffe98a', '#e8a90c') : lg(ctx, bell.x, bell.y, bell.w, bell.h, '#e8dcc8', '#c9b896');
    ctx.strokeStyle = '#8a5a28'; ctx.lineWidth = 3;
    rr(ctx, bell.x, bell.y, bell.w, bell.h, 12); ctx.fill(); ctx.stroke();
    if (ready) {
      sparkle(ctx, bell.x + 14, bell.y + 14, 6, t);
      sparkle(ctx, bell.x + bell.w - 14, bell.y + 20, 5, t + 1);
    }
    text(ctx, '🔔', bell.x + bell.w / 2, bell.y + 34, 30, INK, '800', 'center');
    text(ctx, ready ? 'SAJIKAN! [E]' : 'Lonceng [E]', bell.x + bell.w / 2, bell.y + 72, 12, INK, '800', 'center');
    const trash = LAYOUT.trash;
    ctx.fillStyle = 'rgba(40,20,5,0.3)';
    rr(ctx, trash.x + 2, trash.y + 4, trash.w, trash.h, 12); ctx.fill();
    ctx.fillStyle = lg(ctx, trash.x, trash.y, trash.w, trash.h, '#f2ead8', '#d8c49a');
    ctx.strokeStyle = '#8a5a28'; ctx.lineWidth = 3;
    rr(ctx, trash.x, trash.y, trash.w, trash.h, 12); ctx.fill(); ctx.stroke();
    text(ctx, '🗑️', trash.x + trash.w / 2, trash.y + 34, 30, INK, '800', 'center');
    text(ctx, 'Buang [T]', trash.x + trash.w / 2, trash.y + 72, 12, INK, '800', 'center');
    // Hand.
    const hand = LAYOUT.hand;
    ctx.fillStyle = 'rgba(40,20,5,0.3)';
    rr(ctx, hand.x + 2, hand.y + 4, hand.w, hand.h, 12); ctx.fill();
    ctx.fillStyle = '#fdf6e3';
    rr(ctx, hand.x, hand.y, hand.w, hand.h, 12); ctx.fill();
    ctx.strokeStyle = '#d8c49a'; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, 'TANGAN', hand.x + hand.w / 2, hand.y + 18, 13, '#7a5a28', '800', 'center');
    if (state.hand) {
      drawIngredient(ctx, state.hand, hand.x + 22, hand.y + 44, 60, t);
      text(ctx, INGREDIENTS[state.hand].name, hand.x + hand.w / 2, hand.y + 130, 12, INK, '700', 'center');
      const ing = INGREDIENTS[state.hand];
      const hint = ing.prep === 'chop' ? '→ talenan' : ing.prep === 'cook' ? '→ kompor' : '→ piring';
      text(ctx, hint, hand.x + hand.w / 2, hand.y + 152, 12, '#1e7a34', '700', 'center');
    } else {
      text(ctx, '(kosong)', hand.x + hand.w / 2, hand.y + 90, 13, '#b08a5a', '600', 'center');
    }
  }

  function drawBottom(state) {
    text(ctx, 'Cara main: ambil bahan → potong di talenan / masak di kompor → susun di piring → bunyikan lonceng.  [A/D] jalan  [P] jeda  [M] suara  [R] ulang', 24, 648, 14, '#ffe9b0', '600');
    text(ctx, `Shift ${Math.floor(state.elapsed / 60)}:${String(Math.floor(state.elapsed % 60)).padStart(2, '0')}  •  Target ${TARGET_COINS} koin`, 1256, 648, 14, '#ffe9b0', '600', 'right');
    if (state.message && state.messageT > 0) {
      ctx.fillStyle = 'rgba(43,29,18,0.88)';
      rr(ctx, 340, 668, 600, 36, 10); ctx.fill();
      text(ctx, state.message, 640, 686, 15, GOLD, '700', 'center');
    }
  }

  function drawKitchen(state, t, showChef = true) {
    // Saturated teal wall with a faint tile grid, warm terracotta floor.
    ctx.fillStyle = lg(ctx, 0, 0, VIEW.width, 620, '#2a9d8f', TEAL_DARK);
    ctx.fillRect(0, 0, VIEW.width, 620);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 2;
    for (let y = 100; y < 620; y += 52) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW.width, y); ctx.stroke();
    }
    for (let x = 0; x < VIEW.width; x += 52) {
      ctx.beginPath(); ctx.moveTo(x, 80); ctx.lineTo(x, 620); ctx.stroke();
    }
    ctx.fillStyle = lg(ctx, 0, 620, VIEW.width, 100, '#c96a3b', '#a84e28');
    ctx.fillRect(0, 620, VIEW.width, 100);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let x = 0; x < VIEW.width; x += 96) ctx.fillRect(x, 660, 2, 60);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 616, VIEW.width, 4);
    // Warm hanging-lamp pools: the kitchen glows amber over the teal wall.
    for (const lx of [320, 960]) {
      const glow = ctx.createRadialGradient(lx, 150, 10, lx, 150, 300);
      glow.addColorStop(0, 'rgba(255,205,110,0.16)');
      glow.addColorStop(1, 'rgba(255,205,110,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(lx - 300, 80, 600, 420);
    }
    const floorGlow = ctx.createRadialGradient(640, 670, 20, 640, 670, 520);
    floorGlow.addColorStop(0, 'rgba(255,205,110,0.14)');
    floorGlow.addColorStop(1, 'rgba(255,205,110,0)');
    ctx.fillStyle = floorGlow;
    ctx.fillRect(120, 620, 1040, 100);
    drawTopBar(state);
    drawBoard(state, t);
    drawBins(state, t);
    drawWork(state, t);
    // Koki Budi walks the floor in front of the counter, on top of the stations.
    if (showChef) drawChef(ctx, state.chef, t);
    drawBottom(state);
  }

  function drawTitle(state, best, t) {
    drawKitchen(state, t, false);
    ctx.fillStyle = 'rgba(20,40,45,0.72)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = CREAM;
    rr(ctx, 290, 100, 700, 520, 20); ctx.fill();
    ctx.strokeStyle = '#ff8c42'; ctx.lineWidth = 4; ctx.stroke();
    // A big glossy burger stacked from the game's own ingredients.
    const bx = 640; const by = 235;
    foodShadow(ctx, bx, by + 78, 120, 18, 0.25);
    drawIngredient(ctx, 'bunBottom', bx - 70, by + 30, 130, t);
    drawIngredient(ctx, 'patty', bx - 70, by - 6, 130, t);
    drawIngredient(ctx, 'lettuce', bx - 70, by - 34, 130, t);
    drawIngredient(ctx, 'tomato', bx - 70, by - 62, 130, t);
    drawIngredient(ctx, 'bunTop', bx - 70, by - 104, 130, t);
    sparkle(ctx, bx - 90, by - 110, 8, t);
    sparkle(ctx, bx + 95, by - 60, 7, t + 1);
    sparkle(ctx, bx + 85, by + 40, 6, t + 2);
    text(ctx, '🍳 DAPUR KILAT', 640, 158, 52, '#c0392b', '800', 'center');
    text(ctx, 'Sizzle & Serve', 640, 372, 26, '#7a5a28', '700', 'center');
    text(ctx, 'Shift masak paling sibuk di kota! Pesanan datang terus —', 640, 406, 17, INK, '600', 'center');
    text(ctx, 'potong, masak, susun, sajikan sebelum pelanggan pergi.', 640, 430, 17, INK, '600', 'center');
    // The whole menu, so the depth (8 recipes) reads at a glance.
    text(ctx, '📖 MENU — 8 resep:', 640, 456, 14, '#1e7a34', '800', 'center');
    text(ctx, 'Burger Kilat Rp14k  •  Burger Keju Rp18k  •  Salad Segar Rp10k  •  Omelet Rp12k', 640, 476, 13, INK, '600', 'center');
    text(ctx, 'Nasi Goreng Rp16k  •  Spaghetti Rp15k  •  Mie Goreng Rp17k  •  Ayam Geprek Rp19k', 640, 496, 13, INK, '600', 'center');
    text(ctx, `🎯 Target shift: ${TARGET_COINS} koin dalam ${SHIFT_SECONDS} detik${best > 0 ? `   •   Rekor: ${best} koin` : ''}`, 640, 520, 16, '#1e7a34', '800', 'center');
    ctx.fillStyle = RED;
    rr(ctx, 480, 548, 320, 44, 14); ctx.fill();
    text(ctx, '▶  MULAI MASAK', 640, 570, 22, '#fff', '800', 'center');
    text(ctx, 'Klik di mana saja / tekan Spasi — mouse + keyboard (1–0, C, Q/W, E, T, A/D jalan)', 640, 610, 13, '#7a5a28', '600', 'center');
    // Koki Budi stands beside the title card, bright against the dimmed kitchen.
    drawChef(ctx, { x: 170, targetX: 170, moving: false, phase: 0 }, t);
  }

  function drawPaused(state, t) {
    drawKitchen(state, t, false);
    ctx.fillStyle = 'rgba(20,40,45,0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    text(ctx, '⏸ JEDA', 640, 330, 54, '#fff', '800', 'center');
    text(ctx, 'Tekan P / Esc untuk lanjut  •  R untuk mulai ulang', 640, 390, 18, '#ffe9b0', '600', 'center');
  }

  function drawOver(state, best, t) {
    drawKitchen(state, t, false);
    ctx.fillStyle = 'rgba(20,40,45,0.72)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = CREAM;
    rr(ctx, 340, 130, 600, 460, 20); ctx.fill();
    ctx.strokeStyle = state.won ? '#58b368' : RED; ctx.lineWidth = 4; ctx.stroke();
    text(ctx, state.won ? '🏆 SHIFT BERHASIL!' : '⏰ SHIFT SELESAI', 640, 190, 40, state.won ? '#1e7a34' : '#c0392b', '800', 'center');
    text(ctx, state.won ? 'Target tercapai — dapurmu legenda!' : `Target ${TARGET_COINS} koin belum tercapai — coba lagi!`, 640, 234, 17, INK, '600', 'center');
    text(ctx, `🪙 Koin: ${state.coins}`, 640, 300, 26, INK, '800', 'center');
    text(ctx, `✅ ${state.served} pesanan disajikan    ❌ ${state.lost} pesanan hangus`, 640, 346, 17, INK, '600', 'center');
    text(ctx, `Kombo terbaik: x${Math.max(1, state.combo)}   •   Rekor: ${Math.max(best, state.coins)} koin`, 640, 380, 16, '#7a5a28', '700', 'center');
    ctx.fillStyle = RED;
    rr(ctx, 480, 430, 320, 56, 14); ctx.fill();
    text(ctx, '↻  MASAK LAGI [R]', 640, 458, 22, '#fff', '800', 'center');
    text(ctx, 'Klik di mana saja / tekan R untuk shift baru', 640, 540, 14, '#7a5a28', '600', 'center');
    drawChef(ctx, { x: 170, targetX: 170, moving: false, phase: 0 }, t);
  }

  return {
    draw(state, screen, best) {
      const t = Date.now() / 1000;
      if (screen === SCREEN_TITLE) drawTitle(state, best, t);
      else if (screen === SCREEN_PAUSED) drawPaused(state, t);
      else if (screen === SCREEN_OVER) drawOver(state, best, t);
      else drawKitchen(state, t);
    },
  };
}
