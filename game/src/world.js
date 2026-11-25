// The kitchen itself: orders, the hand, the chopping board, the stove, the plate,
// the till. No drawing here — render.js paints this state, input.js calls these actions.
import {
  BINS, CHEF_MAX_X, CHEF_MIN_X, CHEF_SPEED, CHEF_Y, CHOP_CLICKS, COMBO_WINDOW, COOK_BURN_AT, COOK_PERFECT_FROM, COOK_SECONDS,
  CUSTOMERS, INGREDIENTS, MAX_TICKETS, PERFECT_BONUS, RECIPES, RUSH_SECONDS,
  SHIFT_SECONDS, STOVE_SLOTS, TARGET_COINS, TIP_MAX, VIEW,
} from './config.js';

export const EVENT_SERVED = 1;
export const EVENT_LOST = 2;
export const EVENT_OVER = 4;
export const EVENT_PERFECT = 8;
export const EVENT_BURNT = 16;

/** Where everything sits on the 1280x720 canvas. Input and render share this. */
export const LAYOUT = {
  board: { x: 24, y: 96, w: 1232, h: 108 },
  ticket: { w: 224, h: 98, gap: 16 },
  bins: { x: 24, y: 246, w: 1232, h: 92, cell: 96, gap: 5 },
  work: { x: 24, y: 362, w: 1232, h: 250 },
  chop: { x: 48, y: 386, w: 300, h: 202 },
  stove: { x: 372, y: 386, w: 300, h: 202 },
  plate: { x: 696, y: 386, w: 300, h: 202 },
  bell: { x: 1020, y: 386, w: 116, h: 96 },
  trash: { x: 1020, y: 496, w: 116, h: 92 },
  hand: { x: 1152, y: 386, w: 104, h: 202 },
};

/** Floor x the chef stands at to work a station (or pick a bin). */
export function chefSpot(kind, arg = 0) {
  switch (kind) {
    case 'chop': return 198;
    case 'stove': return arg === 0 ? 446 : 600;
    case 'plate': return 846;
    case 'bell': return 1000; // beside the bell, not on top of the trash label
    case 'trash': return 1078;
    case 'bin': {
      const i = Math.max(0, Math.min(BINS.length - 1, arg));
      return LAYOUT.bins.x + i * (LAYOUT.bins.cell + LAYOUT.bins.gap) + LAYOUT.bins.cell / 2;
    }
    default: return 640;
  }
}

export function cookedOf(rawId) {
  const map = {
    pattyRaw: 'patty', eggRaw: 'egg', riceRaw: 'rice',
    chickenRaw: 'chicken', pastaRaw: 'pasta',
  };
  return map[rawId] ?? null;
}

export function choppedOf(rawId) {
  const map = { lettuceRaw: 'lettuce', tomatoRaw: 'tomato', cucumberRaw: 'cucumber' };
  return map[rawId] ?? null;
}

function sameDish(a, b) {
  if (a.length !== b.length) return false;
  const count = (list) => {
    const m = new Map();
    for (const item of list) m.set(item, (m.get(item) ?? 0) + 1);
    return m;
  };
  const ca = count(a);
  const cb = count(b);
  if (ca.size !== cb.size) return false;
  for (const [k, v] of ca) if (cb.get(k) !== v) return false;
  return true;
}

