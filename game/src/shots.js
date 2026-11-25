// Screenshot scenes behind ?shot=start|play|serve|end. Each one plays the real rules
// forward from a fresh world with a scripted cook (the same actions a player makes:
// pick, chop, cook, plate, serve), so every frame is what a real game looks like and
// the same seed always gives the same frame.
import { CHOP_CLICKS, COOK_SECONDS, STEP } from './config.js';
import { choppedOf, cookedOf } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const SAMPLE = STEP;

const RAW_FOR = {
  patty: 'pattyRaw', egg: 'eggRaw', rice: 'riceRaw',
  chicken: 'chickenRaw', pasta: 'pastaRaw',
  lettuce: 'lettuceRaw', tomato: 'tomatoRaw', cucumber: 'cucumberRaw',
};

function rawFor(need) {
  return RAW_FOR[need] ?? null;
}

function stepFor(world, seconds) {
  for (let t = 0; t < seconds; t += SAMPLE) world.step(SAMPLE);
}

/** Put one plated ingredient on the plate, doing its prep through the real actions. */
function prepareAndPlate(world, need) {
  const st = world.state;
  const raw = rawFor(need);
  if (raw === null) {
    // Ready to plate as-is (bun, cheese, sauce).
    world.pickBin(need);
    world.clickPlate();
    return;
  }
  const chopped = choppedOf(raw);
  const cooked = cookedOf(raw);
  world.pickBin(raw);
  if (chopped) {
    world.clickBoard();
    for (let i = 0; i < CHOP_CLICKS; i += 1) world.clickBoard();
    world.clickPlate();
  } else if (cooked) {
    world.clickStove(0);
    stepFor(world, COOK_SECONDS + 0.5);
    world.clickStove(0);
    world.clickPlate();
  }
  void st;
}

/** Build the first `count` needs of a ticket's recipe onto the plate. */
function buildPartial(world, ticket, count) {
  const needs = ticket.recipe.needs.slice(0, count);
  for (const need of needs) prepareAndPlate(world, need);
}

function buildFull(world, ticket) {
  buildPartial(world, ticket, ticket.recipe.needs.length);
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * start: fresh shift, title screen. play: a dish mid-assembly, one pan cooking,
 * a hand full, tickets waiting. serve: a finished dish on the plate, bell ready.
 * end: a whole shift played by the autopilot below, shift-over screen.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'serve' && name !== 'end') {
    stepFor(world, 5);
    world.setChef(170);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    const ticket = world.state.tickets[0];
    buildPartial(world, ticket, 3);
    // Start a second dish cooking while the first is mid-assembly.
    world.pickBin('eggRaw');
    world.clickStove(1);
    stepFor(world, 2.5);
    // Pick up one more ingredient so the hand is full too.
    const next = ticket.recipe.needs[3];
    if (next) {
      const raw = rawFor(next);
      if (raw) world.pickBin(raw);
    }
    stepFor(world, 6);
    // Koki Budi stands at the stove he just loaded, egg cooking behind him.
    world.setChef(600);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'serve') {
    const ticket = world.state.tickets[0];
    buildFull(world, ticket);
    stepFor(world, 1.5);
    // Koki Budi stands beside the bell (not on top of the trash label),
    // ready to ring it for the finished dish.
    world.setChef(1000);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  // end: let the autopilot play the whole shift.
  autopilotShift(world);
  world.setChef(170);
  return { screen: SCREEN_OVER, best: world.state.coins };
}

/** A simple cook that plays the shift: serve what matches, else build the first ticket. */
function autopilotShift(world) {
  const st = world.state;
  let guard = 0;
  while (!st.over && guard < 60000) {
    guard += 1;
    if (st.plate.length > 0) {
      const served = world.clickBell();
      if (served === 'serve') { stepFor(world, 0.5); continue; }
    }
    const ticket = st.tickets[0];
    if (!ticket) { stepFor(world, 1); continue; }
    // Take anything finished on the stove first.
    let took = false;
    for (let slot = 0; slot < 2; slot += 1) {
      const s = st.stove[slot];
      if (s && !s.burnt && s.t >= COOK_SECONDS && st.hand === null) {
        world.clickStove(slot);
        took = true;
        break;
      }
      if (s && s.burnt && st.hand === null) { world.clickStove(slot); world.clickTrash(); }
    }
    if (took) continue;
    // What does the plate still miss?
    const missing = [...ticket.recipe.needs];
    for (const item of st.plate) {
      const i = missing.indexOf(item);
      if (i !== -1) missing.splice(i, 1);
    }
    if (missing.length === 0) { world.clickBell(); continue; }
    const need = missing[0];
    if (st.hand === need) { world.clickPlate(); continue; }
    if (st.hand !== null) { world.clickTrash(); continue; }
    if (st.board !== null) {
      for (let i = 0; i < CHOP_CLICKS; i += 1) world.clickBoard();
      continue;
    }
    const raw = rawFor(need);
    if (raw === null) { world.pickBin(need); world.clickPlate(); continue; }
    if (choppedOf(raw)) { world.pickBin(raw); world.clickBoard(); continue; }
    if (cookedOf(raw)) {
      const free = st.stove.findIndex((s) => s === null);
      if (free !== -1) { world.pickBin(raw); world.clickStove(free); stepFor(world, 1); continue; }
      stepFor(world, 1.5);
      continue;
    }
    stepFor(world, 0.5);
  }
}
