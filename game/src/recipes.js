// Pasar Malam: Warung Saji — data bahan + resep Indonesia.
// Satu bahan = satu stasiun (wok untuk masak, talenan untuk potong).
// Satu resep = 2-3 bahan, tiap resep kombinasinya beda (C2: recipes combine
// in different ways), jadi piring cocok dengan resep bila isinya sama persis.
export const INGREDIENTS = {
  nasi: { id: 'nasi', name: 'Nasi', station: 'wok', cook: 3.5, base: '#fff8e7', hi: '#ffffff', lo: '#e8d9b0' },
  mie: { id: 'mie', name: 'Mie', station: 'wok', cook: 3.0, base: '#ffd166', hi: '#ffe9a8', lo: '#d9a441' },
  ayam: { id: 'ayam', name: 'Ayam', station: 'wok', cook: 4.5, base: '#e07a3f', hi: '#f2a35e', lo: '#a34d22' },
  telur: { id: 'telur', name: 'Telur', station: 'wok', cook: 3.0, base: '#fff3c4', hi: '#ffffff', lo: '#f0c93f' },
  cabai: { id: 'cabai', name: 'Cabai', station: 'board', cook: 0, base: '#e63946', hi: '#ff7a6e', lo: '#a11d2a' },
  sayur: { id: 'sayur', name: 'Sayur', station: 'board', cook: 0, base: '#57b25e', hi: '#8ed694', lo: '#2e7d32' },
};

export const INGREDIENT_IDS = ['nasi', 'mie', 'ayam', 'telur', 'cabai', 'sayur'];

export const RECIPES = [
  {
    id: 'nasi-goreng', name: 'Nasi Goreng', price: 15000,
    steps: [
      { ing: 'nasi', station: 'wok' },
      { ing: 'telur', station: 'wok' },
      { ing: 'cabai', station: 'board' },
    ],
  },
  {
    id: 'mie-goreng', name: 'Mie Goreng', price: 14000,
    steps: [
      { ing: 'mie', station: 'wok' },
      { ing: 'telur', station: 'wok' },
      { ing: 'sayur', station: 'board' },
    ],
  },
  {
    id: 'ayam-geprek', name: 'Ayam Geprek', price: 18000,
    steps: [
      { ing: 'ayam', station: 'wok' },
      { ing: 'cabai', station: 'board' },
    ],
  },
  {
    id: 'nasi-ayam', name: 'Nasi Ayam', price: 17000,
    steps: [
      { ing: 'nasi', station: 'wok' },
      { ing: 'ayam', station: 'wok' },
      { ing: 'sayur', station: 'board' },
    ],
  },
  {
    id: 'mie-ayam', name: 'Mie Ayam', price: 16000,
    steps: [
      { ing: 'mie', station: 'wok' },
      { ing: 'ayam', station: 'wok' },
      { ing: 'cabai', station: 'board' },
    ],
  },
  {
    id: 'omelet-sayur', name: 'Omelet Sayur', price: 12000,
    steps: [
      { ing: 'telur', station: 'wok' },
      { ing: 'sayur', station: 'board' },
      { ing: 'cabai', station: 'board' },
    ],
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

// Piring cocok dengan resep bila himpunan bahannya sama persis.
export function recipeForPlate(items) {
  const have = [...items].sort().join(',');
  return RECIPES.find((r) => r.steps.map((s) => s.ing).sort().join(',') === have) || null;
}

export function formatRp(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}
