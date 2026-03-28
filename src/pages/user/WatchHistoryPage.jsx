// src/pages/WatchHistoryPage.jsx
// Lịch sử xem — WatchHistoryDTO: { id, movieId, movieTitle, posterUrl,
//                                   watchedAt, progressMinutes, isCompleted }

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Play, Trash2, CheckCircle2, RotateCcw, Calendar, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import movieService from '../../services/movieService';
import BackButton   from '../../components/common/BackButton';
import { C, FONT_DISPLAY, FONT_BODY, GOOGLE_FONTS } from '../../context/homeTokens';
import { useIsMobile } from '../../hooks/useIsMobile';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (date) => {
  const d = new Date(date);
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tgt   = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff  = Math.floor((today - tgt) / 86400000);

  if (diff === 0) return 'Hôm nay';
  if (diff === 1) return 'Hôm qua';
  if (diff <= 6)  return `${diff} ngày trước`;
  if (diff <= 13) return 'Tuần trước';
  if (diff <= 30) return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long' });
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });
};

const fmtTime = (date) =>
  new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const fmtDuration = (min) => {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}g ${m}p` : `${m}p`;
};

const groupByDay = (items) => {
  const map = new Map();
  items.forEach(item => {
    const label = fmt(item.watchedAt);
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(item);
  });
  return [...map.entries()];
};

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ onBrowse }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px 0', gap: 20, textAlign: 'center' }}>
    <motion.div
      animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
      transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', repeatDelay: 2 }}
      style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Clock size={32} color="rgba(255,255,255,0.2)" strokeWidth={1.5} />
    </motion.div>
    <div style={{ maxWidth: 300 }}>
      <p style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>
        Chưa có lịch sử xem
      </p>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7 }}>
        Bắt đầu xem phim để lịch sử của bạn xuất hiện ở đây
      </p>
    </div>
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={onBrowse}
      style={{ padding: '10px 28px', borderRadius: 10, background: C.accent, border: 'none', color: 'white', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700 }}>
      Khám phá phim
    </motion.button>
  </motion.div>
);

// ── Progress bar ──────────────────────────────────────────────────────────────
const ProgressBar = ({ progress, isCompleted, color = C.accent }) => (
  <div style={{ height: 2, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
    <div style={{
      height: '100%',
      width: isCompleted ? '100%' : `${Math.min(progress, 100)}%`,
      background: isCompleted ? '#46d369' : color,
      borderRadius: 99,
      transition: 'width 0.4s ease',
    }} />
  </div>
);

// ── HistoryCard ───────────────────────────────────────────────────────────────
const HistoryCard = ({ item, index, onDelete, onRewatch }) => {
  const isMobile = useIsMobile();
  const [hov,    setHov]    = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const navigate            = useNavigate();

  const estimatedTotal  = 90;
  const progressPct     = item.isCompleted
    ? 100
    : Math.min(Math.round((item.progressMinutes / estimatedTotal) * 100), 99);

  const remaining = item.isCompleted
    ? null
    : item.progressMinutes
      ? `Còn ${fmtDuration(Math.max(estimatedTotal - item.progressMinutes, 0))} nữa`
      : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.18 } }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.28 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', gap: 16, alignItems: 'center',
        padding: '12px 14px', borderRadius: 12,
        background: hov ? 'rgba(255,255,255,0.035)' : 'transparent',
        border: `1px solid ${hov ? 'rgba(255,255,255,0.07)' : 'transparent'}`,
        cursor: 'pointer', transition: 'all 0.18s',
      }}
      onClick={() =>
        navigate(`/movie/${item.movieId}`, {
          state: {
            resumeMinutes: item.isCompleted ? 0 : (item.progressMinutes ?? 0),
            isCompleted:   item.isCompleted ?? false,
          },
        })
      }
    >
      {/* Poster */}
      <div style={{ width: 60, height: 90, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#1a1a1a', position: 'relative' }}>
        {item.posterUrl && !imgErr
          ? <img src={item.posterUrl} alt={item.movieTitle} onError={() => setImgErr(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎬</div>
        }
        {item.isCompleted && (
          <div style={{ position: 'absolute', bottom: 4, right: 4 }}>
            <CheckCircle2 size={14} color="#46d369" fill="#46d369" strokeWidth={0} />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: FONT_DISPLAY, fontSize: isMobile ? 13 : 15, fontWeight: 700,
          color: C.text, marginBottom: 5,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.movieTitle || 'Không có tên'}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={10} strokeWidth={2} />
            {fmtTime(item.watchedAt)}
          </span>

          {item.progressMinutes > 0 && (
            <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>
              · {fmtDuration(item.progressMinutes)} đã xem
            </span>
          )}

          {item.isCompleted ? (
            <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: '#46d369', display: 'flex', alignItems: 'center', gap: 3 }}>
              <CheckCircle2 size={10} strokeWidth={2.5} /> Đã xem xong
            </span>
          ) : remaining ? (
            <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>
              · {remaining}
            </span>
          ) : null}
        </div>

        <ProgressBar progress={progressPct} isCompleted={item.isCompleted} />
      </div>

      {/* Action buttons — luôn hiện trên mobile */}
      <AnimatePresence>
        {(hov || isMobile) && (
          <motion.div
            initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
            style={{ display: 'flex', gap: isMobile ? 6 : 8, flexShrink: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={e => { e.stopPropagation(); onRewatch(item); }}
              title="Xem phim"
              style={{ width: isMobile ? 30 : 34, height: isMobile ? 30 : 34, borderRadius: '50%', border: 'none', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={13} fill="#000" color="#000" style={{ marginLeft: 1 }} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={e => { e.stopPropagation(); onDelete(item.id); }}
              title="Xóa khỏi lịch sử"
              style={{ width: isMobile ? 30 : 34, height: isMobile ? 30 : 34, borderRadius: '50%', cursor: 'pointer', background: 'rgba(229,24,30,0.1)', border: '1.5px solid rgba(229,24,30,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={13} color={C.accent} strokeWidth={2} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Day group header ──────────────────────────────────────────────────────────
const DayHeader = ({ label, count }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, marginTop: 4 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Calendar size={12} color="rgba(255,255,255,0.25)" strokeWidth={2} />
      <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
    <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
      {count} phim
    </span>
  </div>
);

// ── Stats bar ─────────────────────────────────────────────────────────────────
const StatsBar = ({ history }) => {
  const isMobile = useIsMobile();
  const completed  = history.filter(h => h.isCompleted).length;
  const totalMins  = history.reduce((a, h) => a + (h.progressMinutes || 0), 0);
  const totalHours = Math.floor(totalMins / 60);

  const stats = [
    { label: 'Đã xem',     value: history.length,              unit: 'phim'  },
    { label: 'Hoàn thành', value: completed,                   unit: 'phim'  },
    { label: 'Thời gian',  value: totalHours || totalMins,     unit: totalHours ? 'giờ' : 'phút' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 1, marginBottom: 36, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          flex: 1, padding: isMobile ? '12px 8px' : '16px 20px',
          background: 'rgba(255,255,255,0.025)',
          borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          textAlign: 'center',
        }}>
          <p style={{ fontFamily: FONT_DISPLAY, fontSize: isMobile ? 20 : 26, fontWeight: 800, color: C.text, lineHeight: 1, marginBottom: 4 }}>
            {s.value.toLocaleString()}
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>
              {s.unit}
            </span>
          </p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.04em' }}>
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
export default function WatchHistoryPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [history,     setHistory]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [clearing,    setClearing]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await movieService.getWatchHistory();
      const raw = Array.isArray(res) ? res : res?.data || res?.history || [];
      raw.sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));
      setHistory(raw);
    } catch (e) {
      console.error(e);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const handleDelete = useCallback(async (historyId) => {
    setHistory(prev => prev.filter(h => h.id !== historyId));
    try {
      await movieService.deleteWatchHistory(historyId);
    } catch (e) {
      console.warn('[WatchHistory] delete failed, reloading:', e);
      load();
    }
  }, [load]);

  const handleClearAll = async () => {
    setClearing(true);
    setShowConfirm(false);
    setHistory([]);
    try {
      await movieService.clearWatchHistory();
    } catch (e) {
      console.warn('[WatchHistory] clearAll failed, reloading:', e);
      load();
    } finally {
      setClearing(false);
    }
  };

  // Truyền tiến độ đã xem qua route state để VideoPlayer có thể seek đúng vị trí
  const handleRewatch = (item) =>
    navigate(`/movie/${item.movieId}`, {
      state: {
        resumeMinutes: item.isCompleted ? 0 : (item.progressMinutes ?? 0),
        isCompleted:   item.isCompleted ?? false,
      },
    });
  const groups = useMemo(() => groupByDay(history), [history]);

  // ── Skeleton ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#000', paddingTop: 68 }}>
      <style>{GOOGLE_FONTS}</style>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 48px' }}>
        <div style={{ height: 18, width: 60, borderRadius: 6, marginBottom: 32, animation: 'shimmer 1.6s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 100%)' }} />
        <div style={{ height: 32, width: 200, borderRadius: 8, marginBottom: 32, animation: 'shimmer 1.6s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 100%)' }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 0', alignItems: 'center' }}>
            <div style={{ width: 60, height: 90, borderRadius: 8, flexShrink: 0, animationDelay: `${i*0.08}s`, animation: 'shimmer 1.6s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 100%)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 16, width: '60%', borderRadius: 6, marginBottom: 10, animation: 'shimmer 1.6s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 100%)' }} />
              <div style={{ height: 10, width: '35%', borderRadius: 6, animation: 'shimmer 1.6s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.03) 100%)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#000', color: C.text, paddingTop: 68 }}>
      <style>{GOOGLE_FONTS}</style>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: isMobile ? '20px 16px 60px' : '32px 48px 80px' }}>

        {/* ── Back button — luôn nằm góc trái, tách biệt với title ── */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ marginBottom: 24 }}
        >
          <BackButton />
        </motion.div>

        {/* ── Page header: title (trái) + Xóa tất cả (phải) ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}
        >
          {/* Title block */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Clock size={22} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
              <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: isMobile ? 22 : 30, fontWeight: 800, color: C.text, lineHeight: 1 }}>
                Lịch sử xem
              </h1>
            </div>
            {history.length > 0 && (
              <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.3)', paddingLeft: 32 }}>
                {history.length} lần xem
              </p>
            )}
          </div>

          {/* Clear all button + confirm popover */}
          {history.length > 0 && (
            <div style={{ position: 'relative' }}>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowConfirm(true)}
                disabled={clearing}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 9,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600,
                  transition: 'all 0.15s',
                }}
              >
                <RotateCcw size={13} strokeWidth={2} />
                Xóa tất cả
              </motion.button>

              <AnimatePresence>
                {showConfirm && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setShowConfirm(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.14 }}
                      style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 99, width: 240, background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.8)' }}
                    >
                      <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 6 }}>
                        Xóa toàn bộ lịch sử?
                      </p>
                      <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 14, lineHeight: 1.5 }}>
                        Hành động này không thể hoàn tác.
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setShowConfirm(false)}
                          style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>
                          Hủy
                        </button>
                        <button onClick={handleClearAll}
                          style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: C.accent, color: 'white', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700 }}>
                          Xóa hết
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Stats */}
        {history.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <StatsBar history={history} />
          </motion.div>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          {history.length === 0 ? (
            <EmptyState key="empty" onBrowse={() => navigate('/browse')} />
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {groups.map(([label, items]) => (
                <div key={label} style={{ marginBottom: 24 }}>
                  <DayHeader label={label} count={items.length} />
                  <AnimatePresence>
                    {items.map((item, i) => (
                      <HistoryCard
                        key={item.id}
                        item={item}
                        index={i}
                        onDelete={handleDelete}
                        onRewatch={handleRewatch}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}