// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film, Tag, Star, TrendingUp, Users, ArrowUpRight, Clock,
  Globe, AlertCircle, MessageSquare, UserPlus, BarChart2, Zap,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import movieService  from '../../services/movieService';
import genreService  from '../../services/genreService';
import reviewService from '../../services/reviewService';
import axiosInstance from '../../config/axios';

// ── Design tokens ──────────────────────────────────────────────────────────────
const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const T = {
  bg:          '#F4F3EF',
  surface:     '#FFFFFF',
  surfaceAlt:  '#FAFAF8',
  accent:      '#1C5F3A',
  accentLight: '#EAF5EF',
  accentText:  '#155230',
  text:        '#18181B',
  textSub:     '#71717A',
  textMuted:   '#A1A1AA',
  border:      'rgba(0,0,0,0.08)',
  borderMed:   'rgba(0,0,0,0.13)',
  shadow:      '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd:    '0 4px 16px rgba(0,0,0,0.08)',
  gold:        '#D97706',
  red:         '#DC2626',
};

const PALETTE = [
  '#1C5F3A','#0891b2','#7c3aed','#d97706','#dc2626',
  '#be185d','#0e7490','#5b21b6','#92400e','#166534',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const normalizeArray = (r) => {
  if (!r) return [];
  if (Array.isArray(r)) return r;
  return r.items ?? r.movies ?? r.data?.items ?? r.data ?? [];
};
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

// ── Spinner ───────────────────────────────────────────────────────────────────
const Spin = () => (
  <div style={{ padding: '32px 0', textAlign: 'center' }}>
    <div style={{
      width: 24, height: 24, borderRadius: '50%',
      border: `2.5px solid ${T.accentLight}`, borderTopColor: T.accent,
      animation: 'spin 0.75s linear infinite', margin: '0 auto',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, featured, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.07, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    style={{
      background:    featured ? T.accent : T.surface,
      borderRadius:  16,
      padding:       '22px 24px',
      display:       'flex',
      flexDirection: 'column',
      gap:           16,
      border:        `1px solid ${featured ? 'transparent' : T.border}`,
      boxShadow:     T.shadow,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 11,
        background: featured ? 'rgba(255,255,255,0.18)' : T.accentLight,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} color={featured ? '#fff' : T.accent} strokeWidth={1.8} />
      </div>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: featured ? 'rgba(255,255,255,0.15)' : T.surfaceAlt,
        border: `1px solid ${featured ? 'rgba(255,255,255,0.2)' : T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ArrowUpRight size={13} color={featured ? '#fff' : T.textMuted} strokeWidth={1.8} />
      </div>
    </div>
    <div>
      <p style={{
        fontFamily: FONT, fontSize: 30, fontWeight: 700,
        color: featured ? '#fff' : T.text,
        lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 6,
      }}>
        {value ?? '—'}
      </p>
      <p style={{ fontFamily: FONT, fontSize: 13, color: featured ? 'rgba(255,255,255,0.72)' : T.textSub }}>
        {label}
      </p>
      {sub && (
        <p style={{ fontFamily: FONT, fontSize: 11.5, color: featured ? 'rgba(255,255,255,0.5)' : T.textMuted, marginTop: 3 }}>
          {sub}
        </p>
      )}
    </div>
  </motion.div>
);

// ── Section Card with optional tabs ──────────────────────────────────────────
const SectionCard = ({ title, icon: Icon, children, action, tabs, activeTab, onTabChange, style }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.25 }}
    style={{
      background: T.surface, borderRadius: 16,
      border: `1px solid ${T.border}`, boxShadow: T.shadow,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      ...style,
    }}
  >
    {/* Header */}
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px',
      borderBottom: tabs ? 'none' : `1px solid ${T.border}`,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {Icon && <Icon size={14} color={T.textMuted} strokeWidth={1.7} />}
        <span style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: T.text }}>{title}</span>
      </div>
      {action && !tabs && (
        <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>{action}</span>
      )}
    </div>

    {/* Tabs */}
    {tabs && (
      <div style={{
        display: 'flex', gap: 0, padding: '0 20px',
        borderBottom: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              fontFamily: FONT, fontSize: 12.5, fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? T.accent : T.textMuted,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 14px 10px',
              borderBottom: `2px solid ${activeTab === tab.key ? T.accent : 'transparent'}`,
              marginBottom: -1,
              transition: 'all 0.18s ease',
            }}
          >
            {tab.label}
            {tab.count != null && (
              <span style={{
                marginLeft: 5, fontSize: 11, fontWeight: 600,
                padding: '1px 6px', borderRadius: 99,
                background: activeTab === tab.key ? T.accentLight : T.bg,
                color: activeTab === tab.key ? T.accent : T.textMuted,
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    )}

    {/* Body */}
    <div style={{ padding: '4px 20px 12px', flex: 1, overflow: 'hidden' }}>
      {children}
    </div>
  </motion.div>
);

// ── Bar Chart ─────────────────────────────────────────────────────────────────
const BarChart = ({ data, height = 120 }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  const chartWidth = 500; // Chiều rộng cố định để dễ quản lý tỉ lệ
  const gap = 12;
  const barW = (chartWidth - (data.length * gap)) / data.length;

  return (
    <div style={{ width: '100%', overflow: 'hidden', padding: '10px 0' }}>
      <svg 
        viewBox={`0 -20 ${chartWidth} ${height + 60}`} 
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {data.map((d, i) => {
          const barH = Math.max(4, Math.round((d.value / max) * height));
          const x = i * (barW + gap);
          const y = height - barH;
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={barW} height={barH} rx={4} fill={d.color ?? T.accent} opacity={0.85} />
              <text x={x + barW / 2} y={y - 6} textAnchor="middle"
                fontFamily={FONT} fontSize={10} fontWeight={600} fill={T.textSub}>
                {d.value}
              </text>
              <text
                x={x + barW / 2} y={height + 15} textAnchor="middle"
                fontFamily={FONT} fontSize={9} fill={T.textMuted}
                transform={data.length > 8 ? `rotate(-25, ${x + barW / 2}, ${height + 15})` : undefined}
              >
                {d.label.length > 8 ? d.label.slice(0, 7) + '…' : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── Donut Chart ───────────────────────────────────────────────────────────────
const DonutChart = ({ slices, size = 110 }) => {
  const r = size / 2 - 10;
  const cx = size / 2, cy = size / 2;
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  let cumAngle = -Math.PI / 2;
  const paths = slices.map((slice) => {
    const angle = (slice.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    return (
      <path key={slice.label}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${angle > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z`}
        fill={slice.color} opacity={0.88} stroke={T.surface} strokeWidth={2}
      />
    );
  });
  return (
    <svg width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      {paths}
      <circle cx={cx} cy={cy} r={r * 0.52} fill={T.surface} />
    </svg>
  );
};

