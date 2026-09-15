// src/hooks/useAuthGuard.js
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/common/Toast";

export const isLoggedIn = () => {
  try {
    return !!localStorage.getItem("accessToken");
  } catch {
    return false;
  }
};

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