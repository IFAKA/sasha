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
  t1Out: reg('title1-out', 82, 'title'),
  into1: reg('bubble-into-icon-01', 90, 'pop'),
  into2: reg('bubble-into-icon-02', 97, 'pop'),
  into3: reg('bubble-into-icon-03', 105, 'pop'),
  iconMorph: reg('icon-morph', 112, 'swap'),

  drop: reg('drop', 120, 'hit'),
  appOpen: reg('app-open', 120, 'whoosh', 15),
  t2aIn: reg('title2a-in', 150, 'title'),
  t2aOut: reg('title2a-out', 195, 'title'),
  t2bIn: reg('title2b-in', 195, 'title'),
  t2bOut: reg('title2b-out', 225, 'title'),

  t3aIn: reg('title3a-in', 255, 'title'),
  toMenu: reg('swap-menu', 247, 'swap'),
  cardLift: reg('card-lift', 292, 'pop'),
  tapCard: reg('tap-card', 300, 'tap'),
  macroCard: reg('macro-card', 285, 'whoosh', 8),
  cardFly: reg('card-fly', 315, 'whoosh', 30),
  badge: reg('cart-badge', 345, 'pop'),
  t3aOut: reg('title3a-out', 360, 'title'),
  t3bIn: reg('title3b-in', 360, 'title'),
  toPickup: reg('swap-pickup', 352, 'swap'),
  macroChips: reg('macro-chips', 360, 'whoosh', 8),
  tapBranch: reg('tap-branch', 367, 'tap'),
  tapDay: reg('tap-day', 382, 'tap'),
  tapTime: reg('tap-time', 397, 'tap'),
  tapPickPay: reg('tap-pickup-pay', 412, 'tap'),
  t3bOut: reg('title3b-out', 420, 'title'),
  t3cIn: reg('title3c-in', 420, 'title'),
  macroPay: reg('macro-pay', 427, 'whoosh', 8),
  toPay: reg('swap-payment', 427, 'swap'),
  tapPay: reg('tap-pay', 442, 'tap'),
  paid: reg('paid-chime', 450, 'chime'),
  toConfirm: reg('swap-confirmation', 457, 'swap'),
  t3cOut: reg('title3c-out', 442, 'title'),

  whipOut: reg('whip-out', 472, 'whoosh', 8),
  spin: reg('phone-spin', 480, 'whoosh', 30),
  toAdmin: reg('swap-admin', 480, 'swap'),
  t4In: reg('title4-in', 510, 'title'),
  notif: reg('order-notification', 525, 'chime'),
  orderLands: reg('order-lands', 532, 'pop'),
  toSales: reg('swap-sales', 570, 'swap'),
  macroRevenue: reg('macro-revenue', 577, 'whoosh', 8),
  revenueUp: reg('revenue-countup', 585, 'ping', 30),
  revenueDone: reg('revenue-done', 615, 'chime'),
  bars: reg('bars-riser', 630, 'riser', 30),
  t4Out: reg('title4-out', 645, 'title'),

  skin0: reg('hit-skin0', 660, 'hit'),
  swapTeal: reg('swap-teal', 690, 'swap'),
  hitTeal: reg('hit-teal', 690, 'hit'),
  swapPlum: reg('swap-plum', 720, 'swap'),
  hitPlum: reg('hit-plum', 720, 'hit'),
  t5In: reg('title5-in', 675, 'title'),
  swapNavy: reg('swap-navy', 750, 'swap'),
  hitNavy: reg('hit-navy', 750, 'hit'),
  t5Out: reg('title5-out', 765, 'title'),

  ctaCut: reg('cta-whoosh', 780, 'whoosh', 30),
  t6In: reg('title6-in', 780, 'title'),
  lockup: reg('lockup', 840, 'pop'),
  contact: reg('contact-in', 855, 'title'),
  finalHit: reg('final-hit', 870, 'hit'),
} as const;

CUES.sort((a, b) => a.frame - b.frame);

export const onGrid = (f: number) => [0, 7, 8].includes(f % BEAT);
