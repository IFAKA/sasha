#!/usr/bin/env python3
"""Build the 30 s, 120 BPM music bed from Stickz loops. Run: ./build_music.sh
Grid: 1 beat = 0.5 s, 1 bar = 2 s, 15 bars. Key: C major (guitar loop 019, C-tuned 808s, C risers/pads)."""
import os, subprocess, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly, butter, sosfilt
from math import gcd

HERE = os.path.dirname(os.path.abspath(__file__))
S = os.path.expanduser('~/Music/Samples/')
CH = S + 'Stickz - Chill Toolkit/Stickz - Chill Toolkit - Sample Pack/Stickz CHT - '
RI = S + 'Stickz - Rise (FX Toolkit 2)/'
GU = S + 'Stickz - Hearts (Guitar Loop Toolkit)/Stickz Hearts - Guitar Loops/'
SR = 48000
BEAT, BAR, TOTAL = SR // 2, SR * 2, SR * 30
rng = np.random.default_rng(7)

def load(path, trim=True):
    x, sr = sf.read(path, always_2d=True)
    if sr != SR:
        g = gcd(SR, sr); x = resample_poly(x, SR // g, sr // g, axis=0)
    if x.shape[1] == 1: x = np.repeat(x, 2, 1)
    if trim:  # start exactly on the first transient (3% of peak)
        m = np.abs(x).max(1); x = x[int(np.argmax(m > 0.03 * m.max())):]
    return x

def speed(x, ratio):  # resample: pitch and tempo change together (ratio>1 = faster/higher)
    n = int(round(len(x) / ratio)); t = np.arange(n) * ratio
    return np.stack([np.interp(t, np.arange(len(x)), x[:, c]) for c in range(2)], 1)

def lp(x, fc, order=4):
    return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x, axis=0)
def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x, axis=0)

def db(v): return 10 ** (v / 20)

def new(): return np.zeros((TOTAL, 2))
def put(buf, x, t, gain=1.0, fade_out=None, pan=0.0):
    """Mix sample x at time t (seconds) on the sample grid."""
    i = int(round(t * SR))
    if i >= TOTAL: return
    x = x[:TOTAL - i] * gain
    if fade_out is not None:
        n = min(int(fade_out * SR), len(x)); x = x.copy(); x[-n:] *= np.linspace(1, 0, n)[:, None]
    if pan: x = x * np.array([1 - max(pan, 0), 1 + min(pan, 0)])
    buf[i:i + len(x)] += x

def env(buf, points):  # piecewise-linear gain (seconds, dB)
    t = np.arange(TOTAL) / SR
    g = db(np.interp(t, [p[0] for p in points], [p[1] for p in points]))
    return buf * g[:, None]

def reverb(x, secs=2.2, wet=1.0, seed=1):
    r = np.random.default_rng(seed); n = int(secs * SR)
    ir = r.standard_normal((n, 2)) * np.exp(-np.arange(n) / (secs * SR / 5))[:, None]
    ir = lp(ir, 5000, 2)
    ir[:int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))[:, None]
    from scipy.signal import fftconvolve
    y = np.stack([fftconvolve(x[:, c], ir[:, c]) for c in range(2)], 1)
    return y / np.abs(ir).sum() * 18 * wet

# ---- samples -------------------------------------------------------------
used = []
def L(path, trim=True):
    used.append(path.replace(S, '')); return load(path, trim)
