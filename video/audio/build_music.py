#!/usr/bin/env python3
"""Horno Lento sonic identity: original music written as notes, synthesised (no samples). 120 BPM, 30 s, 15 bars.
Story: bars 1-2 clashing WhatsApp-like pings -> 3.5 s reverse swell -> breath -> 4.0 s the clash resolves into the motif in C."""
import os, json
import numpy as np, soundfile as sf
from synthlib import *
from synthlib import _t, _st
import synthlib as S
from build_sfx import shimmer, CHORD

HERE = os.path.dirname(os.path.abspath(__file__)); N = SR * 30
bt = lambda bar, beat=0.0: (bar - 1) * 2.0 + beat * 0.5
def new(): return np.zeros((N, 2))
def put(buf, x, t, g=1.0, pan=0.0):
    i = int(round(t * SR))
    if i < 0 or i >= N: return
    x = x[:N - i] * g
    if pan: x = x * np.array([1 - max(pan, 0), 1 + min(pan, 0)])
    buf[i:i + len(x)] += x
def env(buf, pts):
    t = np.arange(N) / SR; return buf * db(np.interp(t, [p[0] for p in pts], [p[1] for p in pts]))[:, None]

# chord per bar (key C major): I-IV-vi-V loop, the last bar lands on I
BAR_CHORD = {3: 'C', 4: 'F', 5: 'Am', 6: 'G', 7: 'C', 8: 'F', 9: 'Am', 10: 'G', 11: 'C', 12: 'F', 13: 'G', 14: 'C'}
VOICE = {'C': [64, 67, 71, 74], 'F': [65, 69, 72, 76], 'Am': [64, 67, 69, 72], 'G': [62, 65, 67, 71]}   # Cmaj9 Fmaj7 Am7 G7
BASS = {'C': 36, 'F': 41, 'Am': 45, 'G': 43}
CLASH = [66, 72, 71, 73, 78, 65, 70, 77, 67, 75]   # F#, C, B, C#, F#, F, Bb ... tritones and semitone clusters

def ping_times():
    """Ping times: the ping-NN cues of the picture (../out/cues.json) if present, else a built-in accelerating schedule."""
    p = os.path.join(HERE, '..', 'out', 'cues.json')
    if os.path.exists(p):
        c = sorted(x['seconds'] for x in json.load(open(p)) if x['name'].startswith('ping-') and x['seconds'] < 3.45)
        if c: return c
    t, i, out = 0.12, 0, []
    while t < 3.38: out.append(t); t += max(0.05, 0.62 * 0.83 ** i); i += 1
    return out