// ── Movie Row ─────────────────────────────────────────────────────────────────
const MovieRow = ({ movie, index, badge, badgeColor }) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.05 + index * 0.035 }}
    style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 0', borderBottom: `1px solid ${T.border}`,
    }}
  >
    <div style={{
      width: 30, height: 44, borderRadius: 5, overflow: 'hidden',
      background: T.bg, flexShrink: 0, border: `1px solid ${T.border}`,
    }}>
      {movie.posterUrl
        ? <img src={movie.posterUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Film size={12} color={T.textMuted} />
          </div>
      }
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{
        fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: T.text,
        marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {movie.title}
      </p>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
        {movie.rating != null && (
          <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, color: T.gold }}>
            ★ {typeof movie.rating === 'number' ? movie.rating.toFixed(1) : movie.rating}
          </span>
        )}
        {(movie.releaseDate || movie.year) && (
          <span style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted }}>
            {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : movie.year}
          </span>
        )}
        {movie.originCountry && (
          <span style={{
            fontFamily: FONT, fontSize: 10, color: T.textSub,
            padding: '1px 5px', borderRadius: 99,
            background: T.bg, border: `1px solid ${T.border}`,
          }}>
            {movie.originCountry}
          </span>
        )}
      </div>
    </div>
    {badge && (
      <span style={{
        fontFamily: FONT, fontSize: 10.5, fontWeight: 600,
        color: badgeColor ?? T.accent,
        padding: '2px 7px', borderRadius: 99,
        background: badgeColor ? `${badgeColor}18` : T.accentLight,
        border: `1px solid ${badgeColor ? `${badgeColor}30` : '#c6e8d5'}`,
        flexShrink: 0,
      }}>
        {badge}
      </span>
    )}
  </motion.div>
);

