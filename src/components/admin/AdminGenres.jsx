// src/pages/admin/AdminGenres.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, AlertCircle, Check } from 'lucide-react';
import genreService from '../../services/genreService';
import { Button, Input, Modal, Spinner } from '../../components/ui';
import { C, FONT_DISPLAY, FONT_BODY } from '../../context/homeTokens';

const GENRE_COLOR_LIST = [
  '#dc2626','#0891b2','#7c3aed','#d97706','#be185d',
  '#5b21b6','#166534','#0e7490','#b45309','#3f6212',
];

export default function AdminGenres() {
  const [genres,   setGenres]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [editItem, setEditItem] = useState(null);  // { id, name, description }
  const [deleteId, setDeleteId] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form,     setForm]     = useState({ name: '', description: '' });
  const [error,    setError]    = useState('');

  const fetchGenres = async () => {
    setLoading(true);
    try {
      const res = await genreService.getAllGenres();
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
    setSaving(true);
    setError('');
    try {
      if (editItem) {
        await genreService.updateGenre(editItem.id, form);
        setGenres(prev => prev.map(g => g.id === editItem.id ? { ...g, ...form } : g));
        setEditItem(null);
      } else {
        const res = await genreService.createGenre(form);
        const newGenre = res?.data ?? res;
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
    <div style={{ padding: '36px 40px 64px', maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
            Quản lý
          </p>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 900, color: 'white', margin: 0 }}>
            Thể loại ({genres.length})
          </h1>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openAdd}>
          Thêm thể loại
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ padding: '64px 0', textAlign: 'center' }}>
          <Spinner size="md" color="red" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          <AnimatePresence>
            {genres.map((g, i) => {
              const color = GENRE_COLOR_LIST[i % GENRE_COLOR_LIST.length];
              return (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    background: '#0d0d0d',
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: '18px 18px 14px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Color bar */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color }} />

                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 800, color: 'white', marginBottom: 4 }}>
                        {g.name}
                      </p>
                      {g.description && (
                        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {g.description}
                        </p>
                      )}
                      {g.movieCount !== undefined && (
                        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>
                          {g.movieCount} phim
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openEdit(g)}
                        style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: 'rgba(255,255,255,0.05)',
                          border: `1px solid ${C.border}`,
                          cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Pencil size={12} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setDeleteId(g.id)}
                        style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: 'rgba(229,24,30,0.08)',
                          border: `1px solid rgba(229,24,30,0.2)`,
                          cursor: 'pointer', color: C.accent,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={12} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
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
            <Button variant="primary" size="sm" loading={saving} icon={<Check size={14} />} onClick={handleSave}>
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
          <AlertCircle size={18} color={C.accent} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
            Xóa thể loại này? Các phim liên kết sẽ mất thể loại này.
          </p>
        </div>
      </Modal>
    </div>
  );
}