// src/pages/admin/AdminReviews.jsx  ← REDESIGNED
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, AlertCircle, Star, Search } from 'lucide-react';
import reviewService from '../../services/reviewService';
import movieService  from '../../services/movieService';
import { Button, Modal, Input } from '../../components/ui';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/common/Pagination';

const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const T = {
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
  shadow:      '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
};

const PAGE_SIZE = 12;

// ── Star rating ───────────────────────────────────────────────────────────────
const StarRow = ({ rating, max = 10 }) => {
  const pct = (rating / max) * 5;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={11} style={{ fill: i < Math.floor(pct) ? '#D97706' : 'transparent', color: i < Math.floor(pct) ? '#D97706' : T.border }} />
      ))}
      <span style={{ fontFamily: FONT, fontSize: 12, color: '#D97706', fontWeight: 700, marginLeft: 4 }}>
        {Number(rating).toFixed(1)}
      </span>
    </div>
  );
};

// ── AdminReviews ──────────────────────────────────────────────────────────────
export default function AdminReviews() {
  const [allMovies, setAllMovies] = useState([]);
  const [reviews,   setReviews]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [selMovie,  setSelMovie]  = useState('');
  const [search,    setSearch]    = useState('');
  const [deleteId,  setDeleteId]  = useState(null);
  const [deleting,  setDeleting]  = useState(false);
  const [totalRev,  setTotalRev]  = useState(0);

  const filtered    = reviews.filter(r =>
    !search.trim() || r.reviewText?.toLowerCase().includes(search.toLowerCase()) || r.userName?.toLowerCase().includes(search.toLowerCase())
  );
  const pagination  = usePagination({ total: filtered.length, pageSize: PAGE_SIZE });
  const pageReviews = pagination.paginate(filtered);

  useEffect(() => {
    movieService.getMovies(1, 200).then(res => {
      const raw = Array.isArray(res) ? res : res?.items ?? res?.movies ?? res?.data?.items ?? res?.data ?? [];
      setAllMovies(raw.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '', 'vi')));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selMovie) { setReviews([]); setTotalRev(0); return; }
    setLoading(true);
    reviewService.getMovieReviews(selMovie, 1, 200)
      .then(res => {
        const data = res?.data;
        const list = data?.items ?? data?.reviews ?? (Array.isArray(data) ? data : []);
        setReviews(list);
        setTotalRev(data?.totalCount ?? list.length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selMovie]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await reviewService.deleteReview(deleteId);
      setReviews(prev => prev.filter(r => r.id !== deleteId));
      setDeleteId(null);
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  };

  return (
    <div style={{ padding: '28px 32px 56px', maxWidth: 1100, fontFamily: FONT }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 3 }}>Quản lý</p>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>
          Đánh giá
          {selMovie && (
            <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 500, color: T.textMuted, letterSpacing: 0 }}>({totalRev})</span>
          )}
        </h2>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <select value={selMovie} onChange={e => setSelMovie(e.target.value)}
          style={{ flex: '0 0 300px', height: 40, padding: '0 14px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, color: selMovie ? T.text : T.textMuted, fontFamily: FONT, fontSize: 13.5, outline: 'none', cursor: 'pointer' }}>
          <option value="">— Chọn phim để xem đánh giá —</option>
          {allMovies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>

        {selMovie && (
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={15} color={T.textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              placeholder="Tìm theo nội dung hoặc tên user..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', height: 40, padding: '0 14px 0 38px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, fontFamily: FONT, fontSize: 13.5, color: T.text, outline: 'none' }}
            />
          </div>
        )}
      </div>

      {/* Stats */}
      {selMovie && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'Tổng đánh giá', value: totalRev },
            { label: 'Đang hiển thị', value: filtered.length },
          ].map(s => (
            <div key={s.label} style={{ padding: '10px 18px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadow, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted }}>{s.label}:</span>
              <span style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!selMovie && (
        <div style={{ padding: '80px 0', textAlign: 'center' }}>
          <Star size={36} color={T.textMuted} style={{ margin: '0 auto 14px', opacity: 0.3 }} />
          <p style={{ fontFamily: FONT, fontSize: 14, color: T.textMuted }}>Chọn một phim để xem và quản lý đánh giá</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ padding: '64px 0', textAlign: 'center' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', border: `2.5px solid ${T.accentLight}`, borderTopColor: T.accent, animation: 'spin 0.75s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Table */}
      {!loading && selMovie && (
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', fontFamily: FONT, fontSize: 13, color: T.textMuted }}>
              Không có đánh giá nào
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.surfaceAlt }}>
                  {['Người dùng', 'Đánh giá', 'Nội dung', 'Ngày', ''].map(h => (
                    <th key={h} style={{
                      padding: '11px 18px', textAlign: 'left',
                      fontFamily: FONT, fontSize: 11.5, fontWeight: 600,
                      color: T.textMuted, letterSpacing: '0.04em',
                      textTransform: 'uppercase', borderBottom: `1px solid ${T.border}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageReviews.map((r, i) => (
                  <motion.tr key={r.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.surfaceHov}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 18px' }}>
                      <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: T.text, marginBottom: 2 }}>
                        {r.userName ?? r.userId?.slice(0, 8) ?? 'Ẩn danh'}
                      </p>
                      {r.isSpoiler && (
                        <span style={{ fontFamily: FONT, fontSize: 10.5, color: '#D97706', padding: '1px 6px', borderRadius: 4, border: '1px solid #FDE68A', background: '#FEF3C7' }}>
                          Spoiler
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <StarRow rating={r.rating ?? 0} />
                    </td>
                    <td style={{ padding: '12px 18px', maxWidth: 340 }}>
                      <p style={{ fontFamily: FONT, fontSize: 13, color: T.textSub, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {r.reviewText || '—'}
                      </p>
                    </td>
                    <td style={{ padding: '12px 18px', fontFamily: FONT, fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap' }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <button onClick={() => setDeleteId(r.id)}
                        style={{ width: 30, height: 30, borderRadius: 8, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.18)', cursor: 'pointer', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                        onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!loading && selMovie && <Pagination {...pagination.props} itemLabel="đánh giá" />}

      {/* Delete confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Xóa đánh giá" size="sm"
        footer={<><Button variant="ghost" size="sm" onClick={() => setDeleteId(null)}>Hủy</Button><Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>Xóa</Button></>}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontFamily: FONT, fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>
            Xóa đánh giá này? Hành động không thể hoàn tác.
          </p>
        </div>
      </Modal>
    </div>
  );
}