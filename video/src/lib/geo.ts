import {MAIN_SHOP as SHOP} from '../constants';
import {INSET} from './Screen';
import {boxOf, scrollFor, unionBox, useManifest} from './captures';
import type {Geo} from '../choreo';

export const HOME_SCROLL = 70;
export const SALES_SCROLL_1 = 387;
export const SALES_SCROLL_2 = 700;

/** Scroll positions and focus points of the main shop's screens, from the real captures. */
export const useGeo = () => {
  const m = useManifest();
  const card = boxOf(m, SHOP, 'catalog', 'productCard');
  const menuScroll = scrollFor(m, SHOP, 'catalog', 'productCard', 380);
  const pickScroll = scrollFor(m, SHOP, 'pickup', 'dayChip', 400);
  const payScroll = scrollFor(m, SHOP, 'payment', 'payButton', 560);
  const c = (b: {y: number; h: number}, sc: number) => b.y + b.h / 2 - sc + INSET;
  const geo: Geo = {
    cardC: {x: card.x + card.w / 2, y: c(card, menuScroll)},
    cardW: card.w,
    branchC: c(boxOf(m, SHOP, 'pickup', 'branchChip'), pickScroll),
    dayC: c(boxOf(m, SHOP, 'pickup', 'dayChip'), pickScroll),
    timeC: c(boxOf(m, SHOP, 'pickup', 'timeChip'), pickScroll),
    payBtnC: c(boxOf(m, SHOP, 'pickup', 'payButton'), pickScroll),
    payC: c(boxOf(m, SHOP, 'payment', 'payButton'), payScroll),
    revC: c(boxOf(m, SHOP, 'adminSales', 'revenueNumber'), SALES_SCROLL_1) + 20,
    newC: c(unionBox(boxOf(m, SHOP, 'adminOrders', 'freshBadge'), boxOf(m, SHOP, 'adminOrders', 'newOrderCard')), 0),
    chartC: c(boxOf(m, SHOP, 'adminSales', 'chartArea'), SALES_SCROLL_2),
  };
  return {geo, menuScroll, pickScroll, payScroll};
};
