import {noise2D} from '@remotion/noise';
import {Pose} from './lib/Phone';
import {HEAVY, SOFT, BOUNCY, track, spr, easeInOut, ramp} from './lib/anim';
import {T} from './timeline';

// One continuous phone for scenes 3-7: this file is its whole choreography.
const BASE_S = 1.5;
const BASE_Y = 270; // phone top lands at y = 579

export const phonePose = (f: number): Pose => {
  const rise = {damping: 15, stiffness: 85, mass: 1.15};
  let y = track(f, [[0, 1250], [T.phoneRise, BASE_Y, rise], [780, -240, HEAVY]]);
  let rx = track(f, [[0, 38], [T.phoneRise, 5, rise], [240, 0, SOFT], [780, 8, HEAVY]]);
  let ry = track(f, [[0, -26], [T.phoneRise, -9, rise], [240, 0, SOFT], [780, -16, HEAVY]]);
  let s = track(f, [[0, BASE_S], [780, 0.74, HEAVY]]);
  let rz = 0;
  let z = 0;

  // drift: a living phone, never frozen
  if (f >= 150 && f < 780) {
    const k = Math.min(1, (f - 150) / 40);
    ry += noise2D('ry', f / 90, 0) * 3 * k;
    rx += noise2D('rx', f / 90, 1) * 1.5 * k;
    y += noise2D('y', f / 70, 2) * 8 * k;
  }

  // scene 5: spin to the owner side
  if (f >= T.spin && f < T.spin + 40) {
    const e = easeInOut(ramp(f, T.spin, T.spin + 30));
    ry += -360 * e;
    s *= 1 - 0.14 * Math.sin(Math.PI * e);
    y -= 40 * Math.sin(Math.PI * e);
    rz += 6 * Math.sin(Math.PI * e);
  }

  // scene 6: every swap kicks the phone
  const swaps = [T.skin0, T.swapTeal, T.swapPlum, T.swapNavy, T.swapBase];
  if (f >= 660 && f < 780) {
    swaps.forEach((sf, i) => {
      const p = spr(f, sf, BOUNCY);
      const dir = i % 2 ? 1 : -1;
      ry += dir * 16 * (1 - p);
      s += 0.05 * (1 - p);
      rz += dir * -2 * (1 - p);
    });
    ry += Math.sin((f - 660) / 18) * 4;
  }

  // scene 7: slow drift back
  if (f >= 780) {
    ry += Math.sin((f - 780) / 40) * 5;
    y += Math.sin((f - 780) / 33) * 10;
  }
  return {x: 0, y, z, rx, ry, rz, s};
};

export type Cam = {zoom: number; rot: number; tx: number; ty: number; oy: number};
export const camera = (f: number): Cam => {
  const zoom = track(f, [
    [0, 1.1],
    [T.drop, 1.1],
    [T.phoneRise + 4, 1.0, HEAVY],
    [240, 1.2, {damping: 20, stiffness: 50, mass: 1.4}],
    [T.toPickup, 1.2],
    [T.toPay, 1.26, SOFT],
    [T.toConfirm, 1.18, SOFT],
    [T.spin, 1.0, SOFT],
    [T.toSales, 1.14, HEAVY],
    [T.skin0, 1.0, SOFT],
    [780, 1.0, HEAVY],
  ]);
  const rot = track(f, [[0, 0], [240, -0.6, HEAVY], [T.toPickup, 0.5, HEAVY], [T.toPay, -0.4, HEAVY], [T.spin, 0, SOFT]]);
  const tx = track(f, [[0, 0], [T.cardLift, -14, HEAVY], [T.toPickup, 10, HEAVY], [T.toPay, 0, HEAVY]]) + noise2D('cx', f / 60, 0) * 3;
  const ty = noise2D('cy', f / 60, 1) * 3;
  return {zoom, rot: rot + noise2D('cr', f / 80, 2) * 0.12, tx, ty, oy: 600};
};
