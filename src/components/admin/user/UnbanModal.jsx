import React from "react";
import { AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
} from "lucide-react";
import { T, FONT_BODY as FONT } from "../../../context/adminTokens";
import { Backdrop, ModalMotion, CloseBtn, ConfirmBtn, CancelBtn } from "./shared";

export const UnbanModal = ({ user, onClose, onConfirm, loading }) => (
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
                  background: "#F0FDF4",
                  border: "1px solid rgba(22,163,74,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldCheck size={15} color="#16A34A" />
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
                  Mở khóa tài khoản
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
                  background: "linear-gradient(135deg, #9CA3AF, #6B7280)",
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
                    color: T.textMuted,
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

            {/* Ban reason chip (if any) */}
            {user?.banReason && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#FEF2F2",
                  border: "1px solid rgba(220,38,38,0.18)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT,
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: "#DC2626",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                  }}
                >
                  Lý do khóa
                </span>
                <p
                  style={{
                    fontFamily: FONT,
                    fontSize: 12.5,
                    color: "#991B1B",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {user.banReason}
                </p>
              </div>
            )}

            {/* Confirm note */}
            <div
              style={{
                padding: "11px 14px",
                borderRadius: 10,
                background: "#F0FDF4",
                border: "1px solid rgba(22,163,74,0.18)",
                display: "flex",
                gap: 9,
                alignItems: "flex-start",
              }}
            >
              <ShieldCheck
                size={14}
                color="#16A34A"
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: 12.5,
                  color: "#14532D",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                User sẽ có thể đăng nhập lại bình thường sau khi được mở khóa.
              </p>
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
              bg="#16A34A"
              color="white"
              icon={ShieldCheck}
              label="Mở khóa"
            />
          </div>
        </ModalMotion>
      </>
    )}
  </AnimatePresence>
);
