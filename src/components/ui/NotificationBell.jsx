// src/components/ui/NotificationBell.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import * as signalR from "@microsoft/signalr";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import notificationService from "../../services/notificationService";
import { C, FONT_DISPLAY, FONT_BODY } from "../../context/homeTokens";
import { fmtDateTime } from "../../helper/format";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const HUB_URL = `${BASE_URL.replace(/\/+$/, "")}/hubs/notifications`;

function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Vừa xong";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  if (diffSec < 172800) return "Hôm qua";
  return fmtDateTime ? fmtDateTime(dateStr) : date.toLocaleDateString("vi-VN");
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
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!authService.isLoggedIn()) return;
    try {
      const [res, unread] = await Promise.all([
        notificationService.getNotifications(1, 25),
        notificationService.getUnreadCount(),
      ]);
      if (!isMountedRef.current) return;
      setNotifications(res?.items || []);
      setUnreadCount(unread || 0);
    } catch (e) {
      console.error("Không thể tải thông báo chuông:", e);
    }
  }, []);

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

  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Xử lý khi rê chuột vào để tự động đánh dấu đã đọc
  const handleItemHover = (notif) => {
    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      notificationService.markAsRead(notif.id).catch(() => {});
    }
  };

  const handleItemClick = (notif) => {
    handleItemHover(notif);
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

  const displayedList =
    tab === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Nút Chuông */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center justify-center rounded-full transition-colors"
        style={{
          width: 38,
          height: 38,
          background: isOpen ? "rgba(255,255,255,0.08)" : "transparent",
          color: isOpen ? "#ffffff" : scrolled ? C.text : "rgba(255,255,255,0.8)",
          border: "none",
          cursor: "pointer",
        }}
        title="Thông báo"
        aria-label="Thông báo"
      >
        <Bell size={18} strokeWidth={1.5} />

        {unreadCount > 0 && (
          <span
            className="absolute top-2 right-2 rounded-full"
            style={{
              width: 6,
              height: 6,
              background: C.accent,
              boxShadow: `0 0 8px ${C.accentGlow}`,
            }}
          />
        )}
      </button>

      {/* Dropdown Modal Không Viền Trắng */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 rounded-2xl overflow-hidden"
            style={{
              width: 360,
              maxWidth: "calc(100vw - 28px)",
              background: "#121214",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.95)",
              zIndex: 9999,
              fontFamily: FONT_BODY,
            }}
          >
            {/* Header */}
            <div
              className="px-4 py-3.5 flex items-center justify-between"
              style={{
                borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: "0.02em",
                    color: "#f0f0f0",
                    textTransform: "uppercase",
                  }}
                >
                  Thông báo
                </span>
                {unreadCount > 0 && (
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      fontFamily: FONT_DISPLAY,
                      background: "rgba(229, 24, 30, 0.15)",
                      color: C.accent,
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="text-xs transition-opacity hover:opacity-100"
                  style={{
                    fontFamily: FONT_DISPLAY,
                    background: "transparent",
                    color: "rgba(255, 255, 255, 0.5)",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontWeight: 500,
                  }}
                >
                  Đọc tất cả
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div
              className="flex px-4 pt-2.5 gap-6"
              style={{
                borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
              }}
            >
              <button
                type="button"
                onClick={() => setTab("all")}
                className="pb-2 text-xs transition-colors relative"
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontWeight: tab === "all" ? 600 : 400,
                  color: tab === "all" ? "#fff" : "rgba(255, 255, 255, 0.45)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Tất cả
                {tab === "all" && (
                  <motion.div
                    layoutId="activeTabNotif"
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                    style={{ background: C.accent }}
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => setTab("unread")}
                className="pb-2 text-xs transition-colors relative"
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontWeight: tab === "unread" ? 600 : 400,
                  color: tab === "unread" ? "#fff" : "rgba(255, 255, 255, 0.45)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Chưa xem
                {tab === "unread" && (
                  <motion.div
                    layoutId="activeTabNotif"
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                    style={{ background: C.accent }}
                  />
                )}
              </button>
            </div>

            {/* Danh sách thông báo: Loại bỏ divide-y và viền trắng, cuộn mượt mà */}
            <div
              className="p-1.5 overflow-y-auto"
              style={{
                maxHeight: 380,
                scrollbarWidth: "none", // Ẩn thanh cuộn thô trên Firefox
                msOverflowStyle: "none", // IE / Edge
              }}
            >
              <style>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>

              {displayedList.length === 0 ? (
                <div className="py-12 px-6 text-center">
                  <p
                    className="text-xs font-medium"
                    style={{ color: "rgba(255,255,255,0.4)", fontFamily: FONT_DISPLAY }}
                  >
                    Không có thông báo mới
                  </p>
                </div>
              ) : (
                displayedList.map((item) => (
                  <div
                    key={item.id}
                    onMouseEnter={() => handleItemHover(item)} // Rê chuột vào lập tức chuyển thành đã đọc
                    onClick={() => handleItemClick(item)}
                    className="group relative flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer"
                    style={{
                      background: item.isRead
                        ? "transparent"
                        : "rgba(255, 255, 255, 0.025)",
                      marginBottom: 2,
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = item.isRead
                        ? "transparent"
                        : "rgba(255, 255, 255, 0.025)";
                    }}
                  >
                    {/* Poster phim */}
                    <div
                      className="w-10 h-14 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                      style={{
                        background: "#1c1c20",
                      }}
                    >
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span
                          className="text-[9px] font-bold tracking-wider"
                          style={{ color: "rgba(255, 255, 255, 0.25)", fontFamily: FONT_DISPLAY }}
                        >
                          FILM
                        </span>
                      )}
                    </div>

                    {/* Nội dung tin */}
                    <div className="flex-1 min-w-0 pr-5">
                      <div className="flex items-center gap-1.5 mb-1">
                        {!item.isRead && (
                          <span
                            className="inline-block rounded-full"
                            style={{
                              width: 5,
                              height: 5,
                              background: C.accent,
                              boxShadow: `0 0 5px ${C.accentGlow}`,
                            }}
                          />
                        )}
                        <span
                          className="text-[11px]"
                          style={{
                            color: "rgba(255, 255, 255, 0.4)",
                            fontFamily: FONT_BODY,
                          }}
                        >
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>

                      <h4
                        className="text-xs font-semibold truncate mb-0.5 leading-snug"
                        style={{
                          fontFamily: FONT_DISPLAY,
                          color: item.isRead ? "rgba(255, 255, 255, 0.75)" : "#ffffff",
                        }}
                      >
                        {item.title}
                      </h4>

                      <p
                        className="text-[12px] line-clamp-2 leading-relaxed"
                        style={{
                          color: item.isRead ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.65)",
                        }}
                      >
                        {item.message}
                      </p>
                    </div>

                    {/* Nút xoá tinh tế dạng text '×' xuất hiện khi hover */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, item.id)}
                      disabled={deletingId === item.id}
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: "transparent",
                        color: "rgba(255, 255, 255, 0.4)",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 16,
                        lineHeight: 1,
                        padding: "2px 4px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = C.accent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "rgba(255, 255, 255, 0.4)";
                      }}
                      title="Xóa"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              className="p-3 text-center"
              style={{
                borderTop: "1px solid rgba(255, 255, 255, 0.04)",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/announcements");
                }}
                className="text-[11px] font-medium transition-colors hover:text-white"
                style={{
                  fontFamily: FONT_DISPLAY,
                  color: "rgba(255, 255, 255, 0.45)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Bản tin hệ thống &rarr;
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}