// src/components/admin/announcement/AnnouncementModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Megaphone, Edit3, Link as LinkIcon } from 'lucide-react';
import notificationService from '../../../services/notificationService';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../../context/adminTokens';

const EMPTY_FORM = {
  title: '',
  message: '',
  type: 'admin_announcement',
  thumbnailUrl: '',
  linkUrl: '/announcements', // Mặc định duy nhất dẫn về trang thông báo
};

function LightInput({ label, value, onChange, placeholder, error, type = 'text', required = false, disabled = false }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label} {required && <span style={{ color: T.red }}>*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          height: 42,
          padding: '0 14px',
          background: disabled ? T.surfaceAlt : T.surface,
          border: `1px solid ${error ? 'rgba(220,38,38,0.5)' : focused ? T.borderFocus : T.border}`,
          borderRadius: 10,
          color: disabled ? T.textMuted : T.text,
          outline: 'none',
          fontFamily: FONT,
          fontSize: 13.5,
          transition: 'border-color 0.15s',
          boxSizing: 'border-box',
          width: '100%',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
      {error && <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.red, margin: 0 }}>{error}</p>}
    </div>
  );
}

function LightTextarea({ label, value, onChange, placeholder, rows = 4, error, required = false }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label} {required && <span style={{ color: T.red }}>*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: '10px 14px',
          background: T.surface,
          border: `1px solid ${error ? 'rgba(220,38,38,0.5)' : focused ? T.borderFocus : T.border}`,
          borderRadius: 10,
          color: T.text,
          outline: 'none',
          fontFamily: FONT,
          fontSize: 13.5,
          lineHeight: 1.6,
          resize: 'vertical',
          transition: 'border-color 0.15s',
          boxSizing: 'border-box',
          width: '100%',
        }}
      />
      {error && <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.red, margin: 0 }}>{error}</p>}
    </div>
  );
}

function AnnouncementModal({ open, onClose, onSaved, item = null }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = Boolean(item?.id);

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title || '',
        message: item.message || '',
        type: 'admin_announcement',
        thumbnailUrl: item.thumbnailUrl || '',
        linkUrl: item.linkUrl || '/announcements',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
  }, [item, open]);

  const set = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Tiêu đề thông báo không được để trống');
      return;
    }
    if (!form.message.trim()) {
      setError('Nội dung thông báo không được để trống');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        type: 'admin_announcement', // Cố định chỉ tạo thông báo hệ thống
        thumbnailUrl: form.thumbnailUrl.trim() || null,
        linkUrl: form.linkUrl.trim() || '/announcements', // Cố định dẫn qua announcements
      };

      if (isEdit) {
        await notificationService.adminUpdateNotification(item.id, payload);
        onSaved?.({ ...item, ...payload });
      } else {
        await notificationService.broadcastNotification(payload);
        onSaved?.();
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu thông báo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <style>{ADMIN_GOOGLE_FONTS}</style>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!saving ? onClose : undefined}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.3)',
              zIndex: 299,
              backdropFilter: 'blur(3px)',
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            style={{
              position: 'fixed',
              inset: 0,
              margin: 'auto',
              width: 520,
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
                background: T.surfaceAlt,
              }}
            >
              <div>
                <p style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3, fontWeight: 600, fontFamily: FONT }}>
                  HỆ THỐNG BẢN TIN & THÔNG BÁO
                </p>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em', fontFamily: FONT_TITLE, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isEdit ? <Edit3 size={16} color={T.accentText} /> : <Megaphone size={16} color={T.accentText} />}
                  {isEdit ? 'Chỉnh sửa thông báo' : 'Phát thông báo mới'}
                </h2>
              </div>
              <button
                onClick={onClose}
                disabled={saving}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  cursor: saving ? 'not-allowed' : 'pointer',
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

            {/* Form Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: T.surface, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <LightInput
                label="Tiêu đề thông báo"
                placeholder="VD: Thông báo bảo trì máy chủ, sự kiện..."
                value={form.title}
                onChange={set('title')}
                error={/Tiêu đề/i.test(error) ? error : ''}
                required
              />

              <LightTextarea
                label="Nội dung chi tiết"
                placeholder="Nhập nội dung đầy đủ hiển thị trên trang tin tức..."
                value={form.message}
                onChange={set('message')}
                rows={5}
                error={/Nội dung/i.test(error) ? error : ''}
                required
              />

              <div>
                <LightInput
                  label="URL Banner / Ảnh đính kèm (Tuỳ chọn)"
                  placeholder="https://..."
                  value={form.thumbnailUrl}
                  onChange={set('thumbnailUrl')}
                />
                {form.thumbnailUrl && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}`, background: T.surfaceAlt, flexShrink: 0 }}>
                      <img
                        src={form.thumbnailUrl}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                    <span style={{ fontSize: 12, color: T.textMuted }}>Xem trước ảnh đính kèm</span>
                  </div>
                )}
              </div>

              {/* Đường dẫn cố định dẫn về /announcements */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <LightInput
                  label="Đường dẫn chuyển tiếp khi bấm vào"
                  value={form.linkUrl}
                  onChange={set('linkUrl')}
                  placeholder="/announcements"
                />
                <span style={{ fontSize: 11.5, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <LinkIcon size={12} /> Mặc định chuyển tiếp đến trang Bản tin (/announcements).
                </span>
              </div>

              {error && !/Tiêu đề|Nội dung/i.test(error) && (
                <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.red, margin: 0 }}>{error}</p>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, background: T.surface, display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
              <button
                onClick={onClose}
                disabled={saving}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: T.surfaceAlt,
                  border: `1px solid ${T.border}`,
                  cursor: saving ? 'not-allowed' : 'pointer',
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
                    <div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Check size={13} /> {isEdit ? 'Cập nhật' : 'Phát thông báo'}
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

export default AnnouncementModal;