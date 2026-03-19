// src/pages/LandingPage.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Film, Shield, Zap, Star, Check, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const C = {
  bg:      '#070707',
  card:    '#111111',
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
};

// ─── Shared UI ──────────────────────────────────────────────────────────────

function InputField({ label, type = 'text', value, onChange, placeholder, autoFocus }) {
  const [focused,  setFocused]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isPass = type === 'password';

  return (
    <div style={{ marginBottom: 14 }}>
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
      <div style={{ position: 'relative' }}>
        <input
          type={isPass && showPass ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', padding: isPass ? '11px 40px 11px 14px' : '11px 14px',
            background: C.input,
            border: `1px solid ${focused ? C.borderF : C.border}`,
            borderRadius: 6, color: C.text, outline: 'none',
            fontFamily: "'Nunito', sans-serif", fontSize: 13.5,
            transition: 'border-color 0.15s',
          }}
        />
        {isPass && (
          <button
            type="button"
            onClick={() => setShowPass(v => !v)}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: C.sub, display: 'flex', padding: 0,
            }}
          >
            {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
          </button>
        )}
      </div>
    </div>
  );
}

function SubmitBtn({ loading, onClick, children, disabled }) {
  return (
    <motion.button
      whileHover={!loading && !disabled ? { filter: 'brightness(1.1)' } : {}}
      whileTap={!loading && !disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        width: '100%', padding: '12px', marginTop: 6,
        borderRadius: 6, border: 'none',
        cursor: loading || disabled ? 'default' : 'pointer',
        background: loading || disabled ? 'rgba(229,9,20,0.45)' : C.accent,
        color: '#fff', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 8,
        fontFamily: "'Be Vietnam Pro', sans-serif",
        fontSize: 14, fontWeight: 700,
        transition: 'background 0.15s',
      }}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
          style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
        />
      ) : children}
    </motion.button>
  );
}

function ErrorMsg({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      style={{
        padding: '9px 12px', borderRadius: 6, marginBottom: 14,
        background: 'rgba(229,9,20,0.08)', border: '1px solid rgba(229,9,20,0.2)',
        fontFamily: "'Nunito', sans-serif", fontSize: 12.5, color: '#ff6b6b',
      }}
    >
      {children}
    </motion.div>
  );
}

function SuccessMsg({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      style={{
        padding: '9px 12px', borderRadius: 6, marginBottom: 14,
        background: 'rgba(70,211,105,0.08)', border: '1px solid rgba(70,211,105,0.2)',
        fontFamily: "'Nunito', sans-serif", fontSize: 12.5, color: C.green,
        display: 'flex', alignItems: 'center', gap: 7,
      }}
    >
      <Check size={13}/> {children}
    </motion.div>
  );
}

function Divider({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: 11, color: C.sub, whiteSpace: 'nowrap' }}>
        {text}
      </span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

// ─── VIEWS ──────────────────────────────────────────────────────────────────
// view: 'login' | 'register' | 'otp' | 'forgot' | 'reset' | 'done'

// ── Login ────────────────────────────────────────────────────────────────────
function LoginView({ onSwitch, onOtp, navigate }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const submit = async () => {
    if (!email.trim() || !password) { setError('Vui lòng điền đầy đủ thông tin'); return; }
    setLoading(true); setError('');
    try {
      const data = await authService.login({ email: email.trim(), password });

      if (data.requiresOtp) {
        onOtp({ userId: data.userId, email: email.trim() });
        return;
      }

      authService.saveSession(data);
      navigate('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>Chào mừng trở lại</p>
      <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 13, color: C.sub, marginBottom: 24 }}>
        Đăng nhập để tiếp tục xem phim
      </p>

      <InputField label="Email" type="email" value={email} onChange={setEmail}
        placeholder="email@example.com" autoFocus />
      <InputField label="Mật khẩu" type="password" value={password} onChange={setPassword}
        placeholder="••••••••" />

      <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 14 }}>
        <button onClick={() => onSwitch('forgot')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: "'Nunito',sans-serif", fontSize: 12, color: C.sub,
          textDecoration: 'underline', textDecorationColor: C.dim, padding: 0,
        }}>
          Quên mật khẩu?
        </button>
      </div>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      <SubmitBtn loading={loading} onClick={submit}>
        <Play size={14} fill="#fff"/> Đăng nhập
      </SubmitBtn>

      <Divider text="Chưa có tài khoản?" />

      <button onClick={() => onSwitch('register')} style={{
        width: '100%', padding: '11px', borderRadius: 6, cursor: 'pointer',
        background: 'none', border: `1px solid ${C.border}`,
        color: C.sub, fontFamily: "'Be Vietnam Pro',sans-serif",
        fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = C.text; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.sub; }}
      >
        Tạo tài khoản mới
      </button>
    </>
  );
}

