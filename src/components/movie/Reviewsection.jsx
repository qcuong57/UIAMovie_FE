// src/components/movie/ReviewSection.jsx
// Tích hợp full với RatingReviewController:
//   GET  /api/ratingreview/movies/{movieId}        → hiện danh sách
//   GET  /api/ratingreview/movies/{movieId}/stats  → thống kê + distribution
//   GET  /api/ratingreview/check/{movieId}         → check user đã review chưa
//   POST /api/ratingreview                         → tạo review
//   PUT  /api/ratingreview/{reviewId}              → sửa review
//   DELETE /api/ratingreview/{reviewId}            → xóa review

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Edit2, Trash2, AlertTriangle, ChevronDown, LogIn } from 'lucide-react';
import reviewService from '../../services/reviewService';

// ── Design tokens (đồng bộ với MovieInfoPage) ──────────────────────────────
const C = {
  bg:          '#000000',
  surface:     '#0a0a0a',
  surfaceHigh: '#111111',
  surfaceMid:  '#181818',
  card:        '#141414',
  border:      'rgba(255,255,255,0.07)',
  borderBright:'rgba(255,255,255,0.18)',
  accent:      '#e5181e',
  accentSoft:  'rgba(229,24,30,0.12)',
  accentGlow:  'rgba(229,24,30,0.3)',
  text:        '#f0f2f8',
  textSub:     '#9299a8',
  textDim:     '#525868',
  gold:        '#f5c518',
  green:       '#46d369',
};

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });

// ── StarPicker — chọn số sao khi viết review ──────────────────────────────
const StarPicker = ({ value, onChange, size = 28 }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
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

// ── ReviewCard ─────────────────────────────────────────────────────────────
const ReviewCard = ({ review, currentUserId, onEdit, onDelete, index }) => {
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
              {review.updatedAt && <span style={{ marginLeft: 6, color: C.textDim, fontStyle: 'italic' }}>(đã chỉnh)</span>}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Rating badge */}
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

          {/* Spoiler tag */}
          {review.isSpoiler && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 20,
              background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.25)' }}>
              <AlertTriangle size={10} style={{ color: C.gold }} />
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, color: C.gold, fontWeight: 600 }}>
                Spoiler
              </span>
            </div>
          )}

          {/* Edit / Delete buttons — chỉ hiện cho chủ review */}
          {isOwn && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => onEdit(review)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textDim, padding: 4,
                  display: 'flex', alignItems: 'center', borderRadius: 6,
                  transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = C.text}
                onMouseLeave={e => e.currentTarget.style.color = C.textDim}
              >
                <Edit2 size={14} />
              </button>
              <button onClick={() => onDelete(review.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textDim, padding: 4,
                  display: 'flex', alignItems: 'center', borderRadius: 6,
                  transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
                onMouseLeave={e => e.currentTarget.style.color = C.textDim}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Review text */}
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
                fontFamily: "'Nunito', sans-serif", fontSize: 12,
                color: C.accent, padding: 0 }}
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

// ── ReviewForm — viết / chỉnh review ─────────────────────────────────────
const ReviewForm = ({ movieId, existing, onSuccess, onCancel }) => {
  const [rating,     setRating]     = useState(existing?.rating || 0);
  const [text,       setText]       = useState(existing?.reviewText || '');
  const [isSpoiler,  setIsSpoiler]  = useState(existing?.isSpoiler || false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);

  const isEdit = !!existing;
  const MAX = 5000;

  const handleSubmit = async () => {
    if (rating < 1) { setError('Vui lòng chọn số sao'); return; }
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit) {
        await reviewService.updateReview(existing.id, { rating, reviewText: text || null, isSpoiler });
      } else {
        await reviewService.createReview({ movieId, rating, reviewText: text || null, isSpoiler });
      }
      onSuccess();
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
      style={{
        padding: '24px', background: C.surfaceMid,
        borderRadius: 14, border: `1px solid ${C.borderBright}`,
        marginBottom: 24,
      }}
    >
      <p style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 15, fontWeight: 800,
        color: C.text, marginBottom: 18, letterSpacing: '0.02em' }}>
        {isEdit ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá của bạn'}
      </p>

      {/* Stars */}
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700,
          color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Điểm đánh giá
        </p>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      {/* Text */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700,
          color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Nhận xét <span style={{ fontWeight: 400, textTransform: 'none' }}>(không bắt buộc)</span>
        </p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={MAX}
          placeholder="Chia sẻ cảm nhận của bạn về bộ phim này..."
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

      {/* Spoiler toggle */}
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
            position: 'absolute', top: 2,
            left: isSpoiler ? 18 : 2,
            width: 16, height: 16, borderRadius: '50%',
            background: '#fff', transition: 'left 0.2s',
          }} />
        </div>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12.5, color: C.textSub }}>
          Review này có chứa spoiler
        </span>
      </label>

      {/* Error */}
      {error && (
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12.5, color: '#ff5555',
          marginBottom: 14, padding: '8px 12px', background: 'rgba(255,50,50,0.08)',
          borderRadius: 6, border: '1px solid rgba(255,50,50,0.18)' }}>
          {error}
        </p>
      )}

      {/* Buttons */}
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
        <button
          onClick={onCancel}
          style={{
            padding: '10px 18px', borderRadius: 6,
            background: 'none', color: C.textSub,
            border: `1px solid ${C.border}`, cursor: 'pointer',
            fontFamily: "'Nunito', sans-serif", fontSize: 13,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = C.text}
          onMouseLeave={e => e.currentTarget.style.color = C.textSub}
        >
          Hủy
        </button>
      </div>
    </motion.div>
  );
};

