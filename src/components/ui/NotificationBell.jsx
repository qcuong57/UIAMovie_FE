// src/components/ui/NotificationBell.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  CheckCheck,
  Film,
  Sparkles,
  Trash2,
  ExternalLink,
} from "lucide-react";
import * as signalR from "@microsoft/signalr";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import notificationService from "../../services/notificationService";
import { C, FONT_DISPLAY, FONT_BODY } from "../../context/homeTokens";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const HUB_URL = `${BASE_URL.replace(/\/+$/, "")}/hubs/notifications`;

function formatVietnameseTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 45) return "Vừa xong";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  if (diffSec < 172800) return "Hôm qua";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export default function NotificationBell({ scrolled }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState("all"); // 'all' | 'unread'
  const [deletingId, setDeletingId] = useState(null);

  const containerRef = useRef(null);
  const hubRef = useRef(null);
  const isMountedRef = useRef(true);
  const navigate = useNavigate();

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const loadData = useCallback(async () => {
    if (!authService.isLoggedIn()) return;
    try {
      const [res, unread] = await Promise.all([
        notificationService.getNotifications(1, 25, "admin_announcement"),
        notificationService.getUnreadCount("admin_announcement"),
      ]);
      if (!isMountedRef.current) return;
      setNotifications(res.items || []);
      setUnreadCount(unread);
    } catch (e) {
      console.error("Không thể tải thông báo chuông:", e);
    }
  }, []);

  // SignalR Hub listener
  useEffect(() => {
    if (!authService.isLoggedIn()) return;
    loadData();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem("accessToken") || "",
      })
      .withAutomaticReconnect([0, 2000, 5000, 15000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    hubRef.current = connection;
    connection.start().catch(() => {});

    connection.on("ReceiveNotification", (item) => {
      if (!item || !isMountedRef.current) return;
      const type = (item.type || item.Type || "general").toLowerCase();

      // Chỉ hiển thị phim mới hoặc thông báo cá nhân ở chuông
      if (type === "admin_announcement") return;

      const newObj = {
        id: item.id || item.Id,
        title: item.title || item.Title || "Phim mới phát hành",
        message: item.message || item.Message || "",
        linkUrl: item.linkUrl || item.LinkUrl || null,
        thumbnailUrl: item.thumbnailUrl || item.ThumbnailUrl || null,
        type: type,
        isRead: false,
        createdAt: item.createdAt || item.CreatedAt || new Date().toISOString(),
      };

      setNotifications((prev) => [newObj, ...prev.filter((x) => x.id !== newObj.id)]);
      setUnreadCount((c) => c + 1);
    });

    return () => {
      connection.stop();
    };
  }, [loadData]);

  // Click outside to close
  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      notificationService.markAsRead(notif.id).catch(() => {});
    }
    setIsOpen(false);
    if (notif.linkUrl) {
      navigate(notif.linkUrl);
    }
  };

  const handleMarkAll = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllAsRead();
    } catch (e) {
      loadData();
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.isRead) setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await notificationService.deleteNotification(id);
    } catch {
      loadData();
    } finally {
      if (isMountedRef.current) setDeletingId(null);
    }
  };

  const displayedList = tab === "unread"
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return (
    <div className="relative" ref={containerRef}>
      {/* Nút Chuông */}
      <motion.button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="relative flex items-center justify-center rounded-xl transition-all"
        style={{
          width: 40,
          height: 40,
          background: isOpen ? "rgba(229,24,30,0.14)" : "transparent",
          border: isOpen ? `1px solid ${C.accent}` : "1px solid transparent",
          color: isOpen ? C.accent : scrolled ? "#ffffff" : "rgba(255,255,255,0.75)",
          cursor: "pointer",
        }}
        title="Thông báo phim mới"
      >
        <Bell size={19} strokeWidth={1.9} />

        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center font-black text-white rounded-full"
            style={{
              minWidth: 17,
              height: 17,
              padding: "0 4px",
              background: C.accent,
              fontSize: 10,
              boxShadow: `0 0 10px ${C.accentGlow}`,
              fontFamily: FONT_DISPLAY,
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 mt-3 rounded-2xl overflow-hidden"
            style={{
              width: 390,
              background: "#0e0e11",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 24px 70px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.03)",
              zIndex: 9999,
              fontFamily: FONT_BODY,
            }}
          >
            {/* Header Dropdown */}
            <div
              className="p-3.5 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}
            >
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 15, color: "#fff" }}>
                  Thông báo
                </span>
                {unreadCount > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: "rgba(229,24,30,0.2)", color: C.accent }}
                  >
                    {unreadCount} mới
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                  style={{
                    background: "transparent",
                    color: "rgba(255,255,255,0.6)",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
                >
                  <CheckCheck size={14} />
                  <span>Đọc tất cả</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div
              className="flex px-3 pt-2 gap-2"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <button
                type="button"
                onClick={() => setTab("all")}
                className="pb-2 text-xs font-bold transition-all relative"
                style={{
                  color: tab === "all" ? "#fff" : "rgba(255,255,255,0.45)",
                  fontFamily: FONT_DISPLAY,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Tất cả ({notifications.length})
                {tab === "all" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: C.accent }}
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => setTab("unread")}
                className="pb-2 text-xs font-bold transition-all relative"
                style={{
                  color: tab === "unread" ? "#fff" : "rgba(255,255,255,0.45)",
                  fontFamily: FONT_DISPLAY,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Chưa đọc ({unreadCount})
                {tab === "unread" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: C.accent }}
                  />
                )}
              </button>
            </div>

            {/* Body List */}
            <div className="overflow-y-auto divide-y divide-white/[0.04]" style={{ maxHeight: 380 }}>
              {displayedList.length === 0 ? (
                <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <Sparkles size={20} style={{ color: "rgba(255,255,255,0.25)" }} />
                  </div>
                  <p className="text-sm font-bold text-white mb-1" style={{ fontFamily: FONT_DISPLAY }}>
                    Hộp thư rảnh rỗi
                  </p>
                  <p className="text-xs text-white/40 max-w-[240px] leading-relaxed">
                    Khi có phim mới, tập phim cập nhật hoặc gợi ý dành riêng cho bạn, thông báo sẽ xuất hiện ở đây.
                  </p>
                </div>
              ) : (
                displayedList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="group relative flex items-start gap-3 p-3.5 transition-all cursor-pointer"
                    style={{
                      background: item.isRead ? "transparent" : "rgba(229, 24, 30, 0.04)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = item.isRead ? "transparent" : "rgba(229, 24, 30, 0.04)";
                    }}
                  >
                    {/* Chấm tròn chưa đọc */}
                    {!item.isRead && (
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                        style={{ background: C.accent, boxShadow: `0 0 6px ${C.accent}` }}
                      />
                    )}

                    {/* Poster thumbnail */}
                    <div
                      className="w-12 h-16 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                      style={{ background: "#1c1c24", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <Film size={20} className="text-white/30" />
                      )}
                    </div>

                    {/* Nội dung text */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            background: "rgba(70, 211, 105, 0.15)",
                            color: "#46d369",
                            fontFamily: FONT_DISPLAY,
                          }}
                        >
                          PHIM MỚI
                        </span>
                        <span className="text-[11px] text-white/35">
                          {formatVietnameseTime(item.createdAt)}
                        </span>
                      </div>

                      <h4
                        className="text-xs font-bold truncate text-white leading-snug mb-1"
                        style={{ fontFamily: FONT_DISPLAY }}
                      >
                        {item.title}
                      </h4>

                      <p className="text-[12px] text-white/55 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                    </div>

                    {/* Nút xóa nhanh khi hover */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, item.id)}
                      disabled={deletingId === item.id}
                      className="absolute right-3 top-3.5 opacity-0 group-hover:opacity-100 p-1.5 rounded-md transition-all"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.5)",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = C.accent; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
                      title="Xóa thông báo này"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer Dropdown */}
            <div
              className="p-2.5 text-center"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(255,255,255,0.01)",
              }}
            >
              <button
                type="button"
                onClick={() => { setIsOpen(false); navigate("/announcements"); }}
                className="text-xs font-semibold text-white/60 hover:text-white inline-flex items-center gap-1 transition-colors"
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
              >
                <span>Xem bản tin bảo trì & sự kiện hệ thống</span>
                <ExternalLink size={11} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}