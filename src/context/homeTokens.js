// src/context/homeTokens.js
// ─────────────────────────────────────────────────────────────────
// Single source of truth — dùng cho toàn bộ app
// ─────────────────────────────────────────────────────────────────

// ── Color palette ─────────────────────────────────────────────────
export const C = {
  bg:          '#000000',
  surface:     '#0d0d0d',
  surfaceMid:  '#111111',
  surfaceHigh: '#181818',
  surfaceCard: '#131313',

  card: '#111111', // alias = surfaceMid

  border:       'rgba(255,255,255,0.06)',
  borderMid:    'rgba(255,255,255,0.10)',
  borderBright: 'rgba(255,255,255,0.20)',
  borderAccent: 'rgba(229,24,30,0.5)',

  accent:     '#e5181e',
  accentSoft: 'rgba(229,24,30,0.10)',
  accentGlow: 'rgba(229,24,30,0.35)',

  text:    '#f0f0f0',
  textSub: '#888888',
  textDim: '#444444',

  gold:  '#f5c518',
  green: '#46d369',
};

// ── Typography ────────────────────────────────────────────────────
// Be Vietnam Pro — display/heading (toàn app)
// Bebas Neue     — rank numbers (cinematic)
// Nunito         — body text (toàn app)
export const FONT_DISPLAY = "'Be Vietnam Pro', sans-serif";
export const FONT_TITLE   = "'Be Vietnam Pro', sans-serif";
export const FONT_BEBAS   = "'Bebas Neue', sans-serif";
export const FONT_BODY    = "'Nunito', sans-serif";

// ── Google Fonts import ───────────────────────────────────────────
export const GOOGLE_FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,600;0,700;0,800;0,900;1,600;1,700;1,800;1,900&family=Bebas+Neue&family=Nunito:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { display: none; }
  html { scrollbar-width: none; }
`;

// ── Search: sort & year options ───────────────────────────────────
export const SORT_OPTIONS = [
  { value: 'rating',      label: 'Điểm cao nhất' },
  { value: 'releaseDate', label: 'Mới nhất'       },
  { value: 'title',       label: 'Tên A–Z'        },
];

const _currentYear = new Date().getFullYear();
export const YEAR_OPTIONS = Array.from({ length: 35 }, (_, i) => ({
  value: String(_currentYear - i),
  label: String(_currentYear - i),
}));

// ── Genre: tiếng Việt & màu accent ───────────────────────────────
export const GENRE_VI = {
  'Action':          'HÀNH ĐỘNG',
  'Adventure':       'PHIÊU LƯU',
  'Animation':       'HOẠT HÌNH',
  'Comedy':          'HÀI HƯỚC',
  'Crime':           'TỘI PHẠM',
  'Documentary':     'TÀI LIỆU',
  'Drama':           'CHÍNH KỊCH',
  'Fantasy':         'VIỄN TƯỞNG',
  'History':         'LỊCH SỬ',
  'Horror':          'KINH DỊ',
  'Music':           'ÂM NHẠC',
  'Mystery':         'BÍ ẨN',
  'Romance':         'LÃNG MẠN',
  'Science Fiction': 'KHOA HỌC VIỄN TƯỞNG',
  'Sci-Fi':          'KHOA HỌC',
  'Thriller':        'GIẬT GÂN',
  'War':             'CHIẾN TRANH',
  'Western':         'VIỄN TÂY',
};

export const GENRE_COLOR = {
  'Action':          '#dc2626',
  'Adventure':       '#0891b2',
  'Animation':       '#7c3aed',
  'Comedy':          '#d97706',
  'Crime':           '#6b7280',
  'Documentary':     '#334155',
  'Drama':           '#be185d',
  'Fantasy':         '#5b21b6',
  'History':         '#92400e',
  'Horror':          '#166534',
  'Music':           '#0e7490',
  'Mystery':         '#4c1d95',
  'Romance':         '#e11d48',
  'Science Fiction': '#1d4ed8',
  'Sci-Fi':          '#1d4ed8',
  'Thriller':        '#b45309',
  'War':             '#3f6212',
  'Western':         '#78350f',
};

export const COUNTRY_OPTIONS = [
  { value: 'US', label: '🇺🇸 Mỹ' },
  { value: 'KR', label: '🇰🇷 Hàn Quốc' },
  { value: 'JP', label: '🇯🇵 Nhật Bản' },
  { value: 'CN', label: '🇨🇳 Trung Quốc' },
  { value: 'VN', label: '🇻🇳 Việt Nam' },
  { value: 'FR', label: '🇫🇷 Pháp' },
  { value: 'GB', label: '🇬🇧 Anh' },
  { value: 'IN', label: '🇮🇳 Ấn Độ' },
  { value: 'TH', label: '🇹🇭 Thái Lan' },
  { value: 'IT', label: '🇮🇹 Ý' },
  { value: 'DE', label: '🇩🇪 Đức' },
  { value: 'ES', label: '🇪🇸 Tây Ban Nha' },
  { value: 'HK', label: '🇭🇰 Hồng Kông' },
  { value: 'TW', label: '🇹🇼 Đài Loan' },
];