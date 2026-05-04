// src/context/adminTokens.js

// ── Typography ────────────────────────────────────────────────────
export const FONT_BODY = "'Nunito', sans-serif";
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