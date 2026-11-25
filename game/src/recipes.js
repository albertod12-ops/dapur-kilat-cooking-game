// Ingredients and recipes for Warung Saji. Each recipe is a list of steps
// (ingredient + the station that processes it): the wok yields 'cooked',
// the board yields 'chopped'. A plate matches a recipe when its
// (ingredient, state) multiset is exactly the same.
export const INGREDIENTS = [
  { id: 'nasi', name: 'Rice', short: 'Rice', base: '#f7efdc', dark: '#d9c9a3', accent: '#fff8e6' },
  { id: 'mie', name: 'Noodles', short: 'Noodles', base: '#f2c14e', dark: '#c98f1f', accent: '#ffe08a' },
  { id: 'ayam', name: 'Chicken', short: 'Chicken', base: '#e8a56b', dark: '#a8662e', accent: '#f7c795' },
  { id: 'telur', name: 'Egg', short: 'Egg', base: '#fdfdfd', dark: '#d8d2c4', accent: '#ffffff' },
  { id: 'cabai', name: 'Chili', short: 'Chili', base: '#e0392c', dark: '#8f1d12', accent: '#ff7a6b' },
  { id: 'sayur', name: 'Greens', short: 'Greens', base: '#4caf50', dark: '#256b2a', accent: '#8ee193' },
];

export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map((g) => [g.id, g]));

export const RECIPES = [
  {
    id: 'nasgor', name: 'Nasi Goreng', price: 15,
    steps: [
      { ing: 'nasi', station: 'wok' },
      { ing: 'telur', station: 'wok' },
      { ing: 'cabai', station: 'board' },
    ],
  },
  {
    id: 'miegor', name: 'Mie Goreng', price: 14,
    steps: [
      { ing: 'mie', station: 'wok' },
      { ing: 'telur', station: 'wok' },
      { ing: 'sayur', station: 'board' },
    ],
  },
  {
    id: 'geprek', name: 'Ayam Geprek', price: 18,
    steps: [
      { ing: 'ayam', station: 'wok' },
      { ing: 'cabai', station: 'board' },
    ],
  },
  {
    id: 'nasiayam', name: 'Nasi Ayam', price: 17,
    steps: [
      { ing: 'nasi', station: 'wok' },
      { ing: 'ayam', station: 'wok' },
      { ing: 'sayur', station: 'board' },
    ],
  },
  {
    id: 'mieayam', name: 'Mie Ayam', price: 16,
    steps: [
      { ing: 'mie', station: 'wok' },
      { ing: 'ayam', station: 'wok' },
      { ing: 'cabai', station: 'board' },
    ],
  },
  {
    id: 'omelet', name: 'Vegetable Omelet', price: 12,
    steps: [
      { ing: 'telur', station: 'wok' },
      { ing: 'sayur', station: 'board' },
      { ing: 'cabai', station: 'board' },
    ],
  },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

// Keadaan hasil olahan untuk sebuah stasiun.
export function processedState(station) {
  return station === 'wok' ? 'cooked' : 'chopped';
}

// Daftar (bahan, keadaan) yang harus ada di piring untuk resep ini.
export function requiredItems(recipe) {
  return recipe.steps.map((s) => ({ ing: s.ing, state: processedState(s.station) }));
}

// Apakah isi piring (array {ing, state}) sama persis dengan resep?
export function plateMatches(plate, recipe) {
  const need = requiredItems(recipe);
  if (plate.length !== need.length) return false;
  const have = plate.map((p) => p.ing + ':' + p.state).sort().join('|');
  const want = need.map((p) => p.ing + ':' + p.state).sort().join('|');
  return have === want;
}

// Bahan-bahan resep yang belum ada di piring (untuk autopilot & checklist).
export function missingItems(plate, recipe) {
  const need = requiredItems(recipe);
  const have = plate.map((p) => p.ing + ':' + p.state);
  const out = [];
  for (const n of need) {
    const key = n.ing + ':' + n.state;
    const i = have.indexOf(key);
    if (i >= 0) have.splice(i, 1);
    else out.push(n);
  }
  return out;
}

// Stasiun yang mengolah bahan ini untuk resep tertentu.
export function stationFor(recipe, ing) {
  const step = recipe.steps.find((s) => s.ing === ing);
  return step ? step.station : null;
}
