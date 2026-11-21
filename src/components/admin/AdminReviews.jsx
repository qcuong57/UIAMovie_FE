// src/pages/admin/AdminReviews.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, Star, Search, Film, Tv, Eye, EyeOff, BarChart2, MessageSquare, X, ChevronDown, ChevronUp, CornerDownRight, MessageCircle, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import {
  useReviewCatalog, useShowEpisodes, useAdminReviews, useReviewReplies,
  useDeleteReview, useDeleteReviews, useDeleteReply, REPLY_PAGE_SIZE,
} from '../../hooks/admin/useAdminReviews';
import { usePagination } from '../../hooks/common/usePagination';
import AdminPagination from '../../components/common/AdminPagination';
import { useToast } from './common/Toast';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../context/adminTokens';
import { useIsMobile } from '../../hooks/common/useIsMobile';

const PAGE_SIZE = 12;

// ── Helpers ───────────────────────────────────────────────────────────────────
const avg = (arr, key) =>
  arr.length ? (arr.reduce((s, r) => s + (r[key] ?? 0), 0) / arr.length).toFixed(1) : '—';

// "3 giờ trước" — quét nhanh hơn ngày tuyệt đối; giờ đầy đủ nằm trong tooltip
const timeAgo = (iso) => {
  if (!iso) return '—';
  const sec = (Date.now() - new Date(iso).getTime()) / 1000;
  if (Number.isNaN(sec)) return '—';
  if (sec < 60) return 'Vừa xong';
  const min = sec / 60;
  if (min < 60) return `${Math.floor(min)} phút trước`;
  const hr = min / 60;
  if (hr < 24) return `${Math.floor(hr)} giờ trước`;
  const day = hr / 24;
  if (day < 30) return `${Math.floor(day)} ngày trước`;
  if (day < 365) return `${Math.floor(day / 30)} tháng trước`;
  return `${Math.floor(day / 365)} năm trước`;
};

// Giá trị so sánh cho từng cột có thể sắp xếp
const SORTERS = {
  date:    (r) => new Date(r.createdAt ?? 0).getTime(),
  rating:  (r) => r.rating ?? 0,
  replies: (r) => r.replyCount ?? 0,
  user:    (r) => (r.userName ?? '').toLowerCase(),
};

// ── Star rating ───────────────────────────────────────────────────────────────
const StarRow = ({ rating, max = 10 }) => {
  const filled = Math.round((rating / max) * 5);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={11}
          style={{
            fill:  i < filled ? T.gold : 'transparent',
            color: i < filled ? T.gold : T.border,
            transition: 'all 0.1s',
          }}
        />
      ))}
      <span style={{ fontFamily: FONT, fontSize: 12, color: T.gold, fontWeight: 700, marginLeft: 5 }}>
        {Number(rating).toFixed(1)}
        <span style={{ color: T.textMuted, fontWeight: 500 }}>/{max}</span>
      </span>
    </div>
  );
};

// ── Tiêu đề cột sắp xếp được (aria-sort + bàn phím) ───────────────────────────
const SortTh = ({ label, sortKey, active, dir, onSort }) => {
  const Icon = !active ? ChevronsUpDown : dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th
      aria-sort={!active ? 'none' : dir === 'asc' ? 'ascending' : 'descending'}
      style={{ padding: '12px 18px', textAlign: 'left', borderBottom: `1px solid ${T.border}` }}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, padding: 0,
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: FONT, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: active ? T.text : T.textMuted,
        }}
      >
        {label}
        <Icon size={12} style={{ opacity: active ? 1 : 0.5 }} />
      </button>
    </th>
  );
};

// ── Skeleton row ──────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    {[16, 160, 80, 260, 70, 80, 36].map((w, i) => (
      <td key={i} style={{ padding: '14px 18px' }}>
        <div style={{
          width: w, height: 13, borderRadius: 6,
          background: `linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.surfaceHov} 50%, ${T.surfaceAlt} 75%)`,
          backgroundSize: '400px 100%',
          animation: 'shimmer 1.4s infinite',
        }} />
      </td>
    ))}
  </tr>
);

// ── Stat chip ─────────────────────────────────────────────────────────────────
const StatChip = ({ icon: Icon, label, value, accent = T.accent }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 16px', borderRadius: 12,
    background: T.surface, border: `1px solid ${T.border}`,
    boxShadow: T.shadow,
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: 9, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: accent + '15',
    }}>
      <Icon size={15} color={accent} />
    </div>
    <div>
      <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, marginBottom: 1 }}>{label}</p>
      <p style={{ fontFamily: FONT_TITLE, fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>
        {value}
      </p>
    </div>
  </div>
);

// ── Tab button ────────────────────────────────────────────────────────────────
const TabBtn = ({ active, onClick, icon: Icon, label, color }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    padding: '8px 18px', borderRadius: 10, cursor: 'pointer',
    fontFamily: FONT, fontSize: 13.5, fontWeight: active ? 700 : 500,
    border: active ? `1.5px solid ${color}22` : `1px solid ${T.border}`,
    background: active ? color + '12' : T.surface,
    color: active ? color : T.textSub,
    transition: 'all 0.18s',
    boxShadow: active ? `0 0 0 3px ${color}10` : T.shadow,
  }}>
    <Icon size={14} />
    {label}
  </button>
);

// ── Searchable Dropdown with Poster ───────────────────────────────────────────
const getPosterUrl = (item) =>
  item?.posterUrl ?? item?.posterPath ?? item?.poster ?? item?.thumbnailUrl ?? item?.imageUrl ?? null;

