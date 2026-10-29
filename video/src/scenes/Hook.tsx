import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {noise2D} from '@remotion/noise';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {COLORS, H, W} from '../constants';
import {PING_FRAMES, T} from '../timeline';
import {SANS} from '../lib/fonts';
import {SNAP, clamp01, easeInOut, lerp, mix, ramp, spr} from '../lib/anim';
import {Title} from '../lib/Title';
import {useAbs} from '../lib/time';

type B = {at: number; side: 'in' | 'out'; text: string};
const P = PING_FRAMES;
// Plausible orders and the owner trying to keep up. The first three are already on screen at frame 0.
const BUBBLES: B[] = [
  {at: -42, side: 'in', text: 'Buen día! Pregunta por las tortas'},
  {at: -35, side: 'in', text: '¿Hacen envíos?'},
  {at: -28, side: 'in', text: '¿Cuánto sale el pan de campo?'},
  {at: -21, side: 'in', text: 'Hola?? Mandé mensaje ayer'},
  {at: -14, side: 'in', text: '¿Tenés lemon pie para el sábado?'},
  {at: -7, side: 'in', text: 'Hola! ¿Hacen tortas para 12?'},
  {at: P[0], side: 'in', text: '¿A qué hora paso?'},
  {at: 8, side: 'in', text: '¿Me pasás precios?'},
  {at: P[1], side: 'out', text: 'Hola! Un segundito y te confirmo'},
  {at: 22, side: 'in', text: '¿Aceptan transferencia?'},
  {at: P[2], side: 'in', text: '¿Queda algo de la torta de limón?'},
  {at: 38, side: 'in', text: 'Hola?? ¿Seguís ahí?'},
  {at: P[3], side: 'in', text: '¿Cuánto sale la docena de medialunas?'},
  {at: P[4], side: 'in', text: 'Te transferí, ¿te llegó?'},
  {at: P[4], side: 'out', text: 'Ahora te miro, estoy amasando'},
  {at: P[5], side: 'in', text: '¿Abren los domingos?'},
  {at: 64, side: 'in', text: '¿Me mandás el menú?'},
  {at: P[6], side: 'in', text: '¿Hay opción sin TACC?'},
  {at: P[7], side: 'in', text: '¿Me guardás una para las 18?'},
  {at: 78, side: 'in', text: '¿Entregan a domicilio?'},
  {at: P[8], side: 'out', text: 'Sí! Te escribo en un rato'},
  {at: 86, side: 'in', text: 'Mandé el comprobante'},
  {at: 88, side: 'in', text: '¿Cuánto sale la de dulce de leche?'},
];

const FONT = 38;
const measure = (text: string) => {
  const textW = text.length * FONT * 0.53;
  const w = Math.min(700, textW + 100);
  const lines = Math.ceil(textW / (w - 64));
  return {w, h: lines * 48 + 52};
};

const BOTTOM = 1500;
const ITEMS = BUBBLES.map((b, i) => ({...b, ...measure(b.text), i}));

/** Where a bubble sits at frame f (before it flies). */
const place = (b: (typeof ITEMS)[number], f: number) => {
  const p = clamp01(spr(f, b.at, SNAP));
  const buzz = Math.sin((f - b.at) * 2.4) * 7 * Math.max(0, 1 - (f - b.at) / 10);
  const pushed = ITEMS.filter((j) => j.i > b.i && f >= j.at).reduce((acc, j) => acc + (j.h * 0.8 + 6) * clamp01(spr(f, j.at, SNAP)), 0);
  const bottom = BOTTOM - pushed + (1 - p) * 70;
  const left = b.side === 'in' ? 56 + (random(`jx${b.i}`) - 0.3) * 40 : W - 56 - b.w - (random(`jx${b.i}`) - 0.3) * 40;
  return {p, buzz, bottom, left, cx: left + b.w / 2, cy: bottom - b.h / 2, rot: (random(`r${b.i}`) - 0.5) * 5};
};

// --- "into the app icon": the bubbles fly one by one into the chat icon ---
const FLY_AT = 90; // first bubble leaves
const FLY_DUR = 10;
const FLY_GAP = 1; // frames between two bubbles
export const ICON_CY = 1000; // where the icon sits when it becomes the app icon
export const ICON_PX = 240;
const ICON_TOP_CY = 317;
const GLIDE = [108, 120] as const;
/** Bubbles that are on screen when the flight starts, newest first. */
const FLYERS = ITEMS.filter((b) => b.at <= 88 && place(b, 200).cy >= 800)
  .sort((a, b) => b.i - a.i)
  .map((b, k) => ({i: b.i, start: FLY_AT + Math.round(k * FLY_GAP)}));
const FLY_START: Record<number, number> = Object.fromEntries(FLYERS.map((x) => [x.i, x.start]));
const ARRIVALS = FLYERS.map((x) => x.start + FLY_DUR);

