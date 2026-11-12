// src/components/common/PageError.jsx
// Màn hình lỗi dùng chung cho MỌI trang (Info / Detail / Yêu thích / Tìm kiếm...).
// Tương thích ngược: các nơi cũ vẫn gọi <PageError message onRetry /> như trước.
import React from "react";
import { C, GLOBAL_STYLES } from "../movie/ui/movieConstants";

export default function PageError({
  title = "Oops!",
  message = "Đã có lỗi xảy ra, vui lòng thử lại.",
  onRetry, // bỏ trống → ẩn nút "Thử lại"
  retryLabel = "Thử lại",
  retrying = false, // true → khoá nút, tránh bấm liên tiếp
}) {
  return (
    <div
      role="alert"
      style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "68px 20px 0", // chừa chỗ cho Navbar, không bị dính mép trên màn nhỏ
        boxSizing: "border-box",
      }}
    >
      <style>{GLOBAL_STYLES}</style>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <p
          style={{
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: 48,
            fontWeight: 900,
            color: C.accent,
            marginBottom: 12,
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 14,
            lineHeight: 1.6,
            color: C.textSub,
            marginBottom: onRetry ? 24 : 0,
          }}
        >
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={retrying}
            style={{
              padding: "10px 24px",
              borderRadius: 40,
              background: C.accent,
              color: "#fff",
              border: "none",
              cursor: retrying ? "not-allowed" : "pointer",
              opacity: retrying ? 0.6 : 1,
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 600,
            }}
          >
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}