import React from "react";
import { AnimatePresence } from "framer-motion";
import {
  Shield,
  Check,
} from "lucide-react";
import { T, FONT_BODY as FONT } from "../../../context/adminTokens";
import { Backdrop, ModalMotion, CloseBtn, ConfirmBtn, CancelBtn } from "./shared";

export const ShieldModal = ({ user, newRole, onClose, onConfirm, loading }) => {
  const toAdmin = newRole?.toLowerCase() === "admin";
  const accent = toAdmin ? T.accent : "#6B7280";
  const accentBg = toAdmin ? T.accentLight : "#F3F4F6";
  const accentBorder = toAdmin ? `${T.accent}30` : "rgba(107,114,128,0.25)";

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
                    background: accentBg,
                    border: `1px solid ${accentBorder}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Shield size={15} color={accent} />
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
                    Đổi quyền người dùng
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

              {/* Role change arrow */}
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                }}
              >
                {/* Current role */}
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontFamily: FONT,
                      fontSize: 10.5,
                      color: T.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      fontWeight: 600,
                      marginBottom: 6,
                      marginTop: 0,
                    }}
                  >
                    Hiện tại
                  </p>
                  <span
                    style={{
                      fontFamily: FONT,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 12px",
                      borderRadius: 99,
                      background: !toAdmin ? T.accentLight : T.bg,
                      border: `1px solid ${!toAdmin ? `${T.accent}30` : T.border}`,
                      color: !toAdmin ? T.accentText : T.textSub,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    {!toAdmin && <Shield size={10} />}
                    {toAdmin ? "User" : "Admin"}
                  </span>
                </div>

                {/* Arrow */}
                <div
                  style={{
                    color: T.textMuted,
                    fontSize: 18,
                    fontWeight: 300,
                    marginTop: 8,
                  }}
                >
                  →
                </div>

                {/* New role */}
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontFamily: FONT,
                      fontSize: 10.5,
                      color: T.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      fontWeight: 600,
                      marginBottom: 6,
                      marginTop: 0,
                    }}
                  >
                    Sẽ đổi thành
                  </p>
                  <span
                    style={{
                      fontFamily: FONT,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 12px",
                      borderRadius: 99,
                      background: accentBg,
                      border: `1px solid ${accentBorder}`,
                      color: accent,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    {toAdmin && <Shield size={10} />}
                    {newRole}
                  </span>
                </div>
              </div>

              {/* Warning for promoting to Admin */}
              {toAdmin && (
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
                  <Shield
                    size={14}
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
                    Admin có toàn quyền quản lý hệ thống. Hãy chắc chắn trước
                    khi cấp quyền này.
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
              <ConfirmBtn
                onClick={onConfirm}
                loading={loading}
                bg={accent}
                color="white"
                icon={Check}
                label="Xác nhận"
              />
            </div>
          </ModalMotion>
        </>
      )}
    </AnimatePresence>
  );
};
