#!/usr/bin/env python3
"""Synthesise the Horno Lento SFX palette into sfx/*.wav (48 kHz, trimmed, -6 dBFS peak) and palette.wav (20 s)."""
import os, json
import numpy as np, soundfile as sf
from synthlib import *
from synthlib import _t, _st

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = HERE + '/sfx'; os.makedirs(OUT, exist_ok=True)
# chord of each bar (see build_music.py) and the pitch (midi, octave chosen per SFX) each SFX is tuned to
CHORD = {'C': 72, 'F': 65, 'Am': 69, 'G': 67}   # root pitch class as midi near C5..: C5, F4, A4, G4
BAR_CHORD = {3: 'C', 4: 'F', 5: 'Am', 6: 'G', 7: 'C', 8: 'F', 9: 'Am', 10: 'G', 11: 'C', 12: 'F', 13: 'G', 14: 'C', 15: 'C'}
rng = np.random.default_rng(5)

def tap(root): return clink(mtof(root + 24), 1.0)
def bag():  # paper bakery bag: fold crackle + swish
    n = int(0.6 * SR); t = _t(n); nz = rng.standard_normal(n)
    sw = bp(nz, 1200, 6500) * (np.sin(np.pi * np.clip(t / 0.45, 0, 1)) ** 2) * 0.5
    cr = np.zeros(n)
    for k in np.sort(rng.uniform(0.02, 0.45, 28)):
        i = int(k * SR); m = rng.integers(40, 160); cr[i:i + m] += rng.standard_normal(min(m, n - i)) * np.exp(-np.arange(min(m, n - i)) / 30) * rng.uniform(.2, 1)
    cr = hp(cr, 1500) * 0.9
    return _st(sw + cr)
def pop(root):  # cork / bubble: fast upward chirp ending on the chord root
    n = int(0.25 * SR); t = _t(n); f = mtof(root + 12) * (0.55 + 0.45 * (1 - np.exp(-t * 90)))
    y = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t / 0.05) + .2 * np.sin(TAU * 2 * np.cumsum(f) / SR) * np.exp(-t / .02)
    return _st(y * np.minimum(t / .001, 1))
def ding(root): return bell(mtof(root + 12), 0.55)      # oven timer, root of the bar's chord
def door_bell(root):  # shop door bell: spring of small bells shaken, plus a tuned note
    out = np.zeros((int(1.4 * SR), 2))
    for i in range(7):
        t0 = int((i * 0.035 + rng.uniform(0, .01)) * SR); f = mtof(root + 36) * rng.choice([1, 1.5, 2.0, 2.98]) * (1 + rng.normal(0, .004))
        s = modal(f, [1, 2.76, 5.4], [1, .4, .15], [.45, .2, .08], .9)
        s = _st(s * 0.2 * (1 - i * 0.07), rng.uniform(-.5, .5)); out[t0:t0 + len(s)] += s[:len(out) - t0]
    out[:len(bell(1))] += 0
    b = bell(mtof(root + 24), 0.5, 0.6); out[int(.05 * SR):int(.05 * SR) + len(b)] += b[:len(out) - int(.05 * SR)]
    return out
def receipt(root):  # thermal printer chatter: bursts of clicks with a motor whine on the chord root
    n = int(1.5 * SR); y = np.zeros(n); t = _t(n)
    for g0, g1 in ((0.0, 0.4), (0.5, 0.95), (1.05, 1.35)):
        k = g0
        while k < g1:
            i = int(k * SR); m = int(0.006 * SR); y[i:i + m] += rng.standard_normal(m) * np.exp(-np.arange(m) / (0.0012 * SR)); k += 1 / 38
    y = bp(y, 1800, 5200) * 1.2
    gate = ((t < .4) | ((t > .5) & (t < .95)) | ((t > 1.05) & (t < 1.35))).astype(float)
    whine = np.sin(TAU * mtof(root + 24) * t + 3 * np.sin(TAU * 38 * t)) * 0.05 * gate * np.minimum(t / 0.05, 1)
    return _st(y + whine)
