# Sources: Horno Lento sonic identity

Everything is **synthesised from math in Python** (numpy/scipy): FM electric piano, modal marimba and bells, subtractive bass and pad, noise percussion.
No samples, no soundfont, no Freesound files, no Stickz loops are used (the earlier Stickz-loop version is in git history only).
So there is no third-party licence to track. The music and SFX are original work for this project.

Code: `synthlib.py` (instruments), `build_music.py` (notes, arrangement, mix), `build_sfx.py` (SFX + palette). Rebuild: `./build_music.sh`.

## Sonic logo
"HOR-no LEN-to": G4 C5 | E5 D5, rhythm dotted-8th, 16th, dotted-8th, 16th (1 s at 120 BPM), then an oven-timer ding on C6 (tonic).
Why: a rise by a fourth then a third opens up (hopeful), the small drop to D5 leaves it as a question, and the ding on C answers it.

## Chord per bar (key C major; I-IV-vi-V loop; bar = 2 s)
| bars | 1-2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| chord | clash (no key) | Cmaj9 | Fmaj7 | Am7 | G7 | Cmaj9 | Fmaj7 | Am7 | G7 | Cmaj9 | Fmaj7 | G7 | Cmaj9 | C rings |

## SFX (all synthesised; tuned to the chord root of the bar they are meant for; machine-readable in `sfx/_index.json`)
| file | what it is | tuned to | planned bar |
|---|---|---|---|
| tap | spoon on ceramic cup (modal clink) | A (Am) | 5 |
| bag_swish | paper bakery bag fold + swish (noise + crackle) | unpitched | 6 |
| pop | cork / bubble (pitch chirp) | G | 6 |
| payment_ding | oven-timer ding (inharmonic bell) | F | 8 |
| order_bell | shop door bell (shaken small bells + tuned note) | A | 9 |
| receipt_chatter | thermal printer bursts + motor whine | G | 10 |
| shimmer | sugar sprinkle (random high ticks + soft arpeggio) | C | 3 |
| swap | soft pan / lid hit (modal) | F (bar 12), `swap_G` for 13 | 12-13 |
| final_motif_ding | motif + ding on C6 | C | 14-15 |
Pitched SFX also exist as `<name>_C|_F|_Am|_G.wav`. All are 48 kHz, trimmed, peak -6 dBFS. `palette.wav` (20 s): each SFX once with 0.3 s gaps, then the motif alone.
