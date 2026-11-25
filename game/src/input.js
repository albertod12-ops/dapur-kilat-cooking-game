// Mouse and keyboard: every click and key maps to one world action.
// Returns the action's result word so the loop can play the right sound.
import { BINS, INGREDIENTS } from './config.js';
import { LAYOUT } from './world.js';

export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';
export const ACTION_RESTART = 'restart';

function inside(x, y, r) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

export function createInput(canvas, world, hooks) {
  function scale(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function clickAt(x, y) {
    const st = world.state;
    const bins = LAYOUT.bins;
    if (inside(x, y, LAYOUT.bell)) return world.clickBell();
    if (inside(x, y, LAYOUT.trash)) return world.clickTrash();
    if (inside(x, y, LAYOUT.chop)) return world.clickBoard();
    if (inside(x, y, LAYOUT.plate)) return world.clickPlate();
    const stove = LAYOUT.stove;
    if (inside(x, y, stove)) {
      const slot = x < stove.x + stove.w / 2 ? 0 : 1;
      return world.clickStove(slot);
    }
    if (inside(x, y, bins)) {
      const index = Math.floor((x - bins.x) / bins.cell);
      if (index >= 0 && index < BINS.length) {
        const hit = index * (bins.cell + bins.gap) < x - bins.x + bins.gap;
        if (hit) return world.pickBin(BINS[index]);
      }
      return 'bad';
    }
    // Click-to-move: tap the floor in front of the counter and the chef walks there.
    if (y > 615) {
      world.moveChefTo(x);
      return 'none';
    }
    void st;
    return 'none';
  }

  function onMouse(event) {
    const { x, y } = scale(event);
    const result = clickAt(x, y);
    hooks.onAction(result);
  }

  function onKey(event) {
    const key = event.key.toLowerCase();
    if (key === 'p' || key === 'escape') { hooks.onAction(ACTION_PAUSE); return; }
    if (key === 'm') { hooks.onAction(ACTION_MUTE); return; }
    if (key === 'r') { hooks.onAction(ACTION_RESTART); return; }
    if (key === ' ' || key === 'enter') { hooks.onAction(ACTION_CONFIRM); return; }
    // Walk the chef with A/D or the arrow keys (W stays the stove shortcut).
    if (key === 'a' || key === 'arrowleft') {
      world.moveChefTo(world.state.chef.targetX - 90);
      hooks.onAction('none');
      return;
    }
    if (key === 'd' || key === 'arrowright') {
      world.moveChefTo(world.state.chef.targetX + 90);
      hooks.onAction('none');
      return;
    }
    if (key === 'e') { hooks.onAction(world.clickBell()); return; }
    if (key === 't') { hooks.onAction(world.clickTrash()); return; }
    if (key === 'q') { hooks.onAction(world.clickStove(0)); return; }
    if (key === 'w') { hooks.onAction(world.clickStove(1)); return; }
    if (key === 'c') { hooks.onAction(world.clickBoard()); return; }
    const bin = BINS.find((id) => INGREDIENTS[id].key === key);
    if (bin) hooks.onAction(world.pickBin(bin));
  }

  canvas.addEventListener('click', onMouse);
  window.addEventListener('keydown', onKey);
  return {
    clickAt,
    destroy() {
      canvas.removeEventListener('click', onMouse);
      window.removeEventListener('keydown', onKey);
    },
  };
}
