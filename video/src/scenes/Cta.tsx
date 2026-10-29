import React from 'react';
import {AbsoluteFill} from 'remotion';
import {COLORS, CONTACT_LINE, MAIN_SHOP as SHOP, PRODUCT_NAME} from '../constants';
import {T} from '../timeline';
import {Backdrop} from '../lib/Backdrop';
import {Camera} from '../lib/Camera';
import {Phone} from '../lib/Phone';
import {Screen} from '../lib/Screen';
import {Title} from '../lib/Title';
import {themeOf, useManifest} from '../lib/captures';
import {phonePose} from '../choreo';
import {BOUNCY, SNAP, clamp01, mix, ramp, spr} from '../lib/anim';
import {SANS, SERIF} from '../lib/fonts';
import {useAbs} from '../lib/time';

export const Cta: React.FC = () => {
  const f = useAbs();
  const m = useManifest();
  const t = themeOf(m, SHOP);
  const lock = spr(f, T.lockup, BOUNCY);
  const contact = spr(f, T.contact, SNAP);
  const hit = spr(f, T.finalHit, BOUNCY);
  const ring = ramp(f, T.finalHit, T.finalHit + 20);
  const sweep = ramp(f, T.finalHit, T.finalHit + 18);
  return (
    <AbsoluteFill>
      <Backdrop base={mix(COLORS.cream, COLORS.creamDeep, 0.35)} light={COLORS.warm} blob={t.accent} />
      <AbsoluteFill>
        <div style={{position: 'absolute', left: 540 - 600 * ring, top: 720 - 600 * ring, width: 1200 * ring, height: 1200 * ring, borderRadius: '50%', border: `${5 * (1 - ring)}px solid rgba(255,255,255,${0.9 * (1 - ring)})`}} />
      </AbsoluteFill>
      <Camera>
        <Phone pose={phonePose(f)} sheen={ramp(f, 780, 900)} screen={<Screen shop={SHOP} screen="home" scroll={60} />} />
      </Camera>
      {/* lockup: placeholder mark + product name */}
      <div style={{position: 'absolute', left: 0, width: 1080, top: 275, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, opacity: clamp01(lock * 1.5), transform: `translateY(${(1 - lock) * 40}px) scale(${1 + 0.05 * (hit - 1 + 1) * (f >= T.finalHit ? 1 : 0)})`}}>
        <div style={{width: 84, height: 84, borderRadius: 24, background: `linear-gradient(135deg, ${t.accent}, ${mix(t.accent, '#000000', 0.25)})`, boxShadow: '0 14px 30px rgba(80,50,10,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontStyle: 'italic', color: '#fff', fontSize: 58}}>T</div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 76, letterSpacing: '-0.045em', color: COLORS.ink}}>{PRODUCT_NAME}</div>
      </div>
      <Title lines={['Tu tienda online', 'en *1_día.*']} inAt={T.t6In} y={1100} size={104} accent={t.accent} />
      <div
        style={{
          position: 'absolute',
          left: 60,
          width: 960,
          top: 1400,
          textAlign: 'center',
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 44,
          letterSpacing: '-0.02em',
          color: mix(COLORS.ink, COLORS.cream, 0.15),
          opacity: clamp01(contact * 1.5),
          transform: `translateY(${(1 - contact) * 30}px)`,
        }}
      >
        <span style={{display: 'inline-block', padding: '16px 34px', borderRadius: 60, background: 'rgba(255,255,255,0.65)', boxShadow: `0 10px 30px rgba(80,50,10,0.15), inset 0 0 0 ${2 + 3 * (1 - sweep)}px ${t.accent}55`}}>{CONTACT_LINE}</span>
      </div>
    </AbsoluteFill>
  );
};
