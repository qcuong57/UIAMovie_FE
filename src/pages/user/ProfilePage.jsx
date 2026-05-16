// src/pages/ProfilePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Mail, Camera, Check, Eye, EyeOff, Lock, Loader2, Crown, Zap, CalendarDays, Clock, AlertTriangle, Info, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import axiosInstance from '../../config/axios';
import paymentService from '../../services/paymentService';

// ── Design tokens (khớp với dự án) ──────────────────────────────────────────
const C = {
  bg:      '#070707',
  card:    '#111111',
  cardHi:  '#161616',
  input:   '#0a0a0a',
  border:  'rgba(255,255,255,0.07)',
  borderF: 'rgba(229,9,20,0.45)',
  accent:  '#e50914',
  accentL: 'rgba(229,9,20,0.1)',
  accentG: 'rgba(229,9,20,0.3)',
  text:    '#f0f0f0',
  sub:     '#666',
  dim:     '#333',
  green:   '#46d369',
  greenL:  'rgba(70,211,105,0.1)',
};

// ── Shared UI (tái sử dụng pattern từ LandingPage) ───────────────────────────

function InputField({ label, type = 'text', value, onChange, placeholder, autoFocus, disabled, icon: Icon }) {
  const [focused,  setFocused]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isPass = type === 'password';

  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{
          display: 'block', marginBottom: 6,
          fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700,
          color: focused ? 'rgba(229,9,20,0.8)' : '#555',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          transition: 'color 0.15s',
        }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <div style={{
            position: 'absolute', left: 12, display: 'flex',
            color: focused ? C.accent : C.sub, transition: 'color 0.15s', pointerEvents: 'none',
          }}>
            <Icon size={15} />
          </div>
        )}
        <input
          type={isPass && showPass ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: `11px ${isPass ? '40px' : '14px'} 11px ${Icon ? '38px' : '14px'}`,
            background: disabled ? 'rgba(255,255,255,0.03)' : C.input,
            border: `1px solid ${focused ? C.borderF : C.border}`,
            borderRadius: 8, color: disabled ? C.sub : C.text, outline: 'none',
            fontFamily: "'Nunito', sans-serif", fontSize: 13.5,
            transition: 'border-color 0.15s',
            opacity: disabled ? 0.6 : 1,
          }}
        />
        {isPass && (
          <button type="button" onClick={() => setShowPass(v => !v)} style={{
            position: 'absolute', right: 12,
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.sub, display: 'flex', padding: 0,
          }}>
            {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
          </button>
        )}
      </div>
    </div>
  );
}

function Btn({ loading, onClick, children, variant = 'primary', disabled }) {
  const isPrimary = variant === 'primary';
  return (
    <motion.button
      whileHover={!loading && !disabled ? { filter: 'brightness(1.1)' } : {}}
      whileTap={!loading && !disabled ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        padding: '11px 24px', borderRadius: 8, border: 'none',
        cursor: loading || disabled ? 'default' : 'pointer',
        background: isPrimary
          ? (loading || disabled ? 'rgba(229,9,20,0.45)' : C.accent)
          : 'rgba(255,255,255,0.06)',
        color: isPrimary ? '#fff' : C.sub,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        fontFamily: "'Be Vietnam Pro', sans-serif",
        fontSize: 13, fontWeight: 700,
        transition: 'all 0.15s',
        border: isPrimary ? 'none' : `1px solid ${C.border}`,
      }}
    >
      {loading
        ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
        : children}
    </motion.button>
  );
}

function Toast({ msg, type }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
        padding: '12px 18px', borderRadius: 10,
        background: type === 'success' ? C.greenL : 'rgba(229,9,20,0.1)',
        border: `1px solid ${type === 'success' ? 'rgba(70,211,105,0.3)' : 'rgba(229,9,20,0.3)'}`,
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: "'Nunito', sans-serif", fontSize: 13,
        color: type === 'success' ? C.green : '#ff6b6b',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
      }}
    >
      {type === 'success' ? <Check size={14}/> : null}
      {msg}
    </motion.div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div style={{
      background: C.card, borderRadius: 14,
      border: `1px solid ${C.border}`,
      overflow: 'hidden', marginBottom: 20,
    }}>
      <div style={{
        padding: '20px 28px 16px',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <p style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>
          {title}
        </p>
        {subtitle && (
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.sub }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ padding: '24px 28px' }}>
        {children}
      </div>
    </div>
  );
}

