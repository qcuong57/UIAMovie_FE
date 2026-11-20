// src/components/admin/TmdbImportUi.jsx
// Các mảnh UI dùng chung cho import TMDB: spinner, thanh tiến trình, tiến trình 1 job,
// thông báo, huy hiệu kết quả. (Panel, thẻ kết quả và khay tiến trình đều dùng lại.)

import React, { useSyncExternalStore } from 'react';
import { Users, Image as ImageIcon, Layers, PlayCircle, AlertCircle, Clock } from 'lucide-react';
import { T, FONT_BODY as FONT } from '../../../context/adminTokens';

// ── Màu & keyframes (chèn 1 lần, thay vì mỗi lần render một thẻ <style>) ──────
export const TONE = {
  accent: T.accent,
  ok: '#16A34A',
  warn: '#D97706',
  error: T.red ?? '#DC2626',
};

if (typeof document !== 'undefined' && !document.getElementById('tmdb-import-keyframes')) {
  const style = document.createElement('style');
  style.id = 'tmdb-import-keyframes';
  style.textContent = `
    @keyframes _spin  { to { transform: rotate(360deg); } }
    @keyframes _indet { 0% { left: -40%; } 100% { left: 100%; } }`;
  document.head.appendChild(style);
}

export const Spin = ({ color = T.accent, size = 20 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    border: `2px solid ${color}30`, borderTopColor: color, animation: '_spin 0.65s linear infinite',
  }} />
);

// ── Thời gian ────────────────────────────────────────────────────────────────
// Một interval dùng chung cho mọi thanh tiến trình (thay vì mỗi thẻ một interval); tự tắt khi không ai nghe.
let tickNow = Date.now();
let tickTimer = null;
const tickListeners = new Set();

const subscribeTick = (fn) => {
  if (tickListeners.size === 0) {
    tickNow = Date.now();
    tickTimer = setInterval(() => { tickNow = Date.now(); tickListeners.forEach((l) => l()); }, 1000);
  }
  tickListeners.add(fn);
  return () => {
    tickListeners.delete(fn);
    if (tickListeners.size === 0) { clearInterval(tickTimer); tickTimer = null; }
  };
};
const subscribeIdle = () => () => {};
const getTick = () => tickNow;

/** Đồng hồ cập nhật mỗi giây khi `active`. */
export const useNow = (active) => useSyncExternalStore(active ? subscribeTick : subscribeIdle, getTick);

export const formatDuration = (sec) =>
  sec >= 60 ? `${Math.floor(sec / 60)}p${String(sec % 60).padStart(2, '0')}s` : `${sec}s`;

// ── Thanh tiến trình: value = 0–100, hoặc null → không xác định ───────────────
export const ProgressBar = ({ value = null, tone = 'accent', height = 4 }) => {
  const color = TONE[tone];
  const indeterminate = value === null;
  return (
    <div
      role="progressbar" aria-valuemin={0} aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(value)}
      style={{ position: 'relative', height, borderRadius: height, background: `${color}22`, overflow: 'hidden' }}
    >
      {indeterminate ? (
        <div style={{
          position: 'absolute', top: 0, bottom: 0, width: '40%', borderRadius: height,
          background: color, animation: '_indet 1.1s ease-in-out infinite',
        }} />
      ) : (
        <div style={{ width: `${value}%`, height: '100%', background: color, transition: 'width 0.3s ease' }} />
      )}
    </div>
  );
};

// ── Tiến trình 1 job đang chờ / đang chạy ────────────────────────────────────
const SLOW_AFTER_SEC = { movie: 25, tv: 60 };