def build(kT=1.0, kL=1.0):
    drums, bass, harm, mot, fx = new(), new(), new(), new(), new()
    rng = np.random.default_rng(21)
    # ---------- bars 1-2: the chaos ----------
    ping_t = ping_times()
    for i, t in enumerate(ping_t):
        prog = min(1.0, t / 3.4)
        for s in range(1 + (i >= 5) + (i >= 8)):
            m = CLASH[(i * 3 + s * 4) % len(CLASH)]
            put(fx, ping(mtof(m), 0.35 + 0.65 * prog, rng.uniform(-28, 28), rng.uniform(-.7, .7)), t + s * 0.011, 1.0)
    drone = new(); tt = _t(N)[:int(3.5 * SR)]
    d = (np.sin(TAU * 65.41 * tt) + .8 * np.sin(TAU * 92.5 * tt) + .5 * np.sin(TAU * 98.0 * tt)) * np.minimum(tt / 1.5, 1) * 0.12
    drone[:len(tt)] += _st(d)
    nz = lp(np.random.default_rng(2).standard_normal(len(tt)), 2500)
    drone[:len(tt)] += _st(nz * (tt / 3.5) ** 2.5 * 0.35)
    fx += drone
    for k in range(6):  # pulse under bar 2: the pin thumping faster
        put(fx, thump(0.4 + .1 * k), 2.0 + k * 0.25 if k < 4 else 3.0 + (k - 4) * 0.25, 1.0)
    # reverse swell that sucks everything in, ending at 3.5 s
    src = new()[:int(2.0 * SR)]
    for m in (60, 66, 71, 73, 78, 84):
        e = ep(mtof(m), 0.2, 0.9) * 1.2; src[:len(e)] += e
    src += reverb(src, 1.9, 4) * 1.8
    sw = src[::-1]; put(fx, sw * 0.22, 3.5 - len(sw) / SR, 1.0)
    fx = env(fx, [(0, 0), (3.40, 0), (3.5, -90), (3.999, -90), (4.0, 0), (30, 0)])
    # remember: swell was part of the gated block above; keep it audible by gating at 3.5 only
    fx_t = fx.copy(); fx_t[int(3.5 * SR):] = 0; fx_t *= kT; fx = fx_t
    # ---------- the drop (4.0 s) ----------
    put(fx, thump(1.2), 4.0, 1.0)
    t4 = _t(int(1.2 * SR)); boom = np.sin(TAU * np.cumsum(38 + 40 * np.exp(-t4 * 6)) / SR) * np.exp(-t4 * 3.2) * 0.55
    put(fx, _st(boom), 4.0, 1.0)
    put(fx, shimmer(72), 4.0, 0.7)
    # ---------- harmony: electric piano comping + soft pad ----------
    for bar, ch in BAR_CHORD.items():
        v = VOICE[ch]
        for beat, dur, vel in ((0, 1.4, 1.0), (1.5, 0.9, 0.7), (2.5, 1.2, 0.8)):
            if bar == 14 and beat >= 1.5 and False: continue
            if bar == 14 and beat > 2: continue
            for k, m in enumerate(v):
                put(harm, ep(mtof(m), dur * 0.5, vel * (1 - 0.05 * k)), bt(bar, beat) + k * 0.006, 1.0)
        put(harm, pad([mtof(m - 12) for m in v], 2.0), bt(bar), 1.0)
    # final chord rings from 28 s (bar 15)
    for k, m in enumerate(VOICE['C']): put(harm, ep(mtof(m), 1.5, 0.9), 28.0 + k * 0.006, 1.0)
    put(harm, pad([mtof(m - 12) for m in VOICE['C']], 2.0), 28.0, 1.2)
    # lift (bars 9-11): marimba arpeggio in 8ths + high bells
    for bar in (9, 10, 11):
        v = VOICE[BAR_CHORD[bar]]; arp = [v[0] + 12, v[1] + 12, v[2] + 12, v[3] + 12, v[2] + 12, v[1] + 12, v[0] + 12, v[1] + 12]
        for j, m in enumerate(arp): put(harm, marimba(mtof(m), 0.7, 0.6), bt(bar, j * 0.5), kL * 0.9, (-.4 if j % 2 else .4))
    harm = reverb_mix(harm, 0.22)
    # ---------- bass ----------
    for bar, ch in BAR_CHORD.items():
        r = BASS[ch]
        put(bass, S.bass(mtof(r), 0.62, 1.0), bt(bar, 0), 1.0)
        put(bass, S.bass(mtof(r), 0.25, 0.7), bt(bar, 1.5), 1.0)
        put(bass, S.bass(mtof(r + 7), 0.5, 0.75), bt(bar, 2.5), 1.0)
        if bar in (5, 6, 7, 8, 9, 10, 11, 12, 13): put(bass, S.bass(mtof(r + 12), 0.2, 0.5), bt(bar, 3.5), 1.0)
    put(bass, S.bass(mtof(36), 1.4, 0.9), 28.0, 1.0)
    # ---------- kitchen percussion ----------
    for bar in range(3, 15):
        for b in (0, 1.5, 2.5): put(drums, thump(0.9 if b == 0 else 0.6), bt(bar, b), 1.0)
        for b in (1, 3): put(drums, clink(2350 if b == 1 else 2750, 0.8), bt(bar, b), 1.0, 0.2); put(drums, board(0.55), bt(bar, b), 1.0)
        for s in range(8):  # whisk on 8ths, accent on the off-beat
            put(drums, whisk(0.9 if s % 2 else 0.5, (-.3 if s % 2 else .3), s + bar), bt(bar, s * 0.5 + 0.0 if False else s * 0.5), 1.0)
        for s in range(8):  # ghost 16ths in between
            put(drums, whisk(0.25, 0.0, s + 3 * bar), bt(bar, s * 0.5 + 0.25), 1.0)
    for bar in range(5, 15): put(drums, clink(3300, 0.4), bt(bar, 3.75), 1.0, -.3)
    for j, b in enumerate((3.0, 3.25, 3.5, 3.75)): put(drums, board(0.35 + .12 * j), bt(4, b), 1.0)   # fill into bar 5
    for bar in (9, 10, 11):  # lift: dense whisk
        for s in range(16): put(drums, whisk(0.5, (-.4 if s % 2 else .4), s + bar), bt(bar, s * 0.25 + 0.125), kL * 1.0)
    for bar in (12, 13):    # swaps: an accent on every beat
        for b in range(4):
            put(drums, clink(3000 + 400 * b, 0.9), bt(bar, b), 1.0, 0.0)
            put(mot, marimba(mtof(VOICE[BAR_CHORD[bar]][3] + 12 - (b % 2) * 5), 0.8, 0.5), bt(bar, b), 1.0)
    for j, b in enumerate((3.0, 3.25, 3.5, 3.75)): put(drums, board(0.35 + .12 * j), bt(14, b), 1.0)
    drums[int(28 * SR):] = 0
    # ---------- the motif ----------
    motif(4.0, mot, 1.25, ding=False)                        # the drop: clearly
    motif(bt(7), mot, 0.45, ding=False, ep_layer=False)      # hints in the groove
    motif(bt(11), mot, 0.55, ding=False, ep_layer=False)
    motif(28.0, mot, 1.1, ding=True)                         # end card: motif + oven-timer ding on C6 (29.0 s)
    mot = reverb_mix(mot, 0.3)
    bass = bass * 1.7
    stems = {'drums': drums, 'bass': bass, 'harmonic': harm, 'motif': mot, 'fx': fx}
    # nothing between 3.5 and 4.0 s, natural fade at the very end
    for k in stems:
        stems[k] = stems[k].copy(); stems[k][int(3.5 * SR):int(4.0 * SR) - 1] = 0
        stems[k] = env(stems[k], [(0, 0), (29.2, 0), (30, -45)])
    return stems

