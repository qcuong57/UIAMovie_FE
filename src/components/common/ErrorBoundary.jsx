// src/components/common/ErrorBoundary.jsx
// Bắt lỗi RENDER của cây con (lỗi runtime trong component) và hiện PageError thay vì trắng màn hình.
// Không bắt: lỗi trong event handler, setTimeout, hay request thất bại — các lỗi đó đã được
// React Query / từng trang tự xử lý (PageError + onRetry).
// Dùng 2 tầng: quanh <Outlet /> (Navbar còn nguyên) và quanh toàn app (lưới an toàn cuối).
//
// Mỗi lần crash sinh 1 errorId: hiện cho người dùng + gắn vào báo cáo lỗi → support/dev tra đúng 1 sự cố.
import React from "react";
import PageError from "./PageError";
import { isChunkError, createErrorId } from "../../utils/errorKind";

const RELOAD_KEY = "chunk-reload-at";
const RELOAD_COOLDOWN_MS = 10_000;

// Tự reload đúng 1 lần (chống vòng lặp nếu lỗi do nguyên nhân khác, vd. mạng đứt)
function autoReloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false; // sessionStorage bị chặn → không tự reload, để người dùng bấm nút
  }
  window.location.reload();
  return true;
}

const reloadPage = () => window.location.reload();

// Reload hẳn để thoát khỏi trạng thái hỏng (cố ý KHÔNG dùng navigate: đây là đường thoát khi app đã lỗi)
const goHome = () => window.location.assign("/");

export default class ErrorBoundary extends React.Component {
  state = { error: null, errorId: null };

  static getDerivedStateFromError(error) {
    return { error, errorId: createErrorId() };
  }

  componentDidCatch(error, info) {
    if (isChunkError(error) && autoReloadOnce()) return;
    if (import.meta.env.DEV) console.error("[ErrorBoundary]", this.state.errorId, error, info?.componentStack);
    // Hook báo cáo (Sentry, v.v.): luôn gắn errorId để khớp với mã người dùng nhìn thấy.
    // TODO(prod): Sentry.captureException(error, { tags: { errorId: this.state.errorId }, extra: { componentStack: info?.componentStack, url: location.href } });
    this.props.onError?.(error, { errorId: this.state.errorId, componentStack: info?.componentStack });
  }

  componentDidUpdate(prevProps) {
    // Đổi resetKey (vd. đổi route) → thoát khỏi trạng thái lỗi
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null, errorId: null });
    }
  }

  reset = () => this.setState({ error: null, errorId: null });

  render() {
    const { error, errorId } = this.state;
    if (!error) return this.props.children;

    if (isChunkError(error)) {
      return (
        <PageError
          kind="update"
          onRetry={reloadPage}
          secondaryLabel="Về trang chủ"
          onSecondary={goHome}
        />
      );
    }

    return (
      <PageError
        kind="crash"
        errorId={errorId}
        // Dev: hiện nguyên nhân để sửa nhanh; production: chỉ hiện câu thân thiện + mã tham chiếu
        details={import.meta.env.DEV ? `${error?.message ?? ""}\n\n${error?.stack ?? ""}` : undefined}
        onRetry={this.reset}
        secondaryLabel="Về trang chủ"
        onSecondary={goHome}
      />
    );
  }
}