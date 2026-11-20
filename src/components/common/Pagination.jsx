// src/components/common/Pagination.jsx
// Phân trang cho NGƯỜI DÙNG (nền tối). Logic + giao diện nằm ở pagination/PaginationBase.jsx;
// file này chỉ cấp theme và chọn kiểu mobile. API props giữ nguyên:
//   <Pagination page={3} totalPages={12} total={280} pageSize={24} onPageChange={handlePageChange} />
//
// Desktop: « ‹ 1 … 4 5 6 … 12 › »  (+ "Đến trang" khi > 10 trang)
// Mobile : ‹  3 / 12  ›            (bấm "3 / 12" để nhập số trang; vùng chạm 42px)

import React from "react";
import PaginationBase from "./pagination/PaginationBase";
import { FONT_BODY } from "../../context/homeTokens";
import { useIsMobile } from "../../hooks/common/useIsMobile";

const ACCENT = "#e5181e";

// Hằng số cấp module → tham chiếu ổn định
const THEME = {
  "--pg-font": FONT_BODY,
  "--pg-accent": ACCENT,
  "--pg-accent-bg": "rgba(229,24,30,0.14)",
  "--pg-accent-border": "rgba(229,24,30,0.5)",
  "--pg-accent-text": ACCENT,
  "--pg-accent-shadow": "none",
  "--pg-on-accent": "#fff",
  "--pg-bg": "transparent",
  "--pg-bg-hover": "rgba(255,255,255,0.07)",
  "--pg-border": "rgba(255,255,255,0.08)",
  "--pg-border-hover": "rgba(255,255,255,0.18)",
  "--pg-text": "rgba(255,255,255,0.65)",
  "--pg-text-hover": "#fff",
  "--pg-disabled": "rgba(255,255,255,0.2)",
  "--pg-dots": "rgba(255,255,255,0.35)",
  "--pg-shadow": "none",
  "--pg-info": "rgba(255,255,255,0.5)",
  "--pg-info-strong": "rgba(255,255,255,0.8)",
  "--pg-pop-bg": "rgba(14,14,14,0.97)",
  "--pg-pop-border": "rgba(255,255,255,0.12)",
  "--pg-pop-shadow": "0 12px 40px rgba(0,0,0,0.8)",
  "--pg-input-bg": "rgba(255,255,255,0.06)",
  "--pg-input-border": "rgba(255,255,255,0.16)",
  "--pg-input-text": "#fff",
};

export default function Pagination({ itemLabel = "phim", ...props }) {
  const isMobile = useIsMobile();
  return (
    <PaginationBase
      {...props}
      itemLabel={itemLabel}
      theme={THEME}
      compact={isMobile}
      size={36}
      radius={8}
      padding={isMobile ? "28px 0 16px" : "40px 0 20px"}
    />
  );
}
