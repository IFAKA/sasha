import React, {createContext, useContext, useEffect, useState} from 'react';
import {staticFile, useDelayRender} from 'remotion';
import {FALLBACK_BOXES, FALLBACK_THEMES, PLACEHOLDER_HEIGHT, Theme} from '../constants';

export type Box = {x: number; y: number; w: number; h: number};
export type ScreenInfo = {
  file: string;
  fullFile?: string;
  fullHeight?: number;
  scrollY?: number;
  elements?: Record<string, Box>;
};
export type Manifest = {
  scale: number;
  viewport: {w: number; h: number};
  shops: Record<string, {theme: Theme; screens: Record<string, ScreenInfo>}>;
};

const Ctx = createContext<Manifest | null>(null);

export const CapturesProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {delayRender, continueRender} = useDelayRender();
  const [handle] = useState(() => delayRender('captures manifest'));
  const [m, setM] = useState<Manifest | null>(null);
  useEffect(() => {
    fetch(staticFile('captures/manifest.json'))
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setM(j && j.shops ? (j as Manifest) : null))
      .catch(() => setM(null))
      .finally(() => continueRender(handle));
  }, [continueRender, handle]);
  return <Ctx.Provider value={m}>{children}</Ctx.Provider>;
};

export const useManifest = () => useContext(Ctx);

export const themeOf = (m: Manifest | null, shop: string): Theme =>
  m?.shops?.[shop]?.theme ?? FALLBACK_THEMES[shop] ?? FALLBACK_THEMES.demo;

export const screenOf = (m: Manifest | null, shop: string, screen: string): ScreenInfo | undefined =>
  m?.shops?.[shop]?.screens?.[screen];

export const pageHeight = (m: Manifest | null, shop: string, screen: string) => {
  const s = screenOf(m, shop, screen);
  if (s) return s.fullFile ? (s.fullHeight ?? 844) : 844;
  return PLACEHOLDER_HEIGHT[screen] ?? 844;
};

export const boxOf = (m: Manifest | null, shop: string, screen: string, name: string): Box => {
  const info = screenOf(m, shop, screen);
  const real = info?.elements?.[name];
  if (real) {
    // Sticky header elements are reported with the capture scroll added; the full image has the header at the top.
    const sy = info?.scrollY ?? 0;
    if (name.startsWith('cart') && sy > 0 && real.y >= sy && real.y - sy < 70) return {...real, y: real.y - sy};
    return real;
  }
  return FALLBACK_BOXES[`${screen}.${name}`] ?? {x: 20, y: 300, w: 350, h: 120};
};

export const unionBox = (a: Box, b: Box): Box => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y};
};

/** Scroll that brings an element's centre to screen y `targetY` (screen units), clamped to the page. */
export const scrollFor = (m: Manifest | null, shop: string, screen: string, name: string, targetY: number) => {
  const b = boxOf(m, shop, screen, name);
  const max = Math.max(0, pageHeight(m, shop, screen) - 844 + 46);
  return Math.min(max, Math.max(0, b.y + b.h / 2 + 46 - targetY));
};
