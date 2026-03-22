// src/components/admin/UserDetailPanel.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Calendar, Shield, User, Star, Clock, Pencil } from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { Spinner } from '../../ui';
import { C, FONT_DISPLAY, FONT_BODY } from '../../../context/homeTokens';

const ROLE_STYLE = {
  admin: { label: 'Admin', bg: 'rgba(229,24,30,0.12)', border: 'rgba(229,24,30,0.3)', color: '#e5181e' },
  user:  { label: 'User',  bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' },
};

const MetaRow = ({ icon: Icon, label, value, accent }) => value != null ? (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 0', borderBottom: `1px solid ${C.border}`,
  }}>
    <div style={{
      width: 30, height: 30, borderRadius: 7, flexShrink: 0,
      background: accent ? `${accent}12` : 'rgba(255,255,255,0.05)',
      border: `1px solid ${accent ? `${accent}25` : C.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={13} color={accent ?? 'rgba(255,255,255,0.3)'} />
    </div>
    <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.3)', minWidth: 100, flexShrink: 0 }}>
      {label}
    </span>
    <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4, fontWeight: 500 }}>
      {value}
    </span>
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
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 199, backdropFilter: 'blur(3px)',
        }}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 460, zIndex: 200,
          background: '#0a0a0a',
          borderLeft: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div style={{
          flexShrink: 0,
          padding: '20px 20px 0',
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
                Chi tiết
              </p>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 900, color: 'white', margin: 0 }}>
                Người dùng
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {onEdit && !loading && user && (
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => onEdit(user)}
                  style={{
                    padding: '6px 14px', borderRadius: 6,
                    background: 'rgba(126,174,232,0.10)',
                    border: '1px solid rgba(126,174,232,0.25)',
                    cursor: 'pointer', fontFamily: FONT_BODY,
                    fontSize: 12, fontWeight: 700, color: '#7eaee8',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <Pencil size={12} /> Sửa
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${C.border}`,
                  cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={14} />
              </motion.button>
            </div>
          </div>

          {/* Avatar + name hero */}
          {!loading && user && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingBottom: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 14, flexShrink: 0, overflow: 'hidden',
                background: 'linear-gradient(135deg,#e5181e,#7a0409)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${rStyle.border}`,
              }}>
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 900, color: 'white' }}>{initials}</span>
                }
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 900, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.username}
                  </h3>
                  <span style={{
                    fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 99,
                    background: rStyle.bg, border: `1px solid ${rStyle.border}`, color: rStyle.color,
                    flexShrink: 0,
                  }}>
                    {rStyle.label}
                  </span>
                </div>
                <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  {user.email}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px' }}>
          {loading && (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <Spinner size="md" color="red" />
            </div>
          )}

          {!loading && user && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>

              {/* Info section */}
              <p style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
                Thông tin
              </p>

              <MetaRow icon={Mail}     label="Email"        value={user.email} />
              <MetaRow icon={User}     label="Tên đăng nhập" value={user.username} />
              <MetaRow icon={Shield}   label="Quyền"        value={rStyle.label} accent={role === 'admin' ? '#e5181e' : undefined} />
              <MetaRow icon={Star}     label="Subscription" value={user.subscriptionType ?? '—'} />
              <MetaRow icon={Calendar} label="Ngày tạo"     value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'} />
              <MetaRow
                icon={Clock}
                label="Xác thực 2FA"
                value={user.is2FaEnabled ? '✓ Đã bật' : '✗ Chưa bật'}
                accent={user.is2FaEnabled ? '#46d369' : undefined}
              />

              {/* ID */}
              <div style={{
                marginTop: 24, padding: '10px 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
              }}>
                <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 4 }}>USER ID</p>
                <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.35)', wordBreak: 'break-all', lineHeight: 1.5 }}>
                  {user.id}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
}