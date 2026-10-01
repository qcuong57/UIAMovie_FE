
// ── Helpers ────────────────────────────────────────────────────────────────
export const fmtDateShort = (dateStr) =>
  new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// Thời gian kiểu mạng xã hội: "5 phút trước", "2 ngày trước"...
export const timeAgo = (dateStr) => {
  const s = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (Number.isNaN(s)) return "";
  if (s < 60) return "Vừa xong";
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} ngày trước`;
  return fmtDateShort(dateStr);
};

// Tên / avatar của currentUser — thử nhiều tên field phổ biến
export const userInfo = (u) => ({
  name:
    u?.userName ??
    u?.username ??
    u?.fullName ??
    u?.name ??
    u?.displayName ??
    "",
  avatar:
    u?.avatarUrl ?? u?.avatar ?? u?.userAvatar ?? u?.profilePicture ?? null,
});

export const ratingWord = (n) =>
  n >= 10
    ? "Kiệt tác"
    : n >= 9
      ? "Xuất sắc"
      : n >= 7
        ? "Hay"
        : n >= 5
          ? "Tạm được"
          : n >= 3
            ? "Dở"
            : "Rất tệ";

export const epLabelOf = (ep) =>
  `S${ep.seasonNumber}E${ep.episodeNumber}${ep.title ? ` — ${ep.title}` : ""}`;

// ── Replies ────────────────────────────────────────────────────────────────
export const REPLY_STEP = 5; // số reply hiển thị mỗi lần "Xem thêm"
export const REPLY_MAX_FETCH = 100; // backend giới hạn pageSize tối đa 100
export const REPLY_MAX_LEN = 2000;

// Admin: hỗ trợ cả `role: 'Admin'` lẫn `roles: ['Admin']`
export const checkIsAdmin = (user) => {
  if (!user) return false;
  const raw = user.role ?? user.roles ?? user.Role ?? [];
  return [].concat(raw).some((r) => String(r).toLowerCase() === "admin");
};

// ApiResponseDTO<ReviewRepliesResponseDTO> → { replies, total }
export const parseReplies = (res) => {
  const envelope = res?.data ?? {};
  const d = envelope?.data ?? envelope ?? {};
  const replies = d.replies ?? d.Replies ?? [];
  return {
    replies: Array.isArray(replies) ? replies : [],
    total: d.totalReplies ?? d.TotalReplies ?? 0,
  };
};

export const getErrMsg = (e, fallback) => {
  const m = e?.response?.data?.message;
  if (typeof m === "string" && m) return m;
  if (e?.response?.status === 401) return "Vui lòng đăng nhập lại";
  if (e?.response?.status === 403)
    return "Bạn không có quyền thực hiện thao tác này";
  return fallback;
};
