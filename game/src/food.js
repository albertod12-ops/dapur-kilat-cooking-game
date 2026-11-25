// Makanan mengkilap — tiap bahan digambar dengan radial gradient + gloss
// highlight + bayangan, supaya terlihat lezat saat diperkecil, bukan ikon datar.
import { INGREDIENTS } from './recipes.js';

function gloss(ctx, x, y, r) {
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.35, y - r * 0.42, r * 0.42, r * 0.24, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function shadow(ctx, x, y, r) {
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.85, r * 0.9, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function radial(ctx, x, y, r, hi, base, lo) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, hi);
  g.addColorStop(0.55, base);
  g.addColorStop(1, lo);
  return g;
}

// Gambar satu bahan di (x, y) dengan radius r. `t` = waktu (untuk sparkle).
export function drawIngredient(ctx, id, x, y, r, t) {
  const ing = INGREDIENTS[id];
  if (!ing) return;
  shadow(ctx, x, y, r);
  ctx.save();
  if (id === 'nasi') {
    // Gundukan nasi putih.
    ctx.fillStyle = radial(ctx, x, y, r, ing.hi, ing.base, ing.lo);
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.72, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#efe3c2';
    for (let i = 0; i < 5; i++) {
      const a = -0.9 + i * 0.45;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * r * 0.5, y - r * 0.28 + Math.sin(a) * r * 0.18, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'mie') {
    // Gulungan mie kuning.
    ctx.strokeStyle = ing.lo;
    ctx.lineWidth = r * 0.16;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(x, y, r * (0.85 - i * 0.22), 0.3 + i * 0.8, Math.PI * 1.5 + i * 0.5);
      ctx.strokeStyle = i === 0 ? ing.base : ing.lo;
      ctx.stroke();
    }
    ctx.fillStyle = ing.hi;
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'ayam') {
    // Paha ayam goreng.
    ctx.fillStyle = radial(ctx, x, y, r, ing.hi, ing.base, ing.lo);
    ctx.beginPath();
    ctx.ellipse(x - r * 0.1, y, r * 0.72, r * 0.62, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f5e6c8';
    ctx.lineWidth = r * 0.16;
    ctx.beginPath();
    ctx.moveTo(x + r * 0.45, y + r * 0.3);
    ctx.lineTo(x + r * 0.95, y + r * 0.75);
    ctx.stroke();
    ctx.fillStyle = '#fff8e7';
    ctx.beginPath();
    ctx.arc(x + r * 0.98, y + r * 0.78, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    gloss(ctx, x, y, r);
  } else if (id === 'telur') {
    // Telur mata sapi.
    ctx.fillStyle = radial(ctx, x, y, r, '#ffffff', '#fdf6d8', '#eed9a4');
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = radial(ctx, x, y, r * 0.5, '#ffb347', '#f59e0b', '#d97706');
    ctx.beginPath();
    ctx.arc(x, y - r * 0.05, r * 0.48, 0, Math.PI * 2);
    ctx.fill();
    gloss(ctx, x, y - r * 0.1, r * 0.6);
  } else if (id === 'cabai') {
    // Cabai merah melengkung.
    ctx.strokeStyle = ing.lo;
    ctx.lineWidth = r * 0.34;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y - r * 0.5);
    ctx.quadraticCurveTo(x + r * 0.2, y + r * 0.9, x + r * 0.75, y - r * 0.2);
    ctx.stroke();
    ctx.strokeStyle = ing.base;
    ctx.lineWidth = r * 0.26;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y - r * 0.5);
    ctx.quadraticCurveTo(x + r * 0.2, y + r * 0.9, x + r * 0.75, y - r * 0.2);
    ctx.stroke();
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.72, y - r * 0.55, r * 0.28, r * 0.14, -0.7, 0, Math.PI * 2);
    ctx.fill();
    gloss(ctx, x, y, r);
  } else if (id === 'sayur') {
    // Daun hijau segar.
    ctx.fillStyle = radial(ctx, x, y, r, ing.hi, ing.base, ing.lo);
    for (let i = 0; i < 3; i++) {
      const a = -0.6 + i * 0.6;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.25, r * 0.34, r * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = ing.lo;
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.6);
    ctx.lineTo(x, y - r * 0.5);
    ctx.stroke();
  }
  ctx.restore();
  // Sparkle kecil berkedip — makanan matang terlihat segar.
  if (t !== undefined) {
    const s = (Math.sin(t * 3 + x * 0.05) + 1) / 2;
    if (s > 0.75) {
      ctx.save();
      ctx.globalAlpha = (s - 0.75) * 3;
      ctx.fillStyle = '#ffffff';
      const sx = x + r * 0.55;
      const sy = y - r * 0.55;
      ctx.beginPath();
      ctx.moveTo(sx, sy - r * 0.22);
      ctx.lineTo(sx + r * 0.06, sy - r * 0.06);
      ctx.lineTo(sx + r * 0.22, sy);
      ctx.lineTo(sx + r * 0.06, sy + r * 0.06);
      ctx.lineTo(sx, sy + r * 0.22);
      ctx.lineTo(sx - r * 0.06, sy + r * 0.06);
      ctx.lineTo(sx - r * 0.22, sy);
      ctx.lineTo(sx - r * 0.06, sy - r * 0.06);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}

// Piring putih dengan isi (daftar id bahan) — dipakai di stasiun piring + pass.
export function drawPlate(ctx, x, y, r, items, t) {
  ctx.save();
  ctx.fillStyle = '#e8e2d4';
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.86, r * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9bfa8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.86, r * 0.26, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (items && items.length) {
    const n = items.length;
    items.forEach((id, i) => {
      const ox = n === 1 ? 0 : (i - (n - 1) / 2) * r * 0.62;
      drawIngredient(ctx, id, x + ox, y - r * 0.12, r * 0.42, t);
    });
  }
  ctx.restore();
}