def shimmer(root):  # sugar sprinkle: tiny high ticks that thin out, over a soft tuned arpeggio
    n = int(1.4 * SR); y = np.zeros(n); t = _t(n)
    for k in np.sort(rng.exponential(0.3, 160)):
        if k > 1.1: continue
        i = int(k * SR); f = rng.uniform(5000, 11000); m = int(.012 * SR)
        y[i:i + m] += np.sin(TAU * f * _t(m)) * np.exp(-_t(m) / .003) * rng.uniform(.1, .5) * (1 - k / 1.3)
    st = _st(y); st[:, 0] *= 1; st[:, 1] = np.roll(st[:, 1], 40)
    for j, iv in enumerate((0, 4, 7, 11, 16)):
        s = modal(mtof(root + 36 + iv), [1, 2.0], [1, .2], [.4, .2], 1.0) * 0.12
        i = int((.05 + j * .09) * SR); s = _st(s); st[i:i + len(s)] += s[:n - i]
    return st
def swap(root):  # soft pan / lid hit tuned to the chord root
    y = modal(mtof(root + 12), [1, 1.59, 2.14, 2.65, 3.6], [1, .6, .4, .3, .15], [.28, .2, .14, .1, .06], 0.8)
    t = _t(len(y)); y += lp(rng.standard_normal(len(y)), 2500) * np.exp(-t / .006) * .4
    return _st(y)
def final_sfx():
    buf = np.zeros((int(4 * SR), 2)); motif(0.0, buf, 1.0, ding=True); r = reverb(buf, 1.6, 2); return buf + 0.3 * r

def prep(x):
    m = np.abs(x).max(1); i0 = int(np.argmax(m > db(-50) * m.max())); i1 = len(m) - int(np.argmax(m[::-1] > db(-55) * m.max()))
    x = x[i0:i1].copy(); k = int(.01 * SR); x[-k:] *= np.linspace(1, 0, k)[:, None]
    return x * db(-6) / np.abs(x).max()

SFX = {  # name: (function, bar, chord)  tuned to BAR_CHORD
    'tap': (tap, 5), 'bag_swish': (lambda r: bag(), 6), 'pop': (pop, 6), 'payment_ding': (ding, 8),
    'order_bell': (door_bell, 9), 'receipt_chatter': (receipt, 10), 'shimmer': (shimmer, 3), 'swap': (swap, 12),
}
if __name__ == '__main__':
    index = {}; made = {}
    for name, (fn, bar) in SFX.items():
        ch = BAR_CHORD[bar]; x = prep(fn(CHORD[ch])); sf.write(f'{OUT}/{name}.wav', x, SR, subtype='PCM_24'); made[name] = x
        index[name] = {'bar': bar, 'chord': ch, 'dur': round(len(x) / SR, 3)}
        if name in ('tap', 'pop', 'payment_ding', 'order_bell', 'shimmer', 'swap'):  # variants for every chord
            for c, r in CHORD.items():
                sf.write(f'{OUT}/{name}_{c}.wav', prep(fn(r)), SR, subtype='PCM_24')
    fx = prep(final_sfx()); sf.write(f'{OUT}/final_motif_ding.wav', fx, SR, subtype='PCM_24'); index['final_motif_ding'] = {'bar': 14, 'chord': 'C', 'dur': round(len(fx) / SR, 3)}
    json.dump({'chords_per_bar': BAR_CHORD, 'sfx': index}, open(f'{OUT}/_index.json', 'w'), indent=1)
    pal = np.zeros((20 * SR, 2)); t = int(0.2 * SR)
    for name in SFX:
        x = made[name]; pal[t:t + len(x)] += x; t += len(x) + int(.3 * SR)
    t += int(.5 * SR); buf = np.zeros((6 * SR, 2)); motif(0.0, buf, 1.0, ding=True); buf = buf + 0.3 * reverb(buf, 1.6, 2)
    buf = buf[:int(4 * SR)]; buf *= db(-6) / np.abs(buf).max(); n = min(len(buf), len(pal) - t); pal[t:t + n] += buf[:n]
    pal *= 1.0; sf.write(f'{HERE}/palette.wav', pal, SR, subtype='PCM_24'); print(f'sfx: {len(SFX)+1} files, palette used {t/SR+n/SR:.1f}s of 20 s')
