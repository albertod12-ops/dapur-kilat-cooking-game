// Night Market: Warung Saji — entry (Node 22, stdlib only).
// The game is static files under game/ (index.html + ES modules, no library,
// no network). This program copies game/ + screenshots/ to /output
// and writes /output/dossier.json with make.fun's vendored library.
//
// Run locally: `node serve.ts`, open http://localhost:8080.
// Outside the grader container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Batas scorer (gate.json): hanya text_max_bytes yang membentuk byte;
// sisanya menolak entry yang scorer juga tolak (lebih dari 4 screenshot
// atau satu di atas 256 KiB; game/ lebih dari 993 file atau 48 MiB).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
