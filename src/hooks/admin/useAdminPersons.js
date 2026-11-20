// src/hooks/useAdminPersons.js
// Admin → Diễn viên & Đạo diễn. Cùng mẫu với useAdminTvShows:
// danh sách phân trang server (keepPreviousData + prefetch trang kế), chi tiết dùng chung
// một cache cho DetailPanel, mutation vá cache rồi làm mới phía người dùng.

import { useEffect } from "react";
import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import personService from "../../services/personService";
import { queryKeys, STALE, CATALOG_ROOTS } from "../../config/queryKeys";

const keys = queryKeys.admin.persons;

// Diễn viên hiện trong chi tiết phim/TV phía người dùng → làm mới nhóm catalogue.
const invalidateCatalog = (qc) =>
  qc.invalidateQueries({
    predicate: (q) => CATALOG_ROOTS.has(q.queryKey[0]),
  });

// BE trả { items, totalCount } (có thể bọc trong .data)
const normalizeList = (res) => {
  const data = res?.data ?? res;
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    totalCount: data?.totalCount ?? 0,
  };
};

export const adminPersonsOptions = ({
  page = 1,
  pageSize = 20,
  search = "",
} = {}) =>
  queryOptions({
    queryKey: keys.list({ page, pageSize, search }),
    queryFn: async () =>
      normalizeList(
        await personService.searchPersons(search || undefined, page, pageSize),
      ),
    staleTime: STALE.admin,
    placeholderData: keepPreviousData,
  });

export function useAdminPersons(filter = {}) {
  const qc = useQueryClient();
  const { page = 1, pageSize = 20, search = "" } = filter;
  const query = useQuery(adminPersonsOptions({ page, pageSize, search }));

  // Prefetch trang kế → bấm "trang sau" có dữ liệu ngay
  const total = query.data?.totalCount ?? 0;
  const hasNext = page * pageSize < total;
  useEffect(() => {
    if (!hasNext || query.isPlaceholderData) return;
    qc.prefetchQuery(adminPersonsOptions({ page: page + 1, pageSize, search }));
  }, [qc, hasNext, query.isPlaceholderData, page, pageSize, search]);

  return query;
}

/** Chi tiết đầy đủ (kèm profileImages) — DetailPanel dùng; Edit modal nhận bản này qua props. */
export function useAdminPerson(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: async () => {
      const res = await personService.getPersonById(id);
      return res?.data ?? res;
    },
    enabled: !!id && enabled,
    staleTime: STALE.admin,
  });
}

/** Filmography (Movie + TV) của 1 person — PersonFilmography trong DetailPanel dùng.
 *  Key nằm dưới keys.detail(id) nên xoá person (removeQueries detail) cũng dọn luôn phần này. */
export function usePersonMovies(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: [...keys.detail(id), "movies"],
    queryFn: async () => {
      const res = await personService.getPersonMovies(id);
      const list = res?.data ?? res;
      return Array.isArray(list) ? list : [];
    },
    enabled: !!id && enabled,
    staleTime: STALE.admin,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

/** Vá một person trong mọi trang danh sách đang cache. */
const patchInLists = (qc, id, patch) =>
  qc.setQueriesData({ queryKey: keys.lists() }, (old) =>
    old?.items
      ? {
          ...old,
          items: old.items.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }
      : old,
  );

/** variables: payload → trả về { id, ... } của person mới */
export function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "persons", "create"],
    meta: { silent: true },
    mutationFn: (payload) => personService.createPerson(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.lists() }); // tổng số đổi → lấy lại từ server
      qc.invalidateQueries({ queryKey: keys.searches() }); // ô gợi ý có người mới
    },
  });
}

/** variables: { id, payload, patch } — patch là bản đã chuẩn hoá để vá cache ngay */
export function useUpdatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "persons", "update"],
    meta: { silent: true },
    mutationFn: ({ id, payload }) => personService.updatePerson(id, payload),
    onSuccess: (_d, { id, patch }) => {
      qc.setQueryData(keys.detail(id), (old) =>
        old ? { ...old, ...patch } : old,
      );
      patchInLists(qc, id, patch);
      qc.invalidateQueries({ queryKey: keys.searches() });
      invalidateCatalog(qc);
    },
  });
}

/** variables: id */
export function useDeletePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "persons", "delete"],
    meta: { silent: true },
    mutationFn: (id) => personService.deletePerson(id),
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: keys.detail(id) });
      qc.invalidateQueries({ queryKey: keys.lists() });
      qc.invalidateQueries({ queryKey: keys.searches() });
      invalidateCatalog(qc);
    },
  });
}