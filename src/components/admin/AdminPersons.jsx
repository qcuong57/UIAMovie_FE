// src/components/admin/AdminPersons.jsx
//
// REFACTORED: bản trước lấy person bằng cách crawl /movies + /tvshows (dữ liệu TMDB-shaped,
// không có Id thật nên không thể Sửa/Xóa). Bản này gọi thẳng PersonsController qua
// personService.searchPersons — trả về Person thật trong DB (Guid Id), cho phép Thêm/Sửa/Xóa
// hoạt động đúng với PersonAddModal / PersonEditModal / PersonDeleteModal / PersonDetailPanel.
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Plus, RefreshCw } from 'lucide-react';
import { usePagination } from '../../hooks/usePagination';
import AdminPagination from '../common/AdminPagination';
import personService from '../../services/personService';
import PersonAddModal from './person/PersonAddModal';
import PersonEditModal from './person/PersonEditModal';
import PersonDeleteModal from './person/PersonDeleteModal';
import PersonDetailPanel from './person/PersonDetailPanel';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../context/adminTokens';

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 350;

// ── PersonCard ────────────────────────────────────────────────────────────────
const PersonCard = ({ person, index, onClick }) => {
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.018 }}
      onClick={() => onClick(person)}
      style={{
        background: T.surface, borderRadius: 14,
        border: `1px solid ${T.border}`, boxShadow: T.shadow,
        overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = T.shadowMd; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = T.shadow;   e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Photo */}
      <div style={{ aspectRatio: '2/3', background: T.bg, overflow: 'hidden', position: 'relative' }}>
        {person.profileUrl && !imgErr ? (
          <img src={person.profileUrl} alt={person.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }}
            onError={() => setImgErr(true)} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.surfaceAlt }}>
            <User size={34} color={T.textMuted} strokeWidth={1.2} />
          </div>
        )}
        {person.tmdbPersonId != null && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            padding: '3px 8px', borderRadius: 6,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(4px)',
            boxShadow: T.shadow,
            fontFamily: FONT, fontSize: 9.5, fontWeight: 700,
            color: T.textSub,
            letterSpacing: '0.05em',
          }}>
            TMDB #{person.tmdbPersonId}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '11px 12px 13px' }}>
        <p style={{
          fontFamily: FONT_TITLE, fontSize: 13, fontWeight: 700,
          color: T.text, marginBottom: 3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {person.name}
        </p>
        <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {person.placeOfBirth || (person.birthday ? person.birthday : 'Chưa có thông tin')}
        </p>
      </div>
    </motion.div>
  );
};

// ── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
    <div style={{
      aspectRatio: '2/3',
      background: `linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.surfaceHov} 50%, ${T.surfaceAlt} 75%)`,
      backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite',
    }} />
    <div style={{ padding: '11px 12px 13px' }}>
      <div style={{ height: 13, width: '75%', borderRadius: 5, marginBottom: 7,
        background: `linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.surfaceHov} 50%, ${T.surfaceAlt} 75%)`,
        backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite',
      }} />
      <div style={{ height: 11, width: '45%', borderRadius: 5,
        background: `linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.surfaceHov} 50%, ${T.surfaceAlt} 75%)`,
        backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite 0.1s',
      }} />
    </div>
  </div>
);

