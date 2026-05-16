// src/components/admin/dashboard/UserRow.jsx
import React from "react";
import { motion } from "framer-motion";
import {
  T,
  ACCENT4,
  ACCENT5,
  ACCENT2,
  FONT_BODY as FONT,
  FONT_TITLE,
} from "../../../context/adminTokens";
import { fmtDateTime } from "../../../helper/format";

const ONLINE_THRESHOLD_MS = 1000 * 60 * 60 * 24; // 24 h

export const UserRow = ({ user, index }) => {
  const initials = (user.username ?? user.name ?? "?")
    .slice(0, 2)
    .toUpperCase();
  const isOnline =
    user.lastLoginAt &&
    Date.now() - new Date(user.lastLoginAt).getTime() < ONLINE_THRESHOLD_MS;

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.03 + index * 0.025 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 0",
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      {/* Avatar */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              objectFit: "cover",
              border: `2px solid ${T.border}`,
            }}
          />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${ACCENT5} 0%, ${ACCENT2} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT_TITLE,
              fontSize: 11,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            {initials}
          </div>
        )}
        {isOnline && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#22C55E",
              border: `2px solid ${T.surface}`,
            }}
          />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: FONT_TITLE,
            fontSize: 12.5,
            fontWeight: 700,
            color: T.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: 2,
          }}
        >
          {user.username ?? user.name}
        </p>
        <p
          style={{
            fontFamily: FONT,
            fontSize: 10.5,
            color: T.textMuted,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {user.email}
        </p>
      </div>

      {/* Meta */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        {user.subscriptionType && (
          <span
            style={{
              fontFamily: FONT,
              fontSize: 9.5,
              fontWeight: 700,
              color: ACCENT4,
              background: "#FEF3C7",
              border: "1px solid #FDE68A",
              padding: "1px 6px",
              borderRadius: 99,
              display: "block",
              marginBottom: 3,
            }}
          >
            Premium
          </span>
        )}
        <p
          style={{
            fontFamily: FONT,
            fontSize: 10,
            color: T.textMuted,
            margin: 0,
          }}
        >
          {fmtDateTime(user.lastLoginAt ?? user.lastActiveAt)}
        </p>
      </div>
    </motion.div>
  );
};
