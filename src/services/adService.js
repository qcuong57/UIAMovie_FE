// src/services/adService.js
// Advertisement API Service

import axiosInstance from '../config/axios';

// Header dùng chung cho các request gửi JSON body.
// Khai báo explicit để tránh bị override bởi interceptor multipart/form-data.
const JSON_HEADERS = { 'Content-Type': 'application/json' };

const adService = {

  // ── Advertisement CRUD (Admin) ──────────────────────────────────────────────

  /**
   * [Admin] Lấy danh sách ads có phân trang + filter.
   * @param {Object}  filter
   * @param {number}  [filter.page=1]
   * @param {number}  [filter.pageSize=20]
   * @param {string}  [filter.search]     - Tìm theo tên ad
   * @param {boolean} [filter.isActive]   - true | false | undefined (all)
   */
  getAds: async ({
    page     = 1,
    pageSize = 20,
    search   = '',
    isActive,
  } = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('pageSize', pageSize);
      if (search)           params.append('search', search);
      if (isActive != null) params.append('isActive', String(isActive));

      const response = await axiosInstance.get(`/ads?${params}`);
      return response; // { items, total }
    } catch (error) {
      console.error('[adService] Error fetching ads:', error);
      console.error('[adService] Response data:', error?.response?.data);
      throw error;
    }
  },

  /**
   * [Admin] Lấy chi tiết 1 ad kèm danh sách global slots.
   * @param {string} adId - Advertisement ID (UUID)
   *
   * @returns {Promise<AdDTO>}
   *   {
   *     id, title, videoUrl, durationSeconds, skipAfterSeconds,
   *     clickThroughUrl, isActive, createdAt, updatedAt,
   *     globalSlots: GlobalSlotDTO[]
   *   }
   *
   * GlobalSlotDTO: { slotId, appliesTo, position, midRollOffsetSeconds, displayOrder, isActive }
   */
  getAdById: async (adId) => {
    try {
      const response = await axiosInstance.get(`/ads/${adId}`);
      return response;
    } catch (error) {
      console.error('[adService] Error fetching ad:', error);
      throw error;
    }
  },

  /**
   * [Admin] Tạo ad mới.
   * Hỗ trợ upload video file hoặc nhập URL ngoài (chọn 1 trong 2).
   *
   * @param {Object}   dto
   * @param {string}   dto.title
   * @param {number}   dto.durationSeconds
   * @param {number}   [dto.skipAfterSeconds]  - null = không được skip
   * @param {string}   [dto.clickThroughUrl]
   * @param {File}     [dto.videoFile]         - Upload lên Cloudinary
   * @param {string}   [dto.videoUrl]          - URL ngoài (nếu không upload)
   * @param {File}     [dto.brandImageFile]    - Ảnh nhãn hiệu, upload lên Cloudinary (ưu tiên hơn brandImageUrl)
   * @param {string}   [dto.brandImageUrl]     - URL ảnh nhãn hiệu ngoài (nếu không upload)
   * @param {Function} [onProgress]            - callback(percent: number)
   */
  createAd: async (dto, onProgress) => {
    try {
      const formData = new FormData();
      formData.append('Title', dto.title);
      formData.append('DurationSeconds', dto.durationSeconds);
      if (dto.skipAfterSeconds != null) formData.append('SkipAfterSeconds', dto.skipAfterSeconds);
      if (dto.clickThroughUrl)          formData.append('ClickThroughUrl', dto.clickThroughUrl);
      if (dto.videoFile)                formData.append('VideoFile', dto.videoFile);
      if (dto.videoUrl)                 formData.append('VideoUrl', dto.videoUrl);
      if (dto.brandImageFile)           formData.append('BrandImageFile', dto.brandImageFile);
      if (dto.brandImageUrl)            formData.append('BrandImageUrl', dto.brandImageUrl);

      const response = await axiosInstance.post('/ads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
        timeout: 10 * 60 * 1000, // 10 phút cho file lớn
      });
      return response; // { id }
    } catch (error) {
      console.error('[adService] Error creating ad:', error);
      throw error;
    }
  },

  /**
   * [Admin] Cập nhật thông tin ad / thay video.
   * Chỉ gửi các field cần thay đổi (partial update).
   *
   * @param {string}   adId
   * @param {Object}   dto
   * @param {string}   [dto.title]
   * @param {boolean}  [dto.isActive]
   * @param {number}   [dto.durationSeconds]
   * @param {number}   [dto.skipAfterSeconds]
   * @param {string}   [dto.clickThroughUrl]
   * @param {File}     [dto.videoFile]   - Upload video mới lên Cloudinary
   * @param {string}   [dto.videoUrl]   - Thay bằng external URL
   * @param {File}     [dto.brandImageFile] - Upload ảnh nhãn hiệu mới lên Cloudinary
   * @param {string}   [dto.brandImageUrl]  - Thay ảnh nhãn hiệu bằng external URL
   * @param {Function} [onProgress]     - callback(percent: number)
   */
  updateAd: async (adId, dto, onProgress) => {
    try {
      const formData = new FormData();
      if (dto.title            != null) formData.append('Title', dto.title);
      if (dto.isActive         != null) formData.append('IsActive', dto.isActive);
      if (dto.durationSeconds  != null) formData.append('DurationSeconds', dto.durationSeconds);
      if (dto.skipAfterSeconds != null) formData.append('SkipAfterSeconds', dto.skipAfterSeconds);
      if (dto.clickThroughUrl  != null) formData.append('ClickThroughUrl', dto.clickThroughUrl);
      if (dto.videoFile)                formData.append('VideoFile', dto.videoFile);
      if (dto.videoUrl)                 formData.append('VideoUrl', dto.videoUrl);
      if (dto.brandImageFile)           formData.append('BrandImageFile', dto.brandImageFile);
      if (dto.brandImageUrl)            formData.append('BrandImageUrl', dto.brandImageUrl);

      const response = await axiosInstance.put(`/ads/${adId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
        timeout: 10 * 60 * 1000,
      });
      return response;
    } catch (error) {
      console.error('[adService] Error updating ad:', error);
      throw error;
    }
  },

  /**
   * [Admin] Xóa ad và file Cloudinary liên quan.
   * @param {string} adId
   */
  deleteAd: async (adId) => {
    try {
      const response = await axiosInstance.delete(`/ads/${adId}`);
      return response;
    } catch (error) {
      console.error('[adService] Error deleting ad:', error);
      throw error;
    }
  },

  // ── Global Slots (Admin) ────────────────────────────────────────────────────

  /**
   * [Admin] Tạo global slot — gắn ad vào tất cả content hoặc theo loại content.
   *
   * @param {string} adId
   * @param {Object} dto
   * @param {string|null} [dto.appliesTo]            - "Movie" | "TvShow" | "Episode" | null (tất cả)
   * @param {string}      dto.position               - "PreRoll" | "MidRoll" | "PostRoll"
   * @param {number}      [dto.midRollOffsetSeconds] - Bắt buộc nếu position = "MidRoll"
   * @param {number}      [dto.displayOrder=0]       - Thứ tự nếu nhiều ad cùng vị trí
   *
   * @returns {Promise<{ slotId: string }>}
   */
  createGlobalSlot: async (adId, dto) => {
    try {
      const response = await axiosInstance.post(
        `/ads/${adId}/global-slots`,
        {
          appliesTo:            dto.appliesTo ?? null,
          position:             dto.position,
          midRollOffsetSeconds: dto.midRollOffsetSeconds ?? null,
          displayOrder:         dto.displayOrder ?? 0,
        },
        { headers: JSON_HEADERS },
      );
      return response; // { slotId }
    } catch (error) {
      console.error('[adService] Error creating global slot:', error);
      throw error;
    }
  },

  /**
   * [Admin] Cập nhật position / scope / thứ tự / trạng thái của 1 global slot.
   *
   * @param {string}      slotId
   * @param {Object}      dto
   * @param {string|null} [dto.appliesTo]            - "Movie" | "TvShow" | "Episode" | null
   * @param {string}      [dto.position]             - "PreRoll" | "MidRoll" | "PostRoll"
   * @param {number}      [dto.midRollOffsetSeconds]
   * @param {number}      [dto.displayOrder]
   * @param {boolean}     [dto.isActive]
   */
  updateGlobalSlot: async (slotId, dto) => {
    try {
      const response = await axiosInstance.patch(
        `/ads/global-slots/${slotId}`,
        {
          ...(dto.appliesTo            !== undefined && { appliesTo: dto.appliesTo }),
          ...(dto.position             != null       && { position: dto.position }),
          ...(dto.midRollOffsetSeconds != null       && { midRollOffsetSeconds: dto.midRollOffsetSeconds }),
          ...(dto.displayOrder         != null       && { displayOrder: dto.displayOrder }),
          ...(dto.isActive             != null       && { isActive: dto.isActive }),
        },
        { headers: JSON_HEADERS },
      );
      return response;
    } catch (error) {
      console.error('[adService] Error updating global slot:', error);
      throw error;
    }
  },

  /**
   * [Admin] Xóa global slot.
   * @param {string} slotId
   */
  deleteGlobalSlot: async (slotId) => {
    try {
      const response = await axiosInstance.delete(`/ads/global-slots/${slotId}`);
      return response;
    } catch (error) {
      console.error('[adService] Error deleting global slot:', error);
      throw error;
    }
  },

  // ── Content-specific Overrides (Admin) ─────────────────────────────────────

  /**
   * [Admin] Tạo override cho 1 content cụ thể.
   * Khi content có override ở position X, global slots ở position X bị bỏ qua.
   *
   * @param {string} adId
   * @param {Object} dto
   * @param {string} dto.contentType           - "Movie" | "TvShow" | "Episode"
   * @param {string} dto.contentId             - UUID của content
   * @param {string} dto.position              - "PreRoll" | "MidRoll" | "PostRoll"
   * @param {number} [dto.midRollOffsetSeconds]
   * @param {number} [dto.displayOrder=0]
   *
   * @returns {Promise<{ overrideId: string }>}
   */
  createOverride: async (adId, dto) => {
    try {
      const response = await axiosInstance.post(
        `/ads/${adId}/overrides`,
        {
          contentType:          dto.contentType,
          contentId:            dto.contentId,
          position:             dto.position,
          midRollOffsetSeconds: dto.midRollOffsetSeconds ?? null,
          displayOrder:         dto.displayOrder ?? 0,
        },
        { headers: JSON_HEADERS },
      );
      return response; // { overrideId }
    } catch (error) {
      console.error('[adService] Error creating override:', error);
      throw error;
    }
  },

  /**
   * [Admin] Xóa content-specific override.
   * @param {string} overrideId
   */
  deleteOverride: async (overrideId) => {
    try {
      const response = await axiosInstance.delete(`/ads/overrides/${overrideId}`);
      return response;
    } catch (error) {
      console.error('[adService] Error deleting override:', error);
      throw error;
    }
  },

  // ── Player API ──────────────────────────────────────────────────────────────

  /**
   * Lấy tất cả ads cần phát cho 1 content, grouped by position.
   * Gọi trước khi bắt đầu phát video — kết quả được cache Redis 5 phút ở backend.
   *
   * Merge logic (xử lý ở BE):
   *   - Nếu content có override ở position X → dùng override, bỏ global slots ở position đó.
   *   - Nếu không có override → dùng global slots (share cache theo contentType).
   *
   * NOTE: parentShowId đã bị loại bỏ — BE không còn cần merge show-level ads thủ công.
   *
   * @param {string} contentType - "Movie" | "TvShow" | "Episode"
   * @param {string} contentId   - UUID của content
   *
   * @returns {Promise<ContentAdsDTO>}
   *   {
   *     contentType, contentId,
   *     preRoll:  AdPlaybackDTO[],
   *     midRoll:  AdPlaybackDTO[],   // đã sort theo midRollOffsetSeconds
   *     postRoll: AdPlaybackDTO[],
   *   }
   *
   * AdPlaybackDTO: {
   *   adId, videoUrl, durationSeconds, skipAfterSeconds,
   *   clickThroughUrl, slotId, position,
   *   midRollOffsetSeconds, displayOrder
   * }
   */
  getAdsForContent: async (contentType, contentId) => {
    try {
      const response = await axiosInstance.get(
        `/ads/content/${contentType}/${contentId}`
      );
      return response;
    } catch (error) {
      console.error('[adService] Error fetching ads for content:', error);
      throw error;
    }
  },

  // ── Utility helpers ─────────────────────────────────────────────────────────

  /**
   * [Admin] Bật / tắt nhanh trạng thái active của 1 ad.
   * Shorthand của updateAd(adId, { isActive }).
   *
   * @param {string}  adId
   * @param {boolean} isActive
   */
  toggleAdStatus: async (adId, isActive) => {
    try {
      const formData = new FormData();
      formData.append('IsActive', String(isActive));

      const response = await axiosInstance.put(`/ads/${adId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response;
    } catch (error) {
      console.error('[adService] Error toggling ad status:', error);
      throw error;
    }
  },

  /**
   * Lấy ads cho nhiều content cùng lúc (batch).
   * Hữu ích khi render playlist — gọi song song thay vì tuần tự.
   *
   * NOTE: parentShowId đã bị loại bỏ theo thiết kế mới.
   *
   * @param {Array<{ contentType: string, contentId: string }>} items
   * @returns {Promise<ContentAdsDTO[]>}  - cùng thứ tự với mảng đầu vào
   */
  getBulkAdsForContents: async (items) => {
    try {
      return await Promise.all(
        items.map(({ contentType, contentId }) =>
          adService.getAdsForContent(contentType, contentId)
        )
      );
    } catch (error) {
      console.error('[adService] Error fetching bulk ads:', error);
      throw error;
    }
  },

  /**
   * [Admin] Bật / tắt nhanh trạng thái active của 1 global slot.
   * Shorthand của updateGlobalSlot(slotId, { isActive }).
   *
   * @param {string}  slotId
   * @param {boolean} isActive
   */
  toggleGlobalSlotStatus: async (slotId, isActive) => {
    try {
      const response = await axiosInstance.patch(
        `/ads/global-slots/${slotId}`,
        { isActive },
        { headers: JSON_HEADERS },
      );
      return response;
    } catch (error) {
      console.error('[adService] Error toggling global slot status:', error);
      throw error;
    }
  },

};

export default adService;