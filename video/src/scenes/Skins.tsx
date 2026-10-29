import React from 'react';
import {AbsoluteFill} from 'remotion';
import {COLORS, SKINS} from '../constants';
import {T} from '../timeline';
import {Backdrop} from '../lib/Backdrop';
import {Camera, parallax} from '../lib/Camera';
import {Phone} from '../lib/Phone';
import {Screen} from '../lib/Screen';
import {Title} from '../lib/Title';
import {themeOf, useManifest} from '../lib/captures';
import {phonePose, camera} from '../choreo';
import {useGeo} from '../lib/geo';
import {SNAP, mix, ramp, rgba, spr} from '../lib/anim';
import {useAbs} from '../lib/time';

const SWAPS = [T.skin0, T.swapTeal, T.swapPlum, T.swapNavy, T.swapBase];

export const Skins: React.FC = () => {
  const f = useAbs();
  const m = useManifest();
  const cam = camera(f, useGeo().geo);
  let idx = 0;
  SWAPS.forEach((sf, i) => {
    if (f >= sf) idx = i;
  });
  const cur = SKINS[idx];
  const prev = SKINS[Math.max(0, idx - 1)];
  const tc = themeOf(m, cur.shop);
  const tp = themeOf(m, prev.shop);
  const k = idx === 0 ? 1 : spr(f, SWAPS[idx], SNAP);
  const accent = mix(tp.accent, tc.accent, k);
  const fg = mix(tp.fg, tc.fg, k);
  const base = mix(mix(tp.accent, COLORS.cream, 0.5), mix(tc.accent, COLORS.cream, 0.5), k);
  const lightC = mix(mix(tp.bg, '#FFFFFF', 0.5), mix(tc.bg, '#FFFFFF', 0.5), k);
  const since = f - SWAPS[idx];
  const scroll = cur.screen === 'home' ? Math.min(60, since * 1.4) : 150;
  const ring = ramp(f, SWAPS[idx], SWAPS[idx] + 14);
  return (
    <AbsoluteFill>
      <Backdrop base={base} light={lightC} blob={accent} blobOpacity={0.45} par={parallax(cam)} />
      <AbsoluteFill>
        <div
          style={{
            position: 'absolute',
            left: 540 - 520 * ring,
            top: 1210 - 520 * ring,
            width: 1040 * ring,
            height: 1040 * ring,
            borderRadius: '50%',
            border: `${6 * (1 - ring)}px solid ${rgba('#FFFFFF', 0.8 * (1 - ring))}`,
          }}
        />
      </AbsoluteFill>
      <Camera cam={cam}>
        <Phone pose={phonePose(f)} sheen={ramp(f, 660, 780)} screen={<Screen key={idx} shop={cur.shop} screen={cur.screen} scroll={scroll} stickyH={cur.screen === 'catalog' ? 117 : 0} />} />
      </Camera>
      <Title lines={['Con tus', '*colores.*']} inAt={T.t5In} outAt={T.t5Out} size={124} color={fg} accent={accent} scrim={mix(base, '#FFFFFF', 0.25)} />
    </AbsoluteFill>
  );
};
