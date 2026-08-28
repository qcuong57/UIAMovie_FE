// src/components/admin/person/PersonDeleteModal.jsx
import React, { useState } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import personService from '../../../services/personService';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../../context/adminTokens';
import { useToast } from '../common/Toast';

/**
 * Props:
 *   person  – object { id, name, profileUrl, tmdbPersonId } | null
 *   onClose – () => void
 *   onDeleted – (id) => void   called after successful delete
 */
export default function PersonDeleteModal({ person, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const handleDelete = async () => {
    if (!person) return;
    setDeleting(true);
    setError('');
    try {
      await personService.deletePerson(person.id);
      toast.success(`Đã xóa "${person.name}"`);
      onDeleted?.(person.id);
      onClose();
    } catch (e) {
      const message = e?.response?.data?.message ?? e?.message ?? 'Có lỗi xảy ra khi xóa';
      setError(message);
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {!!person && (
        <>
          <style>{ADMIN_GOOGLE_FONTS}</style>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!deleting) onClose();
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.3)',
              zIndex: 299,
              backdropFilter: 'blur(3px)',
            }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            style={{
              position: 'fixed',
              inset: 0,
              margin: 'auto',
              width: 440,
              height: 'fit-content',
              zIndex: 300,
              background: T.surface,
              borderRadius: 16,
              border: `1px solid ${T.border}`,
              boxShadow: T.shadowLg,
              display: 'flex',
              flexDirection: 'column',
              fontFamily: FONT,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '18px 20px',
                borderBottom: `1px solid ${T.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 11,
                    color: T.textMuted,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: 3,
                    fontWeight: 600,
                    fontFamily: FONT,
                  }}
                >
                  Diễn viên / Đạo diễn
                </p>
                <h2
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: T.text,
                    margin: 0,
                    letterSpacing: '-0.01em',
                    fontFamily: FONT_TITLE,
                  }}
                >
                  Xác nhận xóa
                </h2>
              </div>
              <button
                onClick={onClose}
                disabled={deleting}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: T.surfaceAlt,
                  border: `1px solid ${T.border}`,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  color: T.textSub,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: deleting ? 0.5 : 1,
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {/* Person preview */}
              {person?.profileUrl && (
                <div
                  style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: T.surfaceAlt,
                    border: `1px solid ${T.border}`,
                  }}
                >
                  <img
                    src={person.profileUrl}
                    alt=""
                    style={{
                      width: 48,
                      height: 68,
                      borderRadius: 8,
                      objectFit: 'cover',
                      flexShrink: 0,
                      border: `1px solid ${T.border}`,
                    }}
                  />
                  <div>
                    <p
                      style={{
                        fontFamily: FONT,
                        fontSize: 10.5,
                        color: T.textMuted,
                        marginBottom: 3,
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        fontWeight: 700,
                      }}
                    >
                      Sắp xóa
                    </p>
                    <p
                      style={{
                        fontFamily: FONT,
                        fontSize: 14,
                        color: T.text,
                        fontWeight: 700,
                        lineHeight: 1.4,
                      }}
                    >
                      {person?.name}
                    </p>
                    {person?.tmdbPersonId && (
                      <p
                        style={{
                          fontFamily: FONT,
                          fontSize: 11,
                          color: T.textMuted,
                          marginTop: 2,
                        }}
                      >
                        TMDB #{person.tmdbPersonId}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Warning */}
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: '#FEF2F2',
                  border: '1px solid rgba(220,38,38,0.2)',
                }}
              >
                <AlertTriangle
                  size={16}
                  color={T.red}
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
                <p
                  style={{
                    fontFamily: FONT,
                    fontSize: 13,
                    color: '#991B1B',
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  Hành động này <strong>không thể hoàn tác</strong>. Diễn viên/đạo diễn sẽ bị xóa khỏi hệ thống (nếu không gắn với phim nào).
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#FEF2F2',
                    border: '1px solid rgba(220,38,38,0.25)',
                    fontFamily: FONT,
                    fontSize: 12.5,
                    color: T.red,
                  }}
                >
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: `1px solid ${T.border}`,
                background: T.surface,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              <button
                onClick={onClose}
                disabled={deleting}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: T.surfaceAlt,
                  border: `1px solid ${T.border}`,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontFamily: FONT,
                  fontSize: 13,
                  fontWeight: 600,
                  color: T.textSub,
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: deleting ? 'rgba(220,38,38,0.5)' : '#DC2626',
                  border: '1px solid transparent',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontFamily: FONT,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => {
                  if (!deleting) e.currentTarget.style.background = '#B91C1C';
                }}
                onMouseLeave={e => {
                  if (!deleting) e.currentTarget.style.background = '#DC2626';
                }}
              >
                {deleting ? (
                  <>
                    <div
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: '50%',
                        border: '2px solid currentColor',
                        borderTopColor: 'transparent',
                        animation: 'spin 0.7s linear infinite',
                      }}
                    />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 size={13} /> Xóa
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}