// ── Cancel Confirm Modal ──────────────────────────────────────────────────────
function CancelModal({ isOpen, endDate, onConfirm, onClose, loading }) {
  const fmt = (iso) => iso
    ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onClose(); };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={!loading ? onClose : undefined}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          />
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative', zIndex: 1,
              width: '100%', maxWidth: 420,
              background: '#111', borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={16} color="#f87171" />
                </div>
                <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontWeight: 800, fontSize: 15, color: '#f0f0f0' }}>
                  Hủy gói Premium?
                </span>
              </div>
              {!loading && (
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', padding: 4, borderRadius: 6 }}>
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Main warning */}
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                Bạn có chắc muốn hủy gói Premium không?
              </p>

              {/* Info box */}
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                {[
                  'Gói Premium sẽ bị thu hồi ngay lập tức',
                  'Bạn sẽ mất quyền truy cập nội dung Premium ngay sau khi xác nhận',
                  'Hành động này không thể hoàn tác — bạn cần mua lại nếu muốn dùng Premium',
                ].map((text, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', marginTop: 6, flexShrink: 0 }} />
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55 }}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Auto-expire notice */}
              <div style={{
                background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 10, padding: '11px 14px', display: 'flex', alignItems: 'flex-start', gap: 9,
              }}>
                <Info size={13} color="#60a5fa" style={{ marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: '#93c5fd', lineHeight: 1.55 }}>
                  Lưu ý: Nếu chỉ muốn <strong style={{ color: '#bfdbfe' }}>không gia hạn</strong> sau khi hết hạn, bạn không cần làm gì — gói sẽ tự động kết thúc.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '0 22px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <motion.button
                onClick={onClose}
                disabled={loading}
                whileHover={!loading ? { background: 'rgba(255,255,255,0.08)' } : {}}
                style={{
                  padding: '9px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.09)',
                  background: 'rgba(255,255,255,0.04)', color: '#888',
                  fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 13, fontWeight: 600,
                  cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.5 : 1,
                }}
              >
                Giữ lại gói
              </motion.button>
              <motion.button
                onClick={onConfirm}
                disabled={loading}
                whileHover={!loading ? { filter: 'brightness(1.1)' } : {}}
                whileTap={!loading ? { scale: 0.97 } : {}}
                style={{
                  padding: '9px 18px', borderRadius: 8, border: 'none',
                  background: loading ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.85)',
                  color: '#fff',
                  fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 13, fontWeight: 700,
                  cursor: loading ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 7,
                }}
              >
                {loading
                  ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                      style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                  : null}
                {loading ? 'Đang hủy...' : 'Xác nhận hủy'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Plan Card ─────────────────────────────────────────────────────────────────
function PlanCard({ user, onUpgrade, onCancelSuccess, onCancelled }) {
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // API trả về: subscriptionType: "Premium" | "Free", subscriptionExpiredAt, subscriptionStartedAt
  const isPremium =
    user?.subscriptionType?.toLowerCase() === 'premium' ||
    user?.subscriptionPlan?.toLowerCase() === 'premium' ||
    !!user?.isPremium;

  const startDate = user?.subscriptionStartedAt ?? user?.premiumStartDate ?? user?.subscriptionStartDate ?? null;
  const endDate   = user?.subscriptionExpiredAt  ?? user?.premiumEndDate   ?? user?.subscriptionEndDate   ?? null;

  const fmt = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const daysLeft = (endIso) => {
    if (!endIso) return null;
    return Math.max(0, Math.ceil((new Date(endIso) - new Date()) / 86400000));
  };
  const remaining = daysLeft(endDate);
  const isExpiringSoon = remaining !== null && remaining <= 7;

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const userId = user?.id;
      if (!userId) throw new Error('Không xác định được tài khoản.');
      await paymentService.cancelSubscription(userId);
      setShowCancel(false);
      // Cập nhật state cha ngay lập tức — không cần reload trang
      onCancelled?.();
      onCancelSuccess?.('Đã hủy gói Premium thành công. Tài khoản chuyển về Miễn phí.');
    } catch (e) {
      onCancelSuccess?.(e.message ?? 'Hủy gói thất bại', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (isPremium) {
    return (
      <>
        <CancelModal
          isOpen={showCancel}
          endDate={endDate}
          onConfirm={handleCancel}
          onClose={() => !cancelling && setShowCancel(false)}
          loading={cancelling}
        />

        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(234,179,8,0.1) 0%, rgba(180,83,9,0.08) 100%)',
            border: '1px solid rgba(234,179,8,0.25)',
            padding: '18px 20px',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #facc15 0%, #f59e0b 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 14px rgba(250,204,21,0.3)',
            }}>
              <Crown size={17} color="#1c1400" />
            </div>
            <div>
              <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontWeight: 800, fontSize: 14, color: '#facc15' }}>
                Gói Premium
              </div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: 'rgba(250,204,21,0.5)' }}>
                Đang hoạt động
              </div>
            </div>
            {isExpiringSoon && (
              <div style={{
                marginLeft: 'auto',
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.28)',
                borderRadius: 7, padding: '3px 9px',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Clock size={10} color="#f87171" />
                <span style={{ fontSize: 10, color: '#f87171', fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
                  Sắp hết hạn
                </span>
              </div>
            )}
          </div>

          {/* Dates */}
          {(startDate || endDate) && (
            <div style={{ display: 'grid', gridTemplateColumns: startDate && endDate ? '1fr 1fr' : '1fr', gap: 8 }}>
              {startDate && (
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 9, padding: '10px 13px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <CalendarDays size={13} color="rgba(250,204,21,0.5)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif", marginBottom: 2 }}>Ngày bắt đầu</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', fontFamily: "'Be Vietnam Pro', sans-serif" }}>{fmt(startDate)}</div>
                  </div>
                </div>
              )}
              {endDate && (
                <div style={{
                  background: isExpiringSoon ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.04)',
                  border: isExpiringSoon ? '1px solid rgba(239,68,68,0.18)' : '1px solid transparent',
                  borderRadius: 9, padding: '10px 13px', display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  <CalendarDays size={13} color={isExpiringSoon ? '#f87171' : 'rgba(250,204,21,0.5)'} style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif", marginBottom: 2 }}>Hết hạn</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isExpiringSoon ? '#f87171' : 'rgba(255,255,255,0.8)', fontFamily: "'Be Vietnam Pro', sans-serif" }}>{fmt(endDate)}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Days remaining bar */}
          {remaining !== null && endDate && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'Nunito', sans-serif" }}>Thời gian còn lại</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: isExpiringSoon ? '#f87171' : '#facc15', fontFamily: "'Nunito', sans-serif" }}>
                  {remaining} ngày
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (remaining / 30) * 100)}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    height: '100%', borderRadius: 99,
                    background: isExpiringSoon
                      ? 'linear-gradient(90deg,#ef4444,#f87171)'
                      : 'linear-gradient(90deg,#facc15,#f59e0b)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Auto-expire notice */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 9, padding: '10px 13px',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <Info size={12} color="rgba(255,255,255,0.25)" style={{ marginTop: 1.5, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11.5, color: 'rgba(255,255,255,0.35)', lineHeight: 1.55 }}>
              Gói sẽ <strong style={{ color: 'rgba(255,255,255,0.5)' }}>tự động kết thúc khi hết hạn</strong> — không bị trừ phí thêm, không cần hủy thủ công.
            </span>
          </div>

          {/* Cancel button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <motion.button
              onClick={() => setShowCancel(true)}
              whileHover={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.35)' }}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '7px 14px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.15s',
              }}
            >
              <X size={12} color="#f87171" />
              <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 12, fontWeight: 600, color: '#f87171' }}>
                Hủy gói
              </span>
            </motion.button>
          </div>
        </motion.div>
      </>
    );
  }

  // Free plan — màu xanh lá, khớp với card "Miễn phí" ở trang premium
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        borderRadius: 12,
        background: 'linear-gradient(135deg, rgba(70,211,105,0.08) 0%, rgba(34,197,94,0.05) 100%)',
        border: '1px solid rgba(70,211,105,0.25)',
        padding: '16px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'rgba(70,211,105,0.15)',
          border: '1px solid rgba(70,211,105,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 12px rgba(70,211,105,0.15)',
        }}>
          <Zap size={17} color="#46d369" />
        </div>
        <div>
          <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontWeight: 700, fontSize: 13, color: '#46d369' }}>
            Gói Miễn phí
          </div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: 'rgba(70,211,105,0.55)', marginTop: 1 }}>
            Nâng cấp để xem không giới hạn
          </div>
        </div>
      </div>
      {onUpgrade && (
        <motion.button
          onClick={onUpgrade}
          whileHover={{ scale: 1.04, filter: 'brightness(1.1)' }}
          whileTap={{ scale: 0.97 }}
          style={{
            flexShrink: 0,
            background: 'linear-gradient(135deg,#facc15 0%,#f59e0b 100%)',
            border: 'none', borderRadius: 9,
            padding: '8px 15px',
            display: 'flex', alignItems: 'center', gap: 5,
            cursor: 'pointer',
            boxShadow: '0 0 16px rgba(250,204,21,0.22)',
          }}
        >
          <Crown size={12} color="#1c1400" />
          <span style={{ fontSize: 12, fontWeight: 800, color: '#1c1400', fontFamily: "'Be Vietnam Pro', sans-serif", whiteSpace: 'nowrap' }}>
            Nâng cấp
          </span>
        </motion.button>
      )}
    </motion.div>
  );
}

// ── Avatar upload ─────────────────────────────────────────────────────────────
function AvatarSection({ user, onAvatarChange }) {
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef();

  const letter = user?.name?.[0]?.toUpperCase() ?? 'U';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
      {/* Avatar circle */}
      <div
        style={{ position: 'relative', cursor: 'pointer' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => inputRef.current?.click()}
      >
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: user?.avatar
            ? 'transparent'
            : 'linear-gradient(135deg, #e50914, #7a0409)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 800, color: '#fff',
          border: `2px solid ${hovered ? C.accent : C.border}`,
          transition: 'border-color 0.2s',
          overflow: 'hidden',
        }}>
          {user?.avatar
            ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : letter}
        </div>
        {/* Overlay */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Camera size={18} color="#fff" />
            </motion.div>
          )}
        </AnimatePresence>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) onAvatarChange(file);
          }}
        />
      </div>

      <div>
        <p style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 16, fontWeight: 700, color: C.text }}>
          {user?.name ?? 'Người dùng'}
        </p>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.sub, marginTop: 2 }}>
          {user?.email ?? ''}
        </p>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: '#444', marginTop: 6 }}>
          Nhấp vào ảnh để thay đổi
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const canGoBack = window.history.length > 1;
  const currentUser = authService.getCurrentUser();

  // Profile state
  const [username,     setUsername]     = useState(currentUser?.name  ?? '');
  const [email,        setEmail]        = useState(currentUser?.email ?? '');
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar ?? null);
  const [saving,       setSaving]       = useState(false);

  // Password state
  const [oldPass,   setOldPass]   = useState('');
  const [newPass,   setNewPass]   = useState('');
  const [confirmP,  setConfirmP]  = useState('');
  const [savingPw,  setSavingPw]  = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch latest user info ────────────────────────────────────────────────
  const [userDetail, setUserDetail] = useState(currentUser ?? {});

  useEffect(() => {
    axiosInstance.get('/user/me')
      .then(res => {
        // axiosInstance interceptor unwrap response.data → res có thể là { success, data, message }
        // hoặc trực tiếp là object user tuỳ interceptor
        const d = res?.data ?? res;
        setUsername(d.username ?? d.name ?? '');
        setEmail(d.email ?? '');
        setUserDetail(prev => ({ ...prev, ...d }));
      })
      .catch(() => {});
  }, []);

  // ── Save profile ──────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!username.trim()) { showToast('Tên không được để trống', 'error'); return; }
    setSaving(true);
    try {
      await axiosInstance.put('/user/me', { username: username.trim() });
      // Cập nhật localStorage
      const stored = authService.getCurrentUser();
      if (stored) {
        stored.name = username.trim();
        localStorage.setItem('currentUser', JSON.stringify(stored));
      }
      window.dispatchEvent(new Event('userUpdated'));
      showToast('Cập nhật hồ sơ thành công');
    } catch (e) {
      showToast(e.message ?? 'Có lỗi xảy ra', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Avatar upload ────────────────────────────────────────────────────────
  const handleAvatarChange = async (file) => {
    // Preview ngay lập tức — không cần đợi API
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);

    try {
      // TODO: thay bằng upload lên server thực tế để lấy URL cố định
      // const formData = new FormData();
      // formData.append('avatar', file);
      // const { avatarUrl } = await axiosInstance.post('/user/me/avatar', formData);
      // setAvatarPreview(avatarUrl);

      await axiosInstance.put('/user/me', { avatarUrl: localUrl });

      // Cập nhật localStorage để Navbar cũng dùng ảnh mới
      const stored = authService.getCurrentUser();
      if (stored) {
        stored.avatar = localUrl;
        localStorage.setItem('currentUser', JSON.stringify(stored));
      }

      window.dispatchEvent(new Event('userUpdated'));
      showToast('Đã cập nhật ảnh đại diện');
    } catch {
      // Nếu API lỗi, rollback preview về ảnh cũ
      setAvatarPreview(currentUser?.avatar ?? null);
      showToast('Không thể cập nhật ảnh', 'error');
    }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!oldPass || !newPass || !confirmP) { showToast('Vui lòng điền đầy đủ', 'error'); return; }
    if (newPass.length < 6)               { showToast('Mật khẩu mới ít nhất 6 ký tự', 'error'); return; }
    if (newPass !== confirmP)             { showToast('Mật khẩu xác nhận không khớp', 'error'); return; }
    setSavingPw(true);
    try {
      await axiosInstance.post('/user/me/change-password', {
        oldPassword: oldPass,
        newPassword: newPass,
        confirmPassword: confirmP,
      });
      setOldPass(''); setNewPass(''); setConfirmP('');
      showToast('Đổi mật khẩu thành công');
    } catch (e) {
      showToast(e.message ?? 'Mật khẩu cũ không đúng', 'error');
    } finally {
      setSavingPw(false);
    }
  };

  // ── Subscription badge (top bar) ─────────────────────────────────────────
  const isPremium =
    userDetail?.subscriptionType?.toLowerCase() === 'premium' ||
    userDetail?.subscriptionPlan?.toLowerCase() === 'premium' ||
    !!userDetail?.isPremium;
  const subLabel = currentUser?.role === 'Admin'
    ? { label: 'Admin',   color: '#e50914', bg: 'rgba(229,9,20,0.12)' }
    : isPremium
      ? { label: '✦ Premium', color: '#facc15', bg: 'rgba(234,179,8,0.12)' }
      : { label: '⚡ Miễn phí', color: '#46d369', bg: 'rgba(70,211,105,0.10)' };

  return (
    <div style={{
      minHeight: '100vh', background: C.bg, color: C.text,
      fontFamily: "'Be Vietnam Pro', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&family=Nunito:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #333; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #0a0a0a inset !important; -webkit-text-fill-color: #f0f0f0 !important; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(7,7,7,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 28px', height: 58,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <motion.button
            whileHover={{ x: -2 }} whileTap={{ scale: 0.95 }}
            onClick={() => canGoBack ? navigate(-1) : navigate('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              color: C.sub, fontFamily: "'Nunito', sans-serif", fontSize: 13, padding: 0 }}
          >
            <ArrowLeft size={16}/> Quay lại
          </motion.button>
          <div style={{ width: 1, height: 18, background: C.border }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Hồ sơ của tôi</span>
        </div>

        {/* Sub badge */}
        <div style={{
          padding: '4px 12px', borderRadius: 20,
          background: subLabel.bg,
          fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700,
          color: subLabel.color, letterSpacing: '0.06em',
        }}>
          {subLabel.label}
        </div>
      </div>

      {/* ── Content ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ maxWidth: 620, margin: '0 auto', padding: isMobile ? '20px 16px 48px' : '36px 20px 60px' }}
      >

        {/* ── Thông tin cá nhân ── */}
        <SectionCard
          title="Thông tin cá nhân"
          subtitle="Tên hiển thị và ảnh đại diện của bạn"
        >
          <AvatarSection user={{ ...currentUser, avatar: avatarPreview }} onAvatarChange={handleAvatarChange} />

          <InputField
            label="Tên hiển thị"
            value={username}
            onChange={setUsername}
            placeholder="Nhập tên của bạn"
            icon={User}
          />
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={() => {}}
            disabled
            icon={Mail}
          />

          {/* Email readonly note */}
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: '#444', marginTop: -8, marginBottom: 20 }}>
            Email không thể thay đổi. Liên hệ admin để hỗ trợ.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn loading={saving} onClick={handleSaveProfile}>
              <Check size={14}/> Lưu thay đổi
            </Btn>
          </div>
        </SectionCard>

        {/* ── Gói đăng ký ── */}
        <SectionCard
          title="Gói đăng ký"
          subtitle={isPremium ? 'Thông tin gói Premium của bạn' : 'Nâng cấp để mở khoá toàn bộ nội dung'}
        >
          <PlanCard
            user={userDetail}
            onUpgrade={() => navigate('/premium')}
            onCancelSuccess={showToast}
            onCancelled={() => setUserDetail(prev => ({
              ...prev,
              subscriptionType: 'Free',
              subscriptionExpiredAt: null,
              subscriptionStartedAt: null,
              isPremium: false,
            }))}
          />
        </SectionCard>

        {/* ── Đổi mật khẩu ── */}
        <SectionCard
          title="Đổi mật khẩu"
          subtitle="Sử dụng mật khẩu mạnh, ít nhất 6 ký tự"
        >
          <InputField
            label="Mật khẩu hiện tại"
            type="password"
            value={oldPass}
            onChange={setOldPass}
            placeholder="••••••••"
            icon={Lock}
          />
          <InputField
            label="Mật khẩu mới"
            type="password"
            value={newPass}
            onChange={setNewPass}
            placeholder="Ít nhất 6 ký tự"
            icon={Lock}
          />
          <InputField
            label="Xác nhận mật khẩu mới"
            type="password"
            value={confirmP}
            onChange={setConfirmP}
            placeholder="Nhập lại mật khẩu mới"
            icon={Lock}
          />

          {/* Password strength */}
          {newPass.length > 0 && (
            <div style={{ marginTop: -8, marginBottom: 18 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    flex: 1, height: 3, borderRadius: 2,
                    background: newPass.length >= i * 4
                      ? (i === 3 ? C.green : i === 2 ? '#f0a500' : C.accent)
                      : C.dim,
                    transition: 'background 0.2s',
                  }} />
                ))}
              </div>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, color: C.sub }}>
                {newPass.length < 4 ? 'Yếu' : newPass.length < 8 ? 'Trung bình' : 'Mạnh'}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn loading={savingPw} onClick={handleChangePassword}>
              <Lock size={14}/> Cập nhật mật khẩu
            </Btn>
          </div>
        </SectionCard>

        {/* ── Security shortcut ── */}
        <motion.button
          whileHover={{ background: '#161616' }}
          onClick={() => navigate('/settings/security')}
          style={{
            width: '100%', padding: '16px 24px',
            background: C.card, borderRadius: 14,
            border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', transition: 'background 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: C.accentL, border: `1px solid rgba(229,9,20,0.18)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Lock size={16} style={{ color: C.accent }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 14, fontWeight: 700, color: C.text }}>
                Bảo mật & Xác thực 2 lớp
              </p>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.sub, marginTop: 2 }}>
                Bật 2FA để tăng cường bảo mật tài khoản
              </p>
            </div>
          </div>
          <ArrowLeft size={16} style={{ color: C.sub, transform: 'rotate(180deg)' }} />
        </motion.button>
      </motion.div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}