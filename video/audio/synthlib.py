"""Small synth kit for the Horno Lento sonic identity. Everything is generated from math: no samples, no soundfont."""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
TAU = 2 * np.pi
def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def db(v): return 10 ** (v / 20)
def _t(n): return np.arange(n) / SR
def _st(m, pan=0.0):  # mono -> stereo (pan -1..1, equal-ish power)
    a = np.sqrt((1 - pan) / 2) * 1.414; b = np.sqrt((1 + pan) / 2) * 1.414
    return np.stack([m * a, m * b], 1)
def lp(x, fc, o=2): return sosfilt(butter(o, fc, 'low', fs=SR, output='sos'), x, axis=0)
def hp(x, fc, o=2): return sosfilt(butter(o, fc, 'high', fs=SR, output='sos'), x, axis=0)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x, axis=0)
def rel(y, t, dur, r):  # release after dur seconds
    return y * np.where(t < dur, 1.0, np.exp(-(t - dur) * r))

def modal(f, ratios, amps, decs, length, detune=0.0):
    t = _t(int(length * SR)); y = np.zeros(len(t))
    for r, a, d in zip(ratios, amps, decs):
        y += a * np.sin(TAU * f * r * (1 + detune) * t) * np.exp(-t / d)
    return y * np.minimum(t / 0.0015, 1)

# ---- pitched instruments -------------------------------------------------
def ep(f, dur, vel=1.0):
    """Warm electric piano (2-op FM, light chorus L/R)."""
    n = int((dur + 0.7) * SR); t = _t(n)
    amp = np.minimum(t / 0.004, 1) * np.exp(-t * (1.5 + f / 900))
    amp = rel(amp, t, dur, 12)
    I = (0.7 + 1.5 * vel) * np.exp(-t * 4.0) + 0.25
    def v(ff): return np.sin(TAU * ff * t + I * np.sin(TAU * ff * t))
    tine = 0.10 * vel * np.sin(TAU * f * 6 * t) * np.exp(-t * 45)
    L = (v(f * 1.0012) + tine) * amp; R = (v(f * 0.9988) + tine) * amp
    return np.stack([L, R], 1) * 0.22 * vel

def marimba(f, vel=1.0, ring=1.0, pan=0.0):
    y = modal(f, [1, 3.93, 9.2], [1, .32, .08], [.5 * ring, .13 * ring, .05], 1.6 * ring)
    n = len(y); y[:int(.002 * SR)] += 0.0
    return _st(y * 0.5 * vel, pan)

def bell(f, dec=0.55, vel=1.0):
    """Oven-timer ding: inharmonic metal partials plus a slightly detuned twin for shimmer."""
    r = [1, 2.76, 5.40, 8.93, 1.0035]
    y = modal(f, r, [1, .42, .2, .1, .5], [dec, dec * .5, dec * .25, dec * .12, dec * .9], dec * 5 + .3)
    return _st(y * 0.4 * vel)

def bass(f, dur, vel=1.0):
    n = int((dur + 0.25) * SR); t = _t(n)
    ph = TAU * f * (t + 0.012 * (1 - np.exp(-t * 40)) * 0)  # steady pitch
    y = np.sin(ph) + 0.30 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph)
    amp = np.minimum(t / 0.006, 1) * np.exp(-t * 2.2); amp = rel(amp, t, dur, 25)
    return _st(y * amp * 0.5 * vel)

def pad(freqs, dur):
    n = int((dur + 0.5) * SR); t = _t(n); y = np.zeros(n)
    for f in freqs:
        for dt, ph in ((0.997, 0), (1.003, 1.7)):
            y += np.sin(TAU * f * dt * t + ph) + 0.25 * np.sin(TAU * 2 * f * dt * t)
    env = np.minimum(t / 0.3, 1.0) * np.where(t < dur, 1, np.exp(-(t - dur) * 9))
    return _st(lp(y, 1800) * env * 0.035 / max(1, len(freqs) / 4))