// ── RatingDistribution bar chart ───────────────────────────────────────────
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
                style={{
                  height: '100%', borderRadius: 4,
                  background: n >= 8 ? C.green : n >= 5 ? C.gold : C.accent,
                }}
              />
            </div>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11,
              color: C.textDim, width: 24, flexShrink: 0 }}>
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// ── MAIN COMPONENT ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
/**
 * Props:
 *   movieId      — Guid của phim
 *   movieRating  — rating TMDB (số thực, dùng fallback khi chưa có review DB)
 *   voteCount    — số lượt vote TMDB
 *   currentUser  — { id, name } | null  (null = chưa đăng nhập)
 */
const ReviewSection = ({ movieId, movieRating, voteCount, currentUser }) => {
  const [reviews,    setReviews]    = useState([]);
  const [stats,      setStats]      = useState(null);
  const [myReview,   setMyReview]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [editTarget, setEditTarget] = useState(null);  // null = new, object = edit
  const [isEditing,  setIsEditing]  = useState(false); // chỉ dùng khi edit review cũ
  const [deleting,   setDeleting]   = useState(null);
  const [page,       setPage]       = useState(1);
  const PAGE_SIZE = 8;

  // ── Fetch ───────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!movieId) return;
    setLoading(true);
    try {
      // Cả hai đều .catch để không throw ra ngoài
      const [reviewsRes, statsRes] = await Promise.all([
        reviewService.getMovieReviews(movieId, page, PAGE_SIZE).catch(() => null),
        reviewService.getMovieRatingStats(movieId).catch(() => null),
      ]);

      // reviewsRes.data = { movieId, movieTitle, reviews: [...] }
      // Hỗ trợ cả camelCase lẫn PascalCase t�y cấu hình serializer của backend
      const rawData    = reviewsRes?.data ?? {};
      const reviewList = rawData.reviews ?? rawData.Reviews ?? [];
      setReviews(Array.isArray(reviewList) ? reviewList : []);
      setStats(statsRes?.data ?? null);

      if (currentUser) {
        // checkRes.data = { hasReview: bool, review: ReviewDTO | null }
        const checkRes  = await reviewService.checkUserReview(movieId).catch(() => null);
        const checkData = checkRes?.data ?? {};
        // Hỗ trợ cả camelCase lẫn PascalCase
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
  }, [movieId, page, currentUser]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async (reviewId) => {
    if (!window.confirm('Xóa đánh giá này?')) return;
    setDeleting(reviewId);
    try {
      await reviewService.deleteReview(reviewId);
      await fetchAll();
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Xóa thất bại';
      alert(msg);
    } finally {
      setDeleting(null);
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────
  const handleEdit = (review) => {
    setEditTarget(review);
    setIsEditing(true);
  };

  const handleFormSuccess = async () => {
    setIsEditing(false);
    setEditTarget(null);
    // Optimistic: set myReview = {} tạm thời để form ẩn ngay,
    // fetchAll sẽ điền data thật sau
    setMyReview({ rating: 0, _placeholder: true });
    setPage(1);
    await fetchAll();
  };

  // ── Derived — hỗ trợ cả camelCase lẫn PascalCase ──────────────────────
  const avgRating    = stats?.averageRating    ?? stats?.AverageRating    ?? movieRating ?? 0;
  const totalReviews = stats?.totalReviews     ?? stats?.TotalReviews     ?? 0;
  const ratingDist   = stats?.ratingDistribution ?? stats?.RatingDistribution ?? null;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '0 40px', alignItems: 'start' }}>

      {/* ── LEFT: form luôn hiển thị + list ─────────────────────────── */}
      <div>

        {/* ── KHU VỰC ĐÁNH GIÁ CỦA BẠN — luôn hiển thị ── */}
        <div style={{ marginBottom: 28 }}>
          {!currentUser ? (
            /* Chưa đăng nhập */
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px',
              background: C.surfaceMid, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <LogIn size={16} style={{ color: C.textDim }} />
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textSub }}>
                Đăng nhập để viết đánh giá
              </span>
            </div>
          ) : loading ? (
            /* ⚠️ Đang fetch — KHÔNG hiện form, tránh submit trùng */
            <div style={{ height: 60, borderRadius: 12, background: C.surfaceMid,
              border: `1px solid ${C.border}`,
              backgroundImage: 'linear-gradient(90deg,#181818 25%,#222 50%,#181818 75%)',
              backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
          ) : isEditing ? (
            /* Đang chỉnh sửa review cũ */
            <AnimatePresence>
              <ReviewForm
                movieId={movieId}
                existing={editTarget}
                onSuccess={handleFormSuccess}
                onCancel={() => { setIsEditing(false); setEditTarget(null); }}
              />
            </AnimatePresence>
          ) : (
            /* Luôn hiện form — cho phép review nhiều lần */
            <>
              {myReview && (
                /* Badge review gần nhất */
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: C.accentSoft,
                  borderRadius: 8, border: `1px solid ${C.accentGlow}`, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Star size={12} style={{ fill: C.gold, color: C.gold }} />
                    <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 13, fontWeight: 700, color: C.gold }}>
                      Đánh giá gần nhất: {myReview.rating}/10
                    </span>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.textSub }}>
                      — viết đánh giá mới bên dưới hoặc sửa bản cũ
                    </span>
                  </div>
                  <button onClick={() => handleEdit(myReview)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none',
                      border: `1px solid ${C.accentGlow}`, cursor: 'pointer', color: C.accent,
                      padding: '5px 10px', borderRadius: 6,
                      fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 600 }}>
                    <Edit2 size={11} /> Sửa bản cũ
                  </button>
                </div>
              )}
              <ReviewForm
                movieId={movieId}
                existing={null}
                onSuccess={handleFormSuccess}
                onCancel={null}
              />
            </>
          )}
        </div>

        {/* ── DIVIDER ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700,
            color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
            {totalReviews > 0 ? `${totalReviews} đánh giá` : 'Chưa có đánh giá'}
          </span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        {/* ── LIST REVIEW MỌI NGƯỜI ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 100, borderRadius: 12, background: C.card,
                border: `1px solid ${C.border}`,
                backgroundImage: 'linear-gradient(90deg, #141414 25%, #1e1e1e 50%, #141414 75%)',
                backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
              }} />
            ))}
          </div>
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
              />
            ))}
          </AnimatePresence>
        ) : (
          <div style={{ padding: '32px 0', textAlign: 'center',
            color: C.textDim, fontFamily: "'Nunito', sans-serif", fontSize: 14 }}>
            Chưa có đánh giá nào. Hãy là người đầu tiên! 🎬
          </div>
        )}

        {/* Load more */}
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
      </div>

      {/* ── RIGHT: stats panel (sticky) ───────────────────────────────── */}
      <div style={{ position: 'sticky', top: 80 }}>

        {/* Score */}
        <div style={{ padding: '24px', background: C.card, borderRadius: 14,
          border: `1px solid ${C.border}`, marginBottom: 16 }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 700,
            letterSpacing: '0.1em', color: C.textDim, textTransform: 'uppercase', marginBottom: 16 }}>
            Điểm trung bình
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

        {/* Distribution */}
        {ratingDist && Object.keys(ratingDist).length > 0 && (
          <div style={{ padding: '20px 22px', background: C.card, borderRadius: 14,
            border: `1px solid ${C.border}` }}>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 700,
              letterSpacing: '0.1em', color: C.textDim, textTransform: 'uppercase', marginBottom: 14 }}>
              Phân bổ điểm
            </p>
            <RatingDistribution
              distribution={ratingDist}
              total={totalReviews}
            />
          </div>
        )}
      </div>

    </div>
  );
};

export default ReviewSection; 