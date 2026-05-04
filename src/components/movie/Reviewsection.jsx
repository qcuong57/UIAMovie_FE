// src/components/movie/shared/ReviewSection.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Edit2, Trash2, AlertTriangle, ChevronDown, LogIn, Tv, Film } from 'lucide-react';
import reviewService from '../../services/reviewService';
import { C } from './ui/movieConstants';
import SectionTitle from './ui/SectionTitle';
import Skeleton from './ui/Skeleton';

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });

// ── StarPicker ─────────────────────────────────────────────────────────────
const StarPicker = ({ value, onChange, size = 28 }) => {
  const isMobile = useIsMobile();
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: isMobile ? 2 : 4, flexWrap: 'wrap' }}>
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <button key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
        >
          <Star
            size={size}
            style={{
              color: n <= (hovered || value) ? C.gold : 'rgba(255,255,255,0.15)',
              fill:  n <= (hovered || value) ? C.gold : 'none',
              transition: 'all 0.1s',
            }}
          />
        </button>
      ))}
      {value > 0 && (
        <span style={{
          alignSelf: 'center', marginLeft: 8,
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: 15, fontWeight: 700, color: C.gold,
        }}>
          {value}/10
        </span>
      )}
    </div>
  );
};

// ── AvatarCircle ───────────────────────────────────────────────────────────
const AvatarCircle = ({ name, avatarUrl, size = 38 }) => {
  const [err, setErr] = useState(false);
  const color = `hsl(${((name?.charCodeAt(0) || 65) * 17) % 360}, 38%, 26%)`;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, overflow: 'hidden', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Be Vietnam Pro', sans-serif",
      fontSize: size * 0.42, fontWeight: 800, color: '#fff',
    }}>
      {avatarUrl && !err
        ? <img src={avatarUrl} alt={name} onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : name?.charAt(0)?.toUpperCase() || '?'
      }
    </div>
  );
};

// ── Toast ──────────────────────────────────────────────────────────────────
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  const bg   = type === 'success' ? 'rgba(34,197,94,0.12)'  : 'rgba(239,68,68,0.12)';
  const border = type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)';
  const color  = type === 'success' ? '#4ade80'             : '#f87171';
  const icon   = type === 'success' ? '✓'                   : '✕';
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,   scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.22 }}
      style={{
        position: 'fixed', top: 72, right: 20, zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 18px', borderRadius: 10,
        background: bg, border: `1px solid ${border}`,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        maxWidth: 340,
      }}
    >
      <span style={{ fontSize: 16, color, fontWeight: 700 }}>{icon}</span>
      <span style={{
        fontFamily: "'Nunito', sans-serif", fontSize: 13.5,
        fontWeight: 600, color: '#fff',
      }}>{message}</span>
      <button onClick={onClose} style={{
        marginLeft: 'auto', background: 'none', border: 'none',
        cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 14,
        padding: '0 0 0 8px', lineHeight: 1,
      }}>✕</button>
    </motion.div>
  );
};

