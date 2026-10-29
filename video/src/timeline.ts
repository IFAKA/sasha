// Single source of truth for timing. Pure data: no Remotion imports,
// so scripts/cues.ts can load it with plain node.
// Grid: 120 BPM, 30 fps -> 1 beat = 15 f, 1 bar = 60 f.
export const FPS = 30;
export const BEAT = 15;
export const BAR = 60;
export const TOTAL = 900;

export type CueKind =
  | 'cut' | 'title' | 'tap' | 'pop' | 'whoosh' | 'hit'
  | 'chime' | 'ping' | 'riser' | 'swap';

export type Cue = {name: string; frame: number; kind: CueKind; dur?: number};

export const CUES: Cue[] = [];
const reg = (name: string, frame: number, kind: CueKind, dur?: number) => {
  CUES.push(dur ? {name, frame, kind, dur} : {name, frame, kind});
  return frame;
};

export const SCENES = {
  hook: [reg('cut-hook', 0, 'cut'), reg('cut-turn', 105, 'cut')],
  turn: [105, reg('cut-reveal', 120, 'cut')],
  reveal: [120, reg('cut-customer', 240, 'cut')],
  customer: [240, reg('cut-owner', 480, 'cut')],
  owner: [480, reg('cut-shops', 660, 'cut')],
  skins: [660, reg('cut-cta', 780, 'cut')],
  cta: [780, TOTAL],
} as const;

// Scene 1: pings accelerate (beat -> half-beat). Bubbles appear on these.
export const PING_FRAMES = [0, 15, 30, 45, 52, 60, 67, 75, 82, 90, 97];
PING_FRAMES.forEach((f, i) => reg(`ping-${String(i + 1).padStart(2, '0')}`, f, 'ping'));

export const T = {
  riserHook: reg('riser-hook', 0, 'riser', 105),
  t1In: reg('title1-in', 45, 'title'),
  t1Out: reg('title1-out', 105, 'title'),
  suck: reg('suck-whoosh', 105, 'whoosh', 15),

  drop: reg('drop', 120, 'hit'),
  phoneRise: reg('phone-rise', 120, 'whoosh', 30),
  t2aIn: reg('title2a-in', 150, 'title'),
  t2aOut: reg('title2a-out', 195, 'title'),
  t2bIn: reg('title2b-in', 195, 'title'),
  t2bOut: reg('title2b-out', 225, 'title'),

  t3aIn: reg('title3a-in', 255, 'title'),
  toMenu: reg('swap-menu', 247, 'swap'),
  cardLift: reg('card-lift', 292, 'pop'),
  tapCard: reg('tap-card', 300, 'tap'),
  cardFly: reg('card-fly', 315, 'whoosh', 30),
  badge: reg('cart-badge', 345, 'pop'),
  t3aOut: reg('title3a-out', 360, 'title'),
  t3bIn: reg('title3b-in', 360, 'title'),
  toPickup: reg('swap-pickup', 352, 'swap'),
  tapBranch: reg('tap-branch', 367, 'tap'),
  tapDay: reg('tap-day', 382, 'tap'),
  tapTime: reg('tap-time', 397, 'tap'),
  tapPickPay: reg('tap-pickup-pay', 412, 'tap'),
  t3bOut: reg('title3b-out', 420, 'title'),
  t3cIn: reg('title3c-in', 420, 'title'),
  toPay: reg('swap-payment', 427, 'swap'),
  tapPay: reg('tap-pay', 450, 'tap'),
  paid: reg('paid-chime', 457, 'chime'),
  toConfirm: reg('swap-confirmation', 465, 'swap'),
  t3cOut: reg('title3c-out', 465, 'title'),

  spin: reg('phone-spin', 480, 'whoosh', 30),
  toAdmin: reg('swap-admin', 495, 'swap'),
  t4In: reg('title4-in', 510, 'title'),
  notif: reg('order-notification', 525, 'chime'),
  orderLands: reg('order-lands', 532, 'pop'),
  toSales: reg('swap-sales', 570, 'swap'),
  revenueUp: reg('revenue-countup', 585, 'ping', 30),
  revenueDone: reg('revenue-done', 615, 'chime'),
  bars: reg('bars-riser', 630, 'riser', 30),
  t4Out: reg('title4-out', 645, 'title'),

  skin0: reg('hit-skin0', 660, 'hit'),
  swapTeal: reg('swap-teal', 675, 'swap'),
  hitTeal: reg('hit-teal', 675, 'hit'),
  swapPlum: reg('swap-plum', 690, 'swap'),
  hitPlum: reg('hit-plum', 690, 'hit'),
  t5In: reg('title5-in', 690, 'title'),
  swapNavy: reg('swap-navy', 705, 'swap'),
  hitNavy: reg('hit-navy', 705, 'hit'),
  swapBase: reg('swap-base', 720, 'swap'),
  hitBase: reg('hit-base', 720, 'hit'),
  t5Out: reg('title5-out', 765, 'title'),

  ctaCut: reg('cta-whoosh', 780, 'whoosh', 30),
  t6In: reg('title6-in', 795, 'title'),
  lockup: reg('lockup', 840, 'pop'),
  contact: reg('contact-in', 855, 'title'),
  finalHit: reg('final-hit', 870, 'hit'),
} as const;

CUES.sort((a, b) => a.frame - b.frame);

export const onGrid = (f: number) => [0, 7, 8].includes(f % BEAT);
