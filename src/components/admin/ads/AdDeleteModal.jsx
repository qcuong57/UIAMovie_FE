// src/components/admin/ads/AdDeleteModal.jsx
import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import adService from '../../../services/adService';
import { useToast } from '../common/Toast';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../../context/adminTokens';

export default function AdDeleteModal({ ad, onClose, onDeleted }) {
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adService.deleteAd(ad.id);
      toast.success(`Đã xóa quảng cáo "${ad.title}"`);
      onDeleted?.(ad.id);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Có lỗi xảy ra khi xóa');
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (deleting) return;
    onClose();
  };

  const scheduleCount = ad?.globalSlotCount ?? ad?.globalSlots?.length ?? 0;

  return (
    <AnimatePresence>
      {!!ad && (
        <>
          <style>{ADMIN_GOOGLE_FONTS}</style>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 399, backdropFilter: 'blur(3px)' }}
          />

          <motion.div key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{   opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            style={{
              position: 'fixed', inset: 0, margin: 'auto',
              width: 440, height: 'fit-content',
              zIndex: 400, background: T.surface, borderRadius: 16,
              border: `1px solid ${T.border}`, boxShadow: T.shadowLg,
              display: 'flex', flexDirection: 'column', fontFamily: FONT, overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trash2 size={16} color={T.red} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2, fontWeight: 600 }}>Xác nhận</p>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0, fontFamily: FONT_TITLE }}>Xóa quảng cáo</h2>
                </div>
              </div>
              <button onClick={handleClose} disabled={deleting}
                style={{ width: 30, height: 30, borderRadius: '50%', background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: deleting ? 'not-allowed' : 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deleting ? 0.5 : 1 }}>
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Ad info */}
              <div style={{ padding: '12px 14px', borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 700, color: T.text, marginBottom: 4 }}>{ad.title}</p>
                <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>
                  ID: {ad.id?.slice(0, 8)}… · {ad.durationSeconds}s
                  {ad.skipAfterSeconds != null ? ` · skip sau ${ad.skipAfterSeconds}s` : ''}
                </p>
              </div>

              {/* Cảnh báo nếu có schedules */}
              {scheduleCount > 0 && (
                <div style={{ padding: '11px 14px', borderRadius: 9, background: '#FFFBEB', border: '1px solid rgba(217,119,6,0.25)', display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  <AlertTriangle size={14} color={T.gold} style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontFamily: FONT, fontSize: 12.5, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                    Quảng cáo này đang được gắn vào <strong>{scheduleCount} global slot</strong>. Xóa sẽ gỡ toàn bộ slot liên quan.
                  </p>
                </div>
              )}

              <p style={{ fontFamily: FONT, fontSize: 13, color: T.textSub, margin: 0, lineHeight: 1.6 }}>
                Hành động này <strong style={{ color: T.text }}>không thể hoàn tác</strong>.
                File video trên Cloudinary cũng sẽ bị xóa vĩnh viễn.
              </p>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={handleClose} disabled={deleting}
                style={{ padding: '8px 16px', borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textSub, opacity: deleting ? 0.6 : 1 }}>
                Hủy
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{
                  padding: '8px 18px', borderRadius: 8,
                  background: deleting ? '#FEE2E2' : T.red,
                  border: `1px solid ${deleting ? 'rgba(220,38,38,0.3)' : 'transparent'}`,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontFamily: FONT, fontSize: 13, fontWeight: 600,
                  color: deleting ? T.red : 'white',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'background 0.15s',
                }}>
                {deleting
                  ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Đang xóa...</>
                  : <><Trash2 size={13} /> Xóa quảng cáo</>
                }
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}