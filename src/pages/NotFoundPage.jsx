// src/pages/NotFoundPage.jsx
// Trang 404: URL không khớp route nào. Hiển thị bên trong layout có Navbar.
import React from "react";
import { useNavigate } from "react-router-dom";
import PageError from "../components/common/PageError";
import SeoMeta from "../components/common/SeoMeta";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <>
      <SeoMeta noindex />
      <PageError
        title="404"
        message="Trang bạn tìm không tồn tại hoặc đã được di chuyển."
        onRetry={() => navigate("/", { replace: true })}
        retryLabel="Về trang chủ"
        secondaryLabel="Quay lại"
        onSecondary={() => navigate(-1)}
      />
    </>
  );
}