// ── Review Row ────────────────────────────────────────────────────────────────
const ReviewRow = ({ review, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.05 + index * 0.035 }}
    style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: T.accentLight, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.accent }}>
          {(review.userName ?? review.username ?? '?')[0].toUpperCase()}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: T.text }}>
            {review.userName ?? review.username ?? 'Ẩn danh'}
          </span>
          <span style={{ fontFamily: FONT, fontSize: 10.5, color: T.gold, fontWeight: 600, flexShrink: 0 }}>
            {'★'.repeat(review.rating ?? 0)}
            <span style={{ color: T.textMuted }}>{'☆'.repeat(10 - (review.rating ?? 0))}</span>
          </span>
        </div>
        <p style={{
          fontFamily: FONT, fontSize: 12, color: T.textSub, lineHeight: 1.45,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {review.reviewText ?? review.content ?? '(không có nội dung)'}
        </p>
        <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, marginTop: 3 }}>
          {fmtDate(review.createdAt)} {review.movieTitle ? `· ${review.movieTitle}` : ''}
        </p>
      </div>
    </div>
  </motion.div>
);

// ── User Row ──────────────────────────────────────────────────────────────────
const UserRow = ({ user, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.05 + index * 0.035 }}
    style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 0', borderBottom: `1px solid ${T.border}`,
    }}
  >
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: T.accentLight, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: T.accent }}>
        {(user.username ?? user.name ?? user.email ?? '?')[0].toUpperCase()}
      </span>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{
        fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.text,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {user.username ?? user.name ?? '—'}
      </p>
      <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted }}>
        {user.email ?? ''}{user.createdAt ? ' · ' + fmtDate(user.createdAt) : ''}
      </p>
    </div>
    <span style={{
      fontFamily: FONT, fontSize: 10.5, fontWeight: 600,
      color: user.role === 'Admin' ? T.accent : T.textSub,
      padding: '2px 8px', borderRadius: 99, flexShrink: 0,
      background: user.role === 'Admin' ? T.accentLight : T.bg,
      border: `1px solid ${user.role === 'Admin' ? '#c6e8d5' : T.border}`,
    }}>
      {user.role ?? 'User'}
    </span>
  </motion.div>
);