guitar = L(GU + 'Stickz - Hearts Guitar Loop 019 - 120BPM Cmaj.wav')
guitar = np.pad(guitar, ((0, max(0, 8 * BAR - len(guitar))), (0, 0)))[:8 * BAR]
gbar = lambda k: guitar[(k - 1) * BAR:k * BAR]            # loop bar 1..8
kick = L(CH + 'Kicks/Stickz CHT - Kick 03 - D.wav')
snare = L(CH + 'Snares/Stickz CHT - Snare 03 - D.wav')
clap = L(CH + 'Claps/Stickz CHT - Clap 03.wav')
hat = L(CH + 'Cymbals/Stickz CHT - Closed Hi-Hats/Stickz CHT - Closed Hi-Hat 03.wav')
ohat = L(CH + 'Cymbals/Stickz CHT - Open Hi-Hats/Stickz CHT - Open Hi-Hat 01.wav')
perc = L(CH + 'Percussion/Stickz CHT - Percussion 12 - G.wav')
percloop = speed(L(CH + 'Percussion Loops/Stickz CHT - Percussion Loop 12 - 110BPM.wav'), 110 / 120)
percloop = np.pad(percloop, ((0, max(0, 2 * BAR - len(percloop))), (0, 0)))[:2 * BAR]
b808 = L(CH + '808s/Stickz CHT - 808 01 - C.wav')          # C1 = 32.7 Hz
riser = L(RI + 'Rise Risers/Stickz - Rise Riser 002 - 120BPM C.wav', trim=False)[int(10.0 * SR):int(13.5 * SR)]
impact = L(RI + 'Rise Low Impacts/Stickz - Rise Low Impact 001.wav')
pad = L(RI + 'Rise Atmosphere/Stickz - Rise Atmosphere 001 - C.wav', trim=False)[:TOTAL]

# chord root (semitones above C) of each guitar loop bar, from chroma analysis
ROOT = {1: 0, 2: 5, 3: 0, 4: 7, 5: 0, 6: 5, 7: 0, 8: 7}
# which loop bar plays in each song bar (3..14); bar 14 resolves to C
SEQ = {3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 8: 6, 9: 7, 10: 8, 11: 1, 12: 2, 13: 4, 14: 1}
bar_t = lambda n: (n - 1) * 2.0

# ---- stems ---------------------------------------------------------------
drums, bass, harm, fx = new(), new(), new(), new()

# harmonic: guitar
for n, k in SEQ.items():
    put(harm, gbar(k), bar_t(n), 0.9, fade_out=0.01 if n == 14 else None)
    if n == 14: harm[int(27.5*SR):int(28*SR)] *= np.linspace(1, 0, int(0.5*SR))[:, None]  # bar 14 fades into the final chord
# final chord: first strum of C (loop bar 1) with a long reverb tail, 28 -> 30 s
strum = gbar(1)[:int(0.35 * SR)].copy(); strum[-int(0.05*SR):] *= np.linspace(1, 0, int(0.05*SR))[:, None]
tail = np.zeros((TOTAL, 2)); put(tail, strum, 28.0, 1.0)
rv = reverb(tail[int(27.9*SR):int(30*SR)+SR], 2.6)
put(harm, strum, 28.0, 0.9); put(harm, rv[:int(2.1*SR)+0], 27.9, 0.8)
# tension (bars 1-2): the same guitar, low-passed, rising; breath at 3.5-4.0
ten = lp(np.concatenate([gbar(1), gbar(2)]), 650)
put(harm, ten, 0.0, 0.8)
# pad: soft under the whole piece, filtered in the tension part, full from the drop
padg = pad.copy()
padg[:int(4 * SR)] = lp(padg[:int(4 * SR)], 900)
padb = new(); put(padb, padg, 0.0, 2.0)
padb = env(padb, [(0, 0), (15.5, 0), (16.5, 12), (22, 12), (23, 0), (30, 0)])
harm = env(harm, [(0, -200), (0.001, -14), (3.4, -4), (3.5, -80), (3.99, -80), (4.0, 0),
                  (16, 0), (16.5, 3), (22, 3), (22.5, 0), (27.5, 0), (30, 0)])
harm = harm + env(padb, [(0, 0), (3.4, 0), (3.5, -80), (3.99, -80), (4.0, 0), (30, 0)])
# pad level: keep lower than guitar after drop (pad is quiet already; add a lift in the owner section)
# fade the whole thing for the natural end
harm = env(harm, [(0, 0), (28.2, 0), (30, -35)])

# bass: 808 on beat 1 (long) and the "and of 3"; root follows the chord
def note(root, semi_oct=12):
    return speed(b808, 2 ** ((root + semi_oct) / 12))
for n in range(3, 15):
    r = ROOT[SEQ[n]]; nt = note(r); t0 = bar_t(n)
    seg = nt[:int(1.45 * SR)]; put(bass, seg, t0, 0.9, fade_out=0.08)
    if n >= 4:
        seg2 = nt[:int(0.9 * SR)]; put(bass, seg2, t0 + 1.75 * 1.0 + 0.0, 0.55, fade_out=0.08)  # beat 3.5 -> t0+1.75
    if n >= 9 and n <= 11:
        put(bass, nt[:int(0.4 * SR)], t0 + 1.25, 0.45, fade_out=0.05)
