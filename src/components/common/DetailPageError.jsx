// src/components/common/DetailPageError.jsx
// Lỗi tải trang chi tiết (phim / TV show). Dùng chung cho 4 trang Info / Detail.
// Phân loại lỗi tự động: 404 · mất mạng · timeout · 5xx · 403 · 429 ...
import React from "react";
import { useNavigate } from "react-router-dom";
import PageError from "./PageError";
import { resolveErrorKind } from "../../utils/errorKind";

export default function DetailPageError({
  error,
  onRetry,
  retrying = false,
  notFoundMessage = "Đường dẫn có thể đã sai, hoặc nội dung này đã bị gỡ khỏi hệ thống.",
}) {
  const navigate = useNavigate();
  // Không có lỗi nhưng dữ liệu rỗng → coi là không tồn tại
  const kind = error ? resolveErrorKind(error) : "notFound";
  const notFound = kind === "notFound";

  return (
    <PageError
      kind={kind}
      error={error}
      message={notFound ? notFoundMessage : undefined}
      onRetry={notFound ? () => navigate("/", { replace: true }) : onRetry}
      retryLabel={notFound ? "Về trang chủ" : undefined}
      retrying={!notFound && retrying}
      secondaryLabel="Quay lại"
      onSecondary={() => navigate(-1)}
    />
  );
}