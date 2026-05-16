// src/pages/PremiumPage.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Shield, Download, Star, MonitorPlay,
  Check, X, ChevronDown, Sparkles, Gift, Play, Zap,
} from "lucide-react";
import { C, FONT_DISPLAY, FONT_BODY, FONT_BEBAS, GOOGLE_FONTS } from "../context/homeTokens";
import paymentService from "../services/paymentService";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: null,
    key: "free",
    name: "Miễn phí",
    subtitle: null,
    price: 0,
    period: null,
    badge: null,
    featured: false,
    cta: "Gói hiện tại",
    icon: Play,
    features: ["HD 720p", "1 thiết bị", "Kho phim cơ bản"],
    missing: ["Full HD 1080p", "Không quảng cáo", "Tải về ngoại tuyến"],
  },
  {
    id: "monthly_premium",
    key: "monthly",
    name: "Premium · Tháng",
    subtitle: null,
    price: 69000,
    period: "/tháng",
    badge: null,
    featured: true,
    cta: "Bắt đầu ngay",
    icon: Crown,
    features: [
      "Full HD 1080p",
      "Không quảng cáo",
      "3 thiết bị đồng thời",
      "Toàn bộ kho phim",
      "Tải về ngoại tuyến",
    ],
  },
  {
    id: "yearly_premium",
    key: "yearly",
    name: "Premium · Năm",
    subtitle: null,
    price: 599000,
    period: "/năm",
    badge: "Tiết kiệm 28%",
    featured: false,
    cta: "Tiết kiệm hơn",
    icon: Sparkles,
    features: [
      "Full HD 1080p",
      "Không quảng cáo",
      "5 thiết bị đồng thời",
      "Toàn bộ kho phim",
      "Tải về ngoại tuyến",
      "Nội dung độc quyền",
      "Hỗ trợ ưu tiên 24/7",
    ],
  },
];

const BENEFITS = [
  { icon: MonitorPlay, color: C.accent,   title: "Không giới hạn",  desc: "Xem bao nhiêu tùy thích, không bị cắt ngang bởi quảng cáo" },
  { icon: Star,        color: C.gold,     title: "Full HD 1080p",   desc: "Trải nghiệm hình ảnh sắc nét chuẩn rạp ngay tại nhà" },
  { icon: Download,    color: "#7c3aed",  title: "Tải phim offline", desc: "Lưu phim yêu thích, xem khi không có kết nối mạng" },
  { icon: Shield,      color: C.green,    title: "Không quảng cáo", desc: "Không bị gián đoạn — chỉ có phim và cảm xúc" },
];

const FAQS = [
  { q: "Tôi có thể hủy bất cứ lúc nào không?",     a: "Hoàn toàn có thể. Bạn hủy gói Premium bất kỳ lúc nào từ trang cài đặt tài khoản. Không có phí phạt hay ràng buộc nào." },
  { q: "Thanh toán bằng phương thức nào?",           a: "Chúng tôi hỗ trợ VNPay, MoMo, thẻ tín dụng/ghi nợ Visa/Mastercard, và chuyển khoản ngân hàng nội địa." },
  { q: "Gói Năm có ưu điểm gì hơn Gói Tháng?",      a: "Gói Năm tiết kiệm 28% so với trả theo tháng, thêm 2 slot thiết bị (5 thay vì 3), hỗ trợ ưu tiên 24/7 và quyền truy cập nội dung độc quyền." },
  { q: "Tiền có được hoàn lại nếu không hài lòng?",  a: "Trong 7 ngày đầu tiên kể từ khi đăng ký, chúng tôi hoàn tiền 100% nếu bạn không hài lòng với dịch vụ." },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

/** Map subscriptionType từ API → plan.key
 *  BE trả { isPremium, subscriptionType, expiredAt, daysRemaining, isExpiringSoon }
 *  subscriptionType có thể là: "Premium", "monthly_premium", "yearly_premium", v.v.
 *
 *  - Nếu subStatus null / isPremium false → "free"
 *  - Nếu subscriptionType chứa "year"     → "yearly"
 *  - Nếu subscriptionType chứa "month" hoặc là "premium" (generic) → "monthly"
 */
const mapSubTypeToKey = (subStatus) => {
  if (!subStatus?.isPremium) return "free";
  const t = (subStatus.subscriptionType || "").toLowerCase();
  if (t.includes("year"))  return "yearly";
  if (t.includes("month") || t === "premium") return "monthly";
  return "monthly"; // safe fallback cho bất kỳ premium nào chưa map được
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Toast = ({ show, message, isError }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        style={{
          position: "fixed", bottom: 32, left: "50%",
          transform: "translateX(-50%)", zIndex: 9999,
          background: isError ? "#1a0a0a" : "#081a0f",
          border: `1px solid ${isError ? "rgba(229,24,30,0.45)" : "rgba(70,211,105,0.45)"}`,
          borderRadius: 12, padding: "14px 24px",
          color: isError ? "#f87171" : C.green,
          fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: `0 8px 32px ${isError ? "rgba(229,24,30,0.2)" : "rgba(70,211,105,0.2)"}`,
          whiteSpace: "nowrap", backdropFilter: "blur(10px)",
        }}
      >
        {isError ? <X size={16} /> : <Check size={16} />}
        {message}
      </motion.div>
    )}
  </AnimatePresence>
);

