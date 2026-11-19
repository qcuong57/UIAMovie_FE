// src/services/tmdbService.js
import axiosInstance from '../config/axios';

const unwrap = (res) => {
  const isAxiosResponse =
    res && typeof res === 'object' && 'status' in res && 'data' in res && 'headers' in res;
  const body = isAxiosResponse ? res.data : res;
  return body?.data ?? body;
};

const isYear = (v) => /^\d{4}$/.test(String(v ?? '').trim());

// Khớp TmdbDiscoverFilterDTO ở backend: Query, Genres ("28,35"), Country, YearFrom, YearTo,
// MinRating, MinVotes, Sort, Page. Chỉ gửi param có giá trị hợp lệ.
function buildDiscoverParams(query, f = {}, page = 1) {
  const params = { page: page || 1 };

  const q = (query ?? '').trim();
  if (q) params.query = q;

  // Backend nhận Genres là CHUỖI phân tách bằng dấu phẩy. Nếu để axios tự serialize mảng
  // sẽ thành genres[]=28&genres[]=35 và backend không bind được -> thể loại bị bỏ qua.
  if (f.genres?.length) params.genres = [...f.genres].sort((a, b) => a - b).join(',');

  if (f.country) params.country = f.country;

  let from = isYear(f.yearFrom) ? Number(String(f.yearFrom).trim()) : null;
  let to   = isYear(f.yearTo)   ? Number(String(f.yearTo).trim())   : null;
  if (from && to && from > to) [from, to] = [to, from]; // "từ" > "đến" sẽ không ra phim nào
  if (from) params.yearFrom = from;
  if (to)   params.yearTo   = to;

  if (f.minRating) params.minRating = f.minRating;
  if (f.minVotes)  params.minVotes  = f.minVotes;
  if (f.sort)      params.sort      = f.sort;

  return params;
}

const tmdbService = {
  discover: async (kind, query, filters, page, { signal } = {}) => {
    const res = await axiosInstance.get(`/admin/tmdb/${kind}/discover`, {
      params: buildDiscoverParams(query, filters, page), signal,
    });
    return unwrap(res) ?? { results: [], nextPage: null, totalResults: 0, isFiltered: false, notes: [] };
  },

  getGenres: async (kind, { signal } = {}) => {
    const list = unwrap(await axiosInstance.get(`/admin/tmdb/${kind}/genres`, { signal }));
    return Array.isArray(list) ? list : [];
  },

  getExisting: async (kind, ids, { signal } = {}) => {
    const body = unwrap(await axiosInstance.post(`/admin/tmdb/${kind}/exists`, { ids }, { signal }));
    return Array.isArray(body?.existing) ? body.existing : [];
  },
};

export default tmdbService;