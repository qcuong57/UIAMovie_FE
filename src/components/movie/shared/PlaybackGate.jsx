// src/components/movie/shared/PlaybackGate.jsx
// Hiển thị thay cho player khi chưa có link phát: đang tải / cần đăng nhập /
// cần Premium / lỗi (404, mạng). Dùng chung cho MovieVideoPlayer & EpisodeVideoPlayer.

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, Crown, LogIn, RefreshCw, VideoOff } from "lucide-react";
import { C } from "../ui/movieConstants";
import PremiumGateModal from "../ui/PremiumGateModal";

const FONT = "'Nunito',sans-serif";

function Btn({ onClick, primary, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 22px",
        borderRadius: 999,
        border: primary ? "none" : "1.5px solid rgba(255,255,255,0.28)",
        background: primary ? C.accent : "transparent",
        color: "#fff",
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

/**
 * @param {"idle"|"loading"|"ready"|"blocked"|"error"} status
 * @param {object|null} playback      kết quả normalizePlayback (khi blocked)
 * @param {any}         error         lỗi axios (khi error)
 * @param {Function}    onRetry
 * @param {string}      backdropUrl   ảnh nền mờ phía sau
 * @param {string}      loginPath     mặc định "/login"
 * @param {string}      upgradePath   mặc định "/premium"  ← chỉnh theo route thật của app
 */
export default function PlaybackGate({
  status,
  playback,
  error,
  onRetry,
  backdropUrl,
  loginPath = "/welcome",
  upgradePath = "/premium",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  // Tự mở PremiumGateModal 1 lần khi bị chặn vì chưa có Premium; đóng rồi vẫn còn thẻ bên dưới
  const [modalOpen, setModalOpen] = useState(true);

  let icon = null;
  let title = "";
  let desc = "";
  let actions = null;
  const loading = status === "loading" || status === "idle";

  if (status === "blocked") {
    const reason = playback?.blockReason;
    if (reason === "LOGIN_REQUIRED") {
      icon = <Lock size={30} />;
      title = "Đăng nhập để xem";
      desc = playback?.message || "Nội dung Premium cần đăng nhập để xem.";
      actions = (
        <Btn primary onClick={() => navigate(loginPath, { state: { from: location } })}>
          <LogIn size={16} /> Đăng nhập
        </Btn>
      );
    } else if (reason === "PREMIUM_REQUIRED") {
      icon = <Crown size={30} />;
      title = "Dành cho thành viên Premium";
      desc = playback?.message || "Nâng cấp gói Premium để xem nội dung này.";
      actions = (
        <Btn primary onClick={() => setModalOpen(true)}>
          <Crown size={16} /> Nâng cấp Premium
        </Btn>
      );
    } else {
      icon = <Lock size={30} />;
      title = "Không thể phát nội dung này";
      desc = playback?.message || "Bạn chưa có quyền xem nội dung này.";
    }
  } else if (status === "error" || status === "ready") {
    // "ready" mà tới đây = canWatch nhưng không có URL phát → coi như lỗi dữ liệu
    const http = error?.response?.status;
    icon = <VideoOff size={30} />;
    if (http === 404 || status === "ready") {
      title = "Video chưa sẵn sàng";
      desc = error?.response?.data?.message || "Nội dung này chưa có video để phát.";
    } else {
      title = "Không tải được video";
      desc = error?.response?.data?.message || "Kiểm tra kết nối mạng rồi thử lại.";
      actions = onRetry && (
        <Btn onClick={onRetry}>
          <RefreshCw size={16} /> Thử lại
        </Btn>
      );
    }
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        borderRadius: 12,
        overflow: "hidden",
        background: "#111",
      }}
    >
      <PremiumGateModal
        open={status === "blocked" && playback?.blockReason === "PREMIUM_REQUIRED" && modalOpen}
        onClose={() => setModalOpen(false)}
        movieTitle={playback?.title}
        onUpgrade={() => navigate(upgradePath, { state: { from: location } })}
      />
      <style>{`
        @keyframes pg-spin { to { transform: rotate(360deg); } }
        @keyframes pg-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pg-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        @keyframes pg-pulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.9; } }
      `}</style>

      {backdropUrl && (
        <img
          src={backdropUrl}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: loading ? 0.5 : 0.28,
            filter: loading ? "blur(2px) saturate(0.9)" : "blur(2px)",
            transition: "opacity 0.3s ease",
          }}
        />
      )}

      {/* Lớp gradient nhẹ phía dưới, chỉ ở trạng thái loading — gợi cảm giác "đang vào nội dung"
          thay vì phủ đen toàn bộ khung hình như trước, giữ cho backdrop vẫn nhìn rõ. */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)",
          }}
        />
      )}

      <div
        role={loading ? "status" : "alert"}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          padding: 20,
          textAlign: "center",
          color: "#fff",
          fontFamily: FONT,
          animation: "pg-fade-in 0.25s ease-out",
        }}
      >
        {loading ? (
          <>
            <span
              aria-label="Đang tải"
              style={{
                width: 28,
                height: 28,
                border: "2.5px solid rgba(255,255,255,0.22)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "pg-spin 0.75s linear infinite",
              }}
            />
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 600,
                opacity: 0.8,
                letterSpacing: 0.2,
                animation: "pg-pulse 1.6s ease-in-out infinite",
              }}
            >
              Đang chuẩn bị video…
            </p>
          </>
        ) : (
          <>
            <div style={{ color: C.accent }}>{icon}</div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{title}</p>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.75, maxWidth: 360 }}>{desc}</p>
            {actions && <div style={{ marginTop: 6 }}>{actions}</div>}
          </>
        )}
      </div>
    </div>
  );
}