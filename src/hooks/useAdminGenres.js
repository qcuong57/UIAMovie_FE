// src/hooks/useAdminGenres.js
// Admin → Thể loại. Thay cho fetchGenres / setGenres thủ công:
//   - danh sách nằm trong cache react-query (key genres.admin), mở lại trang có ngay;
//   - thêm / sửa / xoá xong chỉ cần invalidate gốc "genres" → làm mới luôn ô chọn thể loại (picker) và trang công khai;
//   - xoá thể loại còn làm đổi thể loại hiển thị trên phim → invalidate thêm cache catalogue.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import genreService from "../services/genreService";
import { queryKeys, STALE, CATALOG_ROOTS } from "../config/queryKeys";

/** BE có thể trả mảng thuần hoặc bọc trong { data } / { genres }. */
const toList = (res) =>
  Array.isArray(res) ? res : (res?.data ?? res?.genres ?? []);

export function useAdminGenres() {
  return useQuery({
    queryKey: queryKeys.genres.admin,
    queryFn: async () => toList(await genreService.getAllGenres()),
    staleTime: STALE.admin,
  });
}

/** Trả về { save, remove } — mutation của react-query (mutateAsync, isPending, ...). */
export function useGenreMutations() {
  const qc = useQueryClient();

  const refreshGenres = () =>
    qc.invalidateQueries({ queryKey: queryKeys.genres.all });

  const save = useMutation({
    // payload: { name, description }; có id → cập nhật, không có → tạo mới
    mutationFn: ({ id, payload }) =>
      id != null
        ? genreService.updateGenre(id, payload)
        : genreService.createGenre(payload),
    onSuccess: refreshGenres,
  });

  const remove = useMutation({
    mutationFn: (id) => genreService.deleteGenre(id),
    onSuccess: () =>
      Promise.all([
        refreshGenres(),
        qc.invalidateQueries({
          predicate: ({ queryKey }) => CATALOG_ROOTS.has(queryKey[0]),
        }),
        qc.invalidateQueries({ queryKey: queryKeys.admin.movies.all }),
      ]),
  });

  return { save, remove };
}