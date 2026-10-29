import React from 'react';
import {FRAUNCES} from './fonts';
import {mix} from './anim';

const CARAMEL = '#B8742B';

/** The Horno Lento app icon face: caramel, top light, inner shadow, cream serif monogram. Fills its parent (84 px design size). */
export const AppIconFace: React.FC<{opacity?: number; textOpacity?: number; mono?: number}> = ({opacity = 1, textOpacity = 1, mono = 1}) => (
  <div style={{position: 'absolute', inset: 0, opacity, background: `linear-gradient(170deg, ${mix(CARAMEL, '#FFFFFF', 0.22)}, ${CARAMEL} 45%, ${mix(CARAMEL, '#000000', 0.28)})`, boxShadow: 'inset 0 2px 1px rgba(255,255,255,0.38), inset 0 -4px 8px rgba(70,30,0,0.38), inset 0 0 0 1px rgba(80,40,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 48%)'}} />
    <div style={{fontFamily: FRAUNCES, fontWeight: 600, fontSize: 46 * mono, lineHeight: 1, letterSpacing: '-0.04em', color: '#FFF3DC', textShadow: '0 2px 3px rgba(60,25,0,0.4)', opacity: textOpacity, paddingBottom: 2 * mono}}>HL</div>
  </div>
);
