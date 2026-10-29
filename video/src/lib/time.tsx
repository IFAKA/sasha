import React, {createContext, useContext} from 'react';
import {useCurrentFrame} from 'remotion';

const StartCtx = createContext(0);
export const SceneStart: React.FC<{start: number; children: React.ReactNode}> = ({start, children}) => (
  <StartCtx.Provider value={start}>{children}</StartCtx.Provider>
);
/** Absolute frame (0..899) from inside any scene, also inside motion-blur sub-frames. */
export const useAbs = () => useCurrentFrame() + useContext(StartCtx);
