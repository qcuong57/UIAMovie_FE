// src/pages/ProfilePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Mail, Camera, Check, Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import axiosInstance from '../../config/axios';

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
  useEffect(() => {
    axiosInstance.get('/user/me')
      .then(data => {
        setUsername(data.username ?? '');
        setEmail(data.email ?? '');
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

  // ── Subscription badge ────────────────────────────────────────────────────
  const subLabel = currentUser?.role === 'Admin'
    ? { label: 'Admin', color: '#e50914', bg: 'rgba(229,9,20,0.12)' }
    : { label: 'Standard', color: '#888', bg: 'rgba(255,255,255,0.05)' };

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
        padding: '0 28px', height: 58,
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
        style={{ maxWidth: 620, margin: '0 auto', padding: '36px 20px 60px' }}
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