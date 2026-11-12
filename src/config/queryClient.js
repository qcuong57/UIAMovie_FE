// src/config/queryClient.js
// QueryClient dùng chung cho toàn app (main.jsx bọc Provider; ngoài component có thể import trực tiếp).
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { getStoredUser, subscribeStoredUser } from "./sessionStore";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { PUBLIC_QUERY_ROOTS, queryKeys } from "./queryKeys";

// Không retry lỗi 4xx (401/403/404/422...: thử lại cũng vô ích, và 401 đã được axios interceptor
// tự refresh token). Chỉ retry 1 lần với lỗi mạng / timeout / 5xx.
const shouldRetry = (failureCount, error) => {
  const status = error?.response?.status;
  if (status && status >= 400 && status < 500) return false;
  return failureCount < 1;
};

// Điểm tập trung để log / gắn Sentry. Query nào tự xử lý lỗi riêng thì đặt `meta: { silent: true }`.
const reportError = (scope, error, meta) => {
  if (meta?.silent) return;
  if (import.meta.env.DEV) console.error(`[${scope}]`, error);
  // TODO(prod): Sentry.captureException(error, { tags: { scope } });
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => reportError(`query ${JSON.stringify(query.queryKey)}`, error, query.meta),
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) =>
      reportError(`mutation ${JSON.stringify(mutation.options.mutationKey ?? "")}`, error, mutation.meta),
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 phút: dữ liệu coi là "tươi", không gọi lại khi quay lại trang
      gcTime: 10 * 60_000, // giữ cache 10 phút sau khi không còn component dùng
      retry: shouldRetry,
      refetchOnWindowFocus: false, // catalogue ít đổi; query dữ liệu cá nhân tự bật lại ở hook của nó
    },
    mutations: {
      retry: false, // không tự lặp thao tác ghi (tránh tạo trùng)
    },
  },
});

// ── Persist gợi ý AI (thay cho utils/recommendationCache tự viết) ────────────
// Gợi ý AI tốn kém: giữ cả ngày, không tự refetch.
// gcTime phải >= maxAge của persister, nếu không cache khôi phục sẽ bị dọn sớm.
const DAY = 24 * 60 * 60_000;
queryClient.setQueryDefaults(queryKeys.recommendations.all, {
  staleTime: Infinity,
  gcTime: DAY,
});

export const persister = createSyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
  key: "uiamovie-query-cache",
  throttleTime: 1000,
});

// Hằng số cấp module để tham chiếu ổn định
export const persistOptions = {
  persister,
  maxAge: DAY,
  buster: "v1", // đổi chuỗi này khi cấu trúc dữ liệu thay đổi để bỏ cache cũ
  dehydrateOptions: {
    // Chỉ lưu gợi ý AI đã thành công; không lưu danh sách phim, favorites...
    shouldDehydrateQuery: (q) =>
      q.state.status === "success" && q.queryKey[0] === queryKeys.recommendations.all[0],
  },
};

// Dọn key cũ của recommendationCache tự viết (chạy một lần; có thể xoá đoạn này sau vài tuần)
try {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k?.startsWith("rec_cache_")) localStorage.removeItem(k);
  }
} catch {
  /* private mode / SSR → bỏ qua */
}

// ── Đồng bộ với phiên đăng nhập ──────────────────────────────────────────────
// Đổi người dùng (đăng nhập / đăng xuất / đổi tài khoản, kể cả ở tab khác) → RESET cache cá nhân
// (favorites, lịch sử xem, isEligible của gói Premium, gợi ý AI...) để không lộ dữ liệu của tài khoản trước.
// - resetQueries: huỷ request đang bay + đưa về trạng thái ban đầu + tự tải lại các query đang hiển thị.
// - Cache CÔNG KHAI (home, genres) được giữ nguyên → đăng nhập xong trang chủ không bị loading lại.
// - Cập nhật hồ sơ cùng một người (đổi tên, avatar) KHÔNG reset.
const userKey = (u) => (u ? String(u.id ?? u.userId ?? u.email ?? "user") : "");
let lastUserKey = userKey(getStoredUser());

subscribeStoredUser(() => {
  const key = userKey(getStoredUser());
  if (key === lastUserKey) return;
  lastUserKey = key;
  // Gợi ý của tài khoản cũ: xoá khỏi localStorage + bỏ hẳn khỏi cache (không refetch cho tài khoản cũ)
  persister.removeClient();
  queryClient.removeQueries({ queryKey: queryKeys.recommendations.all });
  queryClient.resetQueries({
    predicate: (q) => !PUBLIC_QUERY_ROOTS.has(q.queryKey[0]),
  });
});