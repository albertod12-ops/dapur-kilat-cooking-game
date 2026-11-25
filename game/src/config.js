// Pasar Malam: Warung Saji — konstanta permainan dan tata letak dapur.
// Canvas 1280x720. Dapur side-view: satu garis counter horizontal, koki
// berjalan kiri-kanan di depannya, bin bahan di baris bawah.
export const W = 1280;
export const H = 720;

// Waktu dan ekonomi.
export const SHIFT_SECONDS = 180;
export const COOK_TIME = 3.0;
export const CHOP_TIME = 2.0;
export const BURN_GRACE = 9.0;
export const WALK_SPEED = 520;
export const WAVE_TARGETS = [45000, 90000, 150000];
export const WIN_TARGET = 150000;
export const STAR_MARKS = [150000, 200000, 260000];
export const MAX_TICKETS = 4;
export const SPAWN_EVERY = [14, 10, 7];
export const PATIENCE = [55, 45, 38];
// [streak minimum, pengali harga]
export const COMBO = [[8, 2], [5, 1.5], [3, 1.25]];

// Tata letak (y).
export const LAYOUT = {
  hudH: 54,
  ticketY: 62,
  ticketH: 84,
  wallY: 152,
  wallH: 140,
  counterTopY: 296,
  counterBodyY: 332,
  counterBottomY: 470,
  chefFeetY: 560,
  binY: 580,
  binH: 92,
  helpY: 682,
};

// Posisi x tiap stasiun di garis counter.
export const STATION_X = {
  trash: 120,
  wok: 460,
  board: 660,
  plate: 860,
  pass: 1110,
};

// Bin bahan: 6 peti, mulai x=16, lebar 200, jeda 8.
export function binRect(i) {
  return { x: 16 + i * 208, y: LAYOUT.binY, w: 200, h: LAYOUT.binH };
}
export function binCenterX(i) {
  return 16 + i * 208 + 100;
}

// Slot tiket: 4 kartu, mulai x=16, lebar 300, jeda 8.
export function ticketRect(i) {
  return { x: 16 + i * 308, y: LAYOUT.ticketY, w: 300, h: LAYOUT.ticketH };
}

export function comboFor(streak) {
  for (const [need, mult] of COMBO) if (streak >= need) return mult;
  return 1;
}

export function waveFor(revenue) {
  if (revenue >= WAVE_TARGETS[1]) return 3;
  if (revenue >= WAVE_TARGETS[0]) return 2;
  return 1;
}

export const WAVE_NAMES = { 1: 'MULAI', 2: 'JAM RAMAI', 3: 'PUNCAK' };

export function fmtRp(n) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

export function fmtClock(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
