// src/context/adminTokens.js

// ── Typography ────────────────────────────────────────────────────
export const FONT_BODY  = "'Nunito', sans-serif";
export const FONT_TITLE = "'Be Vietnam Pro', sans-serif";

// ── Global Styles & Google Fonts ──────────────────────────────────
export const ADMIN_GOOGLE_FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Nunito:wght@400;500;600;700;800&display=swap');
  
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 5px }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 10px }
  ::-webkit-scrollbar-track { background: transparent }
  button, input, select, textarea { font-family: 'Nunito', sans-serif; }
`;

// ── Dashboard-specific Global CSS (keyframes, scrollbar, fonts) ───
export const DASHBOARD_GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Nunito:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  button, input, select, textarea { font-family: 'Nunito', sans-serif; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }
`;

// ── Color Palette (Toàn bộ token màu Admin) ───────────────────────
export const T = {
  bg:          '#F4F3EF',
  surface:     '#FFFFFF',
  surfaceAlt:  '#FAFAF8',
  surfaceHov:  '#F6F6F3',

  accent:      '#1C5F3A',
  accentLight: '#EAF5EF',
  accentText:  '#155230',

  text:        '#18181B',
  textSub:     '#71717A',
  textMuted:   '#A1A1AA',

  border:      'rgba(0,0,0,0.08)',
  borderMed:   'rgba(0,0,0,0.13)',
  borderFocus: 'rgba(28,95,58,0.4)',

  shadow:      '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd:    '0 4px 16px rgba(0,0,0,0.08)',
  shadowLg:    '0 20px 60px rgba(0,0,0,0.14)',

  gold:        '#D97706',
  red:         '#DC2626',
  blue:        '#2563EB',
};

// ── Dashboard Accent Colors ────────────────────────────────────────
export const ACCENT  = '#1C5F3A'; // content / movie
export const ACCENT2 = '#7C3AED'; // reviews / yearly premium
export const ACCENT3 = '#0891B2'; // neutral
export const ACCENT4 = '#D97706'; // tv show / gold
export const ACCENT5 = '#BE185D'; // users

// ── Chart Color Palette ───────────────────────────────────────────
export const PALETTE = [
  ACCENT, ACCENT3, ACCENT2, ACCENT4, '#DC2626',
  '#BE185D', '#0E7490', '#5B21B6', '#92400E', '#166534',
];

// ── Ad Schedule Constants ─────────────────────────────────────────
export const AD_CONTENT_TYPES = [
  { value: 'Movie',   label: 'Phim' },
  { value: 'TvShow',  label: 'TV Show' },
  { value: 'Episode', label: 'Tập phim' },
];

export const AD_POSITIONS = [
  {
    value: 'PreRoll',
    label: 'Pre-Roll',
    desc: 'Phát trước khi bắt đầu video',
    color: '#2563EB', bg: '#EFF6FF', border: 'rgba(37,99,235,0.2)',
  },
  {
    value: 'MidRoll',
    label: 'Mid-Roll',
    desc: 'Phát giữa chừng, chỉ định thời điểm',
    color: '#D97706', bg: '#FFFBEB', border: 'rgba(217,119,6,0.2)',
  },
  {
    value: 'PostRoll',
    label: 'Post-Roll',
    desc: 'Phát sau khi kết thúc video',
    color: '#7C3AED', bg: '#F5F3FF', border: 'rgba(124,58,237,0.2)',
  },
];

// ── Missing Content Badge Tags ────────────────────────────────────
export const MISSING_TAGS = {
  _missingPoster:  { label: 'Poster',     color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  _missingMain:    { label: 'Phim chính', color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
  _missingTrailer: { label: 'Trailer',    color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  _missingEpisode: { label: 'Tập phim',   color: ACCENT2,   bg: '#F5F3FF', border: '#DDD6FE' },
};