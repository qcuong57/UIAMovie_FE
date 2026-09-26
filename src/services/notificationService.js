// src/services/notificationService.js
import axiosInstance from "../config/axios";

// Hàm chuẩn hóa dữ liệu tránh lỗi lệch chữ hoa/thường giữa .NET và JS
const normalizeItem = (n) => {
  if (!n) return null;
  return {
    id: n.id ?? n.Id,
    title: n.title ?? n.Title ?? "",
    message: n.message ?? n.Message ?? "",
    linkUrl: n.linkUrl ?? n.LinkUrl ?? null,
    thumbnailUrl: n.thumbnailUrl ?? n.ThumbnailUrl ?? null,
    type: (n.type ?? n.Type ?? "general").toLowerCase(),
    isRead: n.isRead ?? n.IsRead ?? false,
    createdAt: n.createdAt ?? n.CreatedAt ?? new Date().toISOString(),
  };
};

const notificationService = {
  /**
   * Lấy thông báo chuông (loại trừ admin_announcement)
   */
  getNotifications: async (
    page = 1,
    pageSize = 20,
    excludeType = "admin_announcement",
  ) => {
    const res = await axiosInstance.get("/notification", {
      params: { page, pageSize, excludeType },
    });
    const rawData = res.data?.data ?? res.data;
    const list =
      rawData?.items ??
      rawData?.Items ??
      (Array.isArray(rawData) ? rawData : []);
    return {
      items: list.map(normalizeItem).filter(Boolean),
      totalCount: rawData?.totalCount ?? rawData?.TotalCount ?? list.length,
      pageNumber: rawData?.pageNumber ?? rawData?.PageNumber ?? page,
      pageSize: rawData?.pageSize ?? rawData?.PageSize ?? pageSize,
    };
  },

  /**
   * Đếm số lượng chuông chưa đọc
   */
  getUnreadCount: async (excludeType = "admin_announcement") => {
    const res = await axiosInstance.get("/notification/unread-count", {
      params: { excludeType },
    });
    return (
      res.data?.data?.unreadCount ??
      res.data?.unreadCount ??
      res.data?.data ??
      (typeof res.data === "number" ? res.data : 0)
    );
  },

  /**
   * Lấy tin tức/thông báo công khai (Dành cho trang Admin & Trang Tin tức)
   */
  getPublicAnnouncements: async (page = 1, pageSize = 50, type = null) => {
    try {
      const params = { page, pageSize };
      if (type) params.type = type;

      const res = await axiosInstance.get(
        "/notification/public-announcements",
        { params },
      );

      // Log kiểm tra trực tiếp trên F12 Console
      console.log("[DEBUG] Dữ liệu gốc từ API thông báo:", res);

      // Bóc tách an toàn: hỗ trợ res.data.data, res.data và cả khi res đã unwrap
      const rawData = res?.data?.data ?? res?.data ?? res;
      const list =
        rawData?.items ??
        rawData?.Items ??
        (Array.isArray(rawData) ? rawData : []);

      return {
        items: list.map(normalizeItem).filter(Boolean),
        totalCount: rawData?.totalCount ?? rawData?.TotalCount ?? list.length,
        pageNumber: rawData?.pageNumber ?? rawData?.PageNumber ?? page,
        pageSize: rawData?.pageSize ?? rawData?.PageSize ?? pageSize,
      };
    } catch (error) {
      console.error(
        "[notificationService] getPublicAnnouncements error:",
        error,
      );
      throw error;
    }
  },

  markAsRead: async (id) => {
    const res = await axiosInstance.put(`/notification/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await axiosInstance.put("/notification/read-all");
    return res.data;
  },

  deleteNotification: async (id) => {
    const res = await axiosInstance.delete(`/notification/${id}`);
    return res.data;
  },

  // ══════════════ [ADMIN ONLY] ══════════════

  broadcastNotification: async ({
    title,
    message,
    linkUrl,
    thumbnailUrl,
    type = "admin_announcement",
  }) => {
    const res = await axiosInstance.post("/notification/broadcast", {
      title,
      message,
      linkUrl,
      thumbnailUrl,
      type,
    });
    return res.data;
  },

  adminUpdateNotification: async (
    id,
    { title, message, linkUrl, thumbnailUrl, type = "admin_announcement" },
  ) => {
    const res = await axiosInstance.put(`/notification/admin/${id}`, {
      title,
      message,
      linkUrl,
      thumbnailUrl,
      type,
    });
    return res.data;
  },

  adminDeleteNotification: async (id) => {
    const res = await axiosInstance.delete(`/notification/admin/${id}`);
    return res.data;
  },
};

export default notificationService;
