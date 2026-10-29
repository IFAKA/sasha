import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {SCENES, TOTAL} from './timeline';
import {CapturesProvider} from './lib/captures';
import {SceneStart} from './lib/time';
import {Finish} from './lib/Finish';
import {Hook, Turn} from './scenes/Hook';
import {Reveal} from './scenes/Reveal';
import {Customer} from './scenes/Customer';
import {Owner} from './scenes/Owner';
import {Skins} from './scenes/Skins';
import {Cta} from './scenes/Cta';

const scene = (key: keyof typeof SCENES, C: React.FC) => {
  const [a, b] = SCENES[key];
  return (
    <Sequence key={key} from={a} durationInFrames={b - a} name={key}>
      <SceneStart start={a}>
        <C />
      </SceneStart>
    </Sequence>
  );
};

export const AdBody: React.FC = () => (
  <CapturesProvider>
    <AbsoluteFill style={{background: '#000'}}>
      {scene('hook', Hook)}
      {scene('turn', Turn)}
      {scene('reveal', Reveal)}
      {scene('customer', Customer)}
      {scene('owner', Owner)}
      {scene('skins', Skins)}
      {scene('cta', Cta)}
      <Finish />
    </AbsoluteFill>
  </CapturesProvider>
);

export const Ad: React.FC = () => (
  <>
    <AdBody />
    <Audio src={staticFile('audio/mix.wav')} />
  </>
);

/** Renders the whole ad at one fixed frame, so each scene can be rendered as a still. */
export const AdAt: React.FC<{frame: number}> = ({frame}) => (
  <Sequence from={-frame} durationInFrames={TOTAL + frame}>
    <AdBody />
  </Sequence>
);
export {TOTAL};
