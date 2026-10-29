# Product ad (30 s, 9:16)

A motion-design ad for the shop template, aimed at café and bakery owners. Brief, script and beat grid: `PLAN.md`.
It shows only the fictional bakery "Horno Lento" (`demo-shop/`), never a real shop.

```bash
npm install                      # Remotion project (this folder)
bash audio/build_music.sh        # music, sound effects and mix from out/cues.json (seconds)
npm run cues                     # regenerate out/cues.json after changing src/timeline.ts
npm run render                   # out/ad.mp4
npm run studio                   # preview and scrub
```

- `capture/capture.mjs`: films the real app with the fictional shop (phone size, 3x) into `public/captures/`.
- `src/timeline.ts`: every cut, title and sound cue; `npm run check-cues` keeps them on the 120 BPM grid.
- `audio/`: everything is synthesised by `build_sfx.py`, `build_music.py`, `build_mix.py`; the wav files are generated, not tracked.
- End card text (product name, contact) is in `src/constants.ts`.
