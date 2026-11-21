import React from "react";
import {
  Shield,
  Ban,
  Crown,
  CalendarClock,
} from "lucide-react";
import { T, FONT_BODY as FONT } from "../../../context/adminTokens";

export const RoleBadge = ({ role }) => {
  const isAdmin = role?.toLowerCase() === "admin";
  return (
    <span
      style={{
        fontFamily: FONT,
        fontSize: 11.5,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 99,
        background: isAdmin ? T.accentLight : T.bg,
        border: `1px solid ${isAdmin ? `${T.accent}30` : T.border}`,
        color: isAdmin ? T.accentText : T.textSub,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {isAdmin && <Shield size={10} strokeWidth={2} />}
      {isAdmin ? "Admin" : "User"}
    </span>
  );
};

const SUB_META = {
  monthly_premium: {
    label: "Premium · Tháng",
    bg: "#FFFBEB",
    border: "rgba(217,119,6,0.35)",
    color: "#92400E",
  },
  yearly_premium: {
    label: "Premium · Năm",
    bg: "#FEF3C7",
    border: "rgba(245,158,11,0.4)",
    color: "#78350F",
  },
  Premium: {
    label: "Premium",
    bg: "#FFFBEB",
    border: "rgba(217,119,6,0.35)",
    color: "#92400E",
  },
};

export const SubBadge = ({ sub, expiredAt }) => {
  if (!sub)
    return (
      <span style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>
        —
      </span>
    );
  const meta = SUB_META[sub] ?? {
    label: sub,
    bg: "#FEF9C3",
    border: "rgba(253,224,71,0.5)",
    color: "#854D0E",
  };
  const expired = expiredAt ? new Date(expiredAt) < new Date() : false;
  const dateStr = expiredAt
    ? new Date(expiredAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span
        style={{
          fontFamily: FONT,
          fontSize: 11.5,
          fontWeight: 600,
          padding: "3px 10px",
          borderRadius: 99,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: expired ? "#F3F4F6" : meta.bg,
          border: `1px solid ${expired ? "rgba(156,163,175,0.4)" : meta.border}`,
          color: expired ? "#9CA3AF" : meta.color,
        }}
      >
        <Crown size={9} strokeWidth={2.5} />
        {meta.label}
        {expired && " · Hết hạn"}
      </span>
      {dateStr && (
        <span
          style={{
            fontFamily: FONT,
            fontSize: 10.5,
            color: expired ? "#DC2626" : T.textMuted,
            paddingLeft: 4,
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <CalendarClock size={9} />
          {expired ? `Đã hết ${dateStr}` : `Đến ${dateStr}`}
        </span>
      )}
    </div>
  );
};

export const BannedBadge = () => (
  <span
    style={{
      fontFamily: FONT,
      fontSize: 10.5,
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: 99,
      background: "#FEF2F2",
      border: "1px solid rgba(220,38,38,0.25)",
      color: "#DC2626",
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
    }}
  >
    <Ban size={9} strokeWidth={2.5} /> Đã khóa
  </span>
);
