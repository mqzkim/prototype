/** Design system tokens — from DESIGN.md */
export const DS = {
  bg: '#050508',
  surface: '#0c0c14',
  card: 'rgba(14,14,24,0.85)',
  border: 'rgba(255,255,255,0.08)',
  text: '#e2e4ec',
  muted: '#5a5b72',
  violet: '#8b5cf6',
  cyan: '#06b6d4',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  gradient: 'linear-gradient(135deg,#8b5cf6,#06b6d4)',
  glowViolet: 'rgba(139,92,246,0.4)',
  glowCyan: 'rgba(6,182,212,0.4)',
} as const;

export const FONT_INTER = "'Inter', -apple-system, sans-serif";
export const FONT_MONO = "'JetBrains Mono', monospace";

/** Video constants */
export const FPS = 30;
export const W = 1080;
export const H = 1920; // 9:16 shortform (portrait)

/** Scene timing in frames */
export const SCENES = {
  intro:       { start: 0,    dur: 240  }, // 0–8s
  dashboard:   { start: 240,  dur: 420  }, // 8–22s
  models:      { start: 660,  dur: 420  }, // 22–36s
  pricing:     { start: 1080, dur: 300  }, // 36–46s
  automation:  { start: 1380, dur: 240  }, // 46–54s
  outro:       { start: 1620, dur: 180  }, // 54–60s
} as const;

export const TOTAL_FRAMES = 1800; // 60s × 30fps
