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

// axiosInstance có interceptor unwrap response.data, nên `res` có thể đã là payload.
// Hàm này xử lý được cả 2 trường hợp: res.data.data | res.data | res
const unwrap = (res) => {
  const d = res?.data ?? res;
  return d?.data ?? d;
};

const notificationService = {
  /**
   * Lấy thông báo chuông (gồm cả phim mới và thông báo chung; truyền excludeType nếu muốn loại trừ)
   */
  getNotifications: async (
    page = 1,
    pageSize = 20,
    excludeType = null,
  ) => {
    const res = await axiosInstance.get("/notification", {
      params: { page, pageSize, excludeType },
    });
    const rawData = unwrap(res);
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
  getUnreadCount: async (excludeType = null) => {
    const res = await axiosInstance.get("/notification/unread-count", {
      params: { excludeType },
    });
    const raw = unwrap(res);
    if (typeof raw === "number") return raw;
    return raw?.unreadCount ?? raw?.UnreadCount ?? 0;
  },

  /**
   * Lấy tin tức/thông báo công khai — không yêu cầu đăng nhập.
   * (Dành cho trang Bản tin & trang Admin)
   *
   * axiosInstance an toàn với khách vãng lai: interceptor 401 chỉ redirect
   * về /welcome khi có refreshToken hết hạn, không ảnh hưởng public endpoint.
   *
   * @param {number} page
   * @param {number} pageSize
   * @param {string|null} type - lọc theo loại thông báo, null = lấy tất cả
   */
  getPublicAnnouncements: async (page = 1, pageSize = 50, type = null) => {
    try {
      const params = { page, pageSize };
      if (type) params.type = type;

      const res = await axiosInstance.get("/notification/public-announcements", { params });

      const rawData = unwrap(res);
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
      console.error("[notificationService] getPublicAnnouncements error:", error);
      throw error;
    }
  },

  markAsRead: async (id) => {
    const res = await axiosInstance.put(`/notification/${id}/read`);
    return unwrap(res);
  },

  markAllAsRead: async () => {
    const res = await axiosInstance.put("/notification/read-all");
    return unwrap(res);
  },

  deleteNotification: async (id) => {
    const res = await axiosInstance.delete(`/notification/${id}`);
    return unwrap(res);
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
    return unwrap(res);
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
    return unwrap(res);
  },

  adminDeleteNotification: async (id) => {
    const res = await axiosInstance.delete(`/notification/admin/${id}`);
    return unwrap(res);
  },
};

export default notificationService;