export function JobProgress({ job }) {
  const running = job.status === 'running';
  const now = useNow(running);
  const seconds = running ? Math.max(0, Math.floor((now - (job.startedAt ?? now)) / 1000)) : 0;
  const slow = running && seconds >= SLOW_AFTER_SEC[job.kind];

  const label = !running
    ? 'Đang chờ tới lượt…'
    : job.step
      ?? (job.kind === 'tv' ? 'Đang fetch season & tập phim…' : 'Đang import…');

  return (
    <div style={{ marginTop: 8 }}>
      <ProgressBar value={running ? job.progress : 0} tone={slow ? 'warn' : 'accent'} />
      <div style={{
        marginTop: 5, display: 'flex', alignItems: 'center', gap: 5,
        fontFamily: FONT, fontSize: 10.5, color: slow ? TONE.warn : T.textMuted,
      }}>
        <Clock size={10} />
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
          {slow && ' — lâu hơn bình thường nhưng vẫn đang chạy, bạn có thể đóng panel'}
        </span>
        {running && (
          <span style={{ flexShrink: 0 }}>
            {job.progress !== null && `${Math.round(job.progress)}% · `}{formatDuration(seconds)}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Thông báo (ok / warn / error) ────────────────────────────────────────────
const NOTICE_BG = { ok: '#F0FDF4', warn: '#FEFCE8', error: '#FEF2F2' };

export const Notice = ({ tone = 'warn', children, style }) => (
  <div style={{
    padding: '7px 12px', background: NOTICE_BG[tone], color: TONE[tone],
    fontFamily: FONT, fontSize: 11.5, lineHeight: 1.5, ...style,
  }}>
    {children}
  </div>
);

// ── Kết quả import (cast, ảnh, season, tập…) ─────────────────────────────────
export function summarizeResult(result, kind) {
  const count = (icon, label, v) => ({ icon, label, value: v ?? 0, ok: (v ?? 0) > 0 });
  const director = { icon: Users, label: 'Đạo diễn', value: result.hasDirector ? '✓' : '–', ok: !!result.hasDirector };
  const common = [count(Users, 'Diễn viên', result.castCount), count(ImageIcon, 'Hình ảnh', result.imageCount)];

  return kind === 'movie'
    ? [...common, { icon: PlayCircle, label: 'Trailer', value: result.trailerCount ?? (result.hasTrailer ? 1 : 0), ok: true }, director]
    : [...common, count(Layers, 'Season', result.seasonCount), count(PlayCircle, 'Tập phim', result.episodeCount), director];
}

export const describeResult = (result, kind) =>
  summarizeResult(result, kind).map((i) => `${i.label} ${i.value}`).join(' · ');

export function ResultBadges({ result, kind }) {
  if (!result) return null;
  const items = summarizeResult(result, kind);
  const hasWarning = items.some((i) => !i.ok);
  const tone = hasWarning ? TONE.warn : TONE.ok;

  return (
    <div style={{
      padding: '8px 12px', borderTop: `1px solid ${T.border}`,
      background: hasWarning ? NOTICE_BG.warn : NOTICE_BG.ok,
    }}>
      <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: tone, margin: '0 0 6px' }}>
        ✓ Import thành công {hasWarning ? '(một số dữ liệu thiếu — xem bên dưới)' : '— đầy đủ dữ liệu'}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map(({ icon: Icon, label, value, ok }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5,
            background: ok ? (T.accentLight ?? '#DCFCE7') : '#FEF9C3',
            border: `1px solid ${ok ? `${T.accent}30` : '#FDE68A'}`,
            color: ok ? TONE.ok : TONE.warn,
          }}>
            <Icon size={10} />
            <span style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 600 }}>{label}: {value}</span>
            {!ok && <AlertCircle size={9} />}
          </div>
        ))}
      </div>
      {hasWarning && (
        <p style={{ fontFamily: FONT, fontSize: 10.5, color: TONE.warn, margin: '6px 0 0', lineHeight: 1.5 }}>
          ⚠️ Dữ liệu = 0 có thể do TMDB chưa có thông tin này. Có thể bổ sung sau bằng cách import lại.
        </p>
      )}
    </div>
  );
}

// ── Tiện ích nhỏ cho item TMDB ───────────────────────────────────────────────
export const getItemTitle = (item, isMovie) => (isMovie ? item.title : (item.name ?? item.title));

export const toImportItem = (item, isMovie) => ({
  kind: isMovie ? 'movie' : 'tv',
  tmdbId: item.id,
  title: getItemTitle(item, isMovie),
  posterUrl: item.posterUrl ?? null,
});