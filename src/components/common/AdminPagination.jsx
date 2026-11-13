// src/components/common/AdminPagination.jsx
// Phân trang riêng cho ADMIN (nền sáng) — token từ adminTokens, KHÔNG dùng homeTokens.
// Logic + giao diện nằm ở pagination/PaginationBase.jsx. API props giữ nguyên:
//   <AdminPagination {...pagination.props} itemLabel="người" />
// Thêm (tuỳ chọn): isFetching — truyền query.isFetching khi dùng phân trang server-side + keepPreviousData.

import React from "react";
import PaginationBase from "./pagination/PaginationBase";
import { T, FONT_BODY as FONT } from "../../context/adminTokens";

// Hằng số cấp module → tham chiếu ổn định
const THEME = {
  "--pg-font": FONT,
  "--pg-accent": T.accent,
  "--pg-accent-bg": T.accentLight,
  "--pg-accent-border": `${T.accent}35`,
  "--pg-accent-text": T.accentText,
  "--pg-accent-shadow": `0 0 0 3px ${T.accent}10`,
  "--pg-on-accent": "#fff",
  "--pg-bg": T.surface,
  "--pg-bg-hover": T.surfaceHov,
  "--pg-border": T.border,
  "--pg-border-hover": T.border,
  "--pg-text": T.textSub,
  "--pg-text-hover": T.text,
  "--pg-disabled": T.textMuted,
  "--pg-dots": T.textMuted,
  "--pg-shadow": T.shadow,
  "--pg-info": T.textMuted,
  "--pg-info-strong": T.textSub,
  "--pg-pop-bg": T.surface,
  "--pg-pop-border": T.border,
  "--pg-pop-shadow": T.shadowMd,
  "--pg-input-bg": T.bg,
  "--pg-input-border": T.border,
  "--pg-input-text": T.text,
};

export default function AdminPagination({ itemLabel = "mục", ...props }) {
  return (
    <PaginationBase
      {...props}
      itemLabel={itemLabel}
      theme={THEME}
      size={34}
      radius={9}
      padding="28px 0 8px"
    />
  );
}
