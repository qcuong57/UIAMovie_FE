// src/components/admin/ads/AdDetailPanel.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X, Pencil, Clock, Link, Play, MonitorPlay,
  CalendarRange, Layers, ChevronRight, Trash2,
  RefreshCw, ToggleLeft, ToggleRight,
} from 'lucide-react';
import adService from '../../../services/adService';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../../context/adminTokens';

// ── Utils ─────────────────────────────────────────────────────────────────────
const fmtDuration = (s) => {
  if (!s) return '—';
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const POSITION_LABEL = {
  PreRoll:  { label: 'Pre-Roll',  color: '#2563EB', bg: '#EFF6FF', border: 'rgba(37,99,235,0.2)'  },
  MidRoll:  { label: 'Mid-Roll',  color: '#D97706', bg: '#FFFBEB', border: 'rgba(217,119,6,0.2)'  },
  PostRoll: { label: 'Post-Roll', color: '#7C3AED', bg: '#F5F3FF', border: 'rgba(124,58,237,0.2)' },
};

const CONTENT_TYPE_LABEL = { Movie: 'Phim', TvShow: 'TV Show', Episode: 'Tập phim' };

// ── Sub-components ────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: T.surfaceAlt, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <Icon size={13} color={T.textMuted} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 2 }}>{label}</p>
        <div style={{ fontFamily: FONT, fontSize: 13.5, color: T.text, fontWeight: 500 }}>{children}</div>
      </div>
    </div>
  );
}

function PositionBadge({ position }) {
  const cfg = POSITION_LABEL[position] ?? { label: position, color: T.textSub, bg: T.surfaceAlt, border: T.border };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 6,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      fontFamily: FONT, fontSize: 11, fontWeight: 700, color: cfg.color,
    }}>{cfg.label}</span>
  );
}

function StatusBadge({ isActive }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 20,
      background: isActive ? '#F0FDF4' : T.surfaceAlt,
      border: `1px solid ${isActive ? 'rgba(22,163,74,0.25)' : T.border}`,
      fontFamily: FONT, fontSize: 11.5, fontWeight: 700,
      color: isActive ? '#16A34A' : T.textMuted,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#16A34A' : T.textMuted }} />
      {isActive ? 'Đang chạy' : 'Tạm dừng'}
    </span>
  );
}

