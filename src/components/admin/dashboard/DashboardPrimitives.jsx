// src/components/admin/dashboard/DashboardPrimitives.jsx
import React, { useState } from "react";
import { AlertCircle, Inbox } from "lucide-react";
import { T, ACCENT, FONT_BODY as FONT } from "../../../context/adminTokens";

// ── Layout + a11y CSS ──────────────────────────────────────────────────────────
// Lưới có breakpoint thay cho gridTemplateColumns cố định (trước đây vỡ trên màn hình hẹp).
//   .dg--4 : KPI (4 → 2 → 1 cột)   .dg--2-1 / .dg--3-2 : biểu đồ chính + cột phụ   .dg--3 : ba thẻ ngang
export const DASHBOARD_LAYOUT_CSS = `
.dash-stack{display:flex;flex-direction:column;gap:16px}
.dg{display:grid;gap:16px}
.dg>*{min-width:0}
.dg--4{grid-template-columns:repeat(4,minmax(0,1fr))}
.dg--3{grid-template-columns:repeat(3,minmax(0,1fr))}
.dg--2-1{grid-template-columns:minmax(0,2fr) minmax(0,1fr)}
.dg--3-2{grid-template-columns:minmax(0,3fr) minmax(0,2fr)}
@media (max-width:1280px){.dg--3{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:1100px){.dg--4{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:900px){.dg--2-1,.dg--3-2,.dg--3{grid-template-columns:minmax(0,1fr)}}
/* < 768px: KPI / gap / padding thẻ → mobile.css (khối "ADMIN · Dashboard") */
.dash-focus:focus-visible{outline:2px solid ${ACCENT};outline-offset:2px}
.dash-scroll-x{overflow-x:auto;scrollbar-width:none}
.dash-scroll-x::-webkit-scrollbar{display:none}
@media (prefers-reduced-motion:reduce){.dash-root *{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}}
`;

// ── Skeleton ──────────────────────────────────────────────────────────────────
export const Skeleton = ({ h = 18, w = "100%", r = 8, style: sx }) => (
  <div
    aria-hidden="true"
    style={{
      height: h, width: w, borderRadius: r,
      background: "linear-gradient(90deg, #f0f0ed 25%, #e8e8e3 50%, #f0f0ed 75%)",
      backgroundSize: "400px 100%",
      animation: "shimmer 1.4s ease-in-out infinite",
      ...sx,
    }}
  />
);

/** Khung chờ cho nội dung card: giữ chiều cao gần đúng → trang không nhảy layout khi dữ liệu về. */
export const BlockSkeleton = ({ rows = 4, h = 36 }) => (
  <div role="status" aria-label="Đang tải" style={{ display: "flex", flexDirection: "column", gap: 12, padding: "6px 0" }}>
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} h={h} w={i === rows - 1 ? "70%" : "100%"} />
    ))}
  </div>
);

// ── Empty / Error ─────────────────────────────────────────────────────────────
const StateBox = ({ icon: Icon, tone, children }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 8, padding: "28px 12px", textAlign: "center",
  }}>
    <Icon size={22} color={tone} aria-hidden="true" />
    {children}
  </div>
);

export const Empty = ({ text = "Chưa có dữ liệu", hint }) => (
  <StateBox icon={Inbox} tone={T.textMuted}>
    <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textSub, margin: 0 }}>{text}</p>
    {hint && <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, margin: 0 }}>{hint}</p>}
  </StateBox>
);

export const ErrorState = ({ text = "Không tải được dữ liệu", onRetry }) => (
  <StateBox icon={AlertCircle} tone="#DC2626">
    <p role="alert" style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>{text}</p>
    {onRetry && <GhostBtn onClick={onRetry}>Thử lại</GhostBtn>}
  </StateBox>
);

// ── Buttons ───────────────────────────────────────────────────────────────────
export const GhostBtn = ({ onClick, children, active, disabled, label, style: sx }) => {
  const [hov, setHov] = useState(false);
  const hot = hov && !disabled;
  return (
    <button
      type="button"
      className="dash-focus"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active == null ? undefined : active}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        fontFamily: FONT, fontSize: 12.5, fontWeight: active ? 600 : 500,
        color: active ? "#fff" : hot ? T.text : T.textSub,
        background: active ? ACCENT : hot ? T.surfaceHov : T.surface,
        border: `1px solid ${active ? ACCENT : hot ? T.borderMed : T.border}`,
        borderRadius: 8, padding: "6px 12px",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "background .13s, border-color .13s, color .13s", whiteSpace: "nowrap",
        ...sx,
      }}
    >
      {children}
    </button>
  );
};

/** Nhóm nút chọn một giá trị (khoảng thời gian, loại nội dung) — kiểu "segmented control". */
export const Segmented = ({ options, value, onChange, label }) => (
  <div
    role="radiogroup"
    aria-label={label}
    data-dash-seg=""
    style={{
      display: "inline-flex", gap: 2, padding: 3, borderRadius: 10,
      background: T.bgSub ?? T.bg, border: `1px solid ${T.border}`,
    }}
  >
    {options.map((o) => {
      const on = o.key === value;
      return (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={on}
          className="dash-focus"
          onClick={() => onChange(o.key)}
          style={{
            fontFamily: FONT, fontSize: 12.5, fontWeight: on ? 600 : 500,
            color: on ? T.text : T.textMuted,
            background: on ? T.surface : "transparent",
            boxShadow: on ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
            border: "none", borderRadius: 7, padding: "5px 12px",
            cursor: "pointer", transition: "background .13s, color .13s", whiteSpace: "nowrap",
          }}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);