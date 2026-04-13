// // src/context/homeTokens.js
// // ─────────────────────────────────────────────────────────────────
// // Single source of truth — dùng cho toàn bộ app
// // (HomePage, SearchPage, MovieDetailPage, v.v.)
// // ─────────────────────────────────────────────────────────────────

// // ── Color palette ─────────────────────────────────────────────────
// export const C = {
//   bg:          '#000000',
//   surface:     '#0d0d0d',
//   surfaceMid:  '#111111',
//   surfaceHigh: '#181818',
//   surfaceCard: '#131313',

//   // Alias dùng trong SearchPage (map về cùng giá trị)
//   card: '#111111', // = surfaceMid

//   border:       'rgba(255,255,255,0.06)',
//   borderMid:    'rgba(255,255,255,0.10)',
//   borderBright: 'rgba(255,255,255,0.20)',
//   borderAccent: 'rgba(229,24,30,0.5)',

//   accent:     '#e5181e',
//   accentSoft: 'rgba(229,24,30,0.10)',
//   accentGlow: 'rgba(229,24,30,0.35)',

//   text:    '#f0f0f0',
//   textSub: '#888888',
//   textDim: '#444444',

//   gold:  '#f5c518',
//   green: '#46d369',
// };

// // ── Typography ────────────────────────────────────────────────────
// // DM Serif Display — editorial heading (SearchPage, tiêu đề lớn)
// // Be Vietnam Pro  — display/heading (HomePage, MovieDetailPage)
// // Bebas Neue      — rank numbers (cinematic)
// // DM Sans         — body text (SearchPage)
// // Nunito          — body text (HomePage, MovieDetailPage)
// export const FONT_HEADING  = "'DM Serif Display', serif";   // search headings
// export const FONT_DISPLAY  = "'Be Vietnam Pro', sans-serif"; // home headings
// export const FONT_BEBAS    = "'Bebas Neue', sans-serif";     // rank numbers
// export const FONT_BODY     = "'DM Sans', sans-serif";        // search body
// export const FONT_BODY_ALT = "'Nunito', sans-serif";         // home body
// export const FONT_TITLE = "'DM Serif Display', serif";

// // ── Google Fonts import ───────────────────────────────────────────
// export const GOOGLE_FONTS = `
//   @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&family=Be+Vietnam+Pro:ital,wght@0,600;0,700;0,800;0,900;1,600;1,700;1,800;1,900&family=Bebas+Neue&family=Nunito:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700&display=swap');
//   *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
//   ::-webkit-scrollbar { display: none; }
//   html { scrollbar-width: none; }
// `;

// // ── Search: sort & year options ───────────────────────────────────
// export const SORT_OPTIONS = [
//   { value: 'rating',      label: 'Điểm cao nhất' },
//   { value: 'releaseDate', label: 'Mới nhất'       },
//   { value: 'title',       label: 'Tên A–Z'        },
// ];

// const _currentYear = new Date().getFullYear();
// export const YEAR_OPTIONS = Array.from({ length: 35 }, (_, i) => ({
//   value: String(_currentYear - i),
//   label: String(_currentYear - i),
// }));

// // ── Genre: tiếng Việt & màu accent ───────────────────────────────
// export const GENRE_VI = {
//   'Action':          'HÀNH ĐỘNG',
//   'Adventure':       'PHIÊU LƯU',
//   'Animation':       'HOẠT HÌNH',
//   'Comedy':          'HÀI HƯỚC',
//   'Crime':           'TỘI PHẠM',
//   'Documentary':     'TÀI LIỆU',
//   'Drama':           'CHÍNH KỊCH',
//   'Fantasy':         'VIỄN TƯỞNG',
//   'History':         'LỊCH SỬ',
//   'Horror':          'KINH DỊ',
//   'Music':           'ÂM NHẠC',
//   'Mystery':         'BÍ ẨN',
//   'Romance':         'LÃNG MẠN',
//   'Science Fiction': 'KHOA HỌC VIỄN TƯỞNG',
//   'Sci-Fi':          'KHOA HỌC',
//   'Thriller':        'GIẬT GÂN',
//   'War':             'CHIẾN TRANH',
//   'Western':         'VIỄN TÂY',
// };

// export const GENRE_COLOR = {
//   'Action':          '#dc2626',
//   'Adventure':       '#0891b2',
//   'Animation':       '#7c3aed',
//   'Comedy':          '#d97706',
//   'Crime':           '#6b7280',
//   'Documentary':     '#334155',
//   'Drama':           '#be185d',
//   'Fantasy':         '#5b21b6',
//   'History':         '#92400e',
//   'Horror':          '#166534',
//   'Music':           '#0e7490',
//   'Mystery':         '#4c1d95',
//   'Romance':         '#e11d48',
//   'Science Fiction': '#1d4ed8',
//   'Sci-Fi':          '#1d4ed8',
//   'Thriller':        '#b45309',
//   'War':             '#3f6212',
//   'Western':         '#78350f',
// };