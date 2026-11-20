// src/hooks/useAdminRevenue.js
// Admin → Doanh thu & đơn hàng. Thay cho các hàm loadSummary / loadChart / loadOrders tự quản
// request id, cờ busy và polling bằng tay:
//   - request cũ bị bỏ qua tự động (key đổi theo kỳ / bộ lọc), mở lại bộ lọc đã xem thì có ngay từ cache;
//   - polling = refetchInterval (không chạy khi tab ẩn, mặc định của react-query);
//   - refetch nền lỗi thì giữ dữ liệu cũ, không bật lại spinner.
// Tham số `refetchInterval` do trang truyền vào (phụ thuộc số đơn pending của summary).

import { useQuery } from "@tanstack/react-query";
import paymentService from "../../services/paymentService";
import { queryKeys, STALE } from "../../config/queryKeys";

const keys = queryKeys.admin.revenue;
const STALE_MS = 15_000; // quay lại tab sau ngần này thì tải lại (refetchOnWindowFocus)

const live = (refetchInterval) => ({
  staleTime: STALE_MS,
  refetchInterval,
  refetchOnWindowFocus: true,
});

export function useRevenueSummary({ refetchInterval } = {}) {
  return useQuery({
    queryKey: keys.summary,
    queryFn: () => paymentService.adminGetRevenueSummary(),
    ...live(refetchInterval),
  });
}

/**
 * Biểu đồ + doanh thu theo gói chung MỘT kỳ → một query.
 * params: { groupBy, year, month, range } — `range` (from/to) do trang tính, không nằm trong key vì suy ra từ 3 trường còn lại.
 * Trả về { chart, byPlan }.
 */
export function useRevenueChart(
  { groupBy, year, month, range },
  { refetchInterval } = {},
) {
  return useQuery({
    queryKey: keys.chart({
      groupBy,
      year,
      month: groupBy === "day" ? month : null,
    }),
    queryFn: async () => {
      const params =
        groupBy === "day" ? { groupBy, year, month } : { groupBy, year };
      const [chart, byPlan] = await Promise.all([
        paymentService.adminGetRevenueChart(params),
        paymentService.adminGetRevenueByPlan(range),
      ]);
      return { chart, byPlan: Array.isArray(byPlan) ? byPlan : [] };
    },
    ...live(refetchInterval),
  });
}

/** filter: { page, pageSize, status, planId, provider, search, from, to } — trường rỗng không gửi lên. */
export function useAdminRevenueOrders(filter, { refetchInterval } = {}) {
  const { page, pageSize, status, planId, provider, search, from, to } = filter;
  return useQuery({
    queryKey: keys.orders({
      page,
      pageSize,
      status,
      planId,
      provider,
      search,
      from,
      to,
    }),
    queryFn: async () => {
      const res = await paymentService.adminGetOrders({
        page,
        pageSize,
        ...(status && { status }),
        ...(planId && { planId }),
        ...(provider && { provider }),
        ...(search && { search }),
        ...(from && { from }),
        ...(to && { to }),
      });
      return { items: res?.items ?? [], totalCount: res?.totalCount ?? 0 };
    },
    ...live(refetchInterval),
  });
}

/** Gói cho bộ lọc (kể cả gói đã tắt bán vẫn có đơn cũ). Lỗi không chặn trang: bộ lọc gói chỉ trống. */
export function useRevenuePlanOptions() {
  return useQuery({
    queryKey: keys.planOptions,
    queryFn: () => paymentService.adminGetPlans(),
    staleTime: STALE.medium,
    select: (list) =>
      Array.isArray(list)
        ? list.map((p) => ({
            value: p.planId,
            label: p.isActive ? p.name : `${p.name} (đã tắt)`,
          }))
        : [],
  });
}