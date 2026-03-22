// src/pages/admin/AdminReviews.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, AlertCircle, Star, Search } from 'lucide-react';
import reviewService from '../../services/reviewService';
import movieService from '../../services/movieService';
import { Button, Modal, Input, Spinner } from '../../components/ui';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/common/Pagination';
import { C, FONT_DISPLAY, FONT_BODY } from '../../context/homeTokens';

const PAGE_SIZE = 12;

const StarRow = ({ rating, max = 10 }) => {
  const pct = (rating / max) * 5;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={11}
          style={{
            fill: i < Math.floor(pct) ? '#f5c518' : 'transparent',
            color: i < Math.floor(pct) ? '#f5c518' : 'rgba(255,255,255,0.15)',
          }}
        />
      ))}
      <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: '#f5c518', fontWeight: 700, marginLeft: 2 }}>
        {Number(rating).toFixed(1)}
      </span>
    </div>
  );
};

export default function AdminReviews() {
  const [allMovies, setAllMovies]   = useState([]);
  const [reviews,   setReviews]     = useState([]);
  const [loading,   setLoading]     = useState(false);
  const [selMovie,  setSelMovie]    = useState('');
  const [search,    setSearch]      = useState('');
  const [deleteId,  setDeleteId]    = useState(null);
  const [deleting,  setDeleting]    = useState(false);
  const [totalRev,  setTotalRev]    = useState(0);

  const filtered    = reviews.filter(r =>
    !search.trim() || r.reviewText?.toLowerCase().includes(search.toLowerCase()) || r.userName?.toLowerCase().includes(search.toLowerCase())
  );
  const pagination  = usePagination({ total: filtered.length, pageSize: PAGE_SIZE });
  const pageReviews = pagination.paginate(filtered);

  // Load movie list for selector
  useEffect(() => {
    movieService.getMovies(1, 200).then(res => {
      const raw = Array.isArray(res) ? res : res?.items ?? res?.movies ?? res?.data?.items ?? res?.data ?? [];
      setAllMovies(raw.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '', 'vi')));
    }).catch(console.error);
  }, []);

  // Load reviews when movie selected
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
    <div style={{ padding: '36px 40px 64px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
          Quản lý
        </p>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 900, color: 'white', margin: 0 }}>
          Đánh giá
        </h1>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Movie selector */}
        <select
          value={selMovie}
          onChange={e => setSelMovie(e.target.value)}
          style={{
            flex: '0 0 320px',
            height: 42,
            padding: '0 14px',
            borderRadius: 8,
            background: '#111',
            border: `1px solid ${C.border}`,
            color: selMovie ? 'white' : 'rgba(255,255,255,0.35)',
            fontFamily: FONT_BODY,
            fontSize: 13,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">— Chọn phim để xem đánh giá —</option>
          {allMovies.map(m => (
            <option key={m.id} value={m.id} style={{ background: '#111' }}>{m.title}</option>
          ))}
        </select>

        {selMovie && (
          <div style={{ flex: 1, minWidth: 200 }}>
            <Input
              type="search"
              placeholder="Tìm theo nội dung hoặc tên user..."
              value={search}
              onChange={setSearch}
              onClear={() => setSearch('')}
            />
          </div>
        )}
      </div>

      {/* Stats bar */}
      {selMovie && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Tổng đánh giá', value: totalRev },
            { label: 'Đang hiển thị', value: filtered.length },
          ].map(s => (
            <div key={s.label} style={{
              padding: '10px 18px', borderRadius: 8,
              background: '#0d0d0d', border: `1px solid ${C.border}`,
              display: 'flex', gap: 8, alignItems: 'center',
            }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{s.label}:</span>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 800, color: 'white' }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!selMovie && (
        <div style={{ padding: '80px 0', textAlign: 'center' }}>
          <Star size={40} color="rgba(255,255,255,0.08)" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: 'rgba(255,255,255,0.2)' }}>
            Chọn một phim để xem và quản lý đánh giá
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ padding: '64px 0', textAlign: 'center' }}>
          <Spinner size="md" color="red" />
        </div>
      )}

      {/* Reviews table */}
      {!loading && selMovie && (
        <div style={{ background: '#0d0d0d', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>
              Không có đánh giá nào
            </div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Người dùng', 'Đánh giá', 'Nội dung', 'Ngày', ''].map(h => (
                      <th key={h} style={{
                        padding: '12px 16px', textAlign: 'left',
                        fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700,
                        color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em',
                        textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`,
                        background: '#080808',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageReviews.map((r, i) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      style={{ borderBottom: `1px solid ${C.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <p style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 2 }}>
                          {r.userName ?? r.userId?.slice(0, 8) ?? 'Ẩn danh'}
                        </p>
                        {r.isSpoiler && (
                          <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: '#f5c518', padding: '1px 5px', borderRadius: 3, border: '1px solid rgba(245,197,24,0.3)', background: 'rgba(245,197,24,0.08)' }}>
                            Spoiler
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <StarRow rating={r.rating ?? 0} />
                      </td>
                      <td style={{ padding: '12px 16px', maxWidth: 340 }}>
                        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {r.reviewText || '—'}
                        </p>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setDeleteId(r.id)}
                          style={{
                            width: 30, height: 30, borderRadius: 6,
                            background: 'rgba(229,24,30,0.08)', border: `1px solid rgba(229,24,30,0.2)`,
                            cursor: 'pointer', color: C.accent,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={13} />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

            </>
          )}
        </div>
      )}

      {!loading && selMovie && <Pagination {...pagination.props} itemLabel="đánh giá" />}

      {/* Delete confirm */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xóa đánh giá"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)}>Hủy</Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>Xóa</Button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertCircle size={18} color={C.accent} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
            Xóa đánh giá này? Hành động không thể hoàn tác.
          </p>
        </div>
      </Modal>
    </div>
  );
}

