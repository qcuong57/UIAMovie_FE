// src/components/admin/user/UserEditModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, User, Link } from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { useToast } from '../common/Toast';

const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const T = {
  bg:          '#F4F3EF',
  surface:     '#FFFFFF',
  surfaceAlt:  '#FAFAF8',
  accent:      '#1C5F3A',
  accentLight: '#EAF5EF',
  accentText:  '#155230',
  text:        '#18181B',
  textSub:     '#71717A',
  textMuted:   '#A1A1AA',
  border:      'rgba(0,0,0,0.08)',
  borderMed:   'rgba(0,0,0,0.13)',
  borderFocus: 'rgba(28,95,58,0.4)',
  shadow:      '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
  shadowLg:    '0 20px 60px rgba(0,0,0,0.14)',
};

// ── Field component đồng bộ với MetaRow style ────────────────────
const Field = ({ icon: Icon, label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        background: T.surfaceAlt,
        border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={11} color={T.textMuted} />
      </div>
      <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
    </div>
    {children}
  </div>
);

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

export default function UserEditModal({ user, onClose, onSaved }) {
  const [form,   setForm]   = useState({ username: '', avatarUrl: '' });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [focused, setFocused] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (user) {
      setForm({
        username:         user.username         ?? '',
        avatarUrl:        user.avatarUrl        ?? '',

      });
      setError('');
    }
  }, [user]);

  const handleSave = async () => {
    if (!form.username.trim()) { setError('Tên đăng nhập không được để trống'); return; }
    setSaving(true); setError('');
    try {
      await axiosInstance.put(`/user/${user.id}`, {
        username:  form.username.trim()  || null,
        avatarUrl: form.avatarUrl.trim() || null,
      });
      onSaved?.({
        ...user,
        username:  form.username.trim(),
        avatarUrl: form.avatarUrl.trim() || user.avatarUrl,
      });
      toast.success('Đã cập nhật người dùng');
      onClose();
    } catch (e) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Có lỗi xảy ra';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.username?.[0]?.toUpperCase() ?? 'U';

  return (
    <AnimatePresence>
      {!!user && (
        <>
          {/* Backdrop — giống hệt UserDetailPanel */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.3)',
              zIndex: 299,
              backdropFilter: 'blur(3px)',
            }}
          />

          {/* Modal — centered, không phải slide-in */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{   opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            style={{
              position:   'fixed',
              inset:      0,
              margin:     'auto',
              width:      460,
              height:     'fit-content',
              maxHeight:  '90vh',
              zIndex:     300,
              background: T.surface,
              borderRadius: 16,
              border:     `1px solid ${T.border}`,
              boxShadow:  T.shadowLg,
              display:    'flex',
              flexDirection: 'column',
              fontFamily: FONT,
              overflow:   'hidden',
            }}
          >
            {/* ── Header — đồng bộ UserDetailPanel ── */}
            <div style={{ flexShrink: 0, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Chỉnh sửa</p>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em' }}>Người dùng</h2>
                </div>
                <button
                  onClick={onClose}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: T.bg, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Avatar hero — giống UserDetailPanel */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '0 20px 20px' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 14, flexShrink: 0, overflow: 'hidden',
                  background: `linear-gradient(135deg, ${T.accent}, ${T.accentText})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${T.accent}30`,
                }}>
                  {(form.avatarUrl || user?.avatarUrl)
                    ? <img
                        src={form.avatarUrl || user?.avatarUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    : <span style={{ fontFamily: FONT, fontSize: 24, fontWeight: 700, color: 'white' }}>{initials}</span>
                  }
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontFamily: FONT, fontSize: 19, fontWeight: 700, color: T.text, margin: '0 0 2px', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {form.username || user?.username}
                  </h3>
                  <p style={{ fontFamily: FONT, fontSize: 13, color: T.textSub, margin: 0 }}>{user?.email}</p>
                </div>
              </div>
            </div>

            {/* ── Body ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: T.bg, display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Fields card — giống card Thông tin trong DetailPanel */}
              <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, boxShadow: T.shadow, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Thông tin</p>

                <Field icon={User} label="Tên đăng nhập">
                  <input
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    placeholder="Username..."
                    onFocus={() => setFocused('username')}
                    onBlur={()  => setFocused('')}
                    style={inputStyle(focused === 'username')}
                  />
                  {error?.includes('Tên') && (
                    <p style={{ fontFamily: FONT, fontSize: 11.5, color: '#DC2626', margin: 0 }}>{error}</p>
                  )}
                </Field>

                <Field icon={Link} label="Avatar URL (tùy chọn)">
                  <input
                    value={form.avatarUrl}
                    onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))}
                    placeholder="https://..."
                    onFocus={() => setFocused('avatar')}
                    onBlur={()  => setFocused('')}
                    style={inputStyle(focused === 'avatar')}
                  />
                </Field>

              </div>

              {/* Error không liên quan tên */}
              {error && !error.includes('Tên') && (
                <p style={{ fontFamily: FONT, fontSize: 12, color: '#DC2626', margin: 0 }}>{error}</p>
              )}

              {/* Note — giống ID card trong DetailPanel */}
              <div style={{ padding: '12px 16px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, lineHeight: 1.6, margin: 0 }}>
                  Chỉ có thể sửa tên đăng nhập và avatar. Để đổi role dùng nút Shield, để quản lý Premium dùng nút Crown trong danh sách.
                </p>
              </div>
            </div>

            {/* ── Footer ── */}
            <div style={{
              flexShrink: 0,
              padding: '14px 20px',
              borderTop: `1px solid ${T.border}`,
              background: T.surface,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
            }}>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  background: T.bg, border: `1px solid ${T.border}`,
                  cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600,
                  color: T.textSub,
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '8px 18px', borderRadius: 8,
                  background: saving ? T.accentLight : T.accent,
                  border: `1px solid ${saving ? T.accent + '30' : 'transparent'}`,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: FONT, fontSize: 13, fontWeight: 600,
                  color: saving ? T.accentText : 'white',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'background 0.15s',
                }}
              >
                {saving
                  ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Đang lưu...</>
                  : <><Check size={13} /> Lưu thay đổi</>
                }
              </button>
            </div>
          </motion.div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </AnimatePresence>
  );
}