/** Centre of the icon at frame f (it sits at the top, then glides to the middle for the morph). */
const iconCy = (f: number) => lerp(ICON_TOP_CY, ICON_CY, easeInOut(ramp(f, GLIDE[0], GLIDE[1])));

const BubbleField: React.FC<{f: number; layer?: 'all' | 'static' | 'fly'}> = ({f, layer = 'all'}) => {
  const flying = f >= FLY_AT;
  return (
    <AbsoluteFill style={{maskImage: !flying || layer === 'static' ? 'linear-gradient(to bottom, transparent 720px, #000 980px)' : undefined}}>
      {ITEMS.map((b) => {
        if (f < b.at) return null;
        const fs = FLY_START[b.i];
        const isFlyer = fs !== undefined;
        if (flying && layer === 'static' && isFlyer) return null;
        if (flying && layer === 'fly' && !isFlyer) return null;
        const q = place(b, f);
        const out = b.side === 'out';
        let tx = q.buzz * (1 - ramp(f, 86, 92));
        let ty = 0;
        let sx = lerp(0.7 + 0.3 * q.p, 1, 1);
        sx = 0.7 + 0.3 * q.p;
        let sy = sx;
        let rot = q.rot;
        let alpha = Math.min(1, q.p * 2.5);
        if (flying && !isFlyer) alpha *= 1 - ramp(f, FLY_AT, FLY_AT + 5);
        if (isFlyer && f >= fs) {
          const u = clamp01((f - fs) / FLY_DUR);
          const e = Math.pow(u, 1.5);
          const T0 = {x: q.cx, y: q.cy};
          const T1 = {x: W / 2, y: iconCy(f)};
          const dx = T1.x - T0.x;
          const dy = T1.y - T0.y;
          const len = Math.hypot(dx, dy) || 1;
          const bend = (b.i % 2 ? 1 : -1) * 150;
          const C = {x: (T0.x + T1.x) / 2 + (-dy / len) * bend, y: (T0.y + T1.y) / 2 + (dx / len) * bend};
          const X = (1 - e) * (1 - e) * T0.x + 2 * (1 - e) * e * C.x + e * e * T1.x;
          const Y = (1 - e) * (1 - e) * T0.y + 2 * (1 - e) * e * C.y + e * e * T1.y;
          tx = X - q.cx;
          ty = Y - q.cy;
          const sc = 1 - 0.94 * Math.pow(u, 1.4);
          const v = ramp(u, 0.82, 1); // tiny squash "pop"
          sx = sc * (1 + 0.45 * v);
          sy = sc * (1 - 0.4 * v);
          rot = q.rot + (b.i % 2 ? 14 : -14) * u;
          alpha = 1 - ramp(u, 0.94, 1);
        }
        if (alpha <= 0.002) return null;
        return (
          <div
            key={b.i}
            style={{
              position: 'absolute',
              left: q.left,
              top: q.bottom - b.h,
              width: b.w,
              height: b.h,
              opacity: alpha,
              transformOrigin: 'center',
              transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${sx}, ${sy})`,
              background: out ? COLORS.waGreen : '#FFFFFF',
              color: '#111B21',
              borderRadius: 30,
              borderTopLeftRadius: out ? 30 : 8,
              borderTopRightRadius: out ? 8 : 30,
              boxShadow: '0 14px 34px rgba(0,0,0,0.45)',
              fontFamily: SANS,
              fontWeight: 500,
              fontSize: FONT,
              lineHeight: '48px',
              letterSpacing: '-0.01em',
              padding: '12px 30px 0',
              boxSizing: 'border-box',
            }}
          >
            {b.text}
            <div style={{position: 'absolute', right: 30, bottom: 8, fontSize: 21, lineHeight: '24px', color: out ? '#4E8F6A' : '#8696A0', fontWeight: 500}}>
              {`${9 + Math.floor(b.i / 5)}:${String(12 + b.i * 3).padStart(2, '0')}${out ? '  ✓✓' : ''}`}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** The green chat icon with its red counter. From 90 it eats the bubbles, then morphs into the Horno Lento app icon. */
const Counter: React.FC<{f: number}> = ({f}) => {
  const k = clamp01(f / 100);
  const n0 = Math.round(3 + 44 * Math.pow(Math.min(f, 90) / 100, 1.5));
  const last0 = Math.round(3 + 44 * Math.pow(clamp01((Math.min(f, 90) - 1) / 100), 1.5));
  const arrived = ARRIVALS.filter((a) => a <= f).length;
  const n = f < FLY_AT ? n0 : Math.round(lerp(n0, 99, arrived / ARRIVALS.length));
  const bump0 = f < FLY_AT && n0 !== last0 ? 1 : 0;
  const hit = Math.min(1, ARRIVALS.reduce((acc, a) => acc + (f >= a ? Math.max(0, 1 - (f - a) / 5) : 0), 0));
  const buzz = Math.sin(f * 2.1) * (2 + 3 * k) * (1 - ramp(f, 86, 92));
  const glide = easeInOut(ramp(f, GLIDE[0], GLIDE[1]));
  const m = easeInOut(ramp(f, 110, 114)); // chat -> app icon
  const dip = 1 - 0.16 * Math.sin(Math.PI * ramp(f, 109, 115));
  const base = lerp(1.3 + 0.1 * bump0, ICON_PX / 84, glide) * dip;
  const cy = iconCy(f);
  const badgeS = 1 - easeInOut(ramp(f, 106, 109));
  const warm = easeInOut(ramp(f, 104, 119));
  const caramel = '#B8742B';
  return (
    <div
      style={{
        position: 'absolute',
        left: W / 2 - 42,
        top: cy - 42,
        width: 84,
        height: 84,
        transform: `translateX(${buzz}px) scale(${base * (1 + 0.07 * hit)}, ${base * (1 - 0.09 * hit)})`,
        transformOrigin: '50% 50%',
      }}
    >
      <div style={{position: 'absolute', inset: 0, borderRadius: lerp(24, 18.8, m), overflow: 'hidden', boxShadow: warm > 0.3 ? '0 6px 18px rgba(90,50,10,0.35)' : '0 10px 30px rgba(0,0,0,0.4)'}}>
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#3CD26F,#1FA855)', opacity: 1 - m, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width="46" height="46" viewBox="0 0 24 24" fill="#fff"><path d="M12 3C7 3 3 6.800 3 11.500c0 2.100.8 4 2.100 5.500L4 21l4.300-1.300c1.100.5 2.300.8 3.700.8 5 0 9-3.800 9-8.500S17 3 12 3z" /></svg>
        </div>
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${mix(caramel, '#FFFFFF', 0.18)}, ${mix(caramel, '#000000', 0.2)})`, opacity: m, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 44, letterSpacing: '-0.06em', color: '#FFF6E6', paddingRight: 3}}>HL</div>
        </div>
      </div>
      {badgeS > 0.01 && (
        <div style={{position: 'absolute', top: -16, right: -26 - (n >= 10 ? 8 : 0) - (n >= 99 ? 12 : 0), transform: `scale(${badgeS * (1 + 0.12 * hit)})`, minWidth: 52, height: 52, padding: '0 12px', boxSizing: 'border-box', borderRadius: 26, background: '#FF3B30', color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(255,59,48,0.55)', border: '3px solid #0C1627'}}>{n >= 99 && arrived === ARRIVALS.length ? '99+' : n}</div>
      )}
    </div>
  );
};

const NightBg: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{background: `linear-gradient(180deg, ${COLORS.nightA} 0%, #0C1627 55%, #0F1D31 100%)`}}>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 40% at 50% 85%, rgba(40,110,160,0.35), rgba(40,110,160,0) 70%)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 30% at 20% 10%, rgba(70,110,170,0.22), rgba(70,110,170,0) 70%)'}} />
    <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(255,255,255,0.045) 2px, transparent 2px)', backgroundSize: '64px 64px', backgroundPosition: `${f * 0.3}px ${f * 0.5}px`}} />
  </AbsoluteFill>
);