# final low C that rings out with the chord
put(bass, note(0)[:int(2.2 * SR)], 28.0, 0.8, fade_out=1.2)
bass = env(bass, [(0, 0), (28.0, 0), (30, -30)])

# drums
def pat(n):
    t0 = bar_t(n)
    for b in range(4):
        put(drums, kick, t0 + b * 0.5, 0.85)
    for b in (1, 3):
        put(drums, clap, t0 + b * 0.5, 0.5); put(drums, snare, t0 + b * 0.5, 0.22)
    for h in range(4):
        put(drums, hat, t0 + h * 0.5 + 0.25, 0.28, pan=0.15)
        put(drums, hat, t0 + h * 0.5, 0.12, pan=-0.15)
    put(drums, ohat, t0 + 1.75, 0.3, fade_out=0.1)
for n in range(3, 15): pat(n)
# fill at the end of bar 4 -> variation from bar 5 (extra kick, ghost perc)
for i, t in enumerate((1.5, 1.625, 1.75, 1.875)): put(drums, snare, bar_t(4) + t, 0.2 + 0.07 * i)
for n in range(5, 15):
    put(drums, kick, bar_t(n) + 1.25, 0.5)
    put(drums, perc, bar_t(n) + 0.875, 0.3)
# lift (bars 9-11): percussion loop
for n in (9, 10, 11): put(drums, percloop[:BAR], bar_t(n), 1.8)
# swaps (bars 12-13): clear accent on every beat
for n in (12, 13):
    for b in range(4):
        put(drums, perc, bar_t(n) + b * 0.5, 0.75)
        put(drums, hat, bar_t(n) + b * 0.5, 0.35)
# fill into the resolve (last beat of bar 14), then drums stop at 28 s
for i, t in enumerate((1.5, 1.625, 1.75, 1.875)): put(drums, snare, bar_t(14) + t, 0.2 + 0.06 * i)
drums[int(28 * SR):] = 0
drums = env(drums, [(0, -200), (3.99, -200), (4.0, 0), (30, 0)])
bass = env(bass, [(0, -200), (3.99, -200), (4.0, 0), (30, 0)])

# fx: riser to 3.5 s, near silence 3.5-4.0, impact on the drop, soft hit on the final chord
fx_r = hp(riser, 200)
put(fx, fx_r, 0.0, 1.0, fade_out=0.06)
fx = env(fx, [(0, -16), (2.0, -9), (3.4, 0), (3.5, -80), (30, -80)])
imp = new(); put(imp, impact, 4.0, 0.9, fade_out=2.0)
fx += env(imp, [(0, -200), (3.99, -200), (4.0, 0), (30, 0)])
imp2 = new(); put(imp2, impact, 28.0, 0.6, fade_out=1.5); fx += imp2
fx = env(fx, [(0, 0), (28.2, 0), (30, -30)])

stems = {'drums': drums, 'bass': bass, 'harmonic': harm, 'fx': fx}
mix = sum(stems.values())
# 'near silence' at 3.5-4.0: nothing but a very quiet pad tail
peak = np.abs(mix).max()
g = db(-3.5) / peak
os.makedirs(HERE + '/music_stems', exist_ok=True)
for k, v in stems.items():
    v = v * g
    v[0:1] *= 1.0
    sf.write(f'{HERE}/music_stems/{k}.wav', v, SR, subtype='PCM_24')
mix = mix * g
fo = int(0.01 * SR); mix[:fo] *= np.linspace(0, 1, fo)[:, None]; mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
sf.write(f'{HERE}/music_bed.wav', mix, SR, subtype='PCM_24')
with open(HERE + '/SOURCES.md', 'w') as f:
    f.write('# Music bed sources (Stickz packs, ~/Music/Samples, royalty-free; used layered as one composition)\n\n')
    for u in used: f.write(f'- `{u}`\n')
    f.write('\nKey: C major. Tempo: 120 BPM. Build: `./build_music.sh`.\n')
print(f'{HERE}/music_bed.wav {len(mix)/SR:.3f}s')
