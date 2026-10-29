import {spring, SpringConfig, interpolate} from 'remotion';
import {FPS} from '../timeline';

export const SOFT: Partial<SpringConfig> = {damping: 22, stiffness: 120, mass: 1};
export const SNAP: Partial<SpringConfig> = {damping: 20, stiffness: 220, mass: 0.8};
export const BOUNCY: Partial<SpringConfig> = {damping: 9, stiffness: 180, mass: 0.8};
export const HEAVY: Partial<SpringConfig> = {damping: 18, stiffness: 70, mass: 1.3};

export const spr = (frame: number, at: number, config: Partial<SpringConfig> = SOFT) =>
  spring({frame: frame - at, fps: FPS, config});

export type Key = [frame: number, value: number, config?: Partial<SpringConfig>];

/** Keyframed spring track. Each key starts a spring from wherever the value is at that frame. */
export const track = (f: number, keys: Key[], cfg: Partial<SpringConfig> = SOFT): number => {
  const valueAt = (i: number, t: number): number => {
    if (i === 0) return keys[0][1];
    const [kf, target, c] = keys[i];
    const from = valueAt(i - 1, kf);
    return from + (target - from) * spring({frame: t - kf, fps: FPS, config: c ?? cfg});
  };
  let idx = 0;
  for (let i = 1; i < keys.length; i++) if (f >= keys[i][0]) idx = i;
  return valueAt(idx, f);
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ramp = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInOut = (t: number) => {
  t = clamp01(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const hex = (c: string): number[] => {
  if (c.startsWith('rgb')) return (c.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
  const h = c.replace('#', '');
  const n = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
};
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp01(t)))).join(',')})`;
};
export const rgba = (c: string, a: number) => {
  const [r, g, b] = hex(c);
  return `rgba(${r},${g},${b},${a})`;
};
