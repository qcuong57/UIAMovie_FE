import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Ban,
} from "lucide-react";
import { T, FONT_BODY as FONT } from "../../../context/adminTokens";
import { Backdrop, ModalMotion, CloseBtn, ConfirmBtn, CancelBtn } from "./shared";

export const BanModal = ({
  user,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
  loading,
}) => {
  const [focused, setFocused] = useState(false);
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
                    background: "#FFF7ED",
                    border: "1px solid rgba(234,88,12,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ban size={15} color="#EA580C" />
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
                    Xác nhận
                  </p>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: T.text,
                      margin: 0,
                    }}
                  >
                    Khóa tài khoản
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
                <div>
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
              </div>

              {/* Info note */}
              <div
                style={{
                  padding: "11px 14px",
                  borderRadius: 10,
                  background: "#FFF7ED",
                  border: "1px solid rgba(234,88,12,0.18)",
                  display: "flex",
                  gap: 9,
                  alignItems: "flex-start",
                }}
              >
                <AlertCircle
                  size={14}
                  color="#EA580C"
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
                <p
                  style={{
                    fontFamily: FONT,
                    fontSize: 12.5,
                    color: "#9A3412",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  User sẽ bị đăng xuất ngay lập tức và không thể đăng nhập cho
                  đến khi được mở khóa.
                </p>
              </div>

              {/* Reason */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
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
                  Lý do khóa (tùy chọn)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => onReasonChange(e.target.value)}
                  placeholder="Nhập lý do khóa tài khoản..."
                  rows={3}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: T.surface,
                    border: `1px solid ${focused ? "rgba(234,88,12,0.4)" : T.border}`,
                    color: T.text,
                    outline: "none",
                    fontFamily: FONT,
                    fontSize: 13.5,
                    resize: "vertical",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                />
              </div>
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
              <ConfirmBtn
                onClick={onConfirm}
                loading={loading}
                bg="#EA580C"
                color="white"
                icon={Ban}
                label="Khóa tài khoản"
              />
            </div>
          </ModalMotion>
        </>
      )}
    </AnimatePresence>
  );
};
