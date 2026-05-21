// src/pages/admin/AdminGenres.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, AlertCircle, Check, X } from 'lucide-react';
import genreService from '../../services/genreService';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../context/adminTokens';

const PALETTE = [
  '#1C5F3A','#1D4ED8','#9333EA','#D97706','#DC2626',
  '#0891B2','#BE185D','#166534','#C2410C','#0E7490',
];

// ── Input style ────────────────────────────────────────────────────────────────
const inputStyle = (focused) => ({
  width: '100%',
  padding: '10px 14px',
  background: T.surface,
  border: `1px solid ${focused ? T.borderFocus : T.border}`,
  borderRadius: 10,
  color: T.text,
  outline: 'none',
  fontFamily: FONT,
  fontSize: 13.5,
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
});

// ── Custom Modal (trắng, giống UserEditModal) ─────────────────────────────────
const GenreModal = ({ open, onClose, title, children, footer }) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 299, backdropFilter: 'blur(3px)' }}
        />
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1,    y: 0 }}
          exit={{   opacity: 0, scale: 0.97, y: 8 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          style={{
            position: 'fixed', inset: 0, margin: 'auto',
            width: 420, height: 'fit-content', maxHeight: '90vh',
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
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div>
              <p style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3, fontWeight: 600, fontFamily: FONT }}>Thể loại</p>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em', fontFamily: FONT_TITLE }}>{title}</h2>
            </div>
            <button
              onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: '50%', background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: T.surface }}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, background: T.surface, display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
              {footer}
            </div>
          )}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// ── FieldInput (stateful focus) ───────────────────────────────────────────────
const FieldInput = ({ value, onChange, placeholder, fieldKey }) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={inputStyle(focused)}
    />
  );
};

