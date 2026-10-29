#!/usr/bin/env python3
"""Place SFX from ../out/cues.json on the music bed, duck the music, master to -14 LUFS / -1 dBTP -> mix.wav.
Rebuild the pings first (build_music.py reads the ping-NN cues), then run this. Never hand-place sounds."""
import os, json, re, subprocess, sys
import numpy as np, soundfile as sf
from synthlib import *
from synthlib import _st
import synthlib as S

HERE = os.path.dirname(os.path.abspath(__file__)); N = SR * 30
CUES = HERE + '/../out/cues.json'
BAR_CHORD = {3: 'C', 4: 'F', 5: 'Am', 6: 'G', 7: 'C', 8: 'F', 9: 'Am', 10: 'G', 11: 'C', 12: 'F', 13: 'G', 14: 'C', 15: 'C'}
chord_at = lambda t: BAR_CHORD.get(int(t // 2) + 1, 'C')
def sfx(name): return sf.read(f'{HERE}/sfx/{name}.wav')[0]
def whoosh(dur, gain=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; nz = np.random.default_rng(9).standard_normal(n); out = np.zeros(n)
    for k, (lo, hi) in enumerate(((250, 800), (800, 2400), (2400, 6500))):
        c = (k + 0.5) / 3; w = np.exp(-((t / dur - (0.25 + 0.5 * c)) ** 2) / 0.035); out += bp(nz, lo, hi) * w
    out *= np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return _st(out / np.abs(out).max() * 0.5 * gain)
def rising_notes(t0, dur, root_midi=72):
    pent = [0, 2, 4, 7, 9, 12, 14, 16]; buf = np.zeros((int((dur + 1.2) * SR), 2))
    for j, iv in enumerate(pent):
        m = S.marimba(mtof(root_midi + iv), 0.45 + 0.07 * j, 0.7); i = int(j * dur / len(pent) * SR); buf[i:i + len(m)] += m[:len(buf) - i]
    return buf
PAN = {'tap-branch': -0.2, 'tap-day': 0.0, 'tap-time': 0.2}
# name -> (kind of treatment, gain dB, duck dB or 0)
def plan(c):
    n, k, t = c['name'], c['kind'], c['seconds']; ch = chord_at(t); d = c.get('durationSeconds', 0)
    if re.match(r'ping-\d+$', n): return None, 'in music bed (pings follow the ping cues)'
    if (k == 'cut') or (k == 'hit' and not n.startswith('hit-')): return None, 'in music bed'
    if n == 'hit-skin0': return (f'swap_{ch}', -10, 0, 0.0), None
    if n.startswith('hit-'): return None, 'covered by the swap hit at the same frame'
    if n in ('riser-hook', 'suck-whoosh'): return None, 'in music bed (riser / reverse swell)'
    if n in ('lockup', 'final-hit', 'drop'): return None, 'in music bed (motif + ding)'
    if k == 'tap': return (f'tap_{ch}', -8, 4, PAN.get(n, 0.0)), None
    if k == 'pop' and n == 'order-lands': return (f'pop_{ch}', -11, 4, 0.0), None
    if k == 'pop': return (f'pop_{ch}', -8, 4, 0.0), None
    if k == 'chime' and n == 'order-notification': return (f'order_bell_{ch}', -8, 6, 0.0), None
    if k == 'chime': return (f'payment_ding_{ch}', -9 if n != 'paid-chime' else -8, 6, 0.0), None
    if k == 'ping' and n.startswith('revenue'): return ('receipt_chatter', -13, 0, 0.0, d), None
    if k == 'riser' and n.startswith('bars'): return ('RISE', -9, 0, 0.0, d), None
    if k == 'whoosh' and n == 'card-fly': return ('bag_swish', -10, 0, 0.0), None
    if k == 'whoosh': return ('WHOOSH', -14, 0, 0.0, d), None
    if k == 'swap' and n in ('swap-teal', 'swap-plum', 'swap-navy', 'swap-base'): return (f'swap_{ch}', -10, 0, 0.0), None
    if k == 'swap': return (f'swap_{ch}', -17, 0, 0.0), None
    if k == 'title' and n in ('title2a-in', 'title3a-in', 'title4-in', 'title6-in'): return (f'shimmer_{ch}', -17, 0, 0.0), None
    if k == 'title': return None, 'skipped (shimmer only on 4 titles)'
    return None, 'UNMAPPED'

def main():
    cues = json.load(open(CUES)); bed, _ = sf.read(HERE + '/music_bed.wav'); bus = np.zeros((N, 2)); duck = np.zeros(N)
    rows = []
    for c in cues:
        p, why = plan(c); t = c['seconds']
        if p is None: rows.append((c['name'], c['kind'], t, why)); continue
        name, g, dk, pan = p[:4]; dur = p[4] if len(p) > 4 else 0
        if name == 'RISE': x = rising_notes(t, dur)
        elif name == 'WHOOSH': x = whoosh(max(dur, 0.4))
        else: x = sfx(name)
        if name == 'receipt_chatter' and dur: x = x[:int(dur * SR)].copy(); k = int(.12 * SR); x[-k:] *= np.linspace(1, 0, k)[:, None]
        x = x * db(g)
        if pan: x = x * np.array([1 - max(pan, 0), 1 + min(pan, 0)])
        i = int(round(t * SR)); x = x[:N - i]; bus[i:i + len(x)] += x
        if dk: duck[i:min(N, i + int(0.15 * SR))] = np.maximum(duck[i:min(N, i + int(0.15 * SR))], dk)
        rows.append((c['name'], c['kind'], t, f'{name} @ {g} dB' + (f', duck {dk} dB' if dk else '')))
    # smooth the duck curve (10 ms attack, 150 ms release)
    from scipy.signal import lfilter
    a = np.exp(-1 / (0.01 * SR)); b = np.exp(-1 / (0.08 * SR)); out = np.zeros(N); cur = 0.0
    for i in range(N):
        d = duck[i]; cur = d + (cur - d) * (a if d > cur else b); out[i] = cur
    mixed = bed * db(-out)[:, None] + bus
    mixed = np.pad(mixed, ((0, 0), (0, 0)))
    # master: limiter -> loudnorm two-pass (-14 LUFS, -1 dBTP)
    tmp = HERE + '/_pre.wav'; sf.write(tmp, mixed, SR, subtype='PCM_24')
    ff = ['ffmpeg', '-hide_banner', '-y', '-nostats']
    pre = 'volume=9dB,alimiter=limit=0.89:attack=3:release=60:level=disabled'
    r = subprocess.run(ff + ['-i', tmp, '-af', pre + ',loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(ff + ['-i', tmp, '-af', pre + ',' + ln + ',aresample=48000,apad=whole_dur=30,atrim=end_sample=1440000', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s24le', HERE + '/mix.wav'], capture_output=True, check=True)
    os.remove(tmp)
    for r_ in rows: print(f'{r_[0]:20s} {r_[1]:7s} {r_[2]:7.3f}s  {r_[3]}')
    print('UNMAPPED:', [r_[0] for r_ in rows if r_[3] == 'UNMAPPED'] or 'none')
main()
