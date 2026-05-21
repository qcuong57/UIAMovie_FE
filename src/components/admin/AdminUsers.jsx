// src/components/admin/AdminUsers.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertCircle, Shield, Eye, Pencil, Search, Ban, ShieldCheck, X, Check, Crown, CalendarClock } from 'lucide-react';
import { usePagination } from '../../hooks/usePagination';
import AdminPagination from '../common/AdminPagination';
import axiosInstance from '../../config/axios';
import authService from '../../services/authService';
import UserDetailPanel from './user/UserDetailPanel';
import UserEditModal from './user/UserEditModal';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../context/adminTokens';

const PAGE_SIZE = 15;

// ── Shared modal tokens ────────────────────────────────────────────────────────
const modalBase = {
  position: 'fixed',
  inset: 0,
  margin: 'auto',
  width: 420,
  height: 'fit-content',
  maxHeight: '90vh',
  zIndex: 300,
  background: T.surface,
  borderRadius: 16,
  border: `1px solid ${T.border}`,
  boxShadow: '0 20px 60px rgba(0,0,0,0.14)',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: FONT,
  overflow: 'hidden',
};

const Backdrop = ({ onClose }) => (
  <motion.div
    key="bd"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.3)',
      backdropFilter: 'blur(3px)',
      zIndex: 299,
    }}
  />
);

const ModalMotion = ({ children }) => (
  <motion.div
    key="modal"
    initial={{ opacity: 0, scale: 0.97, y: 8 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.97, y: 8 }}
    transition={{ type: 'spring', stiffness: 340, damping: 30 }}
    style={modalBase}
  >
    {children}
  </motion.div>
);

// ── Shared close button ────────────────────────────────────────────────────────
const CloseBtn = ({ onClose }) => (
  <button
    onClick={onClose}
    style={{
      width: 30, height: 30, borderRadius: '50%',
      background: T.bg, border: `1px solid ${T.border}`,
      cursor: 'pointer', color: T.textSub,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <X size={13} />
  </button>
);

// ── Confirm action button ──────────────────────────────────────────────────────
const ConfirmBtn = ({ onClick, disabled, loading, bg, color, border, icon: Icon, label }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      padding: '8px 18px', borderRadius: 8,
      background: loading ? `${bg}99` : bg,
      border: `1px solid ${border ?? 'transparent'}`,
      cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
      fontFamily: FONT, fontSize: 13, fontWeight: 600,
      color,
      display: 'flex', alignItems: 'center', gap: 6,
      transition: 'background 0.15s',
    }}
  >
    {loading
      ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Đang xử lý...</>
      : <>{Icon && <Icon size={13} />} {label}</>
    }
  </button>
);

