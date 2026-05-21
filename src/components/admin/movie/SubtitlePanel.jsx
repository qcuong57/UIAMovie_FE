// src/components/admin/movie/SubtitlePanel.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Languages, Sparkles, Trash2, Star,
  RefreshCw, ChevronDown, FileText, CheckCircle2,
  AlertCircle, Loader2, Plus, X, Clock,
  ChevronUp, Pencil, Save, RotateCcw,
} from 'lucide-react';
import movieSubtitleService from '../../../services/movieSubtitleService';
import SubtitleContentEditor, { SubtitleEditorModal } from '../shared/SubtitleContentEditor';

// ── Design tokens ─────────────────────────────────────────────────────────────
const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace";
const T = {
  bg:          '#F4F3EF',
  surface:     '#FFFFFF',
  surfaceAlt:  '#FAFAF8',
  surfaceHov:  '#F6F6F3',
  accent:      '#1C5F3A',
  accentLight: '#EAF5EF',
  accentText:  '#155230',
  text:        '#18181B',
  textSub:     '#71717A',
  textMuted:   '#A1A1AA',
  border:      'rgba(0,0,0,0.08)',
  borderFocus: 'rgba(28,95,58,0.4)',
  shadow:      '0 1px 3px rgba(0,0,0,0.07)',
  red:         '#DC2626',
  redLight:    '#FEF2F2',
  gold:        '#D97706',
  goldLight:   '#FEF3C7',
  blue:        '#2563EB',
  blueLight:   '#EFF6FF',
  purple:      '#7C3AED',
  purpleLight: '#F5F3FF',
};

const LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'en', name: 'English' },
  { code: 'ko', name: '한국어' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'th', name: 'ภาษาไทย' },
];

const STATUS = { READY: 0, PROCESSING: 1, FAILED: 2 };

const getLangName = (code) =>
  LANGUAGES.find(l => l.code === code)?.name ?? code?.toUpperCase() ?? '—';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—';

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = {
    [STATUS.READY]:      { label: 'Sẵn sàng',   color: T.accent, bg: T.accentLight, icon: CheckCircle2 },
    [STATUS.PROCESSING]: { label: 'Đang xử lý', color: T.blue,   bg: T.blueLight,   icon: Loader2 },
    [STATUS.FAILED]:     { label: 'Lỗi',         color: T.red,    bg: T.redLight,    icon: AlertCircle },
  }[status] ?? { label: 'Không rõ', color: T.textMuted, bg: T.surfaceAlt, icon: Clock };

  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 99,
      background: cfg.bg, color: cfg.color,
      fontFamily: FONT, fontSize: 11, fontWeight: 600,
    }}>
      <Icon size={11} style={status === STATUS.PROCESSING ? { animation: 'spin 1s linear infinite' } : {}} />
      {cfg.label}
    </span>
  );
}

function LangSelect({ label, value, onChange, placeholder = 'Chọn ngôn ngữ...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <select
          value={value} onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', height: 38, padding: '0 36px 0 12px',
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 9, color: value ? T.text : T.textMuted,
            fontFamily: FONT, fontSize: 13, outline: 'none',
            appearance: 'none', cursor: 'pointer',
          }}
        >
          <option value="">{placeholder}</option>
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.name} ({l.code})</option>
          ))}
        </select>
        <ChevronDown size={14} color={T.textMuted} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      </div>
    </div>
  );
}

function SmInput({ label, value, onChange, placeholder, type = 'text' }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </label>
      )}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          height: 38, padding: '0 12px',
          background: T.surface,
          border: `1px solid ${focused ? T.borderFocus : T.border}`,
          borderRadius: 9, color: T.text, outline: 'none',
          fontFamily: FONT, fontSize: 13, transition: 'border-color 0.15s',
          boxSizing: 'border-box', width: '100%',
        }}
      />
    </div>
  );
}

