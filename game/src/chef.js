// Koki Budi — gerak + animasi jalan + membawa.
// Koki berjalan di jalur bawah (CHEF_Y), menuju targetX; tiap aksi stasiun
// memanggil walkTo(x) lalu menjalankan aksinya saat tiba.
import { CHEF_SPEED, CHEF_Y } from './config.js';

export function chefCenter(G) {
  return { x: G.chef.x, y: CHEF_Y };
}

export function walkTo(G, x) {
  G.chef.targetX = Math.max(70, Math.min(1210, x));
}

export function chefIsMoving(G) {
  return Math.abs(G.chef.x - G.chef.targetX) > 2;
}

export function chefArrived(G) {
  return !chefIsMoving(G);
}

// Dipanggil tiap frame: jalan menuju target, ayunkan kaki/tangan.
export function updateChef(G, dt) {
  const c = G.chef;
  const dx = c.targetX - c.x;
  if (Math.abs(dx) > 2) {
    const step = Math.sign(dx) * CHEF_SPEED * dt;
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
