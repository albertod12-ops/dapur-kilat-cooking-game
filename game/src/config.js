// Dapur Kilat — tuning, ingredients and the menu.
// One file, one job: every number and name the rest of the game reads.
export const STEP = 1 / 60;
export const VIEW = { width: 1280, height: 720 };
export const SHIFT_SECONDS = 150;
export const TARGET_COINS = 120;
export const MAX_TICKETS = 4;
export const BEST_KEY = 'dapur-kilat-best-coins';

/** Ingredient kinds. `prep` says what the ingredient needs before it can be plated. */
export const INGREDIENTS = {
  bunBottom: { name: 'Roti Bawah', short: 'Roti', color: '#e8a54b', prep: 'none', key: '1' },
  bunTop: { name: 'Roti Atas', short: 'Roti', color: '#e8a54b', prep: 'none', key: '2' },
  pattyRaw: { name: 'Daging Mentah', short: 'Daging', color: '#b0563a', prep: 'cook', key: '3' },
  patty: { name: 'Daging Panggang', short: 'Daging', color: '#7a3b22', prep: 'none', key: null },
  lettuceRaw: { name: 'Selada', short: 'Selada', color: '#7bc043', prep: 'chop', key: '4' },
  lettuce: { name: 'Selada Potong', short: 'Selada', color: '#8ed152', prep: 'none', key: null },
  tomatoRaw: { name: 'Tomat', short: 'Tomat', color: '#e23b2e', prep: 'chop', key: '5' },
  tomato: { name: 'Tomat Potong', short: 'Tomat', color: '#ff5a45', prep: 'none', key: null },
  cheese: { name: 'Keju', short: 'Keju', color: '#ffcf3d', prep: 'none', key: '6' },
  eggRaw: { name: 'Telur Mentah', short: 'Telur', color: '#f7ead0', prep: 'cook', key: '7' },
  egg: { name: 'Telur Goreng', short: 'Telur', color: '#ffd94d', prep: 'none', key: null },
  cucumberRaw: { name: 'Timun', short: 'Timun', color: '#4da96b', prep: 'chop', key: '8' },
  cucumber: { name: 'Timun Potong', short: 'Timun', color: '#6cc487', prep: 'none', key: null },
  sauce: { name: 'Saus Kilat', short: 'Saus', color: '#ff8c42', prep: 'none', key: '9' },
  riceRaw: { name: 'Nasi Mentah', short: 'Nasi', color: '#f2ead8', prep: 'cook', key: '0' },
  rice: { name: 'Nasi Goreng', short: 'Nasi', color: '#e8b64c', prep: 'none', key: null },
  chickenRaw: { name: 'Ayam Mentah', short: 'Ayam', color: '#e8a0a0', prep: 'cook', key: null },
  chicken: { name: 'Ayam Goreng', short: 'Ayam', color: '#c97b2d', prep: 'none', key: null },
  pastaRaw: { name: 'Pasta Mentah', short: 'Pasta', color: '#f0d48a', prep: 'cook', key: null },
  pasta: { name: 'Pasta Matang', short: 'Pasta', color: '#f7c948', prep: 'none', key: null },
};

/** What the counter bins hold (click a bin, or press its key, to pick the ingredient up). */
export const BINS = [
  'bunBottom', 'bunTop', 'pattyRaw', 'lettuceRaw', 'tomatoRaw',
  'cheese', 'eggRaw', 'cucumberRaw', 'sauce', 'riceRaw',
  'chickenRaw', 'pastaRaw',
];

/** Chopping takes this many clicks; cooking takes this long, with a perfect window. */
export const CHOP_CLICKS = 3;
export const COOK_SECONDS = 6;
export const COOK_PERFECT_FROM = 4.5;
export const COOK_BURN_AT = 9;
export const STOVE_SLOTS = 2;

/** The menu: each dish is an ordered stack of plated ingredients. */
export const RECIPES = [
  {
    id: 'burger', name: 'Burger Kilat', price: 14, time: 34,
    needs: ['bunBottom', 'patty', 'lettuce', 'tomato', 'bunTop'],
  },
  {
    id: 'cheeseburger', name: 'Burger Keju', price: 18, time: 38,
    needs: ['bunBottom', 'patty', 'cheese', 'lettuce', 'bunTop'],
  },
  {
    id: 'salad', name: 'Salad Segar', price: 10, time: 26,
    needs: ['lettuce', 'tomato', 'cucumber', 'sauce'],
  },
  {
    id: 'omelet', name: 'Omelet Kilat', price: 12, time: 30,
    needs: ['egg', 'cheese', 'tomato'],
  },
  {
    id: 'nasgor', name: 'Nasi Goreng', price: 16, time: 40,
    needs: ['rice', 'egg', 'chicken', 'sauce'],
  },
  {
    id: 'spaghetti', name: 'Spaghetti Kilat', price: 15, time: 36,
    needs: ['pasta', 'sauce', 'cheese'],
  },
];

export const CUSTOMERS = [
  { name: 'Mbak Rani', color: '#e2703a' },
  { name: 'Pak Dedi', color: '#3a6ea5' },
  { name: 'Nona Sari', color: '#a53a7a' },
  { name: 'Bang Joko', color: '#4a7c3a' },
  { name: 'Kak Lilis', color: '#7a5ac8' },
  { name: 'Om Budi', color: '#b8860b' },
];

/** Combo: serving within this many seconds of the last serve keeps the streak alive. */
export const COMBO_WINDOW = 12;
export const TIP_MAX = 8;
