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
// Luồng thanh toán (chuẩn production):
//   - Bấm thẻ gói chỉ MỞ hộp thoại xác nhận. Đơn (create-order) chỉ được tạo khi
//     người dùng bấm "Thanh toán" → bấm nhầm rồi đóng thì KHÔNG sinh đơn Pending.
//   - Quay lại từ cổng thanh toán (Back / bfcache): reset trạng thái đang chuyển hướng
//     bằng sự kiện `pageshow`, không để spinner treo hay nút bị khóa.
//   - Trạng thái gói được cache (stale-while-revalidate) và animation vào trang chỉ chạy
//     một lần, nên quay lại trang không bị "load lại" từ đầu.

import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { useNavigate } from "react-router-dom";
import paymentService from "../services/paymentService";
import authService from "../services/authService";
import { useToast } from "../components/common/Toast";

// ─── Constants ────────────────────────────────────────────────────────────────

// Cổng thanh toán user có thể chọn (giá trị `id` gửi lên BE làm paymentProvider).
const PAYMENT_PROVIDERS = [
  { id: "vnpay", label: "VNPay" },
  { id: "sepay", label: "SePay" },
];

// Thẻ "Miễn phí" mặc định (không phải gói bán, chỉ để so sánh). Các gói còn lại
// lấy từ GET /payments/plans do admin cấu hình, không còn hardcode.
const FREE_PLAN = {
  id: null,
  key: "free",
  name: "Miễn phí",
  price: 0,
  period: null,
  badge: null,
  featured: false,
  cta: "Gói mặc định",
  icon: Play,
  isTrial: false,
  isEligible: true,
  features: ["HD 720p", "1 thiết bị", "Kho phim cơ bản"],
  missing: ["Full HD / 4K", "Không quảng cáo", "Tải về xem offline"],
};

const periodOf = (days) =>
  days === 30 ? "/tháng" : days === 365 ? "/năm" : `/${days} ngày`;

/** Giá quy về mỗi tháng, để so sánh các gói có thời hạn khác nhau. */
const perMonth = (p) => (p.priceVnd * 30) / Math.max(1, p.durationDays);

/**
 * API → dữ liệu thẻ. Nhãn tiết kiệm: ưu tiên mức giảm so với giá gốc admin đặt;
 * nếu không có thì so giá/tháng với gói trả phí đắt nhất (chỉ khi chênh >= 5%).
 */
