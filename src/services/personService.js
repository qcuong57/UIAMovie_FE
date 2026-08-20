// src/services/personService.js
import axiosInstance from "../config/axios";

const personService = {
  /**
   * Lấy chi tiết 1 người từ TMDB (tiểu sử, ngày sinh...)
   * GET /api/movies/tmdb/person/:tmdbPersonId
   */
  getPersonDetail: async (tmdbPersonId) => {
    try {
      const response = await axiosInstance.get(
        `/movies/tmdb/person/${tmdbPersonId}`,
      );
      return response.data ?? response;
    } catch (error) {
      console.error("Error fetching person detail:", error);
      throw error;
    }
  },

  /**
   * Lấy ảnh profile của 1 người từ TMDB — trả về List<string> (mảng URL)
   * GET /api/movies/tmdb/person/:tmdbPersonId/images
   */
  getPersonImages: async (tmdbPersonId) => {
    try {
      const response = await axiosInstance.get(
        `/movies/tmdb/person/${tmdbPersonId}/images`,
      );
      return response.data ?? response;
    } catch (error) {
      console.error("Error fetching person images:", error);
      return [];
    }
  },

  /**
   * Lấy danh sách diễn viên + đạo diễn của phim (local DB)
   * GET /api/movies/:movieId/cast
   */
  getMovieCast: async (movieId) => {
    try {
      const response = await axiosInstance.get(`/movies/${movieId}/cast`);
      return response.data ?? response;
    } catch (error) {
      console.error("Error fetching movie cast:", error);
      throw error;
    }
  },

    // ── Admin — CRUD Person trực tiếp trong DB (PersonsController) ─────────

  /**
   * [Admin] Autocomplete tìm diễn viên/đạo diễn có sẵn trong DB
   * GET /api/persons/search
   */
  searchPersons: async (query, page = 1, pageSize = 20) => {
    try {
      const response = await axiosInstance.get('/persons/search', {
        params: { query, page, pageSize },
      });
      return response.data;
    } catch (error) {
      console.error('[personService] Error searching persons:', error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết 1 Person theo Id nội bộ (khác getPersonDetail — cái đó theo tmdbPersonId)
   * GET /api/persons/{id}
   */
  getPersonById: async (id) => {
    try {
      const response = await axiosInstance.get(`/persons/${id}`);
      return response.data;
    } catch (error) {
      console.error('[personService] Error fetching person by id:', error);
      throw error;
    }
  },

  /**
   * [Admin] Tạo mới Person thủ công
   * POST /api/persons
   * @param {Object} dto - CreatePersonDTO (Name, TmdbPersonId?, ProfileUrl?, Biography?, Birthday?, PlaceOfBirth?)
   */
  createPerson: async (dto) => {
    try {
      const response = await axiosInstance.post('/persons', dto);
      return response.data;
    } catch (error) {
      console.error('[personService] Error creating person:', error);
      throw error;
    }
  },

  /**
   * [Admin] Cập nhật Person (PATCH-style — chỉ field nào gửi mới bị ghi đè)
   * PUT /api/persons/{id}
   * @param {string} id
   * @param {Object} dto - UpdatePersonDTO
   */
  updatePerson: async (id, dto) => {
    try {
      const response = await axiosInstance.put(`/persons/${id}`, dto);
      return response.data;
    } catch (error) {
      console.error('[personService] Error updating person:', error);
      throw error;
    }
  },

  /**
   * [Admin] Xóa Person — backend trả 400 nếu Person đang gắn với phim nào đó
   * DELETE /api/persons/{id}
   */
  deletePerson: async (id) => {
    try {
      const response = await axiosInstance.delete(`/persons/${id}`);
      return response.data;
    } catch (error) {
      console.error('[personService] Error deleting person:', error);
      throw error;
    }
  },

  /**
   * [Admin] Liệt kê các nhóm Person nghi trùng tên (để xét gộp)
   * GET /api/persons/duplicates
   */
  findDuplicatePersons: async () => {
    try {
      const response = await axiosInstance.get('/persons/duplicates');
      return response.data;
    } catch (error) {
      console.error('[personService] Error fetching duplicate persons:', error);
      throw error;
    }
  },

  /**
   * [Admin] Gộp nhiều Person trùng vào 1 Person chính
   * POST /api/persons/merge
   * @param {Object} dto - { primaryPersonId, duplicatePersonIds: [] }
   */
  mergePersons: async (dto) => {
    try {
      const response = await axiosInstance.post('/persons/merge', dto);
      return response.data;
    } catch (error) {
      console.error('[personService] Error merging persons:', error);
      throw error;
    }
  },
};

export default personService;