// ── AdminPersons ──────────────────────────────────────────────────────────────
export default function AdminPersons() {
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal / panel state
  const [detailId, setDetailId] = useState(null);   // Guid | null — mở PersonDetailPanel
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);     // person | null — mở PersonEditModal
  const [deleteTarget, setDeleteTarget] = useState(null); // person | null — mở PersonDeleteModal

  const pagination = usePagination({ total: totalCount, pageSize: PAGE_SIZE });
  const page = pagination.page ?? pagination.currentPage ?? 1;

  // Debounce ô tìm kiếm
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  // Reset về trang 1 khi đổi từ khoá tìm kiếm
  useEffect(() => {
    pagination.setPage?.(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    personService
      .searchPersons(debouncedSearch || undefined, page, PAGE_SIZE)
      .then(res => {
        const data = res?.data ?? res;
        setItems(data?.items ?? []);
        setTotalCount(data?.totalCount ?? 0);
      })
      .catch(e => {
        setError(e?.response?.data?.message ?? e?.message ?? 'Không thể tải danh sách');
        setItems([]);
        setTotalCount(0);
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch, page]);

  useEffect(() => { load(); }, [load]);

  // ── Handlers ──
  const handleCreated = () => {
    setAddOpen(false);
    load();
  };

  const handleSaved = () => {
    setEditTarget(null);
    load();
  };

  const handleDeleted = (id) => {
    setDeleteTarget(null);
    if (detailId === id) setDetailId(null);
    load();
  };

  return (
    <div style={{ padding: '28px 32px 64px', maxWidth: 1200, fontFamily: FONT }}>
      <style>{ADMIN_GOOGLE_FONTS}</style>
      <style>{`@keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }`}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11.5, color: T.textMuted, marginBottom: 3, fontFamily: FONT, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Quản lý</p>
          <h2 style={{ fontFamily: FONT_TITLE, fontSize: 23, fontWeight: 700, color: T.text, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 8 }}>
            Diễn viên & Đạo diễn
            <span style={{ fontSize: 13.5, fontWeight: 500, color: T.textMuted, letterSpacing: 0, fontFamily: FONT }}>
              · {totalCount.toLocaleString('vi-VN')}
            </span>
          </h2>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', borderRadius: 11,
            background: T.accent, border: '1px solid transparent',
            cursor: 'pointer', fontFamily: FONT, fontSize: 13.5, fontWeight: 600,
            color: 'white', boxShadow: T.shadow, flexShrink: 0,
          }}
        >
          <Plus size={15} /> Thêm mới
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={14} color={T.textMuted} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            placeholder="Tìm theo tên…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', height: 42, padding: '0 14px 0 38px',
              borderRadius: 11, background: T.surface, border: `1px solid ${T.border}`,
              fontFamily: FONT, fontSize: 13.5, color: T.text, outline: 'none',
              boxShadow: T.shadow, transition: 'border-color 0.15s', boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = T.accent + '80'}
            onBlur={e  => e.target.style.borderColor = T.border}
          />
        </div>
        <button
          onClick={load}
          disabled={loading}
          title="Tải lại"
          style={{
            width: 42, height: 42, borderRadius: 11,
            background: T.surface, border: `1px solid ${T.border}`,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: T.shadow, color: T.textSub, flexShrink: 0,
          }}
        >
          <RefreshCw size={15} style={{ animation: loading ? 'spin 0.9s linear infinite' : 'none' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </button>
      </div>

      {/* ── Error ── */}
      {!!error && !loading && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 20,
          background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.25)',
          fontFamily: FONT, fontSize: 13, color: T.red,
        }}>
          {error}
        </div>
      )}

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
          {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: '96px 0', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, background: T.surfaceAlt,
            border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <User size={28} color={T.textMuted} strokeWidth={1.2} />
          </div>
          <p style={{ fontFamily: FONT_TITLE, fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 6 }}>
            {debouncedSearch ? 'Không tìm thấy kết quả' : 'Chưa có diễn viên/đạo diễn nào'}
          </p>
          <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted, marginBottom: debouncedSearch ? 0 : 18 }}>
            {debouncedSearch ? 'Thử thay đổi từ khoá tìm kiếm' : 'Bắt đầu bằng cách thêm mới'}
          </p>
          {!debouncedSearch && (
            <button
              onClick={() => setAddOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 10,
                background: T.accent, border: '1px solid transparent',
                cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600,
                color: 'white',
              }}
            >
              <Plus size={14} /> Thêm mới
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
            <AnimatePresence>
              {items.map((p, i) => (
                <PersonCard key={p.id} person={p} index={i} onClick={person => setDetailId(person.id)} />
              ))}
            </AnimatePresence>
          </div>
          <AdminPagination {...pagination.props} itemLabel="người" />
        </>
      )}

      {/* ── Modals ── */}
      <PersonAddModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={handleCreated}
      />

      <PersonDetailPanel
        personId={detailId}
        onClose={() => setDetailId(null)}
        onEdit={person => { setDetailId(null); setEditTarget(person); }}
        onDelete={person => { setDetailId(null); setDeleteTarget(person); }}
      />

      <PersonEditModal
        person={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={handleSaved}
      />

      <PersonDeleteModal
        person={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleDeleted}
      />
    </div>
  );
}