const buildPlans = (apiPlans) => {
  const paid = apiPlans.filter((p) => p.priceVnd > 0 && !p.isTrial);
  const ref = paid.length ? Math.max(...paid.map(perMonth)) : 0;

  return apiPlans.map((p) => {
    const free = p.priceVnd === 0;
    let badge = null;
    if (p.originalPriceVnd > p.priceVnd) {
      badge = `Giảm ${Math.round((1 - p.priceVnd / p.originalPriceVnd) * 100)}%`;
    } else if (!free && !p.isTrial && ref > 0) {
      const save = Math.round((1 - perMonth(p) / ref) * 100);
      if (save >= 5) badge = `Tiết kiệm ${save}%`;
    } else if (free) {
      badge = "Dùng thử";
    }

    return {
      id: p.planId,
      key: p.planId,
      name: p.name,
      description: p.description,
      price: p.priceVnd,
      originalPrice: p.originalPriceVnd,
      durationDays: p.durationDays,
      period: free ? null : periodOf(p.durationDays),
      badge,
      featured: !!p.isMostPopular,
      cta: free ? "Dùng thử miễn phí" : p.isMostPopular ? "Bắt đầu ngay" : "Chọn gói này",
      icon: free ? Zap : p.durationDays >= 300 ? Gift : Crown,
      isTrial: !!p.isTrial || free,
      isEligible: p.isEligible !== false,
      ineligibleReason: p.ineligibleReason || null,
      allowedEmailDomains: p.allowedEmailDomains || [],
      endsAt: p.endsAt,
      // ≈ giá/tháng cho gói dài hạn
      monthlyHint:
        !free && p.durationDays >= 300 ? Math.round(perMonth(p) / 100) * 100 : null,
      features: p.features || [],
    };
  });
};

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
    title: "Full HD / 4K",
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
    a: "Bạn có thể hủy gói Premium bất kỳ lúc nào ở trang Hồ sơ. Lưu ý: khi hủy, quyền Premium mất ngay lập tức và phần thời gian còn lại không được hoàn tiền.",
  },
  {
    q: "Thanh toán bằng phương thức nào?",
    a: "Bạn có thể chọn một trong hai cổng ngay trên trang này: VNPay (thẻ ATM nội địa, Visa, Mastercard, JCB) hoặc SePay (chuyển khoản qua mã QR ngân hàng và các phương thức khác tùy cổng hỗ trợ).",
  },
  {
    q: "Gói Năm có ưu điểm gì hơn Gói Tháng?",
    a: "Gói dài hạn thường có giá theo tháng rẻ hơn. Mức tiết kiệm và quyền lợi của từng gói được hiển thị ngay trên thẻ gói.",
  },
  {
    q: "Tiền có được hoàn lại nếu không hài lòng?",
    a: "Hiện chưa có chính sách hoàn tiền tự động: đơn thanh toán thành công sẽ không được hoàn lại. Nếu giao dịch gặp sự cố, vui lòng liên hệ hỗ trợ.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => (n === 0 ? "Miễn phí" : new Intl.NumberFormat("vi-VN").format(n) + "đ");

// Cache cấp module: sống qua các lần mount lại của trang (điều hướng Back/Forward trong SPA).
let plansCache = null; // danh sách gói gần nhất (đã qua buildPlans)
let subStatusCache = null; // kết quả getSubscriptionStatus gần nhất
let subStatusFetched = false; // đã từng gọi xong ít nhất một lần (kể cả lỗi / chưa đăng nhập)
let introPlayed = false; // animation xuất hiện của thẻ gói chỉ chạy một lần
const STYLE_ID = "premium-page-style";

/** Map subscriptionType từ API → plan.key
 *  BE trả { isPremium, subscriptionType, expiredAt, daysRemaining, isExpiringSoon }
 */
const mapSubTypeToKey = (subStatus) => {
  if (!subStatus?.isPremium) return "free";
  // planId của gói đã kích hoạt gần nhất; null khi admin cấp tay → không khớp thẻ nào.
  return subStatus.planId || "premium";
};

// ─── Sub-components ───────────────────────────────────────────────────────────

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
  skipIntro,
}) => {
  const PlanIcon = plan.icon;
  const isLoading = plan.id !== null && loading === plan.id;
  const isFree = plan.key === "free";
  const isYearly = plan.monthlyHint != null; // gói dài hạn: viền sáng hơn
  const isTrialFree = !isFree && plan.price === 0;

  // BE cộng dồn ngày từ ngày hết hạn → cho phép gia hạn khi còn Premium (không áp dụng gói dùng thử).
  const isRenewal = !isFree && !isTrialFree && subStatus?.isPremium === true;
  const notEligible = !isFree && !isCurrent && plan.isEligible === false;
  const isDisabled = isCurrent || isFree || subLoading || notEligible;

  const borderColor = isCurrent
    ? "rgba(70,211,105,0.5)"
    : plan.featured
      ? C.accent
      : isYearly
        ? C.borderBright
        : C.border;

  const ctaBg = isCurrent
    ? "transparent"
    : isFree
      ? "transparent"
      : plan.featured
        ? C.accent
        : "transparent";

  const ctaColor = isCurrent
    ? C.green
    : isFree
      ? C.textDim
      : plan.featured
        ? "#fff"
        : C.text;

  const ctaBorder = isCurrent
    ? "1px solid rgba(70,211,105,0.4)"
    : isFree
      ? `1px solid ${C.border}`
      : plan.featured
        ? "none"
        : `1px solid ${C.borderBright}`;

  return (
    <motion.div
      initial={skipIntro ? false : { opacity: 0, y: 14, scale: 0.98 }}
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
        opacity: (isFree && !isCurrent) || notEligible ? 0.72 : 1,
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
          {plan.originalPrice > plan.price && (
            <span
              style={{
                color: C.textDim,
                fontSize: 14,
                fontFamily: FONT_BODY,
                textDecoration: "line-through",
                marginRight: 6,
              }}
            >
              {fmt(plan.originalPrice)}
            </span>
          )}
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
              {isTrialFree && plan.durationDays ? (
                <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 500 }}>
                  {" "}
                  {plan.durationDays} ngày
                </span>
              ) : null}
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
            ≈ {fmt(plan.monthlyHint)}/tháng
          </p>
        )}

        {plan.description && (
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: 12.5,
              color: C.textSub,
              lineHeight: 1.6,
              margin: "10px 0 0",
            }}
          >
            {plan.description}
          </p>
        )}

        {plan.endsAt && (
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: 11.5,
              color: C.gold || C.textSub,
              margin: "8px 0 0",
            }}
          >
            Ưu đãi đến{" "}
            {new Date(
              /(Z|[+-]\d{2}:?\d{2})$/i.test(plan.endsAt) ? plan.endsAt : `${plan.endsAt}Z`
            ).toLocaleDateString("vi-VN")}
          </p>
        )}

        {plan.allowedEmailDomains?.length > 0 && (
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: 11.5,
              color: C.textSub,
              margin: "6px 0 0",
            }}
          >
            Dành cho email {plan.allowedEmailDomains.join(", ")}
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

      {isRenewal && (
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
            . Mua thêm sẽ được cộng dồn từ ngày hết hạn hiện tại.
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
              !isFree && <PlanIcon size={14} />
            )}
            {isCurrent
              ? "Gói hiện tại của bạn"
              : notEligible
                ? "Không khả dụng"
                : isRenewal
                  ? "Gia hạn"
                  : plan.cta}
          </>
        )}
      </motion.button>

      {notEligible && plan.ineligibleReason && (
        <p
          style={{
            margin: "10px 4px 0",
            fontFamily: FONT_BODY,
            fontSize: 11.5,
            lineHeight: 1.55,
            color: C.textSub,
            textAlign: "center",
          }}
        >
          {plan.ineligibleReason}
        </p>
      )}
    </motion.div>
  );
};

