// src/components/movie/shared/review/OwnerMenu.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Edit2,
  Trash2,
  MoreHorizontal,
} from "lucide-react";

// ── Menu ⋯ cho review của chính mình ───────────────────────────────────────
const OwnerMenu = ({ onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector("button")?.focus();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const items = Array.from(
          ref.current?.querySelectorAll('[role="menuitem"]') ?? [],
        );
        if (!items.length) return;
        e.preventDefault();
        const i = items.indexOf(document.activeElement);
        const next =
          e.key === "ArrowDown"
            ? (i + 1) % items.length
            : (i - 1 + items.length) % items.length;
        items[next].focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="rv-icon"
        aria-label="Tùy chọn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div role="menu" className="rv-menu">
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <Edit2 size={14} /> Sửa
          </button>
          <button
            role="menuitem"
            className="danger"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 size={14} /> Xóa
          </button>
        </div>
      )}
    </div>
  );
};

export default OwnerMenu;