function Btn({ onClick, disabled, loading, icon: Icon, children, variant = 'primary', size = 'md' }) {
  const variants = {
    primary: { bg: T.accent,      color: '#fff',    border: 'transparent',         hoverBg: '#155230'   },
    ghost:   { bg: 'transparent', color: T.textSub, border: T.border,              hoverBg: T.surfaceAlt },
    danger:  { bg: T.redLight,    color: T.red,     border: 'rgba(220,38,38,0.2)', hoverBg: '#FEE2E2'   },
    blue:    { bg: T.blueLight,   color: T.blue,    border: 'rgba(37,99,235,0.2)', hoverBg: '#DBEAFE'   },
    purple:  { bg: T.purpleLight, color: T.purple,  border: 'rgba(124,58,237,0.2)',hoverBg: '#EDE9FE'   },
    teal:    { bg: '#E0F2FE',     color: '#0369A1', border: 'rgba(3,105,161,0.2)', hoverBg: '#BAE6FD'   },
  };
  const v = variants[variant] ?? variants.primary;
  const [hov, setHov] = useState(false);
  const pad = size === 'sm' ? '0 12px' : '0 16px';
  const h   = size === 'sm' ? 30 : 36;

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: h, padding: pad, borderRadius: 8,
        background: hov ? v.hoverBg : v.bg,
        color: v.color, border: `1px solid ${v.border}`,
        fontFamily: FONT, fontSize: size === 'sm' ? 12 : 13, fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.55 : 1,
        transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}
    >
      {loading
        ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
        : Icon && <Icon size={13} />
      }
      {children}
    </button>
  );
}


// ── Upload Tab ────────────────────────────────────────────────────────────────
function UploadTab({ movieId, onRefresh }) {
  const [file,      setFile]      = useState(null);
  const [langCode,  setLangCode]  = useState('');
  const [langName,  setLangName]  = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const fileRef  = useRef();
  const [dragging, setDragging] = useState(false);

  const pickFile = (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['srt', 'vtt'].includes(ext)) { setError('Chỉ hỗ trợ .srt hoặc .vtt'); return; }
    if (f.size > 10 * 1024 * 1024)    { setError('File tối đa 10MB'); return; }
    setFile(f); setError(''); setSuccess('');
  };

  const handleSubmit = async () => {
    if (!file)     { setError('Vui lòng chọn file subtitle'); return; }
    if (!langCode) { setError('Vui lòng chọn ngôn ngữ'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await movieSubtitleService.uploadSubtitle(movieId, file, langCode, langName || undefined, isDefault);
      setSuccess('Upload thành công!');
      setFile(null); setLangCode(''); setLangName(''); setIsDefault(false);
      onRefresh();
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Upload thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files?.[0]); }}
        onClick={() => fileRef.current?.click()}
        style={{
          padding: '28px 20px', borderRadius: 12, cursor: 'pointer',
          border: `2px dashed ${dragging ? T.accent : file ? T.accent : T.border}`,
          background: dragging ? T.accentLight : file ? T.accentLight : T.surfaceAlt,
          textAlign: 'center', transition: 'all 0.18s',
        }}
      >
        <input ref={fileRef} type="file" accept=".srt,.vtt" style={{ display: 'none' }} onChange={e => pickFile(e.target.files?.[0])} />
        {file ? (
          <>
            <FileText size={24} color={T.accent} style={{ margin: '0 auto 8px' }} />
            <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.accent }}>{file.name}</p>
            <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, marginTop: 3 }}>{(file.size / 1024).toFixed(1)} KB · Bấm để đổi file</p>
          </>
        ) : (
          <>
            <Upload size={24} color={T.textMuted} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p style={{ fontFamily: FONT, fontSize: 13, color: T.textSub, fontWeight: 600 }}>Kéo thả hoặc bấm để chọn file</p>
            <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, marginTop: 4 }}>.srt hoặc .vtt · Tối đa 10MB</p>
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <LangSelect label="Ngôn ngữ *" value={langCode} onChange={setLangCode} />
        <SmInput label="Tên hiển thị (tuỳ chọn)" value={langName} onChange={setLangName} placeholder={langCode ? getLangName(langCode) : 'VD: Tiếng Việt'} />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
        <div
          onClick={() => setIsDefault(p => !p)}
          style={{ width: 34, height: 19, borderRadius: 10, position: 'relative', background: isDefault ? T.accent : 'rgba(0,0,0,0.12)', transition: 'background 0.18s', flexShrink: 0, cursor: 'pointer' }}
        >
          <div style={{ position: 'absolute', top: 2, left: isDefault ? 17 : 2, width: 15, height: 15, borderRadius: '50%', background: '#fff', transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
        <span style={{ fontFamily: FONT, fontSize: 13, color: T.textSub }}>Đặt làm subtitle mặc định</span>
      </label>

      {error   && <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.red,    padding: '8px 12px', background: T.redLight,    borderRadius: 8 }}>{error}</p>}
      {success && <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.accent, padding: '8px 12px', background: T.accentLight, borderRadius: 8 }}>✓ {success}</p>}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn onClick={handleSubmit} loading={loading} icon={Upload}>Upload subtitle</Btn>
      </div>
    </div>
  );
}

