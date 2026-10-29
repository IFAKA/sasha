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
import {ramp, track, lerp, clamp01, mix, SOFT} from '../lib/anim';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {SANS} from '../lib/fonts';
import {ICON_FRAME_CY, ICON_FRAME_PX, openSpring} from '../choreo';
import {useAbs} from '../lib/time';

/** The app icon at the moment it opens: it grows into the phone shape, then fades to show the real phone. */
const OpenIcon: React.FC<{f: number; zoom: number; qy: number; pose: ReturnType<typeof phonePose>}> = ({f, zoom, qy, pose}) => {
  const e = clamp01(openSpring(f));
  const open = openSpring(f);
  // the phone body in frame pixels (414 x 868 CSS px, scaled by the pose and the camera)
  const bw = 414 * pose.s * zoom;
  const bh = 868 * pose.s * zoom;
  const w = lerp(ICON_FRAME_PX, bw, open);
  const h = lerp(ICON_FRAME_PX, bh, open);
  const cx = 540 + pose.x * zoom;
  const cy = lerp(ICON_FRAME_CY, qy + (pose.y - 270) * zoom, open);
  const r = lerp(0.224 * ICON_FRAME_PX, 62 * pose.s * zoom, e);
  const fade = 1 - ramp(e, 0.72, 0.96);
  if (fade <= 0.001) return null;
  const caramel = '#B8742B';
  const k = w / ICON_FRAME_PX;
  return (
    <div style={{position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h, borderRadius: r, overflow: 'hidden', opacity: fade, background: `linear-gradient(160deg, ${mix(caramel, '#FFFFFF', 0.18)}, ${mix(caramel, '#000000', 0.2)})`, boxShadow: '0 8px 24px rgba(90,50,10,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 44 * (ICON_FRAME_PX / 84) * Math.min(k, 3.2), letterSpacing: '-0.06em', color: '#FFF6E6', paddingRight: 8 * k, opacity: 1 - ramp(e, 0.45, 0.8)}}>HL</div>
    </div>
  );
};

export const Reveal: React.FC = () => {
  const f = useAbs();
  const m = useManifest();
  const t = themeOf(m, MAIN_SHOP);
  const cam = camera(f, useGeo().geo);
  const scroll = track(f, [[0, 0], [T.t2aIn + 20, 70]], SOFT);
  const pose = phonePose(f);
  const stage = (
    <>
      <Camera cam={cam}>
        <Phone pose={pose} sheen={ramp(f, 120, 240)} screen={<Screen shop={MAIN_SHOP} screen="home" scroll={scroll} />} />
      </Camera>
      <OpenIcon f={f} zoom={cam.zoom} qy={cam.qy} pose={pose} />
    </>
  );
  return (
    <AbsoluteFill>
      <Backdrop base={COLORS.cream} light={COLORS.warm} blob={t.accent} par={parallax(cam)} />
      {f < T.appOpen + 16 ? (
        <CameraMotionBlur shutterAngle={200} samples={6}>
          {stage}
        </CameraMotionBlur>
      ) : (
        stage
      )}
      <Title lines={['Tu *tienda*', 'online.']} inAt={T.t2aIn} outAt={T.t2aOut} size={124} accent={t.accent} />
      <Title lines={['Con tu', '*marca.*']} inAt={T.t2bIn} outAt={T.t2bOut} size={124} accent={t.accent} />
    </AbsoluteFill>
  );
};
