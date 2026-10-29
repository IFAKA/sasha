import React from 'react';
import {Composition, Still} from 'remotion';
import {Ad, AdAt} from './Ad';
import {FPS, TOTAL} from './timeline';
import {H, W} from './constants';

// Key moment of every scene, rendered as `npx remotion still src/index.ts still-<name> out/stills/NN-<name>.png`
export const STILLS: {id: string; frame: number}[] = [
  {id: 'hook0', frame: 0},
  {id: 'hook', frame: 98},
  {id: 'turn', frame: 114},
  {id: 'reveal', frame: 200},
  {id: 'medium', frame: 270},
  {id: 'card', frame: 303},
  {id: 'pickup', frame: 405},
  {id: 'pay', frame: 446},
  {id: 'confirm', frame: 468},
  {id: 'whip', frame: 484},
  {id: 'owner', frame: 545},
  {id: 'revenue', frame: 607},
  {id: 'sales', frame: 645},
  {id: 'skinbase', frame: 676},
  {id: 'skinteal', frame: 700},
  {id: 'skinplum', frame: 735},
  {id: 'skinnavy', frame: 770},
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
