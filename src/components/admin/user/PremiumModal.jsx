import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Crown,
  CalendarClock,
} from "lucide-react";
import { T, FONT_BODY as FONT } from "../../../context/adminTokens";
import { Backdrop, ModalMotion, CloseBtn, ConfirmBtn, CancelBtn } from "./shared";
import { SubBadge } from "./badges";

const PLAN_OPTS = [
  { value: "monthly_premium", label: "Premium · Tháng (1 tháng)" },
  { value: "yearly_premium", label: "Premium · Năm  (1 năm)" },
];

// YYYY-MM-DD theo giờ MÁY (toISOString sẽ lệch ngày vì dùng UTC).
const toLocalDateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const defaultExpiry = (planId) => {
  const d = new Date();
  if (planId === "yearly_premium") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return toLocalDateStr(d);
};

export const PremiumModal = ({ user, onClose, onConfirm, loading }) => {
  const [tab, setTab] = useState("grant"); // 'grant' | 'revoke'
  const [planId, setPlanId] = useState("monthly_premium");
  const [expiredAt, setExpiredAt] = useState(defaultExpiry("monthly_premium"));
  const [hasSub, setHasSub] = useState(false);

  useEffect(() => {
    if (user) {
      const cur = user.subscriptionType;
      const active = !!cur;
      const plan =
        cur === "yearly_premium" ? "yearly_premium" : "monthly_premium";
      setHasSub(active);
      setPlanId(plan);
      setExpiredAt(
        user.subscriptionExpiredAt
          ? toLocalDateStr(new Date(user.subscriptionExpiredAt))
          : defaultExpiry(plan),
      );
      setTab(active ? "revoke" : "grant");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handlePlanChange = (val) => {
    setPlanId(val);
    setExpiredAt(defaultExpiry(val));
  };

  return (
    <AnimatePresence>
      {!!user && (
        <>
          <Backdrop onClose={onClose} />
          <ModalMotion>
            {/* Header */}
            <div
              style={{
                padding: "18px 20px",
                borderBottom: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    flexShrink: 0,
                    background: "#FFFBEB",
                    border: "1px solid rgba(217,119,6,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Crown size={15} color="#D97706" />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 10.5,
                      color: T.textMuted,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    Premium
                  </p>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: T.text,
                      margin: 0,
                    }}
                  >
                    Quản lý Subscription
                  </h3>
                </div>
              </div>
              <CloseBtn onClose={onClose} />
            </div>

            {/* Body */}
            <div
              style={{
                padding: "20px",
                background: T.bg,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* User card */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    flexShrink: 0,
                    background: `linear-gradient(135deg, ${T.accent}, ${T.accentText})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontFamily: FONT,
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      {user?.username?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: FONT,
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: T.text,
                      margin: 0,
                    }}
                  >
                    {user?.username}
                  </p>
                  <p
                    style={{
                      fontFamily: FONT,
                      fontSize: 12,
                      color: T.textMuted,
                      margin: 0,
                    }}
                  >
                    {user?.email}
                  </p>
                </div>
                {hasSub && (
                  <SubBadge
                    sub={user.subscriptionType}
                    expiredAt={user.subscriptionExpiredAt}
                  />
                )}
              </div>

              {/* Tab switcher: Grant / Revoke */}
              <div
                style={{
                  display: "flex",
                  borderRadius: 10,
                  overflow: "hidden",
                  border: `1px solid ${T.border}`,
                  background: T.surface,
                }}
              >
                {[
                  ["grant", "Cấp / Gia hạn"],
                  ["revoke", "Thu hồi"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    disabled={key === "revoke" && !hasSub}
                    style={{
                      flex: 1,
                      padding: "9px 0",
                      border: "none",
                      cursor:
                        key === "revoke" && !hasSub ? "not-allowed" : "pointer",
                      fontFamily: FONT,
                      fontSize: 12.5,
                      fontWeight: 600,
                      background:
                        tab === key
                          ? key === "revoke"
                            ? "#FEF2F2"
                            : T.accentLight
                          : "transparent",
                      color:
                        tab === key
                          ? key === "revoke"
                            ? "#DC2626"
                            : T.accentText
                          : T.textMuted,
                      transition: "all 0.15s",
                      opacity: key === "revoke" && !hasSub ? 0.4 : 1,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === "grant" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {/* Plan selector */}
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    <label
                      style={{
                        fontFamily: FONT,
                        fontSize: 11,
                        fontWeight: 700,
                        color: T.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      Gói
                    </label>
                    <div data-admin-stack="" style={{ display: "flex", gap: 8 }}>
                      {PLAN_OPTS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handlePlanChange(opt.value)}
                          style={{
                            flex: 1,
                            padding: "10px 12px",
                            borderRadius: 10,
                            cursor: "pointer",
                            fontFamily: FONT,
                            fontSize: 12.5,
                            fontWeight: 600,
                            background:
                              planId === opt.value ? T.accentLight : T.surface,
                            border: `1px solid ${planId === opt.value ? `${T.accent}40` : T.border}`,
                            color:
                              planId === opt.value ? T.accentText : T.textSub,
                            transition: "all 0.15s",
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Expiry date */}
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    <label
                      style={{
                        fontFamily: FONT,
                        fontSize: 11,
                        fontWeight: 700,
                        color: T.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <CalendarClock size={12} /> Ngày hết hạn
                    </label>
                    <input
                      type="date"
                      value={expiredAt}
                      onChange={(e) => setExpiredAt(e.target.value)}
                      min={toLocalDateStr(new Date())}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: `1px solid ${T.border}`,
                        background: T.surface,
                        fontFamily: FONT,
                        fontSize: 13.5,
                        color: T.text,
                        outline: "none",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      padding: "11px 14px",
                      borderRadius: 10,
                      background: T.accentLight,
                      border: `1px solid ${T.accent}25`,
                      display: "flex",
                      gap: 9,
                      alignItems: "flex-start",
                    }}
                  >
                    <Crown
                      size={13}
                      color={T.accent}
                      style={{ flexShrink: 0, marginTop: 1 }}
                    />
                    <p
                      style={{
                        fontFamily: FONT,
                        fontSize: 12.5,
                        color: T.accentText,
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {hasSub
                        ? "Ngày hết hạn sẽ được đặt đúng bằng ngày bạn chọn (hết ngày đó), không cộng dồn vào thời gian còn lại."
                        : "User sẽ được kích hoạt Premium ngay lập tức."}
                    </p>
                  </div>
                </div>
              )}

              {tab === "revoke" && (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "#FEF2F2",
                    border: "1px solid rgba(220,38,38,0.18)",
                    display: "flex",
                    gap: 9,
                    alignItems: "flex-start",
                  }}
                >
                  <AlertCircle
                    size={14}
                    color="#DC2626"
                    style={{ flexShrink: 0, marginTop: 1 }}
                  />
                  <p
                    style={{
                      fontFamily: FONT,
                      fontSize: 12.5,
                      color: "#991B1B",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    Subscription của user sẽ bị{" "}
                    <strong>thu hồi ngay lập tức</strong>. User sẽ mất quyền
                    truy cập Premium.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "14px 20px",
                borderTop: `1px solid ${T.border}`,
                background: T.surface,
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <CancelBtn onClick={onClose} />
              {tab === "grant" && (
                <ConfirmBtn
                  onClick={() =>
                    onConfirm({
                      planId,
                      expiredAt: new Date(
                        `${expiredAt}T23:59:59`,
                      ).toISOString(),
                      revoke: false,
                    })
                  }
                  loading={loading}
                  bg={T.accent}
                  color="white"
                  icon={Crown}
                  label={hasSub ? "Gia hạn" : "Cấp Premium"}
                />
              )}
              {tab === "revoke" && (
                <ConfirmBtn
                  onClick={() => onConfirm({ revoke: true })}
                  loading={loading}
                  bg="#DC2626"
                  color="white"
                  icon={AlertCircle}
                  label="Thu hồi Premium"
                />
              )}
            </div>
          </ModalMotion>
        </>
      )}
    </AnimatePresence>
  );
};
