// src/components/admin/ads/AdDetailPanel.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  X, Pencil, Clock, Link, MonitorPlay, CalendarRange, Layers, ChevronRight,
  Trash2, RefreshCw, ToggleLeft, ToggleRight, Image as ImageIcon,
} from "lucide-react";
import {
  useAdDetail,
  useAdMutations,
  useAdScheduleSettings,
  isRandomSchedule,
} from "../../../hooks/useAdminAds";
import { getApiErrorMessage } from "../../../utils/apiError";
import { useToast } from "../common/Toast";
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from "../../../context/adminTokens";
import { fmtDuration } from "../../../helper/format";
import { PositionBadge, fmtClock } from "./AdTimeline";
import AdStatusBadge from "./AdStatusBadge";
import AdSlotDeleteModal from "./AdSlotDeleteModal";
import { scopeLabel, scopeCovers, PLAYABLE_TYPES } from "./adContentScopes";

// ── Utils ─────────────────────────────────────────────────────────────────────
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";

const iconBtn = (extra) => ({
  width: 30,
  height: 30,
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  ...extra,
});

// ── Sub-components ────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <div
        style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0, marginTop: 1,
          background: T.surfaceAlt, border: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Icon size={13} color={T.textMuted} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, margin: "0 0 2px" }}>
          {label}
        </p>
        <div style={{ fontFamily: FONT, fontSize: 13.5, color: T.text, fontWeight: 500 }}>{children}</div>
      </div>
    </div>
  );
}

const Muted = ({ children, ml }) => (
  <span style={{ fontSize: 12, color: T.textMuted, marginLeft: ml }}>{children}</span>
);

function ScheduleRow({ schedule, onToggle, onRequestDelete, toggling }) {
  // GlobalSlotDTO: { slotId, appliesTo, position, midRollOffsetSeconds, displayOrder, isActive }
  return (
    <div
      style={{
        padding: "11px 14px", borderRadius: 10, display: "flex", flexDirection: "column", gap: 7,
        background: schedule.isActive ? T.surface : T.surfaceAlt,
        border: `1px solid ${T.border}`,
        opacity: schedule.isActive ? 1 : 0.65,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: T.textSub }}>
            {scopeLabel(schedule.appliesTo)}
          </span>
          <ChevronRight size={11} color={T.textMuted} />
          <PositionBadge position={schedule.position} />
          {schedule.position === "MidRoll" && schedule.midRollOffsetSeconds != null && (
            <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>
              tại {fmtClock(schedule.midRollOffsetSeconds)}
            </span>
          )}
          <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted }}>
            thứ tự {schedule.displayOrder ?? 0}
          </span>
        </div>

        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => onToggle(schedule)}
            disabled={toggling}
            title={schedule.isActive ? "Tạm dừng slot" : "Kích hoạt slot"}
            style={iconBtn({
              width: 27, height: 27, borderRadius: 6,
              background: T.surfaceAlt, border: `1px solid ${T.border}`,
              cursor: toggling ? "wait" : "pointer", opacity: toggling ? 0.5 : 1,
            })}
          >
            {schedule.isActive ? <ToggleRight size={13} color={T.accent} /> : <ToggleLeft size={13} color={T.textMuted} />}
          </button>
          <button
            type="button"
            onClick={() => onRequestDelete(schedule)}
            title="Gỡ lịch phát này"
            style={iconBtn({
              width: 27, height: 27, borderRadius: 6,
              background: "#FEF2F2", border: "1px solid rgba(220,38,38,0.2)",
            })}
          >
            <Trash2 size={12} color={T.red} />
          </button>
        </div>
      </div>

      <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, margin: 0 }}>
        Slot ID: {schedule.slotId?.slice(0, 16)}…
      </p>
    </div>
  );
}

