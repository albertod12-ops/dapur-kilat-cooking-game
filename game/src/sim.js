// Satu langkah penuh simulasi — dipakai loop utama dan autopilot.
// Dipisah dari state.js supaya tidak ada circular import.
import { updateChef } from './chef.js';
import { runPendingAction, updateStations } from './stations.js';
import { updateClocks } from './state.js';

export function stepGame(G, dt) {
  if (G.phase !== 'play' || G.paused) return;
  updateChef(G, dt);
  if (G.chef.action && Math.abs(G.chef.x - G.chef.targetX) <= 4) runPendingAction(G);
  updateStations(G, dt);
  updateClocks(G, dt);
}
