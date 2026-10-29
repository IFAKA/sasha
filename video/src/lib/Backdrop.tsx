import React from 'react';
import {AbsoluteFill} from 'remotion';
import {noise2D} from '@remotion/noise';
import {W, H} from '../constants';
import {rgba} from './anim';
import {useAbs} from './time';

/** Warm studio background: base colour, soft key light, slow bokeh blobs. */
export const Backdrop: React.FC<{base: string; light: string; blob: string; blobOpacity?: number; lightOpacity?: number}> = ({base, light, blob, blobOpacity = 0.35, lightOpacity = 0.8}) => {
  const f = useAbs();
  const blobs = [
    {x: 0.15, y: 0.25, r: 420},
    {x: 0.88, y: 0.45, r: 360},
    {x: 0.3, y: 0.85, r: 480},
  ];
  return (
    <AbsoluteFill style={{background: base}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 60% at 30% 22%, ${rgba(light, lightOpacity)}, ${rgba(light, 0)} 70%)`}} />
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: b.x * W - b.r + noise2D(`bx${i}`, f / 160, 0) * 90,
            top: b.y * H - b.r + noise2D(`by${i}`, f / 160, 1) * 90,
            width: b.r * 2,
            height: b.r * 2,
            borderRadius: '50%',
            background: `radial-gradient(closest-side, ${rgba(blob, blobOpacity)}, ${rgba(blob, 0)})`,
          }}
        />
      ))}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(255,255,255,0.0) 55%, rgba(90,50,10,0.10) 100%)'}} />
    </AbsoluteFill>
  );
};
