// src/hooks/useAdminPlans.js
// Admin → Gói Premium. Một cache gói dùng chung cho trang Gói Premium và bộ lọc gói của trang Doanh thu.
// Sửa gói làm mới gói công khai (/premium); cấp / thu hồi Premium làm mới người dùng và KPI doanh thu.

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import paymentService from "../services/paymentService";
import { queryKeys, STALE } from "../config/queryKeys";

const keys = queryKeys.admin.plans;

const refreshPlans = (qc) => {
  qc.invalidateQueries({ queryKey: keys.all });
  qc.invalidateQueries({ queryKey: queryKeys.premium.plans }); // trang /premium phía người dùng
};

/** Mọi gói, kể cả gói đã tắt bán. */
export function useAdminPlans() {
  return useQuery({
    queryKey: keys.list,
    queryFn: async () => {
      const res = await paymentService.adminGetPlans();
      return Array.isArray(res) ? res : [];
    },
    staleTime: STALE.admin,
  });
}

/** variables: dto */
export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "plans", "create"],
    meta: { silent: true },
    mutationFn: (dto) => paymentService.adminCreatePlan(dto),
    onSuccess: () => refreshPlans(qc),
  });
}

/** variables: { id, dto } */
export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "plans", "update"],
    meta: { silent: true },
    mutationFn: ({ id, dto }) => paymentService.adminUpdatePlan(id, dto),
    onSuccess: () => refreshPlans(qc),
  });
}

/** variables: { id, isActive } — vá ngay công tắc trong cache, rồi lấy lại để đủ trạng thái bán. */
export function useSetPlanActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "plans", "setActive"],
    meta: { silent: true },
    mutationFn: ({ id, isActive }) => paymentService.adminSetPlanActive(id, isActive),
    onSuccess: (_d, { id, isActive }) => {
      qc.setQueryData(keys.list, (old) =>
        Array.isArray(old)
          ? old.map((p) => (p.id === id ? { ...p, isActive } : p))
          : old,
      );
      refreshPlans(qc);
    },
  });
}

// Cấp / thu hồi đổi gói của một user và số Premium đang hoạt động → làm mới người dùng admin + KPI doanh thu.
const refreshAfterSubscription = (qc) => {
  qc.invalidateQueries({ queryKey: queryKeys.admin.users.all });
  qc.invalidateQueries({ queryKey: queryKeys.admin.revenue.all });
};

/** variables: { userId, planId, expiredAt } */
export function useGrantSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "plans", "grant"],
    meta: { silent: true },
    mutationFn: (dto) => paymentService.adminGrantSubscription(dto),
    onSuccess: () => refreshAfterSubscription(qc),
  });
}

/** variables: userId */
export function useRevokeSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "plans", "revoke"],
    meta: { silent: true },
    mutationFn: (userId) => paymentService.adminRevokeSubscription(userId),
    onSuccess: () => refreshAfterSubscription(qc),
  });
}