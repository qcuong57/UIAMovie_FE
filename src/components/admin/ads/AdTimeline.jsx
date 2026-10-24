// src/components/admin/ads/AdTimeline.jsx
// Trục thời gian dùng chung: hiển thị pre-roll (đầu) / mid-roll (theo offset) / post-roll (cuối)
// + danh sách theo thứ tự phát. Không chứa số liệu cố định nào: mọi thứ lấy từ props.
//
// items: [{ key, position: 'PreRoll'|'MidRoll'|'PostRoll', offset?: number(giây), title, durationSeconds?, muted? }]
import React from 'react';
import { T, FONT_BODY as FONT, AD_POSITIONS } from '../../../context/adminTokens';

export const fmtClock = (sec = 0) => {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
};

/** Chuyển ContentAdsDTO (API player / preview) → items của timeline. */
export const fromContentAds = (ads) => [
  ...(ads?.preRoll ?? []).map((a) => ({ key: a.slotId, position: 'PreRoll', offset: 0, title: a.title, durationSeconds: a.durationSeconds })),
  ...(ads?.midRoll ?? []).map((a) => ({ key: a.slotId, position: 'MidRoll', offset: a.midRollOffsetSeconds ?? 0, title: a.title, durationSeconds: a.durationSeconds })),
  ...(ads?.postRoll ?? []).map((a) => ({ key: a.slotId, position: 'PostRoll', offset: null, title: a.title, durationSeconds: a.durationSeconds })),
];

const meta = (pos) => AD_POSITIONS.find((p) => p.value === pos) ?? {};
const colorOf = (pos) => meta(pos).color ?? T.accent;

export function PositionBadge({ position }) {
  const m = meta(position);
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 6, flexShrink: 0,
      background: m.bg ?? T.surfaceAlt, border: `1px solid ${m.border ?? T.border}`,
      fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: m.color ?? T.textSub,
    }}>
      {m.label ?? position}
    </span>
  );
}

export default function AdTimeline({ items = [], durationSeconds = 0, emptyText = 'Chưa có lịch nào' }) {
  const total = Math.max(Number(durationSeconds) || 0, 1);
  const rank = (it) => (it.position === 'PreRoll' ? -1 : it.position === 'PostRoll' ? total + 1 : it.offset ?? 0);
  const sorted = [...items].sort((a, b) => rank(a) - rank(b));

  const pre = sorted.filter((i) => i.position === 'PreRoll' && !i.muted);
  const post = sorted.filter((i) => i.position === 'PostRoll' && !i.muted);
  const mids = sorted.filter((i) => i.position === 'MidRoll' && !i.muted);

  // Marker: pre / post gộp 1 chấm có số lượng; mid mỗi ad một chấm
  const markers = [
    pre.length && { key: 'pre', pos: 'PreRoll', pct: 0, count: pre.length },
    ...mids.map((m) => ({ key: m.key, pos: 'MidRoll', pct: Math.min(100, ((m.offset ?? 0) / total) * 100), count: 1, over: (m.offset ?? 0) > total })),
    post.length && { key: 'post', pos: 'PostRoll', pct: 100, count: post.length },
  ].filter(Boolean);

  if (!items.length) {
    return <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.textMuted, margin: 0, padding: '14px 0', textAlign: 'center' }}>{emptyText}</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Trục */}
      <div style={{ position: 'relative', height: 34, margin: '4px 12px 0' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 14, height: 6, borderRadius: 3, background: T.surfaceAlt, border: `1px solid ${T.border}` }} />
        {markers.map((m) => (
          <div
            key={m.key}
            title={`${meta(m.pos).label ?? m.pos}${m.count > 1 ? ` ×${m.count}` : ''}`}
            style={{
              position: 'absolute', left: `${m.pct}%`, top: 8, transform: 'translateX(-50%)',
              minWidth: 18, height: 18, padding: '0 4px', boxSizing: 'border-box', borderRadius: 9,
              background: m.over ? T.textMuted : colorOf(m.pos), border: `2px solid ${T.surface}`,
              boxShadow: '0 0 0 1px rgba(0,0,0,0.08)', color: '#fff',
              fontFamily: FONT, fontSize: 10, fontWeight: 700, lineHeight: '14px', textAlign: 'center',
            }}
          >
            {m.count > 1 ? m.count : ''}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '-6px 4px 0', fontFamily: FONT, fontSize: 10.5, color: T.textMuted }}>
        <span>0:00</span>
        <span>{fmtClock(total)}</span>
      </div>

      {/* Danh sách theo thứ tự phát */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map((it, idx) => {
          const when =
            it.position === 'PreRoll' ? 'Đầu video'
              : it.position === 'PostRoll' ? 'Cuối video'
                : `${fmtClock(it.offset)} · ${Math.round(((it.offset ?? 0) / total) * 100)}%`;
          const over = it.position === 'MidRoll' && (it.offset ?? 0) > total;
          return (
            <div key={`${it.key}-${idx}`} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8,
              background: T.surfaceAlt, border: `1px solid ${T.border}`, opacity: it.muted || over ? 0.5 : 1,
            }}>
              <PositionBadge position={it.position} />
              <span style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 700, color: T.text, minWidth: 92 }}>{when}</span>
              <span style={{ fontFamily: FONT, fontSize: 12.5, color: T.textSub, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {it.title}
              </span>
              {it.durationSeconds != null && (
                <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, flexShrink: 0 }}>{it.durationSeconds}s</span>
              )}
              {over && <span style={{ fontFamily: FONT, fontSize: 11, color: T.red, flexShrink: 0 }}>vượt thời lượng</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}