// ── ReviewCard ─────────────────────────────────────────────────────────────
const ReviewCard = ({ review, currentUserId, onEdit, onDelete, index, episodeLabel }) => {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  const isLong = (review.reviewText?.length || 0) > 280;
  const isOwn  = currentUserId && review.userId === currentUserId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      style={{
        padding: '20px 22px', background: C.card,
        borderRadius: 12, border: `1px solid ${C.border}`,
        marginBottom: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AvatarCircle name={review.userName} avatarUrl={review.userAvatar} />
          <div>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>
              {review.userName || 'Ẩn danh'}
              {isOwn && (
                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: C.accent,
                  background: C.accentSoft, padding: '1px 7px', borderRadius: 10 }}>
                  Bạn
                </span>
              )}
            </p>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.textDim }}>
              {fmtDate(review.createdAt)}
              {review.updatedAt && <span style={{ marginLeft: 6, fontStyle: 'italic' }}>(đã chỉnh)</span>}
            </p>
            {/* Hiển thị nhãn tập nếu review theo tập */}
            {episodeLabel && (
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.accent, marginTop: 2 }}>
                {episodeLabel}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 20,
            background: C.accentSoft, border: `1px solid ${C.accentGlow}`,
          }}>
            <Star size={11} style={{ fill: C.gold, color: C.gold }} />
            <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 13, fontWeight: 700, color: C.gold }}>
              {review.rating}
            </span>
          </div>

          {review.isSpoiler && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 20,
              background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.25)' }}>
              <AlertTriangle size={10} style={{ color: C.gold }} />
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, color: C.gold, fontWeight: 600 }}>
                Spoiler
              </span>
            </div>
          )}

          {isOwn && (
            <div style={{ display: 'flex', gap: isMobile ? 2 : 4 }}>
              <button onClick={() => onEdit(review)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textDim, padding: 4,
                  display: 'flex', alignItems: 'center', borderRadius: 6, transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = C.text}
                onMouseLeave={e => e.currentTarget.style.color = C.textDim}
              >
                <Edit2 size={14} />
              </button>
              <button onClick={() => onDelete(review.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textDim, padding: 4,
                  display: 'flex', alignItems: 'center', borderRadius: 6, transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
                onMouseLeave={e => e.currentTarget.style.color = C.textDim}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {review.reviewText && (
        <div>
          <p style={{
            fontFamily: "'Nunito', sans-serif", fontSize: 13.5,
            color: C.textSub, lineHeight: 1.75,
            display: expanded ? 'block' : '-webkit-box',
            WebkitLineClamp: expanded ? undefined : 4,
            WebkitBoxOrient: 'vertical',
            overflow: expanded ? 'visible' : 'hidden',
          }}>
            {review.reviewText}
          </p>
          {isLong && (
            <button onClick={() => setExpanded(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4, marginTop: 6,
                fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.accent, padding: 0 }}
            >
              {expanded ? 'Thu gọn' : 'Xem thêm'}
              <ChevronDown size={12} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

// ── EpisodeSelector ────────────────────────────────────────────────────────
// episodes = [{ id, seasonNumber, episodeNumber, title }]
const EpisodeSelector = ({ episodes, selectedId, onSelect }) => {
  const [open, setOpen] = useState(false);
  const selected = episodes.find(e => e.id === selectedId);

  // Group by season
  const seasons = episodes.reduce((acc, ep) => {
    const s = ep.seasonNumber ?? 1;
    if (!acc[s]) acc[s] = [];
    acc[s].push(ep);
    return acc;
  }, {});

  return (
    <div style={{ position: 'relative', marginBottom: 18 }}>
      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700,
        color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        Chọn tập
      </p>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', background: C.surface, border: `1px solid ${open ? C.borderBright : C.border}`,
          borderRadius: 8, cursor: 'pointer', color: selected ? C.text : C.textDim,
          fontFamily: "'Nunito', sans-serif", fontSize: 13, transition: 'border-color 0.15s',
        }}
      >
        <span>
          {selected
            ? `S${selected.seasonNumber}E${selected.episodeNumber}${selected.title ? ` — ${selected.title}` : ''}`
            : 'Chọn tập bạn muốn đánh giá...'}
        </span>
        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, color: C.textDim }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
              background: C.card, border: `1px solid ${C.borderBright}`, borderRadius: 10,
              maxHeight: 260, overflowY: 'auto',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            {Object.entries(seasons).map(([seasonNum, eps]) => (
              <div key={seasonNum}>
                <p style={{
                  fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 700,
                  color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.1em',
                  padding: '8px 14px 4px', margin: 0,
                }}>
                  Phần {seasonNum}
                </p>
                {eps.map(ep => (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => { onSelect(ep.id); setOpen(false); }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 14px',
                      background: ep.id === selectedId ? C.accentSoft : 'none',
                      border: 'none', cursor: 'pointer', color: ep.id === selectedId ? C.accent : C.textSub,
                      fontFamily: "'Nunito', sans-serif", fontSize: 13,
                      transition: 'background 0.1s, color 0.1s',
                    }}
                    onMouseEnter={e => { if (ep.id !== selectedId) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = C.text; } }}
                    onMouseLeave={e => { if (ep.id !== selectedId) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.textSub; } }}
                  >
                    <span style={{ fontWeight: 700, marginRight: 6 }}>E{ep.episodeNumber}</span>
                    {ep.title || `Tập ${ep.episodeNumber}`}
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── ReviewForm ─────────────────────────────────────────────────────────────
// contentType: 'movie' | 'tvshow'
// reviewMode (TV show only): 'show' | 'episode'
// activeEpisodeId: nếu có, lock thẳng vào tập đó (không cần chọn)
const ReviewForm = ({ movieId, tvShowId, contentType, reviewMode, episodes, existing, onSuccess, onCancel, activeEpisodeId }) => {
  const [rating,     setRating]     = useState(existing?.rating || 0);
  const [text,       setText]       = useState(existing?.reviewText || '');
  const [isSpoiler,  setIsSpoiler]  = useState(existing?.isSpoiler || false);
  // Dùng ref để luôn có episodeId mới nhất khi submit (tránh stale state)
  const activeEpIdRef = React.useRef(activeEpisodeId);
  const [episodeId,  setEpisodeId]  = useState(existing?.episodeId || activeEpisodeId || null);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);
  const isEdit = !!existing;
  const MAX = 5000;

  // Sync episodeId khi activeEpisodeId prop thay đổi (user đổi tập)
  React.useEffect(() => {
    if (activeEpisodeId && activeEpisodeId !== activeEpIdRef.current) {
      activeEpIdRef.current = activeEpisodeId;
      setEpisodeId(activeEpisodeId);
    }
  }, [activeEpisodeId]);

  // Lock episode khi: đang edit (review cũ có episodeId) HOẶC activeEpisodeId được truyền vào
  const lockedEpisode = (isEdit && !!existing?.episodeId) || !!activeEpisodeId;

  const handleSubmit = async () => {
    // Dùng activeEpisodeId trực tiếp nếu có (luôn fresh từ prop), fallback về state episodeId
    const submitEpisodeId = activeEpisodeId || episodeId;
    if (rating < 1) { setError('Vui lòng chọn số sao'); return; }
    if (reviewMode === 'episode' && !submitEpisodeId) { setError('Vui lòng chọn tập'); return; }
    console.debug('[ReviewForm] submit payload:', { tvShowId, episodeId: submitEpisodeId, rating, reviewMode });
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit) {
        await reviewService.updateReview(existing.id, { rating, reviewText: text || null, isSpoiler });
      } else if (contentType === 'movie') {
        await reviewService.createReview({ movieId, rating, reviewText: text || null, isSpoiler });
      } else if (reviewMode === 'episode') {
        await reviewService.createReview({ tvShowId, episodeId: submitEpisodeId, rating, reviewText: text || null, isSpoiler });
      } else {
        await reviewService.createReview({ tvShowId, rating, reviewText: text || null, isSpoiler });
      }
      onSuccess(isEdit);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data || e.message || 'Có lỗi xảy ra';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{ padding: '24px', background: C.surfaceMid, borderRadius: 14,
        border: `1px solid ${C.borderBright}`, marginBottom: 24 }}
    >
      <p style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 15, fontWeight: 800,
        color: C.text, marginBottom: 18, letterSpacing: '0.02em' }}>
        {isEdit ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá của bạn'}
      </p>

      {/* Episode selector — chỉ hiện khi TV show + episode mode + không phải edit */}
      {reviewMode === 'episode' && !lockedEpisode && episodes?.length > 0 && (
        <EpisodeSelector
          episodes={episodes}
          selectedId={episodeId}
          onSelect={setEpisodeId}
        />
      )}
      {lockedEpisode && (existing?.episodeLabel || activeEpisodeId) && (
        <div style={{ marginBottom: 14, padding: '7px 12px', borderRadius: 7,
          background: C.accentSoft, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Tv size={12} style={{ color: C.accent }} />
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.accent, fontWeight: 600 }}>
            {existing?.episodeLabel || (() => {
              const ep = (episodes || []).find(e => e.id === activeEpisodeId);
              return ep ? `S${ep.seasonNumber}E${ep.episodeNumber}${ep.title ? ` — ${ep.title}` : ''}` : 'Tập đang xem';
            })()}
          </span>
        </div>
      )}

      <div style={{ marginBottom: 18 }}>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700,
          color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Điểm đánh giá
        </p>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700,
          color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Nhận xét <span style={{ fontWeight: 400, textTransform: 'none' }}>(không bắt buộc)</span>
        </p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={MAX}
          placeholder={
            reviewMode === 'episode' && episodeId
              ? 'Chia sẻ cảm nhận của bạn về tập phim này...'
              : reviewMode === 'episode'
              ? 'Chọn tập trước rồi viết nhận xét...'
              : 'Chia sẻ cảm nhận của bạn...'
          }
          style={{
            width: '100%', minHeight: 100, padding: '12px 14px',
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, color: C.text, resize: 'vertical',
            fontFamily: "'Nunito', sans-serif", fontSize: 13.5, lineHeight: 1.7,
            outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = C.borderBright}
          onBlur={e  => e.target.style.borderColor = C.border}
        />
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11,
          color: text.length > MAX * 0.9 ? C.accent : C.textDim,
          textAlign: 'right', marginTop: 4 }}>
          {text.length}/{MAX}
        </p>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 18, userSelect: 'none' }}>
        <div
          onClick={() => setIsSpoiler(v => !v)}
          style={{
            width: 36, height: 20, borderRadius: 10,
            background: isSpoiler ? C.accent : 'rgba(255,255,255,0.1)',
            position: 'relative', transition: 'background 0.2s', flexShrink: 0,
          }}
        >
          <div style={{
            position: 'absolute', top: 2, left: isSpoiler ? 18 : 2,
            width: 16, height: 16, borderRadius: '50%',
            background: '#fff', transition: 'left 0.2s',
          }} />
        </div>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12.5, color: C.textSub }}>
          Review này có chứa spoiler
        </span>
      </label>

      {error && (
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12.5, color: '#ff5555',
          marginBottom: 14, padding: '8px 12px', background: 'rgba(255,50,50,0.08)',
          borderRadius: 6, border: '1px solid rgba(255,50,50,0.18)' }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            padding: '10px 22px', borderRadius: 6,
            background: submitting ? 'rgba(229,24,30,0.5)' : C.accent,
            color: '#fff', border: 'none', cursor: submitting ? 'default' : 'pointer',
            fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 13, fontWeight: 700,
            transition: 'background 0.15s',
          }}
        >
          {submitting ? 'Đang gửi...' : isEdit ? 'Lưu thay đổi' : 'Gửi đánh giá'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              padding: '10px 18px', borderRadius: 6,
              background: 'none', color: C.textSub,
              border: `1px solid ${C.border}`, cursor: 'pointer',
              fontFamily: "'Nunito', sans-serif", fontSize: 13, transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = C.text}
            onMouseLeave={e => e.currentTarget.style.color = C.textSub}
          >
            Hủy
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ── RatingDistribution ─────────────────────────────────────────────────────
const RatingDistribution = ({ distribution = {}, total }) => {
  const max = Math.max(...Object.values(distribution), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {[10,9,8,7,6,5,4,3,2,1].map(n => {
        const count = distribution[n] || 0;
        const pct   = (count / max) * 100;
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11,
              color: C.textDim, width: 14, textAlign: 'right', flexShrink: 0 }}>
              {n}
            </span>
            <div style={{ flex: 1, height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: (10 - n) * 0.04, duration: 0.5, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 4, background: n >= 8 ? C.green : n >= 5 ? C.gold : C.accent }}
              />
            </div>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.textDim, width: 24, flexShrink: 0 }}>
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── ReviewSkeleton ─────────────────────────────────────────────────────────
const ReviewSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    {[1,2,3].map(i => (
      <Skeleton key={i} h={100} r={12} style={{
        background: 'linear-gradient(90deg, #141414 25%, #1e1e1e 50%, #141414 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
        border: `1px solid ${C.border}`,
      }} />
    ))}
  </div>
);

// ── ModeTabs — "Cả Show" / "Theo Tập" ─────────────────────────────────────
const ModeTabs = ({ mode, onChange }) => (
  <div style={{
    display: 'inline-flex', background: 'rgba(255,255,255,0.05)',
    borderRadius: 10, padding: 3, marginBottom: 24, gap: 2,
  }}>
    {[
      { value: 'show',    label: 'Cả Show',   Icon: Film },
      { value: 'episode', label: 'Theo Tập',  Icon: Tv   },
    ].map(({ value, label, Icon }) => (
      <button
        key={value}
        type="button"
        onClick={() => onChange(value)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
          fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700,
          transition: 'all 0.18s',
          background: mode === value ? C.accent : 'none',
          color:      mode === value ? '#fff'   : C.textDim,
        }}
        onMouseEnter={e => { if (mode !== value) e.currentTarget.style.color = C.text; }}
        onMouseLeave={e => { if (mode !== value) e.currentTarget.style.color = C.textDim; }}
      >
        <Icon size={13} />
        {label}
      </button>
    ))}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// ReviewSection — Main component
//
// Props:
//   contentType: 'movie' | 'tvshow'   (default: 'movie')
//   movieId:    string  (dùng khi contentType='movie')
//   tvShowId:   string  (dùng khi contentType='tvshow')
//   episodes:   Array<{ id, seasonNumber, episodeNumber, title }>
//   movieRating, voteCount, currentUser — giữ nguyên như cũ
// ══════════════════════════════════════════════════════════════════════════════
const ReviewSection = ({
  contentType = 'movie',
  movieId,
  tvShowId,
  episodes = [],
  reviewMode: reviewModeProp = null, // 'show' | 'episode' | null (null = user-controlled tabs)
  activeEpisodeId = null,            // ID tập đang xem — auto-select & lock khi truyền vào
  movieRating,
  voteCount,
  currentUser,
}) => {
  const isMobile = useIsMobile();

  // reviewMode: nếu prop truyền vào thì lock, không thì user tự chọn bằng ModeTabs
  const isModeLocked = reviewModeProp !== null;
  const [reviewModeInternal, setReviewModeInternal] = useState(reviewModeProp ?? 'show');
  // Khi prop thay đổi (hoặc remount với prop mới), sync lại internal state
  React.useEffect(() => {
    if (reviewModeProp !== null) setReviewModeInternal(reviewModeProp);
  }, [reviewModeProp]);
  const reviewMode = isModeLocked ? reviewModeProp : reviewModeInternal;
  const setReviewMode = isModeLocked ? () => {} : setReviewModeInternal;

  // Nếu activeEpisodeId được truyền, auto-select tập đó và lock episode mode
  const [selectedEp,  setSelectedEp]  = useState(activeEpisodeId ?? null);
  // Ref luôn giữ giá trị mới nhất của selectedEp — tránh stale trong fetchAll closure
  const selectedEpRef = React.useRef(activeEpisodeId ?? null);
  // Update ref ngay trong render body khi activeEpisodeId prop thay đổi
  if (activeEpisodeId && activeEpisodeId !== selectedEpRef.current) {
    selectedEpRef.current = activeEpisodeId;
  }
  const setSelectedEpSync = (val) => { selectedEpRef.current = val; setSelectedEp(val); };

  const [reviews,    setReviews]    = useState([]);
  const [stats,      setStats]      = useState(null);
  const [myReview,   setMyReview]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [isEditing,  setIsEditing]  = useState(false);
  const [page,       setPage]       = useState(1);
  // Toast state
  const [toast, setToast] = useState(null); // { message, type }
  const PAGE_SIZE = 8;

  // Sync selectedEp khi activeEpisodeId prop thay đổi (user đổi tập đang xem)
  useEffect(() => {
    if (activeEpisodeId) {
      setSelectedEpSync(activeEpisodeId);
    }
  }, [activeEpisodeId]);

  // Khi đổi tab hoặc đổi tập: reset page về 1 mà KHÔNG trigger fetchAll ngay lập tức
  // (fetchAll sẽ tự chạy lại khi page thay đổi qua dep bên dưới)
  const prevModeRef = React.useRef(reviewMode);
  const prevEpRef   = React.useRef(selectedEp);
  useEffect(() => {
    const modeChanged = prevModeRef.current !== reviewMode;
    const epChanged   = prevEpRef.current   !== selectedEp;
    prevModeRef.current = reviewMode;
    prevEpRef.current   = selectedEp;
    if (modeChanged || epChanged) {
      setPage(1);
      setReviews([]);
      setStats(null);
    }
  }, [reviewMode, selectedEp]);

  // ── Fetch ────────────────────────────────────────────────────────────────
  // Dùng ref để luôn đọc state mới nhất, tránh stale closure trong useCallback
  const stateRef = React.useRef({});
  // selectedEp dùng ref để luôn là giá trị mới nhất khi fetchAll chạy
  stateRef.current = { contentType, movieId, tvShowId, reviewMode, selectedEp: selectedEpRef.current, page, currentUser };

  const fetchAll = React.useCallback(async (pageOverride) => {
    const { contentType, movieId, tvShowId, reviewMode, selectedEp, page, currentUser } = stateRef.current;
    const isMovie   = contentType === 'movie';
    const isShow    = contentType === 'tvshow' && reviewMode === 'show';
    const isEpisode = contentType === 'tvshow' && reviewMode === 'episode';
    const fetchPage = pageOverride ?? page;

    if (isMovie  && !movieId)   return;
    if (isShow   && !tvShowId)  return;
    if (isEpisode && !selectedEp) {
      setReviews([]);
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let reviewsRes, statsRes;

      if (isMovie) {
        [reviewsRes, statsRes] = await Promise.all([
          reviewService.getMovieReviews(movieId, fetchPage, PAGE_SIZE).catch(() => null),
          reviewService.getMovieRatingStats(movieId).catch(() => null),
        ]);
      } else if (isShow) {
        [reviewsRes, statsRes] = await Promise.all([
          reviewService.getTvShowReviews(tvShowId, fetchPage, PAGE_SIZE).catch(() => null),
          reviewService.getTvShowRatingStats(tvShowId).catch(() => null),
        ]);
      } else {
        [reviewsRes, statsRes] = await Promise.all([
          reviewService.getEpisodeReviews(selectedEp, fetchPage, PAGE_SIZE).catch(() => null),
          reviewService.getEpisodeRatingStats(selectedEp).catch(() => null),
        ]);
      }

      // Backend: ApiResponseDTO<MovieReviewsResponseDTO>
      // axios unwrap: response.data = { data: { reviews: [...] }, message }
      const envelope   = reviewsRes?.data ?? {};
      const rawData    = envelope?.data ?? envelope ?? {};
      const reviewList = rawData.reviews ?? rawData.Reviews ?? [];
      setReviews(Array.isArray(reviewList) ? reviewList : []);

      // Stats: ApiResponseDTO<MovieRatingStatsDTO>
      // axios: response.data = { data: { averageRating, totalReviews, ... } }
      const statsEnvelope = statsRes?.data ?? {};
      setStats(statsEnvelope?.data ?? statsEnvelope ?? null);

      if (currentUser) {
        let checkRes = null;
        if (isMovie) {
          checkRes = await reviewService.checkUserMovieReview(movieId).catch(() => null);
        } else if (isShow) {
          checkRes = await reviewService.checkUserTvShowReview(tvShowId).catch(() => null);
        } else {
          checkRes = await reviewService.checkUserEpisodeReview(selectedEp).catch(() => null);
        }
        // check: ApiResponseDTO<CheckReviewResponseDTO>
        // axios: response.data = { data: { hasReview, review }, message }
        const checkEnvelope = checkRes?.data ?? {};
        const checkData = checkEnvelope?.data ?? checkEnvelope ?? {};
        const hasReview = checkData.hasReview === true || checkData.HasReview === true;
        const reviewObj = checkData.review ?? checkData.Review ?? null;
        setMyReview(hasReview ? reviewObj : null);
      } else {
        setMyReview(null);
      }
    } catch (e) {
      console.error('ReviewSection fetch error:', e);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // deps rỗng — luôn đọc state mới nhất từ stateRef.current

  // Re-fetch khi các dependency thực sự thay đổi
  useEffect(() => { fetchAll(); }, [contentType, movieId, tvShowId, reviewMode, selectedEp, page]); // eslint-disable-line


  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleDelete = async (reviewId) => {
    if (!window.confirm('Xóa đánh giá này?')) return;
    try {
      await reviewService.deleteReview(reviewId);
      await fetchAll();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Xóa thất bại');
    }
  };

  const handleEdit = (review) => {
    setEditTarget(review);
    setIsEditing(true);
  };

  const handleFormSuccess = async (isEdit = false) => {
    setIsEditing(false);
    setEditTarget(null);
    setToast({ message: isEdit ? 'Đánh giá đã được cập nhật! ✍️' : 'Đánh giá của bạn đã được gửi! 🎉', type: 'success' });
    setPage(1);
    setReviews([]);
    // Đảm bảo stateRef.current.page = 1 trước khi fetchAll (tránh stale)
    stateRef.current = { ...stateRef.current, page: 1 };
    await fetchAll(1);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const avgRating    = stats?.averageRating    ?? stats?.AverageRating    ?? movieRating ?? 0;
  const totalReviews = stats?.totalReviews     ?? stats?.TotalReviews     ?? 0;
  const ratingDist   = stats?.ratingDistribution ?? stats?.RatingDistribution ?? null;

  // Label tập phim cho ReviewCard
  const episodeLabelMap = React.useMemo(() => {
    const m = {};
    (episodes || []).forEach(ep => {
      m[ep.id] = `S${ep.seasonNumber}E${ep.episodeNumber}${ep.title ? ` — ${ep.title}` : ''}`;
    });
    return m;
  }, [episodes]);

  // ── Render ────────────────────────────────────────────────────────────────
  const sectionTitle = contentType === 'tvshow' && reviewMode === 'episode'
    ? 'Đánh Giá Theo Tập'
    : 'Đánh Giá';

  return (
    <div>
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <SectionTitle>{sectionTitle}</SectionTitle>

      {/* TV show mode tabs — chỉ hiện khi KHÔNG bị lock từ prop */}
      {contentType === 'tvshow' && !isModeLocked && (
        <ModeTabs mode={reviewMode} onChange={(m) => { setReviewMode(m); setSelectedEpSync(null); }} />
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 300px',
        gap: isMobile ? '24px 0' : '0 40px',
        alignItems: 'start',
      }}>

        {/* ── LEFT: form + list ──────────────────────────────────────── */}
        <div>
          <div style={{ marginBottom: 28 }}>
            {!currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px',
                background: C.surfaceMid, borderRadius: 12, border: `1px solid ${C.border}` }}>
                <LogIn size={16} style={{ color: C.textDim }} />
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textSub }}>
                  Đăng nhập để viết đánh giá
                </span>
              </div>
            ) : loading ? (
              <Skeleton h={60} r={12} style={{
                backgroundImage: 'linear-gradient(90deg,#181818 25%,#222 50%,#181818 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s infinite',
                border: `1px solid ${C.border}`,
              }} />
            ) : isEditing ? (
              <AnimatePresence>
                <ReviewForm
                  contentType={contentType}
                  movieId={movieId}
                  tvShowId={tvShowId}
                  reviewMode={reviewMode}
                  episodes={episodes}
                  existing={editTarget}
                  activeEpisodeId={activeEpisodeId}
                  onSuccess={handleFormSuccess}
                  onCancel={() => { setIsEditing(false); setEditTarget(null); }}
                />
              </AnimatePresence>
            ) : (
              <>
                {myReview && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: C.accentSoft,
                    borderRadius: 8, border: `1px solid ${C.accentGlow}`, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Star size={12} style={{ fill: C.gold, color: C.gold }} />
                      <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 13, fontWeight: 700, color: C.gold }}>
                        Đánh giá của bạn: {myReview.rating}/10
                      </span>
                      {myReview.episodeId && episodeLabelMap[myReview.episodeId] && (
                        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.accent }}>
                          ({episodeLabelMap[myReview.episodeId]})
                        </span>
                      )}
                    </div>
                    <button onClick={() => handleEdit(myReview)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none',
                        border: `1px solid ${C.accentGlow}`, cursor: 'pointer', color: C.accent,
                        padding: '5px 10px', borderRadius: 6,
                        fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 600 }}>
                      <Edit2 size={11} /> Sửa
                    </button>
                  </div>
                )}
                <ReviewForm
                  contentType={contentType}
                  movieId={movieId}
                  tvShowId={tvShowId}
                  reviewMode={reviewMode}
                  episodes={episodes}
                  existing={null}
                  activeEpisodeId={activeEpisodeId}
                  onSuccess={handleFormSuccess}
                  onCancel={null}
                />
              </>
            )}
          </div>

          {/* Divider — khi episode mode và chưa chọn tập thì ẩn list */}
          {(contentType !== 'tvshow' || reviewMode !== 'episode' || selectedEp) && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700,
                  color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                  {totalReviews > 0 ? `${totalReviews} đánh giá` : 'Chưa có đánh giá'}
                </span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>

              {loading ? (
                <ReviewSkeleton />
              ) : reviews.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  {reviews.map((r, i) => (
                    <ReviewCard
                      key={r.id}
                      review={r}
                      currentUserId={currentUser?.id}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      index={i}
                      episodeLabel={r.episodeId ? episodeLabelMap[r.episodeId] : null}
                    />
                  ))}
                </AnimatePresence>
              ) : (
                <div style={{ padding: '32px 0', textAlign: 'center',
                  color: C.textDim, fontFamily: "'Nunito', sans-serif", fontSize: 14 }}>
                  Chưa có đánh giá nào. Hãy là người đầu tiên! 🎬
                </div>
              )}

              {reviews.length === PAGE_SIZE && (
                <button
                  onClick={() => setPage(p => p + 1)}
                  style={{ width: '100%', marginTop: 12, padding: '10px', borderRadius: 8,
                    background: 'none', border: `1px solid ${C.border}`,
                    color: C.textSub, cursor: 'pointer',
                    fontFamily: "'Nunito', sans-serif", fontSize: 13, transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.borderBright}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                >
                  Xem thêm đánh giá
                </button>
              )}
            </>
          )}

          {/* Placeholder khi episode mode nhưng chưa chọn tập */}
          {contentType === 'tvshow' && reviewMode === 'episode' && !selectedEp && (
            <div style={{ padding: '32px 0', textAlign: 'center',
              color: C.textDim, fontFamily: "'Nunito', sans-serif", fontSize: 14 }}>
              Chọn tập ở form bên trên để xem đánh giá theo từng tập 📺
            </div>
          )}
        </div>

        {/* ── RIGHT: stats panel ────────────────────────────────────── */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div style={{ padding: '24px', background: C.card, borderRadius: 14,
            border: `1px solid ${C.border}`, marginBottom: 16 }}>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 700,
              letterSpacing: '0.1em', color: C.textDim, textTransform: 'uppercase', marginBottom: 4 }}>
              {contentType === 'tvshow' && reviewMode === 'episode' && selectedEp
                ? `Điểm tập — ${episodeLabelMap[selectedEp] || ''}`
                : contentType === 'tvshow'
                ? 'Điểm cả show'
                : 'Điểm trung bình'}
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
              <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 56,
                fontWeight: 900, color: C.gold, lineHeight: 1 }}>
                {Number(avgRating).toFixed(1)}
              </span>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textDim }}>/ 10</span>
            </div>
            <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={14} style={{
                  color: i <= Math.round(avgRating / 2) ? C.gold : 'rgba(255,255,255,0.1)',
                  fill:  i <= Math.round(avgRating / 2) ? C.gold : 'none',
                }} />
              ))}
            </div>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.textDim }}>
              {totalReviews > 0
                ? `${totalReviews.toLocaleString()} đánh giá trên hệ thống`
                : voteCount ? `${voteCount.toLocaleString()} lượt (TMDB)` : 'Chưa có đánh giá'}
            </p>
          </div>

          {ratingDist && Object.keys(ratingDist).length > 0 && (
            <div style={{ padding: '20px 22px', background: C.card, borderRadius: 14, border: `1px solid ${C.border}` }}>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 700,
                letterSpacing: '0.1em', color: C.textDim, textTransform: 'uppercase', marginBottom: 14 }}>
                Phân bổ điểm
              </p>
              <RatingDistribution distribution={ratingDist} total={totalReviews} />
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default ReviewSection;