const Shake: React.FC<{f: number; children: React.ReactNode}> = ({f, children}) => {
  const k = Math.pow(clamp01(f / 100), 2);
  const amp = (2 + 12 * k) * (1 - ramp(f, 86, 96));
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${noise2D('sx', f / 2.2, 0) * amp}px, ${noise2D('sy', f / 2.2, 1) * amp}px) rotate(${noise2D('sr', f / 3, 2) * 0.5 * k}deg)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const HookAll: React.FC = () => {
  const f = useAbs();
  const warm = easeInOut(ramp(f, 104, 119));
  const flying = f >= FLY_AT;
  return (
    <AbsoluteFill>
      <NightBg f={f} />
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 60%, #FFE9C9 0%, ${COLORS.cream} 70%)`, opacity: warm}} />
      <Shake f={f}>
        {flying ? (
          <>
            <BubbleField f={f} layer="static" />
            <CameraMotionBlur shutterAngle={110} samples={4}>
              <BubbleField f={f} layer="fly" />
            </CameraMotionBlur>
          </>
        ) : (
          <BubbleField f={f} />
        )}
        <Counter f={f} />
        <Title lines={['¿Todavía tomás', 'pedidos por', '*WhatsApp?*']} inAt={T.t1In} outAt={T.t1Out} y={410} size={104} color="#FFFFFF" accent="#5BE08A" />
      </Shake>
    </AbsoluteFill>
  );
};

export const Hook: React.FC = HookAll;
export const Turn: React.FC = HookAll;
