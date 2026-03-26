import React from 'react';
import {useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill} from 'remotion';
import {DS, FONT_INTER, FONT_MONO} from '../ds';

const StatCard: React.FC<{label: string; value: string; color: string; delay: number}> = ({
  label, value, color, delay,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sc = spring({frame: frame - delay, fps, config: {damping: 14, stiffness: 160}});
  const op = interpolate(frame, [delay, delay + 15], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <div style={{
      background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 20,
      padding: '32px 24px', textAlign: 'center', flex: 1,
      opacity: op, transform: `scale(${sc})`,
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        fontSize: 56, fontWeight: 800, fontFamily: FONT_MONO,
        color, textShadow: `0 0 24px ${color}66`,
        lineHeight: 1.1, marginBottom: 10,
      }}>{value}</div>
      <div style={{
        fontSize: 18, color: DS.muted, textTransform: 'uppercase' as const,
        letterSpacing: '0.08em', fontWeight: 600,
      }}>{label}</div>
    </div>
  );
};

const TrendingRow: React.FC<{rank: string; name: string; stars: string; delay: number}> = ({
  rank, name, stars, delay,
}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [delay, delay + 12], [0, 1], {extrapolateRight: 'clamp'});
  const x = interpolate(frame, [delay, delay + 18], [-30, 0], {extrapolateRight: 'clamp'});
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 20,
      padding: '18px 0', borderBottom: `1px solid ${DS.border}`,
      opacity: op, transform: `translateX(${x}px)`,
    }}>
      <span style={{fontFamily: FONT_MONO, fontSize: 22, color: DS.cyan, minWidth: 36, fontWeight: 700}}>{rank}</span>
      <span style={{flex: 1, fontSize: 26, fontWeight: 600, color: DS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const}}>{name}</span>
      <span style={{fontFamily: FONT_MONO, fontSize: 20, color: DS.amber}}>★ {stars}</span>
    </div>
  );
};

export const DashboardTour: React.FC = () => {
  const frame = useCurrentFrame();

  const sectionOp = (start: number) =>
    interpolate(frame, [start, start + 15], [0, 1], {extrapolateRight: 'clamp'});
  const sectionY = (start: number) =>
    interpolate(frame, [start, start + 20], [24, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: DS.bg, fontFamily: FONT_INTER, overflow: 'hidden'}}>
      {/* Ambient */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-10%', width: '50%', height: '50%',
        background: 'radial-gradient(ellipse, rgba(6,182,212,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{padding: '80px 60px', display: 'flex', flexDirection: 'column', gap: 48}}>

        {/* Section label */}
        <div style={{opacity: sectionOp(0), transform: `translateY(${sectionY(0)}px)`}}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            fontFamily: FONT_MONO, fontSize: 22, color: DS.muted,
            textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 600,
            marginBottom: 28,
          }}>
            <span style={{width: 24, height: 2, background: DS.gradient, display: 'inline-block'}} />
            Daily Dashboard
          </div>
          <h2 style={{
            fontSize: 72, fontWeight: 900, letterSpacing: '-0.03em',
            background: DS.gradient, WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            lineHeight: 1.05,
          }}>Build<br />in Public</h2>
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'flex', gap: 20,
          opacity: sectionOp(10), transform: `translateY(${sectionY(10)}px)`,
        }}>
          <StatCard label="Days Active" value="42" color={DS.cyan}    delay={15} />
          <StatCard label="Commits"     value="128" color={DS.emerald} delay={22} />
          <StatCard label="Lines"       value="8.4k" color={DS.violet} delay={29} />
          <StatCard label="Files"       value="61"  color={DS.amber}  delay={36} />
        </div>

        {/* Quote card */}
        <div style={{
          background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 20,
          padding: '36px 40px', backdropFilter: 'blur(12px)',
          opacity: sectionOp(55), transform: `translateY(${sectionY(55)}px)`,
        }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 18, color: DS.muted,
            textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 16,
          }}>Quote of the Day</div>
          <p style={{fontSize: 30, fontStyle: 'italic', color: DS.text, lineHeight: 1.5, marginBottom: 14}}>
            "The best way to predict the future is to build it."
          </p>
          <span style={{fontFamily: FONT_MONO, fontSize: 22, color: DS.violet}}>— Alan Kay</span>
        </div>

        {/* Trending */}
        <div style={{
          background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 20,
          padding: '36px 40px', backdropFilter: 'blur(12px)',
          opacity: sectionOp(90), transform: `translateY(${sectionY(90)}px)`,
        }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 18, color: DS.muted,
            textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 20,
          }}>GitHub Trending</div>
          <TrendingRow rank="#1" name="vercel/ai"             stars="12.4k" delay={100} />
          <TrendingRow rank="#2" name="anthropics/claude-code" stars="8.9k"  delay={112} />
          <TrendingRow rank="#3" name="remotion-dev/remotion"  stars="6.1k"  delay={124} />
        </div>

      </div>
    </AbsoluteFill>
  );
};
