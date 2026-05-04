// src/components/admin/user/UserDetailPanel.jsx  ← REDESIGNED
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Calendar, Shield, User, Star, Clock, Pencil, CheckCircle, XCircle } from 'lucide-react';
import axiosInstance from '../../../config/axios';

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
  shadow:      '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
  shadowLg:    '0 20px 60px rgba(0,0,0,0.14)',
};

const ROLE_STYLE = {
  admin: { label: 'Admin', bg: T.accentLight, border: `${T.accent}30`, color: T.accentText },
  user:  { label: 'User',  bg: T.bg,          border: T.border,        color: T.textSub   },
};

const MetaRow = ({ icon: Icon, label, value, accent }) => value != null ? (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
    <div style={{
      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
      background: accent ? `${accent}12` : T.surfaceAlt,
      border: `1px solid ${accent ? `${accent}25` : T.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={13} color={accent ?? T.textMuted} />
    </div>
    <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, minWidth: 110, flexShrink: 0 }}>{label}</span>
    <span style={{ fontFamily: FONT, fontSize: 13, color: T.text, lineHeight: 1.4, fontWeight: 500 }}>{value}</span>
  </div>
) : null;

export default function UserDetailPanel({ userId, onClose, onEdit }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    axiosInstance.get(`/user/${userId}`)
      .then(res => setUser(res?.data ?? res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const role   = user?.role?.toLowerCase();
  const rStyle = ROLE_STYLE[role] ?? ROLE_STYLE.user;
  const initials = user?.username?.[0]?.toUpperCase() ?? 'U';

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 199, backdropFilter: 'blur(3px)' }}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{
          position:   'fixed', top: 0, right: 0, bottom: 0,
          width:      460, zIndex: 200,
          background: T.surface,
          borderLeft: `1px solid ${T.border}`,
          display:    'flex', flexDirection: 'column',
          boxShadow:  T.shadowLg,
          fontFamily: FONT,
        }}
      >
        {/* Header */}
        <div style={{ flexShrink: 0, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Chi tiết</p>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em' }}>Người dùng</h2>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {onEdit && !loading && user && (
                <button onClick={() => onEdit(user)}
                  style={{ padding: '7px 14px', borderRadius: 8, background: T.accentLight, border: `1px solid ${T.accent}30`, cursor: 'pointer', fontFamily: FONT, fontSize: 12, fontWeight: 600, color: T.accentText, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Pencil size={12} /> Sửa
                </button>
              )}
              <button onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: '50%', background: T.bg, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Avatar hero */}
          {!loading && user && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '0 20px 20px' }}>
              <div style={{
                width: 60, height: 60, borderRadius: 14, flexShrink: 0, overflow: 'hidden',
                background: `linear-gradient(135deg, ${T.accent}, ${T.accentText})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${rStyle.border}`,
              }}>
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontFamily: FONT, fontSize: 24, fontWeight: 700, color: 'white' }}>{initials}</span>
                }
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h3 style={{ fontFamily: FONT, fontSize: 19, fontWeight: 700, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                    {user.username}
                  </h3>
                  <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: rStyle.bg, border: `1px solid ${rStyle.border}`, color: rStyle.color, flexShrink: 0 }}>
                    {rStyle.label}
                  </span>
                </div>
                <p style={{ fontFamily: FONT, fontSize: 13, color: T.textSub }}>{user.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: T.bg }}>
          {loading && (
            <div style={{ padding: '64px 0', textAlign: 'center' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', border: `2.5px solid ${T.accentLight}`, borderTopColor: T.accent, animation: 'spin 0.75s linear infinite', margin: '0 auto' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {!loading && user && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, boxShadow: T.shadow, padding: 16 }}>
                <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Thông tin</p>
                <MetaRow icon={Mail}      label="Email"          value={user.email} />
                <MetaRow icon={User}      label="Tên đăng nhập"  value={user.username} />
                <MetaRow icon={Shield}    label="Quyền"          value={rStyle.label} accent={role === 'admin' ? T.accent : undefined} />
                <MetaRow icon={Star}      label="Subscription"   value={user.subscriptionType ?? '—'} />
                <MetaRow icon={Calendar}  label="Ngày tạo"       value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'} />
                <MetaRow
                  icon={user.is2FaEnabled ? CheckCircle : XCircle}
                  label="Xác thực 2FA"
                  value={user.is2FaEnabled ? 'Đã bật' : 'Chưa bật'}
                  accent={user.is2FaEnabled ? '#16A34A' : undefined}
                />
              </div>

              {/* ID */}
              <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>USER ID</p>
                <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textSub, wordBreak: 'break-all', lineHeight: 1.6 }}>{user.id}</p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
}