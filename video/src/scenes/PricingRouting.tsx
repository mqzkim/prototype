import React from 'react';
import {useCurrentFrame, interpolate, spring, useVideoConfig, AbsoluteFill} from 'remotion';
import {DS, FONT_INTER, FONT_MONO} from '../ds';

const TIERS = [
  {name: 'Free',       price: '$0',   unit: '/mo', gen: '5 gen/mo',    res: '720p',  color: DS.muted,   popular: false},
  {name: 'Starter',    price: '$19',  unit: '/mo', gen: '50 gen/mo',   res: '1080p', color: DS.cyan,    popular: false},
  {name: 'Pro',        price: '$79',  unit: '/mo', gen: '250 gen/mo',  res: '4K',    color: DS.violet,  popular: true},
  {name: 'Enterprise', price: '$299', unit: '/mo', gen: '1000 gen/mo', res: '4K',    color: DS.emerald, popular: false},
];

const PricingCard: React.FC<{tier: typeof TIERS[0]; delay: number}> = ({tier, delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sc = spring({frame: frame - delay, fps, config: {damping: 13, stiffness: 160}});
  const op = interpolate(frame, [delay, delay + 12], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <div style={{
      background: tier.popular ? `rgba(139,92,246,0.10)` : DS.card,
      border: `1px solid ${tier.popular ? DS.violet : DS.border}`,
      borderRadius: 20, padding: '28px 24px', position: 'relative',
      opacity: op, transform: `scale(${sc})`,
      boxShadow: tier.popular ? `0 0 40px rgba(139,92,246,0.15)` : 'none',
    }}>
      {tier.popular && (
        <div style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          background: DS.gradient, borderRadius: 20, padding: '4px 18px',
          fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '0.05em',
          textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const,
        }}>Most Popular</div>
      )}
      <div style={{fontSize: 22, fontWeight: 700, color: DS.muted, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 10}}>
        {tier.name}
      </div>
      <div style={{
        fontSize: 52, fontWeight: 900, letterSpacing: '-0.03em', color: DS.text,
        lineHeight: 1.0, marginBottom: 4,
      }}>
        {tier.price}<span style={{fontSize: 20, color: DS.muted, fontWeight: 500}}>{tier.unit}</span>
      </div>
      <div style={{fontFamily: FONT_MONO, fontSize: 18, color: tier.color, marginBottom: 6}}>{tier.gen}</div>
      <div style={{fontFamily: FONT_MONO, fontSize: 16, color: DS.muted}}>{tier.res} max</div>
    </div>
  );
};

export const PricingRouting: React.FC = () => {
  const frame = useCurrentFrame();

  const headerOp = interpolate(frame, [0, 18], [0, 1], {extrapolateRight: 'clamp'});
  const headerY  = interpolate(frame, [0, 22], [30, 0], {extrapolateRight: 'clamp'});

  const routingOp = interpolate(frame, [115, 130], [0, 1], {extrapolateRight: 'clamp'});
  const routingY  = interpolate(frame, [115, 135], [20, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: DS.bg, fontFamily: FONT_INTER, overflow: 'hidden'}}>
      <div style={{
        position: 'absolute', bottom: '-10%', left: '-10%', width: '55%', height: '50%',
        background: 'radial-gradient(ellipse, rgba(6,182,212,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{padding: '80px 60px', display: 'flex', flexDirection: 'column', gap: 40}}>

        {/* Header */}
        <div style={{opacity: headerOp, transform: `translateY(${headerY}px)`}}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 22, color: DS.muted,
            textTransform: 'uppercase' as const, letterSpacing: '0.08em',
            fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{width: 24, height: 2, background: DS.gradient, display: 'inline-block'}} />
            Pricing
          </div>
          <h2 style={{
            fontSize: 68, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05,
            background: DS.gradient, WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Start Free.<br />Scale Fast.
          </h2>
        </div>

        {/* Pricing 2×2 grid */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8}}>
          {TIERS.map((t, i) => (
            <PricingCard key={t.name} tier={t} delay={20 + i * 16} />
          ))}
        </div>

        {/* Routing strategies */}
        <div style={{
          opacity: routingOp, transform: `translateY(${routingY}px)`,
          background: DS.card, border: `1px solid ${DS.border}`,
          borderRadius: 20, padding: '32px 36px',
        }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 18, color: DS.muted,
            textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 22,
          }}>
            Smart Routing
          </div>
          {[
            {strategy: 'best-quality', models: 'Veo 3.1 → Gemini 3 Pro'},
            {strategy: 'best-value',   models: 'Kling 3.0 → GPT-4o'},
            {strategy: 'cinema',       models: 'Seedance 2.0 → Gemini'},
          ].map((r) => (
            <div key={r.strategy} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '14px 0', borderBottom: `1px solid ${DS.border}`,
            }}>
              <code style={{
                fontFamily: FONT_MONO, fontSize: 20, color: DS.violet,
                background: 'rgba(139,92,246,0.10)', padding: '4px 12px', borderRadius: 8,
                minWidth: 200,
              }}>{r.strategy}</code>
              <span style={{fontSize: 22, color: DS.muted}}>→</span>
              <span style={{fontFamily: FONT_MONO, fontSize: 20, color: DS.text}}>{r.models}</span>
            </div>
          ))}
        </div>

      </div>
    </AbsoluteFill>
  );
};
