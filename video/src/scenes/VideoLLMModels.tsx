import React from 'react';
import {useCurrentFrame, interpolate, spring, useVideoConfig, AbsoluteFill} from 'remotion';
import {DS, FONT_INTER, FONT_MONO} from '../ds';

const MODELS = [
  {name: 'Veo 3.1',        provider: 'Google DeepMind',  tag: 'Photorealism · 4K',  color: DS.cyan},
  {name: 'Kling 3.0',      provider: 'Kuaishou',         tag: 'Best Motion · Low $', color: DS.emerald},
  {name: 'Seedance 2.0',   provider: 'ByteDance',        tag: 'Cinema Quality',      color: DS.violet},
  {name: 'Runway Gen-4.5', provider: 'Runway',           tag: 'Creator Friendly',   color: DS.amber},
  {name: 'Gemini 3 Pro',   provider: 'Google',           tag: 'Understanding SOTA',  color: DS.cyan},
  {name: 'GPT-4o',         provider: 'OpenAI',           tag: 'Multimodal Reasoning',color: DS.emerald},
];

const ModelCard: React.FC<{model: typeof MODELS[0]; delay: number}> = ({model, delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sc = spring({frame: frame - delay, fps, config: {damping: 13, stiffness: 170}});
  const op = interpolate(frame, [delay, delay + 12], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <div style={{
      background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 20,
      padding: '32px 28px', opacity: op, transform: `scale(${sc})`,
      backdropFilter: 'blur(12px)',
      boxShadow: `0 0 0 0 transparent`,
    }}>
      <div style={{
        display: 'inline-block', padding: '6px 14px', borderRadius: 8, marginBottom: 16,
        background: `${model.color}18`, border: `1px solid ${model.color}30`,
        fontSize: 18, fontFamily: FONT_MONO, color: model.color,
        fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em',
      }}>
        {model.tag}
      </div>
      <div style={{fontSize: 34, fontWeight: 800, color: DS.text, marginBottom: 8, lineHeight: 1.1}}>
        {model.name}
      </div>
      <div style={{fontSize: 22, color: DS.muted, fontFamily: FONT_MONO}}>
        {model.provider}
      </div>
    </div>
  );
};

export const VideoLLMModels: React.FC = () => {
  const frame = useCurrentFrame();

  const headerOp = interpolate(frame, [0, 18], [0, 1], {extrapolateRight: 'clamp'});
  const headerY  = interpolate(frame, [0, 22], [30, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: DS.bg, fontFamily: FONT_INTER, overflow: 'hidden'}}>
      {/* Ambient */}
      <div style={{
        position: 'absolute', top: '-5%', left: '-10%', width: '60%', height: '50%',
        background: 'radial-gradient(ellipse, rgba(139,92,246,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{padding: '80px 60px', display: 'flex', flexDirection: 'column', gap: 44}}>

        {/* Header */}
        <div style={{opacity: headerOp, transform: `translateY(${headerY}px)`}}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 22, color: DS.muted,
            textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 600,
            marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{width: 24, height: 2, background: DS.gradient, display: 'inline-block'}} />
            Video LLM SaaS
          </div>
          <h2 style={{
            fontSize: 68, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05,
            background: DS.gradient, WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            6 Models.<br />One API.
          </h2>
          <p style={{fontSize: 26, color: DS.muted, marginTop: 16, lineHeight: 1.5}}>
            Smart routing picks the best model<br />for every task automatically.
          </p>
        </div>

        {/* Models grid — 2 columns */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20}}>
          {MODELS.map((m, i) => (
            <ModelCard key={m.name} model={m} delay={25 + i * 14} />
          ))}
        </div>

        {/* Routing badge */}
        <div style={{
          opacity: interpolate(frame, [110, 125], [0, 1], {extrapolateRight: 'clamp'}),
          display: 'flex', gap: 16, flexWrap: 'wrap' as const,
        }}>
          {['best-quality', 'best-value', 'best-motion', 'cinema'].map((s) => (
            <div key={s} style={{
              padding: '10px 22px', borderRadius: 12,
              background: 'rgba(139,92,246,0.10)', border: `1px solid rgba(139,92,246,0.20)`,
              fontFamily: FONT_MONO, fontSize: 20, color: DS.violet, fontWeight: 600,
            }}>
              {s}
            </div>
          ))}
        </div>

      </div>
    </AbsoluteFill>
  );
};