const SearchableDropdown = ({
  items = [],
  value,
  onChange,
  placeholder = '— Chọn —',
  accentColor = '#6366F1',
  icon: Icon = Film,
}) => {
  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState('');
  const [hovered, setHovered]   = useState(null);
  const containerRef            = useRef(null);
  const inputRef                = useRef(null);
  const listRef                 = useRef(null);

  const selected = items.find(i => i.id === value) ?? null;

  const filtered = query.trim()
    ? items.filter(i => (i.title ?? '').toLowerCase().includes(query.toLowerCase()))
    : items;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const handleSelect = (item) => {
    onChange(item?.id ?? '');
    setOpen(false);
    setQuery('');
  };

  const hoveredItem = hovered ? items.find(i => i.id === hovered) : (open ? filtered[0] : selected);
  const posterUrl   = getPosterUrl(hoveredItem);

  return (
    <div ref={containerRef} data-review-field="" style={{ position: 'relative', flex: '0 0 300px', zIndex: 50 }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', height: 42,
          padding: '0 14px',
          borderRadius: 11,
          background: T.surface,
          border: `1.5px solid ${open ? accentColor + '70' : T.border}`,
          color: selected ? T.text : T.textMuted,
          fontFamily: FONT, fontSize: 13.5,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: open ? `0 0 0 3px ${accentColor}18` : T.shadow,
          transition: 'border-color 0.15s, box-shadow 0.15s',
          outline: 'none',
          textAlign: 'left',
        }}
      >
        {/* Poster thumbnail in trigger */}
        {selected && getPosterUrl(selected) ? (
          <img
            src={getPosterUrl(selected)}
            alt=""
            style={{ width: 22, height: 30, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <Icon size={14} color={selected ? accentColor : T.textMuted} style={{ flexShrink: 0 }} />
        )}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected?.title ?? placeholder}
        </span>
        {value && (
          <span
            role="button"
            onClick={e => { e.stopPropagation(); handleSelect(null); }}
            style={{ color: T.textMuted, display: 'flex', padding: 2, borderRadius: 4, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = T.text}
            onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
          >
            <X size={12} />
          </span>
        )}
        <ChevronDown
          size={13}
          color={T.textMuted}
          style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{   opacity: 0, y: -6,  scale: 0.98 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            data-dropdown-panel=""
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0,
              width: posterUrl ? 520 : 300,
              maxWidth: 'calc(100vw - 32px)',
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 14,
              boxShadow: T.shadowLg,
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            {/* Left: search + list */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {/* Search input */}
              <div style={{
                padding: '10px 10px 8px',
                borderBottom: `1px solid ${T.border}`,
                background: T.surfaceAlt,
              }}>
                <div style={{ position: 'relative' }}>
                  <Search size={13} color={T.textMuted}
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Tìm kiếm..."
                    style={{
                      width: '100%', height: 34, padding: '0 10px 0 32px',
                      borderRadius: 8,
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      fontFamily: FONT, fontSize: 13, color: T.text,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e  => e.target.style.borderColor = accentColor + '70'}
                    onBlur={e   => e.target.style.borderColor = T.border}
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      style={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted,
                        display: 'flex', padding: 2,
                      }}
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div
                ref={listRef}
                style={{ overflowY: 'auto', maxHeight: 260, padding: '6px 6px' }}
              >
                {filtered.length === 0 ? (
                  <div style={{ padding: '20px 12px', textAlign: 'center', fontFamily: FONT, fontSize: 13, color: T.textMuted }}>
                    Không tìm thấy kết quả
                  </div>
                ) : filtered.map(item => {
                  const poster = getPosterUrl(item);
                  const isSelected = item.id === value;
                  const isHov = hovered === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setHovered(item.id)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 9,
                        padding: '7px 9px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: isSelected
                          ? accentColor + '14'
                          : isHov ? T.surfaceHov : 'transparent',
                        transition: 'background 0.1s',
                        userSelect: 'none',
                      }}
                    >
                      {/* Mini poster */}
                      {poster ? (
                        <img
                          src={poster}
                          alt=""
                          style={{
                            width: 24, height: 34, borderRadius: 4,
                            objectFit: 'cover', flexShrink: 0,
                            border: `1px solid ${T.border}`,
                          }}
                        />
                      ) : (
                        <div style={{
                          width: 24, height: 34, borderRadius: 4, flexShrink: 0,
                          background: accentColor + '18',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `1px solid ${T.border}`,
                        }}>
                          <Icon size={11} color={accentColor} />
                        </div>
                      )}
                      <span style={{
                        fontFamily: FONT, fontSize: 13,
                        color: isSelected ? accentColor : T.text,
                        fontWeight: isSelected ? 600 : 400,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        flex: 1,
                      }}>
                        {item.title}
                      </span>
                      {isSelected && (
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer count */}
              {filtered.length > 0 && (
                <div style={{
                  padding: '6px 12px', borderTop: `1px solid ${T.border}`,
                  fontFamily: FONT, fontSize: 11, color: T.textMuted,
                  background: T.surfaceAlt,
                }}>
                  {filtered.length} kết quả{query ? ` cho "${query}"` : ''}
                </div>
              )}
            </div>

            {/* Right: large poster preview */}
            <AnimatePresence mode="wait">
              {posterUrl && (
                <motion.div
                  key={hoveredItem?.id ?? 'none'}
                  data-poster-preview=""
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    width: 154, flexShrink: 0,
                    background: T.surfaceAlt,
                    borderLeft: `1px solid ${T.border}`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center',
                    padding: '14px 10px 12px',
                    gap: 10,
                  }}
                >
                  <img
                    src={posterUrl}
                    alt={hoveredItem?.title ?? ''}
                    style={{
                      width: 110, height: 160, objectFit: 'cover',
                      borderRadius: 10,
                      border: `1px solid ${T.border}`,
                      boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
                    }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <p style={{
                    fontFamily: FONT, fontSize: 12, fontWeight: 600,
                    color: T.text, textAlign: 'center', lineHeight: 1.4,
                    margin: 0,
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {hoveredItem?.title}
                  </p>
                  {(hoveredItem?.releaseYear ?? hoveredItem?.year) && (
                    <span style={{
                      fontFamily: FONT, fontSize: 11, color: T.textMuted,
                      background: T.surface, border: `1px solid ${T.border}`,
                      padding: '2px 8px', borderRadius: 20,
                    }}>
                      {hoveredItem.releaseYear ?? hoveredItem.year}
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Reply panel (admin) ───────────────────────────────────────────────────────
// Hiển thị reply của 1 review: reply gốc + reply con (lồng 1 cấp), phân trang theo reply gốc.
const ReplyPanel = ({ reviewId, accentColor }) => {
  const toast = useToast();
  const isMobile = useIsMobile();
  const [page,      setPage]      = useState(1);
  const [delReply,  setDelReply]  = useState(null);
  const [deleting,  setDeleting]  = useState(false);
  const [delError,  setDelError]  = useState('');

  // Phân trang theo reply gốc; chuyển trang giữ trang cũ trong lúc tải, mở lại trang đã xem có ngay từ cache.
  const repliesQ = useReviewReplies(reviewId, page);
  const deleteReplyM = useDeleteReply();
  const replies   = repliesQ.data?.replies ?? [];
  const totalRoot = repliesQ.data?.totalRoot ?? 0;
  const loading   = repliesQ.isPending;
  const error     = repliesQ.isError && !repliesQ.data
    ? (repliesQ.error?.response?.data?.message ?? 'Không tải được danh sách trả lời')
    : '';

  const roots    = replies.filter(r => !r.parentReplyId);
  const childrenOf = (id) => replies.filter(r => r.parentReplyId === id);
  const totalPages = Math.ceil(totalRoot / REPLY_PAGE_SIZE);

  const handleDeleteReply = async () => {
    if (!delReply) return;
    setDeleting(true); setDelError('');
    try {
      // Xóa reply gốc thì server xóa luôn các reply con
      const isRoot  = !delReply.parentReplyId;
      const removed = isRoot ? [delReply.id, ...childrenOf(delReply.id).map(c => c.id)] : [delReply.id];
      // Hook giảm replyCount của review và lấy lại danh sách reply; trang hiện tại hết reply gốc thì lùi 1 trang
      await deleteReplyM.mutateAsync({ replyId: delReply.id, reviewId, removedCount: removed.length });
      setDelReply(null);
      const rootsLeft = roots.length - (isRoot ? 1 : 0);
      if (rootsLeft <= 0 && page > 1) setPage(page - 1);
      toast.success(isRoot && removed.length > 1
        ? `Đã xóa trả lời và ${removed.length - 1} phản hồi con`
        : 'Xóa trả lời thành công');
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message ?? e?.message ?? 'Xóa thất bại, vui lòng thử lại';
      setDelError(msg); toast.error(msg);
    } finally { setDeleting(false); }
  };

  const ReplyItem = ({ r, isChild }) => (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      padding: '10px 12px', borderRadius: 10,
      background: T.surface,
      border: `1px solid ${T.border}`,
      marginLeft: isChild ? (isMobile ? 14 : 28) : 0,
    }}>
      <div style={{ width: 26, height: 26, borderRadius: 8, background: accentColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: FONT_TITLE, fontSize: 11, fontWeight: 700, color: accentColor }}>
          {(r.userName ?? '?')[0]?.toUpperCase()}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: T.text }}>{r.userName ?? 'Ẩn danh'}</span>
          <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted }}>
            {r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : ''}
            {r.updatedAt ? ' · đã chỉnh sửa' : ''}
          </span>
        </div>
        <p style={{ fontFamily: FONT, fontSize: 13, color: T.textSub, lineHeight: 1.55, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {r.replyToUserName && (
            <span style={{ color: accentColor, fontWeight: 600, marginRight: 5 }}>@{r.replyToUserName}</span>
          )}
          {r.replyText}
        </p>
      </div>
      <button
        onClick={() => { setDelReply(r); setDelError(''); }}
        title="Xóa trả lời"
        style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.16)',
          cursor: 'pointer', color: T.red,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );

  const closeDel = () => { if (!deleting) { setDelReply(null); setDelError(''); } };
  const childCount = delReply && !delReply.parentReplyId ? childrenOf(delReply.id).length : 0;

  return (
    <div style={{ padding: isMobile ? '12px 12px 14px' : '14px 18px 16px 62px', background: T.surfaceAlt, borderTop: `1px dashed ${T.border}` }}>
      {loading ? (
        <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.textMuted, margin: 0 }}>Đang tải trả lời…</p>
      ) : error ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: FONT, fontSize: 12.5, color: T.red }}>{error}</span>
          <button onClick={() => repliesQ.refetch()} style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: accentColor, background: 'none', border: 'none', cursor: 'pointer' }}>Thử lại</button>
        </div>
      ) : roots.length === 0 ? (
        <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.textMuted, margin: 0 }}>Chưa có trả lời nào</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {roots.map(root => (
            <React.Fragment key={root.id}>
              <ReplyItem r={root} />
              {childrenOf(root.id).map(c => <ReplyItem key={c.id} r={c} isChild />)}
            </React.Fragment>
          ))}
        </div>
      )}

      {!loading && !error && (
        <AdminPagination
          page={page}
          totalPages={totalPages}
          total={totalRoot}
          pageSize={REPLY_PAGE_SIZE}
          onPageChange={setPage}
          itemLabel="trả lời gốc"
        />
      )}

      {/* Confirm delete reply */}
      <AnimatePresence>
        {!!delReply && (
          <>
            <motion.div key="reply-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeDel}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 299, backdropFilter: 'blur(3px)' }}
            />
            <motion.div key="reply-modal" data-admin-modal=""
              initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              style={{
                position: 'fixed', inset: 0, margin: 'auto', width: 440, height: 'fit-content', zIndex: 300,
                background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: T.shadowLg,
                fontFamily: FONT, overflow: 'hidden',
              }}
            >
              <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3, fontWeight: 600 }}>Trả lời</p>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0, fontFamily: FONT_TITLE }}>Xác nhận xóa</h2>
                </div>
                <button onClick={closeDel} disabled={deleting}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: deleting ? 'not-allowed' : 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={15} />
                </button>
              </div>

              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '12px 14px', borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: '0 0 4px' }}>{delReply?.userName ?? 'Ẩn danh'}</p>
                  <p style={{ fontSize: 12.5, color: T.textSub, lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {delReply?.replyToUserName && <strong style={{ color: accentColor }}>@{delReply.replyToUserName} </strong>}
                    {delReply?.replyText}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '11px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)' }}>
                  <AlertTriangle size={15} color={T.red} style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 13, color: '#991B1B', lineHeight: 1.6, margin: 0 }}>
                    Hành động này <strong>không thể hoàn tác</strong>.
                    {childCount > 0 && <> Trả lời gốc bị xóa sẽ kéo theo <strong>{childCount} phản hồi con</strong>.</>}
                  </p>
                </div>

                {delError && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.25)', fontSize: 12.5, color: T.red }}>
                    {delError}
                  </div>
                )}
              </div>

              <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={closeDel} disabled={deleting}
                  style={{ padding: '8px 16px', borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: deleting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, color: T.textSub, fontFamily: FONT, opacity: deleting ? 0.6 : 1 }}>
                  Hủy
                </button>
                <button onClick={handleDeleteReply} disabled={deleting}
                  style={{ padding: '8px 18px', borderRadius: 8, background: deleting ? 'rgba(220,38,38,0.5)' : '#DC2626', border: '1px solid transparent', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, color: 'white', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {deleting
                    ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Đang xóa...</>
                    : <><Trash2 size={13} /> Xóa trả lời</>}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Mobile: thanh chọn tất cả + sắp xếp (thay cho tiêu đề cột của bảng) ───────
const MobileSortBar = ({ allSelected, someSelected, onToggleAll, sortKey, sortDir, onSortKey, onToggleDir, accentColor }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: `1px solid ${T.border}`, background: T.surfaceAlt }}>
    <input
      type="checkbox"
      aria-label="Chọn tất cả đánh giá trong trang"
      checked={allSelected}
      ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
      onChange={onToggleAll}
      style={{ accentColor, cursor: 'pointer', width: 18, height: 18, flexShrink: 0 }}
    />
    <select
      aria-label="Sắp xếp theo"
      value={sortKey}
      onChange={e => onSortKey(e.target.value)}
      style={{
        flex: 1, minWidth: 0, height: 36, padding: '0 10px', borderRadius: 8,
        background: T.surface, border: `1px solid ${T.border}`, color: T.text,
        fontFamily: FONT, fontSize: 13, outline: 'none',
      }}
    >
      <option value="date">Sắp xếp: Ngày</option>
      <option value="rating">Sắp xếp: Điểm đánh giá</option>
      <option value="replies">Sắp xếp: Lượt trả lời</option>
      <option value="user">Sắp xếp: Người dùng</option>
    </select>
    <button
      type="button"
      onClick={onToggleDir}
      aria-label={sortDir === 'asc' ? 'Đang tăng dần, bấm để giảm dần' : 'Đang giảm dần, bấm để tăng dần'}
      style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
        background: T.surface, border: `1px solid ${T.border}`, color: T.textSub,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {sortDir === 'asc' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
    </button>
  </div>
);

// ── Mobile: mỗi đánh giá là một thẻ (thay cho bảng 7 cột) ─────────────────────
const MobileReviewList = ({ reviews, selected, onToggle, accentColor, expandedId, onToggleReplies, onDelete }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    {reviews.map(r => {
      const isSel = selected.has(r.id);
      const open = expandedId === r.id;
      const replyCount = r.replyCount ?? 0;
      return (
        <div key={r.id} style={{ borderBottom: `1px solid ${T.border}`, background: isSel ? accentColor + '0D' : 'transparent' }}>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                aria-label={`Chọn đánh giá của ${r.userName ?? 'người dùng'}`}
                checked={isSel}
                onChange={() => onToggle(r.id)}
                style={{ accentColor, cursor: 'pointer', width: 18, height: 18, flexShrink: 0 }}
              />
              <div style={{
                width: 30, height: 30, borderRadius: 9, background: accentColor + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontFamily: FONT_TITLE, fontSize: 12, fontWeight: 700, color: accentColor }}>
                  {(r.userName ?? r.userId ?? '?')[0]?.toUpperCase()}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.text, overflowWrap: 'anywhere' }}>
                    {r.userName ?? r.userId?.slice(0, 8) ?? 'Ẩn danh'}
                  </span>
                  {r.isSpoiler && (
                    <span style={{ fontFamily: FONT, fontSize: 10, color: '#D97706', padding: '1px 6px', borderRadius: 4, border: '1px solid #FDE68A', background: '#FEF3C7' }}>
                      Spoiler
                    </span>
                  )}
                </div>
                <span
                  title={r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : undefined}
                  style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}
                >
                  {timeAgo(r.createdAt)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onDelete(r)}
                aria-label="Xóa đánh giá"
                style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0, cursor: 'pointer',
                  background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)', color: T.red,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <StarRow rating={r.rating ?? 0} />

            <p style={{
              fontFamily: FONT, fontSize: 13, color: T.textSub, lineHeight: 1.55, margin: 0,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word',
            }}>
              {r.reviewText || <span style={{ color: T.textMuted, fontStyle: 'italic' }}>Không có nội dung</span>}
            </p>

            {replyCount > 0 && (
              <button
                type="button"
                onClick={() => onToggleReplies(r.id)}
                aria-expanded={open}
                style={{
                  alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                  fontFamily: FONT, fontSize: 12, fontWeight: 600,
                  background: open ? accentColor + '14' : T.surface,
                  color: open ? accentColor : T.textSub,
                  border: `1px solid ${open ? accentColor + '40' : T.border}`,
                }}
              >
                <MessageCircle size={12} />
                {replyCount} trả lời
                {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>
          {open && <ReplyPanel reviewId={r.id} accentColor={accentColor} />}
        </div>
      );
    })}
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminReviews() {
  const toast = useToast();
  const isMobile = useIsMobile();
  const [tab,       setTab]       = useState('movie');   // 'movie' | 'tvshow'
  const [selId,     setSelId]     = useState('');
  const [selEpId,   setSelEpId]   = useState('');        // '' = show-level, guid = episode cụ thể
  const [search,    setSearch]    = useState('');
  const [deleteId,    setDeleteId]    = useState(null);
  const [deleteReview, setDeleteReview] = useState(null); // full review object for preview
  const [deleting,    setDeleting]    = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const delReviewM = useDeleteReview();
  const bulkDeleteM = useDeleteReviews();
  const [sortKey,  setSortKey]  = useState('date');
  const [sortDir,  setSortDir]  = useState('desc');
  const [selected, setSelected] = useState(() => new Set()); // id các review đang được chọn
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [expandedId, setExpandedId] = useState(null);   // review đang mở panel trả lời

  // ── Dữ liệu (react-query): catalogue → tập → đánh giá, mỗi tầng một query theo key ──
  const movies  = useReviewCatalog('movie').data ?? [];
  const tvShows = useReviewCatalog('tvshow').data ?? [];

  // Đổi tab → bỏ chọn; đổi show → về đánh giá cấp show; đổi đối tượng → đóng panel trả lời
  useEffect(() => { setSelId(''); setSelEpId(''); setSearch(''); setExpandedId(null); }, [tab]);
  useEffect(() => { setSelEpId(''); }, [selId]);
  useEffect(() => { setExpandedId(null); }, [selId, selEpId, tab]);

  const { data: episodes = [], isFetching: loadingEps } = useShowEpisodes(selId, { enabled: tab === 'tvshow' });
  const reviewsQ = useAdminReviews({ kind: tab, targetId: selId, episodeId: tab === 'tvshow' ? selEpId : '' });
  const reviews  = reviewsQ.data?.reviews ?? [];
  const totalRev = reviewsQ.data?.totalCount ?? 0;
  const loading  = !!selId && reviewsQ.isPending;

  // ── Filtering / pagination ──────────────────────────────────────
  const filtered = reviews.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.reviewText?.toLowerCase().includes(q) || r.userName?.toLowerCase().includes(q);
  });
  // Sắp xếp trên BẢN SAO; cùng giá trị thì giữ thứ tự mới nhất trước
  const sorted = [...filtered].sort((a, b) => {
    const va = SORTERS[sortKey](a);
    const vb = SORTERS[sortKey](b);
    const cmp = typeof va === 'string' ? va.localeCompare(vb, 'vi') : va - vb;
    return (sortDir === 'asc' ? cmp : -cmp) || SORTERS.date(b) - SORTERS.date(a);
  });
  const pagination  = usePagination({ total: sorted.length, pageSize: PAGE_SIZE });
  const pageReviews = pagination.paginate(sorted);

  // Đổi sắp xếp / tìm kiếm / đối tượng → về trang 1; đổi đối tượng hoặc từ khoá → bỏ chọn
  useEffect(() => {
    pagination.setPage?.(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortKey, sortDir, search, selId, selEpId, tab]);
  useEffect(() => { setSelected(new Set()); }, [search, selId, selEpId, tab]);

  const handleSort = (key) => {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir(key === 'user' ? 'asc' : 'desc'); }
  };

  // ── Chọn nhiều ──
  const pageIds = pageReviews.map(r => r.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selected.has(id));
  const somePageSelected = pageIds.some(id => selected.has(id));
  const toggleOne = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAllPage = () => setSelected(prev => {
    const next = new Set(prev);
    allPageSelected ? pageIds.forEach(id => next.delete(id)) : pageIds.forEach(id => next.add(id));
    return next;
  });
  const selectedReviews = reviews.filter(r => selected.has(r.id));
  const selectedReplyTotal = selectedReviews.reduce((n, r) => n + (r.replyCount ?? 0), 0);

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    setBulkError('');
    try {
      const { deleted, failed } = await bulkDeleteM.mutateAsync([...selected]);
      setSelected(new Set(failed.map(f => f.id))); // giữ chọn các review xoá lỗi để thử lại
      setExpandedId(prev => (prev && deleted.includes(prev) ? null : prev));
      if (failed.length === 0) {
        setBulkOpen(false);
        toast.success(`Đã xóa ${deleted.length} đánh giá`);
      } else {
        const msg = `Đã xóa ${deleted.length}, thất bại ${failed.length} đánh giá`;
        setBulkError(msg);
        toast.error(msg);
      }
    } catch (e) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Xóa thất bại, vui lòng thử lại';
      setBulkError(msg);
      toast.error(msg);
    } finally { setBulkDeleting(false); }
  };

  // ── Delete ──────────────────────────────────────────────────────
  const handleDelete = async () => {
    const id = deleteReview?.id ?? deleteId;
    if (!id) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await delReviewM.mutateAsync(id); // hook bỏ review khỏi cache và làm mới điểm phía người dùng
      setDeleteId(null);
      setDeleteReview(null);
      setExpandedId(prev => (prev === id ? null : prev));
      toast.success('Xóa đánh giá thành công');
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message ?? e?.message ?? 'Xóa thất bại, vui lòng thử lại';
      setDeleteError(msg);
      toast.error(msg);
    } finally { setDeleting(false); }
  };

  // ── Derived stats ───────────────────────────────────────────────
  const spoilerCount = reviews.filter(r => r.isSpoiler).length;
  const avgRating    = avg(reviews, 'rating');
  const totalReplies = reviews.reduce((s, r) => s + (r.replyCount ?? 0), 0);
  const catalogue    = tab === 'movie' ? movies : tvShows;
  const accentColor  = tab === 'movie' ? T.accent : '#7C3AED';
  const selectedTitle = catalogue.find(c => c.id === selId)?.title ?? '';

  return (
    <div data-page="" style={{ padding: isMobile ? '20px 16px 32px' : '28px 32px 64px', maxWidth: 1120, fontFamily: FONT }}>
      <style>{ADMIN_GOOGLE_FONTS}</style>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11.5, color: T.textMuted, marginBottom: 3, fontFamily: FONT, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Quản lý đánh giá · {tab === 'movie' ? 'Phim' : 'TV Show'}
          </p>
          <h2 style={{ fontFamily: FONT_TITLE, fontSize: 23, fontWeight: 700, color: T.text, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {selId ? selectedTitle : (tab === 'movie' ? 'Chọn phim để kiểm duyệt' : 'Chọn TV show để kiểm duyệt')}
            {selId && selEpId && (() => {
              const ep = episodes.find(e => e.id === selEpId);
              if (!ep) return null;
              const sNum = ep.seasonNumber != null ? `S${ep.seasonNumber}` : '';
              const eNum = ep.episodeNumber != null ? `E${ep.episodeNumber}` : '';
              const prefix = sNum && eNum ? `${sNum}${eNum}` : '';
              return prefix ? <span style={{ fontSize: 13.5, fontWeight: 600, color: '#7C3AED', letterSpacing: 0, fontFamily: FONT }}>· {prefix}</span> : null;
            })()}
          </h2>
        </div>

        {/* Tab switcher */}
        <div data-admin-actions="" style={{ display: 'flex', gap: 8 }}>
          <TabBtn active={tab === 'movie'}  onClick={() => setTab('movie')}  icon={Film} label="Phim"    color={T.accent}   />
          <TabBtn active={tab === 'tvshow'} onClick={() => setTab('tvshow')} icon={Tv}   label="TV Show" color="#7C3AED"    />
        </div>
      </div>

      {/* ── Filters row ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchableDropdown
          items={catalogue}
          value={selId}
          onChange={id => { setSelId(id ?? ''); }}
          placeholder={tab === 'movie' ? '— Chọn phim —' : '— Chọn TV show —'}
          accentColor={accentColor}
          icon={tab === 'movie' ? Film : Tv}
        />

        <AnimatePresence>
          {tab === 'tvshow' && selId && (
            <motion.div key="ep-select"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              data-review-field="" style={{ position: 'relative', flex: '0 0 260px' }}>
              <select
                value={selEpId}
                onChange={e => { setSelEpId(e.target.value); setSearch(''); }}
                disabled={loadingEps}
                style={{
                  width: '100%', height: 42, padding: '0 36px 0 14px',
                  borderRadius: 11, background: T.surface, border: `1px solid ${T.border}`,
                  color: selEpId ? T.text : T.textMuted, fontFamily: FONT, fontSize: 13.5,
                  outline: 'none', cursor: loadingEps ? 'wait' : 'pointer', appearance: 'none',
                  boxShadow: T.shadow, transition: 'border-color 0.15s',
                  opacity: loadingEps ? 0.6 : 1,
                }}
                onFocus={e  => e.target.style.borderColor = '#7C3AED80'}
                onBlur={e   => e.target.style.borderColor = T.border}
              >
                <option value="">— Đánh giá cả show —</option>
                {episodes.map(ep => {
                  const sNum = ep.seasonNumber != null ? `S${ep.seasonNumber}` : '';
                  const eNum = ep.episodeNumber != null ? `E${ep.episodeNumber}` : '';
                  const prefix = sNum && eNum ? `${sNum}${eNum} · ` : '';
                  const label = ep.label ?? ep.title ?? ep.name ?? ep.id;
                  return <option key={ep.id} value={ep.id}>{prefix}{label}</option>;
                })}
              </select>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2"
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selId && (
            <motion.div key="search" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              data-review-field="" style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={14} color={T.textMuted}
                style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                placeholder="Tìm theo nội dung hoặc tên người dùng…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', height: 42, padding: '0 14px 0 38px',
                  borderRadius: 11, background: T.surface, border: `1px solid ${T.border}`,
                  fontFamily: FONT, fontSize: 13.5, color: T.text, outline: 'none',
                  boxShadow: T.shadow, transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = accentColor + '80'}
                onBlur={e  => e.target.style.borderColor = T.border}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Stats row ── */}
      <AnimatePresence>
        {selId && !loading && reviews.length > 0 && (
          <motion.div key="stats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            data-admin-stats="" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <StatChip icon={MessageSquare} label={selEpId ? 'Đánh giá tập này' : 'Tổng đánh giá'} value={totalRev}  accent={accentColor} />
            <StatChip icon={Star}          label="Điểm trung bình"                                  value={avgRating} accent={T.gold}      />
            {search.trim() && <StatChip icon={BarChart2} label="Khớp tìm kiếm" value={filtered.length} accent={accentColor} />}
            {totalReplies > 0 && <StatChip icon={CornerDownRight} label="Lượt trả lời" value={totalReplies} accent={accentColor} />}
            {spoilerCount > 0 && <StatChip icon={EyeOff} label="Có spoiler" value={spoilerCount} accent={T.red} />}
          </motion.div>
        )}
      </AnimatePresence>

      {selId && !loading && totalRev > reviews.length && (
        <p style={{ fontFamily: FONT, fontSize: 12, color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 9, padding: '8px 12px', margin: '-8px 0 16px' }}>
          Mới tải {reviews.length}/{totalRev} đánh giá — tìm kiếm, sắp xếp và điểm trung bình chỉ áp dụng cho phần đã tải.
        </p>
      )}

      {/* ── Empty state ── */}
      {!selId && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ padding: '96px 0', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, background: T.surfaceAlt,
            border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px',
          }}>
            {tab === 'movie' ? <Film size={28} color={T.textMuted} /> : <Tv size={28} color={T.textMuted} />}
          </div>
          <p style={{ fontFamily: FONT_TITLE, fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 6 }}>
            {tab === 'movie' ? 'Chọn một bộ phim' : 'Chọn một TV show'}
          </p>
          <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>
            để xem và quản lý đánh giá của người dùng
          </p>
        </motion.div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && isMobile && (
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[140, 90, '90%'].map((w, j) => (
                <div key={j} style={{
                  width: w, height: 13, borderRadius: 6,
                  background: `linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.surfaceHov} 50%, ${T.surfaceAlt} 75%)`,
                  backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite',
                }} />
              ))}
            </div>
          ))}
        </div>
      )}

      {loading && !isMobile && (
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.surfaceAlt }}>
                {['', 'Người dùng', 'Đánh giá', 'Nội dung', 'Trả lời', 'Ngày', ''].map((h, i) => (
                  <th key={i} style={{ padding: '12px 18px', textAlign: 'left', fontFamily: FONT, fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Reviews table ── */}
      {!loading && selId && (
        <motion.div key={`table-${tab}-${selId}`}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
          style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden' }}>
          {selected.size > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: isMobile ? '10px 16px' : '10px 18px',
              background: accentColor + '12', borderBottom: `1px solid ${T.border}`,
            }}>
              <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.text }}>
                Đã chọn {selected.size} đánh giá
              </span>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: T.textSub, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Bỏ chọn
              </button>
              <button
                type="button"
                onClick={() => { setBulkError(''); setBulkOpen(true); }}
                style={{
                  marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, background: '#DC2626', border: '1px solid transparent',
                  color: 'white', fontFamily: FONT, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Trash2 size={13} /> Xóa {selected.size} đánh giá
              </button>
            </div>
          )}
          {filtered.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <Search size={24} color={T.textMuted} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
              <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Không tìm thấy đánh giá nào</p>
            </div>
          ) : isMobile ? (
            <>
              <MobileSortBar
                allSelected={allPageSelected}
                someSelected={somePageSelected}
                onToggleAll={toggleAllPage}
                sortKey={sortKey}
                sortDir={sortDir}
                onSortKey={(k) => { setSortKey(k); setSortDir(k === 'user' ? 'asc' : 'desc'); }}
                onToggleDir={() => setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))}
                accentColor={accentColor}
              />
              <MobileReviewList
                reviews={pageReviews}
                selected={selected}
                onToggle={toggleOne}
                accentColor={accentColor}
                expandedId={expandedId}
                onToggleReplies={(id) => setExpandedId(prev => (prev === id ? null : id))}
                onDelete={(r) => { setDeleteReview(r); setDeleteId(r.id); setDeleteError(''); }}
              />
            </>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.surfaceAlt }}>
                  <th style={{ padding: '12px 0 12px 18px', width: 18, borderBottom: `1px solid ${T.border}` }}>
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả đánh giá trong trang"
                      checked={allPageSelected}
                      ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
                      onChange={toggleAllPage}
                      style={{ accentColor, cursor: 'pointer', width: 15, height: 15 }}
                    />
                  </th>
                  <SortTh label="Người dùng" sortKey="user"    active={sortKey === 'user'}    dir={sortDir} onSort={handleSort} />
                  <SortTh label="Đánh giá"   sortKey="rating"  active={sortKey === 'rating'}  dir={sortDir} onSort={handleSort} />
                  <th style={{ padding: '12px 18px', textAlign: 'left', fontFamily: FONT, fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>Nội dung</th>
                  <SortTh label="Trả lời"    sortKey="replies" active={sortKey === 'replies'} dir={sortDir} onSort={handleSort} />
                  <SortTh label="Ngày"       sortKey="date"    active={sortKey === 'date'}    dir={sortDir} onSort={handleSort} />
                  <th style={{ borderBottom: `1px solid ${T.border}` }} />
                </tr>
              </thead>
              <tbody>
                {pageReviews.map((r, i) => (
                  <React.Fragment key={r.id}>
                  <motion.tr
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.025 }}
                    style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.12s', background: selected.has(r.id) ? accentColor + '0D' : 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = selected.has(r.id) ? accentColor + '16' : T.surfaceHov}
                    onMouseLeave={e => e.currentTarget.style.background = selected.has(r.id) ? accentColor + '0D' : 'transparent'}
                  >
                    {/* Select */}
                    <td style={{ padding: '13px 0 13px 18px', width: 18 }}>
                      <input
                        type="checkbox"
                        aria-label={`Chọn đánh giá của ${r.userName ?? 'người dùng'}`}
                        checked={selected.has(r.id)}
                        onChange={() => toggleOne(r.id)}
                        style={{ accentColor, cursor: 'pointer', width: 15, height: 15 }}
                      />
                    </td>

                    {/* User */}
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 9,
                          background: accentColor + '18',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <span style={{ fontFamily: FONT_TITLE, fontSize: 12, fontWeight: 700, color: accentColor }}>
                            {(r.userName ?? r.userId ?? '?')[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 2 }}>
                            {r.userName ?? r.userId?.slice(0, 8) ?? 'Ẩn danh'}
                          </p>
                          {r.isSpoiler && (
                            <span style={{
                              fontFamily: FONT, fontSize: 10, color: '#D97706',
                              padding: '1px 6px', borderRadius: 4,
                              border: '1px solid #FDE68A', background: '#FEF3C7',
                            }}>
                              Spoiler
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Rating */}
                    <td style={{ padding: '13px 18px' }}>
                      <StarRow rating={r.rating ?? 0} />
                    </td>

                    {/* Review text */}
                    <td style={{ padding: '13px 18px', maxWidth: 340 }}>
                      <p style={{
                        fontFamily: FONT, fontSize: 13, color: T.textSub,
                        lineHeight: 1.55, overflow: 'hidden',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {r.reviewText || <span style={{ color: T.textMuted, fontStyle: 'italic' }}>Không có nội dung</span>}
                      </p>
                    </td>

                    {/* Replies */}
                    <td style={{ padding: '13px 18px', whiteSpace: 'nowrap' }}>
                      {(r.replyCount ?? 0) > 0 ? (
                        <button
                          onClick={() => setExpandedId(prev => (prev === r.id ? null : r.id))}
                          title={expandedId === r.id ? 'Ẩn trả lời' : 'Xem trả lời'}
                          aria-expanded={expandedId === r.id}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                            fontFamily: FONT, fontSize: 12, fontWeight: 600,
                            background: expandedId === r.id ? accentColor + '14' : T.surface,
                            color: expandedId === r.id ? accentColor : T.textSub,
                            border: `1px solid ${expandedId === r.id ? accentColor + '40' : T.border}`,
                            transition: 'all 0.15s',
                          }}
                        >
                          <MessageCircle size={12} />
                          {r.replyCount}
                          {expandedId === r.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      ) : (
                        <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted }}>—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td style={{ padding: '13px 18px', whiteSpace: 'nowrap' }}>
                      <span
                        title={r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : undefined}
                        style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted }}
                      >
                        {timeAgo(r.createdAt)}
                      </span>
                    </td>

                    {/* Delete */}
                    <td style={{ padding: '13px 18px' }}>
                      <button
                        onClick={() => { setDeleteReview(r); setDeleteId(r.id); setDeleteError(''); }}
                        title="Xóa đánh giá"
                        aria-label="Xóa đánh giá"
                        style={{
                          width: 32, height: 32, borderRadius: 9,
                          background: T.surface, border: `1px solid ${T.border}`,
                          cursor: 'pointer', color: T.textMuted,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.3)'; e.currentTarget.style.color = T.red; }}
                        onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </motion.tr>
                  {expandedId === r.id && (
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td colSpan={7} style={{ padding: 0 }}>
                        <ReplyPanel
                          reviewId={r.id}
                          accentColor={accentColor}
                        />
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
      )}

      {!loading && selId && sorted.length > PAGE_SIZE && (
        <AdminPagination {...pagination.props} itemLabel="đánh giá" />
      )}

      {/* ── Delete confirm modal ── */}
      <AnimatePresence>
        {!!deleteReview && (
          <>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <motion.div
              key="review-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { if (!deleting) { setDeleteReview(null); setDeleteId(null); setDeleteError(''); } }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 299, backdropFilter: 'blur(3px)' }}
            />
            <motion.div
              key="review-modal"
              data-admin-modal=""
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1,    y: 0 }}
              exit={{   opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              style={{
                position: 'fixed', inset: 0, margin: 'auto',
                width: 460, height: 'fit-content',
                zIndex: 300,
                background: T.surface,
                borderRadius: 16,
                border: `1px solid ${T.border}`,
                boxShadow: T.shadowLg,
                display: 'flex', flexDirection: 'column',
                fontFamily: FONT, overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3, fontWeight: 600, fontFamily: FONT }}>Đánh giá</p>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em', fontFamily: FONT_TITLE }}>Xác nhận xóa</h2>
                </div>
                <button
                  onClick={() => { if (!deleting) { setDeleteReview(null); setDeleteId(null); setDeleteError(''); } }}
                  disabled={deleting}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: deleting ? 'not-allowed' : 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deleting ? 0.5 : 1 }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Review preview */}
                <div style={{ padding: '12px 14px', borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: accentColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: FONT_TITLE, fontSize: 11, fontWeight: 700, color: accentColor }}>
                          {(deleteReview?.userName ?? deleteReview?.userId ?? '?')[0]?.toUpperCase()}
                        </span>
                      </div>
                      <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.text }}>
                        {deleteReview?.userName ?? deleteReview?.userId?.slice(0, 8) ?? 'Ẩn danh'}
                      </p>
                    </div>
                    <StarRow rating={deleteReview?.rating ?? 0} />
                  </div>
                  {deleteReview?.reviewText && (
                    <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.textSub, lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {deleteReview.reviewText}
                    </p>
                  )}
                  {deleteReview?.isSpoiler && (
                    <span style={{ fontFamily: FONT, fontSize: 10, color: '#D97706', padding: '1px 7px', borderRadius: 4, border: '1px solid #FDE68A', background: '#FEF3C7', alignSelf: 'flex-start' }}>
                      Spoiler
                    </span>
                  )}
                </div>

                {/* Warning */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '11px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)' }}>
                  <AlertTriangle size={15} color={T.red} style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontFamily: FONT, fontSize: 13, color: '#991B1B', lineHeight: 1.6, margin: 0 }}>
                    Hành động này <strong>không thể hoàn tác</strong>. Đánh giá{(deleteReview?.replyCount ?? 0) > 0 ? <> cùng <strong>{deleteReview.replyCount} trả lời</strong></> : ''} sẽ bị xóa vĩnh viễn.
                  </p>
                </div>

                {/* Error */}
                {deleteError && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.25)', fontFamily: FONT, fontSize: 12.5, color: T.red }}>
                    {deleteError}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, background: T.surface, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  onClick={() => { setDeleteReview(null); setDeleteId(null); setDeleteError(''); }}
                  disabled={deleting}
                  style={{ padding: '8px 16px', borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textSub, opacity: deleting ? 0.6 : 1 }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    padding: '8px 18px', borderRadius: 8,
                    background: deleting ? 'rgba(220,38,38,0.5)' : '#DC2626',
                    border: '1px solid transparent',
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'white',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = '#B91C1C'; }}
                  onMouseLeave={e => { if (!deleting) e.currentTarget.style.background = '#DC2626'; }}
                >
                  {deleting
                    ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Đang xóa...</>
                    : <><Trash2 size={13} /> Xóa đánh giá</>
                  }
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Bulk delete confirm modal ── */}
      <AnimatePresence>
        {bulkOpen && (
          <>
            <motion.div
              key="bulk-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { if (!bulkDeleting) setBulkOpen(false); }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 299, backdropFilter: 'blur(3px)' }}
            />
            <motion.div
              key="bulk-modal"
              data-admin-modal=""
              role="dialog" aria-modal="true" aria-label="Xác nhận xóa nhiều đánh giá"
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              style={{
                position: 'fixed', inset: 0, margin: 'auto', width: 440, height: 'fit-content', zIndex: 300,
                background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: T.shadowLg,
                display: 'flex', flexDirection: 'column', fontFamily: FONT, overflow: 'hidden',
              }}
            >
              <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}` }}>
                <p style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3, fontWeight: 600 }}>Đánh giá</p>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0, fontFamily: FONT_TITLE }}>Xóa {selected.size} đánh giá?</h2>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '11px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)' }}>
                  <AlertTriangle size={15} color={T.red} style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontFamily: FONT, fontSize: 13, color: '#991B1B', lineHeight: 1.6, margin: 0 }}>
                    Hành động này <strong>không thể hoàn tác</strong>.
                    {selectedReplyTotal > 0 && <> Kèm <strong>{selectedReplyTotal} trả lời</strong> của các đánh giá này.</>}
                  </p>
                </div>
                {bulkError && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.25)', fontFamily: FONT, fontSize: 12.5, color: T.red }}>
                    {bulkError}
                  </div>
                )}
              </div>
              <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  onClick={() => setBulkOpen(false)}
                  disabled={bulkDeleting}
                  style={{ padding: '8px 16px', borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: bulkDeleting ? 'not-allowed' : 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textSub, opacity: bulkDeleting ? 0.6 : 1 }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  style={{ padding: '8px 18px', borderRadius: 8, background: bulkDeleting ? 'rgba(220,38,38,0.5)' : '#DC2626', border: '1px solid transparent', cursor: bulkDeleting ? 'not-allowed' : 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {bulkDeleting
                    ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Đang xóa...</>
                    : <><Trash2 size={13} /> Xóa {selected.size} đánh giá</>}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}