// ── Schedule row ──────────────────────────────────────────────────────────────
function ScheduleRow({ schedule, onToggle, onDelete, toggling, deleting }) {
  const [confirmDel, setConfirmDel] = useState(false);

  // GlobalSlotDTO: { slotId, appliesTo, position, midRollOffsetSeconds, displayOrder, isActive }
  const scopeLabel = schedule.appliesTo
    ? (CONTENT_TYPE_LABEL[schedule.appliesTo] ?? schedule.appliesTo)
    : 'Tất cả nội dung';

  return (
    <div style={{
      padding: '11px 14px', borderRadius: 10,
      background: schedule.isActive ? T.surface : T.surfaceAlt,
      border: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', gap: 7,
      opacity: schedule.isActive ? 1 : 0.65,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: T.textSub }}>
            {scopeLabel}
          </span>
          <ChevronRight size={11} color={T.textMuted} />
          <PositionBadge position={schedule.position} />
          {schedule.position === 'MidRoll' && schedule.midRollOffsetSeconds != null && (
            <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>@ {fmtDuration(schedule.midRollOffsetSeconds)}</span>
          )}
          {schedule.displayOrder > 0 && (
            <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted }}>#{schedule.displayOrder}</span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {/* Toggle active */}
          <button
            onClick={() => onToggle(schedule)}
            disabled={toggling}
            title={schedule.isActive ? 'Tạm dừng slot' : 'Kích hoạt slot'}
            style={{ width: 27, height: 27, borderRadius: 6, background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: toggling ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: toggling ? 0.5 : 1 }}
          >
            {schedule.isActive
              ? <ToggleRight size={13} color={T.accent} />
              : <ToggleLeft  size={13} color={T.textMuted} />
            }
          </button>

          {/* Delete */}
          {!confirmDel ? (
            <button onClick={() => setConfirmDel(true)}
              title="Gỡ slot này"
              style={{ width: 27, height: 27, borderRadius: 6, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={12} color={T.red} />
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 3 }}>
              <button onClick={() => { onDelete(schedule); setConfirmDel(false); }} disabled={deleting}
                style={{ padding: '3px 8px', borderRadius: 6, background: T.red, border: 'none', cursor: deleting ? 'wait' : 'pointer', fontFamily: FONT, fontSize: 11, fontWeight: 700, color: '#fff', opacity: deleting ? 0.6 : 1 }}>
                {deleting ? '…' : 'Xóa'}
              </button>
              <button onClick={() => setConfirmDel(false)}
                style={{ padding: '3px 8px', borderRadius: 6, background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: FONT, fontSize: 11, fontWeight: 600, color: T.textSub }}>
                Hủy
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Slot ID */}
      <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, margin: 0 }}>
        Slot ID: {schedule.slotId?.slice(0, 16)}…
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function AdDetailPanel({ ad: initialAd, onClose, onEdit }) {
  const [ad,          setAd]          = useState(initialAd);
  const [loading,     setLoading]     = useState(false);
  const [togglingId,  setTogglingId]  = useState(null);
  const [deletingId,  setDeletingId]  = useState(null);

  // Refresh chi tiết đầy đủ (kèm schedules)
  const loadDetail = async () => {
    if (!ad?.id) return;
    setLoading(true);
    try {
      const res = await adService.getAdById(ad.id);
      const detail = res?.data ?? res;
      if (detail) setAd(detail);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAd?.id]);

  const handleToggleSchedule = async (slot) => {
    setTogglingId(slot.slotId);
    try {
      await adService.updateGlobalSlot(slot.slotId, { isActive: !slot.isActive });
      setAd(prev => ({
        ...prev,
        globalSlots: prev.globalSlots.map(s =>
          s.slotId === slot.slotId ? { ...s, isActive: !s.isActive } : s
        ),
      }));
    } catch (e) { console.error(e); }
    finally { setTogglingId(null); }
  };

  const handleDeleteSchedule = async (slot) => {
    setDeletingId(slot.slotId);
    try {
      await adService.deleteGlobalSlot(slot.slotId);
      setAd(prev => ({
        ...prev,
        globalSlots: prev.globalSlots.filter(s => s.slotId !== slot.slotId),
      }));
    } catch (e) { console.error(e); }
    finally { setDeletingId(null); }
  };

  const schedules = ad?.globalSlots ?? [];

  return (
    <>
      <style>{ADMIN_GOOGLE_FONTS}</style>

      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0,      opacity: 1 }}
        exit={{   x: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 420, zIndex: 200,
          background: T.surface, borderLeft: `1px solid ${T.border}`,
          boxShadow: '-8px 0 40px rgba(0,0,0,0.08)',
          display: 'flex', flexDirection: 'column', fontFamily: FONT,
          overflowY: 'auto',
        }}
      >
        {/* ── Header ── */}
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, background: T.surface, zIndex: 10 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 10.5, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 3 }}>Chi tiết</p>
            <h3 style={{ fontFamily: FONT_TITLE, fontSize: 16, fontWeight: 700, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ad?.title}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={loadDetail} disabled={loading}
              title="Làm mới"
              style={{ width: 30, height: 30, borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub, opacity: loading ? 0.5 : 1 }}>
              <RefreshCw size={13} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
            </button>
            <button onClick={() => onEdit?.(ad)}
              title="Chỉnh sửa"
              style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.blue }}>
              <Pencil size={13} />
            </button>
            <button onClick={onClose}
              style={{ width: 30, height: 30, borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Video preview ── */}
        {ad?.videoUrl && (
          <div style={{ padding: '14px 18px 0', flexShrink: 0 }}>
            <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.border}`, background: '#000', aspectRatio: '16/7' }}>
              <video
                src={ad.videoUrl}
                controls
                style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
              />
            </div>
          </div>
        )}

        {/* ── Info ── */}
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge isActive={ad?.isActive} />
            <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>
              Tạo {fmtDate(ad?.createdAt)}
              {ad?.updatedAt && ad.updatedAt !== ad.createdAt
                ? ` · Sửa ${fmtDate(ad.updatedAt)}`
                : ''}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <InfoRow icon={Clock} label="Thời lượng">
              {fmtDuration(ad?.durationSeconds)}
              {ad?.skipAfterSeconds != null
                ? <span style={{ fontSize: 12, color: T.textMuted, marginLeft: 8 }}>· skip sau {ad.skipAfterSeconds}s</span>
                : <span style={{ fontSize: 12, color: T.textMuted, marginLeft: 8 }}>· không cho skip</span>
              }
            </InfoRow>

            {ad?.clickThroughUrl && (
              <InfoRow icon={Link} label="Click-through URL">
                <a href={ad.clickThroughUrl} target="_blank" rel="noreferrer"
                  style={{ color: T.blue, fontSize: 13, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '100%' }}>
                  {ad.clickThroughUrl}
                </a>
              </InfoRow>
            )}

            {ad?.videoUrl && (
              <InfoRow icon={MonitorPlay} label="Video URL">
                <span style={{ fontSize: 12, color: T.textMuted, wordBreak: 'break-all', lineHeight: 1.5 }}>
                  {ad.videoUrl}
                </span>
              </InfoRow>
            )}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: T.border, margin: '0 18px', flexShrink: 0 }} />

        {/* ── Schedules ── */}
        <div style={{ padding: '16px 18px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Layers size={14} color={T.textSub} />
              <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.text }}>
                Global Slots
              </span>
              {schedules.length > 0 && (
                <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 99, padding: '1px 7px' }}>
                  {schedules.length}
                </span>
              )}
            </div>
          </div>

          {loading && schedules.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2.5px solid ${T.accentLight}`, borderTopColor: T.accent, animation: 'spin 0.75s linear infinite', margin: '0 auto' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : schedules.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <Layers size={24} color={T.textMuted} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
              <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Chưa có global slot nào</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {schedules.map(slot => (
                <ScheduleRow
                  key={slot.slotId}
                  schedule={slot}
                  onToggle={handleToggleSchedule}
                  onDelete={handleDeleteSchedule}
                  toggling={togglingId === slot.slotId}
                  deleting={deletingId === slot.slotId}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}