const FAQItem = ({ q, a, isOpen, onToggle }) => (
  <div style={{ borderBottom: `1px solid ${C.border}` }}>
    <button
      onClick={onToggle}
      style={{
        width: "100%", display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: "20px 0", background: "none",
        border: "none", color: isOpen ? "#fff" : C.textSub,
        cursor: "pointer", fontFamily: FONT_BODY, fontSize: 15,
        fontWeight: isOpen ? 700 : 500, textAlign: "left", gap: 16,
        transition: "color 0.2s",
      }}
    >
      {q}
      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
        <ChevronDown size={18} style={{ color: isOpen ? C.accent : C.textDim, flexShrink: 0 }} />
      </motion.div>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22 }}
          style={{ overflow: "hidden" }}
        >
          <p style={{
            paddingBottom: 20, color: C.textSub,
            fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.8, margin: 0,
          }}>
            {a}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ─── Plan Card ────────────────────────────────────────────────────────────────

const PlanCard = ({ plan, loading, onSubscribe, isCurrent, subLoading, subStatus }) => {
  const PlanIcon = plan.icon;
  const isLoading = plan.id !== null && loading === plan.id;
  const isFree = plan.key === "free";
  const isYearly = plan.key === "yearly";

  // User đang có Premium hợp lệ nhưng xem gói khác (không phải gói hiện tại)
  const isBlockedByActiveSub = !isCurrent && !isFree && subStatus?.isPremium === true;

  // Border & glow per plan type
  const borderColor = isCurrent
    ? C.green
    : plan.featured
      ? "rgba(229,24,30,0.55)"
      : isYearly
        ? "rgba(245,197,24,0.35)"
        : C.border;

  const bgGradient = isCurrent && !isFree
    ? "linear-gradient(160deg, #071a0d 0%, #0d0d0d 100%)"
    : plan.featured
      ? "linear-gradient(160deg, #180808 0%, #0f0c0c 100%)"
      : isYearly
        ? "linear-gradient(160deg, #141007 0%, #0d0d0d 100%)"
        : C.surfaceMid;

  const glowShadow = isCurrent && !isFree
    ? "0 0 40px rgba(70,211,105,0.10), 0 16px 40px rgba(0,0,0,0.4)"
    : plan.featured
      ? "0 0 50px rgba(229,24,30,0.12), 0 16px 48px rgba(0,0,0,0.4)"
      : isYearly
        ? "0 0 40px rgba(245,197,24,0.06), 0 8px 24px rgba(0,0,0,0.3)"
        : "0 4px 20px rgba(0,0,0,0.25)";

  const topLineGradient = isCurrent
    ? `linear-gradient(90deg, transparent, ${C.green}, transparent)`
    : plan.featured
      ? `linear-gradient(90deg, transparent, ${C.accent}, transparent)`
      : isYearly
        ? `linear-gradient(90deg, transparent, ${C.gold}, transparent)`
        : null;

  const ctaBg = isCurrent
    ? "rgba(70,211,105,0.12)"
    : isFree || isBlockedByActiveSub
      ? "rgba(255,255,255,0.04)"
      : plan.featured
        ? `linear-gradient(135deg, ${C.accent} 0%, #b0000a 100%)`
        : isYearly
          ? `linear-gradient(135deg, #b8880a 0%, ${C.gold} 100%)`
          : "rgba(255,255,255,0.08)";

  const ctaColor = isCurrent
    ? C.green
    : isFree || isBlockedByActiveSub
      ? C.textDim
      : "#fff";

  const ctaBoxShadow = plan.featured && !isCurrent
    ? `0 6px 28px rgba(229,24,30,0.4)`
    : isYearly && !isCurrent
      ? `0 6px 28px rgba(245,197,24,0.2)`
      : "none";

  const isDisabled = isCurrent || isFree || subLoading || isBlockedByActiveSub;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isDisabled ? { y: -5, transition: { duration: 0.2 } } : {}}
      transition={{ duration: 0.35 }}
      style={{
        position: "relative",
        background: bgGradient,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 20,
        padding: "32px 28px 28px",
        display: "flex", flexDirection: "column",
        boxShadow: glowShadow,
        transform: plan.featured ? "scale(1.03)" : "scale(1)",
        overflow: "hidden",
        flex: 1,
        opacity: isFree && !isCurrent ? 0.7 : 1,
        transition: "box-shadow 0.3s, border-color 0.3s",
      }}
    >
      {/* Top accent line */}
      {topLineGradient && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: topLineGradient,
        }} />
      )}

      {/* Current plan badge */}
      {isCurrent && (
        <div style={{
          position: "absolute", top: 14, right: 16,
          background: "rgba(70,211,105,0.15)",
          border: "1px solid rgba(70,211,105,0.35)",
          borderRadius: 6, padding: "3px 10px",
          fontSize: 11, fontWeight: 700, color: C.green,
          letterSpacing: "0.05em", fontFamily: FONT_BODY,
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <Check size={10} strokeWidth={3} />
          Gói của bạn
        </div>
      )}

      {/* Save badge (only if not current) */}
      {plan.badge && !isCurrent && (
        <div style={{
          position: "absolute", top: 14, right: 16,
          background: `linear-gradient(135deg, ${C.gold}, #e6a800)`,
          borderRadius: 6, padding: "3px 10px",
          fontSize: 11, fontWeight: 800, color: "#000",
          letterSpacing: "0.04em", fontFamily: FONT_BODY,
        }}>
          {plan.badge}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <PlanIcon
            size={15}
            color={isCurrent ? C.green : plan.featured ? C.accent : isYearly ? C.gold : C.textSub}
          />
          <span style={{
            fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 700,
            color: isCurrent ? C.green : plan.featured ? C.accent : isYearly ? C.gold : C.textSub,
            letterSpacing: "0.04em",
          }}>
            {plan.name}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 10 }}>
          {plan.price > 0 ? (
            <>
              <span style={{
                fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 900,
                color: "#fff", lineHeight: 1,
              }}>
                {fmt(plan.price)}
              </span>
              <span style={{ color: C.textSub, fontSize: 14, fontFamily: FONT_BODY }}>
                {plan.period}
              </span>
            </>
          ) : (
            <span style={{
              fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 900,
              color: C.textSub, lineHeight: 1,
            }}>
              Miễn phí
            </span>
          )}
        </div>

        {/* Yearly equivalent note */}
        {isYearly && (
          <p style={{
            fontFamily: FONT_BODY, fontSize: 12, color: C.gold,
            marginTop: 6, opacity: 0.8,
          }}>
            ≈ 49.900đ/tháng — tiết kiệm nhất
          </p>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: `1px solid ${C.border}`, marginBottom: 20 }} />

      {/* Features */}
      <ul style={{
        listStyle: "none", padding: 0,
        margin: "0 0 auto", display: "flex", flexDirection: "column", gap: 10,
      }}>
        {plan.features.map((f, i) => (
          <li key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
              background: plan.featured
                ? "rgba(229,24,30,0.15)"
                : isYearly
                  ? "rgba(245,197,24,0.12)"
                  : "rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Check
                size={10}
                strokeWidth={3}
                color={plan.featured ? C.accent : isYearly ? C.gold : C.green}
              />
            </div>
            <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: C.text }}>{f}</span>
          </li>
        ))}
        {plan.missing?.map((f, i) => (
          <li key={`m-${i}`} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
              background: "rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <X size={9} color={C.textDim} strokeWidth={3} />
            </div>
            <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: C.textDim }}>{f}</span>
          </li>
        ))}
      </ul>

      {/* Active sub warning */}
      {isBlockedByActiveSub && (
        <div style={{
          marginTop: 16,
          padding: "10px 14px",
          background: "rgba(245,197,24,0.08)",
          border: "1px solid rgba(245,197,24,0.25)",
          borderRadius: 10,
          display: "flex", alignItems: "flex-start", gap: 9,
        }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
          <p style={{
            margin: 0, fontSize: 12, lineHeight: 1.6,
            color: "rgba(245,197,24,0.85)", fontFamily: FONT_BODY,
          }}>
            Gói <strong>Premium hiện tại vẫn còn hạn</strong> đến{" "}
            {subStatus?.expiredAt
              ? new Date(subStatus.expiredAt).toLocaleDateString("vi-VN")
              : "—"}
            . Vui lòng chờ hết hạn hoặc liên hệ hỗ trợ để nâng cấp sớm.
          </p>
        </div>
      )}

      {/* CTA */}
      <motion.button
        onClick={() => !isDisabled && onSubscribe(plan)}
        disabled={isDisabled || isLoading}
        whileHover={!isDisabled ? { scale: 1.03 } : {}}
        whileTap={!isDisabled ? { scale: 0.97 } : {}}
        style={{
          marginTop: 24, width: "100%", padding: "13px 0",
          background: ctaBg,
          border: isCurrent
            ? "1px solid rgba(70,211,105,0.3)"
            : isFree
              ? `1px solid ${C.border}`
              : plan.featured || isYearly
                ? "none"
                : `1px solid ${C.borderMid}`,
          borderRadius: 10,
          color: ctaColor,
          fontFamily: FONT_BODY, fontSize: 14, fontWeight: 800,
          cursor: isDisabled ? "default" : "pointer",
          letterSpacing: "0.02em",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          boxShadow: ctaBoxShadow,
          transition: "background 0.2s",
        }}
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
            style={{
              width: 16, height: 16,
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff", borderRadius: "50%",
            }}
          />
        ) : (
          <>
            {isCurrent && <Check size={14} />}
            {!isCurrent && !isBlockedByActiveSub && plan.featured && <Crown size={14} />}
            {!isCurrent && !isBlockedByActiveSub && isYearly && <Sparkles size={14} />}
            {isCurrent ? "Gói hiện tại của bạn" : isBlockedByActiveSub ? "Không khả dụng" : plan.cta}
          </>
        )}
      </motion.button>
    </motion.div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const PremiumPage = () => {
  const [loading, setLoading]       = useState(null);
  const [toast, setToast]           = useState({ show: false, message: "", isError: false });
  const [openFaq, setOpenFaq]       = useState(null);
  const [subStatus, setSubStatus]   = useState(null);
  const [subLoading, setSubLoading] = useState(true);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      ${GOOGLE_FONTS}
      @keyframes shimmer {
        0%   { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-8px); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    setSubLoading(true);
    paymentService.getSubscriptionStatus()
      .then((res) => { setSubStatus(res); setSubLoading(false); })
      .catch(() => { setSubStatus(null); setSubLoading(false); });
  }, []);

  // currentPlanKey:
  // - null        → còn đang load (subLoading)
  // - "free"      → đã load xong, xác nhận không phải premium
  // - "monthly"   → gói tháng
  // - "yearly"    → gói năm
  const currentPlanKey = subLoading ? null : mapSubTypeToKey(subStatus);

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  };

  const handleSubscribe = async (plan) => {
    if (loading) return;

    // Guard: không cho mua nếu còn sub hợp lệ
    if (subStatus?.isPremium && plan.id !== null) {
      const expiry = subStatus.expiredAt
        ? new Date(subStatus.expiredAt).toLocaleDateString("vi-VN")
        : "";
      showToast(
        `Gói Premium của bạn vẫn còn hạn đến ${expiry}. Vui lòng liên hệ hỗ trợ để nâng cấp sớm.`,
        true
      );
      return;
    }

    setLoading(plan.id);
    try {
      const result = await paymentService.createOrder({ planId: plan.id, paymentProvider: "vnpay" });
      const paymentUrl = result?.paymentUrl;
      if (!paymentUrl) throw new Error("Không nhận được URL thanh toán.");
      showToast("Đang chuyển hướng tới cổng thanh toán...");
      setTimeout(() => { window.location.href = paymentUrl; }, 1200);
    } catch (err) {
      showToast(err.message || "Không thể tạo đơn thanh toán. Vui lòng thử lại.", true);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{
      background: C.bg, minHeight: "100vh",
      fontFamily: FONT_BODY, color: C.text, overflowX: "hidden",
    }}>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section style={{
        position: "relative", padding: "100px 24px 80px",
        textAlign: "center", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `radial-gradient(ellipse 80% 60% at 50% -5%, rgba(229,24,30,0.22) 0%, transparent 65%)`,
        }} />

        <div style={{ position: "relative", maxWidth: 680, margin: "0 auto" }}>

          {/* Active subscription badge */}
          {subStatus?.isPremium && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 18 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                background: "rgba(70,211,105,0.1)", border: "1px solid rgba(70,211,105,0.3)",
                borderRadius: 999, padding: "6px 16px",
                color: C.green, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
                fontFamily: FONT_BODY,
              }}>
                <Check size={12} />
                ĐÃ KÍCH HOẠT PREMIUM
                {subStatus.expiredAt && ` · HẾT HẠN: ${new Date(subStatus.expiredAt).toLocaleDateString("vi-VN")}`}
              </span>
            </motion.div>
          )}

          {/* Floating crown */}
          <div style={{ display: "inline-block", marginBottom: 24, animation: "float 3.5s ease-in-out infinite" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(229,24,30,0.12)",
              border: `1.5px solid rgba(229,24,30,0.35)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Crown size={32} color={C.accent} />
            </div>
          </div>

          {/* Overline — Be Vietnam Pro, rõ ràng */}
          <p style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.28em",
            color: C.accent,
            marginBottom: 16,
            textTransform: "uppercase",
          }}>
            UiaMovie — Premium Membership
          </p>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: "clamp(34px, 5.5vw, 58px)",
              fontWeight: 900, lineHeight: 1.1, marginBottom: 18, color: "#fff",
            }}
          >
            Xem không giới hạn.
            <br />
            <span style={{
              background: `linear-gradient(135deg, ${C.accent} 0%, #ff5252 50%, ${C.accent} 100%)`,
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text", animation: "shimmer 3s linear infinite",
            }}>
              Trải nghiệm đỉnh cao.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ fontSize: 16, color: C.textSub, lineHeight: 1.7, marginBottom: 36 }}
          >
            Hàng nghìn bộ phim & series. Full HD. Không quảng cáo.
            <br />Chỉ từ <strong style={{ color: "#fff", fontWeight: 800 }}>69.000đ/tháng</strong>.
          </motion.p>

          {/* Trust pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}
          >
            {[
              { icon: Zap,    text: "Kích hoạt ngay" },
              { icon: Shield, text: "Hủy bất cứ lúc" },
              { icon: Star,   text: "7 ngày hoàn tiền" },
            ].map(({ icon: Icon, text }, i) => (
              <span key={i} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                color: C.textSub, fontSize: 13,
              }}>
                <Icon size={13} color={C.accent} />
                {text}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ PLAN CARDS ════════════════════════════════════════════════════════ */}
      <section style={{ padding: "0 24px 80px", maxWidth: 1020, margin: "0 auto" }}>

        {/* VNPay badge */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "7px 18px", borderRadius: 999,
            border: "1px solid #0060A944", background: "#0060A914",
            color: C.textSub, fontFamily: FONT_BODY, fontSize: 12,
            fontWeight: 600, letterSpacing: "0.04em",
          }}>
            <Check size={11} color={C.accent} />
            Thanh toán qua VNPay
          </span>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 18, alignItems: "stretch",
        }}>
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              loading={loading}
              onSubscribe={handleSubscribe}
              isCurrent={currentPlanKey === plan.key}
              subLoading={subLoading}
              subStatus={subStatus}
            />
          ))}
        </div>
      </section>

      {/* ══ BENEFITS ══════════════════════════════════════════════════════════ */}
      <section style={{
        padding: "60px 24px 80px",
        background: C.surfaceMid,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 48 }}
          >
            <p style={{
              fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 800,
              letterSpacing: "0.28em", color: C.accent,
              marginBottom: 10, textTransform: "uppercase",
            }}>
              Tại sao Premium
            </p>
            <h2 style={{
              fontFamily: FONT_DISPLAY,
              fontSize: "clamp(22px, 3.5vw, 34px)",
              fontWeight: 800, color: "#fff",
            }}>
              Mọi thứ bạn cần để xem phim
            </h2>
          </motion.div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}>
            {BENEFITS.map(({ icon: Icon, color, title, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                style={{
                  background: C.surfaceCard,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16, padding: "24px 20px",
                  position: "relative", overflow: "hidden",
                }}
              >
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, transparent, ${color}55, transparent)`,
                }} />
                <div style={{
                  width: 42, height: 42, borderRadius: 12, marginBottom: 16,
                  background: `${color}15`, border: `1px solid ${color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={20} color={color} />
                </div>
                <h3 style={{
                  fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 800,
                  color: "#fff", marginBottom: 6,
                }}>{title}</h3>
                <p style={{
                  fontSize: 13, color: C.textSub,
                  lineHeight: 1.6, margin: 0, fontFamily: FONT_BODY,
                }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "60px 24px 80px", maxWidth: 720, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: 40 }}
        >
          <p style={{
            fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 800,
            letterSpacing: "0.28em", color: C.accent,
            marginBottom: 10, textTransform: "uppercase",
          }}>
            Hỗ trợ
          </p>
          <h2 style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "clamp(22px, 3.5vw, 34px)",
            fontWeight: 800, color: "#fff",
          }}>
            Câu hỏi thường gặp
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            background: C.surfaceMid,
            border: `1px solid ${C.border}`,
            borderRadius: 18, padding: "4px 28px",
          }}
        >
          {FAQS.map((faq, i) => (
            <FAQItem
              key={i}
              q={faq.q}
              a={faq.a}
              isOpen={openFaq === i}
              onToggle={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </motion.div>
      </section>

      {/* ══ BOTTOM CTA ════════════════════════════════════════════════════════ */}
      <section style={{ padding: "0 24px 100px", textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            position: "relative", maxWidth: 720, margin: "0 auto",
            background: "linear-gradient(160deg, #1c0707 0%, #0d0d0d 100%)",
            border: `1px solid rgba(229,24,30,0.2)`,
            borderRadius: 24, padding: "60px 40px",
            overflow: "hidden",
          }}
        >
          <div style={{
            position: "absolute", top: 0, left: "20%", right: "20%", height: 1,
            background: `linear-gradient(90deg, transparent, rgba(229,24,30,0.5), transparent)`,
          }} />
          <div style={{
            position: "absolute", bottom: -60, left: "50%", transform: "translateX(-50%)",
            width: 400, height: 200,
            background: `radial-gradient(ellipse, rgba(229,24,30,0.18) 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />

          <div style={{ animation: "float 3.5s ease-in-out infinite", display: "inline-block", marginBottom: 20 }}>
            <Crown size={44} color={C.accent} />
          </div>

          <h2 style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "clamp(26px, 4.5vw, 42px)",
            fontWeight: 900, color: "#fff", marginBottom: 14,
          }}>
            Sẵn sàng trải nghiệm?
          </h2>
          <p style={{
            fontSize: 15, color: C.textSub, fontFamily: FONT_BODY,
            marginBottom: 36, lineHeight: 1.7,
          }}>
            Tham gia hàng triệu người dùng đang thưởng thức kho phim không giới hạn.
            <br />7 ngày đầu miễn phí — hủy bất cứ lúc nào.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <motion.button
              onClick={() => handleSubscribe(PLANS[1])}
              disabled={!!loading}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "14px 32px",
                background: `linear-gradient(135deg, ${C.accent} 0%, #b0000a 100%)`,
                border: "none", borderRadius: 12, color: "#fff",
                fontFamily: FONT_BODY, fontSize: 14, fontWeight: 800,
                cursor: "pointer",
                boxShadow: `0 6px 28px rgba(229,24,30,0.4)`,
              }}
            >
              <Crown size={15} />
              Đăng ký Premium Tháng
            </motion.button>

            <motion.button
              onClick={() => handleSubscribe(PLANS[2])}
              disabled={!!loading}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "14px 32px",
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${C.borderMid}`,
                borderRadius: 12, color: "rgba(255,255,255,0.8)",
                fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Gift size={15} />
              Tiết kiệm 28% — Gói Năm
            </motion.button>
          </div>
        </motion.div>
      </section>

      <Toast show={toast.show} message={toast.message} isError={toast.isError} />
    </div>
  );
};

export default PremiumPage;