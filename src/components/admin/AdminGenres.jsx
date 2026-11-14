// src/pages/admin/AdminGenres.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Quản lý thể loại. Cùng khuôn với AdminRevenue:
//   - dữ liệu qua react-query (useAdminGenres / useGenreMutations), không tự giữ state danh sách;
//   - refetch nền lỗi thì giữ dữ liệu cũ, chỉ hiện ErrorBox khi chưa có gì để hiển thị;
//   - một modal dùng chung cho thêm / sửa / xoá, state modal gom vào một biến `dialog`.
// ─────────────────────────────────────────────────────────────────────────────

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Pencil, AlertCircle, Check, X, Search } from "lucide-react";
import { useAdminGenres, useGenreMutations } from "../../hooks/useAdminGenres";
import { getApiErrorMessage } from "../../utils/apiError";
import { useToast } from "./common/Toast";
import {
  T,
  FONT_BODY as FONT,
  FONT_TITLE,
  ADMIN_GOOGLE_FONTS,
} from "../../context/adminTokens";

// ── Constants ─────────────────────────────────────────────────────────────────

const PALETTE = [
  "#1C5F3A", "#1D4ED8", "#9333EA", "#D97706", "#DC2626",
  "#0891B2", "#BE185D", "#166534", "#C2410C", "#0E7490",
];

const NAME_MAX = 100;
const DESC_MAX = 500;

const CSS = `
  @keyframes gn-spin { to { transform: rotate(360deg); } }
  .gn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; }
  .gn-card { transition: box-shadow 0.15s; }
  .gn-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09) !important; }
  .gn-icon-btn { transition: all 0.15s; }
  .gn-icon-btn:hover { background: ${T.accentLight} !important; color: ${T.accent} !important; }
  .gn-icon-btn.danger:hover { background: #FEE2E2 !important; color: ${T.red} !important; }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Màu theo id (không theo vị trí) → thêm / xoá / lọc không làm thẻ đổi màu. */
const colorOf = (id) => {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
};

/** Bỏ dấu + hạ chữ thường để tìm "hanh dong" ra "Hành động". */
const normalize = (s) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();

// ── Small components ──────────────────────────────────────────────────────────

const Spinner = ({ size = 28, pad = 80 }) => (
  <div style={{ display: "flex", justifyContent: "center", padding: `${pad}px 0` }}>
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2.5px solid ${T.accentLight}`,
        borderTopColor: T.accent,
        animation: "gn-spin 0.75s linear infinite",
      }}
    />
  </div>
);

const Empty = ({ text }) => (
  <p
    style={{
      fontFamily: FONT,
      fontSize: 13,
      color: T.textMuted,
      textAlign: "center",
      padding: "60px 0",
      margin: 0,
    }}
  >
    {text}
  </p>
);

const Btn = ({ children, onClick, type = "button", variant = "ghost", disabled, icon }) => {
  const styles = {
    primary: { bg: T.accent, color: "#fff", border: "transparent" },
    danger: { bg: T.red, color: "#fff", border: "transparent" },
    ghost: { bg: T.surfaceAlt, color: T.textSub, border: T.border },
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 16px",
        borderRadius: 8,
        background: styles.bg,
        color: styles.color,
        border: `1px solid ${styles.border}`,
        fontFamily: FONT,
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: "nowrap",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        outline: "none",
        transition: "opacity 0.15s",
      }}
    >
      {icon}
      {children}
    </button>
  );
};

const ErrorBox = ({ text, onRetry }) => (
  <div style={{ textAlign: "center", padding: "60px 0" }}>
    <p style={{ fontFamily: FONT, fontSize: 13, color: T.red, margin: "0 0 12px" }}>{text}</p>
    <Btn onClick={onRetry}>Thử lại</Btn>
  </div>
);

