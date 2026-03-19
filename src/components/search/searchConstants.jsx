// src/components/search/searchConstants.js

export const C = {
  bg:          '#000000',
  surface:     '#0a0a0a',
  surfaceHigh: '#111111',
  surfaceMid:  '#181818',
  card:        '#141414',
  border:      'rgba(255,255,255,0.07)',
  borderBright:'rgba(255,255,255,0.15)',
  accent:      '#e5181e',
  accentSoft:  'rgba(229,24,30,0.12)',
  accentGlow:  'rgba(229,24,30,0.3)',
  text:        '#f0f2f8',
  textSub:     '#9299a8',
  textDim:     '#525868',
  gold:        '#f5c518',
  green:       '#46d369',
};

export const FONT_TITLE = "'Be Vietnam Pro', sans-serif";
export const FONT_BODY  = "'Nunito', sans-serif";

export const SORT_OPTIONS = [
  { value: 'rating',      label: '⭐ Điểm cao nhất' },
  { value: 'releaseDate', label: '🗓 Mới nhất' },
  { value: 'title',       label: '🔤 Tên A–Z' },
];

const currentYear = new Date().getFullYear();
export const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}));