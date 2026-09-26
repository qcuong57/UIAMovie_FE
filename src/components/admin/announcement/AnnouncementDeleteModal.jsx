// src/components/admin/announcement/AnnouncementDeleteModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Trash2, X } from 'lucide-react';
import notificationService from '../../../services/notificationService';
import { T, FONT_BODY as FONT, FONT_TITLE } from '../../../context/adminTokens';

export default function AnnouncementDeleteModal({ item, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!item) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await notificationService.adminDeleteNotification(item.id);
      onDeleted?.(item.id);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi xóa thông báo này');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!loading ? onClose : undefined}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(3px)' }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 420,
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            boxShadow: T.shadowLg,
            overflow: 'hidden',
            fontFamily: FONT,
            zIndex: 1,
            padding: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: T.red }}>
              <AlertCircle size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontFamily: FONT_TITLE, fontSize: 16, fontWeight: 800, color: T.text, margin: 0 }}>
                Xóa thông báo?
              </h3>
              <p style={{ fontSize: 13, color: T.textSub, marginTop: 6, lineHeight: 1.5 }}>
                Bạn có chắc muốn xóa vĩnh viễn thông báo <strong style={{ color: T.text }}>"{item.title}"</strong>? Bài viết sẽ bị gỡ bỏ khỏi bảng tin của người dùng.
              </p>
              {error && <p style={{ fontSize: 12, color: T.red, marginTop: 8 }}>{error}</p>}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 22 }}>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: T.surfaceAlt,
                border: `1px solid ${T.border}`,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 600,
                color: T.textSub,
              }}
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                background: T.red,
                border: 'none',
                cursor: loading ? 'wait' : 'pointer',
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {loading ? 'Đang xóa...' : <><Trash2 size={13} /> Xóa vĩnh viễn</>}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}