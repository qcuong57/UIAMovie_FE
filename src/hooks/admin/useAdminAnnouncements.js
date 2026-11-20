// src/hooks/useAdminAnnouncements.js
// Admin → Thông báo & Lịch bảo trì. Một cache danh sách cho trang quản trị; thêm / sửa / xoá vá cache ngay
// rồi làm mới trang Tin tức công khai (`queryKeys.announcements`).
// Chuông thông báo của người dùng chưa có key trong queryKeys: nếu nó dùng react-query, thêm key đó vào `refreshPublic`.

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import notificationService from "../../services/notificationService";
import { queryKeys, STALE } from "../../config/queryKeys";

const keys = queryKeys.admin.announcements;

const refreshPublic = (qc) =>
  qc.invalidateQueries({ queryKey: queryKeys.announcements.all });

/** Tối đa 200 bản tin mới nhất (lọc, sắp xếp, phân trang làm ở client như trước). */
export function useAdminAnnouncements() {
  return useQuery({
    queryKey: keys.list,
    queryFn: async () => {
      const res = await notificationService.getPublicAnnouncements(1, 200);
      return Array.isArray(res) ? res : (res?.items ?? res?.data?.items ?? []);
    },
    staleTime: STALE.admin,
  });
}

/** variables: payload — phát thông báo mới (id do server sinh nên lấy lại danh sách). */
export function useBroadcastAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "announcements", "broadcast"],
    meta: { silent: true },
    mutationFn: (payload) => notificationService.broadcastNotification(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all });
      refreshPublic(qc);
    },
  });
}

/** variables: { id, payload } */
export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "announcements", "update"],
    meta: { silent: true },
    mutationFn: ({ id, payload }) =>
      notificationService.adminUpdateNotification(id, payload),
    onSuccess: (_d, { id, payload }) => {
      qc.setQueryData(keys.list, (old) =>
        Array.isArray(old)
          ? old.map((a) => (a.id === id ? { ...a, ...payload } : a))
          : old,
      );
      refreshPublic(qc);
    },
  });
}

/** variables: id */
export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "announcements", "delete"],
    meta: { silent: true },
    mutationFn: (id) => notificationService.adminDeleteNotification(id),
    onSuccess: (_d, id) => {
      qc.setQueryData(keys.list, (old) =>
        Array.isArray(old) ? old.filter((a) => a.id !== id) : old,
      );
      refreshPublic(qc);
    },
  });
}