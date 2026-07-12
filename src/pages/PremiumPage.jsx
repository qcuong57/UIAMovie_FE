// src/pages/PremiumPage.jsx
//
// Thiết kế v4: "uyển chuyển & dễ chịu" — chuyển toàn bộ ngôn ngữ thị giác
// từ vé giấy góc vuông sang một bề mặt mềm, bo tròn rộng, bóng đổ khuếch
// tán nhẹ và chuyển động dạng lò xo (spring) thay vì tuyến tính. Con dấu
// giá đóng nghiêng, cờ góc tam giác và viền chấm kiểu vé được thay bằng
// pill mềm, quầng sáng mờ phía sau khối nổi bật, và các đường phân cách
// dạng gradient tan dần thay vì hairline cứng. Benefits vẫn giữ bố cục
// dạng danh sách nhưng mỗi icon nằm trong một vòng tròn nền dịu mắt.
//
// Logic nghiệp vụ (gọi API, mapping trạng thái, xử lý thanh toán, toast,
// FAQ accordion) giữ nguyên 100% so với bản trước — chỉ phần trình bày
// được viết lại.

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Shield,
  Download,
  Star,
  MonitorPlay,
  Check,
  X,
  ChevronDown,
  Gift,
  Play,
  Zap,
  Lock,
  Ticket,
} from "lucide-react";
import {
  C,
  FONT_DISPLAY,
  FONT_BODY,
  GOOGLE_FONTS,
} from "../context/homeTokens";
import paymentService from "../services/paymentService";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: null,
    key: "free",
    name: "Miễn phí",
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
    price: 599000,
    period: "/năm",
    badge: "Tiết kiệm 28%",
    featured: false,
    cta: "Tiết kiệm hơn",
    icon: Gift,
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

// Danh sách "quyền lợi" trình bày dạng bảng thông tin rạp chiếu — mỗi dòng
// một hàng, không dùng thẻ lưới đồng dạng.
const BENEFITS = [
  {
    icon: MonitorPlay,
    title: "Không giới hạn",
    desc: "Xem bao nhiêu tùy thích, không bị cắt ngang bởi quảng cáo",
  },
  {
    icon: Star,
    title: "Full HD 1080p",
    desc: "Trải nghiệm hình ảnh sắc nét chuẩn rạp ngay tại nhà",
  },
  {
    icon: Download,
    title: "Tải phim offline",
    desc: "Lưu phim yêu thích, xem khi không có kết nối mạng",
  },
  {
    icon: Shield,
    title: "Không quảng cáo",
    desc: "Không bị gián đoạn — chỉ có phim và cảm xúc",
  },
];

// Bo tròn rộng, mềm mại — mọi bề mặt đều có cảm giác "gối đỡ", không góc cứng.
const RADIUS = { card: 26, panel: 28, btn: 999, chip: 999, icon: 16 };
const SHADOW = {
  card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 18px 44px rgba(0,0,0,0.28)",
  cardLift: "0 22px 56px rgba(0,0,0,0.4)",
  glow: (color) => `0 0 0 1px rgba(255,255,255,0.03) inset, 0 30px 70px -20px ${color}`,
};
// Đường cong lò xo dùng chung cho mọi hiệu ứng chuyển động — tạo cảm giác
// nảy nhẹ, tự nhiên thay vì tuyến tính cứng nhắc.
const SPRING = { type: "spring", stiffness: 260, damping: 26 };
const SPRING_SOFT = { type: "spring", stiffness: 180, damping: 22 };

