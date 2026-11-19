// src/services/homeSectionService.js
// Maps 1-to-1 với HomeSectionsController.cs
//   Public: GET /api/home-sections
//   Admin : /api/admin/home-sections/...

import axiosInstance from '../config/axios';

const PUBLIC = '/home-sections';
const ADMIN = '/admin/home-sections';

const homeSectionService = {
  /** Các khối đang hiển thị, đã sắp theo SortOrder, kèm items[].content đã resolve. */
  getPublic: async () => axiosInstance.get(PUBLIC),

  // ── Admin ──────────────────────────────────────────────────────────────────
  /** Tất cả khối (kể cả tắt / hết hạn). */
  adminGetAll: async () => axiosInstance.get(ADMIN),

  /** { layouts, autoRules, contentTypes, autoContentTypes, maxManualItems } */
  adminGetMeta: async () => axiosInstance.get(`${ADMIN}/meta`),

  adminGetById: async (id) => axiosInstance.get(`${ADMIN}/${id}`),

  /** Body: UpsertHomeSectionDTO → 201 { id } */
  adminCreate: async (dto) => axiosInstance.post(ADMIN, dto),

  /** Body: UpsertHomeSectionDTO → 204 */
  adminUpdate: async (id, dto) => axiosInstance.put(`${ADMIN}/${id}`, dto),

  adminDelete: async (id) => axiosInstance.delete(`${ADMIN}/${id}`),

  /** Body: { sectionIds: Guid[] } theo thứ tự mới. */
  adminReorder: async (sectionIds) => axiosInstance.put(`${ADMIN}/reorder`, { sectionIds }),

  /** Body: { isActive } */
  adminSetActive: async (id, isActive) => axiosInstance.patch(`${ADMIN}/${id}/active`, { isActive }),
};

export default homeSectionService;