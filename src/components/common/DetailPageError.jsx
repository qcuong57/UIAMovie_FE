// src/components/common/DetailPageError.jsx
// Lỗi tải trang chi tiết (phim / TV show): 404 hoặc lỗi mạng. Dùng chung cho 4 trang Info / Detail.
import React from "react";
import { useNavigate } from "react-router-dom";
import PageError from "./PageError";

export default function DetailPageError({
  error,
  onRetry,
  retrying = false,
  notFoundMessage = "Không tìm thấy nội dung này.",
  fallbackMessage = "Không thể tải dữ liệu. Vui lòng thử lại.",
}) {
  const navigate = useNavigate();
  // 404 từ server, hoặc không có lỗi nhưng dữ liệu rỗng → coi là không tồn tại
  const notFound = !error || error?.response?.status === 404;

  return (
    <PageError
      title={notFound ? "404" : "Oops!"}
      message={notFound ? notFoundMessage : fallbackMessage}
      onRetry={notFound ? () => navigate("/", { replace: true }) : onRetry}
      retryLabel={notFound ? "Về trang chủ" : "Thử lại"}
      retrying={!notFound && retrying}
      secondaryLabel="Quay lại"
      onSecondary={() => navigate(-1)}
    />
  );
}