import React from 'react';
import {useCurrentFrame, interpolate, spring, useVideoConfig, AbsoluteFill} from 'remotion';
import {DS, FONT_INTER, FONT_MONO} from '../ds';

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const titleOp = interpolate(frame, [0, 20], [0, 1], {extrapolateRight: 'clamp'});
  const titleY  = interpolate(frame, [0, 24], [30, 0], {extrapolateRight: 'clamp'});

  const urlOp   = interpolate(frame, [35, 52], [0, 1], {extrapolateRight: 'clamp'});
  const badgeSc = spring({frame: frame - 55, fps, config: {damping: 12, stiffness: 160}});
  const badgeOp = interpolate(frame, [55, 68], [0, 1], {extrapolateRight: 'clamp'});

  // Shimmer animation
  const shimmerPos = interpolate(frame, [0, 180], [-200, 200]);

  return (
    <AbsoluteFill
      style={{
        background: DS.bg, fontFamily: FONT_INTER,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glows */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-20%',
        width: '80%', height: '70%',
        background: 'radial-gradient(ellipse, rgba(139,92,246,0.14) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', right: '-15%',
        width: '65%', height: '60%',
        background: 'radial-gradient(ellipse, rgba(6,182,212,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 40, padding: '0 80px', textAlign: 'center' as const,
      }}>

        {/* Main title */}
        <div style={{opacity: titleOp, transform: `translateY(${titleY}px)`}}>
          <h1 style={{
            fontSize: 90, fontWeight: 900, letterSpacing: '-0.03em',
            lineHeight: 1.0, marginBottom: 16,
            background: DS.gradient, WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            BUILD<br />IN PUBLIC
          </h1>
          <p style={{fontSize: 32, color: DS.muted, fontFamily: FONT_MONO, lineHeight: 1.4}}>
            Self-evolving · Cloud-native<br />Daily Dashboard + Video AI
          </p>
        </div>

        {/* Shimmer divider */}
        <div style={{
          width: 240, height: 1, position: 'relative', overflow: 'hidden', opacity: titleOp,
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(6,182,212,0.6), transparent)',
            transform: `translateX(${shimmerPos}%)`,
          }} />
        </div>

        {/* GitHub Pages URL */}
        <div style={{
          opacity: urlOp,
          background: DS.card, border: `1px solid ${DS.border}`,
          borderRadius: 16, padding: '22px 40px',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 24, color: DS.cyan,
            letterSpacing: '0.01em',
          }}>
            github.com/mqzkim/prototype
          </div>
          <div style={{fontSize: 18, color: DS.muted, marginTop: 8}}>
            GitHub Pages · Auto-deployed daily
          </div>
        </div>

        {/* Claude Code badge */}
        <div style={{
          opacity: badgeOp, transform: `scale(${badgeSc})`,
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 32px', borderRadius: 20,
          background: 'rgba(139,92,246,0.10)', border: `1px solid rgba(139,92,246,0.22)`,
          fontFamily: FONT_MONO, fontSize: 22, color: DS.violet, fontWeight: 700,
        }}>
          <span style={{fontSize: 28}}>🤖</span>
          Powered by Claude Code
        </div>

        {/* Stats summary */}
        <div style={{
          opacity: interpolate(frame, [75, 90], [0, 1], {extrapolateRight: 'clamp'}),
          display: 'flex', gap: 36,
        }}>
          {[
            {val: '100', label: 'Score'},
            {val: '6',   label: 'Models'},
            {val: '0',   label: 'Deps'},
          ].map((s) => (
            <div key={s.label} style={{textAlign: 'center' as const}}>
              <div style={{
                fontSize: 52, fontWeight: 900, fontFamily: FONT_MONO,
                background: DS.gradient, WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                lineHeight: 1.0,
              }}>{s.val}</div>
              <div style={{fontSize: 20, color: DS.muted, textTransform: 'uppercase' as const, letterSpacing: '0.06em'}}>{s.label}</div>
            </div>
          ))}
        </div>

      </div>
    </AbsoluteFill>
  );
};
