import React from 'react';
import {Composition, Still} from 'remotion';
import {Ad, AdAt} from './Ad';
import {FPS, TOTAL} from './timeline';
import {H, W} from './constants';

// Key moment of every scene, rendered as `npx remotion still src/index.ts still-<name> out/stills/NN-<name>.png`
export const STILLS: {id: string; frame: number}[] = [
  {id: 'hook', frame: 98},
  {id: 'turn', frame: 114},
  {id: 'reveal', frame: 205},
  {id: 'customer', frame: 330},
  {id: 'pickup', frame: 405},
  {id: 'pay', frame: 456},
  {id: 'owner', frame: 540},
  {id: 'sales', frame: 645},
  {id: 'skins', frame: 700},
  {id: 'cta', frame: 885},
];

export const Root: React.FC = () => (
  <>
    <Composition id="Ad" component={Ad} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
    {STILLS.map((s) => (
      <Still key={s.id} id={`still-${s.id}`} component={() => <AdAt frame={s.frame} />} width={W} height={H} />
    ))}
  </>
);