// ── Register ─────────────────────────────────────────────────────────────────
function RegisterView({ onSwitch }) {
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  const submit = async () => {
    if (!username.trim() || !email.trim() || !password || !confirm) {
      setError('Vui lòng điền đầy đủ thông tin'); return;
    }
    if (password.length < 6) { setError('Mật khẩu ít nhất 6 ký tự'); return; }
    if (password !== confirm) { setError('Mật khẩu xác nhận không khớp'); return; }

    setLoading(true); setError('');
    try {
      await authService.register({ email: email.trim(), username: username.trim(), password, confirmPassword: confirm });
      setSuccess(true);
      setTimeout(() => onSwitch('login'), 1800);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
      style={{ textAlign: 'center', padding: '28px 0' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
        background: 'rgba(70,211,105,0.12)', border: '1px solid rgba(70,211,105,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Check size={24} style={{ color: C.green }}/>
      </div>
      <p style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 6 }}>Đăng ký thành công!</p>
      <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 13, color: C.sub }}>Đang chuyển sang đăng nhập...</p>
    </motion.div>
  );

  return (
    <>
      <p style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>Tạo tài khoản</p>
      <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 13, color: C.sub, marginBottom: 22 }}>
        Miễn phí — bắt đầu xem phim ngay
      </p>

      <InputField label="Tên hiển thị" value={username} onChange={setUsername}
        placeholder="Tên của bạn" autoFocus />
      <InputField label="Email" type="email" value={email} onChange={setEmail}
        placeholder="email@example.com" />
      <InputField label="Mật khẩu" type="password" value={password} onChange={setPassword}
        placeholder="Ít nhất 6 ký tự" />
      <InputField label="Xác nhận mật khẩu" type="password" value={confirm} onChange={setConfirm}
        placeholder="Nhập lại mật khẩu" />

      {error && <ErrorMsg>{error}</ErrorMsg>}

      <SubmitBtn loading={loading} onClick={submit}>
        <Check size={14}/> Tạo tài khoản
      </SubmitBtn>

      <Divider text="Đã có tài khoản?" />

      <button onClick={() => onSwitch('login')} style={{
        width: '100%', padding: '11px', borderRadius: 6, cursor: 'pointer',
        background: 'none', border: `1px solid ${C.border}`,
        color: C.sub, fontFamily: "'Be Vietnam Pro',sans-serif",
        fontSize: 13, fontWeight: 600,
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = C.text; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.sub; }}
      >
        Đăng nhập
      </button>
    </>
  );
}

// ── OTP (2FA) ─────────────────────────────────────────────────────────────────
function OtpView({ userId, email, navigate, onBack }) {
  const [code,     setCode]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [resending,setResending]= useState(false);
  const [error,    setError]    = useState('');
  const [sent,     setSent]     = useState(false);

  const submit = async () => {
    if (code.length !== 6) { setError('Mã OTP gồm 6 chữ số'); return; }
    setLoading(true); setError('');
    try {
      const data = await authService.verifyOtp({ userId, code });
      authService.saveSession(data);
      navigate('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true); setSent(false); setError('');
    try {
      await authService.sendOtp(userId);
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, background:'none',
        border:'none', cursor:'pointer', color:C.sub, padding:'0 0 20px',
        fontFamily:"'Nunito',sans-serif", fontSize:13 }}>
        <ArrowLeft size={14}/> Quay lại
      </button>

      <p style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 6 }}>Xác thực 2 bước</p>
      <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 13, color: C.sub, marginBottom: 24, lineHeight: 1.6 }}>
        Mã OTP đã gửi đến <strong style={{ color: C.text }}>{email}</strong>.<br/>
        Nhập mã 6 chữ số để tiếp tục.
      </p>

      {/* OTP input — 6 ô */}
      <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:20 }}>
        {Array.from({length:6}).map((_, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={code[i] || ''}
            onChange={e => {
              const val = e.target.value.replace(/\D/,'');
              const arr = code.split('');
              arr[i] = val;
              const next = arr.join('').slice(0,6);
              setCode(next);
              if (val && i < 5) document.getElementById(`otp-${i+1}`)?.focus();
            }}
            onKeyDown={e => {
              if (e.key === 'Backspace' && !code[i] && i > 0)
                document.getElementById(`otp-${i-1}`)?.focus();
            }}
            style={{
              width: 44, height: 52, textAlign:'center',
              background: C.input, border:`1px solid ${code[i] ? C.borderF : C.border}`,
              borderRadius: 8, color: C.text, outline:'none',
              fontFamily:"'Be Vietnam Pro',sans-serif", fontSize:20, fontWeight:800,
              transition:'border-color 0.15s',
            }}
          />
        ))}
      </div>

      {sent && <SuccessMsg>Đã gửi lại OTP</SuccessMsg>}
      {error && <ErrorMsg>{error}</ErrorMsg>}

      <SubmitBtn loading={loading} onClick={submit} disabled={code.length !== 6}>
        Xác nhận
      </SubmitBtn>

      <div style={{ textAlign:'center', marginTop:16 }}>
        <button onClick={resend} disabled={resending} style={{
          background:'none', border:'none', cursor:'pointer',
          fontFamily:"'Nunito',sans-serif", fontSize:12.5, color:C.sub,
          textDecoration:'underline', textDecorationColor:C.dim,
        }}>
          {resending ? 'Đang gửi...' : 'Gửi lại mã OTP'}
        </button>
      </div>
    </>
  );
}

