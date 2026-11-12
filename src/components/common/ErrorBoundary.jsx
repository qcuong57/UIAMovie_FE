// src/components/common/ErrorBoundary.jsx
// Bắt lỗi RENDER của cây con (lỗi runtime trong component) và hiện PageError thay vì trắng màn hình.
// Không bắt: lỗi trong event handler, setTimeout, hay request thất bại — các lỗi đó đã được
// React Query / từng trang tự xử lý (PageError + onRetry).
// Dùng 2 tầng: quanh <Outlet /> (Navbar còn nguyên) và quanh toàn app (lưới an toàn cuối).
import React from "react";
import PageError from "./PageError";

const DEFAULT_MESSAGE = "Trang gặp sự cố ngoài ý muốn. Bạn thử tải lại hoặc quay về trang chủ nhé.";

// Lỗi tải chunk (lazy route) sau khi deploy: file hash cũ không còn trên server → import() thất bại.
// Cách xử lý đúng là tải lại trang để lấy index.html + chunk mới.
const CHUNK_ERROR_RE =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk [\w-]+ failed|ChunkLoadError|Unable to preload CSS/i;
const isChunkError = (e) => CHUNK_ERROR_RE.test(`${e?.name ?? ""} ${e?.message ?? ""}`);

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
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (isChunkError(error) && autoReloadOnce()) return;
    if (import.meta.env.DEV) console.error("[ErrorBoundary]", error, info?.componentStack);
    // TODO(prod): Sentry.captureException(error, { extra: { componentStack: info?.componentStack } });
  }

  componentDidUpdate(prevProps) {
    // Đổi resetKey (vd. đổi route) → thoát khỏi trạng thái lỗi
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (isChunkError(error)) {
      return (
        <PageError
          title="Có bản cập nhật mới"
          message="Phiên bản trang đã thay đổi nên không tải được nội dung. Hãy tải lại trang để tiếp tục."
          onRetry={reloadPage}
          retryLabel="Tải lại trang"
          secondaryLabel="Về trang chủ"
          onSecondary={goHome}
        />
      );
    }

    return (
      <PageError
        title="Rất tiếc!"
        // Dev: hiện nguyên nhân để sửa nhanh; production: chỉ hiện câu thân thiện
        message={import.meta.env.DEV && error?.message ? error.message : DEFAULT_MESSAGE}
        onRetry={this.reset}
        retryLabel="Thử lại"
        secondaryLabel="Về trang chủ"
        onSecondary={goHome}
      />
    );
  }
}