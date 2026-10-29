import React from 'react';
import {AbsoluteFill} from 'remotion';
import {COLORS, MAIN_SHOP} from '../constants';
import {T} from '../timeline';
import {Backdrop} from '../lib/Backdrop';
import {Camera, parallax} from '../lib/Camera';
import {Phone} from '../lib/Phone';
import {Screen} from '../lib/Screen';
import {Title} from '../lib/Title';
import {themeOf, useManifest} from '../lib/captures';
import {phonePose, camera} from '../choreo';
import {useGeo} from '../lib/geo';
import {ramp, track, SOFT} from '../lib/anim';
import {useAbs} from '../lib/time';

export const Reveal: React.FC = () => {
  const f = useAbs();
  const m = useManifest();
  const t = themeOf(m, MAIN_SHOP);
  const cam = camera(f, useGeo().geo);
  const scroll = track(f, [[0, 0], [T.t2aIn + 20, 70]], SOFT);
  const flash = 1 - ramp(f, 120, 138);
  return (
    <AbsoluteFill>
      <Backdrop base={COLORS.cream} light={COLORS.warm} blob={t.accent} par={parallax(cam)} />
      <Camera cam={cam}>
        <Phone pose={phonePose(f)} sheen={ramp(f, 120, 240)} screen={<Screen shop={MAIN_SHOP} screen="home" scroll={scroll} />} />
      </Camera>
      <Title lines={['Tu *tienda*', 'online.']} inAt={T.t2aIn} outAt={T.t2aOut} size={124} accent={t.accent} />
      <Title lines={['Con tu', '*marca.*']} inAt={T.t2bIn} outAt={T.t2bOut} size={124} accent={t.accent} />
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 55%, #FFFFFF, ${COLORS.cream})`, opacity: flash}} />
    </AbsoluteFill>
  );
};
