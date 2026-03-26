import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  AbsoluteFill,
} from 'remotion';
import {DS, FONT_INTER, FONT_MONO} from '../ds';

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Title slides up + fades in
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {extrapolateRight: 'clamp'});
  const titleY = interpolate(frame, [0, 25], [40, 0], {extrapolateRight: 'clamp'});

  // Subtitle fades in after title
  const subOpacity = interpolate(frame, [30, 55], [0, 1], {extrapolateRight: 'clamp'});
  const subY = interpolate(frame, [30, 55], [20, 0], {extrapolateRight: 'clamp'});

  // Badge pops in with spring
  const badgeScale = spring({frame: frame - 60, fps, config: {damping: 12, stiffness: 180}});
  const badgeOpacity = interpolate(frame, [60, 75], [0, 1], {extrapolateRight: 'clamp'});

  // Pulse animation for the dot
  const pulse = interpolate(
    (frame % 60) / 60,
    [0, 0.5, 1],
    [1, 0.4, 1],
  );

  return (
    <AbsoluteFill
      style={{
        background: DS.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT_INTER,
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow blobs */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-15%',
        width: '70%', height: '60%',
        background: 'radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', right: '-15%',
        width: '60%', height: '55%',
        background: 'radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* LIVE badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 28px', borderRadius: 24,
        background: 'rgba(16,185,129,0.10)',
        border: '1px solid rgba(16,185,129,0.22)',
        marginBottom: 40,
        fontFamily: FONT_MONO,
        fontSize: 22,
        fontWeight: 600,
        color: DS.emerald,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
        opacity: badgeOpacity,
        transform: `scale(${badgeScale})`,
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: DS.emerald,
          boxShadow: `0 0 10px ${DS.emerald}`,
          opacity: pulse,
        }} />
        LIVE
      </div>

      {/* Main title */}
      <div style={{
        opacity: titleOpacity,
        transform: `translateY(${titleY}px)`,
        textAlign: 'center',
        padding: '0 60px',
      }}>
        <h1 style={{
          fontSize: 96,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 1.0,
          background: DS.gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 0,
        }}>
          BUILD<br />IN PUBLIC
        </h1>
      </div>

      {/* Shimmer divider */}
      <div style={{
        width: 180, height: 1, margin: '36px auto',
        background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), rgba(6,182,212,0.5), transparent)',
        opacity: subOpacity,
      }} />

      {/* Subtitle */}
      <div style={{
        opacity: subOpacity,
        transform: `translateY(${subY}px)`,
        textAlign: 'center',
        padding: '0 80px',
      }}>
        <p style={{
          fontSize: 36,
          fontFamily: FONT_MONO,
          color: DS.muted,
          letterSpacing: '0.02em',
          lineHeight: 1.4,
        }}>
          Daily Dashboard<br />× Video LLM SaaS
        </p>
      </div>
    </AbsoluteFill>
  );
};
