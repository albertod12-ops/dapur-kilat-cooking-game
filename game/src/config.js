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
export const CHEF_Y = 612;

// Wok: masak per bahan (detik), lalu dibiarkan BURN_AFTER detik jadi hangus.
export const BURN_AFTER = 6;
export const CHOP_SECONDS = 2.5;

// Pesanan.
export const MAX_TICKETS = 4;
export const STREAK_STEP = 0.25;
export const STREAK_MAX = 2;

// Layout (px) — dapur "line kitchen" ala Copper & Thyme: satu garis counter
// horizontal; tiket di atas, papan menu + lampu gantung + rak di dinding
// belakang, stasiun (wok → talenan → piring → pass) di atas counter,
// bin bahan baris bersih di badan counter, koki berjalan di depan counter.
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 56 },
  tickets: { x: 16, y: 64, w: 302, h: 104, gap: 12 },
  menuBoard: { x: 16, y: 184, w: 340, h: 108 },
  lamps: { xs: [480, 640, 800], top: 176 },
  shelf: { x: 960, y: 200, w: 304, h: 60 },
  counterTop: { x: 0, y: 296, w: 1280, h: 14 },
  counterFace: { x: 0, y: 310, w: 1280, h: 250 },
  wok: { x: 24, y: 300, w: 320, h: 172 },
  board: { x: 368, y: 306, w: 240, h: 166 },
  plates: { x: 632, y: 306, w: 264, h: 166 },
  pass: { x: 920, y: 300, w: 264, h: 172 },
  bins: { x: 16, y: 480, w: 186, h: 80, gap: 10 },
  trash: { x: 1196, y: 480, w: 68, h: 76 },
  helpBar: { x: 0, y: 668, w: 1280, h: 52 },
};

// Palet pasar malam: langit malam ungu-biru, lampu hangat, kayu, aksen teal.
export const PALETTE = {
  skyTop: '#171233',
  skyMid: '#241a4d',
  skyBottom: '#3a2060',
  stallWood: '#7a4a22',
  stallWoodDark: '#5d3718',
  wall: '#4a2c17',
  wallDark: '#3a2110',
  menuBoard: '#33302a',
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
