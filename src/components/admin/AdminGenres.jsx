// src/pages/admin/AdminGenres.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, AlertCircle, Check } from 'lucide-react';
import genreService from '../../services/genreService';
import { Button, Input, Modal, Spinner } from '../../components/ui';

// Import Font Tokens từ homeTokens
import { FONT_BODY, FONT_TITLE } from '../../context/homeTokens';

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

const PALETTE = [
  '#1C5F3A','#1D4ED8','#9333EA','#D97706','#DC2626',
  '#0891B2','#BE185D','#166534','#C2410C','#0E7490',
];

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
        fontFamily: FONT_BODY, fontSize: 14,
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
        fontFamily:          FONT_BODY, fontSize: 12,
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
          fontFamily: FONT_BODY, fontSize: 11.5,
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
    <div style={{ padding: '28px 32px 56px', maxWidth: 1100, fontFamily: FONT_BODY }}>
      {/* Header */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginBottom:   24,
      }}>
        <div>
          <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 3 }}>Quản lý</p>
          <h2 style={{
            fontFamily: FONT_TITLE,
            fontSize: 22, fontWeight: 700, color: T.text,
            letterSpacing: '-0.02em',
          }}>
            Thể loại
            <span style={{
              fontFamily:   FONT_BODY,
              marginLeft:   8, fontSize: 14, fontWeight: 500,
              color:        T.textMuted, letterSpacing: 0,
            }}>
              ({genres.length})
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
            fontFamily:   FONT_BODY, fontSize: 13.5, fontWeight: 600,
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
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
      <Modal
        isOpen={showAdd || !!editItem}
        onClose={() => { setShowAdd(false); setEditItem(null); setError(''); }}
        title={editItem ? 'Chỉnh sửa thể loại' : 'Thêm thể loại mới'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => { setShowAdd(false); setEditItem(null); }}>Hủy</Button>
            <Button variant="primary" size="sm" loading={saving} icon={<Check size={14}/>} onClick={handleSave}>
              {editItem ? 'Lưu' : 'Tạo mới'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Tên thể loại"
            placeholder="VD: Action, Drama..."
            value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))}
            error={error}
          />
          <Input
            label="Mô tả (tùy chọn)"
            placeholder="Mô tả ngắn về thể loại"
            value={form.description}
            onChange={v => setForm(f => ({ ...f, description: v }))}
          />
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xác nhận xóa thể loại"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)}>Hủy</Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>Xóa</Button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }}/>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>
            Xóa thể loại này? Các phim liên kết sẽ mất thể loại này.
          </p>
        </div>
      </Modal>
    </div>
  );
}