import React, {useState} from 'react';
import {SANS} from './fonts';
import {Box, boxOf, pageHeight, screenOf, themeOf, useManifest} from './captures';
import {SafeImg} from './SafeImg';
import {rgba, ramp} from './anim';
import {PAGE_BG} from '../constants';

export const SCREEN_W = 390;
export const SCREEN_H = 844;
/** Room for the status bar: the captured pages start below it. */
export const INSET = 46;

/** Neutral page used while a capture is missing. Same size as the real one. */
const Placeholder: React.FC<{shop: string; screen: string; h: number}> = ({shop, screen, h}) => {
  const m = useManifest();
  const t = themeOf(m, shop);
  const rows = Math.max(1, Math.floor((h - 160) / 190));
  return (
    <div style={{position: 'absolute', inset: 0, background: t.bg, fontFamily: SANS, color: t.fg}}>
      <div style={{height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', fontWeight: 700, fontSize: 18}}>
        <span>{shop}</span>
        <span style={{width: 34, height: 34, borderRadius: 17, background: rgba(t.accent, 0.25)}} />
      </div>
      <div style={{padding: '8px 20px', fontSize: 30, fontWeight: 800, letterSpacing: -1}}>{screen}</div>
      {Array.from({length: rows}).map((_, i) => (
        <div key={i} style={{margin: '14px 20px', height: 170, borderRadius: 20, background: rgba(t.fg, 0.07), display: 'flex'}}>
          <div style={{width: 130, borderRadius: 20, background: rgba(t.accent, 0.35)}} />
          <div style={{flex: 1, padding: 16}}>
            <div style={{height: 14, width: '70%', borderRadius: 7, background: rgba(t.fg, 0.2)}} />
            <div style={{height: 10, width: '45%', borderRadius: 5, background: rgba(t.fg, 0.12), marginTop: 12}} />
          </div>
        </div>
      ))}
    </div>
  );
};

export type Hole = {box: Box; opacity: number; color?: string; radius?: number};

/**
 * The full captured page inside the phone, scrolled by `scroll` (screen units, 390 wide).
 * A pinned copy of the top `stickyH` units keeps the header in place while scrolling.
 */
export const Screen: React.FC<{
  shop: string;
  screen: string;
  scroll?: number;
  holes?: Hole[];
  stickyH?: number;
  children?: React.ReactNode;
}> = ({shop, screen, scroll = 0, holes = [], stickyH = 0, children}) => {
  const m = useManifest();
  const info = screenOf(m, shop, screen);
  const [failed, setFailed] = useState(false);
  const h = pageHeight(m, shop, screen);
  const src = info ? (info.fullFile ?? info.file) : undefined;
  const real = !!src && !failed;
  const t = themeOf(m, shop);
  const bg = PAGE_BG[screen] ?? t.bg;
  const img: React.CSSProperties = {width: SCREEN_W, height: h};
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: bg}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: SCREEN_W, height: h, transform: `translateY(${INSET - scroll}px)`}}>
        {real ? <SafeImg src={src!} style={img} onFail={() => setFailed(true)} /> : <Placeholder shop={shop} screen={screen} h={h} />}
        {holes.map((hl, i) =>
          hl.opacity > 0 ? (
            <div key={i} style={{position: 'absolute', left: hl.box.x - 2, top: hl.box.y - 2, width: hl.box.w + 4, height: hl.box.h + 4, background: hl.color ?? bg, opacity: hl.opacity, borderRadius: hl.radius ?? 20}} />
          ) : null,
        )}
        {children}
      </div>
      <div style={{position: 'absolute', left: 0, top: 0, width: SCREEN_W, height: INSET, background: bg, zIndex: 5, fontFamily: SANS, color: t.fg}}>
        <div style={{position: 'absolute', left: 36, top: 14, fontWeight: 700, fontSize: 16, letterSpacing: -0.2}}>9:41</div>
        <svg style={{position: 'absolute', right: 30, top: 16}} width="64" height="14" viewBox="0 0 64 14" fill={t.fg}>
          <rect x="0" y="9" width="3" height="5" rx="1" /><rect x="5" y="6" width="3" height="8" rx="1" /><rect x="10" y="3" width="3" height="11" rx="1" /><rect x="15" y="0" width="3" height="14" rx="1" />
          <rect x="26" y="1" width="30" height="13" rx="4" fill="none" stroke={t.fg} strokeWidth="1.2" opacity="0.5" /><rect x="28" y="3" width="22" height="9" rx="2.5" /><rect x="58" y="5" width="2" height="5" rx="1" opacity="0.5" />
        </svg>
      </div>
      {stickyH > 0 && scroll > 0 && info && !failed ? (
        <div style={{position: 'absolute', left: 0, top: INSET, width: SCREEN_W, height: stickyH, overflow: 'hidden', opacity: ramp(scroll, 0, 30), boxShadow: `0 6px 18px ${rgba(t.fg, 0.1)}`}}>
          <SafeImg src={info.file} style={{width: SCREEN_W, height: SCREEN_H}} />
        </div>
      ) : null}
    </div>
  );
};

/**
 * One element cropped out of the full page, drawn at the exact same place (screen coordinates),
 * so it can pop out of the screen. Put it in the Phone `overlay` (not clipped by the screen).
 */
export const Lift: React.FC<{
  shop: string;
  screen: string;
  element: string;
  scroll?: number;
  /** extra translate in screen units */
  dx?: number;
  dy?: number;
  dz?: number;
  scale?: number;
  rotate?: number;
  /** 0..1 how far it is lifted (shadow + glow) */
  lift?: number;
  opacity?: number;
  radius?: number;
  box?: Box;
  origin?: string;
  extraStyle?: React.CSSProperties;
}> = ({shop, screen, element, scroll = 0, dx = 0, dy = 0, dz = 0, scale = 1, rotate = 0, lift = 0, opacity = 1, radius = 18, box, origin = '50% 50%', extraStyle}) => {
  const m = useManifest();
  const b = box ?? boxOf(m, shop, screen, element);
  const info = screenOf(m, shop, screen);
  const [failed, setFailed] = useState(false);
  const src = info ? (info.fullFile ?? info.file) : undefined;
  const h = pageHeight(m, shop, screen);
  const t = themeOf(m, shop);
  return (
    <div
      style={{
        position: 'absolute',
        left: b.x,
        top: b.y - scroll + INSET,
        width: b.w,
        height: b.h,
        opacity,
        transformOrigin: origin,
        transform: `translate3d(${dx}px, ${dy}px, ${dz}px) rotate(${rotate}deg) scale(${scale})`,
        borderRadius: radius,
        overflow: 'hidden',
        background: PAGE_BG[screen] ?? t.bg,
        boxShadow: `0 ${6 + 26 * lift}px ${14 + 40 * lift}px ${rgba('#2a1a05', 0.1 + 0.28 * lift)}, 0 0 0 ${lift > 0 ? 1 : 0}px ${rgba('#ffffff', 0.5)}`,
        ...extraStyle,
      }}
    >
      {src && !failed ? (
        <SafeImg src={src} onFail={() => setFailed(true)} style={{position: 'absolute', left: -b.x, top: -b.y, width: SCREEN_W, height: h, maxWidth: 'none'}} />
      ) : (
        <div style={{position: 'absolute', inset: 0, display: 'flex', background: `linear-gradient(135deg, ${rgba(t.accent, 0.3)}, ${rgba(t.bg, 1)})`, fontFamily: SANS, color: t.fg, alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16}}>
          {element}
        </div>
      )}
    </div>
  );
};