// ── Translate Tab ─────────────────────────────────────────────────────────────
function TranslateTab({ movieId, subtitles, onRefresh }) {
  const [sourceId,   setSourceId]   = useState('');
  const [targetCode, setTargetCode] = useState('');
  const [targetName, setTargetName] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [info,       setInfo]       = useState('');

  const readySubtitles = subtitles.filter(s => s.status === STATUS.READY);

  const handleTranslate = async () => {
    if (!sourceId)   { setError('Chọn subtitle gốc'); return; }
    if (!targetCode) { setError('Chọn ngôn ngữ đích'); return; }
    setLoading(true); setError(''); setInfo('');
    try {
      const result = await movieSubtitleService.translateSubtitle(movieId, sourceId, targetCode, targetName || undefined);
      setInfo(`Đang dịch sang "${targetName || getLangName(targetCode)}"... (ID: ${result?.id?.slice(0, 8)})`);
      setSourceId(''); setTargetCode(''); setTargetName('');
      onRefresh();
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Lỗi khi gửi yêu cầu dịch');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ padding: '10px 14px', borderRadius: 10, background: T.blueLight, border: `1px solid rgba(37,99,235,0.15)` }}>
        <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.blue, lineHeight: 1.65 }}>
          AI sẽ dịch subtitle đã có trong hệ thống sang ngôn ngữ khác. Trả về ngay, poll trạng thái tự động.
        </p>
      </div>

      {readySubtitles.length === 0 ? (
        <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted, textAlign: 'center', padding: '16px 0' }}>
          Chưa có subtitle sẵn sàng để dịch. Upload subtitle trước.
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Subtitle gốc *</label>
            <div style={{ position: 'relative' }}>
              <select
                value={sourceId} onChange={e => setSourceId(e.target.value)}
                style={{ width: '100%', height: 38, padding: '0 36px 0 12px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9, color: sourceId ? T.text : T.textMuted, fontFamily: FONT, fontSize: 13, outline: 'none', appearance: 'none', cursor: 'pointer' }}
              >
                <option value="">Chọn subtitle gốc...</option>
                {readySubtitles.map(s => (
                  <option key={s.id} value={s.id}>{s.languageName || getLangName(s.languageCode)} ({s.languageCode})</option>
                ))}
              </select>
              <ChevronDown size={14} color={T.textMuted} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <LangSelect label="Ngôn ngữ đích *" value={targetCode} onChange={setTargetCode} />
            <SmInput label="Tên hiển thị (tuỳ chọn)" value={targetName} onChange={setTargetName} placeholder={targetCode ? getLangName(targetCode) : 'VD: Tiếng Việt'} />
          </div>

          {error && <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.red,  padding: '8px 12px', background: T.redLight, borderRadius: 8 }}>{error}</p>}
          {info  && <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.blue, padding: '8px 12px', background: T.blueLight, borderRadius: 8 }}>⏳ {info}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={handleTranslate} loading={loading} icon={Languages} variant="blue">Dịch bằng AI</Btn>
          </div>
        </>
      )}
    </div>
  );
}

