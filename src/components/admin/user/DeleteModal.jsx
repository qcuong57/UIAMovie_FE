import React from "react";
import { AnimatePresence } from "framer-motion";
import {
  Trash2,
  AlertCircle,
} from "lucide-react";
import { T, FONT_BODY as FONT } from "../../../context/adminTokens";
import { Backdrop, ModalMotion, CloseBtn, ConfirmBtn, CancelBtn } from "./shared";

export const DeleteModal = ({ user, onClose, onConfirm, loading }) => (
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
                  background: "#FEF2F2",
                  border: "1px solid rgba(220,38,38,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trash2 size={15} color="#DC2626" />
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
                  Xóa người dùng
                </h3>
              </div>
            </div>
            <CloseBtn onClose={onClose} />
          </div>

          {/* Body */}
          <div style={{ padding: "20px", background: T.bg }}>
            {/* User card */}
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                background: T.surface,
                border: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
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
                      fontSize: 16,
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
                    fontSize: 14,
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

            {/* Warning */}
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                background: "#FEF2F2",
                border: "1px solid rgba(220,38,38,0.18)",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <AlertCircle
                size={15}
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
                Tài khoản và toàn bộ dữ liệu liên quan sẽ bị xóa vĩnh viễn.{" "}
                <strong>Hành động này không thể hoàn tác.</strong>
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
              bg="#DC2626"
              color="white"
              icon={Trash2}
              label="Xóa tài khoản"
            />
          </div>
        </ModalMotion>
      </>
    )}
  </AnimatePresence>
);
