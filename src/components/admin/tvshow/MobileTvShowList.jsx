// src/components/admin/tvshow/MobileTvShowList.jsx
// Danh sách TV show dạng card cho mobile (< 768px) — cùng logic với các nút trong bảng desktop,
// cùng vai trò với user/MobileUserList của trang Người dùng.
import React from 'react';
import { motion } from 'framer-motion';
import { Star, Tv, Eye, Pencil, Trash2, AlertCircle, RefreshCw, Search } from 'lucide-react';
import { T, FONT_BODY as FONT } from '../../../context/adminTokens';
import { PremiumBadge, UpcomingBadge, PremiumToggle, COUNTRY_FLAG } from './tvShowBadges';
import { fmtDate } from '../../../helper/format';

const shimmer = {
  background: `linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.surfaceHov} 50%, ${T.surfaceAlt} 75%)`,
  backgroundSize: '400px 100%',
  animation: 'shimmer 1.4s infinite',
};

function IconBtn({ icon: Icon, title, onClick, color, bg, border }) {
  return (
    <button
      type="button"
      data-icon-btn=""
      title={title}
      aria-label={title}
      onClick={onClick}
      style={{
        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
        background: bg, border: `1px solid ${border}`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}
    >
      <Icon size={15} />
    </button>
  );
}

function SkeletonCard() {
  return (
    <div style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
      <div style={{ width: 58, height: 84, borderRadius: 8, flexShrink: 0, ...shimmer }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
        <div style={{ height: 14, width: '70%', borderRadius: 6, ...shimmer }} />
        <div style={{ height: 11, width: '45%', borderRadius: 6, ...shimmer }} />
        <div style={{ height: 11, width: '60%', borderRadius: 6, ...shimmer }} />
      </div>
    </div>
  );
}

function ShowCard({ s, index, pending, onView, onEdit, onDelete, onTogglePremium }) {
  const genres = s.genres ?? [];
  const meta = [
    s.rating ? (
      <span key="r" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 700, color: T.gold }}>
        <Star size={11} style={{ fill: T.gold, color: T.gold }} /> {Number(s.rating).toFixed(1)}
      </span>
    ) : null,
    s.year ? <span key="y">{s.year}</span> : null,
    s.originCountry ? <span key="c">{COUNTRY_FLAG[s.originCountry] ?? '🌐'} {s.originCountry}</span> : null,
    s.numberOfSeasons != null ? (
      <span key="s" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        <Tv size={11} color={T.textMuted} /> {s.numberOfSeasons} mùa
      </span>
    ) : null,
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.025 }}
      style={{ borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden' }}
    >
      {/* Vùng chạm chính → mở chi tiết */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onView(s)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView(s); } }}
        style={{ display: 'flex', gap: 12, padding: 12, cursor: 'pointer' }}
      >
        <div style={{ width: 58, height: 84, borderRadius: 8, overflow: 'hidden', background: T.bg, flexShrink: 0, border: `1px solid ${T.border}` }}>
          {s.posterUrl && <img src={s.posterUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{
            fontFamily: FONT, fontSize: 14, fontWeight: 700, color: T.text, margin: 0, lineHeight: 1.35,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {s.title}
          </p>

          {(s.isPremium || s.isUpcoming) && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {s.isUpcoming && <UpcomingBadge />}
              {s.isPremium && <PremiumBadge />}
            </div>
          )}

          {meta.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 12px', fontFamily: FONT, fontSize: 12, color: T.textSub }}>
              {meta}
            </div>
          )}

          <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, margin: 0 }}>
            {s.isUpcoming && s.firstAirDate ? <span style={{ color: '#3B82F6' }}>Phát sóng {fmtDate(s.firstAirDate)} · </span> : null}
            {s.status ?? ''}{s.tmdbId ? `${s.status ? ' · ' : ''}TMDB #${s.tmdbId}` : ''}
          </p>
        </div>
      </div>

      {genres.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', padding: '0 12px 10px' }}>
          {genres.slice(0, 3).map(g => (
            <span key={g} style={{ fontFamily: FONT, fontSize: 11, color: T.textSub, padding: '2px 8px', borderRadius: 5, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>{g}</span>
          ))}
          {genres.length > 3 && <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, alignSelf: 'center' }}>+{genres.length - 3}</span>}
        </div>
      )}

      {/* Thanh thao tác */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 12px', borderTop: `1px solid ${T.border}`, background: T.surfaceAlt }}>
        <PremiumToggle isPremium={!!s.isPremium} loading={pending} onClick={() => onTogglePremium(s)} />
        <div style={{ display: 'flex', gap: 6 }}>
          <IconBtn icon={Eye}    title="Xem chi tiết" onClick={() => onView(s)}   color={T.textSub} bg={T.surface} border={T.border} />
          <IconBtn icon={Pencil} title="Chỉnh sửa"    onClick={() => onEdit(s)}   color={T.blue}    bg="rgba(37,99,235,0.07)" border="rgba(37,99,235,0.2)" />
          <IconBtn icon={Trash2} title="Xóa"          onClick={() => onDelete(s)} color={T.red}     bg="#FEF2F2" border="rgba(220,38,38,0.2)" />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Props:
 *   shows, loading, isError, errorMessage, onRetry, dim, isSearching, pendingIds (Set)
 *   onView / onEdit / onDelete (show) => void,  onTogglePremium (show) => void
 */
export default function MobileTvShowList({
  shows, loading, isError, errorMessage, onRetry, dim, isSearching, pendingIds,
  onView, onEdit, onDelete, onTogglePremium,
}) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14 }}>
        <AlertCircle size={24} color={T.red} style={{ margin: '0 auto 8px' }} />
        <p style={{ fontFamily: FONT, fontSize: 13, color: T.textSub, margin: '0 0 12px' }}>{errorMessage}</p>
        <button
          type="button" onClick={onRetry}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 40, padding: '0 16px', borderRadius: 9, background: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textSub }}
        >
          <RefreshCw size={14} /> Thử lại
        </button>
      </div>
    );
  }

  if (shows.length === 0) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14 }}>
        <Search size={22} color={T.textMuted} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
        <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted, margin: 0 }}>
          {isSearching ? 'Không tìm thấy TV show phù hợp' : 'Chưa có TV show nào'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: dim ? 0.55 : 1, transition: 'opacity 0.15s' }}>
      {shows.map((s, i) => (
        <ShowCard
          key={s.id} s={s} index={i}
          pending={pendingIds?.has(s.id)}
          onView={onView} onEdit={onEdit} onDelete={onDelete} onTogglePremium={onTogglePremium}
        />
      ))}
    </div>
  );
}