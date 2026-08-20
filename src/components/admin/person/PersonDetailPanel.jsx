// src/components/admin/person/PersonDetailPanel.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar, MapPin, Image as ImageIcon, Pencil, Trash2, Hash } from 'lucide-react';
import personService from '../../../services/personService';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../../context/adminTokens';

/**
 * Props:
 *   personId  – string | null   Guid của Person cần xem chi tiết; null/undefined = đóng panel
 *   onClose   – () => void
 *   onEdit    – (person) => void   optional, mở PersonEditModal với person đã load đầy đủ
 *   onDelete  – (person) => void   optional, mở PersonDeleteModal với person đã load đầy đủ
 */
export default function PersonDetailPanel({ personId, onClose, onEdit, onDelete }) {
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imgErr, setImgErr] = useState(false);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    if (!personId) {
      setPerson(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    setImgErr(false);
    setActiveImage(null);

    personService
      .getPersonById(personId)
      .then(res => {
        if (cancelled) return;
        const data = res?.data ?? res;
        setPerson(data);
        setActiveImage(data?.profileUrl ?? data?.profileImages?.[0] ?? null);
      })
      .catch(e => {
        if (cancelled) return;
        setError(e?.response?.data?.message ?? e?.message ?? 'Không thể tải thông tin');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [personId]);

  const open = !!personId;

  return (
    <AnimatePresence>
      {open && (
        <>
          <style>{ADMIN_GOOGLE_FONTS}</style>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.3)',
              zIndex: 299,
              backdropFilter: 'blur(3px)',
            }}
          />

          {/* Panel */}
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
              width: 660,
              height: 'fit-content',
              maxHeight: '88vh',
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
                flexShrink: 0,
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
                  Chi tiết
                </p>
                <h2
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: T.text,
                    margin: 0,
                    letterSpacing: '-0.01em',
                    fontFamily: FONT_TITLE,
                    maxWidth: 460,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {loading ? 'Đang tải…' : person?.name ?? 'Diễn viên / Đạo diễn'}
                </h2>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: T.surfaceAlt,
                  border: `1px solid ${T.border}`,
                  cursor: 'pointer',
                  color: T.textSub,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              {loading && (
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 160,
                      aspectRatio: '2/3',
                      borderRadius: 12,
                      flexShrink: 0,
                      background: `linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.surfaceHov} 50%, ${T.surfaceAlt} 75%)`,
                      backgroundSize: '400px 100%',
                      animation: 'shimmer 1.4s infinite',
                    }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div
                      style={{
                        height: 22,
                        width: '55%',
                        borderRadius: 6,
                        background: `linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.surfaceHov} 50%, ${T.surfaceAlt} 75%)`,
                        backgroundSize: '400px 100%',
                        animation: 'shimmer 1.4s infinite',
                      }}
                    />
                    <div
                      style={{
                        height: 13,
                        width: '35%',
                        borderRadius: 6,
                        background: `linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.surfaceHov} 50%, ${T.surfaceAlt} 75%)`,
                        backgroundSize: '400px 100%',
                        animation: 'shimmer 1.4s infinite 0.1s',
                      }}
                    />
                  </div>
                </div>
              )}

              {!loading && error && (
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: '#FEF2F2',
                    border: '1px solid rgba(220,38,38,0.25)',
                    fontFamily: FONT,
                    fontSize: 13,
                    color: T.red,
                  }}
                >
                  {error}
                </div>
              )}

              {!loading && !error && person && (
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', fontFamily: FONT }}>
                  {/* Photo */}
                  <div
                    style={{
                      width: 160,
                      flexShrink: 0,
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: T.bg,
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    {activeImage && !imgErr ? (
                      <img
                        src={activeImage}
                        alt={person.name}
                        style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }}
                        onError={() => setImgErr(true)}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '2/3',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: T.surfaceAlt,
                        }}
                      >
                        <User size={48} color={T.textMuted} strokeWidth={1} />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2
                      style={{
                        fontFamily: FONT_TITLE,
                        fontSize: 22,
                        fontWeight: 700,
                        color: T.text,
                        margin: 0,
                        marginBottom: 10,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {person.name}
                    </h2>

                    {/* Meta */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
                      {person.birthday && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <Calendar size={13} color={T.textMuted} />
                          <span style={{ fontFamily: FONT, fontSize: 13, color: T.textSub }}>
                            {(() => {
                              const d = new Date(person.birthday);
                              return isNaN(d.getTime())
                                ? person.birthday
                                : d.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
                            })()}
                          </span>
                        </div>
                      )}
                      {person.placeOfBirth && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <MapPin size={13} color={T.textMuted} />
                          <span style={{ fontFamily: FONT, fontSize: 13, color: T.textSub }}>{person.placeOfBirth}</span>
                        </div>
                      )}
                      {person.tmdbPersonId != null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <Hash size={13} color={T.textMuted} />
                          <span style={{ fontFamily: FONT, fontSize: 12.5, color: T.textMuted }}>TMDB ID: #{person.tmdbPersonId}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span
                          style={{
                            fontFamily: FONT,
                            fontSize: 11,
                            color: T.textMuted,
                            wordBreak: 'break-all',
                          }}
                        >
                          ID: {person.id}
                        </span>
                      </div>
                    </div>

                    {/* Biography */}
                    {person.biography ? (
                      <div style={{ marginBottom: 18 }}>
                        <p
                          style={{
                            fontFamily: FONT,
                            fontSize: 11,
                            fontWeight: 700,
                            color: T.textMuted,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: 8,
                          }}
                        >
                          Tiểu sử
                        </p>
                        <p style={{ fontFamily: FONT, fontSize: 13, color: T.textSub, lineHeight: 1.7, maxHeight: 160, overflowY: 'auto', margin: 0 }}>
                          {person.biography}
                        </p>
                      </div>
                    ) : (
                      <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.textMuted, fontStyle: 'italic', marginBottom: 18 }}>
                        Chưa có tiểu sử
                      </p>
                    )}

                    {/* Gallery */}
                    {person.profileImages?.length > 0 && (
                      <div>
                        <p
                          style={{
                            fontFamily: FONT,
                            fontSize: 11,
                            fontWeight: 700,
                            color: T.textMuted,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: 10,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <ImageIcon size={11} color={T.textMuted} />
                          {person.profileImages.length} ảnh
                        </p>
                        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                          {person.profileImages.slice(0, 8).map((url, i) => (
                            <button
                              key={url + i}
                              onClick={() => {
                                setActiveImage(url);
                                setImgErr(false);
                              }}
                              style={{
                                padding: 0,
                                border: `2px solid ${activeImage === url ? T.accent : T.border}`,
                                borderRadius: 7,
                                overflow: 'hidden',
                                cursor: 'pointer',
                                background: 'none',
                                lineHeight: 0,
                              }}
                            >
                              <img src={url} alt="" style={{ width: 34, height: 48, objectFit: 'cover', display: 'block' }} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                {person && onEdit && (
                  <button
                    onClick={() => onEdit(person)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      background: T.surfaceAlt,
                      border: `1px solid ${T.border}`,
                      cursor: 'pointer',
                      fontFamily: FONT,
                      fontSize: 13,
                      fontWeight: 600,
                      color: T.textSub,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Pencil size={13} /> Sửa
                  </button>
                )}
                {person && onDelete && (
                  <button
                    onClick={() => onDelete(person)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      background: '#FEF2F2',
                      border: '1px solid rgba(220,38,38,0.2)',
                      cursor: 'pointer',
                      fontFamily: FONT,
                      fontSize: 13,
                      fontWeight: 600,
                      color: T.red,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Trash2 size={13} /> Xóa
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 20px',
                  borderRadius: 8,
                  background: T.surfaceAlt,
                  border: `1px solid ${T.border}`,
                  cursor: 'pointer',
                  fontFamily: FONT,
                  fontSize: 13,
                  fontWeight: 600,
                  color: T.textSub,
                }}
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}