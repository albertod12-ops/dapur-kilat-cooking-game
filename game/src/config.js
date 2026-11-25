// Pasar Malam: Warung Saji — tuning + layout. Canvas 1280x720, side view warung.
// Semua angka di satu tempat supaya balance bisa diubah tanpa menyentuh logika.
export const W = 1280;
export const H = 720;

// Durasi satu shift (detik) dan target pendapatan per gelombang (rupiah).
export const SHIFT_SECONDS = 150;
export const WIN_TARGET = 150000;
export const STAR_CUTS = [150000, 200000, 260000];

export const WAVES = [
  { name: 'MULAI', until: 50, target: 45000, spawnEvery: 9, patience: 54 },
  { name: 'JAM RAMAI', until: 100, target: 90000, spawnEvery: 7, patience: 46 },
  { name: 'PUNCAK', until: 150, target: 150000, spawnEvery: 5.5, patience: 38 },
];

// Koki jalan 430 px/detik — cukup cepat untuk routing, cukup lambat untuk terasa.
export const CHEF_SPEED = 430;
export const CHEF_Y = 604;

// Wok: masak per bahan (detik), lalu dibiarkan BURN_AFTER detik jadi hangus.
export const BURN_AFTER = 6;
export const CHOP_SECONDS = 2.5;

// Pesanan.
export const MAX_TICKETS = 4;
export const STREAK_STEP = 0.25;
export const STREAK_MAX = 2;

// Layout (px). Tiket di atas, bin bahan di bawahnya, stasiun di tengah,
// koki berjalan di jalur bawah.
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 58 },
  tickets: { x: 16, y: 68, w: 302, h: 118, gap: 12 },
  bins: { x: 16, y: 200, w: 198, h: 82, gap: 12 },
  wok: { x: 36, y: 316, w: 300, h: 210 },
  board: { x: 372, y: 340, w: 240, h: 186 },
  plates: { x: 648, y: 340, w: 260, h: 186 },
  pass: { x: 944, y: 316, w: 240, h: 210 },
  trash: { x: 1204, y: 452, w: 60, h: 74 },
  helpBar: { x: 0, y: 668, w: 1280, h: 52 },
};

// Palet pasar malam: langit malam ungu-biru, lampu hangat, kayu, aksen teal.
export const PALETTE = {
  skyTop: '#171233',
  skyMid: '#241a4d',
  skyBottom: '#3a2060',
  stallWood: '#7a4a22',
  stallWoodDark: '#5d3718',
  counterTop: '#a06a33',
  counterFace: '#6b4220',
  cream: '#fff3d6',
  ink: '#241a12',
  amber: '#ffb347',
  ember: '#ff7a2f',
  teal: '#2ec4b6',
  red: '#e63946',
  green: '#7dc383',
  gold: '#ffd166',
};