// ── Forgot Password ───────────────────────────────────────────────────────────
function ForgotView({ onSwitch }) {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState(false);

  const submit = async () => {
    if (!email.trim()) { setError('Vui lòng nhập email'); return; }
    setLoading(true); setError('');
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <>
      <button onClick={() => onSwitch('reset', email)} style={{ display:'flex', alignItems:'center', gap:6, background:'none',
        border:'none', cursor:'pointer', color:C.sub, padding:'0 0 20px',
        fontFamily:"'Nunito',sans-serif", fontSize:13 }}>
        <ArrowLeft size={14}/> Quay lại
      </button>
      <SuccessMsg>Nếu email tồn tại, mã OTP đã được gửi</SuccessMsg>
      <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:C.sub, marginBottom:20, lineHeight:1.65 }}>
        Kiểm tra hộp thư <strong style={{color:C.text}}>{email}</strong> và nhập mã OTP để đặt lại mật khẩu.
      </p>
      <SubmitBtn loading={false} onClick={() => onSwitch('reset', email)}>
        Nhập mã OTP
      </SubmitBtn>
    </>
  );

  return (
    <>
      <button onClick={() => onSwitch('login')} style={{ display:'flex', alignItems:'center', gap:6, background:'none',
        border:'none', cursor:'pointer', color:C.sub, padding:'0 0 20px',
        fontFamily:"'Nunito',sans-serif", fontSize:13 }}>
        <ArrowLeft size={14}/> Quay lại đăng nhập
      </button>

      <p style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:6 }}>Quên mật khẩu?</p>
      <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:C.sub, marginBottom:24, lineHeight:1.65 }}>
        Nhập email đăng ký, chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
      </p>

      <InputField label="Email" type="email" value={email} onChange={setEmail}
        placeholder="email@example.com" autoFocus />

      {error && <ErrorMsg>{error}</ErrorMsg>}

      <SubmitBtn loading={loading} onClick={submit}>
        Gửi mã OTP
      </SubmitBtn>
    </>
  );
}

// ── Reset Password ────────────────────────────────────────────────────────────
function ResetView({ email: initEmail, onSwitch }) {
  const [email,    setEmail]    = useState(initEmail || '');
  const [code,     setCode]     = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [done,     setDone]     = useState(false);

  const submit = async () => {
    if (!email.trim() || !code || !password || !confirm) {
      setError('Vui lòng điền đầy đủ'); return;
    }
    if (password !== confirm) { setError('Mật khẩu không khớp'); return; }
    if (password.length < 6) { setError('Mật khẩu ít nhất 6 ký tự'); return; }
    setLoading(true); setError('');
    try {
      await authService.resetPassword({ email: email.trim(), code, newPassword: password, confirmPassword: confirm });
      setDone(true);
      setTimeout(() => onSwitch('login'), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{textAlign:'center', padding:'28px 0'}}>
      <div style={{ width:56, height:56, borderRadius:'50%', margin:'0 auto 16px',
        background:'rgba(70,211,105,0.12)', border:'1px solid rgba(70,211,105,0.25)',
        display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Check size={24} style={{color:C.green}}/>
      </div>
      <p style={{ fontSize:17, fontWeight:800, color:C.text, marginBottom:6 }}>Đặt lại mật khẩu thành công!</p>
      <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:C.sub }}>Đang chuyển về đăng nhập...</p>
    </motion.div>
  );

  return (
    <>
      <button onClick={() => onSwitch('forgot')} style={{ display:'flex', alignItems:'center', gap:6, background:'none',
        border:'none', cursor:'pointer', color:C.sub, padding:'0 0 20px',
        fontFamily:"'Nunito',sans-serif", fontSize:13 }}>
        <ArrowLeft size={14}/> Quay lại
      </button>
      <p style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:4 }}>Đặt lại mật khẩu</p>
      <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:C.sub, marginBottom:22 }}>
        Nhập mã OTP và mật khẩu mới của bạn.
      </p>

      {!initEmail && <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="email@example.com"/>}
      <InputField label="Mã OTP" value={code} onChange={setCode} placeholder="6 chữ số" autoFocus={!!initEmail}/>
      <InputField label="Mật khẩu mới" type="password" value={password} onChange={setPassword} placeholder="Ít nhất 6 ký tự"/>
      <InputField label="Xác nhận mật khẩu" type="password" value={confirm} onChange={setConfirm} placeholder="Nhập lại mật khẩu"/>

      {error && <ErrorMsg>{error}</ErrorMsg>}
      <SubmitBtn loading={loading} onClick={submit}>Đặt lại mật khẩu</SubmitBtn>
    </>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Film,   label: 'Kho phim khổng lồ'  },
  { icon: Zap,    label: 'Chất lượng Full HD'   },
  { icon: Star,   label: 'Đánh giá cộng đồng'  },
  { icon: Shield, label: 'Không quảng cáo'      },
];