const CancelBtn = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 16px', borderRadius: 8,
      background: T.bg, border: `1px solid ${T.border}`,
      cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600,
      color: T.textSub,
    }}
  >
    Hủy
  </button>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ── Delete Modal ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const DeleteModal = ({ user, onClose, onConfirm, loading }) => (
  <AnimatePresence>
    {!!user && (
      <>
        <Backdrop onClose={onClose} />
        <ModalMotion>
          {/* Header */}
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Trash2 size={15} color="#DC2626" />
              </div>
              <div>
                <p style={{ fontSize: 10.5, color: T.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, margin: 0 }}>Xác nhận</p>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>Xóa người dùng</h3>
              </div>
            </div>
            <CloseBtn onClose={onClose} />
          </div>

          {/* Body */}
          <div style={{ padding: '20px', background: T.bg }}>
            {/* User card */}
            <div style={{
              padding: '14px 16px', borderRadius: 12,
              background: T.surface, border: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, #9CA3AF, #6B7280)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: '#fff' }}>{user?.username?.[0]?.toUpperCase()}</span>
                }
              </div>
              <div>
                <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>{user?.username}</p>
                <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, margin: 0 }}>{user?.email}</p>
              </div>
            </div>

            {/* Warning */}
            <div style={{
              padding: '12px 14px', borderRadius: 10,
              background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.18)',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <AlertCircle size={15} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontFamily: FONT, fontSize: 12.5, color: '#991B1B', lineHeight: 1.6, margin: 0 }}>
                Tài khoản và toàn bộ dữ liệu liên quan sẽ bị xóa vĩnh viễn. <strong>Hành động này không thể hoàn tác.</strong>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, background: T.surface, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <CancelBtn onClick={onClose} />
            <ConfirmBtn
              onClick={onConfirm}
              loading={loading}
              bg="#DC2626"
              color="white"
              icon={Trash2}
              label="Xóa tài khoản"
            />
          </div>
        </ModalMotion>
      </>
    )}
  </AnimatePresence>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ── Ban Modal ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const BanModal = ({ user, reason, onReasonChange, onClose, onConfirm, loading }) => {
  const [focused, setFocused] = useState(false);
  return (
    <AnimatePresence>
      {!!user && (
        <>
          <Backdrop onClose={onClose} />
          <ModalMotion>
            {/* Header */}
            <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: '#FFF7ED', border: '1px solid rgba(234,88,12,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ban size={15} color="#EA580C" />
                </div>
                <div>
                  <p style={{ fontSize: 10.5, color: T.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, margin: 0 }}>Xác nhận</p>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>Khóa tài khoản</h3>
                </div>
              </div>
              <CloseBtn onClose={onClose} />
            </div>

            {/* Body */}
            <div style={{ padding: '20px', background: T.bg, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* User card */}
              <div style={{
                padding: '12px 14px', borderRadius: 12,
                background: T.surface, border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                  background: `linear-gradient(135deg, ${T.accent}, ${T.accentText})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: '#fff' }}>{user?.username?.[0]?.toUpperCase()}</span>
                  }
                </div>
                <div>
                  <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: T.text, margin: 0 }}>{user?.username}</p>
                  <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, margin: 0 }}>{user?.email}</p>
                </div>
              </div>

              {/* Info note */}
              <div style={{
                padding: '11px 14px', borderRadius: 10,
                background: '#FFF7ED', border: '1px solid rgba(234,88,12,0.18)',
                display: 'flex', gap: 9, alignItems: 'flex-start',
              }}>
                <AlertCircle size={14} color="#EA580C" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontFamily: FONT, fontSize: 12.5, color: '#9A3412', lineHeight: 1.6, margin: 0 }}>
                  User sẽ bị đăng xuất ngay lập tức và không thể đăng nhập cho đến khi được mở khóa.
                </p>
              </div>

              {/* Reason */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Lý do khóa (tùy chọn)
                </label>
                <textarea
                  value={reason}
                  onChange={e => onReasonChange(e.target.value)}
                  placeholder="Nhập lý do khóa tài khoản..."
                  rows={3}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  style={{
                    width: '100%', padding: '10px 14px',
                    borderRadius: 10,
                    background: T.surface,
                    border: `1px solid ${focused ? 'rgba(234,88,12,0.4)' : T.border}`,
                    color: T.text, outline: 'none',
                    fontFamily: FONT, fontSize: 13.5,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, background: T.surface, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <CancelBtn onClick={onClose} />
              <ConfirmBtn
                onClick={onConfirm}
                loading={loading}
                bg="#EA580C"
                color="white"
                icon={Ban}
                label="Khóa tài khoản"
              />
            </div>
          </ModalMotion>

        </>
      )}
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ── Unban Modal ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const UnbanModal = ({ user, onClose, onConfirm, loading }) => (
  <AnimatePresence>
    {!!user && (
      <>
        <Backdrop onClose={onClose} />
        <ModalMotion>
          {/* Header */}
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: '#F0FDF4', border: '1px solid rgba(22,163,74,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShieldCheck size={15} color="#16A34A" />
              </div>
              <div>
                <p style={{ fontSize: 10.5, color: T.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, margin: 0 }}>Xác nhận</p>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>Mở khóa tài khoản</h3>
              </div>
            </div>
            <CloseBtn onClose={onClose} />
          </div>

          {/* Body */}
          <div style={{ padding: '20px', background: T.bg, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* User card */}
            <div style={{
              padding: '12px 14px', borderRadius: 12,
              background: T.surface, border: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                background: 'linear-gradient(135deg, #9CA3AF, #6B7280)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: '#fff' }}>{user?.username?.[0]?.toUpperCase()}</span>
                }
              </div>
              <div>
                <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: T.textMuted, margin: 0 }}>{user?.username}</p>
                <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, margin: 0 }}>{user?.email}</p>
              </div>
            </div>

            {/* Ban reason chip (if any) */}
            {user?.banReason && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.18)',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <span style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Lý do khóa</span>
                <p style={{ fontFamily: FONT, fontSize: 12.5, color: '#991B1B', lineHeight: 1.5, margin: 0 }}>{user.banReason}</p>
              </div>
            )}

            {/* Confirm note */}
            <div style={{
              padding: '11px 14px', borderRadius: 10,
              background: '#F0FDF4', border: '1px solid rgba(22,163,74,0.18)',
              display: 'flex', gap: 9, alignItems: 'flex-start',
            }}>
              <ShieldCheck size={14} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontFamily: FONT, fontSize: 12.5, color: '#14532D', lineHeight: 1.6, margin: 0 }}>
                User sẽ có thể đăng nhập lại bình thường sau khi được mở khóa.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, background: T.surface, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <CancelBtn onClick={onClose} />
            <ConfirmBtn
              onClick={onConfirm}
              loading={loading}
              bg="#16A34A"
              color="white"
              icon={ShieldCheck}
              label="Mở khóa"
            />
          </div>
        </ModalMotion>

      </>
    )}
  </AnimatePresence>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ── Shield / Role Modal ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const ShieldModal = ({ user, newRole, onClose, onConfirm, loading }) => {
  const toAdmin = newRole?.toLowerCase() === 'admin';
  const accent  = toAdmin ? T.accent    : '#6B7280';
  const accentBg = toAdmin ? T.accentLight : '#F3F4F6';
  const accentBorder = toAdmin ? `${T.accent}30` : 'rgba(107,114,128,0.25)';

  return (
    <AnimatePresence>
      {!!user && (
        <>
          <Backdrop onClose={onClose} />
          <ModalMotion>
            {/* Header */}
            <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: accentBg, border: `1px solid ${accentBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Shield size={15} color={accent} />
                </div>
                <div>
                  <p style={{ fontSize: 10.5, color: T.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, margin: 0 }}>Xác nhận</p>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>Đổi quyền người dùng</h3>
                </div>
              </div>
              <CloseBtn onClose={onClose} />
            </div>

            {/* Body */}
            <div style={{ padding: '20px', background: T.bg, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* User card */}
              <div style={{
                padding: '12px 14px', borderRadius: 12,
                background: T.surface, border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                  background: `linear-gradient(135deg, ${T.accent}, ${T.accentText})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: '#fff' }}>{user?.username?.[0]?.toUpperCase()}</span>
                  }
                </div>
                <div>
                  <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: T.text, margin: 0 }}>{user?.username}</p>
                  <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, margin: 0 }}>{user?.email}</p>
                </div>
              </div>

              {/* Role change arrow */}
              <div style={{
                padding: '14px 16px', borderRadius: 12,
                background: T.surface, border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
              }}>
                {/* Current role */}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 6, marginTop: 0 }}>Hiện tại</p>
                  <span style={{
                    fontFamily: FONT, fontSize: 12, fontWeight: 600,
                    padding: '4px 12px', borderRadius: 99,
                    background: !toAdmin ? T.accentLight : T.bg,
                    border: `1px solid ${!toAdmin ? `${T.accent}30` : T.border}`,
                    color: !toAdmin ? T.accentText : T.textSub,
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}>
                    {!toAdmin && <Shield size={10} />}
                    {toAdmin ? 'User' : 'Admin'}
                  </span>
                </div>

                {/* Arrow */}
                <div style={{ color: T.textMuted, fontSize: 18, fontWeight: 300, marginTop: 8 }}>→</div>

                {/* New role */}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 6, marginTop: 0 }}>Sẽ đổi thành</p>
                  <span style={{
                    fontFamily: FONT, fontSize: 12, fontWeight: 600,
                    padding: '4px 12px', borderRadius: 99,
                    background: accentBg,
                    border: `1px solid ${accentBorder}`,
                    color: accent,
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}>
                    {toAdmin && <Shield size={10} />}
                    {newRole}
                  </span>
                </div>
              </div>

              {/* Warning for promoting to Admin */}
              {toAdmin && (
                <div style={{
                  padding: '11px 14px', borderRadius: 10,
                  background: T.accentLight, border: `1px solid ${T.accent}25`,
                  display: 'flex', gap: 9, alignItems: 'flex-start',
                }}>
                  <Shield size={14} color={T.accent} style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.accentText, lineHeight: 1.6, margin: 0 }}>
                    Admin có toàn quyền quản lý hệ thống. Hãy chắc chắn trước khi cấp quyền này.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, background: T.surface, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <CancelBtn onClick={onClose} />
              <ConfirmBtn
                onClick={onConfirm}
                loading={loading}
                bg={accent}
                color="white"
                icon={Check}
                label="Xác nhận"
              />
            </div>
          </ModalMotion>

        </>
      )}
    </AnimatePresence>
  );
};

// ── Role Badge ─────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const isAdmin = role?.toLowerCase() === 'admin';
  return (
    <span style={{
      fontFamily: FONT, fontSize: 11.5, fontWeight: 600,
      padding: '3px 10px', borderRadius: 99,
      background: isAdmin ? T.accentLight : T.bg,
      border: `1px solid ${isAdmin ? `${T.accent}30` : T.border}`,
      color: isAdmin ? T.accentText : T.textSub,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {isAdmin && <Shield size={10} strokeWidth={2} />}
      {isAdmin ? 'Admin' : 'User'}
    </span>
  );
};



// ═══════════════════════════════════════════════════════════════════════════════
// ── SubBadge ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const SUB_META = {
  monthly_premium: { label: 'Premium · Tháng', bg: '#FFFBEB', border: 'rgba(217,119,6,0.35)', color: '#92400E' },
  yearly_premium:  { label: 'Premium · Năm',   bg: '#FEF3C7', border: 'rgba(245,158,11,0.4)', color: '#78350F' },
  Premium:         { label: 'Premium',          bg: '#FFFBEB', border: 'rgba(217,119,6,0.35)', color: '#92400E' },
};

const SubBadge = ({ sub, expiredAt }) => {
  if (!sub) return <span style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>—</span>;
  const meta    = SUB_META[sub] ?? { label: sub, bg: '#FEF9C3', border: 'rgba(253,224,71,0.5)', color: '#854D0E' };
  const expired = expiredAt ? new Date(expiredAt) < new Date() : false;
  const dateStr = expiredAt
    ? new Date(expiredAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{
        fontFamily: FONT, fontSize: 11.5, fontWeight: 600,
        padding: '3px 10px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 5,
        background: expired ? '#F3F4F6' : meta.bg,
        border: `1px solid ${expired ? 'rgba(156,163,175,0.4)' : meta.border}`,
        color: expired ? '#9CA3AF' : meta.color,
      }}>
        <Crown size={9} strokeWidth={2.5} />
        {meta.label}
        {expired && ' · Hết hạn'}
      </span>
      {dateStr && (
        <span style={{ fontFamily: FONT, fontSize: 10.5, color: expired ? '#DC2626' : T.textMuted, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
          <CalendarClock size={9} />
          {expired ? `Đã hết ${dateStr}` : `Đến ${dateStr}`}
        </span>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ── PremiumModal ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const PLAN_OPTS = [
  { value: 'monthly_premium', label: 'Premium · Tháng (1 tháng)' },
  { value: 'yearly_premium',  label: 'Premium · Năm  (1 năm)'   },
];

const defaultExpiry = (planId) => {
  const d = new Date();
  if (planId === 'yearly_premium') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
};

const PremiumModal = ({ user, onClose, onConfirm, loading }) => {
  const [tab,       setTab]       = useState('grant'); // 'grant' | 'revoke'
  const [planId,    setPlanId]    = useState('monthly_premium');
  const [expiredAt, setExpiredAt] = useState(defaultExpiry('monthly_premium'));
  const [hasSub,    setHasSub]    = useState(false);

  useEffect(() => {
    if (user) {
      const cur    = user.subscriptionType;
      const active = !!cur;
      const plan   = cur === 'yearly_premium' ? 'yearly_premium' : 'monthly_premium';
      setHasSub(active);
      setPlanId(plan);
      setExpiredAt(user.subscriptionExpiredAt
        ? new Date(user.subscriptionExpiredAt).toISOString().slice(0, 10)
        : defaultExpiry(plan));
      setTab(active ? 'revoke' : 'grant');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handlePlanChange = (val) => {
    setPlanId(val);
    setExpiredAt(defaultExpiry(val));
  };

  return (
    <AnimatePresence>
      {!!user && (
        <>
          <Backdrop onClose={onClose} />
          <ModalMotion>
            {/* Header */}
            <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: '#FFFBEB', border: '1px solid rgba(217,119,6,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Crown size={15} color="#D97706" />
                </div>
                <div>
                  <p style={{ fontSize: 10.5, color: T.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, margin: 0 }}>Premium</p>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>Quản lý Subscription</h3>
                </div>
              </div>
              <CloseBtn onClose={onClose} />
            </div>

            {/* Body */}
            <div style={{ padding: '20px', background: T.bg, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* User card */}
              <div style={{ padding: '12px 14px', borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, background: `linear-gradient(135deg, ${T.accent}, ${T.accentText})`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: '#fff' }}>{user?.username?.[0]?.toUpperCase()}</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: T.text, margin: 0 }}>{user?.username}</p>
                  <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, margin: 0 }}>{user?.email}</p>
                </div>
                {hasSub && (
                  <SubBadge sub={user.subscriptionType} expiredAt={user.subscriptionExpiredAt} />
                )}
              </div>

              {/* Tab switcher: Grant / Revoke */}
              <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.border}`, background: T.surface }}>
                {[['grant','Cấp / Gia hạn'], ['revoke','Thu hồi']].map(([key, label]) => (
                  <button key={key} onClick={() => setTab(key)}
                    disabled={key === 'revoke' && !hasSub}
                    style={{
                      flex: 1, padding: '9px 0', border: 'none', cursor: (key === 'revoke' && !hasSub) ? 'not-allowed' : 'pointer',
                      fontFamily: FONT, fontSize: 12.5, fontWeight: 600,
                      background: tab === key ? (key === 'revoke' ? '#FEF2F2' : T.accentLight) : 'transparent',
                      color: tab === key ? (key === 'revoke' ? '#DC2626' : T.accentText) : T.textMuted,
                      transition: 'all 0.15s',
                      opacity: (key === 'revoke' && !hasSub) ? 0.4 : 1,
                    }}
                  >{label}</button>
                ))}
              </div>

              {tab === 'grant' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Plan selector */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Gói</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {PLAN_OPTS.map(opt => (
                        <button key={opt.value} onClick={() => handlePlanChange(opt.value)}
                          style={{
                            flex: 1, padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                            fontFamily: FONT, fontSize: 12.5, fontWeight: 600,
                            background: planId === opt.value ? T.accentLight : T.surface,
                            border: `1px solid ${planId === opt.value ? `${T.accent}40` : T.border}`,
                            color: planId === opt.value ? T.accentText : T.textSub,
                            transition: 'all 0.15s',
                          }}
                        >{opt.label}</button>
                      ))}
                    </div>
                  </div>
                  {/* Expiry date */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <CalendarClock size={12} /> Ngày hết hạn
                    </label>
                    <input type="date" value={expiredAt} onChange={e => setExpiredAt(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, fontFamily: FONT, fontSize: 13.5, color: T.text, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ padding: '11px 14px', borderRadius: 10, background: T.accentLight, border: `1px solid ${T.accent}25`, display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <Crown size={13} color={T.accent} style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.accentText, lineHeight: 1.6, margin: 0 }}>
                      {hasSub ? 'Gia hạn sẽ ghi đè gói hiện tại và cập nhật ngày hết hạn.' : 'User sẽ được kích hoạt Premium ngay lập tức.'}
                    </p>
                  </div>
                </div>
              )}

              {tab === 'revoke' && (
                <div style={{ padding: '12px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.18)', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <AlertCircle size={14} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontFamily: FONT, fontSize: 12.5, color: '#991B1B', lineHeight: 1.6, margin: 0 }}>
                    Subscription của user sẽ bị <strong>thu hồi ngay lập tức</strong>. User sẽ mất quyền truy cập Premium.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, background: T.surface, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <CancelBtn onClick={onClose} />
              {tab === 'grant' && (
                <ConfirmBtn onClick={() => onConfirm({ planId, expiredAt: new Date(expiredAt).toISOString(), revoke: false })}
                  loading={loading} bg={T.accent} color="white" icon={Crown}
                  label={hasSub ? 'Gia hạn' : 'Cấp Premium'}
                />
              )}
              {tab === 'revoke' && (
                <ConfirmBtn onClick={() => onConfirm({ revoke: true })}
                  loading={loading} bg="#DC2626" color="white" icon={AlertCircle}
                  label="Thu hồi Premium"
                />
              )}
            </div>
          </ModalMotion>

        </>
      )}
    </AnimatePresence>
  );
};

// ── Banned Badge ───────────────────────────────────────────────────────────────
const BannedBadge = () => (
  <span style={{
    fontFamily: FONT, fontSize: 10.5, fontWeight: 600,
    padding: '2px 8px', borderRadius: 99,
    background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.25)',
    color: '#DC2626',
    display: 'inline-flex', alignItems: 'center', gap: 3,
  }}>
    <Ban size={9} strokeWidth={2.5} /> Đã khóa
  </span>
);

// ── Action Button ──────────────────────────────────────────────────────────────
const ActionBtn = ({ icon: Icon, onClick, title, variant = 'default' }) => {
  const styles = {
    default: { bg: T.bg,          border: T.border,                 color: T.textSub  },
    edit:    { bg: '#EFF6FF',     border: 'rgba(59,130,246,0.25)',  color: '#3B82F6'  },
    shield:  { bg: T.accentLight, border: `${T.accent}30`,          color: T.accent   },
    danger:  { bg: '#FEF2F2',     border: 'rgba(220,38,38,0.2)',    color: '#DC2626'  },
    ban:     { bg: '#FFF7ED',     border: 'rgba(234,88,12,0.25)',   color: '#EA580C'  },
    premium: { bg: '#FFFBEB',     border: 'rgba(217,119,6,0.3)',    color: '#D97706'  },
    unban:   { bg: '#F0FDF4',     border: 'rgba(22,163,74,0.25)',   color: '#16A34A'  },
  };
  const s = styles[variant];
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      title={title}
      style={{
        width: 30, height: 30,
        borderRadius: 8,
        background: s.bg,
        border: `1px solid ${s.border}`,
        cursor: 'pointer', color: s.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <Icon size={13} strokeWidth={1.8} />
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ── AdminUsers ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminUsers() {
  const [users,        setUsers]        = useState([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [roleFilter,   setRoleFilter]   = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [roleTarget,   setRoleTarget]   = useState(null);
  const [savingRole,   setSavingRole]   = useState(false);
  const [newRole,      setNewRole]      = useState('');
  const [detailUserId, setDetailUserId] = useState(null);
  const [editUser,     setEditUser]     = useState(null);
  const [banTarget,    setBanTarget]    = useState(null);
  const [banReason,    setBanReason]    = useState('');
  const [subFilter,    setSubFilter]    = useState('');
  const [banning,      setBanning]      = useState(false);
  const [unbanTarget,  setUnbanTarget]  = useState(null);
  const [unbanning,    setUnbanning]    = useState(false);
  const [premiumTarget, setPremiumTarget] = useState(null);
  const [savingPremium, setSavingPremium] = useState(false);

  const pagination = usePagination({ total, pageSize: PAGE_SIZE });
  const me = authService.getCurrentUser();

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('pageNumber', page);
      params.append('pageSize', PAGE_SIZE);
      if (search.trim()) params.append('search', search.trim());
      if (roleFilter)    params.append('role', roleFilter);
      if (subFilter === 'none') params.append('subscriptionType', 'none');
      else if (subFilter) params.append('subscriptionType', subFilter);
      const res   = await axiosInstance.get(`/user?${params}`);
      const items = res?.items ?? res?.data?.items ?? (Array.isArray(res) ? res : []);
      const count = res?.totalCount ?? res?.data?.totalCount ?? items.length;
      setUsers(items);
      setTotal(count);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, roleFilter, subFilter]);

  useEffect(() => { pagination.goTo(1); fetchUsers(1); }, [search, roleFilter, subFilter]);
  useEffect(() => { fetchUsers(pagination.page); }, [pagination.page]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/user/${deleteTarget.id}`);
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      setTotal(t => t - 1);
      setDeleteTarget(null);
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  };

  const handleRoleChange = async () => {
    if (!roleTarget || !newRole) return;
    setSavingRole(true);
    try {
      await axiosInstance.patch(`/user/${roleTarget.id}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === roleTarget.id ? { ...u, role: newRole } : u));
      setRoleTarget(null);
    } catch (e) { console.error(e); }
    finally { setSavingRole(false); }
  };

  const handleBan = async () => {
    if (!banTarget) return;
    setBanning(true);
    try {
      await axiosInstance.post(`/user/${banTarget.id}/ban`, { reason: banReason.trim() || null });
      setUsers(prev => prev.map(u => u.id === banTarget.id ? { ...u, isActive: false, banReason: banReason.trim() || null } : u));
      setBanTarget(null); setBanReason('');
    } catch (e) { console.error(e); }
    finally { setBanning(false); }
  };

  const handleUnban = async () => {
    if (!unbanTarget) return;
    setUnbanning(true);
    try {
      await axiosInstance.post(`/user/${unbanTarget.id}/unban`);
      setUsers(prev => prev.map(u => u.id === unbanTarget.id ? { ...u, isActive: true, banReason: null } : u));
      setUnbanTarget(null);
    } catch (e) { console.error(e); }
    finally { setUnbanning(false); }
  };

  const handlePremium = async ({ planId, expiredAt, revoke }) => {
    if (!premiumTarget) return;
    setSavingPremium(true);
    try {
      if (revoke) {
        // DELETE /api/payments/admin/subscription/{userId}
        await axiosInstance.delete(`/payments/admin/subscription/${premiumTarget.id}`);
        setUsers(prev => prev.map(u => u.id === premiumTarget.id
          ? { ...u, subscriptionType: null, subscriptionExpiredAt: null } : u));
      } else {
        // POST /api/payments/admin/grant-subscription
        await axiosInstance.post('/payments/admin/grant-subscription', {
          userId:    premiumTarget.id,
          planId,
          expiredAt, // ISO string, BE gọi .ToUniversalTime()
        });
        setUsers(prev => prev.map(u => u.id === premiumTarget.id
          ? { ...u, subscriptionType: planId, subscriptionExpiredAt: expiredAt } : u));
      }
      setPremiumTarget(null);
    } catch (e) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Có lỗi xảy ra';
      console.error('[handlePremium]', msg, e);
      alert(msg); // hoặc dùng toast nếu có
    } finally { setSavingPremium(false); }
  };

  const COLS = ['Người dùng', 'Email', 'Role', 'Ngày tạo', 'Subscription', ''];

  // ── Derived stats (current page; total from API) ──
  const adminCount   = users.filter(u => u.role?.toLowerCase() === 'admin').length;
  const bannedCount  = users.filter(u => u.isActive === false).length;
  const premiumCount = users.filter(u => u.subscriptionType && u.subscriptionType !== 'none').length;

  const selectStyle = (hasVal) => ({
    height: 42, padding: '0 34px 0 14px', borderRadius: 11,
    background: T.surface, border: `1px solid ${T.border}`,
    color: hasVal ? T.text : T.textMuted,
    fontFamily: FONT, fontSize: 13.5,
    outline: 'none', cursor: 'pointer',
    boxShadow: T.shadow, transition: 'border-color 0.15s',
    appearance: 'none',
  });

  const ChevronSVG = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2"
      style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  return (
    <div style={{ padding: '28px 32px 64px', maxWidth: 1200, fontFamily: FONT }}>
      <style>{ADMIN_GOOGLE_FONTS}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 22 }}>
        <p style={{ fontSize: 11.5, color: T.textMuted, marginBottom: 3, fontFamily: FONT, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Quản lý</p>
        <h2 style={{ fontFamily: FONT_TITLE, fontSize: 23, fontWeight: 700, color: T.text, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 8 }}>
          Người dùng
          <span style={{ fontSize: 13.5, fontWeight: 500, color: T.textMuted, letterSpacing: 0, fontFamily: FONT }}>
            · {total.toLocaleString('vi-VN')}
          </span>
        </h2>
      </div>

      {/* ── Stat chips ── */}
      {!loading && total > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { icon: Shield, label: 'Admin trên trang',    value: adminCount,   accent: T.accent },
            { icon: Ban,    label: 'Đã khóa trên trang',  value: bannedCount,  accent: T.red    },
            { icon: Crown,  label: 'Premium trên trang',  value: premiumCount, accent: T.gold   },
          ].map(({ icon: Icon, label, value, accent }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px', borderRadius: 12,
              background: T.surface, border: `1px solid ${T.border}`,
              boxShadow: T.shadow,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: accent + '15' }}>
                <Icon size={14} color={accent} />
              </div>
              <div>
                <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, marginBottom: 1 }}>{label}</p>
                <p style={{ fontFamily: FONT_TITLE, fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={14} color={T.textMuted} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            placeholder="Tìm theo tên, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', height: 42, padding: '0 14px 0 38px',
              borderRadius: 11, background: T.surface, border: `1px solid ${T.border}`,
              fontFamily: FONT, fontSize: 13.5, color: T.text, outline: 'none',
              boxShadow: T.shadow, transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = T.accent + '80'}
            onBlur={e  => e.target.style.borderColor = T.border}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            style={{ ...selectStyle(roleFilter), minWidth: 140 }}
            onFocus={e => e.target.style.borderColor = T.accent + '80'}
            onBlur={e  => e.target.style.borderColor = T.border}
          >
            <option value="">Tất cả role</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>
          <ChevronSVG />
        </div>
        <div style={{ position: 'relative' }}>
          <select value={subFilter} onChange={e => setSubFilter(e.target.value)}
            style={{ ...selectStyle(subFilter), minWidth: 170 }}
            onFocus={e => e.target.style.borderColor = T.accent + '80'}
            onBlur={e  => e.target.style.borderColor = T.border}
          >
            <option value="">Tất cả subscription</option>
            <option value="monthly_premium">Premium Tháng</option>
            <option value="yearly_premium">Premium Năm</option>
            <option value="none">Không có gói</option>
          </select>
          <ChevronSVG />
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: T.surfaceAlt }}>
              {COLS.map(h => (
                <th key={h} style={{
                  padding: '12px 18px', textAlign: 'left',
                  fontFamily: FONT, fontSize: 11, fontWeight: 600,
                  color: T.textMuted, letterSpacing: '0.06em',
                  textTransform: 'uppercase', borderBottom: `1px solid ${T.border}`,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${T.border}` }}>
                  {[200, 180, 80, 90, 130, 90].map((w, j) => (
                    <td key={j} style={{ padding: '15px 18px' }}>
                      <div style={{
                        height: 13, width: w, borderRadius: 6,
                        background: `linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.surfaceHov} 50%, ${T.surfaceAlt} 75%)`,
                        backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite',
                      }} />
                      {j === 0 && <div style={{ height: 11, width: 120, borderRadius: 6, marginTop: 6,
                        background: `linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.surfaceHov} 50%, ${T.surfaceAlt} 75%)`,
                        backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite 0.1s',
                      }} />}
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '64px 0', textAlign: 'center' }}>
                <Search size={22} color={T.textMuted} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                <p style={{ fontFamily: FONT, fontSize: 13.5, color: T.textMuted }}>Không tìm thấy user nào</p>
              </td></tr>
            ) : users.map((u, i) => {
              const initials = u.username?.[0]?.toUpperCase() ?? 'U';
              const isBanned = u.isActive === false;
              return (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s', opacity: isBanned ? 0.75 : 1 }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceHov}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
                        background: isBanned
                          ? 'linear-gradient(135deg, #9CA3AF, #6B7280)'
                          : `linear-gradient(135deg, ${T.accent}, ${T.accentText})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {u.avatarUrl
                          ? <img src={u.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: '#fff' }}>{initials}</span>
                        }
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: isBanned ? T.textMuted : T.text, margin: 0 }}>
                            {u.username}
                          </p>
                          {isBanned && <BannedBadge />}
                        </div>
                        {u.id === me?.id && (
                          <span style={{ fontFamily: FONT, fontSize: 10.5, color: T.accent, fontWeight: 600 }}>Bạn</span>
                        )}
                        {isBanned && u.banReason && (
                          <p style={{ fontFamily: FONT, fontSize: 11, color: '#DC2626', marginTop: 1 }} title={u.banReason}>
                            {u.banReason.length > 32 ? u.banReason.slice(0, 32) + '…' : u.banReason}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 18px', fontFamily: FONT, fontSize: 13, color: T.textSub }}>{u.email}</td>
                  <td style={{ padding: '12px 18px' }}><RoleBadge role={u.role} /></td>
                  <td style={{ padding: '12px 18px', fontFamily: FONT, fontSize: 12.5, color: T.textMuted, whiteSpace: 'nowrap' }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <SubBadge sub={u.subscriptionType} expiredAt={u.subscriptionExpiredAt} />
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <ActionBtn icon={Eye} onClick={() => setDetailUserId(u.id)} title="Xem chi tiết" />
                      {u.id !== me?.id && (
                        <>
                          <ActionBtn icon={Pencil} variant="edit" onClick={() => setEditUser(u)} title="Chỉnh sửa" />
                          <ActionBtn icon={Shield} variant="shield"
                            onClick={() => { setRoleTarget(u); setNewRole(u.role?.toLowerCase() === 'admin' ? 'User' : 'Admin'); }}
                            title="Đổi role"
                          />
                          {isBanned ? (
                            <ActionBtn icon={ShieldCheck} variant="unban" onClick={() => setUnbanTarget(u)} title="Mở khóa tài khoản" />
                          ) : (
                            <ActionBtn icon={Ban} variant="ban" onClick={() => { setBanTarget(u); setBanReason(''); }} title="Khóa tài khoản" />
                          )}
                          <ActionBtn icon={Crown} variant="premium" onClick={() => setPremiumTarget(u)} title="Quản lý Premium" />
                          <ActionBtn icon={Trash2} variant="danger" onClick={() => setDeleteTarget(u)} title="Xóa" />
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AdminPagination {...pagination.props} itemLabel="người dùng" />

      {/* ── Custom Modals ─────────────────────────────────────────────────────── */}
      <DeleteModal
        user={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />

      <ShieldModal
        user={roleTarget}
        newRole={newRole}
        onClose={() => setRoleTarget(null)}
        onConfirm={handleRoleChange}
        loading={savingRole}
      />

      <BanModal
        user={banTarget}
        reason={banReason}
        onReasonChange={setBanReason}
        onClose={() => { setBanTarget(null); setBanReason(''); }}
        onConfirm={handleBan}
        loading={banning}
      />

      <UnbanModal
        user={unbanTarget}
        onClose={() => setUnbanTarget(null)}
        onConfirm={handleUnban}
        loading={unbanning}
      />

      <PremiumModal
        user={premiumTarget}
        onClose={() => setPremiumTarget(null)}
        onConfirm={handlePremium}
        loading={savingPremium}
      />

      {/* Detail panel */}
      <AnimatePresence>
        {detailUserId && (
          <UserDetailPanel userId={detailUserId} onClose={() => setDetailUserId(null)}
            onEdit={u => { setDetailUserId(null); setEditUser(u); }}
          />
        )}
      </AnimatePresence>

      <UserEditModal
        user={editUser}
        onClose={() => setEditUser(null)}
        onSaved={updated => setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u))}
      />
    </div>
  );
}