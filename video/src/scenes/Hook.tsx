import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {noise2D} from '@remotion/noise';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {COLORS, H, W} from '../constants';
import {PING_FRAMES, T} from '../timeline';
import {SANS} from '../lib/fonts';
import {SNAP, clamp01, lerp, ramp, spr} from '../lib/anim';
import {Title} from '../lib/Title';
import {useAbs} from '../lib/time';

type B = {at: number; side: 'in' | 'out'; text: string};
// Plausible orders and the owner trying to keep up.
const BUBBLES: B[] = [
  {at: PING_FRAMES[0], side: 'in', text: 'Hola! ¿Tenés lemon pie para el sábado?'},
  {at: PING_FRAMES[1], side: 'in', text: '¿A qué hora paso?'},
  {at: PING_FRAMES[2], side: 'out', text: 'Hola! Un segundito y te confirmo'},
  {at: PING_FRAMES[3], side: 'in', text: '¿Aceptan transferencia?'},
  {at: PING_FRAMES[4], side: 'in', text: '¿Me pasás precios?'},
  {at: PING_FRAMES[5], side: 'in', text: '¿Queda algo de la torta de limón?'},
  {at: PING_FRAMES[6], side: 'in', text: 'Hola?? ¿Seguís ahí?'},
  {at: PING_FRAMES[7], side: 'in', text: '¿Cuánto sale la docena de medialunas?'},
  {at: PING_FRAMES[8], side: 'in', text: 'Te transferí, ¿te llegó?'},
  {at: PING_FRAMES[8], side: 'out', text: 'Ahora te miro, estoy amasando'},
  {at: PING_FRAMES[9], side: 'in', text: '¿Abren los domingos?'},
  {at: PING_FRAMES[9], side: 'in', text: '¿Me mandás el menú?'},
  {at: PING_FRAMES[10], side: 'in', text: '¿Hay opción sin TACC?'},
  {at: PING_FRAMES[10], side: 'in', text: '¿Me guardás una para las 18?'},
];

const FONT = 42;
const measure = (text: string) => {
  const textW = text.length * FONT * 0.53;
  const w = Math.min(720, textW + 110);
  const lines = Math.ceil(textW / (w - 70));
  return {w, h: lines * 54 + 60};
};

const BOTTOM = 1490;
const BubbleField: React.FC<{f: number; suck: number}> = ({f, suck}) => {
  const items = BUBBLES.map((b, i) => ({...b, ...measure(b.text), i}));
  const e = suck * suck; // accelerating pull
  return (
    <AbsoluteFill style={{maskImage: suck > 0 ? undefined : 'linear-gradient(to bottom, transparent 600px, #000 840px)'}}>
      {items.map((b) => {
        if (f < b.at) return null;
        const p = clamp01(spr(f, b.at, SNAP));
        const pushed = items
          .filter((j) => j.i > b.i && f >= j.at)
          .reduce((acc, j) => acc + (j.h + (22 - 3.2 * j.i)) * clamp01(spr(f, j.at, SNAP)), 0);
        const bottom = BOTTOM - pushed + (1 - p) * 70;
        const left = b.side === 'in' ? 56 + (random(`jx${b.i}`) - 0.3) * 40 : W - 56 - b.w - (random(`jx${b.i}`) - 0.3) * 40;
        const cx = left + b.w / 2;
        const cy = bottom - b.h / 2;
        const rot = (random(`r${b.i}`) - 0.5) * 5;
        const out = b.side === 'out';
        return (
          <div
            key={b.i}
            style={{
              position: 'absolute',
              left,
              top: bottom - b.h,
              width: b.w,
              height: b.h,
              opacity: Math.min(1, p * 2.5) * (1 - clamp01((e - 0.85) / 0.15)),
              transformOrigin: 'center',
              transform: `translate(${(W / 2 - cx) * e}px, ${(H / 2 - cy) * e}px) rotate(${rot + 540 * e * (b.i % 2 ? 1 : -1)}deg) scale(${lerp(0.7 + 0.3 * p, 0.04, e)})`,
              filter: e > 0.02 ? `blur(${e * 22}px)` : undefined,
              background: out ? COLORS.waGreen : '#FFFFFF',
              color: '#111B21',
              borderRadius: 30,
              borderTopLeftRadius: out ? 30 : 8,
              borderTopRightRadius: out ? 8 : 30,
              boxShadow: '0 14px 34px rgba(0,0,0,0.45)',
              fontFamily: SANS,
              fontWeight: 500,
              fontSize: FONT,
              lineHeight: '54px',
              letterSpacing: '-0.01em',
              padding: '14px 32px 0',
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

const NightBg: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{background: `linear-gradient(180deg, ${COLORS.nightA} 0%, #0C1627 55%, #0F1D31 100%)`}}>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 40% at 50% 85%, rgba(40,110,160,0.35), rgba(40,110,160,0) 70%)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 30% at 20% 10%, rgba(70,110,170,0.22), rgba(70,110,170,0) 70%)'}} />
    <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(255,255,255,0.045) 2px, transparent 2px)', backgroundSize: '64px 64px', backgroundPosition: `${f * 0.3}px ${f * 0.5}px`}} />
  </AbsoluteFill>
);

const Shake: React.FC<{f: number; children: React.ReactNode}> = ({f, children}) => {
  const k = Math.pow(clamp01(f / 100), 2);
  const amp = 2 + 12 * k;
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

export const Hook: React.FC = () => {
  const f = useAbs();
  return (
    <AbsoluteFill>
      <NightBg f={f} />
      <Shake f={f}>
        <BubbleField f={f} suck={0} />
        <Title lines={['¿Todavía tomás', 'pedidos por', '*WhatsApp?*']} inAt={T.t1In} outAt={T.t1Out} y={275} size={118} color="#FFFFFF" accent="#5BE08A" />
      </Shake>
    </AbsoluteFill>
  );
};

export const Turn: React.FC = () => {
  const f = useAbs();
  const flash = ramp(f, 114, 119);
  return (
    <AbsoluteFill>
      <NightBg f={f} />
      <CameraMotionBlur shutterAngle={240} samples={6}>
        <SuckInner />
      </CameraMotionBlur>
      <Shake f={f}>
        <Title lines={['¿Todavía tomás', 'pedidos por', '*WhatsApp?*']} inAt={T.t1In} outAt={T.t1Out} y={275} size={118} color="#FFFFFF" accent="#5BE08A" />
      </Shake>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, #FFFFFF, ${COLORS.cream} 60%)`, opacity: flash * flash}} />
    </AbsoluteFill>
  );
};

const SuckInner: React.FC = () => {
  const f = useAbs();
  const suck = clamp01(ramp(f, 105, 119));
  return <BubbleField f={f} suck={suck} />;
};

