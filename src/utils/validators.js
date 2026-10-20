// src/utils/validators.js
// Luật dùng chung giữa trang đăng ký (LandingPage) và trang hồ sơ (ProfilePage).
// BE áp cùng luật (RegisterDTO.Username + UserService.UpdateUserAsync).

export const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

export function validateUsername(v) {
  const s = (v ?? "").trim();
  if (!s) return "Username không được để trống";
  if (s.length < 3 || s.length > 50) return "Username phải từ 3–50 ký tự";
  if (!USERNAME_RE.test(s)) return "Username chỉ được chứa chữ, số, dấu gạch dưới";
  return "";
}