// ── AI Generate Tab ───────────────────────────────────────────────────────────
function AiGenerateTab({ movieId, onRefresh }) {
  const [content, setContent] = useState('');
  const [srcCode, setSrcCode] = useState('en');
  const [tgtCode, setTgtCode] = useState('vi');
  const [tgtName, setTgtName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [info,    setInfo]    = useState('');
  const [focused, setFocused] = useState(false);

  const handleGenerate = async () => {
    if (!content.trim()) { setError('Vui lòng dán nội dung SRT/VTT vào'); return; }
    if (!tgtCode)        { setError('Chọn ngôn ngữ đích'); return; }
    setLoading(true); setError(''); setInfo('');
    try {
      const result = await movieSubtitleService.aiGenerateSubtitle(movieId, content.trim(), srcCode, tgtCode, tgtName || undefined);
      setInfo(`Đang tạo subtitle "${tgtName || getLangName(tgtCode)}"... (ID: ${result?.id?.slice(0, 8)})`);
      setContent(''); setSrcCode('en'); setTgtCode('vi'); setTgtName('');
      onRefresh();
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Lỗi khi gửi yêu cầu');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ padding: '10px 14px', borderRadius: 10, background: T.purpleLight, border: `1px solid rgba(124,58,237,0.15)` }}>
        <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.purple, lineHeight: 1.65 }}>
          Dán trực tiếp nội dung .srt hoặc .vtt, AI sẽ tạo subtitle mới sang ngôn ngữ đích. Không cần upload file trước.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Nội dung SRT / VTT gốc *</label>
        <textarea
          value={content} onChange={e => setContent(e.target.value)}
          placeholder={"1\n00:00:01,000 --> 00:00:04,000\nHello, this is a subtitle.\n\n2\n00:00:05,000 --> 00:00:08,000\nWelcome to our movie..."}
          rows={9}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            padding: '10px 12px', fontFamily: MONO, fontSize: 12, lineHeight: 1.7,
            background: T.surface, border: `1px solid ${focused ? T.borderFocus : T.border}`,
            borderRadius: 9, color: T.text, outline: 'none', resize: 'vertical',
            transition: 'border-color 0.15s', boxSizing: 'border-box', width: '100%',
          }}
        />
        <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted }}>{content.length} ký tự</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <LangSelect label="Ngôn ngữ gốc" value={srcCode} onChange={setSrcCode} placeholder="Ngôn ngữ gốc..." />
        <LangSelect label="Ngôn ngữ đích *" value={tgtCode} onChange={setTgtCode} />
        <SmInput label="Tên hiển thị (tuỳ chọn)" value={tgtName} onChange={setTgtName} placeholder={tgtCode ? getLangName(tgtCode) : 'VD: Tiếng Việt'} />
      </div>

      {error && <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.red,    padding: '8px 12px', background: T.redLight,    borderRadius: 8 }}>{error}</p>}
      {info  && <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.purple, padding: '8px 12px', background: T.purpleLight, borderRadius: 8 }}>⏳ {info}</p>}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn onClick={handleGenerate} loading={loading} icon={Sparkles} variant="purple">Tạo subtitle bằng AI</Btn>
      </div>
    </div>
  );
}

