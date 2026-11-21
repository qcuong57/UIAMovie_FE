import React from "react";
import { motion } from "framer-motion";
import {
  Trash2,
  AlertCircle,
  Shield,
  Eye,
  Pencil,
  Search,
  Ban,
  ShieldCheck,
  Crown,
  CalendarClock,
} from "lucide-react";
import { T, FONT_BODY as FONT } from "../../../context/adminTokens";
import { RoleBadge, SubBadge, BannedBadge } from "./badges";
import { ActionBtn } from "./ActionBtn";
import { errMsg } from "./userUtils";

const shimmerBg = `linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.surfaceHov} 50%, ${T.surfaceAlt} 75%)`;

const SkeletonBar = ({ w, h = 13, delay = 0 }) => (
  <div
    style={{
      height: h,
      width: w,
      maxWidth: "100%",
      borderRadius: 6,
      background: shimmerBg,
      backgroundSize: "400px 100%",
      animation: `shimmer 1.4s infinite ${delay}s`,
    }}
  />
);

const cardBox = {
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  boxShadow: T.shadow,
};

const UserCard = ({ u, index, isMe, h }) => {
  const isBanned = u.isActive === false;
  const initials = u.username?.[0]?.toUpperCase() ?? "U";
  const BTN = 38; // vùng chạm ≥ 36px

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: isBanned ? 0.85 : 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.025 }}
      style={{
        ...cardBox,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Hàng trên: avatar + tên/email + role */}
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 11,
            flexShrink: 0,
            overflow: "hidden",
            background: isBanned
              ? "linear-gradient(135deg, #9CA3AF, #6B7280)"
              : `linear-gradient(135deg, ${T.accent}, ${T.accentText})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {u.avatarUrl ? (
            <img
              src={u.avatarUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
              {initials}
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <p
              style={{
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: 600,
                color: isBanned ? T.textMuted : T.text,
                margin: 0,
                minWidth: 0,
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {u.username}
            </p>
            {isBanned && <BannedBadge />}
            {isMe && (
              <span
                style={{
                  fontFamily: FONT,
                  fontSize: 10.5,
                  color: T.accent,
                  fontWeight: 600,
                }}
              >
                Bạn
              </span>
            )}
          </div>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 12.5,
              color: T.textSub,
              margin: "2px 0 0",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {u.email}
          </p>
        </div>

        <div style={{ flexShrink: 0 }}>
          <RoleBadge role={u.role} />
        </div>
      </div>

      {/* Lý do khóa */}
      {isBanned && u.banReason && (
        <p
          style={{
            fontFamily: FONT,
            fontSize: 12,
            color: "#991B1B",
            lineHeight: 1.5,
            margin: 0,
            padding: "8px 12px",
            borderRadius: 9,
            background: "#FEF2F2",
            border: "1px solid rgba(220,38,38,0.18)",
            overflowWrap: "anywhere",
          }}
        >
          Lý do khóa: {u.banReason}
        </p>
      )}

      {/* Subscription + ngày tạo */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <SubBadge sub={u.subscriptionType} expiredAt={u.subscriptionExpiredAt} />
        <span
          style={{
            fontFamily: FONT,
            fontSize: 12,
            color: T.textMuted,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            whiteSpace: "nowrap",
          }}
        >
          <CalendarClock size={11} />
          {u.createdAt
            ? new Date(u.createdAt).toLocaleDateString("vi-VN")
            : "—"}
        </span>
      </div>

      {/* Hành động */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          paddingTop: 12,
          borderTop: `1px solid ${T.border}`,
        }}
      >
        <ActionBtn
          size={BTN}
          icon={Eye}
          onClick={() => h.onView(u)}
          title="Xem chi tiết"
        />
        {!isMe && (
          <>
            <ActionBtn
              size={BTN}
              icon={Pencil}
              variant="edit"
              onClick={() => h.onEdit(u)}
              title="Chỉnh sửa"
            />
            <ActionBtn
              size={BTN}
              icon={Shield}
              variant="shield"
              onClick={() => h.onRole(u)}
              title="Đổi role"
            />
            {isBanned ? (
              <ActionBtn
                size={BTN}
                icon={ShieldCheck}
                variant="unban"
                onClick={() => h.onUnban(u)}
                title="Mở khóa tài khoản"
              />
            ) : (
              <ActionBtn
                size={BTN}
                icon={Ban}
                variant="ban"
                onClick={() => h.onBan(u)}
                title="Khóa tài khoản"
              />
            )}
            <ActionBtn
              size={BTN}
              icon={Crown}
              variant="premium"
              onClick={() => h.onPremium(u)}
              title="Quản lý Premium"
            />
            <ActionBtn
              size={BTN}
              icon={Trash2}
              variant="danger"
              onClick={() => h.onDelete(u)}
              title="Xóa"
            />
          </>
        )}
      </div>
    </motion.div>
  );
};

export const MobileUserList = ({
  loading,
  isError,
  error,
  refetch,
  users,
  isPlaceholderData,
  me,
  h,
}) => {
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              ...cardBox,
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 11,
                  flexShrink: 0,
                  background: shimmerBg,
                  backgroundSize: "400px 100%",
                  animation: "shimmer 1.4s infinite",
                }}
              />
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 7,
                }}
              >
                <SkeletonBar w={130} />
                <SkeletonBar w={180} h={11} delay={0.1} />
              </div>
            </div>
            <SkeletonBar w={110} h={22} delay={0.15} />
            <SkeletonBar w="100%" h={38} delay={0.2} />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ ...cardBox, padding: "40px 16px", textAlign: "center" }}>
        <AlertCircle
          size={22}
          color={T.red}
          style={{ margin: "0 auto 10px", display: "block" }}
        />
        <p
          style={{
            fontFamily: FONT,
            fontSize: 13.5,
            color: T.red,
            margin: "0 0 12px",
          }}
        >
          {errMsg(error, "Không tải được danh sách người dùng")}
        </p>
        <button
          onClick={() => refetch()}
          style={{
            padding: "9px 18px",
            borderRadius: 8,
            background: T.surface,
            border: `1px solid ${T.border}`,
            cursor: "pointer",
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 600,
            color: T.textSub,
          }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div style={{ ...cardBox, padding: "48px 16px", textAlign: "center" }}>
        <Search
          size={22}
          color={T.textMuted}
          style={{ margin: "0 auto 10px", opacity: 0.3, display: "block" }}
        />
        <p
          style={{
            fontFamily: FONT,
            fontSize: 13.5,
            color: T.textMuted,
            margin: 0,
          }}
        >
          Không tìm thấy user nào
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        opacity: isPlaceholderData ? 0.55 : 1,
        transition: "opacity 0.15s",
      }}
    >
      {users.map((u, i) => (
        <UserCard key={u.id} u={u} index={i} isMe={u.id === me?.id} h={h} />
      ))}
    </div>
  );
};
