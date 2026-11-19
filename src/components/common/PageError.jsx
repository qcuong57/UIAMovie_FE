// src/components/common/PageError.jsx
// Màn hình lỗi dùng chung (Info / Detail / Yêu thích / Tìm kiếm / 404 / ErrorBoundary).
//
// Cách dùng:
//   <PageError error={err} onRetry={refetch} retrying={isFetching} />   // tự phân loại từ axios error
//   <PageError kind="notFound" secondaryLabel="Về trang chủ" onSecondary={...} />
//   <PageError compact kind="network" onRetry={refetch} />              // lỗi trong 1 khu vực, không full màn
//
// Tương thích ngược: <PageError message onRetry /> kiểu cũ vẫn chạy (kind = generic).
import React, { useEffect, useRef, useState } from "react";
import { C, GLOBAL_STYLES } from "../movie/ui/movieConstants";
import { resolveErrorKind, getErrorRef, getRetryAfter } from "../../utils/errorKind";

const DANGER = C.accent;
const WARN = "#F5A524";
const NEUTRAL = "#9AA3B2";

const I = {
  search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
  wifiOff: (<><path d="M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8a15 15 0 0 0-9.4-3.7M5 12.9a10 10 0 0 1 5-2.7M19 12.9a10 10 0 0 0-2.4-1.8M8.5 16.4a5 5 0 0 1 7 0M12 20h.01M2 2l20 20" /></>),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  server: (<><rect x="3" y="4" width="18" height="7" rx="2" /><rect x="3" y="13" width="18" height="7" rx="2" /><path d="M7 7.5h.01M7 16.5h.01" /></>),
  lock: (<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
  hourglass: (<><path d="M5 3h14M5 21h14M7 3v4l5 5-5 5v4M17 3v4l-5 5 5 5v4" /></>),
  refresh: (<><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></>),
  alert: (<><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></>),
};

// Mỗi loại lỗi: tiêu đề nói rõ CHUYỆN GÌ, thông điệp nói rõ AI có lỗi + NGƯỜI DÙNG NÊN LÀM GÌ.
const KINDS = {
  notFound: {
    tone: NEUTRAL, icon: I.search, code: "404",
    title: "Không tìm thấy nội dung",
    message: "Đường dẫn có thể đã sai, hoặc nội dung này đã bị gỡ khỏi hệ thống.",
  },
  offline: {
    tone: WARN, icon: I.wifiOff, autoRetry: true,
    title: "Bạn đang ngoại tuyến",
    message: "Kiểm tra lại Wi-Fi hoặc dữ liệu di động. Trang sẽ tự tải lại ngay khi có mạng.",
  },
  network: {
    tone: WARN, icon: I.wifiOff, autoRetry: true,
    title: "Không kết nối được máy chủ",
    message: "Có thể mạng của bạn đang chập chờn. Hãy thử lại sau ít giây.",
  },
  timeout: {
    tone: WARN, icon: I.clock, code: "504",
    title: "Máy chủ phản hồi quá chậm",
    message: "Yêu cầu mất quá nhiều thời gian. Bạn thử lại nhé, thường sẽ ổn ngay.",
  },
  server: {
    tone: DANGER, icon: I.server, code: "500",
    title: "Hệ thống đang gặp sự cố",
    message: "Lỗi nằm ở phía chúng tôi, không phải do bạn. Đội kỹ thuật đã được ghi nhận. Vui lòng thử lại sau ít phút.",
  },
  rateLimit: {
    tone: WARN, icon: I.hourglass, code: "429",
    title: "Bạn thao tác quá nhanh",
    message: "Vui lòng chờ một lúc rồi thử lại.",
  },
  unauthorized: {
    tone: WARN, icon: I.lock, code: "401",
    title: "Phiên đăng nhập đã hết hạn",
    message: "Vì lý do bảo mật, bạn cần đăng nhập lại để tiếp tục.",
  },
  forbidden: {
    tone: DANGER, icon: I.lock, code: "403",
    title: "Bạn không có quyền truy cập",
    message: "Nội dung này yêu cầu tài khoản hoặc gói đăng ký phù hợp.",
  },
  update: {
    tone: C.accent, icon: I.refresh,
    title: "Có bản cập nhật mới",
    message: "Phiên bản trang đã thay đổi nên không tải được nội dung. Hãy tải lại trang để tiếp tục.",
    retryLabel: "Tải lại trang",
  },
  crash: {
    tone: DANGER, icon: I.alert,
    title: "Trang gặp sự cố ngoài ý muốn",
    message: "Bạn thử tải lại hoặc quay về trang chủ. Nếu lỗi lặp lại, hãy gửi mã tham chiếu bên dưới cho bộ phận hỗ trợ.",
  },
  generic: {
    tone: DANGER, icon: I.alert,
    title: "Đã có lỗi xảy ra",
    message: "Không thể hoàn tất yêu cầu. Vui lòng thử lại.",
  },
};

const CSS = `
@keyframes peIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes peSpin{to{transform:rotate(360deg)}}
.pe-root{--pe-tone:${DANGER};min-height:100vh;min-height:100dvh;background:${C.bg};display:flex;align-items:center;justify-content:center;
  padding:calc(68px + var(--safe-top,0px)) 20px calc(24px + var(--safe-bottom,0px));box-sizing:border-box}
.pe-root.pe-compact{min-height:320px;background:transparent;padding:32px 16px}
.pe-card{animation:peIn .35s cubic-bezier(.22,1,.36,1) both;text-align:center;width:100%;max-width:440px;font-family:'Nunito',sans-serif}
.pe-icon{width:72px;height:72px;margin:0 auto 20px;border-radius:50%;display:grid;place-items:center;color:var(--pe-tone);
  background:color-mix(in srgb,var(--pe-tone) 14%,transparent);border:1px solid color-mix(in srgb,var(--pe-tone) 30%,transparent)}
.pe-icon svg{width:32px;height:32px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.pe-code{margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:.14em;color:var(--pe-tone)}
.pe-title{margin:0 0 10px;font-family:'Be Vietnam Pro',sans-serif;font-size:24px;line-height:1.3;font-weight:800;color:${C.text ?? "#fff"}}
.pe-compact .pe-title{font-size:18px}
.pe-msg{margin:0;font-size:14px;line-height:1.65;color:${C.textSub}}
.pe-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:24px}
.pe-btn{min-height:44px;padding:0 24px;border-radius:40px;font:600 14px 'Nunito',sans-serif;cursor:pointer;
  display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:filter .15s,background .15s,transform .1s}
.pe-btn:active:not(:disabled){transform:scale(.97)}
.pe-btn:focus-visible{outline:2px solid #fff;outline-offset:2px}
.pe-btn:disabled{cursor:not-allowed;opacity:.6}
.pe-primary{background:${C.accent};color:#fff;border:none}
.pe-primary:hover:not(:disabled){filter:brightness(1.1)}
.pe-secondary{background:transparent;color:${C.textSub};border:1px solid rgba(255,255,255,.18)}
.pe-secondary:hover{background:rgba(255,255,255,.06)}
.pe-spin{width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;animation:peSpin .7s linear infinite}
.pe-ref{margin-top:28px;display:inline-flex;align-items:center;gap:8px;padding:6px 6px 6px 12px;border-radius:8px;
  background:rgba(255,255,255,.05);font-size:12px;color:${C.textSub}}
.pe-ref code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:${C.text ?? "#fff"};letter-spacing:.06em;user-select:all}
.pe-ref button{border:none;background:rgba(255,255,255,.08);color:inherit;border-radius:6px;padding:4px 10px;font:600 12px 'Nunito',sans-serif;cursor:pointer}
.pe-ref button:hover{background:rgba(255,255,255,.14)}
.pe-ref button:focus-visible{outline:2px solid #fff}
.pe-details{margin:20px auto 0;text-align:left;font-size:11px;color:${C.textSub}}
.pe-details pre{margin:8px 0 0;max-height:160px;overflow:auto;padding:10px;border-radius:8px;background:rgba(0,0,0,.35);white-space:pre-wrap;word-break:break-word}
@media (max-width:480px){.pe-actions{flex-direction:column}.pe-btn{width:100%}.pe-title{font-size:21px}}
@media (prefers-reduced-motion:reduce){.pe-card,.pe-spin{animation:none}.pe-btn{transition:none}}
`;

export default function PageError({
  kind, // ghi đè loại lỗi; bỏ trống → tự suy ra từ `error`
  error, // axios error / Error — dùng để phân loại + lấy mã tham chiếu từ server
  title, // ghi đè tiêu đề mặc định của kind
  message, // ghi đè nội dung mặc định của kind
  onRetry, // bỏ trống → ẩn nút chính
  retryLabel,
  retrying = false, // true → khoá nút + spinner, tránh bấm liên tiếp
  secondaryLabel, // nút phụ (vd. "Về trang chủ"); cần truyền cùng onSecondary
  onSecondary,
  errorId, // mã lỗi client (ErrorBoundary tạo); ưu tiên hơn mã từ server
  details, // chi tiết kỹ thuật — CHỈ nên truyền ở DEV
  retryAfter, // giây chờ trước khi cho thử lại (429); mặc định đọc từ header Retry-After
  compact = false, // true → lỗi trong 1 khu vực, không chiếm full màn / không chừa Navbar
}) {
  const resolved = kind || (error ? resolveErrorKind(error) : "generic");
  const cfg = KINDS[resolved] || KINDS.generic;
  const ref = errorId || getErrorRef(error);
  const status = error?.response?.status;
  const code = status && status >= 400 ? String(status) : cfg.code;

  // Đếm ngược cho 429
  const wait = retryAfter ?? getRetryAfter(error);
  const [left, setLeft] = useState(wait || 0);
  useEffect(() => setLeft(wait || 0), [wait]);
  useEffect(() => {
    if (left <= 0) return undefined;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  // Offline / network: tự thử lại khi có mạng trở lại
  const retryRef = useRef(onRetry);
  retryRef.current = onRetry;
  useEffect(() => {
    if (!cfg.autoRetry) return undefined;
    const handler = () => retryRef.current?.();
    window.addEventListener("online", handler);
    return () => window.removeEventListener("online", handler);
  }, [cfg.autoRetry]);

  const [copied, setCopied] = useState(false);
  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(ref);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard bị chặn → người dùng vẫn bôi đen được vì user-select:all */
    }
  };

  const Heading = compact ? "h2" : "h1";
  const label = retryLabel || cfg.retryLabel || "Thử lại";
  const retryDisabled = retrying || left > 0;

  return (
    <div role="alert" className={`pe-root${compact ? " pe-compact" : ""}`} style={{ "--pe-tone": cfg.tone }}>
      {!compact && <style>{GLOBAL_STYLES}</style>}
      <style>{CSS}</style>
      <div className="pe-card">
        <div className="pe-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">{cfg.icon}</svg>
        </div>
        {code && <p className="pe-code">{code}</p>}
        <Heading className="pe-title">{title || cfg.title}</Heading>
        <p className="pe-msg">{message || cfg.message}</p>

        {(onRetry || onSecondary) && (
          <div className="pe-actions">
            {onRetry && (
              <button type="button" className="pe-btn pe-primary" onClick={onRetry} disabled={retryDisabled}>
                {retrying && <span className="pe-spin" aria-hidden="true" />}
                {retrying ? "Đang thử lại…" : left > 0 ? `${label} (${left}s)` : label}
              </button>
            )}
            {onSecondary && (
              <button type="button" className="pe-btn pe-secondary" onClick={onSecondary}>
                {secondaryLabel}
              </button>
            )}
          </div>
        )}

        {ref && (
          <div className="pe-ref">
            <span>Mã tham chiếu</span>
            <code>{ref}</code>
            <button type="button" onClick={copyRef} aria-live="polite">
              {copied ? "Đã sao chép" : "Sao chép"}
            </button>
          </div>
        )}

        {details && (
          <details className="pe-details">
            <summary>Chi tiết kỹ thuật (dev)</summary>
            <pre>{details}</pre>
          </details>
        )}
      </div>
    </div>
  );
}