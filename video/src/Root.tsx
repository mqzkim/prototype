import React from 'react';
import {Composition} from 'remotion';
import {BuildInPublicComposition} from './Composition';
import {FPS, W, H, TOTAL_FRAMES} from './ds';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BuildInPublic"
        component={BuildInPublicComposition}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{}}
      />
    </>
  );
};
