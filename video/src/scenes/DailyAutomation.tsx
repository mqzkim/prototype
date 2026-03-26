import React from 'react';
import {useCurrentFrame, interpolate, spring, useVideoConfig, AbsoluteFill} from 'remotion';
import {DS, FONT_INTER, FONT_MONO} from '../ds';

const STEPS = [
  {icon: '⏰', label: '09:00 UTC',       sub: 'Cron trigger fires'},
  {icon: '📦', label: 'npm run daily',    sub: '7 data collectors run'},
  {icon: '📊', label: 'Collect Data',     sub: 'stats · quotes · trending · APIs'},
  {icon: '🧪', label: 'Evaluate',         sub: 'RULES.md → 100/100 score'},
  {icon: '✨', label: 'Auto-Improve',     sub: 'Claude Code fixes lowest score'},
  {icon: '🚀', label: 'Git Push → Deploy',sub: 'GitHub Pages updates live'},
];

const StepNode: React.FC<{step: typeof STEPS[0]; index: number; total: number}> = ({step, index, total}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const delay = index * 18;
  const sc = spring({frame: frame - delay, fps, config: {damping: 13, stiffness: 170}});
  const op = interpolate(frame, [delay, delay + 12], [0, 1], {extrapolateRight: 'clamp'});
  const isLast = index === total - 1;

  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1}}>
      {/* Arrow connector (except last) */}
      <div style={{display: 'flex', alignItems: 'center', width: '100%', marginBottom: 12}}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 28,
          background: DS.card, border: `1px solid ${DS.border}`,
          opacity: op, transform: `scale(${sc})`, flexShrink: 0,
          boxShadow: `0 0 20px rgba(139,92,246,0.12)`,
        }}>
          {step.icon}
        </div>
        {!isLast && (
          <div style={{
            flex: 1, height: 2, marginLeft: 4,
            background: `linear-gradient(90deg, ${DS.violet}60, ${DS.cyan}60)`,
            opacity: interpolate(frame, [delay + 8, delay + 20], [0, 1], {extrapolateRight: 'clamp'}),
          }} />
        )}
      </div>
      <div style={{opacity: op, textAlign: 'center' as const}}>
        <div style={{fontSize: 18, fontFamily: FONT_MONO, fontWeight: 700, color: DS.text, marginBottom: 4}}>
          {step.label}
        </div>
        <div style={{fontSize: 15, color: DS.muted, lineHeight: 1.3}}>{step.sub}</div>
      </div>
    </div>
  );
};

export const DailyAutomation: React.FC = () => {
  const frame = useCurrentFrame();

  const headerOp = interpolate(frame, [0, 18], [0, 1], {extrapolateRight: 'clamp'});
  const headerY  = interpolate(frame, [0, 22], [30, 0], {extrapolateRight: 'clamp'});
  const loopOp   = interpolate(frame, [130, 148], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: DS.bg, fontFamily: FONT_INTER, overflow: 'hidden'}}>
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '80%', height: '80%',
        background: 'radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{padding: '80px 60px', display: 'flex', flexDirection: 'column', gap: 52}}>

        {/* Header */}
        <div style={{opacity: headerOp, transform: `translateY(${headerY}px)`}}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 22, color: DS.muted,
            textTransform: 'uppercase' as const, letterSpacing: '0.08em',
            fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{width: 24, height: 2, background: DS.gradient, display: 'inline-block'}} />
            Self-Evolution
          </div>
          <h2 style={{
            fontSize: 68, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05,
            background: DS.gradient, WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Runs itself.<br />Every day.
          </h2>
        </div>

        {/* Flow diagram */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 0,
          background: DS.card, border: `1px solid ${DS.border}`,
          borderRadius: 24, padding: '36px 32px',
        }}>
          {STEPS.map((s, i) => (
            <StepNode key={s.label} step={s} index={i} total={STEPS.length} />
          ))}
        </div>

        {/* Loop badge */}
        <div style={{
          opacity: loopOp,
          display: 'flex', justifyContent: 'center',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 14,
            padding: '16px 36px', borderRadius: 20,
            background: 'rgba(16,185,129,0.08)', border: `1px solid rgba(16,185,129,0.20)`,
            fontFamily: FONT_MONO, fontSize: 24, color: DS.emerald, fontWeight: 700,
          }}>
            <span style={{fontSize: 28}}>♾️</span>
            Evolutionary Loop — Zero Human Input
          </div>
        </div>

        {/* Score badge */}
        <div style={{
          opacity: interpolate(frame, [150, 165], [0, 1], {extrapolateRight: 'clamp'}),
          textAlign: 'center' as const,
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'baseline', gap: 8,
          }}>
            <span style={{
              fontSize: 96, fontWeight: 900, fontFamily: FONT_MONO,
              background: DS.gradient, WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              lineHeight: 1,
            }}>100</span>
            <span style={{fontSize: 40, color: DS.muted, fontFamily: FONT_MONO}}>/100</span>
          </div>
          <div style={{fontSize: 24, color: DS.muted, marginTop: 8, fontFamily: FONT_MONO}}>
            RULES.md evaluation score
          </div>
        </div>

      </div>
    </AbsoluteFill>
  );
};
