// src/hooks/useAdminUsers.js
// TanStack Query cho Admin → Người dùng. Cùng quy ước với useAdminMovies:
//   • key lấy từ queryKeys.admin.users.*; gốc "admin" tự reset khi đổi tài khoản
//   • PHÂN TRANG SERVER: page + bộ lọc nằm trong key, giữ trang cũ khi tải trang mới (keepPreviousData),
//     tự prefetch trang kế, huỷ request cũ bằng AbortSignal
//   • ghi dữ liệu = mutation; cập nhật thẳng mọi trang đang cache thay vì tải lại
import { useEffect } from "react";
import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axiosInstance from "../config/axios";
import { queryKeys, STALE } from "../config/queryKeys";
import { parsePaged, unwrapOne } from "../utils/queryHelpers";

// ── Query options (dùng chung cho useQuery và prefetchQuery → key không bao giờ lệch) ──
/** filter: { page, pageSize, search, role, subscriptionType } → { items, total } */
const usersListOptions = (filter) =>
  queryOptions({
    queryKey: queryKeys.admin.users.list(filter),
    queryFn: async ({ signal }) => {
      const { page, pageSize, search, role, subscriptionType } = filter;
      const params = { pageNumber: page, pageSize };
      if (search) params.search = search;
      if (role) params.role = role;
      if (subscriptionType) params.subscriptionType = subscriptionType; // 'premium' | 'none' | ...
      return parsePaged(await axiosInstance.get("/user", { params, signal }));
    },
    staleTime: STALE.admin,
  });

export function useAdminUsers(filter) {
  const qc = useQueryClient();
  const { page, pageSize, search, role, subscriptionType } = filter;

  const query = useQuery({
    ...usersListOptions({ page, pageSize, search, role, subscriptionType }),
    placeholderData: keepPreviousData, // đổi trang / lọc: giữ dữ liệu cũ (làm mờ) thay vì nháy skeleton
    refetchOnWindowFocus: true,
  });

  // Prefetch trang kế → bấm "sau" là có ngay
  const total = query.data?.total;
  const isPlaceholder = query.isPlaceholderData;
  useEffect(() => {
    if (total != null && !isPlaceholder && page * pageSize < total) {
      qc.prefetchQuery(
        usersListOptions({
          page: page + 1,
          pageSize,
          search,
          role,
          subscriptionType,
        }),
      );
    }
  }, [
    qc,
    total,
    isPlaceholder,
    page,
    pageSize,
    search,
    role,
    subscriptionType,
  ]);

  return query;
}

/** Chi tiết 1 người dùng (DetailPanel). id falsy → không gọi. */
export const useAdminUser = (id) =>
  useQuery({
    queryKey: queryKeys.admin.users.detail(id),
    queryFn: async ({ signal }) =>
      unwrapOne(await axiosInstance.get(`/user/${id}`, { signal })),
    enabled: !!id,
    staleTime: STALE.admin,
  });

// ── Cache helpers ────────────────────────────────────────────────────────────
/** Ghi `patch` vào người dùng trong MỌI trang danh sách đang cache + cache chi tiết. */
const patchUser = (qc, id, patch) => {
  qc.setQueriesData({ queryKey: queryKeys.admin.users.lists() }, (old) =>
    old?.items
      ? {
          ...old,
          items: old.items.map((u) => (u.id === id ? { ...u, ...patch } : u)),
        }
      : old,
  );
  qc.setQueryData(queryKeys.admin.users.detail(id), (old) =>
    old ? { ...old, ...patch } : old,
  );
};

// Mutation chung: component tự toast / đóng modal nên bỏ qua log toàn cục
const base = (key) => ({
  mutationKey: ["admin", "users", key],
  meta: { silent: true },
});

// ── Mutations ────────────────────────────────────────────────────────────────
/** variables: { id, body, patch } */
export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    ...base("update"),
    mutationFn: ({ id, body }) => axiosInstance.put(`/user/${id}`, body),
    onSuccess: (_d, { id, patch }) => {
      if (patch) patchUser(qc, id, patch);
      qc.invalidateQueries({
        queryKey: queryKeys.admin.users.lists(),
        refetchType: "none",
      });
    },
  });
}

/** variables: id. Tổng số và trang thay đổi → tải lại trang đang xem. */
export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    ...base("delete"),
    mutationFn: (id) => axiosInstance.delete(`/user/${id}`),
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: queryKeys.admin.users.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.admin.users.lists() });
    },
  });
}

/** variables: { id, role } */
export function useChangeUserRole() {
  const qc = useQueryClient();
  return useMutation({
    ...base("role"),
    mutationFn: ({ id, role }) =>
      axiosInstance.patch(`/user/${id}/role`, { role }),
    onSuccess: (_d, { id, role }) => {
      patchUser(qc, id, { role });
      qc.invalidateQueries({
        queryKey: queryKeys.admin.users.lists(),
        refetchType: "none",
      });
    },
  });
}

/** variables: { id, reason } */
export function useBanUser() {
  const qc = useQueryClient();
  return useMutation({
    ...base("ban"),
    mutationFn: ({ id, reason }) =>
      axiosInstance.post(`/user/${id}/ban`, { reason: reason?.trim() || null }),
    onSuccess: (_d, { id, reason }) => {
      patchUser(qc, id, { isActive: false, banReason: reason?.trim() || null });
      qc.invalidateQueries({
        queryKey: queryKeys.admin.users.lists(),
        refetchType: "none",
      });
    },
  });
}

/** variables: id */
export function useUnbanUser() {
  const qc = useQueryClient();
  return useMutation({
    ...base("unban"),
    mutationFn: (id) => axiosInstance.post(`/user/${id}/unban`),
    onSuccess: (_d, id) => {
      patchUser(qc, id, { isActive: true, banReason: null });
      qc.invalidateQueries({
        queryKey: queryKeys.admin.users.lists(),
        refetchType: "none",
      });
    },
  });
}

/** Cấp / gia hạn Premium. variables: { userId, planId, expiredAt (ISO) }. BE gọi .ToUniversalTime(). */
export function useGrantPremium() {
  const qc = useQueryClient();
  return useMutation({
    ...base("grant-premium"),
    mutationFn: ({ userId, planId, expiredAt }) =>
      axiosInstance.post("/payments/admin/grant-subscription", {
        userId,
        planId,
        expiredAt,
      }),
    onSuccess: (_d, { userId, planId, expiredAt }) => {
      patchUser(qc, userId, {
        subscriptionType: planId,
        subscriptionExpiredAt: expiredAt,
      }); // phản hồi tức thì
      qc.invalidateQueries({ queryKey: queryKeys.admin.users.lists() }); // rồi đồng bộ giá trị thật từ BE
      qc.invalidateQueries({ queryKey: queryKeys.admin.users.detail(userId) });
    },
  });
}

/** Thu hồi Premium. variables: userId */
export function useRevokePremium() {
  const qc = useQueryClient();
  return useMutation({
    ...base("revoke-premium"),
    mutationFn: (userId) =>
      axiosInstance.delete(`/payments/admin/subscription/${userId}`),
    onSuccess: (_d, userId) => {
      patchUser(qc, userId, {
        subscriptionType: null,
        subscriptionExpiredAt: null,
      });
      qc.invalidateQueries({ queryKey: queryKeys.admin.users.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.admin.users.detail(userId) });
    },
  });
}
