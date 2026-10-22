// src/components/ui/MobileSearchOverlay.jsx
// Tìm kiếm toàn màn hình trên mobile.
// Dùng portal vì <nav> có backdrop-filter → mọi phần tử fixed bên trong nó
// sẽ bị "nhốt" theo nav thay vì theo viewport.
import React from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Search, X } from "lucide-react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

const MobileSearchOverlay = ({ isOpen, query, onQueryChange, onSubmit, onClose, children }) => {
  useBodyScrollLock(isOpen);
  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-label="Tìm kiếm"
      style={{
        position: "fixed",
        inset: 0, // bám visual viewport, không bị toolbar Safari che
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
            autoFocus
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Tìm phim, TV show, diễn viên..."
            style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 16 /* ≥16px: Safari không tự zoom */, fontFamily: "'DM Sans', sans-serif" }}
          />
          {query && (
            <button type="button" onClick={() => onQueryChange("")} aria-label="Xoá" style={{ ...iconBtn, width: 28, height: 28 }}>
              <X size={15} />
            </button>
          )}
        </div>
      </form>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overscrollBehavior: "contain",
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