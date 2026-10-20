// src/hooks/useAuthGuard.js
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/common/Toast";
import { hasStoredUser } from "../config/sessionStore";

// Dựa trên hồ sơ đã lưu (cùng nguồn với router/Navbar), không dựa vào accessToken
// vì token chỉ nằm trong bộ nhớ và có thể đang được refresh nền sau khi reload.
// Giữ export tên cũ để các nơi đang import { isLoggedIn } không bị gãy.
export const isLoggedIn = hasStoredUser;

/**
 * Trả về hàm goTo(path): nếu đã đăng nhập -> navigate bình thường,
 * nếu chưa -> KHÔNG điều hướng, chỉ hiện toast cảnh báo.
 */
export function useAuthGuard() {
  const navigate = useNavigate();
  const toast = useToast();

  return useCallback(
    (path) => {
      if (isLoggedIn()) {
        navigate(path);
      } else {
        toast.warning("Bạn cần đăng nhập để sử dụng tính năng này");
      }
    },
    [navigate, toast]
  );
}