// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps, and the renderer paints what is there. Screens: title, play, paused, game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|serve|end (with &seed=N) stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import { createWorld, EVENT_BURNT, EVENT_LOST, EVENT_OVER } from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function announce(text) {
  status.textContent = text;
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function soundFor(result) {
    switch (result) {
      case 'pick': case 'place': audio.pick(); break;
      case 'chop': audio.chop(); break;
      case 'chopDone': audio.chop(); audio.ding(); break;
      case 'sizzle': audio.sizzle(); break;
      case 'perfect': audio.ding(); audio.serve(); break;
      case 'serve': audio.serve(); break;
      case 'trash': audio.click(); break;
      case 'burnt': audio.burn(); break;
      case 'bad': audio.bad(); break;
      default: break;
    }
  }

  function onAction(result) {
    audio.unlock();
    if (result === ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Suara mati' : 'Suara hidup');
      return;
    }
    if (result === ACTION_RESTART) {
      world.reset();
      screen = SCREEN_PLAY;
      audio.startMusic();
      announce('Shift baru dimulai');
      return;
    }
    if (result === ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) screen = SCREEN_PAUSED;
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
      return;
    }
    if (result === ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
        world.reset();
        screen = SCREEN_PLAY;
        audio.startMusic();
        announce('Shift dimulai — layani pesanan secepatnya!');
      }
      return;
    }
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      // Any click on the title / game-over screen starts a shift.
      if (result !== 'none' && result !== 'bad') {
        world.reset();
        screen = SCREEN_PLAY;
        audio.startMusic();
      }
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    soundFor(result);
  }

  createInput(canvas, world, { onAction });

  function frame(now) {
    const dt = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    if (screen === SCREEN_PLAY) {
      accumulator += dt;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        const events = world.step(STEP);
        if (events & EVENT_BURNT) audio.burn();
        if (events & EVENT_LOST) audio.bad();
        if (events & EVENT_OVER) {
          audio.stopMusic();
          if (world.state.won) audio.win();
          screen = SCREEN_OVER;
          if (world.state.coins > best) {
            best = world.state.coins;
            saveBest(best);
          }
          announce(world.state.won
            ? `Shift berhasil! ${world.state.coins} koin.`
            : `Shift selesai. ${world.state.coins} koin.`);
        }
      }
    }
    renderer.draw(world.state, screen, best);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
