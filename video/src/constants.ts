// Everything the owner may want to change lives here.
export const PRODUCT_NAME = 'Tu Tienda';
export const CONTACT_LINE = 'Escribinos: +54 9 341 000-0000';

export const W = 1080;
export const H = 1920;

// Instagram safe area: keep all text inside y = SAFE_TOP .. H - SAFE_BOTTOM
export const SAFE_TOP = 250;
export const SAFE_BOTTOM = 400;

export const COLORS = {
  cream: '#F6F0E6',
  creamDeep: '#EADFCB',
  ink: '#1F1912',
  gold: '#B8832B',
  warm: '#FFD9A0',
  nightA: '#070B14',
  nightB: '#142033',
  nightC: '#1E3350',
  waGreen: '#D9FDD3',
  waGreenDark: '#128C7E',
};

export type Theme = {bg: string; fg: string; accent: string};

// Used until the real manifest provides each variant's theme.
export const FALLBACK_THEMES: Record<string, Theme> = {
  demo: {bg: '#F3EBDD', fg: '#2A2118', accent: '#B8742B'},
  demoTeal: {bg: '#E9F2F0', fg: '#12302C', accent: '#1F8A7D'},
  demoPlum: {bg: '#F4ECF2', fg: '#2E1B2C', accent: '#8E3B7A'},
  demoNavy: {bg: '#E9EDF4', fg: '#14213A', accent: '#2F55A4'},
};

// Hero shop used in every scene except the re-skin scene.
export const MAIN_SHOP = 'demo';
// Re-skin scene: same shop, one colour variant per beat.
export const SKINS: {shop: string; screen: string}[] = [
  {shop: 'demo', screen: 'home'},
  {shop: 'demoTeal', screen: 'home'},
  {shop: 'demoPlum', screen: 'home'},
  {shop: 'demoNavy', screen: 'home'},
  {shop: 'demo', screen: 'catalog'},
];

// Page sizes used by the neutral placeholder when a capture is missing.
export const PLACEHOLDER_HEIGHT: Record<string, number> = {
  home: 1300,
  menu: 1500,
  catalog: 1500,
  product: 1100,
  cart: 844,
  pickup: 844,
  payment: 960,
  confirmation: 844,
  adminOrders: 844,
  adminSales: 844,
};

// Element boxes (CSS px on the full page) used while the real ones are missing.
export const FALLBACK_BOXES: Record<string, {x: number; y: number; w: number; h: number}> = {
  'catalog.productCard': {x: 20, y: 520, w: 350, h: 190},
  'catalog.addButton': {x: 300, y: 650, w: 56, h: 40},
  'catalog.cartIcon': {x: 336, y: 14, w: 36, h: 36},
  'pickup.branchChip': {x: 20, y: 250, w: 350, h: 64},
  'pickup.dayChip': {x: 20, y: 400, w: 160, h: 56},
  'pickup.timeChip': {x: 200, y: 520, w: 150, h: 56},
  'payment.payButton': {x: 20, y: 860, w: 350, h: 56},
  'adminOrders.newOrderCard': {x: 16, y: 150, w: 358, h: 150},
  'adminSales.chartArea': {x: 16, y: 260, w: 358, h: 260},
  'adminSales.revenueCard': {x: 16, y: 130, w: 358, h: 110},
};

// Page background of screens whose colour differs from the shop theme (used for "holes" under lifted cards).
export const PAGE_BG: Record<string, string> = {
  adminOrders: '#f4ebdf',
  adminSales: '#f4ebdf',
};