export default function LandingPage() {
  const navigate = useNavigate();
  // view: 'login' | 'register' | 'otp' | 'forgot' | 'reset'
  const [view,    setView]    = useState('login');
  const [otpData, setOtpData] = useState(null);   // { userId, email }
  const [resetEmail, setResetEmail] = useState('');

  const handleSwitch = (next, data) => {
    if (next === 'reset') setResetEmail(data || '');
    setView(next);
  };

  const handleOtp = ({ userId, email }) => {
    setOtpData({ userId, email });
    setView('otp');
  };

  const cardTitle = {
    login:    'Đăng nhập',
    register: 'Đăng ký',
    otp:      'Xác thực OTP',
    forgot:   'Quên mật khẩu',
    reset:    'Đặt lại mật khẩu',
  }[view];

  return (
    <div style={{
      minHeight: '100vh', background: C.bg, color: C.text,
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Be Vietnam Pro', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900&family=Nunito:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #333; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #0a0a0a inset !important; -webkit-text-fill-color: #f0f0f0 !important; }
      `}</style>

      {/* NAVBAR */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 60, flexShrink: 0,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: C.accent, letterSpacing: '-0.02em' }}>UIA</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: '0.06em' }}>MOVIE</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['login','register'].map(t => (
            <button key={t} onClick={() => setView(t)} style={{
              padding: '7px 18px', borderRadius: 4, cursor: 'pointer',
              background: view === t ? C.accent : 'none',
              border: view === t ? 'none' : `1px solid ${C.border}`,
              color: view === t ? '#fff' : C.sub,
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
            }}>
              {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          ))}
        </div>
      </nav>

      {/* MAIN — 2 cột */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: '1fr 420px',
        maxWidth: 1060, width: '100%',
        margin: '0 auto', padding: '0 40px',
        alignItems: 'center', gap: 0,
      }}>

        {/* LEFT */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ paddingRight: 64 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '5px 14px', borderRadius: 40, marginBottom: 28,
            background: C.accentL, border: '1px solid rgba(229,9,20,0.22)',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Xem phim không giới hạn
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(40px, 4.5vw, 62px)', fontWeight: 900,
            lineHeight: 1.06, letterSpacing: '-0.03em',
            color: C.text, marginBottom: 20,
          }}>
            Trải nghiệm<br />
            phim ảnh<br />
            <span style={{ color: C.accent }}>đỉnh cao.</span>
          </h1>

          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 15, color: C.sub, lineHeight: 1.75,
            marginBottom: 36, maxWidth: 380,
          }}>
            Kho phim khổng lồ, chất lượng HD,<br />cộng đồng đánh giá sôi động.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: C.accentL, border: '1px solid rgba(229,9,20,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={14} style={{ color: C.accent }} />
                </div>
                <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: 13, color: '#999' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT — Auth card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: C.card, borderRadius: 16,
            border: `1px solid ${C.border}`,
            padding: '36px 32px',
            boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              {view === 'login'    && <LoginView    onSwitch={handleSwitch} onOtp={handleOtp} navigate={navigate} />}
              {view === 'register' && <RegisterView onSwitch={handleSwitch} />}
              {view === 'otp'      && <OtpView      userId={otpData?.userId} email={otpData?.email} navigate={navigate} onBack={() => setView('login')} />}
              {view === 'forgot'   && <ForgotView   onSwitch={handleSwitch} />}
              {view === 'reset'    && <ResetView    email={resetEmail} onSwitch={handleSwitch} />}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* FOOTER */}
      <div style={{
        textAlign: 'center', padding: '16px',
        borderTop: `1px solid ${C.border}`,
        fontFamily: "'Nunito',sans-serif", fontSize: 11, color: C.dim,
      }}>
        © 2025 UIA Movie — All rights reserved
      </div>
    </div>
  );
}