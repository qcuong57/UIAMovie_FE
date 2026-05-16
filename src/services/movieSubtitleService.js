// src/services/movieSubtitleService.js
// Movie Subtitle API Service
// Khớp hoàn toàn với SubtitlesController.cs
//
// Endpoints:
//   GET    /api/movies/{movieId}/subtitles              → list subtitle (meta)
//   GET    /api/movies/{movieId}/subtitles/{id}/content → nội dung VTT để player load
//   GET    /api/movies/{movieId}/subtitles/{id}/status  → poll trạng thái AI dịch
//   POST   /api/movies/{movieId}/subtitles/upload       → [Admin] import .srt/.vtt
//   POST   /api/movies/{movieId}/subtitles/translate    → [Admin] AI dịch từ subtitle có sẵn
//   POST   /api/movies/{movieId}/subtitles/ai-generate  → [Admin] AI dịch từ raw content
//   PATCH  /api/movies/{movieId}/subtitles/{id}/default → [Admin] đặt làm default
//   DELETE /api/movies/{movieId}/subtitles/{id}         → [Admin] xóa

import axiosInstance from '../config/axios';

const movieSubtitleService = {
  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC — Lấy subtitle để player dùng
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Lấy danh sách subtitle của phim (meta, không kèm content).
   * Dùng để render dropdown chọn ngôn ngữ.
   *
   * GET /api/movies/{movieId}/subtitles
   *
   * @param {string} movieId - GUID
   * @returns {Promise<SubtitleInfoDTO[]>}
   *   SubtitleInfoDTO: { id, languageCode, languageName, source, status, errorMessage, isDefault, createdAt }
   *   status: 0=Ready, 1=Processing, 2=Failed
   */
  getSubtitles: async (movieId) => {
    try {
      const response = await axiosInstance.get(`/movies/${movieId}/subtitles`);
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[movieSubtitleService] Error fetching subtitles:', error);
      throw error;
    }
  },

  /**
   * Lấy nội dung WebVTT của subtitle để video player load.
   * Trả về JSON có field `content` chứa text VTT.
   *
   * GET /api/movies/{movieId}/subtitles/{id}/content
   *
   * @param {string} movieId    - GUID
   * @param {string} subtitleId - GUID
   * @returns {Promise<SubtitleContentDTO>}
   *   SubtitleContentDTO: { id, languageCode, languageName, content, format }
   */
  getSubtitleContent: async (movieId, subtitleId) => {
    try {
      const response = await axiosInstance.get(
        `/movies/${movieId}/subtitles/${subtitleId}/content`
      );
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[movieSubtitleService] Error fetching subtitle content:', error);
      throw error;
    }
  },

  /**
   * Lấy nội dung VTT dạng raw text/vtt (dùng với <track> element của HTML5).
   * Tự động tạo Blob URL để gán vào src của <track>.
   *
   * GET /api/movies/{movieId}/subtitles/{id}/content
   * Accept: text/vtt
   *
   * @param {string} movieId    - GUID
   * @param {string} subtitleId - GUID
   * @returns {Promise<string>} Blob URL — nhớ gọi URL.revokeObjectURL() sau khi dùng xong
   *
   * @example
   * const blobUrl = await movieSubtitleService.getSubtitleBlobUrl(movieId, subtitleId);
   * trackElement.src = blobUrl;
   * // Sau khi video load xong:
   * URL.revokeObjectURL(blobUrl);
   */
  getSubtitleBlobUrl: async (movieId, subtitleId) => {
    try {
      const response = await axiosInstance.get(
        `/movies/${movieId}/subtitles/${subtitleId}/content`,
        {
          headers: { Accept: 'text/vtt' },
          responseType: 'text',
          // Bypass interceptor unwrap — cần raw text
          transformResponse: [(data) => data],
        }
      );
      const vttText = typeof response === 'string' ? response : response.data;
      const blob    = new Blob([vttText], { type: 'text/vtt' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('[movieSubtitleService] Error getting subtitle blob URL:', error);
      throw error;
    }
  },

  /**
   * Poll trạng thái subtitle đang được AI dịch.
   * Gọi mỗi 3 giây cho đến khi status !== 1 (Processing).
   *
   * GET /api/movies/{movieId}/subtitles/{id}/status
   *
   * @param {string} movieId    - GUID
   * @param {string} subtitleId - GUID
   * @returns {Promise<{ id, status, languageCode, languageName, errorMessage }>}
   *   status: 0=Ready, 1=Processing, 2=Failed
   */
  getSubtitleStatus: async (movieId, subtitleId) => {
    try {
      const response = await axiosInstance.get(
        `/movies/${movieId}/subtitles/${subtitleId}/status`
      );
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[movieSubtitleService] Error fetching subtitle status:', error);
      throw error;
    }
  },

  /**
   * Tiện ích: Poll status cho đến khi subtitle sẵn sàng hoặc lỗi.
   *
   * @param {string}   movieId        - GUID
   * @param {string}   subtitleId     - GUID
   * @param {Function} [onProgress]   - callback({ status, languageCode, languageName })
   * @param {number}   [intervalMs=3000] - ms giữa mỗi lần poll
   * @param {number}   [timeoutMs=300000] - timeout tổng (mặc định 5 phút)
   * @returns {Promise<{ id, status, languageCode, languageName, errorMessage }>}
   * @throws {Error} nếu timeout hoặc status === 2 (Failed)
   *
   * @example
   * const result = await movieSubtitleService.pollUntilReady(movieId, subtitleId, (s) => {
   *   console.log('Đang dịch...', s.languageName);
   * });
   * if (result.status === 0) console.log('Dịch xong!');
   */
  pollUntilReady: async (movieId, subtitleId, onProgress, intervalMs = 3000, timeoutMs = 300_000) => {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const status = await movieSubtitleService.getSubtitleStatus(movieId, subtitleId);
      onProgress?.(status);

      if (status.status !== 1) return status; // 0=Ready hoặc 2=Failed
      await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new Error('Subtitle translation timeout sau ' + timeoutMs / 1000 + 's');
  },

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN — Import & AI dịch
  // ═══════════════════════════════════════════════════════════════════

  /**
   * [Admin] Upload file subtitle .srt hoặc .vtt thủ công.
   * Auto-convert SRT → VTT phía backend.
   *
   * POST /api/movies/{movieId}/subtitles/upload
   * Content-Type: multipart/form-data
   *
   * @param {string}  movieId          - GUID
   * @param {File}    file             - File object (.srt hoặc .vtt, tối đa 5MB)
   * @param {string}  languageCode     - ISO 639-1: "vi", "en", "ko", ...
   * @param {string}  [languageName]   - Tên hiển thị; tự điền nếu để trống
   * @param {boolean} [isDefault=false]
   * @returns {Promise<SubtitleInfoDTO>}
   */
  uploadSubtitle: async (movieId, file, languageCode, languageName = '', isDefault = false) => {
    try {
      const formData = new FormData();
      formData.append('File', file);
      formData.append('LanguageCode', languageCode);
      if (languageName) formData.append('LanguageName', languageName);
      formData.append('IsDefault', isDefault);

      const response = await axiosInstance.post(
        `/movies/${movieId}/subtitles/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[movieSubtitleService] Error uploading subtitle:', error);
      throw error;
    }
  },

  /**
   * [Admin] Yêu cầu AI dịch subtitle đã có trong DB sang ngôn ngữ khác.
   * Trả về ngay với status=1 (Processing).
   * Dùng pollUntilReady() hoặc getSubtitleStatus() để theo dõi tiến trình.
   *
   * POST /api/movies/{movieId}/subtitles/translate
   *
   * @param {string} movieId            - GUID
   * @param {string} sourceSubtitleId   - GUID của subtitle gốc cần dịch
   * @param {string} targetLanguageCode - ISO 639-1: "vi", "en", "ja", ...
   * @param {string} [targetLanguageName]
   * @returns {Promise<SubtitleInfoDTO>} subtitle mới với status=1 (Processing)
   */
  translateSubtitle: async (movieId, sourceSubtitleId, targetLanguageCode, targetLanguageName = '') => {
    try {
      const response = await axiosInstance.post(`/movies/${movieId}/subtitles/translate`, {
        sourceSubtitleId,
        targetLanguageCode,
        ...(targetLanguageName && { targetLanguageName }),
      });
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[movieSubtitleService] Error translating subtitle:', error);
      throw error;
    }
  },

  /**
   * [Admin] AI dịch từ raw SRT/VTT content paste trực tiếp.
   * Dùng khi chưa có subtitle gốc trong DB.
   * Trả về ngay với status=1 (Processing).
   *
   * POST /api/movies/{movieId}/subtitles/ai-generate
   *
   * @param {string} movieId            - GUID
   * @param {string} sourceContent      - Nội dung SRT hoặc VTT gốc
   * @param {string} [sourceLanguageCode='en'] - ISO 639-1 ngôn ngữ gốc
   * @param {string} targetLanguageCode - ISO 639-1 ngôn ngữ đích
   * @param {string} [targetLanguageName]
   * @returns {Promise<SubtitleInfoDTO>} subtitle mới với status=1 (Processing)
   */
  aiGenerateSubtitle: async (
    movieId,
    sourceContent,
    sourceLanguageCode = 'en',
    targetLanguageCode,
    targetLanguageName = ''
  ) => {
    try {
      const response = await axiosInstance.post(`/movies/${movieId}/subtitles/ai-generate`, {
        sourceContent,
        sourceLanguageCode,
        targetLanguageCode,
        ...(targetLanguageName && { targetLanguageName }),
      });
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[movieSubtitleService] Error AI generating subtitle:', error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN — Quản lý
  // ═══════════════════════════════════════════════════════════════════

  /**
   * [Admin] Đặt subtitle là mặc định khi phim load.
   * Backend tự clear default cũ trước khi set cái mới.
   *
   * PATCH /api/movies/{movieId}/subtitles/{id}/default
   *
   * @param {string} movieId    - GUID
   * @param {string} subtitleId - GUID
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  setDefault: async (movieId, subtitleId) => {
    try {
      const response = await axiosInstance.patch(
        `/movies/${movieId}/subtitles/${subtitleId}/default`
      );
      return response.data ?? response;
    } catch (error) {
      console.error('[movieSubtitleService] Error setting default subtitle:', error);
      throw error;
    }
  },

  /**
   * [Admin] Xóa subtitle.
   *
   * DELETE /api/movies/{movieId}/subtitles/{id}
   *
   * @param {string} movieId    - GUID
   * @param {string} subtitleId - GUID
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  deleteSubtitle: async (movieId, subtitleId) => {
    try {
      const response = await axiosInstance.delete(
        `/movies/${movieId}/subtitles/${subtitleId}`
      );
      return response.data ?? response;
    } catch (error) {
      console.error('[movieSubtitleService] Error deleting subtitle:', error);
      throw error;
    }
  },
};

export default movieSubtitleService;