import React from 'react';
import {interpolate} from 'remotion';
import {SANS, SERIF} from './fonts';
import {SAFE_TOP, W} from '../constants';
import {spr, ramp, clamp01, rgba, SNAP} from './anim';
import {useAbs} from './time';

/**
 * Kinetic title. Lines are arrays of words; wrap a word in *stars* for the serif italic accent.
 * Words enter one after another (stagger), the whole block leaves at `outAt`.
 */
export const Title: React.FC<{
  lines: string[];
  inAt: number;
  outAt?: number;
  y?: number;
  size?: number;
  color?: string;
  accent?: string;
  stagger?: number;
  align?: 'center' | 'left';
  scrim?: string;
}> = ({lines, inAt, outAt = 99999, y = SAFE_TOP + 20, size = 120, color = '#1F1912', accent = '#B8832B', stagger = 3, align = 'center', scrim}) => {
  const f = useAbs();
  if (f < inAt - 1 || f > outAt + 12) return null;
  const out = ramp(f, outAt, outAt + 8);
  let wi = 0;
  const inK = clamp01(spr(f, inAt, SNAP));
  return (
    <>
    {scrim && <div style={{position: 'absolute', left: 0, top: 0, width: W, height: 680, opacity: inK * (1 - out), background: `linear-gradient(180deg, ${rgba(scrim, 1)} 0%, ${rgba(scrim, 0.97)} 70%, ${rgba(scrim, 0)} 100%)`, pointerEvents: 'none'}} />}
    <div
      style={{
        position: 'absolute',
        left: 60,
        width: W - 120,
        top: y,
        textAlign: align,
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: '-0.045em',
        color,
        opacity: 1 - out,
        transform: `translateY(${-out * 40}px)`,
        filter: out > 0 ? `blur(${out * 10}px)` : undefined,
      }}
    >
      {lines.map((line, li) => (
        <div key={li} style={{whiteSpace: 'nowrap'}}>
          {line.split(' ').map((raw, i) => {
            const isAccent = raw.startsWith('*') && raw.endsWith('*');
            const word = (isAccent ? raw.slice(1, -1) : raw).replace(/_/g, '\u00A0');
            const p = spr(f, inAt + wi * stagger, SNAP);
            wi++;
            const vis = clamp01(p * 1.4);
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  marginRight: '0.24em',
                  opacity: vis,
                  transform: `translateY(${interpolate(p, [0, 1], [70, 0])}px) scale(${interpolate(p, [0, 1], [0.92, 1])})`,
                  filter: p < 1 ? `blur(${(1 - clamp01(p)) * 10}px)` : undefined,
                  ...(isAccent
                    ? {fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, color: accent, fontSize: '1.14em', letterSpacing: '-0.02em', lineHeight: 0.9}
                    : {}),
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      ))}
    </div>
    </>
  );
};
