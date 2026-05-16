// src/services/episodeSubtitleService.js
// Episode Subtitle API Service
// Khớp hoàn toàn với EpisodeSubtitlesController.cs
//
// Endpoints:
//   GET    /api/episodes/{episodeId}/subtitles              → list subtitle (meta)
//   GET    /api/episodes/{episodeId}/subtitles/{id}/content → nội dung VTT để player load
//   GET    /api/episodes/{episodeId}/subtitles/{id}/status  → poll trạng thái AI dịch
//   POST   /api/episodes/{episodeId}/subtitles/upload       → [Admin] import .srt/.vtt
//   POST   /api/episodes/{episodeId}/subtitles/translate    → [Admin] AI dịch từ subtitle có sẵn
//   POST   /api/episodes/{episodeId}/subtitles/ai-generate  → [Admin] AI dịch từ raw content
//   PATCH  /api/episodes/{episodeId}/subtitles/{id}/default → [Admin] đặt làm default
//   DELETE /api/episodes/{episodeId}/subtitles/{id}         → [Admin] xóa

import axiosInstance from '../config/axios';

const episodeSubtitleService = {
  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC — Lấy subtitle để player dùng
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Lấy danh sách subtitle của tập phim (meta, không kèm content).
   * Dùng để render dropdown chọn ngôn ngữ.
   *
   * GET /api/episodes/{episodeId}/subtitles
   *
   * @param {string} episodeId - GUID
   * @returns {Promise<EpisodeSubtitleDTO[]>}
   *   EpisodeSubtitleDTO: { id, episodeId, languageCode, languageName, source,
   *                         translatedFrom, status, errorMessage, isDefault, createdAt, updatedAt }
   *   status: 0=Ready, 1=Processing, 2=Failed
   */
  getSubtitles: async (episodeId) => {
    try {
      const response = await axiosInstance.get(`/episodes/${episodeId}/subtitles`);
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[episodeSubtitleService] Error fetching subtitles:', error);
      throw error;
    }
  },

  /**
   * Lấy nội dung WebVTT của subtitle để video player load.
   * Trả về JSON có field `content` chứa text VTT.
   *
   * GET /api/episodes/{episodeId}/subtitles/{id}/content
   *
   * @param {string} episodeId  - GUID
   * @param {string} subtitleId - GUID
   * @returns {Promise<EpisodeSubtitleContentDTO>}
   *   EpisodeSubtitleContentDTO: { id, episodeId, languageCode, languageName, content }
   */
  getSubtitleContent: async (episodeId, subtitleId) => {
    try {
      const response = await axiosInstance.get(
        `/episodes/${episodeId}/subtitles/${subtitleId}/content`
      );
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[episodeSubtitleService] Error fetching subtitle content:', error);
      throw error;
    }
  },

  /**
   * Lấy nội dung VTT dạng raw text/vtt (dùng với <track> element của HTML5).
   * Tự động tạo Blob URL để gán vào src của <track>.
   *
   * GET /api/episodes/{episodeId}/subtitles/{id}/content
   * Accept: text/vtt
   *
   * @param {string} episodeId  - GUID
   * @param {string} subtitleId - GUID
   * @returns {Promise<string>} Blob URL — nhớ gọi URL.revokeObjectURL() sau khi dùng xong
   *
   * @example
   * const blobUrl = await episodeSubtitleService.getSubtitleBlobUrl(episodeId, subtitleId);
   * trackElement.src = blobUrl;
   * // Sau khi video load xong:
   * URL.revokeObjectURL(blobUrl);
   */
  getSubtitleBlobUrl: async (episodeId, subtitleId) => {
    try {
      const response = await axiosInstance.get(
        `/episodes/${episodeId}/subtitles/${subtitleId}/content`,
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
      console.error('[episodeSubtitleService] Error getting subtitle blob URL:', error);
      throw error;
    }
  },

  /**
   * Poll trạng thái subtitle đang được AI dịch.
   * Gọi mỗi 3 giây cho đến khi status !== 1 (Processing).
   *
   * GET /api/episodes/{episodeId}/subtitles/{id}/status
   *
   * @param {string} episodeId  - GUID
   * @param {string} subtitleId - GUID
   * @returns {Promise<{ id, status, languageCode, languageName, errorMessage }>}
   *   status: 0=Ready, 1=Processing, 2=Failed
   */
  getSubtitleStatus: async (episodeId, subtitleId) => {
    try {
      const response = await axiosInstance.get(
        `/episodes/${episodeId}/subtitles/${subtitleId}/status`
      );
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[episodeSubtitleService] Error fetching subtitle status:', error);
      throw error;
    }
  },

  /**
   * Tiện ích: Poll status cho đến khi subtitle sẵn sàng hoặc lỗi.
   *
   * @param {string}   episodeId      - GUID
   * @param {string}   subtitleId     - GUID
   * @param {Function} [onProgress]   - callback({ status, languageCode, languageName, errorMessage })
   * @param {number}   [intervalMs=3000]
   * @param {number}   [timeoutMs=300000] - timeout tổng (mặc định 5 phút)
   * @returns {Promise<{ id, status, languageCode, languageName, errorMessage }>}
   * @throws {Error} nếu timeout
   *
   * @example
   * const result = await episodeSubtitleService.pollUntilReady(episodeId, subtitleId, (s) => {
   *   console.log('Đang dịch...', s.languageName);
   * });
   * if (result.status === 0) console.log('Dịch xong!');
   * if (result.status === 2) console.error('Lỗi:', result.errorMessage);
   */
  pollUntilReady: async (episodeId, subtitleId, onProgress, intervalMs = 3000, timeoutMs = 300_000) => {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const status = await episodeSubtitleService.getSubtitleStatus(episodeId, subtitleId);
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
   * POST /api/episodes/{episodeId}/subtitles/upload
   * Content-Type: multipart/form-data
   *
   * @param {string}  episodeId        - GUID
   * @param {File}    file             - File object (.srt hoặc .vtt, tối đa 5MB)
   * @param {string}  languageCode     - ISO 639-1: "vi", "en", "ko", ...
   * @param {string}  [languageName]   - Tên hiển thị; tự điền nếu để trống
   * @param {boolean} [isDefault=false]
   * @returns {Promise<EpisodeSubtitleDTO>}
   */
  uploadSubtitle: async (episodeId, file, languageCode, languageName = '', isDefault = false) => {
    try {
      const formData = new FormData();
      formData.append('File', file);
      formData.append('LanguageCode', languageCode);
      if (languageName) formData.append('LanguageName', languageName);
      formData.append('IsDefault', isDefault);

      const response = await axiosInstance.post(
        `/episodes/${episodeId}/subtitles/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[episodeSubtitleService] Error uploading subtitle:', error);
      throw error;
    }
  },

  /**
   * [Admin] Yêu cầu AI dịch subtitle đã có trong DB sang ngôn ngữ khác.
   * Trả về ngay với status=1 (Processing).
   * Dùng pollUntilReady() để theo dõi tiến trình.
   *
   * POST /api/episodes/{episodeId}/subtitles/translate
   *
   * @param {string} episodeId          - GUID
   * @param {string} sourceSubtitleId   - GUID của subtitle gốc cần dịch
   * @param {string} targetLanguageCode - ISO 639-1: "vi", "en", "ja", ...
   * @param {string} [targetLanguageName]
   * @returns {Promise<EpisodeSubtitleDTO>} subtitle mới với status=1 (Processing)
   */
  translateSubtitle: async (episodeId, sourceSubtitleId, targetLanguageCode, targetLanguageName = '') => {
    try {
      const response = await axiosInstance.post(`/episodes/${episodeId}/subtitles/translate`, {
        sourceSubtitleId,
        targetLanguageCode,
        ...(targetLanguageName && { targetLanguageName }),
      });
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[episodeSubtitleService] Error translating subtitle:', error);
      throw error;
    }
  },

  /**
   * [Admin] AI dịch từ raw SRT/VTT content paste trực tiếp.
   * Dùng khi chưa có subtitle gốc trong DB.
   * Trả về ngay với status=1 (Processing).
   *
   * POST /api/episodes/{episodeId}/subtitles/ai-generate
   * Body: { sourceContent, sourceLanguageCode, targetLanguageCode, targetLanguageName? }
   * (EpisodeId được backend tự lấy từ route, không cần gửi)
   *
   * @param {string} episodeId          - GUID
   * @param {string} sourceContent      - Nội dung SRT hoặc VTT gốc
   * @param {string} [sourceLanguageCode='en']
   * @param {string} targetLanguageCode - ISO 639-1 ngôn ngữ đích
   * @param {string} [targetLanguageName]
   * @returns {Promise<EpisodeSubtitleDTO>} subtitle mới với status=1 (Processing)
   */
  aiGenerateSubtitle: async (
    episodeId,
    sourceContent,
    sourceLanguageCode = 'en',
    targetLanguageCode,
    targetLanguageName = ''
  ) => {
    try {
      const response = await axiosInstance.post(`/episodes/${episodeId}/subtitles/ai-generate`, {
        sourceContent,
        sourceLanguageCode,
        targetLanguageCode,
        ...(targetLanguageName && { targetLanguageName }),
      });
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[episodeSubtitleService] Error AI generating subtitle:', error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN — Quản lý
  // ═══════════════════════════════════════════════════════════════════

  /**
   * [Admin] Đặt subtitle là mặc định khi tập phim load.
   * Backend tự clear default cũ trước khi set cái mới.
   *
   * PATCH /api/episodes/{episodeId}/subtitles/{id}/default
   *
   * @param {string} episodeId  - GUID
   * @param {string} subtitleId - GUID
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  setDefault: async (episodeId, subtitleId) => {
    try {
      const response = await axiosInstance.patch(
        `/episodes/${episodeId}/subtitles/${subtitleId}/default`
      );
      return response.data ?? response;
    } catch (error) {
      console.error('[episodeSubtitleService] Error setting default subtitle:', error);
      throw error;
    }
  },

  /**
   * [Admin] Xóa subtitle.
   *
   * DELETE /api/episodes/{episodeId}/subtitles/{id}
   *
   * @param {string} episodeId  - GUID
   * @param {string} subtitleId - GUID
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  deleteSubtitle: async (episodeId, subtitleId) => {
    try {
      const response = await axiosInstance.delete(
        `/episodes/${episodeId}/subtitles/${subtitleId}`
      );
      return response.data ?? response;
    } catch (error) {
      console.error('[episodeSubtitleService] Error deleting subtitle:', error);
      throw error;
    }
  },
};

export default episodeSubtitleService;