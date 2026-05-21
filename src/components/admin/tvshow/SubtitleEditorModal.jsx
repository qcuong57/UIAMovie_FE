// src/components/admin/tvshow/SubtitleEditorModal.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Pencil, Save, RotateCcw, CheckCircle2,
  AlertCircle, Loader2, ChevronDown,
} from 'lucide-react';
import episodeSubtitleService from '../../../services/episodeSubtitleService';

// ── Design tokens (phải khớp với EpisodeSubtitlePanel) ────────────────────────
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

const getLangName = (code) =>
  LANGUAGES.find(l => l.code === code)?.name ?? code?.toUpperCase() ?? '—';

// ── Parse SRT/VTT → cues ──────────────────────────────────────────────────────
function parseCues(raw) {
  if (!raw?.trim()) return [];
  const text = raw.trim();
  const isVtt = text.startsWith('WEBVTT');
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const cues = [];
  let i = isVtt ? 1 : 0;

  while (i < lines.length) {
    if (!lines[i]?.trim()) { i++; continue; }
    if (/^(NOTE|STYLE|REGION)\b/.test(lines[i])) {
      while (i < lines.length && lines[i]?.trim()) i++;
      continue;
    }
    let index = '';
    const isTimestamp = (s) => /-->/.test(s);
    if (!isTimestamp(lines[i])) { index = lines[i].trim(); i++; }
    if (i >= lines.length || !isTimestamp(lines[i] ?? '')) { i++; continue; }
    const timeLine = lines[i].trim(); i++;
    const textLines = [];
    while (i < lines.length && lines[i]?.trim()) { textLines.push(lines[i]); i++; }
    if (timeLine) cues.push({ index, timeLine, text: textLines.join('\n'), original: textLines.join('\n') });
  }
  return cues;
}

function cuesToVtt(cues) {
  const blocks = ['WEBVTT', ''];
  cues.forEach((cue, idx) => {
    blocks.push(String(idx + 1));
    blocks.push(cue.timeLine);
    blocks.push(cue.text);
    blocks.push('');
  });
  return blocks.join('\n');
}

// ── Shared Btn ────────────────────────────────────────────────────────────────
function Btn({ onClick, disabled, loading, icon: Icon, children, variant = 'primary', size = 'md' }) {
  const variants = {
    primary: { bg: T.accent,      color: '#fff',    border: 'transparent',         hoverBg: '#155230'   },
    ghost:   { bg: 'transparent', color: T.textSub, border: T.border,              hoverBg: T.surfaceAlt },
    danger:  { bg: T.redLight,    color: T.red,     border: 'rgba(220,38,38,0.2)', hoverBg: '#FEE2E2'   },
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
        : Icon && <Icon size={13} />}
      {children}
    </button>
  );
}

// ── CueRow ────────────────────────────────────────────────────────────────────
function CueRow({ cue, index, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(cue.text);
  const textareaRef           = useRef();
  const isChanged             = cue.text !== cue.original;

  useEffect(() => { setDraft(cue.text); }, [cue.text]);

  const commitEdit = () => { onChange(draft); setEditing(false); };
  const cancelEdit = () => { setDraft(cue.text); setEditing(false); };
  const startEdit  = () => {
    setDraft(cue.text);
    setEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editing, draft]);

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '52px 1fr', gap: 0,
      borderBottom: `1px solid ${T.border}`,
      background: isChanged ? `${T.gold}08` : 'transparent',
      transition: 'background 0.15s',
    }}>
      <div style={{
        padding: '10px 8px 10px 14px',
        borderRight: `1px solid ${T.border}`,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3,
      }}>
        <span style={{ fontFamily: MONO, fontSize: 10, color: T.textMuted, fontWeight: 600 }}>
          #{index + 1}
        </span>
        {isChanged && (
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.gold, display: 'block' }} />
        )}
      </div>

      <div style={{ padding: '8px 10px 8px 12px' }}>
        <p style={{ fontFamily: MONO, fontSize: 10.5, color: T.blue, marginBottom: 4, lineHeight: 1 }}>
          {cue.timeLine}
        </p>

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={e => {
                setDraft(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); commitEdit(); }
                if (e.key === 'Escape') cancelEdit();
              }}
              style={{
                width: '100%', padding: '6px 8px',
                fontFamily: MONO, fontSize: 12.5, lineHeight: 1.6,
                background: T.bg, border: `1px solid ${T.borderFocus}`,
                borderRadius: 6, color: T.text, outline: 'none',
                resize: 'none', overflow: 'hidden',
                boxSizing: 'border-box', minHeight: 36,
              }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={commitEdit}
                style={{
                  fontFamily: FONT, fontSize: 11, fontWeight: 700,
                  color: T.accent, background: T.accentLight,
                  border: `1px solid ${T.accent}30`,
                  padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                }}
              >
                ✓ Xong <span style={{ opacity: 0.6, fontWeight: 400 }}>(Ctrl+Enter)</span>
              </button>
              <button
                onClick={cancelEdit}
                style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px' }}
              >
                Huỷ
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={startEdit}
            title="Bấm để chỉnh sửa"
            style={{
              fontFamily: MONO, fontSize: 12.5, color: T.text, lineHeight: 1.65,
              cursor: 'text', padding: '4px 6px', borderRadius: 5,
              border: '1px solid transparent',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              transition: 'border-color 0.12s, background 0.12s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = T.border;
              e.currentTarget.style.background  = T.surfaceAlt;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.background  = 'transparent';
            }}
          >
            {cue.text || <span style={{ color: T.textMuted, fontStyle: 'italic' }}>(trống)</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── CueEditor ─────────────────────────────────────────────────────────────────
function CueEditor({ cues, onChange }) {
  if (cues.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>
          Không parse được cue nào. Thử chuyển sang Raw text.
        </p>
      </div>
    );
  }
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {cues.map((cue, idx) => (
        <CueRow key={idx} cue={cue} index={idx} onChange={(newText) => onChange(idx, newText)} />
      ))}
    </div>
  );
}