// ── Missing Badge ─────────────────────────────────────────────────────────────
const MissingBadge = ({ movie }) => {
  const tags = [];
  if (movie._missingPoster)  tags.push({ label: 'Poster',   color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' });
  if (movie._missingMain)    tags.push({ label: 'Phim chính', color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' });
  if (movie._missingTrailer) tags.push({ label: 'Trailer',  color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' });
  if (movie._missingClip)    tags.push({ label: 'Clip',     color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' });
  if (movie._missingBehind)  tags.push({ label: 'Hậu trường', color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC' });
  if (tags.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 3 }}>
      {tags.map(t => (
        <span key={t.label} style={{
          fontFamily: FONT, fontSize: 9.5, fontWeight: 700, color: t.color,
          padding: '1px 6px', borderRadius: 99, background: t.bg, border: `1px solid ${t.border}`,
          letterSpacing: '0.02em',
        }}>
          {t.label}
        </span>
      ))}
    </div>
  );
};

// ── Paginated wrapper ─────────────────────────────────────────────────────────
const Paginated = ({ items, pageSize = 6, renderItem }) => {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(items.length / pageSize);
  const slice = items.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <div>
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {slice.map((item, i) => renderItem(item, i))}
        </motion.div>
      </AnimatePresence>
      {totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 10, marginTop: 4,
        }}>
          <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted }}>
            {page + 1} / {totalPages}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                width: 26, height: 26, borderRadius: 7,
                border: `1px solid ${T.border}`, background: T.surface,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: page === 0 ? 'not-allowed' : 'pointer',
                opacity: page === 0 ? 0.4 : 1,
              }}
            >
              <ChevronLeft size={13} color={T.textSub} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              style={{
                width: 26, height: 26, borderRadius: 7,
                border: `1px solid ${T.border}`, background: T.surface,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer',
                opacity: page === totalPages - 1 ? 0.4 : 1,
              }}
            >
              <ChevronRight size={13} color={T.textSub} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const [stats,         setStats]         = useState({ movies: null, genres: null, users: null, reviews: null });
  const [recentMovies,  setRecentMovies]  = useState([]);
  const [trending,      setTrending]      = useState([]);
  const [missing,       setMissing]       = useState([]);
  const [genreChart,    setGenreChart]    = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [newUsers,      setNewUsers]      = useState([]);
  const [ratingDist,    setRatingDist]    = useState([]);
  const [loading,       setLoading]       = useState(true);

  // Tab states
  const [moviesTab,  setMoviesTab]  = useState('recent');   // 'recent' | 'trending' | 'missing'
  const [rightTab,   setRightTab]   = useState('users');    // 'users' | 'genres'
  const [donutSlices, setDonutSlices] = useState([]);

  useEffect(() => {
    const run = async () => {
      try {
        const [movRes, genRes, userRes, trendRes, reviewRes] = await Promise.allSettled([
          movieService.getMovies(1, 500),
          genreService.getAllGenres(),
          axiosInstance.get('/user?pageNumber=1&pageSize=100').catch(() => null),
          movieService.getTrendingMovies().catch(() => []),
          reviewService.getAllReviews(1, 100).catch(() => null),
        ]);

        // Movies
        const movies = movRes.status === 'fulfilled' ? normalizeArray(movRes.value) : [];
        const byDate = [...movies].sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0));
        setRecentMovies(byDate.slice(0, 20));
        // Kiểm tra thiếu dữ liệu dựa trên mảng videos[] (không dùng trailerUrl vì là field riêng)
        const hasVideoType = (m, type) => {
          if (!m.videos || !Array.isArray(m.videos)) return false;
          return m.videos.some(v => (v.videoType ?? v.type ?? '').toLowerCase() === type);
        };
        const mis = movies.filter(m =>
          !m.posterUrl ||
          !hasVideoType(m, 'main') ||
          !hasVideoType(m, 'trailer')
        ).map(m => ({
          ...m,
          _missingPoster:  !m.posterUrl,
          _missingMain:    !hasVideoType(m, 'main'),
          _missingTrailer: !hasVideoType(m, 'trailer'),
          _missingClip:    !hasVideoType(m, 'clip'),
          _missingBehind:  !hasVideoType(m, 'behind'),
        }));
        setMissing(mis.slice(0, 50));

        // Genres
        const genres = genRes.status === 'fulfilled'
          ? (Array.isArray(genRes.value) ? genRes.value : genRes.value?.data ?? genRes.value?.genres ?? [])
          : [];
        const genreCount = {};
        movies.forEach(m => {
          (m.genres ?? []).forEach(g => {
            const name = typeof g === 'string' ? g : g.name ?? g.genreName ?? '';
            if (name) genreCount[name] = (genreCount[name] || 0) + 1;
          });
        });
        if (Object.keys(genreCount).length === 0) {
          genres.forEach(g => {
            const name = g.name ?? g.genreName ?? String(g);
            genreCount[name] = g.movieCount ?? 0;
          });
        }
        const sortedGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 12);
        const gc = sortedGenres.map(([label, value], i) => ({ label, value, color: PALETTE[i % PALETTE.length] }));
        setGenreChart(gc);
        setDonutSlices(gc.slice(0, 6));

        // Users
        const userPayload = userRes.status === 'fulfilled' ? userRes.value : null;
        const totalUsers  = userPayload?.totalCount ?? userPayload?.data?.totalCount ?? null;
        const usersArr    = normalizeArray(userPayload?.data ?? userPayload);
        const sortedUsers = [...usersArr].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setNewUsers(sortedUsers.slice(0, 20));

        // Trending
        const trendArr = trendRes.status === 'fulfilled' ? normalizeArray(trendRes.value) : [];
        setTrending(trendArr.slice(0, 20));

        // Reviews
        const reviewPayload = reviewRes.status === 'fulfilled' ? reviewRes.value : null;
        const reviewsArr    = normalizeArray(reviewPayload?.data ?? reviewPayload);
        const sortedReviews = [...reviewsArr].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setRecentReviews(sortedReviews.slice(0, 20));

        const dist = Array.from({ length: 10 }, (_, i) => ({
          label: String(i + 1),
          value: reviewsArr.filter(r => Math.round(r.rating) === i + 1).length,
          color: i >= 7 ? T.accent : i >= 4 ? '#0891b2' : '#dc2626',
        }));
        setRatingDist(dist);

        setStats({
          movies:  movies.length,
          genres:  genres.length || Object.keys(genreCount).length,
          users:   totalUsers ?? usersArr.length,
          reviews: reviewsArr.length,
        });
      } catch (e) {
        console.error('Dashboard load error', e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const STATS = [
    { icon: Film,          label: 'Tổng phim',  value: stats.movies,  sub: 'trong database', featured: true,  index: 0 },
    { icon: Tag,           label: 'Thể loại',   value: stats.genres,  sub: 'thể loại phim',  featured: false, index: 1 },
    { icon: MessageSquare, label: 'Reviews',    value: stats.reviews, sub: 'đánh giá',        featured: false, index: 2 },
    { icon: Users,         label: 'Người dùng', value: stats.users,   sub: 'đã đăng ký',     featured: false, index: 3 },
  ];

  // Derived tab content for movies card
  const moviesTabContent = {
    recent:   recentMovies,
    trending: trending,
    missing:  missing,
  };

  return (
    <div style={{ padding: '28px 28px 64px', maxWidth: 1400, fontFamily: FONT }}>

      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted, marginBottom: 2 }}>Chào mừng trở lại 👋</p>
        <h2 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>
          Tổng quan hệ thống
        </h2>
      </motion.div>

      {/* ── Row 0: Stat Cards (4 equal cols) ───────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14, marginBottom: 16,
      }}>
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* ── Row 1: Genre bar chart (3/5) + Reviews dist (2/5) ─────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '3fr 2fr',
        gap: 14, marginBottom: 14,
      }}>

        {/* Genre bar chart */}
        <SectionCard title="Phân bố thể loại phim" icon={BarChart2} action={`${genreChart.length} thể loại`}>
          {loading
            ? <Spin />
            : genreChart.length > 0
              ? <div style={{ paddingTop: 10 }}><BarChart data={genreChart} height={130} /></div>
              : <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted, padding: '20px 0' }}>Chưa có dữ liệu</p>
          }
        </SectionCard>

        {/* Rating distribution */}
        <SectionCard title="Phân bố điểm đánh giá" icon={Zap} action="1–10 sao">
          {loading
            ? <Spin />
            : ratingDist.some(d => d.value > 0)
              ? (
                <div style={{ paddingTop: 10 }}>
                  <BarChart data={ratingDist} height={110} />
                  <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 6 }}>
                    {[
                      { label: 'Thấp (1–4)',  color: '#dc2626' },
                      { label: 'Trung (5–7)', color: '#0891b2' },
                      { label: 'Cao (8–10)',  color: T.accent  },
                    ].map(l => (
                      <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 7, height: 7, borderRadius: 2, background: l.color }} />
                        <span style={{ fontFamily: FONT, fontSize: 10, color: T.textMuted }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
              : <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted, padding: '20px 0' }}>Chưa có dữ liệu</p>
          }
        </SectionCard>
      </div>

      {/* ── Row 2: Movies (tabbed, 1/2) + Reviews + Users/Genres (each 1/4) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 14, marginBottom: 14,
      }}>

        {/* Movies card with tabs */}
        <SectionCard
          title="Phim"
          icon={Film}
          tabs={[
            { key: 'recent',   label: 'Mới nhất',      count: recentMovies.length },
            { key: 'trending', label: 'Trending',       count: trending.length },
            { key: 'missing',  label: 'Thiếu dữ liệu', count: missing.length },
          ]}
          activeTab={moviesTab}
          onTabChange={setMoviesTab}
        >
          {loading
            ? <Spin />
            : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={moviesTab}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {moviesTab === 'missing'
                    ? (
                      <Paginated
                        items={missing}
                        pageSize={6}
                        renderItem={(m, i) => (
                          <div key={m.id ?? i} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            padding: '9px 0', borderBottom: `1px solid ${T.border}`,
                          }}>
                            <div style={{
                              width: 28, height: 40, borderRadius: 5,
                              background: m._missingPoster ? '#fef2f2' : T.bg,
                              flexShrink: 0,
                              border: `1px solid ${m._missingPoster ? '#fecaca' : T.border}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              overflow: 'hidden',
                            }}>
                              {m.posterUrl
                                ? <img src={m.posterUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <Film size={12} color="#dc2626" />
                              }
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: T.text,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4,
                              }}>
                                {m.title}
                              </p>
                              <MissingBadge movie={m} />
                            </div>
                          </div>
                        )}
                      />
                    )
                    : (
                      <Paginated
                        items={moviesTabContent[moviesTab]}
                        pageSize={6}
                        renderItem={(m, i) => (
                          <MovieRow
                            key={m.id ?? i} movie={m} index={i}
                            badge={moviesTab === 'trending' ? `#${moviesTabContent[moviesTab].indexOf(m) + 1}` : undefined}
                            badgeColor={
                              moviesTab === 'trending'
                                ? (i === 0 ? '#D97706' : i === 1 ? '#71717A' : i === 2 ? '#92400e' : undefined)
                                : undefined
                            }
                          />
                        )}
                      />
                    )
                  }
                </motion.div>
              </AnimatePresence>
            )
          }
        </SectionCard>

        {/* Reviews card */}
        <SectionCard title="Đánh giá gần đây" icon={Star} action={`${stats.reviews ?? 0} tổng`}>
          {loading
            ? <Spin />
            : recentReviews.length > 0
              ? <Paginated items={recentReviews} pageSize={5} renderItem={(r, i) => (
                  <ReviewRow key={r.id ?? r.reviewId ?? i} review={r} index={i} />
                )} />
              : <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted, padding: '20px 0' }}>Chưa có đánh giá</p>
          }
        </SectionCard>

        {/* Users + Genre donut tabbed */}
        <SectionCard
          title="Người dùng & Thể loại"
          icon={Users}
          tabs={[
            { key: 'users',  label: 'Người dùng mới', count: newUsers.length },
            { key: 'genres', label: 'Top thể loại',   count: donutSlices.length },
          ]}
          activeTab={rightTab}
          onTabChange={setRightTab}
        >
          {loading
            ? <Spin />
            : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={rightTab}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {rightTab === 'users'
                    ? (
                      <Paginated items={newUsers} pageSize={6} renderItem={(u, i) => (
                        <UserRow key={u.id ?? u.userId ?? i} user={u} index={i} />
                      )} />
                    )
                    : (
                      <div style={{ paddingTop: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                          <DonutChart slices={donutSlices} size={120} />
                        </div>
                        {donutSlices.map((d) => (
                          <div key={d.label} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '6px 0', borderBottom: `1px solid ${T.border}`,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                              <span style={{ fontFamily: FONT, fontSize: 12, color: T.textSub }}>{d.label}</span>
                            </div>
                            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: T.text }}>{d.value}</span>
                          </div>
                        ))}
                      </div>
                    )
                  }
                </motion.div>
              </AnimatePresence>
            )
          }
        </SectionCard>
      </div>

    </div>
  );
}