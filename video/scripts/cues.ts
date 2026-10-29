import {mkdirSync, writeFileSync} from 'node:fs';
import {CUES, FPS, onGrid, BEAT} from '../src/timeline';

if (process.argv.includes('--check')) {
  const bad = CUES.filter((c) => !onGrid(c.frame));
  const names = new Set<string>();
  const dup = CUES.filter((c) => (names.has(c.name) ? true : (names.add(c.name), false)));
  for (const c of bad) console.error(`OFF GRID: ${c.name} @ ${c.frame} (frame % ${BEAT} = ${c.frame % BEAT})`);
  for (const c of dup) console.error(`DUPLICATE NAME: ${c.name}`);
  if (bad.length || dup.length) process.exit(1);
  console.log(`ok: ${CUES.length} cues, all on the grid`);
} else {
  mkdirSync('out', {recursive: true});
  const rows = CUES.map((c) => ({
    name: c.name,
    frame: c.frame,
    seconds: +(c.frame / FPS).toFixed(4),
    kind: c.kind,
    ...(c.dur ? {durationSeconds: +(c.dur / FPS).toFixed(4)} : {}),
  }));
  writeFileSync('out/cues.json', JSON.stringify(rows, null, 2));
  console.log(`wrote out/cues.json (${rows.length} cues)`);
}