// ── RawEditor ─────────────────────────────────────────────────────────────────
function RawEditor({ value, onChange }) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        spellCheck={false}
        style={{
          flex: 1, width: '100%', minHeight: 0,
          padding: '10px 12px',
          fontFamily: MONO, fontSize: 12, lineHeight: 1.7,
          background: T.bg,
          border: `1px solid ${focused ? T.borderFocus : T.border}`,
          borderRadius: 8, color: T.text, outline: 'none',
          resize: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
      />
      <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, marginTop: 6, flexShrink: 0 }}>
        {value.split('\n').length} dòng · {value.length} ký tự
      </p>
    </div>
  );
}

// ── SubtitleEditorModal ───────────────────────────────────────────────────────
/**
 * Props:
 *   episodeId  — ID của episode
 *   subtitle   — object subtitle { id, languageCode, languageName, isDefault, ... }
 *   onClose    — callback đóng modal
 *   onSaved    — callback sau khi lưu thành công (tuỳ chọn)
 */
export default function SubtitleEditorModal({ episodeId, subtitle, onClose, onSaved }) {
  const [mode, setMode]       = useState('cue');   // 'cue' | 'raw'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [rawText, setRawText] = useState('');
  const [cues, setCues]       = useState([]);
  const [dirty, setDirty]     = useState(false);

  const langLabel = subtitle?.languageName || getLangName(subtitle?.languageCode);
  const cueCount  = cues.length;
  const changed   = dirty ? cues.filter((c, i) => c.text !== c.original).length : 0;

  // Load content
  useEffect(() => {
    if (!subtitle) return;
    let cancelled = false;
    setLoading(true); setError('');
    episodeSubtitleService.getSubtitleContent(episodeId, subtitle.id)
      .then(dto => {
        if (cancelled) return;
        const text = dto?.content ?? '';
        setRawText(text);
        setCues(parseCues(text));
      })
      .catch(e => {
        if (!cancelled) setError(e?.response?.data?.message ?? e?.message ?? 'Không tải được nội dung');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [episodeId, subtitle?.id]);

  // Đóng bằng Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Khoá scroll body khi modal mở
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const switchMode = (next) => {
    if (next === 'raw' && mode === 'cue') setRawText(cuesToVtt(cues));
    if (next === 'cue' && mode === 'raw') setCues(parseCues(rawText));
    setMode(next);
  };

  const handleCueTextChange = (idx, newText) => {
    setCues(prev => prev.map((c, i) => i === idx ? { ...c, text: newText } : c));
    setDirty(true); setSuccess('');
  };

  const handleRawChange = (val) => { setRawText(val); setDirty(true); setSuccess(''); };

  const handleReset = () => {
    setCues(parseCues(rawText)); setDirty(false); setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const finalVtt = mode === 'cue' ? cuesToVtt(cues) : rawText;
      const blob = new Blob([finalVtt], { type: 'text/vtt' });
      const file = new File([blob], `${subtitle.languageCode}.vtt`, { type: 'text/vtt' });
      await episodeSubtitleService.uploadSubtitle(
        episodeId, file,
        subtitle.languageCode,
        subtitle.languageName || undefined,
        subtitle.isDefault,
      );
      setDirty(false);
      setSuccess('Đã lưu thành công!');
      onSaved?.();
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Lưu thất bại');
    } finally { setSaving(false); }
  };

  if (!subtitle) return null;

  const modalContent = (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
      >
        <motion.div
          key="dialog"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 760,
            height: 'min(82vh, 680px)',
            background: T.surface,
            borderRadius: 16,
            boxShadow: '0 24px 80px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.12)',
            border: `1px solid ${T.border}`,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: FONT,
          }}
        >
          {/* ── Modal Header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px',
            background: T.accentLight,
            borderBottom: `1px solid ${T.accent}20`,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Pencil size={15} color="#fff" />
              </div>
              <div>
                <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: T.accentText, lineHeight: 1.2 }}>
                  Chỉnh sửa subtitle — {langLabel}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  {!loading && (
                    <span style={{ fontFamily: FONT, fontSize: 11, color: T.accent, opacity: 0.75 }}>
                      {cueCount} cues
                    </span>
                  )}
                  {changed > 0 && (
                    <span style={{
                      fontFamily: FONT, fontSize: 11, fontWeight: 600,
                      color: T.gold, background: T.goldLight,
                      padding: '1px 8px', borderRadius: 99,
                    }}>
                      {changed} thay đổi chưa lưu
                    </span>
                  )}
                  {subtitle.isDefault && (
                    <span style={{
                      fontFamily: FONT, fontSize: 11, fontWeight: 600,
                      color: T.accent, background: `${T.accent}18`,
                      padding: '1px 8px', borderRadius: 99,
                    }}>
                      ★ Mặc định
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Mode toggle */}
              <div style={{
                display: 'flex', background: T.surface,
                border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden',
              }}>
                {[{ key: 'cue', label: 'Theo cue' }, { key: 'raw', label: 'Raw text' }].map(m => (
                  <button
                    key={m.key}
                    onClick={() => switchMode(m.key)}
                    style={{
                      padding: '5px 12px', border: 'none', cursor: 'pointer',
                      fontFamily: FONT, fontSize: 12, fontWeight: mode === m.key ? 700 : 400,
                      background: mode === m.key ? T.accent : 'transparent',
                      color: mode === m.key ? '#fff' : T.textMuted,
                      transition: 'all 0.12s',
                    }}
                  >{m.label}</button>
                ))}
              </div>

              {/* Đóng */}
              <button
                onClick={onClose}
                title="Đóng (Esc)"
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'transparent', border: `1px solid ${T.accent}30`,
                  cursor: 'pointer', color: T.accentText,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${T.accent}15`}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* ── Content ── */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <Loader2 size={24} color={T.textMuted} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Đang tải nội dung...</p>
              </div>
            ) : error && !cues.length ? (
              <div style={{ padding: '20px', margin: '16px', borderRadius: 10, background: T.redLight, border: `1px solid rgba(220,38,38,0.2)` }}>
                <p style={{ fontFamily: FONT, fontSize: 13, color: T.red }}>{error}</p>
              </div>
            ) : mode === 'cue' ? (
              <CueEditor cues={cues} onChange={handleCueTextChange} />
            ) : (
              <RawEditor value={rawText} onChange={handleRawChange} />
            )}
          </div>

          {/* ── Footer ── */}
          {!loading && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px',
              borderTop: `1px solid ${T.border}`,
              background: T.surfaceAlt,
              flexShrink: 0,
            }}>
              {/* Status messages */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 22 }}>
                {success && (
                  <span style={{ fontFamily: FONT, fontSize: 12.5, color: T.accent, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CheckCircle2 size={13} /> {success}
                  </span>
                )}
                {error && (
                  <span style={{ fontFamily: FONT, fontSize: 12.5, color: T.red, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <AlertCircle size={13} /> {error}
                  </span>
                )}
                {!success && !error && dirty && (
                  <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted }}>
                    Có thay đổi chưa được lưu
                  </span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn onClick={onClose} variant="ghost">Đóng</Btn>
                {dirty && (
                  <Btn onClick={handleReset} icon={RotateCcw} variant="ghost">Hoàn tác</Btn>
                )}
                <Btn
                  onClick={handleSave}
                  loading={saving}
                  disabled={!dirty}
                  icon={Save}
                  variant="primary"
                >
                  Lưu thay đổi
                </Btn>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}