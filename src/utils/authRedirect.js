// src/utils/authRedirect.js
// Dùng chung cho LandingPage (sau đăng nhập) và GuestRoute (AppRouter).

/** Khóa sessionStorage lưu gói khách đã chọn trước khi bị yêu cầu đăng nhập */
export const PENDING_PLAN_KEY = "premium:pendingPlan";

/**
 * Chỉ chấp nhận đường dẫn nội bộ (chống open-redirect kiểu "//evil.com").
 * Trả về null nếu không hợp lệ hoặc trỏ lại chính trang đăng nhập.
 */
export const safeReturnPath = (from) => {
  if (typeof from !== "string") return null;
  if (!from.startsWith("/") || from.startsWith("//") || from.includes("\\")) return null;
  if (from === "/welcome" || from.startsWith("/welcome?") || from.startsWith("/welcome/")) return null;
  return from;
};

export const homePathFor = (user) =>
  user?.role?.toLowerCase() === "admin" ? "/admin" : "/";

/** Đích sau đăng nhập: nơi khách đang làm dở, nếu không có thì về trang chủ theo vai trò */
export const postLoginPath = (user, from) =>
  safeReturnPath(from) ?? homePathFor(user);