def ping(f, vel=1.0, cents=0.0, pan=0.0):
    f = f * 2 ** (cents / 1200); t = _t(int(0.5 * SR))
    y = (np.sin(TAU * f * t) * np.exp(-t / .10) + .35 * np.sin(TAU * 2 * f * t) * np.exp(-t / .04)
         + .12 * np.sin(TAU * 3.01 * f * t) * np.exp(-t / .02)) * np.minimum(t / 0.0012, 1)
    return _st(y * 0.35 * vel, pan)

# ---- kitchen percussion ---------------------------------------------------
def thump(vel=1.0):
    """Rolling pin on a flour sack: pitch-dropping sine + soft low knock."""
    n = int(0.45 * SR); t = _t(n)
    ph = TAU * np.cumsum(46 + 85 * np.exp(-t * 38)) / SR
    y = np.sin(ph) * np.exp(-t * 11)
    knock = np.sin(TAU * 150 * t) * np.exp(-t * 90) * .5
    rng = np.random.default_rng(3); nz = lp(rng.standard_normal(n), 600) * np.exp(-t * 120) * 1.5
    return _st((y + knock + nz) * 0.8 * vel * np.minimum(t / 0.0015, 1))

def clink(f=2300, vel=1.0, pan=0.0):
    """Spoon on a ceramic cup."""
    y = modal(f, [1, 2.41, 4.12, 6.37], [1, .6, .35, .2], [.11, .07, .045, .03], 0.4)
    t = _t(len(y)); rng = np.random.default_rng(int(f)); y += hp(rng.standard_normal(len(y)), 3000) * np.exp(-t / .004) * .3
    return _st(y * 0.45 * vel, pan)

def board(vel=1.0):
    """Knife tap on a wooden board."""
    t = _t(int(0.12 * SR)); y = np.sin(TAU * 920 * t) * np.exp(-t / .012) + .5 * np.sin(TAU * 1480 * t) * np.exp(-t / .008)
    return _st(y * 0.5 * vel)

_rng = np.random.default_rng(11); _NZ = _rng.standard_normal(SR)
def whisk(vel=1.0, pan=0.0, k=0):
    """Whisk / shaker: short band noise with a quick swell."""
    n = int(0.085 * SR); t = _t(n); nz = np.roll(_NZ, k * 997)[:n]
    y = bp(nz, 4500, 11000) * np.minimum(t / 0.009, 1) * np.exp(-t / 0.028)
    return _st(y * 0.55 * vel, pan)

# ---- space -----------------------------------------------------------------
def reverb(x, secs=1.8, seed=1, damp=4500):
    r = np.random.default_rng(seed); n = int(secs * SR)
    ir = r.standard_normal((n, 2)) * np.exp(-np.arange(n) / (secs * SR / 5.5))[:, None]
    ir = lp(ir, damp, 2); k = int(.012 * SR); ir[:k] *= np.linspace(0, 1, k)[:, None]
    ir /= np.sqrt((ir ** 2).sum(0))
    return np.stack([fftconvolve(x[:, c], ir[:, c]) for c in range(2)], 1)[:len(x)]

# ---- the sonic logo ---------------------------------------------------------
# HOR-no LEN-to = long-short-long-short = dotted 8th + 16th, twice (1 s at 120 BPM)
# G4 C5 | E5 D5  then the oven-timer ding on C6 (the tonic).
MOTIF = [(0.0, 67, 0.75), (0.75, 72, 0.25), (1.0, 76, 0.75), (1.75, 74, 0.25)]  # (beat, midi, beats)
def motif(t0, buf, vel=1.0, ding=False, ep_layer=True, mar=True):
    """Add the motif to stereo buffer `buf` starting at t0 seconds."""
    def put(x, t, g=1.0):
        i = int(round(t * SR)); x = x[:len(buf) - i] * g
        if i < len(buf): buf[i:i + len(x)] += x
    for b, m, d in MOTIF:
        t = t0 + b * 0.5; f = mtof(m)
        if mar: put(marimba(f, 1.0, 1.0), t, vel * 1.0)
        if ep_layer: put(ep(f, d * 0.5 + 0.15, 0.8), t, vel * 0.8)
        put(modal(f * 2, [1], [1], [.25], .6)[:, None].repeat(2, 1) * 0.07, t, vel)  # glassy octave
    if ding: put(bell(mtof(84), 0.55, 1.0), t0 + 2 * 0.5 + 0.0, vel * 0.9)
