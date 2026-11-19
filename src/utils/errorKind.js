// src/utils/errorKind.js
// Phân loại lỗi (axios / runtime) → "kind" để PageError chọn đúng nội dung, icon, hành động.
// Cũng trích mã tham chiếu (traceId của ASP.NET ProblemDetails / header X-Request-Id) để người dùng
// gửi cho support và dev tra log nhanh.

const CHUNK_ERROR_RE =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk [\w-]+ failed|ChunkLoadError|Unable to preload CSS/i;

export const isChunkError = (e) => CHUNK_ERROR_RE.test(`${e?.name ?? ""} ${e?.message ?? ""}`);

/**
 * @returns {"notFound"|"unauthorized"|"forbidden"|"rateLimit"|"timeout"|"server"|"offline"|"network"|"update"|"generic"}
 */
export function resolveErrorKind(error) {
  if (!error) return "generic";
  if (isChunkError(error)) return "update";

  const status = error?.response?.status ?? error?.status;
  if (status) {
    if (status === 404) return "notFound";
    if (status === 401) return "unauthorized";
    if (status === 403) return "forbidden";
    if (status === 408 || status === 504) return "timeout";
    if (status === 429) return "rateLimit";
    if (status >= 500) return "server";
    return "generic";
  }

  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";
  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") return "timeout";
  // axios: có request nhưng không có response → mất mạng / CORS / server sập
  if (error?.code === "ERR_NETWORK" || /Network Error/i.test(error?.message ?? "") || (error?.request && !error?.response)) {
    return "network";
  }
  return "generic";
}

/** Mã tham chiếu từ server (ProblemDetails.traceId hoặc X-Request-Id), nếu có. */
export function getErrorRef(error) {
  const data = error?.response?.data;
  const fromBody = data && typeof data === "object" ? data.traceId : null;
  const h = error?.response?.headers;
  const fromHeader = h?.["x-request-id"] ?? h?.["x-correlation-id"] ?? null;
  return fromBody || fromHeader || null;
}

/** Số giây cần chờ (header Retry-After dạng giây) — dùng cho 429. */
export function getRetryAfter(error) {
  const raw = error?.response?.headers?.["retry-after"];
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 && n <= 120 ? Math.ceil(n) : 0;
}

/** Mã lỗi phía client (crash render) — ngắn, dễ đọc qua điện thoại, không có ký tự dễ nhầm (0/O, 1/I). */
export function createErrorId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  (globalThis.crypto || { getRandomValues: (a) => a.map(() => Math.floor(Math.random() * 256)) }).getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}