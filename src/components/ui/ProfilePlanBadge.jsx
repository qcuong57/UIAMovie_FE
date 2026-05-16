// src/components/ui/ProfilePlanBadge.jsx
//
// Hiển thị gói đăng ký hiện tại của người dùng trong trang Profile.
//
// Props:
//   user — object từ authService.getCurrentUser() hoặc API profile
//         Expected fields:
//           user.subscriptionPlan  — "free" | "premium"  (hoặc user.isPremium: boolean)
//           user.premiumStartDate  — ISO string, ngày bắt đầu gói premium
//           user.premiumEndDate    — ISO string, ngày kết thúc gói premium
//
// Usage:
//   import ProfilePlanBadge from "../ui/ProfilePlanBadge";
//   <ProfilePlanBadge user={currentUser} onUpgrade={() => navigate("/premium")} />

import React from "react";
import { motion } from "framer-motion";
import { Crown, Zap, CalendarDays, Clock } from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (iso) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

const daysLeft = (endIso) => {
  if (!endIso) return null;
  const diff = new Date(endIso) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// ─────────────────────────────────────────────────────────────────────────────
const ProfilePlanBadge = ({ user = {}, onUpgrade }) => {
  const isPremium =
    user?.subscriptionPlan === "premium" || !!user?.isPremium;

  const startDate = user?.premiumStartDate ?? user?.subscriptionStartDate ?? null;
  const endDate   = user?.premiumEndDate   ?? user?.subscriptionEndDate   ?? null;
  const remaining = daysLeft(endDate);

  // ── Màu sắc theo plan ──────────────────────────────────────────────────────
  const gold  = "#facc15";
  const goldD = "#b45309";

  // ── Premium badge ──────────────────────────────────────────────────────────
  if (isPremium) {
    const isExpiringSoon = remaining !== null && remaining <= 7;

    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          borderRadius: 16,
          background: "linear-gradient(135deg, rgba(234,179,8,0.12) 0%, rgba(180,83,9,0.10) 100%)",
          border: `1px solid rgba(234,179,8,0.28)`,
          padding: "18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #facc15 0%, #f59e0b 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 0 14px rgba(250,204,21,0.35)",
            }}
          >
            <Crown size={18} color="#1c1400" />
          </div>
          <div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 800,
                fontSize: 15,
                color: gold,
                lineHeight: 1.2,
              }}
            >
              Gói Premium
            </div>
            <div style={{ fontSize: 12, color: "rgba(250,204,21,0.55)", fontFamily: "'DM Sans', sans-serif" }}>
              Đang hoạt động
            </div>
          </div>

          {/* Expiring soon warning */}
          {isExpiringSoon && (
            <div
              style={{
                marginLeft: "auto",
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8,
                padding: "3px 10px",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Clock size={11} color="#f87171" />
              <span style={{ fontSize: 11, color: "#f87171", fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
                Sắp hết hạn
              </span>
            </div>
          )}
        </div>

        {/* Date info */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: startDate ? "1fr 1fr" : "1fr",
            gap: 10,
          }}
        >
          {startDate && (
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 10,
                padding: "10px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <CalendarDays size={14} color="rgba(250,204,21,0.55)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>
                  Ngày bắt đầu
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans', sans-serif" }}>
                  {fmt(startDate)}
                </div>
              </div>
            </div>
          )}
          {endDate && (
            <div
              style={{
                background: isExpiringSoon ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
                borderRadius: 10,
                padding: "10px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                border: isExpiringSoon ? "1px solid rgba(239,68,68,0.2)" : "1px solid transparent",
              }}
            >
              <CalendarDays size={14} color={isExpiringSoon ? "#f87171" : "rgba(250,204,21,0.55)"} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>
                  Hết hạn
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: isExpiringSoon ? "#f87171" : "rgba(255,255,255,0.85)",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {fmt(endDate)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Days remaining bar */}
        {remaining !== null && endDate && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif" }}>
                Thời gian còn lại
              </span>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: isExpiringSoon ? "#f87171" : gold,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {remaining} ngày
              </span>
            </div>
            {/* Progress bar — tính theo 30 ngày */}
            <div style={{
              height: 4, borderRadius: 99,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (remaining / 30) * 100)}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{
                  height: "100%", borderRadius: 99,
                  background: isExpiringSoon
                    ? "linear-gradient(90deg, #ef4444, #f87171)"
                    : "linear-gradient(90deg, #facc15, #f59e0b)",
                }}
              />
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // ── Free plan badge ────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        borderRadius: 16,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      {/* Left: plan info */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Zap size={18} color="rgba(255,255,255,0.4)" />
        </div>
        <div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700, fontSize: 14,
            color: "rgba(255,255,255,0.8)",
          }}>
            Gói Miễn phí
          </div>
          <div style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.35)",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Nâng cấp để xem không giới hạn
          </div>
        </div>
      </div>

      {/* Right: upgrade button */}
      {onUpgrade && (
        <motion.button
          onClick={onUpgrade}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          style={{
            flexShrink: 0,
            background: "linear-gradient(135deg, #facc15 0%, #f59e0b 100%)",
            border: "none",
            borderRadius: 10,
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            boxShadow: "0 0 16px rgba(250,204,21,0.25)",
          }}
        >
          <Crown size={13} color="#1c1400" />
          <span style={{
            fontSize: 13, fontWeight: 800,
            color: "#1c1400",
            fontFamily: "'DM Sans', sans-serif",
            whiteSpace: "nowrap",
          }}>
            Nâng cấp
          </span>
        </motion.button>
      )}
    </motion.div>
  );
};

export default ProfilePlanBadge;