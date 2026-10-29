import {noise2D} from '@remotion/noise';
import {Pose} from './lib/Phone';
import {BOUNCY, HEAVY, SOFT, track, spr, ramp, lerp, Key} from './lib/anim';
import {T} from './timeline';

// One continuous phone for scenes 3-7: this file is its whole choreography.
const BASE_S = 1.5;
const BASE_Y = 270; // phone top lands at y = 579

export const openSpring = (f: number) => spr(f, T.appOpen, {damping: 14, stiffness: 150, mass: 0.8});
/** Camera at the first frame of the reveal (see camera()) and the phone pose that hides it behind the app icon. */
export const OPEN_ZOOM = 1.0;
export const OPEN_QY = 1270;
export const ICON_FRAME_CY = 1000;
export const ICON_FRAME_PX = 240;
const OPEN_Y = BASE_Y + (ICON_FRAME_CY - OPEN_QY) / OPEN_ZOOM;
const OPEN_S = 0.26; // the whole phone body is smaller than the icon (868 * 0.26 < 240)

export const phonePose = (f: number): Pose => {
  let y = track(f, [[0, BASE_Y], [780, 535, HEAVY]]);
  let rx = track(f, [[0, 5], [240, 0, SOFT], [780, 9, HEAVY]]);
  let ry = track(f, [[0, -9], [240, 0, SOFT], [780, -20, HEAVY]]);
  let s = track(f, [[0, BASE_S], [780, 1.1, HEAVY]]);
  let rz = 0;
  let z = 0;
  let x = 0;

  // app open: the phone grows out of the app icon (see Reveal), with a little overshoot
  if (f >= T.appOpen && f < T.appOpen + 40) {
    const o = openSpring(f);
    y = lerp(OPEN_Y, y, o);
    rx = lerp(0, rx, o);
    ry = lerp(0, ry, o);
    s = lerp(OPEN_S, s, o);
  }

  // drift: a living phone, never frozen
  if (f >= 130 && f < 250) {
    const k = Math.min(1, (f - 130) / 30) * (1 - Math.min(1, Math.max(0, (f - 225) / 25)));
    ry += 6 * Math.sin((f - 130) / 40) * k;
    rx += 2.5 * Math.sin((f - 130) / 55 + 1) * k;
  }
  if (f >= 150 && f < 780) {
    const k = Math.min(1, (f - 150) / 40);
    ry += noise2D('ry', f / 90, 0) * 1.6 * k;
    rx += noise2D('rx', f / 90, 1) * 0.8 * k;
    y += noise2D('y', f / 70, 2) * 8 * k;
  }

  // whip-pan: the customer phone shoots out left, the owner phone shoots in from the right
  if (f >= T.whipOut && f < T.spin) {
    const u = ramp(f, T.whipOut, T.spin);
    x = -1700 * u * u;
    rz -= 5 * u;
    ry += 14 * u;
  } else if (f >= T.spin && f < T.spin + 24) {
    const p = Math.min(1, spr(f, T.spin, {damping: 24, stiffness: 260, mass: 0.8}));
    x = 1300 * (1 - p);
    rz += 5 * (1 - p);
    ry -= 14 * (1 - p);
  }

  // scene 6: every swap kicks the phone
  const swaps = [T.skin0, T.swapTeal, T.swapPlum, T.swapNavy];
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
  if (f >= 780) x = 110 + Math.sin((f - 780) / 50) * 8;
  return {x, y, z, rx, ry, rz, s};
};

export type Cam = {zoom: number; rot: number; fx: number; fy: number; qy: number};

/** Where the interesting things are, in phone screen coordinates (CSS px, display origin top-left). */
export type Geo = {
  cardC: {x: number; y: number};
  branchC: number; dayC: number; timeC: number; payBtnC: number;
  payC: number; revC: number; newC: number; chartC: number;
  cardW: number;
};

const REST_Y = 270; // where the phone's centre rests (see BASE_Y)
/** Stage point of a phone screen coordinate while the phone is at rest. */
export const stagePt = (sx: number, sy: number, s = BASE_S) => ({x: 540 + s * (sx - 195), y: 960 + REST_Y + s * (sy - 422)});

const CAM = {damping: 22, stiffness: 55, mass: 1.3};
const CAM_FAST = {damping: 20, stiffness: 130, mass: 0.9};
const CAM_TAP = {damping: 22, stiffness: 160, mass: 0.8};

// shot: [frame, zoom, sx, sy, qy, spring]
type Shot = [number, number, number, number, number, Partial<import('remotion').SpringConfig>?];

export const camera = (f: number, g: Geo): Cam => {
  const wide: [number, number, number, number] = [1.0, 195, 422, 1270];
  const med: [number, number, number, number] = [1.33, 195, 300, 1180];
  const macroCard = 0.75 * 1080 / (g.cardW * BASE_S);
  const shots: Shot[] = [
    [0, 1.12, 195, 422, 1270],
    [205, ...med, CAM],
    // customer
    [T.macroCard, macroCard, g.cardC.x, g.cardC.y, 1210, CAM_FAST],
    [T.cardFly - 2, 1.5, 195, 230, 1150, CAM],
    [T.macroChips, 1.9, 195, g.branchC, 1180, CAM_FAST],
    [T.tapBranch - 6, 1.9, 195, g.branchC, 1180, CAM_TAP],
    [T.tapDay - 6, 1.9, 195, g.dayC, 1180, CAM_TAP],
    [T.tapTime - 6, 1.9, 195, g.timeC, 1180, CAM_TAP],
    [T.tapPickPay - 6, 1.9, 195, g.payBtnC - 50, 1190, CAM_TAP],
    [T.macroPay, 1.05, 195, 422, 1060, CAM_FAST],
    [T.paid + 2, 1.5, 195, 422, 1180, CAM],
    [T.toConfirm + 4, 1.33, 195, 300, 1150, CAM],
    // owner
    [T.orderLands + 6, 1.8, 195, g.newC, 1190, CAM],
    [T.macroRevenue, 2.0, 195, g.revC, 1180, CAM_FAST],
    [T.revenueDone + 6, 1.33, 195, g.chartC, 1180, CAM],
    // skins
    [T.t5Out - 105, 1.15, 195, 380, 1270, CAM],
    [T.t5Out + 12, 1.22, 195, 380, 1270, {damping: 30, stiffness: 20, mass: 1.5}],
    // cta: identity (the phone itself is posed for the end card)
    [780, ...wide, {damping: 40, stiffness: 400, mass: 0.5}],
  ];
  const val = (i: 1 | 2 | 3 | 4 | 5) => track(f, shots.map((k) => [k[0], k[i] as number, k[5] as Partial<import('remotion').SpringConfig> | undefined] as Key), CAM);
  // reveal: a slow continuous push-in, ending exactly where the medium shot begins
  const zoom = (f < 205 ? 1 + 0.12 * ramp(f, 120, 205) : val(1)) * (1 + 0.012 * Math.sin(f / 40));
  const rot = noise2D('cr', f / 80, 2) * 0.1 + track(f, [[0, 0], [T.macroChips, 0.5, CAM], [T.macroPay, -0.4, CAM], [T.toConfirm, 0, CAM]], CAM);
  return {zoom, rot, fx: val(2), fy: val(3), qy: val(4)};
};