export function createWorld(random) {
  const state = {
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    lost: 0,
    combo: 0,
    comboLeft: 0,
    best: 0,
    over: false,
    won: false,
    hand: null,
    board: null,
    stove: Array.from({ length: STOVE_SLOTS }, () => null),
    plate: [],
    tickets: [],
    spawnIn: 1.5,
    elapsed: 0,
    flash: null,
    message: null,
    messageT: 0,
    // Koki Budi: the visible cook. He walks the floor in front of the counter
    // to whatever the player is doing, so the route through the kitchen is real.
    chef: { x: 640, targetX: 640, moving: false, phase: 0 },
  };

  function spawnTicket() {
    if (state.tickets.length >= MAX_TICKETS) return;
    const recipe = random.pick(RECIPES);
    const customer = random.pick(CUSTOMERS);
    state.tickets.push({
      id: state.elapsed + Math.random(),
      recipe, customer,
      patience: recipe.time,
      total: recipe.time,
    });
  }

  function say(text) {
    state.message = text;
    state.messageT = 2.2;
  }

  const world = {
    state,

    /** Walk the chef toward x (clamped to the floor). */
    moveChefTo(x) {
      state.chef.targetX = Math.max(CHEF_MIN_X, Math.min(CHEF_MAX_X, x));
    },

    /** Put the chef somewhere at once (screenshot staging). */
    setChef(x) {
      state.chef.x = Math.max(CHEF_MIN_X, Math.min(CHEF_MAX_X, x));
      state.chef.targetX = state.chef.x;
      state.chef.moving = false;
    },

    reset() {
      state.timeLeft = SHIFT_SECONDS;
      state.coins = 0;
      state.served = 0;
      state.lost = 0;
      state.combo = 0;
      state.comboLeft = 0;
      state.over = false;
      state.won = false;
      state.hand = null;
      state.board = null;
      state.stove = Array.from({ length: STOVE_SLOTS }, () => null);
      state.plate = [];
      state.tickets = [];
      state.spawnIn = 1.5;
      state.elapsed = 0;
      state.message = null;
      state.chef = { x: 640, targetX: 640, moving: false, phase: 0 };
      spawnTicket();
      spawnTicket();
    },

    pickBin(id) {
      if (state.hand !== null || state.over) return 'busy';
      if (!BINS.includes(id)) return 'bad';
      state.hand = id;
      world.moveChefTo(chefSpot('bin', BINS.indexOf(id)));
      return 'pick';
    },

    clickBoard() {
      if (state.over) return 'bad';
      world.moveChefTo(chefSpot('chop'));
      if (state.board === null) {
        if (state.hand === null) return 'bad';
        const chopped = choppedOf(state.hand);
        if (!chopped) return 'bad';
        state.board = { item: state.hand, result: chopped, clicks: 0 };
        state.hand = null;
        return 'place';
      }
      state.board.clicks += 1;
      if (state.board.clicks >= CHOP_CLICKS) {
        state.hand = state.board.result;
        state.board = null;
        return 'chopDone';
      }
      return 'chop';
    },

    clickStove(slot) {
      if (state.over) return 'bad';
      world.moveChefTo(chefSpot('stove', slot));
      const current = state.stove[slot];
      if (current === null) {
        if (state.hand === null) return 'bad';
        if (!cookedOf(state.hand)) return 'bad';
        state.stove[slot] = { item: state.hand, result: cookedOf(state.hand), t: 0, burnt: false };
        state.hand = null;
        return 'sizzle';
      }
      if (state.hand !== null) return 'bad';
      if (current.burnt) {
        state.stove[slot] = null;
        return 'burnt';
      }
      if (current.t < COOK_SECONDS) {
        state.hand = current.item;
        state.stove[slot] = null;
        return 'pick';
      }
      state.hand = current.result;
      state.stove[slot] = null;
      if (current.t >= COOK_PERFECT_FROM && current.t <= COOK_BURN_AT) {
        state.coins += PERFECT_BONUS;
        say(`Masakan sempurna! +${PERFECT_BONUS} koin bonus.`);
        return 'perfect';
      }
      return 'pick';
    },

    clickPlate() {
      if (state.over) return 'bad';
      world.moveChefTo(chefSpot('plate'));
      if (state.hand === null) return 'bad';
      const ing = INGREDIENTS[state.hand];
      if (!ing || ing.prep !== 'none') return 'bad';
      if (state.plate.length >= 6) return 'bad';
      state.plate.push(state.hand);
      state.hand = null;
      return 'place';
    },

    clickTrash() {
      if (state.over) return 'bad';
      world.moveChefTo(chefSpot('trash'));
      if (state.hand !== null) {
        state.hand = null;
        return 'trash';
      }
      if (state.plate.length > 0) {
        state.plate = [];
        return 'trash';
      }
      return 'bad';
    },

    clickBell() {
      if (state.over) return 'bad';
      world.moveChefTo(chefSpot('bell'));
      if (state.plate.length === 0) return 'bad';
      const index = state.tickets.findIndex((t) => sameDish(state.plate, t.recipe.needs));
      if (index === -1) return 'bad';
      const ticket = state.tickets[index];
      state.tickets.splice(index, 1);
      const patienceLeft = Math.max(0, ticket.patience / ticket.total);
      const tip = Math.round(patienceLeft * TIP_MAX);
      const mult = 1 + Math.min(state.combo, 4) * 0.25;
      const earned = Math.round((ticket.recipe.price + tip) * mult);
      state.coins += earned;
      state.served += 1;
      state.combo += 1;
      state.comboLeft = COMBO_WINDOW;
      state.plate = [];
      say(`+${earned} koin — ${ticket.recipe.name} untuk ${ticket.customer.name}!`);
      return 'serve';
    },

    step(dt) {
      let events = 0;
      if (state.over) return events;
      state.elapsed += dt;
      // The chef walks toward his target spot.
      {
        const chef = state.chef;
        const dx = chef.targetX - chef.x;
        if (Math.abs(dx) > 2) {
          const stepPx = CHEF_SPEED * dt;
          chef.x += Math.max(-stepPx, Math.min(stepPx, dx));
          chef.moving = true;
          chef.phase += dt * 11;
        } else {
          chef.x = chef.targetX;
          chef.moving = false;
        }
      }
      state.timeLeft -= dt;
      if (state.messageT > 0) state.messageT -= dt;
      if (state.comboLeft > 0) {
        state.comboLeft -= dt;
        if (state.comboLeft <= 0) state.combo = 0;
      }
      for (let i = state.tickets.length - 1; i >= 0; i -= 1) {
        state.tickets[i].patience -= dt;
        if (state.tickets[i].patience <= 0) {
          say(`${state.tickets[i].customer.name} pergi kecewa — pesanan hangus.`);
          state.tickets.splice(i, 1);
          state.lost += 1;
          state.combo = 0;
          events |= EVENT_LOST;
        }
      }
      for (const slot of state.stove) {
        if (slot && !slot.burnt) {
          slot.t += dt;
          if (slot.t >= COOK_BURN_AT) {
            slot.burnt = true;
            events |= EVENT_BURNT;
          }
        }
      }
      state.spawnIn -= dt;
      if (state.spawnIn <= 0) {
        spawnTicket();
        const rush = 1 - state.timeLeft / SHIFT_SECONDS;
        state.spawnIn = state.timeLeft <= RUSH_SECONDS ? 4.5 : 9 - rush * 3.5;
      }
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        state.over = true;
        state.won = state.coins >= TARGET_COINS;
        events |= EVENT_OVER;
      }
      return events;
    },
  };
  world.reset();
  return world;
}

export { BINS, INGREDIENTS, RECIPES, VIEW };
