// src/pages/SecurityPage.jsx
import React, { useState, useEffect } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shield, ShieldCheck, ShieldOff, Check, X, AlertTriangle, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import axiosInstance from '../../config/axios';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:      '#070707',
  card:    '#111111',
  input:   '#0a0a0a',
  border:  'rgba(255,255,255,0.07)',
  borderF: 'rgba(229,9,20,0.45)',
  accent:  '#e50914',
  accentL: 'rgba(229,9,20,0.1)',
  text:    '#f0f0f0',
  sub:     '#666',
  dim:     '#333',
  green:   '#46d369',
  greenL:  'rgba(70,211,105,0.08)',
  greenB:  'rgba(70,211,105,0.25)',
};

// ── Shared UI ─────────────────────────────────────────────────────────────────

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
        border: `1px solid ${type === 'success' ? C.greenB : 'rgba(229,9,20,0.3)'}`,
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: "'Nunito', sans-serif", fontSize: 13,
        color: type === 'success' ? C.green : '#ff6b6b',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
      }}
    >
      {type === 'success' ? <Check size={14}/> : <X size={14}/>}
      {msg}
    </motion.div>
  );
}

// ── OTP input — giống LandingPage ────────────────────────────────────────────
function OtpInput({ value, onChange, disabled, idPrefix = 'otp' }) {
  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      document.getElementById(`${idPrefix}-${Math.min(pasted.length, 5)}`)?.focus();
    }
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '24px 0' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          id={`${idPrefix}-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          disabled={disabled}
          autoFocus={i === 0}
          onPaste={i === 0 ? handlePaste : undefined}
          onChange={e => {
            const val = e.target.value.replace(/\D/, '');
            const arr = value.split('');
            arr[i] = val;
            const next = arr.join('').slice(0, 6);
            onChange(next);
            if (val && i < 5) document.getElementById(`${idPrefix}-${i + 1}`)?.focus();
          }}
          onKeyDown={e => {
            if (e.key === 'Backspace' && !value[i] && i > 0)
              document.getElementById(`${idPrefix}-${i - 1}`)?.focus();
          }}
          style={{
            width: 44, height: 52, textAlign: 'center',
            background: C.input,
            border: `1px solid ${value[i] ? C.borderF : C.border}`,
            borderRadius: 8, color: C.text, outline: 'none',
            fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 20, fontWeight: 800,
            transition: 'border-color 0.15s',
            opacity: disabled ? 0.5 : 1,
          }}
        />
      ))}
    </div>
  );
}

function Btn({ loading, onClick, children, variant = 'primary', disabled, fullWidth }) {
  const isPrimary = variant === 'primary';
  const isDanger  = variant === 'danger';
  return (
    <motion.button
      whileHover={!loading && !disabled ? { filter: 'brightness(1.1)' } : {}}
      whileTap={!loading && !disabled ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        padding: '11px 24px', borderRadius: 8, cursor: loading || disabled ? 'default' : 'pointer',
        background: isPrimary
          ? (loading || disabled ? 'rgba(229,9,20,0.45)' : C.accent)
          : isDanger
            ? 'rgba(229,9,20,0.1)'
            : 'rgba(255,255,255,0.06)',
        border: isPrimary ? 'none'
          : isDanger ? '1px solid rgba(229,9,20,0.3)'
          : `1px solid ${C.border}`,
        color: isDanger ? '#ff6b6b' : isPrimary ? '#fff' : C.sub,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 13, fontWeight: 700,
        width: fullWidth ? '100%' : 'auto',
        transition: 'all 0.15s',
      }}
    >
      {loading
        ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
        : children}
    </motion.button>
  );
}

// ── 2FA Status card ────────────────────────────────────────────────────────────
function TwoFAStatusCard({ enabled, onEnable, onDisable }) {
  return (
    <div style={{
      background: enabled ? C.greenL : C.card,
      borderRadius: 14,
      border: `1px solid ${enabled ? C.greenB : C.border}`,
      padding: '24px 28px',
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Icon */}
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: enabled ? C.greenB : C.accentL,
            border: `1px solid ${enabled ? C.greenB : 'rgba(229,9,20,0.18)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {enabled
              ? <ShieldCheck size={22} style={{ color: C.green }} />
              : <Shield size={22} style={{ color: C.accent }} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <p style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 15, fontWeight: 700, color: C.text }}>
                Xác thực 2 lớp (2FA)
              </p>
              <span style={{
                padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                fontFamily: "'Nunito', sans-serif", letterSpacing: '0.06em',
                background: enabled ? C.greenB : 'rgba(255,255,255,0.05)',
                color: enabled ? C.green : C.sub,
              }}>
                {enabled ? 'ĐÃ BẬT' : 'TẮT'}
              </span>
            </div>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12.5, color: C.sub, maxWidth: 380, lineHeight: 1.6 }}>
              {enabled
                ? 'Tài khoản của bạn đang được bảo vệ bởi xác thực 2 lớp qua email. Mỗi lần đăng nhập sẽ cần nhập mã OTP.'
                : 'Bật 2FA để nhận mã OTP qua email mỗi lần đăng nhập. Tăng cường bảo mật tài khoản của bạn.'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
        {enabled
          ? <Btn variant="danger" onClick={onDisable}><ShieldOff size={14}/> Tắt 2FA</Btn>
          : <Btn onClick={onEnable}><ShieldCheck size={14}/> Bật 2FA ngay</Btn>}
      </div>
    </div>
  );
}