const Field = ({ label, hint, error, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label
      style={{
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: 700,
        color: T.textMuted,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {label}
      {hint && (
        <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0 }}> ({hint})</span>
      )}
    </label>
    {children}
    {error && (
      <p role="alert" style={{ fontFamily: FONT, fontSize: 11.5, color: T.red, margin: 0 }}>
        {error}
      </p>
    )}
  </div>
);

const TextInput = ({ invalid, ...props }) => (
  <input
    {...props}
    style={{
      width: "100%",
      boxSizing: "border-box",
      padding: "10px 14px",
      background: T.surface,
      border: `1px solid ${invalid ? T.red : T.border}`,
      borderRadius: 10,
      color: T.text,
      outline: "none",
      fontFamily: FONT,
      fontSize: 13.5,
      transition: "border-color 0.15s",
    }}
    onFocus={(e) => {
      if (!invalid) e.target.style.borderColor = T.borderFocus;
    }}
    onBlur={(e) => {
      e.target.style.borderColor = invalid ? T.red : T.border;
    }}
  />
);

// ── Modal (một khung dùng chung; Esc / bấm nền để đóng, khoá khi đang lưu) ───

function Modal({ title, onClose, onSubmit, busy, footer, children }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => !busy && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(3px)",
      }}
    >
      <motion.form
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        style={{
          width: 420,
          maxWidth: "100%",
          maxHeight: "90vh",
          background: T.surface,
          borderRadius: 16,
          border: `1px solid ${T.border}`,
          boxShadow: T.shadowLg,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: FONT,
        }}
      >
        <header
          style={{
            padding: "18px 20px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                color: T.textMuted,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                margin: "0 0 3px",
                fontWeight: 600,
              }}
            >
              Thể loại
            </p>
            <h2
              style={{
                fontFamily: FONT_TITLE,
                fontSize: 17,
                fontWeight: 700,
                color: T.text,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Đóng"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: T.surfaceAlt,
              border: `1px solid ${T.border}`,
              cursor: busy ? "not-allowed" : "pointer",
              color: T.textSub,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={15} />
          </button>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>{children}</div>

        <footer
          style={{
            padding: "14px 20px",
            borderTop: `1px solid ${T.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          {footer}
        </footer>
      </motion.form>
    </motion.div>
  );
}

// ── Form thêm / sửa (state form nằm trong component → mở lại là sạch) ────────

function GenreFormModal({ genre, saving, onSubmit, onClose }) {
  const [name, setName] = useState(genre?.name ?? "");
  const [description, setDescription] = useState(genre?.description ?? "");
  const [error, setError] = useState("");
  const isEdit = !!genre;

  const submit = async () => {
    const payload = { name: name.trim(), description: description.trim() };
    if (!payload.name) return setError("Tên thể loại không được để trống");
    setError("");
    const message = await onSubmit(payload); // trả về chuỗi lỗi nếu thất bại
    if (message) setError(message);
  };

  return (
    <Modal
      title={isEdit ? "Chỉnh sửa thể loại" : "Thêm thể loại mới"}
      onClose={onClose}
      onSubmit={submit}
      busy={saving}
      footer={
        <>
          <Btn onClick={onClose} disabled={saving}>Hủy</Btn>
          <Btn
            type="submit"
            variant="primary"
            disabled={saving}
            icon={<Check size={13} />}
          >
            {saving ? "Đang lưu…" : isEdit ? "Lưu" : "Tạo mới"}
          </Btn>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Tên thể loại" error={error}>
          <TextInput
            autoFocus
            value={name}
            maxLength={NAME_MAX}
            invalid={!!error}
            placeholder="VD: Hành động, Tình cảm…"
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
          />
        </Field>
        <Field label="Mô tả" hint="tùy chọn">
          <TextInput
            value={description}
            maxLength={DESC_MAX}
            placeholder="Mô tả ngắn về thể loại"
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}

// ── Xác nhận xoá ──────────────────────────────────────────────────────────────

function DeleteGenreModal({ genre, deleting, onConfirm, onClose }) {
  return (
    <Modal
      title="Xác nhận xóa"
      onClose={onClose}
      onSubmit={onConfirm}
      busy={deleting}
      footer={
        <>
          <Btn onClick={onClose} disabled={deleting}>Hủy</Btn>
          <Btn
            type="submit"
            variant="danger"
            disabled={deleting}
            icon={<Trash2 size={13} />}
          >
            {deleting ? "Đang xóa…" : "Xóa thể loại"}
          </Btn>
        </>
      }
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#FEF2F2",
            border: "1px solid rgba(220,38,38,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AlertCircle size={18} color={T.red} />
        </div>
        <div>
          <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: T.text, margin: "0 0 4px" }}>
            Xóa thể loại “{genre.name}”?
          </p>
          <p style={{ fontFamily: FONT, fontSize: 13, color: T.textSub, lineHeight: 1.6, margin: 0 }}>
            Hành động này không thể hoàn tác. Các phim liên kết sẽ mất thể loại này.
          </p>
        </div>
      </div>
    </Modal>
  );
}

// ── Genre card ────────────────────────────────────────────────────────────────

const iconBtn = {
  width: 28,
  height: 28,
  borderRadius: 7,
  background: T.surfaceHov,
  border: `1px solid ${T.border}`,
  color: T.textSub,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const GenreCard = memo(function GenreCard({ genre, index, onEdit, onDelete }) {
  const color = colorOf(genre.id);
  return (
    <motion.div
      layout
      className="gn-card"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ delay: Math.min(index, 12) * 0.03 }}
      style={{
        background: T.surface,
        borderRadius: 14,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        padding: "18px 18px 16px",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: `${color}18`,
            border: `1px solid ${color}30`,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
        </div>
        <p
          title={genre.name}
          style={{
            fontFamily: FONT,
            fontSize: 14,
            fontWeight: 600,
            color: T.text,
            margin: 0,
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {genre.name}
        </p>
      </div>

      {genre.description && (
        <p
          style={{
            fontFamily: FONT,
            fontSize: 12,
            color: T.textMuted,
            lineHeight: 1.5,
            margin: 0,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {genre.description}
        </p>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
        }}
      >
        {genre.movieCount !== undefined ? (
          <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>
            {genre.movieCount} phim
          </span>
        ) : (
          <span />
        )}
        <div style={{ display: "flex", gap: 5 }}>
          <button
            type="button"
            className="gn-icon-btn"
            style={iconBtn}
            aria-label={`Sửa ${genre.name}`}
            onClick={() => onEdit(genre)}
          >
            <Pencil size={12} />
          </button>
          <button
            type="button"
            className="gn-icon-btn danger"
            style={{
              ...iconBtn,
              background: "#FEF2F2",
              border: "1px solid rgba(220,38,38,0.18)",
              color: T.red,
            }}
            aria-label={`Xóa ${genre.name}`}
            onClick={() => onDelete(genre)}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminGenres() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const genresQ = useAdminGenres();
  const { save, remove } = useGenreMutations();
  const genres = genresQ.data ?? [];
  // Refetch nền lỗi vẫn còn dữ liệu cũ → chỉ coi là lỗi khi chưa có gì để hiện.
  const loading = genresQ.isPending;
  const loadError = genresQ.isError && !genresQ.data;

  // null | { type: "form", genre: null | Genre } | { type: "delete", genre }
  const [dialog, setDialog] = useState(null);
  const [keyword, setKeyword] = useState("");

  // Báo lỗi một lần cho mỗi lần tải thất bại khi chưa có dữ liệu
  useEffect(() => {
    if (loadError) {
      console.error(genresQ.error);
      toastRef.current?.error?.(
        getApiErrorMessage(genresQ.error, "Không thể tải danh sách thể loại"),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genresQ.errorUpdatedAt, loadError]);

  const closeDialog = useCallback(() => setDialog(null), []);
  const openAdd = useCallback(() => setDialog({ type: "form", genre: null }), []);
  const openEdit = useCallback((genre) => setDialog({ type: "form", genre }), []);
  const openDelete = useCallback((genre) => setDialog({ type: "delete", genre }), []);

  const visible = useMemo(() => {
    const q = normalize(keyword.trim());
    if (!q) return genres;
    return genres.filter((g) => normalize(`${g.name} ${g.description ?? ""}`).includes(q));
  }, [genres, keyword]);

  /** Trả về chuỗi lỗi để form hiển thị; thành công thì đóng modal và trả về undefined. */
  const handleSave = async (payload) => {
    const editing = dialog?.genre;
    try {
      await save.mutateAsync({ id: editing?.id, payload });
      closeDialog();
      toastRef.current?.success?.(
        editing ? "Cập nhật thể loại thành công" : "Thêm thể loại thành công",
      );
    } catch (e) {
      console.error(e);
      const msg = getApiErrorMessage(e, "Có lỗi xảy ra");
      toastRef.current?.error?.(
        editing ? `Cập nhật thể loại thất bại: ${msg}` : `Thêm thể loại thất bại: ${msg}`,
      );
      return msg;
    }
  };

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(dialog.genre.id);
      closeDialog();
      toastRef.current?.success?.("Xóa thể loại thành công");
    } catch (e) {
      console.error(e);
      toastRef.current?.error?.(getApiErrorMessage(e, "Xóa thất bại, vui lòng thử lại"));
    }
  };

  return (
    <div style={{ padding: "28px 32px 56px", maxWidth: 1100, fontFamily: FONT }}>
      <style>{ADMIN_GOOGLE_FONTS}</style>
      <style>{CSS}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: T.textMuted,
              margin: "0 0 3px",
            }}
          >
            Quản lý
          </p>
          <h2
            style={{
              fontFamily: FONT_TITLE,
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: T.text,
              margin: 0,
              display: "flex",
              alignItems: "baseline",
              gap: 8,
            }}
          >
            Thể loại
            <span style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 500, color: T.textMuted, letterSpacing: 0 }}>
              · {genres.length}
            </span>
          </h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              color={T.textMuted}
              style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm thể loại"
              aria-label="Tìm thể loại"
              style={{
                width: 220,
                fontFamily: FONT,
                fontSize: 12.5,
                color: T.text,
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: "8px 12px 8px 32px",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => { e.target.style.borderColor = T.borderFocus; }}
              onBlur={(e) => { e.target.style.borderColor = T.border; }}
            />
          </div>
          <Btn variant="primary" onClick={openAdd} icon={<Plus size={15} strokeWidth={2.2} />}>
            Thêm thể loại
          </Btn>
        </div>
      </div>

      {/* Danh sách */}
      {loading ? (
        <Spinner />
      ) : loadError ? (
        <ErrorBox text="Không tải được danh sách thể loại." onRetry={() => genresQ.refetch()} />
      ) : visible.length === 0 ? (
        <Empty text={keyword ? "Không có thể loại nào khớp từ khóa" : "Chưa có thể loại nào"} />
      ) : (
        <div className="gn-grid">
          <AnimatePresence>
            {visible.map((g, i) => (
              <GenreCard
                key={g.id}
                genre={g}
                index={i}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {dialog?.type === "form" && (
          <GenreFormModal
            key={dialog.genre?.id ?? "new"}
            genre={dialog.genre}
            saving={save.isPending}
            onSubmit={handleSave}
            onClose={closeDialog}
          />
        )}
        {dialog?.type === "delete" && (
          <DeleteGenreModal
            key={`del-${dialog.genre.id}`}
            genre={dialog.genre}
            deleting={remove.isPending}
            onConfirm={handleDelete}
            onClose={closeDialog}
          />
        )}
      </AnimatePresence>
    </div>
  );
}