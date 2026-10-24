// src/components/admin/ads/AdDetailPanel.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X, Pencil, Clock, Link, Play, MonitorPlay,
  CalendarRange, Layers, ChevronRight, Trash2,
  RefreshCw, ToggleLeft, ToggleRight, Image as ImageIcon,
} from 'lucide-react';
import adService from '../../../services/adService';
import { useToast } from '../common/Toast';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../../context/adminTokens';
import { PositionBadge, fmtClock } from './AdTimeline';
import AdSlotDeleteModal from './AdSlotDeleteModal';
import { scopeLabel, scopeCovers, PLAYABLE_TYPES } from './adContentScopes';

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
function ScheduleRow({ schedule, onToggle, onRequestDelete, toggling }) {
  // GlobalSlotDTO: { slotId, appliesTo, position, midRollOffsetSeconds, displayOrder, isActive }

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
            {scopeLabel(schedule.appliesTo)}
          </span>
          <ChevronRight size={11} color={T.textMuted} />
          <PositionBadge position={schedule.position} />
          {schedule.position === 'MidRoll' && schedule.midRollOffsetSeconds != null && (
            <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>tại {fmtClock(schedule.midRollOffsetSeconds)}</span>
          )}
          <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted }}>thứ tự {schedule.displayOrder ?? 0}</span>
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

          {/* Delete → mở modal xác nhận (giống AdScheduleModal) */}
          <button onClick={() => onRequestDelete(schedule)}
            title="Gỡ lịch phát này"
            style={{ width: 27, height: 27, borderRadius: 6, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={12} color={T.red} />
          </button>
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
export default function AdDetailPanel({ ad: initialAd, onClose, onEdit, onSchedule, onScheduleChanged }) {
  const [ad,          setAd]          = useState(initialAd);
  const [loading,     setLoading]     = useState(false);
  const [togglingId,  setTogglingId]  = useState(null);
  const [slotToDelete, setSlotToDelete] = useState(null);
  const [settings,     setSettings]     = useState(null); // Fixed | Random
  const toast = useToast();

  // Refresh chi tiết đầy đủ (kèm schedules)
  const loadDetail = async () => {
    if (!ad?.id) return;
    setLoading(true);
    try {
      const res = await adService.getAdById(ad.id);
      const detail = res?.data ?? res;
      if (detail) setAd(detail);
    } catch (e) {
      console.error(e);
      toast.error('Không tải được chi tiết quảng cáo');
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadDetail();
    adService.getScheduleSettings().then(setSettings).catch(() => setSettings(null));
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
      onScheduleChanged?.();
    } catch (e) {
      console.error(e);
      toast.error('Không thể đổi trạng thái lịch phát');
    }
    finally { setTogglingId(null); }
  };

  // Modal xóa đã gọi API; ở đây chỉ cập nhật danh sách
  const handleSlotDeleted = (slotId) => {
    setAd(prev => ({ ...prev, globalSlots: (prev.globalSlots ?? []).filter(s => s.slotId !== slotId) }));
    setSlotToDelete(null);
    toast.success('Đã gỡ lịch phát');
    onScheduleChanged?.();
  };

  const schedules = ad?.globalSlots ?? [];
  const isRandom = settings?.mode === 1 || settings?.mode === 'Random';

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
            {onSchedule && (
              <button onClick={() => onSchedule(ad)}
                title="Lịch phát"
                style={{ width: 30, height: 30, borderRadius: 8, background: T.accentLight, border: `1px solid ${T.accent}33`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent }}>
                <CalendarRange size={13} />
              </button>
            )}
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

            {ad?.brandImageUrl ? (
              <InfoRow icon={ImageIcon} label="Ảnh nhãn hiệu">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: `1px solid ${T.border}`, background: '#fff' }}>
                    <img src={ad.brandImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4, boxSizing: 'border-box' }} />
                  </div>
                  <a href={ad.brandImageUrl} target="_blank" rel="noreferrer"
                    style={{ fontSize: 12, color: T.textMuted, wordBreak: 'break-all', lineHeight: 1.5, textDecoration: 'none' }}>
                    {ad.brandImageUrl}
                  </a>
                </div>
              </InfoRow>
            ) : (
              <InfoRow icon={ImageIcon} label="Ảnh nhãn hiệu">
                <span style={{ fontSize: 12.5, color: T.textMuted }}>Chưa có ảnh nhãn hiệu</span>
              </InfoRow>
            )}

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
                Lịch phát (Global Slots)
              </span>
              {schedules.length > 0 && (
                <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 99, padding: '1px 7px' }}>
                  {schedules.length}
                </span>
              )}
            </div>
          </div>

          {isRandom && (
            <div style={{ padding: '10px 12px', borderRadius: 9, background: '#EFF6FF', border: '1px solid rgba(37,99,235,0.2)', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontFamily: FONT, fontSize: 12, color: '#1D4ED8', margin: 0, lineHeight: 1.5 }}>
                Đang ở chế độ <strong>Ngẫu nhiên</strong>: các slot chỉ cho biết quảng cáo này nằm trong kho; vị trí và thời điểm do thuật toán quyết định.
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PLAYABLE_TYPES.map(pt => {
                  const inPool = !!ad?.isActive && schedules.some(s => s.isActive && scopeCovers(s.appliesTo, pt));
                  return (
                    <span key={pt} style={{
                      padding: '2px 9px', borderRadius: 14, fontFamily: FONT, fontSize: 11.5, fontWeight: 700,
                      background: inPool ? '#F0FDF4' : T.surface, color: inPool ? '#16A34A' : T.textMuted,
                      border: `1px solid ${inPool ? 'rgba(22,163,74,0.25)' : T.border}`,
                    }}>
                      {inPool ? '✓' : '✗'} {scopeLabel(pt)}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {loading && schedules.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2.5px solid ${T.accentLight}`, borderTopColor: T.accent, animation: 'spin 0.75s linear infinite', margin: '0 auto' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : schedules.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <Layers size={24} color={T.textMuted} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
              <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Chưa có lịch phát nào</p>
              {onSchedule && (
                <button onClick={() => onSchedule(ad)}
                  style={{ marginTop: 10, padding: '7px 14px', borderRadius: 8, background: T.accent, border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <CalendarRange size={13} /> Gắn lịch phát
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {schedules.map(slot => (
                <ScheduleRow
                  key={slot.slotId}
                  schedule={slot}
                  onToggle={handleToggleSchedule}
                  onRequestDelete={setSlotToDelete}
                  toggling={togglingId === slot.slotId}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <AdSlotDeleteModal
        slot={slotToDelete}
        adTitle={ad?.title}
        isLastSlot={schedules.length === 1}
        onClose={() => setSlotToDelete(null)}
        onDeleted={handleSlotDeleted}
      />
    </>
  );
}