def reverb_mix(x, wet):
    return x + wet * reverb(x, 1.8, 3)

def bar_rms(x):
    m = x.mean(1); return [20 * np.log10(np.sqrt((m[i * 2 * SR:(i + 1) * 2 * SR] ** 2).mean()) + 1e-9) for i in range(15)]

if __name__ == '__main__':
    kT, kL = 1.0, 1.0
    for it in range(6):
        st = build(kT, kL); mix = sum(st.values()); g = db(-3.5) / np.abs(mix).max()
        r = bar_rms(mix * g); t_err = -26 - (r[0] + r[1]) / 2; base = np.mean(r[4:8]); l_err = 3.2 - (np.mean(r[8:11]) - base)
        print(f'iter {it}: bars1-2 {r[0]:.1f},{r[1]:.1f}  lift {np.mean(r[8:11]) - base:+.1f} dB', flush=True)
        if abs(t_err) < 1.0 and abs(l_err) < 0.5 and it > 0: break
        kT *= db(t_err); kL *= db(l_err * 1.6)
    os.makedirs(HERE + '/music_stems', exist_ok=True)
    for f in os.listdir(HERE + '/music_stems'): os.remove(HERE + '/music_stems/' + f)
    for k, v in st.items(): sf.write(f'{HERE}/music_stems/{k}.wav', v * g, SR, subtype='PCM_24')
    mix = mix * g; sf.write(f'{HERE}/music_bed.wav', mix, SR, subtype='PCM_24')
    print('rms/bar', [round(float(x), 1) for x in bar_rms(mix)])
    print(f'{HERE}/music_bed.wav {len(mix)/SR:.3f}s')
