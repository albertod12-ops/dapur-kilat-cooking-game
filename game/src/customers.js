// Pelanggan — wajah orisinil digambar path, bukan emoji.
// Tiap pelanggan punya nama + palet sendiri; mood berubahตาม kesabaran:
// senyum (>60%), cemas (30-60%), marah (<30%).
import { pick } from './random.js';

const NAMES = [
  'Mbak Rani', 'Pak Dedi', 'Nona Sari', 'Bang Joko', 'Kak Lilis', 'Om Budi',
  'Dek Putri', 'Mas Agus', 'Bu Tini', 'Kang Udin', 'Mbak Sari', 'Pak Slamet',
];

const SKINS = ['#f2c89b', '#e8b07e', '#d99e6a', '#f7d3a7'];
const SHIRTS = ['#e63946', '#2ec4b6', '#ffb347', '#7c5cbf', '#4d96ff', '#ef6f6c'];
const HAIRS = ['#2b2118', '#4a3226', '#6b4220', '#1a1a1a'];

export function makeCustomer(rng, id) {
  return {
    id,
    name: pick(rng, NAMES),
    skin: pick(rng, SKINS),
    shirt: pick(rng, SHIRTS),
    hair: pick(rng, HAIRS),
    hijab: rng() < 0.3,
    hat: rng() < 0.2,
    mustache: rng() < 0.25,
  };
}

export function moodOf(patience, maxPatience) {
  const f = patience / maxPatience;
  if (f > 0.6) return 'senyum';
  if (f > 0.3) return 'cemas';
  return 'marah';
}

// Wajah pelanggan (bust) di (x, y), radius r.
export function drawCustomerFace(ctx, c, x, y, r, mood) {
  ctx.save();
  // Badan / baju.
  ctx.fillStyle = c.shirt;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.95, y + r * 1.15);
  ctx.quadraticCurveTo(x - r * 0.9, y + r * 0.25, x - r * 0.5, y + r * 0.35);
  ctx.lineTo(x + r * 0.5, y + r * 0.35);
  ctx.quadraticCurveTo(x + r * 0.9, y + r * 0.25, x + r * 0.95, y + r * 1.15);
  ctx.closePath();
  ctx.fill();
  // Kepala.
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(x, y - r * 0.15, r * 0.62, 0, Math.PI * 2);
  ctx.fill();
  // Rambut / hijab / topi.
  if (c.hijab) {
    ctx.fillStyle = c.shirt;
    ctx.beginPath();
    ctx.arc(x, y - r * 0.28, r * 0.72, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x - r * 0.72, y - r * 0.3, r * 1.44, r * 0.5);
  } else if (c.hat) {
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(x - r * 0.7, y - r * 0.78, r * 1.4, r * 0.22);
    ctx.beginPath();
    ctx.ellipse(x, y - r * 0.72, r * 0.42, r * 0.3, 0, Math.PI, 0);
    ctx.fill();
  } else {
    ctx.fillStyle = c.hair;
    ctx.beginPath();
    ctx.arc(x, y - r * 0.32, r * 0.6, Math.PI * 1.02, Math.PI * 1.98);
    ctx.fill();
  }
  // Mata.
  const eyeY = y - r * 0.18;
  const eyeDX = r * 0.24;
  ctx.fillStyle = '#241a12';
  if (mood === 'marah') {
    // Alis miring marah.
    ctx.strokeStyle = '#241a12';
    ctx.lineWidth = r * 0.07;
    ctx.beginPath();
    ctx.moveTo(x - eyeDX - r * 0.14, eyeY - r * 0.22);
    ctx.lineTo(x - eyeDX + r * 0.14, eyeY - r * 0.08);
    ctx.moveTo(x + eyeDX + r * 0.14, eyeY - r * 0.22);
    ctx.lineTo(x + eyeDX - r * 0.14, eyeY - r * 0.08);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x - eyeDX, eyeY, r * 0.09, 0, Math.PI * 2);
  ctx.arc(x + eyeDX, eyeY, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  // Kumis.
  if (c.mustache) {
    ctx.strokeStyle = '#241a12';
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.3, y + r * 0.16);
    ctx.quadraticCurveTo(x, y + r * 0.26, x + r * 0.3, y + r * 0.16);
    ctx.stroke();
  }
  // Mulut sesuai mood.
  ctx.strokeStyle = '#7a3b22';
  ctx.lineWidth = r * 0.07;
  ctx.beginPath();
  if (mood === 'senyum') {
    ctx.arc(x, y + r * 0.08, r * 0.26, 0.15 * Math.PI, 0.85 * Math.PI);
  } else if (mood === 'cemas') {
    ctx.arc(x, y + r * 0.28, r * 0.16, 1.15 * Math.PI, 1.85 * Math.PI);
  } else {
    ctx.moveTo(x - r * 0.2, y + r * 0.32);
    ctx.lineTo(x + r * 0.2, y + r * 0.32);
  }
  ctx.stroke();
  ctx.restore();
}
