// src/utils/queryHelpers.js
// Tiện ích dùng chung cho các queryFn / select.

/**
 * Bóc mảng từ các dạng response khác nhau của BE:
 *   [..]  |  { items }  |  { data: [..] }  |  { data: { items } }  |  { [extraKey] }  |  { data: { [extraKey] } }
 * Không tìm thấy → [] (luôn trả về mảng, không bao giờ undefined).
 */
export const unwrapList = (d, extraKeys = []) => {
  if (Array.isArray(d)) return d;
  if (!d || typeof d !== "object") return [];
  const inner = d.data && typeof d.data === "object" ? d.data : null;
  const candidates = [
    d.items,
    inner?.items,
    d.data,
    ...extraKeys.map((k) => d[k]),
    ...extraKeys.map((k) => inner?.[k]),
  ];
  return candidates.find(Array.isArray) ?? [];
};

/**
 * Dùng cho nguồn DỮ LIỆU PHỤ (vd. endpoint TV show chưa có ở BE):
 * chỉ nuốt 404/501 (endpoint không tồn tại) → [].
 * Mọi lỗi thật (mạng, 5xx, 401...) vẫn ném ra để React Query retry / báo lỗi,
 * thay vì cache một danh sách rỗng "giả" như `.catch(() => [])`.
 */
export const ignoreMissingEndpoint = (promiseOrValue) =>
  Promise.resolve(promiseOrValue).catch((err) => {
    const status = err?.response?.status;
    if (status === 404 || status === 501) return [];
    throw err;
  });
/** Bóc 1 object từ response: { data: { data } } | { data } | chính nó. */
export const unwrapOne = (r) => r?.data?.data ?? r?.data ?? r;

/**
 * Response phân trang của BE → { items, total }.
 * total lấy từ totalCount | total | count (ở ngoài hoặc trong data); không có thì dùng items.length.
 */
export const parsePaged = (res, extraKeys = []) => {
  const items = unwrapList(res, extraKeys);
  const inner = res?.data && typeof res.data === "object" && !Array.isArray(res.data) ? res.data : null;
  const total =
    res?.totalCount ?? res?.total ?? res?.count ??
    inner?.totalCount ?? inner?.total ?? inner?.count ??
    items.length;
  return { items, total: Number(total) || 0 };
};