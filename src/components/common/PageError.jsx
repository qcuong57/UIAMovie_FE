// src/components/common/PageError.jsx
// Màn hình lỗi dùng chung cho MỌI trang (Info / Detail / Yêu thích / Tìm kiếm...),
// lỗi runtime (ErrorBoundary) và 404 (NotFoundPage).
// Tương thích ngược: các nơi cũ vẫn gọi <PageError message onRetry /> như trước.
import React from "react";
import { C, GLOBAL_STYLES } from "../movie/ui/movieConstants";

export default function PageError({
  title = "Oops!",
  message = "Đã có lỗi xảy ra, vui lòng thử lại.",
  onRetry, // bỏ trống → ẩn nút "Thử lại"
  retryLabel = "Thử lại",
  retrying = false, // true → khoá nút, tránh bấm liên tiếp
  secondaryLabel, // nút phụ (vd. "Về trang chủ"); cần truyền cùng onSecondary
  onSecondary,
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
      <style>{`
        @keyframes pageErrIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .page-error-card{animation:pageErrIn .35s cubic-bezier(.22,1,.36,1) both}
        @media (prefers-reduced-motion:reduce){.page-error-card{animation:none}}
      `}</style>
      <div className="page-error-card" style={{ textAlign: "center", maxWidth: 420 }}>
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
            marginBottom: onRetry || onSecondary ? 24 : 0,
          }}
        >
          {message}
        </p>
        {(onRetry || onSecondary) && (
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {onRetry && (
              <button
                type="button"
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
            {onSecondary && (
              <button
                type="button"
                onClick={onSecondary}
                style={{
                  padding: "10px 24px",
                  borderRadius: 40,
                  background: "transparent",
                  color: C.textSub,
                  border: "1px solid rgba(255,255,255,0.18)",
                  cursor: "pointer",
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 600,
                }}
              >
                {secondaryLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}