// ── Subtitle Row ─────────────────────────────────────────────────────────────
function SubtitleRow({ subtitle, movieId, onSetDefault, onDelete, onStatusUpdate }) {
  const [deleting,    setDeleting]    = useState(false);
  const [settingDef,  setSettingDef]  = useState(false);
  const [modalOpen,   setModalOpen]   = useState(false);
  const isProcessing = subtitle.status === STATUS.PROCESSING;
  const canEdit      = subtitle.status === STATUS.READY;

  // Auto-poll khi đang processing
  useEffect(() => {
    if (!isProcessing) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const status = await movieSubtitleService.getSubtitleStatus(movieId, subtitle.id);
        if (!cancelled) onStatusUpdate(subtitle.id, status);
        if (!cancelled && status.status === STATUS.PROCESSING) setTimeout(poll, 3000);
      } catch { /* silent */ }
    };
    const t = setTimeout(poll, 3000);
    return () => { cancelled = true; clearTimeout(t); };
  }, [isProcessing, subtitle.id, movieId]);

  const handleDelete = async () => {
    if (!window.confirm(`Xóa subtitle "${subtitle.languageName || getLangName(subtitle.languageCode)}"?`)) return;
    setDeleting(true);
    try { await movieSubtitleService.deleteSubtitle(movieId, subtitle.id); onDelete(subtitle.id); }
    catch (e) { alert(e?.response?.data?.message ?? 'Xóa thất bại'); }
    finally { setDeleting(false); }
  };

  const handleSetDefault = async () => {
    if (subtitle.isDefault) return;
    setSettingDef(true);
    try { await movieSubtitleService.setDefault(movieId, subtitle.id); onSetDefault(subtitle.id); }
    catch (e) { alert(e?.response?.data?.message ?? 'Cập nhật thất bại'); }
    finally { setSettingDef(false); }
  };

  const sourceLabel = { manual: 'Upload', ai: 'AI dịch', aiGenerate: 'AI Generate' }[subtitle.source] ?? subtitle.source;
  const sourceBg    = { manual: T.accentLight, ai: T.blueLight, aiGenerate: T.purpleLight }[subtitle.source] ?? T.surfaceAlt;
  const sourceColor = { manual: T.accent,      ai: T.blue,      aiGenerate: T.purple      }[subtitle.source] ?? T.textMuted;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
    >
      {/* Row header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
          background: T.surface,
          borderRadius: 10,
          border: `1px solid ${subtitle.isDefault ? `${T.accent}35` : T.border}`,
          boxShadow: subtitle.isDefault ? `0 0 0 2px ${T.accent}18, ${T.shadow}` : T.shadow,
          transition: 'border-color 0.2s, box-shadow 0.2s, border-radius 0.15s',
          cursor: canEdit ? 'pointer' : 'default',
        }}
        onClick={() => canEdit && setModalOpen(true)}
      >
        {/* Lang indicator */}
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: subtitle.isDefault ? T.accentLight : T.surfaceAlt,
          border: `1px solid ${subtitle.isDefault ? `${T.accent}30` : T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 800, color: subtitle.isDefault ? T.accent : T.textSub }}>
            {(subtitle.languageCode ?? '??').toUpperCase()}
          </span>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.text }}>
              {subtitle.languageName || getLangName(subtitle.languageCode)}
            </span>
            {subtitle.isDefault && (
              <span style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: T.accent, padding: '2px 7px', borderRadius: 99, background: T.accentLight, border: `1px solid ${T.accent}30` }}>
                ★ Mặc định
              </span>
            )}
            <span style={{ fontFamily: FONT, fontSize: 10.5, color: sourceColor, padding: '2px 7px', borderRadius: 99, background: sourceBg }}>
              {sourceLabel}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
            <StatusBadge status={subtitle.status} />
            {subtitle.errorMessage && (
              <span style={{ fontFamily: FONT, fontSize: 11, color: T.red, opacity: 0.8 }}>{subtitle.errorMessage}</span>
            )}
            <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted }}>{formatDate(subtitle.createdAt)}</span>
            {canEdit && (
              <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Pencil size={10} /> Bấm để xem & sửa
              </span>
            )}
          </div>
        </div>

        {/* Actions — stop propagation để click nút không toggle expand */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          {!subtitle.isDefault && canEdit && (
            <Btn onClick={handleSetDefault} loading={settingDef} icon={Star} variant="ghost" size="sm">Mặc định</Btn>
          )}
          <Btn onClick={handleDelete} loading={deleting} icon={Trash2} variant="danger" size="sm">Xóa</Btn>
        </div>

      </div>

      {/* Modal editor */}
      <SubtitleEditorModal
        open={modalOpen}
        mediaId={movieId}
        subtitle={subtitle}
        subtitleService={movieSubtitleService}
        onClose={() => setModalOpen(false)}
      />
    </motion.div>
  );
}

// ── Add Subtitle Form ─────────────────────────────────────────────────────────
const ADD_MODES = [
  { key: 'upload',     label: 'Upload file', icon: Upload,    variant: 'primary' },
  { key: 'translate',  label: 'AI dịch',     icon: Languages, variant: 'blue'    },
  { key: 'aiGenerate', label: 'AI từ text',  icon: Sparkles,  variant: 'purple'  },
];

function AddSubtitleForm({ movieId, subtitles, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('upload');

  return (
    <div style={{ marginBottom: 16 }}>
      {!open ? (
        <Btn onClick={() => setOpen(true)} icon={Plus}>Thêm subtitle</Btn>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
            <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.text }}>Thêm subtitle mới</p>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${T.border}` }}>
            {ADD_MODES.map(m => {
              const Icon   = m.icon;
              const active = mode === m.key;
              const c = { primary: T.accent, blue: T.blue, purple: T.purple }[m.variant];
              return (
                <button
                  key={m.key} onClick={() => setMode(m.key)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: `2.5px solid ${active ? c : 'transparent'}`,
                    color: active ? c : T.textMuted, fontFamily: FONT, fontSize: 12.5, fontWeight: active ? 700 : 500,
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={13} />{m.label}
                </button>
              );
            })}
          </div>

          <div style={{ padding: '16px' }}>
            <AnimatePresence mode="wait">
              {mode === 'upload' && (
                <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <UploadTab movieId={movieId} onRefresh={() => { onRefresh(); setOpen(false); }} />
                </motion.div>
              )}
              {mode === 'translate' && (
                <motion.div key="translate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <TranslateTab movieId={movieId} subtitles={subtitles} onRefresh={() => { onRefresh(); setOpen(false); }} />
                </motion.div>
              )}
              {mode === 'aiGenerate' && (
                <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <AiGenerateTab movieId={movieId} onRefresh={() => { onRefresh(); setOpen(false); }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function SubtitlePanel({ movieId }) {
  const [subtitles, setSubtitles] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  const fetchSubtitles = useCallback(async () => {
    if (!movieId) return;
    setLoading(true); setError('');
    try {
      const data = await movieSubtitleService.getSubtitles(movieId);
      setSubtitles(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Không tải được danh sách subtitle');
    } finally { setLoading(false); }
  }, [movieId]);

  useEffect(() => { fetchSubtitles(); }, [fetchSubtitles]);

  const handleSetDefault   = (id) => setSubtitles(prev => prev.map(s => ({ ...s, isDefault: s.id === id })));
  const handleDelete       = (id) => setSubtitles(prev => prev.filter(s => s.id !== id));
  const handleStatusUpdate = (id, status) => setSubtitles(prev => prev.map(s =>
    s.id === id ? { ...s, status: status.status, errorMessage: status.errorMessage } : s
  ));

  const processingCount = subtitles.filter(s => s.status === STATUS.PROCESSING).length;

  return (
    <div style={{ fontFamily: FONT }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Subtitles</p>
          {subtitles.length > 0 && (
            <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, padding: '1px 7px', background: T.surfaceAlt, borderRadius: 99, border: `1px solid ${T.border}` }}>
              {subtitles.length}
            </span>
          )}
          {processingCount > 0 && (
            <span style={{ fontFamily: FONT, fontSize: 11, color: T.blue, padding: '1px 7px', background: T.blueLight, borderRadius: 99, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
              {processingCount} đang xử lý
            </span>
          )}
        </div>
        <button
          onClick={fetchSubtitles}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT, fontSize: 12 }}
        >
          <RefreshCw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          Tải lại
        </button>
      </div>

      <AddSubtitleForm movieId={movieId} subtitles={subtitles} onRefresh={fetchSubtitles} />

      {loading && subtitles.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Loader2 size={24} color={T.textMuted} style={{ margin: '0 auto 10px', animation: 'spin 1s linear infinite', display: 'block' }} />
          <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Đang tải...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '20px', borderRadius: 10, background: T.redLight, border: `1px solid rgba(220,38,38,0.2)` }}>
          <p style={{ fontFamily: FONT, fontSize: 13, color: T.red }}>{error}</p>
        </div>
      ) : subtitles.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <FileText size={28} color={T.textMuted} style={{ margin: '0 auto 10px', opacity: 0.3, display: 'block' }} />
          <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Chưa có subtitle nào</p>
          <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, marginTop: 4, opacity: 0.7 }}>Upload file .srt/.vtt hoặc dùng AI để tạo</p>
        </div>
      ) : (
        <AnimatePresence>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {subtitles
              .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
              .map(s => (
                <SubtitleRow
                  key={s.id}
                  subtitle={s}
                  movieId={movieId}
                  onSetDefault={handleSetDefault}
                  onDelete={handleDelete}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}