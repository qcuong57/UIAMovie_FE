// src/components/admin/TmdbImportTray.jsx
// Tiến trình import hiện dạng TOAST (cùng phong cách Toast.jsx): mỗi phim / show một thẻ ở góc màn hình admin,
// có thanh tiến trình riêng. Đóng panel import hay reload trang vẫn còn (job lưu trong tmdbImportStore).
// Thẻ import xong tự ẩn sau vài giây; thẻ lỗi ở lại để bấm "Thử lại".
//
// Gắn 1 lần trong layout admin (ngoài panel):   <TmdbImportTray />
// Toast thường nằm góc trên-phải, khay này mặc định góc dưới-phải nên không đè nhau.

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { Download, X, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { T, FONT_BODY as FONT } from '../../../context/adminTokens';
import { useImportJobList } from '../../../hooks/admin/useTmdbImports';
import {
  initTmdbImports, enqueueImports, dismissImport, isActive,
} from '../../../../stores/tmdbImportStore';
import { ProgressBar, TONE, formatDuration, describeResult, useNow } from './TmdbImportUi';
import { useToast } from '../common/Toast';

const HIDE_DONE_AFTER_MS = 5000;

const iconBtn = {
  flexShrink: 0, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'transparent',
  cursor: 'pointer', color: T.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
};

// Mỗi trạng thái ứng với một "variant" như Toast.jsx (icon, màu nhấn, nền icon, viền)
const VARIANTS = {
  accent: { icon: Download, accent: TONE.accent, bg: T.accentLight ?? '#EFF6FF', border: `${TONE.accent}40` },
  ok: { icon: Check, accent: TONE.ok, bg: '#F0FDF4', border: 'rgba(22,163,74,0.25)' },
  error: { icon: AlertCircle, accent: TONE.error, bg: '#FEF2F2', border: 'rgba(220,38,38,0.25)' },
};

function statusOf(job) {
  switch (job.status) {
    case 'queued':
      return { tone: 'accent', bar: 0, text: 'Đang chờ tới lượt…' };
    case 'running':
      return {
        tone: 'accent', bar: job.progress,
        text: job.step ?? (job.kind === 'tv' ? 'Đang fetch season & tập phim…' : 'Đang import…'),
      };
    case 'done':
      return { tone: 'ok', bar: 100, text: job.result ? describeResult(job.result, job.kind) : 'Import xong' };
    case 'exists':
      return { tone: 'ok', bar: 100, text: 'Đã có sẵn trong thư viện' };
    default:
      return { tone: 'error', bar: 100, text: job.error ?? 'Import thất bại' };
  }
}

// Chữ ký đổi khi job được làm lại (finishedAt đổi) → thẻ đã ẩn sẽ hiện lại
const sigOf = (job) => `${job.key}:${job.finishedAt ?? 'active'}`;

function TrayToast({ job, onHide }) {
  const active = isActive(job);
  const now = useNow(job.status === 'running');
  const { tone, bar, text } = statusOf(job);
  const variant = VARIANTS[tone];
  const Icon = variant.icon;

  // Import xong → tự ẩn như toast thường
  useEffect(() => {
    if (job.status !== 'done' && job.status !== 'exists') return undefined;
    const t = setTimeout(onHide, HIDE_DONE_AFTER_MS);
    return () => clearTimeout(t);
  }, [job.status, onHide]);

  const end = job.finishedAt ?? now;
  const seconds = job.startedAt ? Math.max(0, Math.floor((end - job.startedAt) / 1000)) : null;
  const percent = job.status === 'running' && job.progress !== null ? `${Math.round(job.progress)}%` : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      style={{
        pointerEvents: 'auto', position: 'relative', overflow: 'hidden', display: 'flex', gap: 10,
        alignItems: 'flex-start', padding: '12px 14px 14px', borderRadius: 12, background: T.surface,
        border: `1px solid ${variant.border}`, boxShadow: T.shadowLg ?? '0 8px 24px rgba(0,0,0,0.12)',
      }}
    >
      <div style={{
        flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: variant.bg, marginTop: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={14} color={variant.accent} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.text, margin: 0, lineHeight: 1.4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {job.title}
        </p>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0 0', fontFamily: FONT, fontSize: 12,
          color: tone === 'error' ? TONE.error : T.textSub,
        }}>
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
          {percent && <span style={{ flexShrink: 0, fontWeight: 700, color: TONE.accent }}>{percent}</span>}
          {seconds !== null && <span style={{ flexShrink: 0, color: T.textMuted }}>{formatDuration(seconds)}</span>}
        </div>
      </div>

      {job.status === 'failed' && (
        <button
          type="button" title="Thử lại" aria-label="Thử lại" style={iconBtn}
          onClick={() => enqueueImports([{ kind: job.kind, tmdbId: job.tmdbId, title: job.title, posterUrl: job.posterUrl }])}
        >
          <RotateCcw size={12} />
        </button>
      )}
      {job.status !== 'running' && (
        <button
          type="button" style={iconBtn}
          aria-label={active ? 'Huỷ khỏi hàng đợi' : 'Đóng'} title={active ? 'Huỷ khỏi hàng đợi' : 'Đóng'}
          onClick={() => { onHide(); if (active || job.status === 'failed') dismissImport(job.key); }}
        >
          <X size={12} />
        </button>
      )}

      {/* Thanh tiến trình thật (thay cho thanh đếm ngược của toast) */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <ProgressBar value={bar} tone={tone} height={3} />
      </div>
    </motion.div>
  );
}

export default function TmdbImportTray({ side = 'right', bottom = 20, offset = 20 }) {
  const queryClient = useQueryClient();
  const jobs = useImportJobList();

  // Job đã xong từ phiên trước (reload) thì không hiện lại thành toast
  const [hidden, setHidden] = useState(
    () => new Set(jobs.filter((j) => !isActive(j) && j.status !== 'failed').map(sigOf)),
  );
  const hide = (sig) => setHidden((prev) => new Set(prev).add(sig));

  // Gắn queryClient + tiếp tục các job dang dở từ phiên trước (reload / mở lại tab)
  useEffect(() => { initTmdbImports(queryClient); }, [queryClient]);

  // Toast "đã thêm thành công" khi một job chuyển từ đang chờ/chạy → done.
  // Lần render đầu chỉ ghi nhận trạng thái hiện có, nên job xong từ phiên trước không bắn toast.
  const toast = useToast();
  const prevStatus = useRef(null);
  useEffect(() => {
    const prev = prevStatus.current;
    if (prev) {
      for (const job of jobs) {
        if (job.status === 'done' && (prev[job.key] === 'queued' || prev[job.key] === 'running')) {
          const noun = job.kind === 'movie' ? 'phim' : 'TV show';
          toast.success(`Đã thêm ${noun} “${job.title}” vào thư viện`, 'Import thành công');
        }
      }
    }
    prevStatus.current = Object.fromEntries(jobs.map((j) => [j.key, j.status]));
  }, [jobs, toast]);

  const visible = jobs.filter((j) => !hidden.has(sigOf(j)));

  return (
    <div data-tmdb-tray="" style={{
      position: 'fixed', [side]: offset, bottom, zIndex: 250, display: 'flex', flexDirection: 'column-reverse',
      gap: 10, width: 340, maxWidth: 'calc(100vw - 40px)', maxHeight: 'calc(100vh - 120px)',
      overflowY: 'auto', overflowX: 'hidden', pointerEvents: 'none',
    }}>
      <AnimatePresence>
        {visible.map((job) => (
          <TrayToast key={job.key} job={job} onHide={() => hide(sigOf(job))} />
        ))}
      </AnimatePresence>
    </div>
  );
}