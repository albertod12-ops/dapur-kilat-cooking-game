# Night Market: Warung Saji

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/albertod12-ops/dapur-kilat-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/albertod12-ops/dapur-kilat-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Night Market: Warung Saji — a fast cooking game at an Indonesian night-market stall. A "line kitchen": one counter line — menu board on the back wall, hanging lamps and a spice shelf above the counter, wok, chopping board, plate and the PASS bell laid out along the counter, a clean row of ingredient bins below. Orders come in on the ticket board: grab ingredients from the bins, cook in the flaming wok (don't let it burn), chop on the board, build on the plate, then ring the bell and serve before customers walk away. Chef Budi walks the kitchen (WASD or click), 6 Indonesian dishes (Nasi Goreng, Mie Goreng, Ayam Geprek, Nasi Ayam, Mie Ayam, Vegetable Omelet), 3 waves that get busier (OPENING → DINNER RUSH → PEAK HOUR), streak/combo up to x2, and an earnings target of $150 in a 3:00 shift. Food is drawn glossy with gradients and sparkle, customers have faces whose mood changes with patience, sound is synthesized WebAudio — all original, no copied assets. Keyboard + mouse, offline, no build step.

## How to play

- Click an ingredient bin to pick up, click the wok to cook, click the board to chop, click the plate to build, click the PASS bell to serve.
- A/D or ←/→ to walk, E to act at the nearest station, P pause, M sound, ENTER start / play again.
- A complete plate that matches a ticket = the bell lights up "SERVE!". Serve fast in a row for streaks and bonuses.
- When patience runs low, the ticket flashes a red border with a "!" badge — serve that customer first.
- Wave 2 brings a big DINNER RUSH! event: orders come faster and the target jumps to $90.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — or open game/index.html directly in desktop Chrome.

---

<sub>Entered on [make.fun](https://make.fun/?ref=rbvcjbg9&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
