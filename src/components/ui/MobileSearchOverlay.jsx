// src/components/ui/MobileSearchOverlay.jsx
// Tìm kiếm toàn màn hình trên mobile.
// Dùng portal vì <nav> có backdrop-filter → mọi phần tử fixed bên trong nó
// sẽ bị "nhốt" theo nav thay vì theo viewport.
// Cải tiến:
//  • Bám VISUAL viewport thật: iOS Safari không co layout viewport khi bàn phím mở, nên `inset:0`
//    làm kết quả cuối + nút "Xem tất cả" nằm dưới bàn phím. Đo bằng window.visualViewport.
//  • Vuốt danh sách → ẩn bàn phím (không dùng onScroll để khỏi blur nhầm khi nội dung đổi lúc đang gõ).
//  • Phím Esc đóng overlay; aria-modal cho trình đọc màn hình.
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Search, X } from "lucide-react";
import { useBodyScrollLock } from "../../hooks/common/useBodyScrollLock";

const FULL = { inset: 0 };

// Hộp hiển thị thực (loại trừ vùng bàn phím). null → dùng inset:0.
const useVisualViewportBox = (active) => {
  const [box, setBox] = useState(null);
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!active || !vv) return undefined;
    const update = () =>
      setBox((prev) =>
        prev && prev.top === vv.offsetTop && prev.height === vv.height
          ? prev
          : { top: vv.offsetTop, height: vv.height },
      );
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setBox(null);
    };
  }, [active]);
  return box;
};

const MobileSearchOverlay = ({ isOpen, query, onQueryChange, onSubmit, onClose, children }) => {
  useBodyScrollLock(isOpen);
  const box = useVisualViewportBox(isOpen);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const dismissKeyboard = () => {
    if (document.activeElement === inputRef.current) inputRef.current.blur();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm"
      style={{
        position: "fixed",
        ...(box ? { left: 0, right: 0, top: box.top, height: box.height } : FULL),
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        background: "#0a0a0a",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "calc(8px + env(safe-area-inset-top, 0px)) 8px 8px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <button type="button" onClick={onClose} aria-label="Quay lại" style={iconBtn}>
          <ArrowLeft size={20} />
        </button>

        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 12px", borderRadius: 12, background: "rgba(255,255,255,0.08)" }}>
          <Search size={16} style={{ color: "rgba(255,255,255,0.5)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            autoFocus
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Tìm phim, TV show, diễn viên..."
            style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 16 /* ≥16px: Safari không tự zoom */, fontFamily: "'DM Sans', sans-serif" }}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                onQueryChange("");
                inputRef.current?.focus();
              }}
              aria-label="Xoá"
              style={{ ...iconBtn, width: 28, height: 28 }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </form>

      <div
        onTouchMove={dismissKeyboard}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};

const iconBtn = {
  width: 42,
  height: 42,
  display: "grid",
  placeItems: "center",
  background: "none",
  border: "none",
  color: "rgba(255,255,255,0.8)",
  cursor: "pointer",
  flexShrink: 0,
};

export default MobileSearchOverlay;