// ── Enable 2FA flow ────────────────────────────────────────────────────────────
function EnableFlow({ user, onSuccess, onCancel, showToast }) {
  // step: 'send' | 'verify'
  const [step,    setStep]    = useState('send');
  const [otp,     setOtp]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const sendOtp = async () => {
    setLoading(true);
    try {
      // Dùng POST /auth/2fa/enable — endpoint đúng để bật 2FA (cần Bearer token)
      // Backend sẽ tự lấy userId từ token, không cần truyền userId
      await axiosInstance.post('/auth/2fa/enable');
      setSent(true);
      setStep('verify');
      setCountdown(60);
      showToast('Đã gửi mã OTP đến email của bạn');
    } catch (e) {
      showToast(e.message ?? 'Không thể gửi OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length < 6) { showToast('Vui lòng nhập đủ 6 chữ số', 'error'); return; }
    setLoading(true);
    try {
      // POST /auth/otp/verify — backend tự set Is2FaEnabled = true trong VerifyOtpAsync
      const data = await authService.verifyOtp({ userId: user?.id, code: otp });

      // Cập nhật localStorage để UI sync ngay
      const stored = authService.getCurrentUser();
      if (stored) {
        stored.is2FaEnabled = true;
        localStorage.setItem('currentUser', JSON.stringify(stored));
      }

      showToast('Đã bật xác thực 2 lớp thành công!');
      onSuccess();
    } catch (e) {
      showToast(e.message ?? 'Mã OTP không đúng', 'error');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: C.card, borderRadius: 14,
        border: `1px solid ${C.border}`,
        overflow: 'hidden', marginBottom: 20,
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px 28px 16px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: C.accentL, border: '1px solid rgba(229,9,20,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Smartphone size={15} style={{ color: C.accent }} />
        </div>
        <div>
          <p style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 14, fontWeight: 700, color: C.text }}>
            {step === 'send' ? 'Xác nhận kích hoạt 2FA' : 'Nhập mã xác thực'}
          </p>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.sub }}>
            {step === 'send'
              ? `Mã OTP sẽ được gửi đến ${user?.email ?? 'email của bạn'}`
              : `Kiểm tra hộp thư ${user?.email ?? ''}`}
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>
        <AnimatePresence mode="wait">
          {step === 'send' ? (
            <motion.div key="send" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Info box */}
              <div style={{
                display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 8, marginBottom: 24,
                background: 'rgba(255,200,0,0.05)', border: '1px solid rgba(255,200,0,0.12)',
              }}>
                <AlertTriangle size={15} style={{ color: '#f0a500', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12.5, color: '#999', lineHeight: 1.6 }}>
                  Sau khi bật 2FA, mỗi lần đăng nhập bạn sẽ cần nhập mã OTP được gửi qua email.
                  Hãy đảm bảo bạn có thể truy cập email <strong style={{ color: '#ccc' }}>{user?.email}</strong>.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn loading={loading} onClick={sendOtp}><Check size={14}/> Gửi mã OTP</Btn>
                <Btn variant="ghost" onClick={onCancel} disabled={loading}>Huỷ</Btn>
              </div>
            </motion.div>
          ) : (
            <motion.div key="verify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.sub, textAlign: 'center' }}>
                Nhập mã <strong style={{ color: C.text }}>6 chữ số</strong> được gửi đến email của bạn
              </p>

              <OtpInput value={otp} onChange={setOtp} disabled={loading} idPrefix="enable-otp" />

              {/* Resend */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                {countdown > 0 ? (
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.sub }}>
                    Gửi lại sau <span style={{ color: C.accent }}>{countdown}s</span>
                  </p>
                ) : (
                  <button onClick={sendOtp} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.accent,
                    textDecoration: 'underline', textDecorationColor: 'rgba(229,9,20,0.4)',
                  }}>
                    Gửi lại mã OTP
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Btn loading={loading} onClick={verifyOtp} disabled={otp.length < 6}>
                  <ShieldCheck size={14}/> Xác nhận & Bật 2FA
                </Btn>
                <Btn variant="ghost" onClick={onCancel} disabled={loading}>Huỷ</Btn>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Disable 2FA confirm ────────────────────────────────────────────────────────
function DisableFlow({ user, onSuccess, onCancel, showToast }) {
  const [otp,       setOtp]       = useState('');
  const [loading,   setLoading]   = useState(false);
  const [sending,   setSending]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // Tự gửi OTP 1 lần khi mount — dùng ref để tránh gọi 2 lần trong Strict Mode
  const hasSent = React.useRef(false);
  useEffect(() => {
    if (hasSent.current) return;
    hasSent.current = true;
    sendOtp();
  }, []);

  const sendOtp = async () => {
    if (sending) return;
    setSending(true);
    setSent(false);
    try {
      // Gửi OTP xác nhận danh tính qua endpoint enable (chỉ để gửi mail)
      await axiosInstance.post('/auth/2fa/enable');
      setSent(true);
      setCountdown(60);
    } catch {
      showToast('Không thể gửi OTP, thử lại', 'error');
    } finally {
      setSending(false);
    }
  };

  const confirm = async () => {
    if (otp.length < 6) { showToast('Nhập đủ 6 chữ số', 'error'); return; }
    setLoading(true);
    try {
      // Gọi endpoint tắt 2FA — xác thực OTP và set Is2FaEnabled = false trong DB
      await axiosInstance.post('/auth/2fa/disable', { userId: user?.id, code: otp });

      // Cập nhật localStorage để UI sync ngay không cần reload
      const stored = authService.getCurrentUser();
      if (stored) {
        stored.is2FaEnabled = false;
        localStorage.setItem('currentUser', JSON.stringify(stored));
      }

      showToast('Đã tắt xác thực 2 lớp');
      onSuccess();
    } catch (e) {
      showToast(e.message ?? 'Mã OTP không đúng', 'error');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: C.card, borderRadius: 14,
        border: '1px solid rgba(229,9,20,0.2)',
        overflow: 'hidden', marginBottom: 20,
      }}
    >
      <div style={{
        padding: '20px 28px 16px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: C.accentL,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ShieldOff size={15} style={{ color: C.accent }} />
        </div>
        <div>
          <p style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 14, fontWeight: 700, color: C.text }}>
            Tắt xác thực 2 lớp
          </p>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.sub }}>
            Xác nhận danh tính để tiếp tục
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>
        <div style={{
          display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 8, marginBottom: 20,
          background: 'rgba(229,9,20,0.06)', border: '1px solid rgba(229,9,20,0.15)',
        }}>
          <AlertTriangle size={15} style={{ color: C.accent, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12.5, color: '#999', lineHeight: 1.6 }}>
            Tắt 2FA sẽ làm giảm bảo mật tài khoản. Nhập mã OTP được gửi đến email để xác nhận.
          </p>
        </div>

        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.sub, textAlign: 'center' }}>
          {sent ? <>Mã OTP đã gửi đến <strong style={{ color: C.text }}>{user?.email}</strong></> : 'Đang gửi mã...'}
        </p>

        <OtpInput value={otp} onChange={setOtp} disabled={loading || !sent} idPrefix="disable-otp" />

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {countdown > 0 ? (
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.sub }}>
              Gửi lại sau <span style={{ color: C.accent }}>{countdown}s</span>
            </p>
          ) : (
            <button onClick={sendOtp} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.accent,
              textDecoration: 'underline',
            }}>
              Gửi lại mã OTP
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="danger" loading={loading} onClick={confirm} disabled={otp.length < 6}>
            <ShieldOff size={14}/> Xác nhận tắt 2FA
          </Btn>
          <Btn variant="ghost" onClick={onCancel} disabled={loading}>Huỷ</Btn>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SecurityPage() {
  const isMobile = useIsMobile();
  const navigate     = useNavigate();
  const canGoBack    = window.history.length > 1;
  const currentUser  = authService.getCurrentUser();

  // Đọc localStorage ngay — không bị false khi reload
  const [twoFAEnabled, setTwoFAEnabled] = useState(
    () => authService.getCurrentUser()?.is2FaEnabled ?? false
  );
  const [flow, setFlow] = useState(null); // null | 'enable' | 'disable'
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch /user/me để sync lại với DB
  useEffect(() => {
    axiosInstance.get('/user/me')
      .then(data => {
        const enabled = data?.is2FaEnabled ?? false;
        setTwoFAEnabled(enabled);
        // Lưu lại localStorage để lần sau load ngay
        const stored = authService.getCurrentUser();
        if (stored) {
          stored.is2FaEnabled = enabled;
          localStorage.setItem('currentUser', JSON.stringify(stored));
        }
      })
      .catch(() => {});
  }, []);

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
        display: 'flex', alignItems: 'center', gap: 14,
        padding: isMobile ? '0 16px' : '0 28px', height: 58,
      }}>
        <motion.button
          whileHover={{ x: -2 }} whileTap={{ scale: 0.95 }}
          onClick={() => canGoBack ? navigate(-1) : navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            color: C.sub, fontFamily: "'Nunito', sans-serif", fontSize: 13, padding: 0 }}
        >
          <ArrowLeft size={16}/> Hồ sơ
        </motion.button>
        <div style={{ width: 1, height: 18, background: C.border }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Bảo mật & 2FA</span>
      </div>

      {/* ── Content ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ maxWidth: 620, margin: '0 auto', padding: isMobile ? '20px 16px 48px' : '36px 20px 60px' }}
      >

        {/* ── 2FA Status ── */}
        <AnimatePresence mode="wait">
          {flow === null && (
            <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TwoFAStatusCard
                enabled={twoFAEnabled}
                onEnable={() => setFlow('enable')}
                onDisable={() => setFlow('disable')}
              />
            </motion.div>
          )}

          {flow === 'enable' && (
            <motion.div key="enable" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EnableFlow
                user={currentUser}
                showToast={showToast}
                onSuccess={() => { setTwoFAEnabled(true); setFlow(null); }}
                onCancel={() => setFlow(null)}
              />
            </motion.div>
          )}

          {flow === 'disable' && (
            <motion.div key="disable" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DisableFlow
                user={currentUser}
                showToast={showToast}
                onSuccess={() => { setTwoFAEnabled(false); setFlow(null); }}
                onCancel={() => setFlow(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Info section: what is 2FA ── */}
        {flow === null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p style={{
              fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700,
              color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14,
            }}>
              Tại sao nên dùng 2FA?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { title: 'Chặn đăng nhập trái phép', desc: 'Ngay cả khi mật khẩu bị lộ, kẻ tấn công vẫn không thể vào tài khoản.' },
                { title: 'Xác thực qua email', desc: 'Mã OTP 6 chữ số gửi về email của bạn, hết hạn sau vài phút.' },
                { title: 'Dễ dàng bật/tắt', desc: 'Có thể vô hiệu hóa bất kỳ lúc nào sau khi xác nhận danh tính.' },
              ].map(({ title, desc }) => (
                <div key={title} style={{
                  display: 'flex', gap: 12, padding: '14px 18px', borderRadius: 10,
                  background: C.card, border: `1px solid ${C.border}`,
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: C.greenL, border: `1px solid ${C.greenB}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={11} style={{ color: C.green }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 3 }}>
                      {title}
                    </p>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.sub, lineHeight: 1.55 }}>
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}