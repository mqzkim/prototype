import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, interpolate} from 'remotion';
import {SCENES, TOTAL_FRAMES} from './ds';
import {Intro}           from './scenes/Intro';
import {DashboardTour}   from './scenes/DashboardTour';
import {VideoLLMModels}  from './scenes/VideoLLMModels';
import {PricingRouting}  from './scenes/PricingRouting';
import {DailyAutomation} from './scenes/DailyAutomation';
import {Outro}           from './scenes/Outro';

/** Cross-fade transition overlay between scenes */
const FadeTransition: React.FC<{sceneStart: number; durationFrames?: number}> = ({
  sceneStart, durationFrames = 18,
}) => {
  const frame = useCurrentFrame();
  // Fade-in at scene start, then fade out
  const opacity = interpolate(
    frame,
    [sceneStart, sceneStart + durationFrames],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  if (opacity <= 0) return null;
  return (
    <AbsoluteFill style={{background: '#050508', opacity, zIndex: 999, pointerEvents: 'none'}} />
  );
};

export const BuildInPublicComposition: React.FC = () => {
  const {intro, dashboard, models, pricing, automation, outro} = SCENES;

  return (
    <AbsoluteFill>
      {/* Scene 1: Intro */}
      <Sequence from={intro.start} durationInFrames={intro.dur}>
        <Intro />
      </Sequence>

      {/* Scene 2: Dashboard Tour */}
      <Sequence from={dashboard.start} durationInFrames={dashboard.dur}>
        <DashboardTour />
      </Sequence>

      {/* Scene 3: Video LLM Models */}
      <Sequence from={models.start} durationInFrames={models.dur}>
        <VideoLLMModels />
      </Sequence>

      {/* Scene 4: Pricing + Routing */}
      <Sequence from={pricing.start} durationInFrames={pricing.dur}>
        <PricingRouting />
      </Sequence>

      {/* Scene 5: Daily Automation */}
      <Sequence from={automation.start} durationInFrames={automation.dur}>
        <DailyAutomation />
      </Sequence>

      {/* Scene 6: Outro */}
      <Sequence from={outro.start} durationInFrames={outro.dur}>
        <Outro />
      </Sequence>

      {/* Cross-fade transitions between scenes */}
      <FadeTransition sceneStart={dashboard.start}  />
      <FadeTransition sceneStart={models.start}     />
      <FadeTransition sceneStart={pricing.start}    />
      <FadeTransition sceneStart={automation.start} />
      <FadeTransition sceneStart={outro.start}      />
    </AbsoluteFill>
  );
};
