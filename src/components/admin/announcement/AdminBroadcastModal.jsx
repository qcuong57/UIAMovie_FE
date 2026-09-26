// src/components/admin/AdminBroadcastModal.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  X,
  Megaphone,
  Image as ImageIcon,
  Link2,
  AlertCircle,
  CheckCircle2,
  Edit3,
} from "lucide-react";
import notificationService from "../../../services/notificationService";
import { T, FONT_BODY as FONT, FONT_TITLE } from "../../../context/adminTokens";

export default function AdminBroadcastModal({ isOpen, onClose, onSuccess, editItem = null }) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    thumbnailUrl: "",
    linkUrl: "",
    type: "admin_announcement",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (editItem) {
      setFormData({
        title: editItem.title || "",
        message: editItem.message || "",
        thumbnailUrl: editItem.thumbnailUrl || "",
        linkUrl: editItem.linkUrl || "",
        type: editItem.type || "admin_announcement",
      });
    } else {
      setFormData({
        title: "",
        message: "",
        thumbnailUrl: "",
        linkUrl: "",
        type: "admin_announcement",
      });
    }
    setError("");
    setSuccess(false);
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      setError("Vui lòng điền đầy đủ tiêu đề và nội dung thông báo.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        thumbnailUrl: formData.thumbnailUrl.trim() || null,
        linkUrl: formData.linkUrl.trim() || null,
        type: formData.type,
      };

      if (editItem?.id) {
        // Cập nhật thông báo đã có
        await notificationService.adminUpdateNotification(editItem.id, payload);
      } else {
        // Tạo và phát thông báo mới
        await notificationService.broadcastNotification(payload);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err) {
      setError(err?.response?.data?.message || "Có lỗi xảy ra trong quá trình lưu thông báo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!loading ? onClose : undefined}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
          }}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 540,
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
            overflow: "hidden",
            fontFamily: FONT,
            zIndex: 1,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: `1px solid ${T.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: T.surfaceAlt,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: T.accentLight,
                  color: T.accentText,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {editItem ? <Edit3 size={17} /> : <Megaphone size={17} />}
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: FONT_TITLE,
                    fontSize: 16,
                    fontWeight: 700,
                    color: T.text,
                    margin: 0,
                  }}
                >
                  {editItem ? "Chỉnh sửa thông báo" : "Phát thông báo hệ thống"}
                </h3>
                <p style={{ fontSize: 12, color: T.textMuted, margin: "2px 0 0" }}>
                  {editItem ? "Cập nhật lại bài viết trên trang tin tức" : "Đăng thông báo hiển thị tới người dùng"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                border: "none",
                background: "transparent",
                color: T.textMuted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  borderRadius: 8,
                  marginBottom: 14,
                  background: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  color: T.red,
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  borderRadius: 8,
                  marginBottom: 14,
                  background: T.accentLight,
                  border: `1px solid ${T.accentText}40`,
                  color: T.accentText,
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span>{editItem ? "Đã cập nhật thông báo thành công!" : "Đã phát thông báo thành công!"}</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              
              {/* Phân loại thông báo */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 5 }}>
                  Phân loại bài đăng
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 10px",
                    borderRadius: 8,
                    border: `1px solid ${T.borderMed}`,
                    background: T.surface,
                    color: T.text,
                    fontSize: 13,
                    outline: "none",
                  }}
                >
                  <option value="admin_announcement">Thông báo bảo trì / Tin tức (Trang Tin tức)</option>
                  <option value="movie_release">Phim mới cập nhật (Chuông thông báo)</option>
                </select>
              </div>

              {/* Tiêu đề */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 5 }}>
                  Tiêu đề <span style={{ color: T.red }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Bảo trì nâng cấp cụm máy chủ khu vực..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: `1px solid ${T.borderMed}`,
                    background: T.surface,
                    color: T.text,
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>

              {/* Nội dung */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 5 }}>
                  Nội dung chi tiết <span style={{ color: T.red }}>*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Nhập nội dung rõ ràng tới người dùng..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid ${T.borderMed}`,
                    background: T.surface,
                    color: T.text,
                    fontSize: 13,
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* Ảnh Thumbnail & Preview */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 5 }}>
                  <ImageIcon size={13} color={T.textMuted} />
                  <span>Ảnh Banner / Poster (URL tuỳ chọn)</span>
                </label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    style={{
                      flex: 1,
                      height: 38,
                      padding: "0 12px",
                      borderRadius: 8,
                      border: `1px solid ${T.borderMed}`,
                      background: T.surface,
                      color: T.text,
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                  {formData.thumbnailUrl && (
                    <div style={{ width: 38, height: 38, borderRadius: 6, overflow: "hidden", border: `1px solid ${T.border}`, flexShrink: 0 }}>
                      <img src={formData.thumbnailUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Link điều hướng */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 5 }}>
                  <Link2 size={13} color={T.textMuted} />
                  <span>Đường dẫn liên kết khi nhấn (Tuỳ chọn)</span>
                </label>
                <input
                  type="text"
                  placeholder="/movie/123 hoặc /announcements"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: `1px solid ${T.borderMed}`,
                    background: T.surface,
                    color: T.text,
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>

            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid ${T.borderMed}`,
                  background: T.surface,
                  color: T.textSub,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                disabled={loading || success}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: T.accent,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: loading ? "wait" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {loading ? "Đang lưu..." : editItem ? "Lưu thay đổi" : "Phát thông báo"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}