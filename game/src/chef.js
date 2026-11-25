// Koki Budi — gerak + animasi jalan + membawa.
// Koki berjalan di jalur lantai (chefFeetY), menuju targetX; tiap aksi
// stasiun memanggil walkTo(x) lalu menjalankan aksinya saat tiba.
import { LAYOUT, WALK_SPEED } from './config.js';

export function walkTo(G, x) {
  G.chef.targetX = Math.max(70, Math.min(1210, x));
}

export function isMoving(G) {
  return Math.abs(G.chef.x - G.chef.targetX) > 2;
}

export function hasArrived(G) {
  return !isMoving(G);
}

// Dipanggil tiap frame: jalan menuju target, ayunkan kaki/tangan.
export function updateChef(G, dt) {
  const c = G.chef;
  const dx = c.targetX - c.x;
  if (Math.abs(dx) > 2) {
    const step = Math.sign(dx) * WALK_SPEED * dt;
    c.x += Math.abs(step) >= Math.abs(dx) ? dx : step;
    c.dir = Math.sign(dx);
    c.walk += dt * 11;
    c.moving = true;
  } else {
    c.x = c.targetX;
    c.moving = false;
    c.walk = 0;
  }
}

export function chefFeetY() {
  return LAYOUT.chefFeetY;
}
