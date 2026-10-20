// src/services/userService.js
// User API Service — khớp với UserController.cs
//
// Tất cả endpoint đều yêu cầu đăng nhập ([Authorize]).
// Access token được axiosInstance tự đính kèm qua interceptor request.
//
// Interceptor response của axiosInstance trả về body JSON { data, message }, nên:
//   - Endpoint có dữ liệu (getUsers, getUserById, getMe): trả res.data.
//   - Endpoint chỉ trả { message } (update, role, delete, ban, unban, change-password): trả res
//     để caller đọc được res.message.

import axiosInstance from '../config/axios';

const userService = {

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN ONLY
  // ═══════════════════════════════════════════════════════════════════

  /**
   * [Admin] Lấy danh sách user — tìm kiếm, lọc, phân trang
   * GET /api/user
   * Params: UserQueryDTO (search, role, page, pageSize, ...)
   *
   * Alias: getAllUsers() — để tương thích với các component cũ gọi tên này.
   * Cả hai đều trỏ về cùng một endpoint.
   */
  getUsers: async (query = {}) => {
    const res = await axiosInstance.get('/user', { params: query });
    return res.data;
  },

  /** @alias getUsers — giữ tương thích ngược với AdminDashboard và các component cũ */
  getAllUsers: async (query = {}) => {
    const res = await axiosInstance.get('/user', { params: query });
    return res.data;
  },

  /**
   * [Admin] Lấy thông tin user theo ID
   * GET /api/user/:id
   */
  getUserById: async (id) => {
    const res = await axiosInstance.get(`/user/${id}`);
    return res.data;
  },

  /**
   * [Admin] Cập nhật thông tin user bất kỳ
   * PUT /api/user/:id
   * Body: UpdateUserDTO { username?, avatarUrl?, ... }
   */
  updateUser: async (id, dto) => {
    const res = await axiosInstance.put(`/user/${id}`, dto);
    return res;
  },

  /**
   * [Admin] Thay đổi role của user (User ↔ Admin)
   * PATCH /api/user/:id/role
   * Body: { role }
   */
  updateRole: async (id, role) => {
    const res = await axiosInstance.patch(`/user/${id}/role`, { role });
    return res;
  },

  /**
   * [Admin] Xóa user
   * DELETE /api/user/:id
   * Lưu ý: BE chặn admin tự xóa chính mình (400)
   */
  deleteUser: async (id) => {
    const res = await axiosInstance.delete(`/user/${id}`);
    return res;
  },

  /**
   * [Admin] Khóa tài khoản user
   * POST /api/user/:id/ban
   * Body: BanUserDTO { reason? }
   * Lưu ý: BE chặn admin tự khóa chính mình (400)
   */
  banUser: async (id, dto) => {
    const res = await axiosInstance.post(`/user/${id}/ban`, dto);
    return res;
  },

  /**
   * [Admin] Mở khóa tài khoản user
   * POST /api/user/:id/unban
   */
  unbanUser: async (id) => {
    const res = await axiosInstance.post(`/user/${id}/unban`);
    return res;
  },

  // ═══════════════════════════════════════════════════════════════════
  // USER (chính mình)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Lấy thông tin user đang đăng nhập
   * GET /api/user/me
   */
  getMe: async () => {
    const res = await axiosInstance.get('/user/me');
    return res.data;
  },

  /**
   * Cập nhật thông tin bản thân
   * PUT /api/user/me
   * Body: UpdateUserDTO { username?, avatarUrl?, ... }
   */
  updateMe: async (dto) => {
    const res = await axiosInstance.put('/user/me', dto);
    return res;
  },

  /**
   * Đổi mật khẩu
   * POST /api/user/me/change-password
   * Body: ChangePasswordDTO { oldPassword, newPassword, confirmPassword }
   * Lưu ý: thành công thì BE thu hồi MỌI phiên (kể cả thiết bị này) → caller phải
   * gọi authService.logout() rồi chuyển về trang đăng nhập.
   */
  changePassword: async (dto) => {
    const res = await axiosInstance.post('/user/me/change-password', dto);
    return res;
  },
};

export default userService;