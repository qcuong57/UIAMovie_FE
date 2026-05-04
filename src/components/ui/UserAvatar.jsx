// src/components/ui/UserAvatar.jsx
import React from "react";

/**
 * UserAvatar — hiển thị avatar người dùng.
 * Nếu có `avatarUrl` thì render ảnh, ngược lại hiển thị ký tự đầu tên.
 *
 * @param {string}  avatarUrl   - URL ảnh avatar (tuỳ chọn)
 * @param {string}  name        - Tên người dùng (dùng để lấy chữ cái đầu)
 * @param {number}  size        - Kích thước px (mặc định 28)
 * @param {number}  borderRadius- Bo góc px (mặc định 8)
 * @param {string}  className   - Class bổ sung
 * @param {object}  style       - Style bổ sung
 */
const UserAvatar = ({
  avatarUrl,
  name = "",
  size = 28,
  borderRadius = 8,
  className = "",
  style = {},
}) => {
  const letter = name?.[0]?.toUpperCase() ?? "U";
  const fontSize = Math.max(10, Math.round(size * 0.4));

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius,
        flexShrink: 0,
        overflow: "hidden",
        background: "linear-gradient(135deg, #e5181e 0%, #7a0409 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name || "avatar"}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      ) : (
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize,
            fontWeight: 900,
            color: "#fff",
            userSelect: "none",
          }}
        >
          {letter}
        </span>
      )}
    </div>
  );
};

export default UserAvatar;