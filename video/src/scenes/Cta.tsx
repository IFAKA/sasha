import React from 'react';
import {AbsoluteFill} from 'remotion';
import {COLORS, CONTACT_LINE, MAIN_SHOP as SHOP, PRODUCT_NAME} from '../constants';
import {T} from '../timeline';
import {Backdrop} from '../lib/Backdrop';
import {Phone} from '../lib/Phone';
import {Screen} from '../lib/Screen';
import {Title} from '../lib/Title';
import {themeOf, useManifest} from '../lib/captures';
import {phonePose} from '../choreo';
import {BOUNCY, SNAP, clamp01, mix, ramp, rgba, spr} from '../lib/anim';
import {SANS} from '../lib/fonts';
import {useAbs} from '../lib/time';

/** Storefront mark: a striped awning over a small shop window. Draws itself in. */
const Mark: React.FC<{color: string; p: number; size: number}> = ({color, p, size}) => {
  const dark = mix(color, '#000000', 0.25);
  const stripes = 6;
  const sw = 120 / stripes;
  return (
    <svg width={size * 1.15} height={size} viewBox="0 0 138 120" fill="none" style={{overflow: 'visible', filter: 'drop-shadow(0 12px 18px rgba(80,50,10,0.28))'}}>
      <defs>
        <clipPath id="awn">
          <path d={`M9 8 H129 L138 46 ${Array.from({length: stripes}).map((_, i) => `Q${138 - i * sw * 1.15 - sw * 0.575} 62 ${138 - (i + 1) * sw * 1.15} 46`).join(' ')} Z`} />
        </clipPath>
      </defs>
      <g style={{transform: `translateY(${(1 - p) * -14}px)`, opacity: clamp01(p * 2)}}>
        <g clipPath="url(#awn)">
          {Array.from({length: stripes}).map((_, i) => (
            <rect key={i} x={i * sw * 1.15} y="8" width={sw * 1.15 + 0.5} height="60" fill={i % 2 ? '#FFFDF8' : color} />
          ))}
          <rect x="0" y="8" width="138" height="9" fill={dark} opacity="0.35" />
        </g>
      </g>
      <g style={{opacity: clamp01((p - 0.3) * 2.2), transform: `translateY(${(1 - clamp01(p)) * 16}px)`}}>
        <rect x="16" y="66" width="106" height="52" rx="6" fill={color} />
        <rect x="26" y="76" width="42" height="42" rx="4" fill="#FFFDF8" opacity="0.95" />
        <rect x="78" y="76" width="34" height="42" rx="4" fill={dark} opacity="0.55" />
        <circle cx="105" cy="98" r="2.6" fill="#FFFDF8" />
      </g>
    </svg>
  );
};

export const Cta: React.FC = () => {
  const f = useAbs();
  const m = useManifest();
  const t = themeOf(m, SHOP);
  const lock = spr(f, T.lockup, BOUNCY);
  const draw = clamp01(spr(f, T.lockup, {damping: 18, stiffness: 90, mass: 1}));
  const contact = spr(f, T.contact, SNAP);
  const hit = spr(f, T.finalHit, BOUNCY);
  const ring = ramp(f, T.finalHit, T.finalHit + 20);
  const sweep = ramp(f, T.finalHit, T.finalHit + 18);
  const pulse = f >= T.finalHit ? 1 + 0.045 * (1 - Math.min(1, hit)) * Math.sin(Math.min(1, hit) * Math.PI) + 0.03 * (1 - clamp01(ramp(f, T.finalHit, T.finalHit + 12))) : 1;
  const nameWords = PRODUCT_NAME.split(' ');
  return (
    <AbsoluteFill>
      <Backdrop base={mix(COLORS.cream, COLORS.creamDeep, 0.35)} light={COLORS.warm} blob={t.accent} photo={0.55} />
      <AbsoluteFill>
        <div style={{position: 'absolute', left: 540 - 700 * ring, top: 1300 - 700 * ring, width: 1400 * ring, height: 1400 * ring, borderRadius: '50%', border: `${5 * (1 - ring)}px solid rgba(255,255,255,${0.9 * (1 - ring)})`}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, perspective: 2600}}>
        <Phone pose={phonePose(f)} sheen={ramp(f, 780, 900)} screen={<Screen shop={SHOP} screen="home" scroll={60} />} />
      </div>
      <Title lines={['Tu tienda online', 'en *1_día.*']} inAt={T.t6In} y={585} size={100} accent={t.accent} />
      {/* lockup: designed mark + big product name, lands on the sonic logo */}
      {f >= T.lockup - 1 && (
        <div style={{position: 'absolute', left: 0, width: 1080, top: 252, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${pulse * (0.9 + 0.1 * Math.min(1.2, lock))})`, transformOrigin: '50% 40%'}}>
          <Mark color={t.accent} p={draw} size={150} />
          <div style={{marginTop: 14, fontFamily: SANS, fontWeight: 800, fontSize: 146, lineHeight: 1, letterSpacing: '-0.055em', color: COLORS.ink, display: 'flex', gap: 30}}>
            {nameWords.map((w, i) => {
              const p = clamp01(spr(f, T.lockup + 2 + i * 3, BOUNCY));
              return <span key={i} style={{display: 'inline-block', opacity: clamp01(p * 2), transform: `translateY(${(1 - p) * 60}px) scale(${0.9 + 0.1 * p})`, filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined}}>{w}</span>;
            })}
          </div>
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          left: 60,
          width: 960,
          top: 895,
          textAlign: 'center',
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 46,
          letterSpacing: '-0.02em',
          color: COLORS.ink,
          opacity: clamp01(contact * 1.5),
          transform: `translateY(${(1 - contact) * 30}px)`,
        }}
      >
        <span style={{display: 'inline-block', padding: '20px 40px', borderRadius: 70, background: 'rgba(255,253,248,0.94)', boxShadow: `0 18px 44px rgba(60,35,5,0.3), inset 0 0 0 ${2 + 4 * (1 - sweep)}px ${rgba(t.accent, 0.5)}`}}>{CONTACT_LINE}</span>
      </div>
    </AbsoluteFill>
  );
};