// ─── Checkout confirm modal ───────────────────────────────────────────────────
// Đơn hàng CHỈ được tạo khi bấm "Thanh toán" ở đây.

const CheckoutModal = ({
  plan,
  provider,
  onProviderChange,
  onConfirm,
  onClose,
  submitting,
  subStatus,
}) => {
  const confirmRef = useRef(null);
  const PlanIcon = plan.icon;
  const isFreeOrder = plan.price === 0; // gói dùng thử: kích hoạt ngay, không qua cổng
  const isRenewal = !isFreeOrder && subStatus?.isPremium === true;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submitting, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.66)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={SPRING}
        style={{
          width: "100%",
          maxWidth: 440,
          background: C.surfaceHigh,
          border: `1px solid ${C.borderMid}`,
          borderRadius: RADIUS.panel,
          padding: "28px 28px 24px",
          boxShadow: SHADOW.cardLift,
        }}
      >
        <h2
          id="checkout-title"
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 20,
            fontWeight: 800,
            color: "#fff",
            margin: "0 0 18px",
          }}
        >
          Xác nhận đăng ký
        </h2>

        {/* Tóm tắt gói */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "16px 18px",
            borderRadius: RADIUS.icon,
            background: C.surfaceCard,
            border: `1px solid ${C.border}`,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              fontFamily: FONT_DISPLAY,
              fontSize: 14,
              fontWeight: 700,
              color: C.text,
            }}
          >
            <PlanIcon size={15} color={C.accent} />
            {plan.name}
          </span>
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 18,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            {fmt(plan.price)}
            <span
              style={{
                fontFamily: FONT_BODY,
                fontSize: 12,
                fontWeight: 500,
                color: C.textSub,
              }}
            >
              {isFreeOrder ? ` · ${plan.durationDays} ngày` : plan.period}
            </span>
          </span>
        </div>

        {isRenewal && (
          <p
            style={{
              margin: "12px 2px 0",
              fontSize: 12,
              lineHeight: 1.6,
              color: C.textSub,
              fontFamily: FONT_BODY,
            }}
          >
            Gói Premium hiện tại còn hạn đến{" "}
            {subStatus?.expiredAt
              ? new Date(subStatus.expiredAt).toLocaleDateString("vi-VN")
              : "—"}
            . Thời gian mua thêm sẽ được cộng dồn từ ngày hết hạn đó.
          </p>
        )}

        {/* Cổng thanh toán (gói 0đ không cần) */}
        {!isFreeOrder && (
          <p
            style={{
              margin: "20px 0 8px",
              fontFamily: FONT_BODY,
              fontSize: 12,
              fontWeight: 600,
              color: C.textSub,
            }}
          >
            Thanh toán qua
          </p>
        )}
        <div
          role="radiogroup"
          aria-label="Chọn cổng thanh toán"
          style={{ display: isFreeOrder ? "none" : "flex", gap: 8 }}
        >
          {PAYMENT_PROVIDERS.map((p) => {
            const active = provider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={submitting}
                onClick={() => onProviderChange(p.id)}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  borderRadius: RADIUS.btn,
                  border: `1px solid ${active ? C.accent : C.borderMid}`,
                  background: active ? "rgba(229,9,20,0.12)" : "transparent",
                  color: active ? "#fff" : C.textSub,
                  fontFamily: FONT_BODY,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <p
          style={{
            margin: "16px 2px 0",
            fontSize: 11.5,
            lineHeight: 1.6,
            color: C.textDim,
            fontFamily: FONT_BODY,
          }}
        >
          {isFreeOrder
            ? "Gói dùng thử được kích hoạt ngay, không cần thanh toán. Mỗi tài khoản chỉ dùng thử một lần, kể cả khi bạn hủy giữa chừng."
            : "Bạn sẽ được chuyển tới cổng thanh toán. Đơn chỉ được tạo khi bạn bấm “Thanh toán” và có hiệu lực trong 15 phút."}
        </p>

        {/* Hành động */}
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              flex: 1,
              padding: "14px 0",
              borderRadius: RADIUS.btn,
              border: `1px solid ${C.borderBright}`,
              background: "transparent",
              color: C.text,
              fontFamily: FONT_BODY,
              fontSize: 14,
              fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.5 : 1,
            }}
          >
            Quay lại
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            style={{
              flex: 1.4,
              padding: "14px 0",
              borderRadius: RADIUS.btn,
              border: "none",
              background: C.accent,
              color: "#fff",
              fontFamily: FONT_BODY,
              fontSize: 14,
              fontWeight: 700,
              cursor: submitting ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {submitting ? (
              <>
                <span
                  style={{
                    width: 15,
                    height: 15,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.35)",
                    borderTopColor: "#fff",
                    animation: "spin 0.7s linear infinite",
                    display: "inline-block",
                  }}
                />
                {isFreeOrder ? "Đang kích hoạt…" : "Đang chuyển hướng…"}
              </>
            ) : isFreeOrder ? (
              "Kích hoạt dùng thử"
            ) : (
              `Thanh toán ${fmt(plan.price)}`
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const PremiumPage = () => {
  const [loading, setLoading] = useState(null); // planId đang tạo đơn / chuyển hướng
  const [provider, setProvider] = useState(PAYMENT_PROVIDERS[0].id);
  const [selectedPlan, setSelectedPlan] = useState(null); // gói đang mở hộp thoại xác nhận
  const toast = useToast();
  const navigate = useNavigate();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const [openFaq, setOpenFaq] = useState(null);
  // Gói đang bán lấy từ BE (cache để quay lại trang không nháy)
  const [plans, setPlans] = useState(plansCache);
  const [plansLoading, setPlansLoading] = useState(!plansCache);
  const [plansError, setPlansError] = useState(false);
  const [subStatus, setSubStatus] = useState(subStatusCache);
  // Chỉ hiện trạng thái "đang tải" ở lần đầu; các lần quay lại dùng cache và cập nhật ngầm.
  const [subLoading, setSubLoading] = useState(!subStatusFetched);
  const redirectingRef = useRef(false); // đã đẩy người dùng sang cổng thanh toán
  const aliveRef = useRef(true);
  const skipIntro = useRef(introPlayed).current;

  useEffect(() => {
    aliveRef.current = true;
    introPlayed = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // Inject font/keyframes MỘT lần và giữ lại: gỡ rồi chèn lại mỗi lần mount làm font nháy.
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      ${GOOGLE_FONTS}
      @keyframes spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await paymentService.getSubscriptionStatus();
      subStatusCache = res;
      if (aliveRef.current) setSubStatus(res);
    } catch {
      // Lỗi mạng thoáng qua: giữ dữ liệu cũ nếu có, không làm trang nhảy về "Free".
      if (aliveRef.current && !subStatusCache) setSubStatus(null);
    } finally {
      subStatusFetched = true;
      if (aliveRef.current) setSubLoading(false);
    }
  }, []);

  // Gửi kèm token nên BE trả isEligible / ineligibleReason cho từng gói.
  const refreshPlans = useCallback(async () => {
    try {
      const res = await paymentService.getPlans();
      const built = buildPlans(Array.isArray(res) ? res : []);
      plansCache = built;
      if (aliveRef.current) {
        setPlans(built);
        setPlansError(false);
      }
    } catch {
      if (aliveRef.current && !plansCache) setPlansError(true);
    } finally {
      if (aliveRef.current) setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    refreshPlans();
  }, [refreshStatus, refreshPlans]);

  // Quay lại bằng nút Back từ cổng thanh toán: trình duyệt có thể khôi phục trang từ bfcache
  // với state cũ (spinner đang quay, nút bị khóa). Reset lại và làm mới trạng thái gói.
  useEffect(() => {
    const onPageShow = (e) => {
      if (!e.persisted) return;
      if (redirectingRef.current) {
        redirectingRef.current = false;
        setLoading(null);
        setSelectedPlan(null);
        toastRef.current?.info?.(
          "Bạn chưa hoàn tất thanh toán. Có thể chọn lại gói bất cứ lúc nào."
        );
      }
      refreshStatus();
      refreshPlans();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [refreshStatus, refreshPlans]);

  const currentPlanKey = subLoading ? null : mapSubTypeToKey(subStatus);

  const salePlans = plans ?? [];
  const displayPlans = [FREE_PLAN, ...salePlans];
  const paidPlans = salePlans.filter((p) => p.price > 0);
  const hasPaid = paidPlans.length > 0;
  // "Chỉ từ": giá/tháng thấp nhất trong các gói trả phí (hiển thị theo đơn vị gói đó)
  const cheapest = hasPaid
    ? paidPlans.reduce((a, b) =>
        (a.price * 30) / (a.durationDays || 30) <= (b.price * 30) / (b.durationDays || 30) ? a : b
      )
    : null;
  // Nút CTA cuối trang: gói nổi bật (hoặc gói trả phí đầu tiên) + gói tiết kiệm nhất còn lại
  const ctaPrimary = paidPlans.find((p) => p.featured) ?? paidPlans[0] ?? null;
  const ctaSecondary =
    paidPlans.find((p) => p.id !== ctaPrimary?.id && p.badge?.startsWith("Tiết kiệm")) ?? null;

  // Bước 1: chỉ MỞ hộp thoại xác nhận — chưa tạo đơn.
  const openCheckout = useCallback(
    (plan) => {
      if (loading || plan.id === null) return;
      setSelectedPlan(plan);
    },
    [loading]
  );

  const closeCheckout = useCallback(() => {
    if (loading) return; // đang tạo đơn / chuyển hướng thì không cho đóng
    setSelectedPlan(null);
  }, [loading]);

  // Bước 2: người dùng bấm "Thanh toán" → mới tạo đơn và chuyển sang cổng.
  const confirmPayment = async () => {
    if (loading || !selectedPlan?.id) return;

    setLoading(selectedPlan.id);
    try {
      const result = await paymentService.createOrder({
        planId: selectedPlan.id,
        paymentProvider: provider,
      });
      // Gói 0đ / dùng thử: BE đã kích hoạt xong, không có URL thanh toán → làm mới trạng thái
      // rồi chuyển thẳng tới trang kết quả.
      if (result?.paymentMethod === "none") {
        try {
          await authService.refreshPremiumStatus();
        } catch {
          /* làm mới lỗi không làm việc kích hoạt bị coi là thất bại */
        }
        subStatusCache = null;
        toast.success?.("Đã kích hoạt gói dùng thử!");
        setSelectedPlan(null);
        setLoading(null);
        navigate(
          `/payment/result?status=success&orderCode=${encodeURIComponent(result.orderCode ?? "")}`
        );
        return;
      }
      if (!result?.paymentUrl) throw new Error("Không nhận được URL thanh toán.");
      redirectingRef.current = true;
      // VNPay: chuyển trang; SePay: POST form có chữ ký. Giữ `loading` để chặn bấm đúp
      // cho tới khi trình duyệt rời trang (hoặc được reset ở `pageshow` khi quay lại).
      paymentService.redirectToPayment(result);
    } catch (err) {
      toast.error(
        err.message || "Không thể tạo đơn thanh toán. Vui lòng thử lại."
      );
      setLoading(null); // giữ hộp thoại mở để người dùng thử lại
      refreshPlans(); // gói có thể vừa ngừng bán / hết lượt: cập nhật lại điều kiện
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
          {cheapest && (
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
                {fmt(cheapest.price)}
                <span style={{ fontSize: 14, fontWeight: 600 }}>{cheapest.period}</span>
              </span>
            </div>
          </motion.div>
          )}

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
              { icon: Star, text: "Thanh toán qua VNPay / SePay" },
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
        {hasPaid && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 44,
          }}
        >
          <div
            role="radiogroup"
            aria-label="Chọn cổng thanh toán"
            style={{
              display: "inline-flex",
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 6,
              padding: 5,
              borderRadius: RADIUS.chip,
              background: C.surfaceCard,
              border: `1px solid ${C.border}`,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "0 8px 0 14px",
                color: C.textSub,
                fontFamily: FONT_BODY,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <Lock size={11} color={C.textDim} />
              Thanh toán bảo mật qua
            </span>
            {PAYMENT_PROVIDERS.map((p) => {
              const active = provider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={!!loading}
                  onClick={() => setProvider(p.id)}
                  style={{
                    padding: "7px 18px",
                    borderRadius: RADIUS.chip,
                    border: "none",
                    background: active ? C.accent : "transparent",
                    color: active ? "#fff" : C.textSub,
                    fontFamily: FONT_BODY,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading && !active ? 0.5 : 1,
                    transition: "background 0.2s ease, color 0.2s ease",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
        )}

        {plansLoading && !plans ? (
          <p
            style={{
              textAlign: "center",
              color: C.textSub,
              fontFamily: FONT_BODY,
              fontSize: 14,
              padding: "40px 0",
            }}
          >
            Đang tải các gói…
          </p>
        ) : plansError && !plans ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ color: C.textSub, fontFamily: FONT_BODY, fontSize: 14, margin: "0 0 14px" }}>
              Không tải được danh sách gói. Vui lòng thử lại.
            </p>
            <button
              type="button"
              onClick={() => {
                setPlansLoading(true);
                setPlansError(false);
                refreshPlans();
              }}
              style={{
                padding: "11px 26px",
                borderRadius: RADIUS.btn,
                border: `1px solid ${C.borderBright}`,
                background: "transparent",
                color: C.text,
                fontFamily: FONT_BODY,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
              gap: 22,
              alignItems: "stretch",
            }}
          >
            {displayPlans.map((plan) => (
              <PlanCard
                key={plan.key}
                plan={plan}
                loading={loading}
                onSubscribe={openCheckout}
                skipIntro={skipIntro}
                isCurrent={currentPlanKey === plan.key}
                subLoading={subLoading}
                subStatus={subStatus}
              />
            ))}
          </div>
        )}
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
            Tham gia cộng đồng người dùng đang thưởng thức kho phim không giới
            hạn.
            <br />Kích hoạt ngay sau khi thanh toán thành công.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {ctaPrimary && (
            <motion.button
              onClick={() => openCheckout(ctaPrimary)}
              disabled={!!loading || ctaPrimary.isEligible === false}
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
              Đăng ký {ctaPrimary.name}
            </motion.button>
            )}

            {ctaSecondary && (
            <motion.button
              onClick={() => openCheckout(ctaSecondary)}
              disabled={!!loading || ctaSecondary.isEligible === false}
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
              {ctaSecondary.badge} — {ctaSecondary.name}
            </motion.button>
            )}
          </div>
        </div>
      </section>

      {/* ══ XÁC NHẬN THANH TOÁN ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedPlan && (
          <CheckoutModal
            key="checkout"
            plan={selectedPlan}
            provider={provider}
            onProviderChange={setProvider}
            onConfirm={confirmPayment}
            onClose={closeCheckout}
            submitting={!!loading}
            subStatus={subStatus}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PremiumPage;