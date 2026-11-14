// src/hooks/useAdminAds.js
// Admin → Quảng cáo. Thay cho fetchAds / setAds / getScheduleSettings gọi lặp ở nhiều component:
//   - danh sách theo (page, search, isActive) có cache; đổi trang giữ dữ liệu cũ nên bảng không nháy spinner;
//   - chi tiết 1 quảng cáo (kèm global slot) và cấu hình lịch phát dùng chung cache giữa trang, panel và các modal;
//   - mọi thay đổi chỉ cần invalidate nhóm admin.ads → bảng, panel chi tiết, số slot luôn khớp nhau.

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import adService from "../services/adService";
import { queryKeys, STALE } from "../config/queryKeys";

const keys = queryKeys.admin.ads;

/** BE trả mode dạng số (1) hoặc chuỗi ("Random"). */
export const isRandomSchedule = (settings) =>
  settings?.mode === 1 || settings?.mode === "Random";

/** filter: { page, pageSize, search, isActive } — isActive: undefined = tất cả. */
export function useAdminAds({ page, pageSize, search, isActive }) {
  return useQuery({
    queryKey: keys.list({ page, pageSize, search, isActive }),
    queryFn: async () => {
      const res = await adService.getAds({ page, pageSize, search, isActive });
      const items = Array.isArray(res)
        ? res
        : (res?.items ?? res?.data?.items ?? []);
      return { items, total: res?.total ?? res?.data?.total ?? items.length };
    },
    placeholderData: keepPreviousData,
    staleTime: STALE.admin,
  });
}

/** Chi tiết đầy đủ (kèm globalSlots). `initial` là dòng đã có ở bảng → hiện ngay trong lúc tải. */
export function useAdDetail(id, initial) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: async () => {
      const res = await adService.getAdById(id);
      return res?.data ?? res;
    },
    enabled: !!id,
    placeholderData: initial,
    staleTime: STALE.admin,
  });
}

/** Cấu hình lịch phát (Cố định | Ngẫu nhiên). Lỗi không chặn trang: data là undefined. */
export function useAdScheduleSettings() {
  return useQuery({
    queryKey: queryKeys.admin.adScheduleSettings,
    queryFn: () => adService.getScheduleSettings(),
    staleTime: STALE.admin,
    retry: false,
  });
}

/** Trả về hàm làm mới toàn bộ dữ liệu quảng cáo (danh sách + chi tiết). */
export function useRefreshAds() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: keys.all });
}

/** Cập nhật cache cấu hình lịch phát ngay sau khi lưu / khôi phục mặc định ở modal cấu hình. */
export function useSetScheduleSettings() {
  const qc = useQueryClient();
  return (settings) =>
    qc.setQueryData(queryKeys.admin.adScheduleSettings, settings);
}

export function useAdMutations() {
  const refresh = useRefreshAds();

  const toggleActive = useMutation({
    mutationFn: (ad) => adService.updateAd(ad.id, { isActive: !ad.isActive }),
    onSuccess: refresh,
  });

  const deleteAd = useMutation({
    mutationFn: (id) => adService.deleteAd(id),
    onSuccess: refresh,
  });

  const toggleSlot = useMutation({
    mutationFn: (slot) =>
      adService.updateGlobalSlot(slot.slotId, { isActive: !slot.isActive }),
    onSuccess: refresh,
  });

  const deleteSlot = useMutation({
    mutationFn: (slotId) => adService.deleteGlobalSlot(slotId),
    onSuccess: refresh,
  });

  return { toggleActive, deleteAd, toggleSlot, deleteSlot };
}