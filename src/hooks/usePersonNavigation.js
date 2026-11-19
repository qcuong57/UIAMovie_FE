// src/hooks/usePersonNavigation.js
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toSlug } from "../components/movie/ui/movieConstants";

/**
 * Điều hướng tới trang diễn viên/đạo diễn.
 * Ưu tiên URL theo Guid (personId) để F5 / copy link vẫn load đủ filmography;
 * không có personId thì dùng slug tên như cũ. `state.actor` giữ để hiển thị tức thì.
 */
export const usePersonNavigation = () => {
  const navigate = useNavigate();
  return useCallback(
    (person) => {
      if (!person?.name) return;
      navigate(`/person/${person.personId ?? toSlug(person.name)}`, {
        state: { actor: person },
      });
    },
    [navigate]
  );
};