const FAQS = [
  {
    q: "Tôi có thể hủy bất cứ lúc nào không?",
    a: "Hoàn toàn có thể. Bạn hủy gói Premium bất kỳ lúc nào từ trang cài đặt tài khoản. Không có phí phạt hay ràng buộc nào.",
  },
  {
    q: "Thanh toán bằng phương thức nào?",
    a: "Chúng tôi xử lý thanh toán qua cổng VNPay — hỗ trợ thẻ ATM nội địa, Visa, Mastercard và JCB.",
  },
  {
    q: "Gói Năm có ưu điểm gì hơn Gói Tháng?",
    a: "Gói Năm tiết kiệm 28% so với trả theo tháng, thêm 2 slot thiết bị (5 thay vì 3), hỗ trợ ưu tiên 24/7 và quyền truy cập nội dung độc quyền.",
  },
  {
    q: "Tiền có được hoàn lại nếu không hài lòng?",
    a: "Trong 7 ngày đầu tiên kể từ khi đăng ký, chúng tôi hoàn tiền 100% nếu bạn không hài lòng với dịch vụ.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

/** Map subscriptionType từ API → plan.key
 *  BE trả { isPremium, subscriptionType, expiredAt, daysRemaining, isExpiringSoon }
 */
const mapSubTypeToKey = (subStatus) => {
  if (!subStatus?.isPremium) return "free";
  const t = (subStatus.subscriptionType || "").toLowerCase();
  if (t.includes("year")) return "yearly";
  if (t.includes("month") || t === "premium") return "monthly";
  return "monthly";
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Toast = ({ show, message, isError }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={SPRING}
        style={{
          position: "fixed",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          background: C.surfaceHigh,
          border: `1px solid ${isError ? "rgba(229,9,20,0.35)" : C.borderMid}`,
          borderRadius: RADIUS.chip,
          padding: "14px 26px",
          color: isError ? "#ff8080" : "#fff",
          fontFamily: FONT_BODY,
          fontSize: 14,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 10,
          whiteSpace: "nowrap",
          boxShadow: SHADOW.cardLift,
        }}
      >
        {isError ? <X size={16} /> : <Check size={16} />}
        {message}
      </motion.div>
    )}
  </AnimatePresence>
);

const FAQItem = ({ q, a, isOpen, onToggle }) => (
  <div
    style={{
      borderRadius: RADIUS.icon,
      background: isOpen ? C.surfaceCard : "transparent",
      transition: "background 0.3s ease",
      marginBottom: 6,
    }}
  >
    <button
      onClick={onToggle}
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "18px 22px",
        background: "none",
        border: "none",
        color: isOpen ? "#fff" : C.textSub,
        cursor: "pointer",
        fontFamily: FONT_BODY,
        fontSize: 15,
        fontWeight: isOpen ? 700 : 500,
        textAlign: "left",
        gap: 16,
        borderRadius: RADIUS.icon,
      }}
    >
      {q}
      <motion.span
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={SPRING_SOFT}
        style={{ display: "flex", flexShrink: 0 }}
      >
        <ChevronDown size={18} style={{ color: isOpen ? C.accent : C.textDim }} />
      </motion.span>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={SPRING_SOFT}
          style={{ overflow: "hidden" }}
        >
          <p
            style={{
              padding: "0 22px 20px",
              color: C.textSub,
              fontFamily: FONT_BODY,
              fontSize: 14,
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            {a}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ─── Plan Card ────────────────────────────────────────────────────────────────

const PlanCard = ({
  plan,
  loading,
  onSubscribe,
  isCurrent,
  subLoading,
  subStatus,
}) => {
  const PlanIcon = plan.icon;
  const isLoading = plan.id !== null && loading === plan.id;
  const isFree = plan.key === "free";
  const isYearly = plan.key === "yearly";

  const isBlockedByActiveSub =
    !isCurrent && !isFree && subStatus?.isPremium === true;
  const isDisabled = isCurrent || isFree || subLoading || isBlockedByActiveSub;

  const borderColor = isCurrent
    ? "rgba(70,211,105,0.5)"
    : plan.featured
      ? C.accent
      : isYearly
        ? C.borderBright
        : C.border;

  const ctaBg = isCurrent
    ? "transparent"
    : isFree || isBlockedByActiveSub
      ? "transparent"
      : plan.featured
        ? C.accent
        : "transparent";

  const ctaColor = isCurrent
    ? C.green
    : isFree || isBlockedByActiveSub
      ? C.textDim
      : plan.featured
        ? "#fff"
        : C.text;

  const ctaBorder = isCurrent
    ? "1px solid rgba(70,211,105,0.4)"
    : isFree || isBlockedByActiveSub
      ? `1px solid ${C.border}`
      : plan.featured
        ? "none"
        : `1px solid ${C.borderBright}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={!isDisabled ? { y: -6, scale: 1.012 } : {}}
      transition={SPRING}
      style={{
        position: "relative",
        background: plan.featured ? C.surfaceHigh : C.surfaceCard,
        border: `1px solid ${borderColor}`,
        borderRadius: RADIUS.card,
        padding: "36px 30px 30px",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        height: "100%",
        boxShadow: plan.featured ? SHADOW.glow("rgba(229,9,20,0.16)") : SHADOW.card,
        opacity: isFree && !isCurrent ? 0.72 : 1,
      }}
    >
      {/* Ruy băng "phổ biến nhất" — pill mềm nổi phía trên card, không còn cờ góc cứng */}
      {plan.featured && !isCurrent && (
        <div
          style={{
            position: "absolute",
            top: -14,
            left: "50%",
            transform: "translateX(-50%)",
            background: C.accent,
            borderRadius: RADIUS.chip,
            padding: "6px 18px",
            fontFamily: FONT_DISPLAY,
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: "0.08em",
            color: "#fff",
            whiteSpace: "nowrap",
            boxShadow: "0 8px 20px rgba(229,9,20,0.35)",
          }}
        >
          PHỔ BIẾN NHẤT
        </div>
      )}

      {/* Badge: gói hiện tại hoặc tiết kiệm — không bao giờ cả hai cùng lúc */}
      {isCurrent ? (
        <div
          style={{
            position: "absolute",
            top: 18,
            left: 22,
            background: "rgba(70,211,105,0.12)",
            border: "1px solid rgba(70,211,105,0.35)",
            borderRadius: RADIUS.chip,
            padding: "4px 12px",
            fontSize: 10.5,
            fontWeight: 700,
            color: C.green,
            letterSpacing: "0.04em",
            fontFamily: FONT_BODY,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Check size={10} strokeWidth={3} />
          GÓI CỦA BẠN
        </div>
      ) : plan.badge ? (
        <div
          style={{
            position: "absolute",
            top: 18,
            left: 22,
            background: C.surfaceHigh,
            border: `1px solid ${C.borderBright}`,
            borderRadius: RADIUS.chip,
            padding: "4px 12px",
            fontSize: 10.5,
            fontWeight: 700,
            color: C.text,
            letterSpacing: "0.04em",
            fontFamily: FONT_BODY,
          }}
        >
          {plan.badge.toUpperCase()}
        </div>
      ) : null}

      {/* Header */}
      <div
        style={{
          marginBottom: 20,
          marginTop: isCurrent || plan.badge ? 22 : plan.featured ? 10 : 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            marginBottom: 4,
          }}
        >
          <PlanIcon
            size={15}
            color={isCurrent ? C.green : plan.featured ? C.accent : C.textSub}
          />
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 13,
              fontWeight: 700,
              color: isCurrent ? C.green : C.textSub,
              letterSpacing: "0.04em",
            }}
          >
            {plan.name}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 4,
            marginTop: 16,
          }}
        >
          {plan.price > 0 ? (
            <>
              <span
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 36,
                  fontWeight: 800,
                  color: "#fff",
                  lineHeight: 1,
                  letterSpacing: "-0.01em",
                }}
              >
                {fmt(plan.price)}
              </span>
              <span
                style={{
                  color: C.textSub,
                  fontSize: 14,
                  fontFamily: FONT_BODY,
                }}
              >
                {plan.period}
              </span>
            </>
          ) : (
            <span
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 36,
                fontWeight: 800,
                color: C.textSub,
                lineHeight: 1,
              }}
            >
              Miễn phí
            </span>
          )}
        </div>

        {isYearly && (
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: 12,
              color: C.textSub,
              marginTop: 8,
            }}
          >
            ≈ 49.900đ/tháng — tiết kiệm nhất
          </p>
        )}
      </div>

      {/* Đường phân cách mềm — gradient tan dần hai đầu thay vì viền chấm cứng */}
      <div
        style={{
          height: 1,
          marginBottom: 22,
          background: `linear-gradient(90deg, transparent, ${C.borderMid}, transparent)`,
        }}
      />

      {/* Features */}
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "0 0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {plan.features.map((f, i) => (
          <li
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <Check
              size={14}
              strokeWidth={2.5}
              color={plan.featured ? C.accent : C.green}
              style={{ flexShrink: 0 }}
            />
            <span
              style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: C.text }}
            >
              {f}
            </span>
          </li>
        ))}
        {plan.missing?.map((f, i) => (
          <li
            key={`m-${i}`}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <X
              size={14}
              strokeWidth={2.5}
              color={C.textDim}
              style={{ flexShrink: 0 }}
            />
            <span
              style={{
                fontFamily: FONT_BODY,
                fontSize: 13.5,
                color: C.textDim,
              }}
            >
              {f}
            </span>
          </li>
        ))}
      </ul>

      {isBlockedByActiveSub && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            border: `1px solid ${C.borderMid}`,
            borderRadius: RADIUS.panel,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              lineHeight: 1.6,
              color: C.textSub,
              fontFamily: FONT_BODY,
            }}
          >
            Gói Premium hiện tại vẫn còn hạn đến{" "}
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
        whileHover={!isDisabled ? { scale: 1.02, y: -1 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        transition={SPRING}
        style={{
          marginTop: 28,
          width: "100%",
          padding: "15px 0",
          background: ctaBg,
          border: ctaBorder,
          borderRadius: RADIUS.btn,
          color: ctaColor,
          fontFamily: FONT_BODY,
          fontSize: 14,
          fontWeight: 700,
          cursor: isDisabled ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
        }}
      >
        {isLoading ? (
          <span
            style={{
              width: 15,
              height: 15,
              borderRadius: "50%",
              border: "2px solid rgba(0,0,0,0.25)",
              borderTopColor: ctaColor,
              animation: "spin 0.7s linear infinite",
              display: "inline-block",
            }}
          />
        ) : (
          <>
            {isCurrent ? (
              <Check size={14} />
            ) : (
              !isFree && !isBlockedByActiveSub && <PlanIcon size={14} />
            )}
            {isCurrent
              ? "Gói hiện tại của bạn"
              : isBlockedByActiveSub
                ? "Không khả dụng"
                : plan.cta}
          </>
        )}
      </motion.button>
    </motion.div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const PremiumPage = () => {
  const [loading, setLoading] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    isError: false,
  });
  const [openFaq, setOpenFaq] = useState(null);
  const [subStatus, setSubStatus] = useState(null);
  const [subLoading, setSubLoading] = useState(true);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      ${GOOGLE_FONTS}
      @keyframes spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    setSubLoading(true);
    paymentService
      .getSubscriptionStatus()
      .then((res) => {
        setSubStatus(res);
        setSubLoading(false);
      })
      .catch(() => {
        setSubStatus(null);
        setSubLoading(false);
      });
  }, []);

  const currentPlanKey = subLoading ? null : mapSubTypeToKey(subStatus);

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  };

  const handleSubscribe = async (plan) => {
    if (loading) return;

    if (subStatus?.isPremium && plan.id !== null) {
      const expiry = subStatus.expiredAt
        ? new Date(subStatus.expiredAt).toLocaleDateString("vi-VN")
        : "";
      showToast(
        `Gói Premium của bạn vẫn còn hạn đến ${expiry}. Vui lòng liên hệ hỗ trợ để nâng cấp sớm.`,
        true,
      );
      return;
    }

    setLoading(plan.id);
    try {
      const result = await paymentService.createOrder({
        planId: plan.id,
        paymentProvider: "vnpay",
      });
      const paymentUrl = result?.paymentUrl;
      if (!paymentUrl) throw new Error("Không nhận được URL thanh toán.");
      showToast("Đang chuyển hướng tới cổng thanh toán...");
      setTimeout(() => {
        window.location.href = paymentUrl;
      }, 1200);
    } catch (err) {
      showToast(
        err.message || "Không thể tạo đơn thanh toán. Vui lòng thử lại.",
        true,
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        fontFamily: FONT_BODY,
        color: C.text,
        "--uia-page-bg": C.bg,
      }}
    >
      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "96px 24px 74px", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {subStatus?.isPremium && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING_SOFT}
              style={{ marginBottom: 18 }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  background: "rgba(70,211,105,0.1)",
                  border: "1px solid rgba(70,211,105,0.35)",
                  borderRadius: RADIUS.chip,
                  padding: "7px 16px",
                  color: C.green,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  fontFamily: FONT_BODY,
                }}
              >
                <Check size={12} />
                ĐÃ KÍCH HOẠT PREMIUM
                {subStatus.expiredAt &&
                  ` · HẾT HẠN: ${new Date(subStatus.expiredAt).toLocaleDateString("vi-VN")}`}
              </span>
            </motion.div>
          )}

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 28,
              padding: "7px 16px",
              background: C.surfaceCard,
              border: `1px solid ${C.borderMid}`,
              borderRadius: RADIUS.chip,
            }}
          >
            <Ticket size={12} color={C.textSub} />
            <span
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.2em",
                color: C.textSub,
                textTransform: "uppercase",
              }}
            >
              UiaMovie Premium
            </span>
          </div>

          <h1
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: "clamp(30px, 4.5vw, 48px)",
              fontWeight: 800,
              lineHeight: 1.18,
              marginBottom: 18,
              color: "#fff",
              letterSpacing: "-0.01em",
            }}
          >
            Xem không giới hạn.
            <br />
            Trải nghiệm trọn vẹn.
          </h1>

          <p
            style={{
              fontSize: 16,
              color: C.textSub,
              lineHeight: 1.7,
              marginBottom: 36,
            }}
          >
            Hàng nghìn bộ phim & series. Full HD. Không quảng cáo.
          </p>

          {/* Pill giá mềm mại, có quầng sáng nhẹ phía sau — thay cho con dấu đóng nghiêng góc cạnh */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...SPRING, delay: 0.1 }}
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 34,
              position: "relative",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: "-30% -20%",
                background:
                  "radial-gradient(closest-side, rgba(229,9,20,0.22), transparent 70%)",
                filter: "blur(6px)",
                zIndex: 0,
              }}
            />
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                background: C.surfaceHigh,
                border: `1px solid rgba(229,9,20,0.4)`,
                borderRadius: RADIUS.panel,
                padding: "14px 32px",
                boxShadow: SHADOW.glow("rgba(229,9,20,0.16)"),
              }}
            >
              <span
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  color: C.accent,
                  textTransform: "uppercase",
                }}
              >
                Chỉ từ
              </span>
              <span
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 26,
                  fontWeight: 800,
                  color: C.accent,
                  letterSpacing: "0.02em",
                }}
              >
                69.000đ
                <span style={{ fontSize: 14, fontWeight: 600 }}>/tháng</span>
              </span>
            </div>
          </motion.div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            {[
              { icon: Zap, text: "Kích hoạt ngay" },
              { icon: Shield, text: "Hủy bất cứ lúc" },
              { icon: Star, text: "7 ngày hoàn tiền" },
            ].map(({ icon: Icon, text }, i) => (
              <span
                key={i}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  color: C.textSub,
                  fontSize: 12.5,
                  fontFamily: FONT_BODY,
                }}
              >
                <Icon size={12} color={C.textDim} />
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PLAN CARDS ════════════════════════════════════════════════════════ */}
      <section
        style={{ padding: "0 24px 88px", maxWidth: 1040, margin: "0 auto" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 44,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 18px",
              borderRadius: RADIUS.chip,
              background: C.surfaceCard,
              border: `1px solid ${C.border}`,
              color: C.textSub,
              fontFamily: FONT_BODY,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Lock size={11} color={C.textDim} />
            Thanh toán bảo mật qua VNPay
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
            gap: 22,
            alignItems: "stretch",
          }}
        >
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

      {/* ══ BENEFITS — bảng thông tin kiểu rạp chiếu ═════════════════════════ */}
      <section
        style={{
          padding: "58px 24px 74px",
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            style={{ textAlign: "center", marginBottom: 40 }}
          >
            <p
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.22em",
                color: C.accent,
                marginBottom: 10,
                textTransform: "uppercase",
              }}
            >
              Tại sao Premium
            </p>
            <h2
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: "clamp(22px, 3vw, 30px)",
                fontWeight: 800,
                color: "#fff",
              }}
            >
              Mọi thứ bạn cần để xem phim
            </h2>
          </motion.div>

          <div
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: RADIUS.panel,
              background: C.surfaceCard,
              overflow: "hidden",
            }}
          >
            {BENEFITS.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...SPRING_SOFT, delay: i * 0.05 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  padding: "22px 26px",
                  borderBottom:
                    i < BENEFITS.length - 1 ? `1px solid ${C.border}` : "none",
                }}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "rgba(229,9,20,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color={C.accent} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 14.5,
                      fontWeight: 700,
                      color: "#fff",
                      marginBottom: 3,
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: C.textSub,
                      lineHeight: 1.6,
                      margin: 0,
                      fontFamily: FONT_BODY,
                    }}
                  >
                    {desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ═══════════════════════════════════════════════════════════════ */}
      <section
        style={{ padding: "64px 24px 76px", maxWidth: 680, margin: "0 auto" }}
      >
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <p
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.22em",
              color: C.accent,
              marginBottom: 10,
              textTransform: "uppercase",
            }}
          >
            Hỗ trợ
          </p>
          <h2
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: "clamp(22px, 3vw, 30px)",
              fontWeight: 800,
              color: "#fff",
            }}
          >
            Câu hỏi thường gặp
          </h2>
        </div>

        <div
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: RADIUS.panel,
            background: C.surfaceCard,
            padding: "10px 14px",
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
        </div>
      </section>

      {/* ══ BOTTOM CTA ════════════════════════════════════════════════════════ */}
      <section style={{ padding: "0 24px 100px", textAlign: "center" }}>
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            border: `1px solid ${C.border}`,
            borderRadius: RADIUS.panel,
            background: C.surfaceCard,
            padding: "56px 40px",
            boxShadow: SHADOW.card,
          }}
        >
          <h2
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: "clamp(24px, 3.5vw, 34px)",
              fontWeight: 800,
              color: "#fff",
              marginBottom: 14,
            }}
          >
            Sẵn sàng trải nghiệm?
          </h2>
          <p
            style={{
              fontSize: 15,
              color: C.textSub,
              fontFamily: FONT_BODY,
              marginBottom: 32,
              lineHeight: 1.7,
            }}
          >
            Tham gia hàng triệu người dùng đang thưởng thức kho phim không giới
            hạn.
            <br />7 ngày đầu miễn phí — hủy bất cứ lúc nào.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <motion.button
              onClick={() => handleSubscribe(PLANS[1])}
              disabled={!!loading}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={SPRING}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "15px 32px",
                background: C.accent,
                border: "none",
                borderRadius: RADIUS.btn,
                color: "#fff",
                fontFamily: FONT_BODY,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Crown size={15} />
              Đăng ký Premium Tháng
            </motion.button>

            <motion.button
              onClick={() => handleSubscribe(PLANS[2])}
              disabled={!!loading}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={SPRING}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "15px 32px",
                background: "transparent",
                border: `1px solid ${C.borderBright}`,
                borderRadius: RADIUS.btn,
                color: C.text,
                fontFamily: FONT_BODY,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Gift size={15} />
              Tiết kiệm 28% — Gói Năm
            </motion.button>
          </div>
        </div>
      </section>

      <Toast
        show={toast.show}
        message={toast.message}
        isError={toast.isError}
      />
    </div>
  );
};

export default PremiumPage;