// ── Genre Card ─────────────────────────────────────────────────────────────────
const GenreCard = ({ genre, color, index, onEdit, onDelete }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.94 }}
    transition={{ delay: index * 0.03 }}
    style={{
      background:   T.surface,
      borderRadius: 14,
      border:       `1px solid ${T.border}`,
      boxShadow:    T.shadow,
      padding:      '18px 18px 16px',
      position:     'relative',
      overflow:     'hidden',
      display:      'flex',
      flexDirection:'column',
      gap:          12,
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.09)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = T.shadow}
  >
    {/* Color accent bar */}
    <div style={{
      position:     'absolute',
      top:          0, left: 0, right: 0,
      height:       3,
      background:   color,
      borderRadius: '14px 14px 0 0',
    }} />

    {/* Color dot + name */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
      <div style={{
        width:        28, height: 28,
        borderRadius: 8,
        background:   `${color}18`,
        border:       `1px solid ${color}30`,
        flexShrink:   0,
        display:      'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 10, height: 10,
          borderRadius: '50%',
          background: color,
        }} />
      </div>
      <p style={{
        fontFamily: FONT, fontSize: 14,
        fontWeight: 600, color: T.text,
        flex: 1, minWidth: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {genre.name}
      </p>
    </div>

    {/* Description */}
    {genre.description && (
      <p style={{
        fontFamily:          FONT, fontSize: 12,
        color:               T.textMuted, lineHeight: 1.5,
        overflow:            'hidden',
        display:             '-webkit-box',
        WebkitLineClamp:     2,
        WebkitBoxOrient:     'vertical',
      }}>
        {genre.description}
      </p>
    )}

    {/* Footer */}
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      marginTop:      'auto',
    }}>
      {genre.movieCount !== undefined ? (
        <span style={{
          fontFamily: FONT, fontSize: 11.5,
          color:      T.textMuted,
        }}>
          {genre.movieCount} phim
        </span>
      ) : <span />}

      <div style={{ display: 'flex', gap: 5 }}>
        <button
          onClick={() => onEdit(genre)}
          style={{
            width:        28, height: 28,
            borderRadius: 7,
            background:   T.surfaceHov,
            border:       `1px solid ${T.border}`,
            cursor:       'pointer', color: T.textSub,
            display:      'flex', alignItems: 'center', justifyContent: 'center',
            transition:   'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.accentLight; e.currentTarget.style.color = T.accent; }}
          onMouseLeave={e => { e.currentTarget.style.background = T.surfaceHov; e.currentTarget.style.color = T.textSub; }}
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={() => onDelete(genre.id)}
          style={{
            width:        28, height: 28,
            borderRadius: 7,
            background:   '#FEF2F2',
            border:       '1px solid rgba(220,38,38,0.18)',
            cursor:       'pointer', color: '#DC2626',
            display:      'flex', alignItems: 'center', justifyContent: 'center',
            transition:   'all 0.15s',
          }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  </motion.div>
);

// ── AdminGenres ────────────────────────────────────────────────────────────────
export default function AdminGenres() {
  const [genres,   setGenres]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form,     setForm]     = useState({ name: '', description: '' });
  const [error,    setError]    = useState('');

  const fetchGenres = async () => {
    setLoading(true);
    try {
      const res  = await genreService.getAllGenres();
      const list = Array.isArray(res) ? res : res?.data ?? res?.genres ?? [];
      setGenres(list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGenres(); }, []);

  const openAdd = () => {
    setForm({ name: '', description: '' });
    setError('');
    setShowAdd(true);
  };

  const openEdit = (g) => {
    setForm({ name: g.name, description: g.description ?? '' });
    setError('');
    setEditItem(g);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Tên thể loại không được để trống'); return; }
    setSaving(true); setError('');
    try {
      if (editItem) {
        await genreService.updateGenre(editItem.id, form);
        setGenres(prev => prev.map(g => g.id === editItem.id ? { ...g, ...form } : g));
        setEditItem(null);
      } else {
        await genreService.createGenre(form);
        await fetchGenres();
        setShowAdd(false);
      }
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Có lỗi xảy ra');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await genreService.deleteGenre(deleteId);
      setGenres(prev => prev.filter(g => g.id !== deleteId));
      setDeleteId(null);
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  };

  return (
    <div style={{ padding: '28px 32px 56px', maxWidth: 1100, fontFamily: FONT }}>
      <style>{ADMIN_GOOGLE_FONTS}</style>
      {/* Header */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginBottom:   24,
      }}>
        <div>
          <p style={{ fontSize: 11.5, color: T.textMuted, marginBottom: 3, fontFamily: FONT, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Quản lý</p>
          <h2 style={{
            fontFamily: FONT_TITLE,
            fontSize: 23, fontWeight: 700, color: T.text,
            letterSpacing: '-0.03em',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            Thể loại
            <span style={{
              fontFamily: FONT,
              fontSize: 13.5, fontWeight: 500,
              color: T.textMuted, letterSpacing: 0,
            }}>
              · {genres.length}
            </span>
          </h2>
        </div>
        <button
          onClick={openAdd}
          style={{
            display:      'flex', alignItems: 'center', gap: 7,
            padding:      '9px 18px',
            borderRadius: 10,
            background:   T.accent,
            border:       'none', cursor: 'pointer',
            fontFamily:   FONT, fontSize: 13.5, fontWeight: 600,
            color:        '#fff',
            transition:   'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = T.accentText}
          onMouseLeave={e => e.currentTarget.style.background = T.accent}
        >
          <Plus size={15} strokeWidth={2.2} /> Thêm thể loại
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ padding: '80px 0', textAlign: 'center' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            border: `2.5px solid ${T.accentLight}`,
            borderTopColor: T.accent,
            animation: 'spin 0.75s linear infinite',
            margin: '0 auto',
          }} />
        </div>
      ) : (
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap:                 12,
        }}>
          <AnimatePresence>
            {genres.map((g, i) => (
              <GenreCard
                key={g.id}
                genre={g}
                color={PALETTE[i % PALETTE.length]}
                index={i}
                onEdit={openEdit}
                onDelete={setDeleteId}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Modal */}
      <GenreModal
        open={showAdd || !!editItem}
        onClose={() => { setShowAdd(false); setEditItem(null); setError(''); }}
        title={editItem ? 'Chỉnh sửa thể loại' : 'Thêm thể loại mới'}
        footer={
          <>
            <button
              onClick={() => { setShowAdd(false); setEditItem(null); }}
              style={{ padding: '8px 16px', borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textSub }}
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '8px 18px', borderRadius: 8, background: saving ? T.accentLight : T.accent, border: `1px solid ${saving ? T.accent + '30' : 'transparent'}`, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: saving ? T.accentText : 'white', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s' }}
            >
              {saving
                ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Đang lưu...</>
                : <><Check size={13} /> {editItem ? 'Lưu' : 'Tạo mới'}</>
              }
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tên thể loại</label>
            <FieldInput
              value={form.name}
              onChange={v => setForm(f => ({ ...f, name: v }))}
              placeholder="VD: Action, Drama..."
              fieldKey="name"
            />
            {error && <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.red, margin: 0 }}>{error}</p>}
          </div>

          {/* Description field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mô tả <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(tùy chọn)</span></label>
            <FieldInput
              value={form.description}
              onChange={v => setForm(f => ({ ...f, description: v }))}
              placeholder="Mô tả ngắn về thể loại"
              fieldKey="desc"
            />
          </div>
        </div>
      </GenreModal>

      {/* Delete confirm */}
      <GenreModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xác nhận xóa"
        footer={
          <>
            <button
              onClick={() => setDeleteId(null)}
              style={{ padding: '8px 16px', borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textSub }}
            >
              Hủy
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ padding: '8px 18px', borderRadius: 8, background: deleting ? '#FEE2E2' : T.red, border: 'none', cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: deleting ? T.red : 'white', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s' }}
            >
              {deleting
                ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Đang xóa...</>
                : <><Trash2 size={13} /> Xóa thể loại</>
              }
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertCircle size={18} color={T.red} />
          </div>
          <div>
            <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: T.text, marginBottom: 4 }}>Xóa thể loại này?</p>
            <p style={{ fontFamily: FONT, fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>
              Hành động này không thể hoàn tác. Các phim liên kết sẽ mất thể loại này.
            </p>
          </div>
        </div>
      </GenreModal>
    </div>
  );
}