import React from 'react';
import {W, H} from '../constants';

/** Virtual camera: zoom/rotate about a fixed stage point (ox,oy), then pan by (tx,ty). */
export const Camera: React.FC<{ox?: number; oy?: number; zoom?: number; rot?: number; tx?: number; ty?: number; children: React.ReactNode}> = ({
  ox = W / 2, oy = H / 2, zoom = 1, rot = 0, tx = 0, ty = 0, children,
}) => (
  <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
    <div style={{position: 'absolute', inset: 0, transformOrigin: `${ox}px ${oy}px`, transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${zoom})`}}>
      <div style={{position: 'absolute', inset: 0, perspective: 2600, perspectiveOrigin: '50% 50%'}}>{children}</div>
    </div>
  </div>
);
