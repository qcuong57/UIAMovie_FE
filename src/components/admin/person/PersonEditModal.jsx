// src/components/admin/person/PersonEditModal.jsx
import React, { useState, useEffect } from 'react';
import { Check, X, Plus, ImageOff, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../../config/axios';
import personService from '../../../services/personService';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../../context/adminTokens';
import { useToast } from '../common/Toast';

/**
 * Props:
 *   person  – object { id, name, profileUrl, biography, birthday, placeOfBirth, tmdbPersonId } | null
 *   onClose – () => void
 *   onSaved – (person) => void   called after successful update
 */
export default function PersonEditModal({ person, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    profileUrl: '',
    biography: '',
    birthday: '',
    placeOfBirth: '',
    profileImages: [], // mảng URL ảnh gallery (PersonImage)
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (person) {
      setForm({
        name: person.name ?? '',
        profileUrl: person.profileUrl ?? '',
        biography: person.biography ?? '',
        birthday: person.birthday ?? '',
        placeOfBirth: person.placeOfBirth ?? '',
        profileImages: Array.isArray(person.profileImages) ? [...person.profileImages] : [],
      });
      setError('');
    }
  }, [person]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Tên diễn viên/đạo diễn không được để trống');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const profileImages = form.profileImages.map(u => u.trim()).filter(Boolean);

      const payload = {
        name: form.name.trim(),
        profileUrl: form.profileUrl?.trim() || null,
        biography: form.biography?.trim() || null,
        birthday: form.birthday?.trim() || null,
        placeOfBirth: form.placeOfBirth?.trim() || null,
        profileImages, // gửi luôn -> backend sẽ thay toàn bộ ảnh gallery bằng danh sách này
      };

      await personService.updatePerson(person.id, payload);
      onSaved?.({
        ...person,
        name: form.name.trim(),
        profileUrl: form.profileUrl?.trim(),
        biography: form.biography?.trim(),
        birthday: form.birthday?.trim(),
        placeOfBirth: form.placeOfBirth?.trim(),
        profileImages,
      });
      toast.success(`Đã lưu "${form.name.trim()}"`);
      onClose();
    } catch (e) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Có lỗi xảy ra khi lưu';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
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
            onClick={onClose}
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
              width: 500,
              height: 'fit-content',
              maxHeight: '90vh',
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
                  Chỉnh sửa
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

            {/* Body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 20,
                background: T.surface,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {/* Avatar preview */}
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
                      Đang chỉnh sửa
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

              {/* Form fields */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: FONT,
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    marginBottom: 6,
                  }}
                >
                  Tên *
                </label>
                <input
                  placeholder="Tên…"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{
                    width: '100%',
                    height: 42,
                    padding: '0 14px',
                    borderRadius: 10,
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    fontFamily: FONT,
                    fontSize: 13.5,
                    color: T.text,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.target.style.borderColor = T.accent + '80')}
                  onBlur={e => (e.target.style.borderColor = T.border)}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: FONT,
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    marginBottom: 6,
                  }}
                >
                  URL ảnh profile
                </label>
                <input
                  placeholder="https://…"
                  value={form.profileUrl}
                  onChange={e => setForm(f => ({ ...f, profileUrl: e.target.value }))}
                  style={{
                    width: '100%',
                    height: 42,
                    padding: '0 14px',
                    borderRadius: 10,
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    fontFamily: FONT,
                    fontSize: 13.5,
                    color: T.text,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.target.style.borderColor = T.accent + '80')}
                  onBlur={e => (e.target.style.borderColor = T.border)}
                />
              </div>

              {/* Gallery ảnh (nhiều ảnh — PersonImage) */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: FONT,
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    marginBottom: 6,
                  }}
                >
                  Ảnh gallery ({form.profileImages.length})
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {form.profileImages.map((url, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 7,
                          overflow: 'hidden',
                          flexShrink: 0,
                          background: T.surfaceAlt,
                          border: `1px solid ${T.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {url?.trim() ? (
                          <img
                            src={url}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <ImageOff size={13} color={T.textMuted} />
                        )}
                      </div>
                      <input
                        placeholder="https://…"
                        value={url}
                        onChange={e =>
                          setForm(f => {
                            const next = [...f.profileImages];
                            next[idx] = e.target.value;
                            return { ...f, profileImages: next };
                          })
                        }
                        style={{
                          flex: 1,
                          height: 36,
                          padding: '0 12px',
                          borderRadius: 8,
                          background: T.surface,
                          border: `1px solid ${T.border}`,
                          fontFamily: FONT,
                          fontSize: 13,
                          color: T.text,
                          outline: 'none',
                          boxSizing: 'border-box',
                          transition: 'border-color 0.15s',
                        }}
                        onFocus={e => (e.target.style.borderColor = T.accent + '80')}
                        onBlur={e => (e.target.style.borderColor = T.border)}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setForm(f => ({
                            ...f,
                            profileImages: f.profileImages.filter((_, i) => i !== idx),
                          }))
                        }
                        title="Xóa ảnh này"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 7,
                          background: T.surfaceAlt,
                          border: `1px solid ${T.border}`,
                          cursor: 'pointer',
                          color: T.red,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, profileImages: [...f.profileImages, ''] }))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      height: 36,
                      borderRadius: 8,
                      background: T.surfaceAlt,
                      border: `1px dashed ${T.border}`,
                      cursor: 'pointer',
                      fontFamily: FONT,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: T.textSub,
                    }}
                  >
                    <Plus size={13} /> Thêm URL ảnh
                  </button>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: FONT,
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    marginBottom: 6,
                  }}
                >
                  Tiểu sử
                </label>
                <textarea
                  placeholder="Mô tả về diễn viên/đạo diễn…"
                  value={form.biography}
                  onChange={e => setForm(f => ({ ...f, biography: e.target.value }))}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    fontFamily: FONT,
                    fontSize: 13.5,
                    color: T.text,
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.target.style.borderColor = T.accent + '80')}
                  onBlur={e => (e.target.style.borderColor = T.border)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: FONT,
                      fontSize: 11,
                      fontWeight: 700,
                      color: T.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      marginBottom: 6,
                    }}
                  >
                    Ngày sinh
                  </label>
                  <input
                    placeholder="YYYY-MM-DD"
                    value={form.birthday}
                    onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))}
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '0 14px',
                      borderRadius: 10,
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      fontFamily: FONT,
                      fontSize: 13.5,
                      color: T.text,
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.target.style.borderColor = T.accent + '80')}
                    onBlur={e => (e.target.style.borderColor = T.border)}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: FONT,
                      fontSize: 11,
                      fontWeight: 700,
                      color: T.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      marginBottom: 6,
                    }}
                  >
                    Nơi sinh
                  </label>
                  <input
                    placeholder="Thành phố, Quốc gia"
                    value={form.placeOfBirth}
                    onChange={e => setForm(f => ({ ...f, placeOfBirth: e.target.value }))}
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '0 14px',
                      borderRadius: 10,
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      fontFamily: FONT,
                      fontSize: 13.5,
                      color: T.text,
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.target.style.borderColor = T.accent + '80')}
                    onBlur={e => (e.target.style.borderColor = T.border)}
                  />
                </div>
              </div>

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

              <p
                style={{
                  fontFamily: FONT,
                  fontSize: 12,
                  color: T.textMuted,
                  lineHeight: 1.65,
                  padding: '10px 14px',
                  background: T.surfaceAlt,
                  borderRadius: 9,
                  border: `1px solid ${T.border}`,
                  margin: 0,
                }}
              >
                Chỉ có thể sửa tên, ảnh, tiểu sử, ngày sinh và nơi sinh. TMDB ID không thể thay đổi.
              </p>
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
                flexShrink: 0,
              }}
            >
              <button
                onClick={onClose}
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
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: saving ? T.accentLight : T.accent,
                  border: `1px solid ${saving ? T.accent + '30' : 'transparent'}`,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: FONT,
                  fontSize: 13,
                  fontWeight: 600,
                  color: saving ? T.accentText : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'background 0.15s',
                }}
              >
                {saving ? (
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
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Check size={13} /> Lưu thay đổi
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