/** Kho ngẫu nhiên: quảng cáo này có thể được bốc cho loại phát nào. */
function RandomPoolNotice({ ad, schedules }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 9, background: "#EFF6FF", border: "1px solid rgba(37,99,235,0.2)", marginBottom: 10, display: "flex", flexDirection: "column", gap: 8 }}>
      <p style={{ fontFamily: FONT, fontSize: 12, color: "#1D4ED8", margin: 0, lineHeight: 1.5 }}>
        Đang ở chế độ <strong>Ngẫu nhiên</strong>: các slot chỉ cho biết quảng cáo này nằm trong kho; vị trí và thời điểm do thuật toán quyết định.
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {PLAYABLE_TYPES.map((pt) => {
          const inPool = !!ad?.isActive && schedules.some((s) => s.isActive && scopeCovers(s.appliesTo, pt));
          return (
            <span
              key={pt}
              style={{
                padding: "2px 9px", borderRadius: 14, fontFamily: FONT, fontSize: 11.5, fontWeight: 700,
                background: inPool ? "#F0FDF4" : T.surface,
                color: inPool ? "#16A34A" : T.textMuted,
                border: `1px solid ${inPool ? "rgba(22,163,74,0.25)" : T.border}`,
              }}
            >
              {inPool ? "✓" : "✗"} {scopeLabel(pt)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

const Spinner = ({ size = 22 }) => (
  <div style={{ padding: "32px 0", textAlign: "center" }}>
    <div style={{ width: size, height: size, borderRadius: "50%", margin: "0 auto", border: `2.5px solid ${T.accentLight}`, borderTopColor: T.accent, animation: "ad-spin 0.75s linear infinite" }} />
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
export default function AdDetailPanel({ ad: initialAd, onClose, onEdit, onSchedule }) {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // Dòng ở bảng hiện ngay (placeholder), chi tiết đầy đủ (kèm slot) về sau.
  const detailQ = useAdDetail(initialAd?.id, initialAd);
  const ad = detailQ.data ?? initialAd;
  const { data: settings } = useAdScheduleSettings();
  const { toggleSlot } = useAdMutations();
  const [slotToDelete, setSlotToDelete] = useState(null);

  const schedules = ad?.globalSlots ?? [];
  const isRandom = isRandomSchedule(settings);
  const togglingId = toggleSlot.isPending ? toggleSlot.variables?.slotId : null;

  useEffect(() => {
    if (detailQ.isError) {
      console.error(detailQ.error);
      toastRef.current?.error?.(getApiErrorMessage(detailQ.error, "Không tải được chi tiết quảng cáo"));
    }
  }, [detailQ.errorUpdatedAt, detailQ.isError, detailQ.error]);

  const handleToggleSlot = async (slot) => {
    try {
      await toggleSlot.mutateAsync(slot);
    } catch (e) {
      console.error(e);
      toast.error(getApiErrorMessage(e, "Không thể đổi trạng thái lịch phát"));
    }
  };

  // Modal xóa đã gọi API + làm mới cache; ở đây chỉ đóng modal và báo.
  const handleSlotDeleted = () => {
    setSlotToDelete(null);
    toast.success("Đã gỡ lịch phát");
  };

  return (
    <>
      <style>{ADMIN_GOOGLE_FONTS}</style>
      <style>{`@keyframes ad-spin { to { transform: rotate(360deg); } }`}</style>

      <motion.aside
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 100vw)", zIndex: 200,
          background: T.surface, borderLeft: `1px solid ${T.border}`, boxShadow: "-8px 0 40px rgba(0,0,0,0.08)",
          display: "flex", flexDirection: "column", fontFamily: FONT, overflowY: "auto",
        }}
      >
        {/* Header */}
        <header style={{ padding: "16px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "sticky", top: 0, background: T.surface, zIndex: 10 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 10.5, color: T.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, margin: "0 0 3px" }}>Chi tiết</p>
            <h3 style={{ fontFamily: FONT_TITLE, fontSize: 16, fontWeight: 700, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {ad?.title}
            </h3>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => detailQ.refetch()}
              disabled={detailQ.isFetching}
              title="Làm mới"
              style={iconBtn({ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.textSub, cursor: detailQ.isFetching ? "wait" : "pointer", opacity: detailQ.isFetching ? 0.5 : 1 })}
            >
              <RefreshCw size={13} style={{ animation: detailQ.isFetching ? "ad-spin 0.8s linear infinite" : "none" }} />
            </button>
            {onSchedule && (
              <button type="button" onClick={() => onSchedule(ad)} title="Lịch phát" style={iconBtn({ background: T.accentLight, border: `1px solid ${T.accent}33`, color: T.accent })}>
                <CalendarRange size={13} />
              </button>
            )}
            <button type="button" onClick={() => onEdit?.(ad)} title="Chỉnh sửa" style={iconBtn({ background: "rgba(37,99,235,0.07)", border: "1px solid rgba(37,99,235,0.2)", color: T.blue })}>
              <Pencil size={13} />
            </button>
            <button type="button" onClick={onClose} aria-label="Đóng" style={iconBtn({ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.textSub })}>
              <X size={14} />
            </button>
          </div>
        </header>

        {/* Video preview */}
        {ad?.videoUrl && (
          <div style={{ padding: "14px 18px 0", flexShrink: 0 }}>
            <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}`, background: "#000", aspectRatio: "16/7" }}>
              <video src={ad.videoUrl} controls style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }} />
            </div>
          </div>
        )}

        {/* Info */}
        <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AdStatusBadge isActive={ad?.isActive} />
            <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>
              Tạo {fmtDate(ad?.createdAt)}
              {ad?.updatedAt && ad.updatedAt !== ad.createdAt ? ` · Sửa ${fmtDate(ad.updatedAt)}` : ""}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <InfoRow icon={Clock} label="Thời lượng">
              {fmtDuration(ad?.durationSeconds)}
              <Muted ml={8}>
                {ad?.skipAfterSeconds != null ? `· skip sau ${ad.skipAfterSeconds}s` : "· không cho skip"}
              </Muted>
            </InfoRow>

            <InfoRow icon={ImageIcon} label="Ảnh nhãn hiệu">
              {ad?.brandImageUrl ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: `1px solid ${T.border}`, background: "#fff" }}>
                    <img src={ad.brandImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4, boxSizing: "border-box" }} />
                  </div>
                  <a href={ad.brandImageUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: T.textMuted, wordBreak: "break-all", lineHeight: 1.5, textDecoration: "none" }}>
                    {ad.brandImageUrl}
                  </a>
                </div>
              ) : (
                <span style={{ fontSize: 12.5, color: T.textMuted }}>Chưa có ảnh nhãn hiệu</span>
              )}
            </InfoRow>

            {ad?.clickThroughUrl && (
              <InfoRow icon={Link} label="Click-through URL">
                <a href={ad.clickThroughUrl} target="_blank" rel="noreferrer" style={{ color: T.blue, fontSize: 13, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                  {ad.clickThroughUrl}
                </a>
              </InfoRow>
            )}

            {ad?.videoUrl && (
              <InfoRow icon={MonitorPlay} label="Video URL">
                <span style={{ fontSize: 12, color: T.textMuted, wordBreak: "break-all", lineHeight: 1.5 }}>{ad.videoUrl}</span>
              </InfoRow>
            )}
          </div>
        </div>

        <div style={{ height: 1, background: T.border, margin: "0 18px", flexShrink: 0 }} />

        {/* Schedules */}
        <section style={{ padding: "16px 18px", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <Layers size={14} color={T.textSub} />
            <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.text }}>Lịch phát (Global Slots)</span>
            {schedules.length > 0 && (
              <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 99, padding: "1px 7px" }}>
                {schedules.length}
              </span>
            )}
          </div>

          {isRandom && <RandomPoolNotice ad={ad} schedules={schedules} />}

          {detailQ.isFetching && schedules.length === 0 ? (
            <Spinner />
          ) : schedules.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center" }}>
              <Layers size={24} color={T.textMuted} style={{ margin: "0 auto 8px", display: "block", opacity: 0.3 }} />
              <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted, margin: 0 }}>Chưa có lịch phát nào</p>
              {onSchedule && (
                <button
                  type="button"
                  onClick={() => onSchedule(ad)}
                  style={{ marginTop: 10, padding: "7px 14px", borderRadius: 8, background: T.accent, border: "none", cursor: "pointer", fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: "#fff", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <CalendarRange size={13} /> Gắn lịch phát
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {schedules.map((slot) => (
                <ScheduleRow
                  key={slot.slotId}
                  schedule={slot}
                  onToggle={handleToggleSlot}
                  onRequestDelete={setSlotToDelete}
                  toggling={togglingId === slot.slotId}
                />
              ))}
            </div>
          )}
        </section>
      </motion.aside>

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