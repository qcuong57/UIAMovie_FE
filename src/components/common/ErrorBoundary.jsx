// src/components/common/ErrorBoundary.jsx
// Bắt lỗi RENDER của cây con (lỗi runtime trong component) và hiện PageError thay vì trắng màn hình.
// Không bắt: lỗi trong event handler, setTimeout, hay request thất bại — các lỗi đó đã được
// React Query / từng trang tự xử lý (PageError + onRetry).
// Dùng 2 tầng: quanh <Outlet /> (Navbar còn nguyên) và quanh toàn app (lưới an toàn cuối).
import React from "react";
import PageError from "./PageError";

const DEFAULT_MESSAGE = "Trang gặp sự cố ngoài ý muốn. Bạn thử tải lại hoặc quay về trang chủ nhé.";

// Reload hẳn để thoát khỏi trạng thái hỏng (cố ý KHÔNG dùng navigate: đây là đường thoát khi app đã lỗi)
const goHome = () => window.location.assign("/");

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
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