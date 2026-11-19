// src/hooks/useAdminHomeSections.js
// Admin → Quản lý trang chủ.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import homeSectionService from '../services/homeSectionService';
import movieService from '../services/movieService';
import tvShowService from '../services/tvShowService';
import { queryKeys, STALE } from '../config/queryKeys';

const keys = queryKeys.admin.homeSections;
const unwrap = (res) => res?.data ?? res;

// Khối đổi → làm mới cả admin lẫn trang chủ công khai.
const invalidateAll = (qc) => {
  qc.invalidateQueries({ queryKey: keys.all });
  qc.invalidateQueries({ queryKey: queryKeys.home.sections });
};

export function useAdminHomeSections() {
  return useQuery({
    queryKey: keys.list,
    queryFn: async () => {
      const list = unwrap(await homeSectionService.adminGetAll());
      return Array.isArray(list) ? list : [];
    },
    staleTime: STALE.admin,
  });
}

/** Danh sách layout / auto rule từ BE để dựng dropdown, không hard code ở FE. */
export function useHomeSectionMeta() {
  return useQuery({
    queryKey: keys.meta,
    queryFn: async () => unwrap(await homeSectionService.adminGetMeta()),
    staleTime: STALE.static,
  });
}

/**
 * Tìm phim / TV show để thêm vào khối Manual. kind: 'movie' | 'tvshow'.
 * Trả về mảng { contentType, contentId, title, posterUrl, year }.
 */
export function useContentSearch(kind, term) {
  const q = (term ?? '').trim();
  return useQuery({
    queryKey: keys.search(kind, q),
    enabled: q.length >= 2,
    staleTime: STALE.admin,
    queryFn: async () => {
      const filter = { search: q, page: 1, pageSize: 10 };
      const res = unwrap(
        kind === 'movie'
          ? await movieService.getMovies(filter)
          : await tvShowService.getTvShows(filter),
      );
      const items = Array.isArray(res) ? res : (res?.items ?? []);
      return items.map((it) => {
        const d = it.releaseDate || it.firstAirDate;
        return {
          contentType: kind,
          contentId: it.id,
          title: it.title,
          posterUrl: it.posterUrl,
          year: it.year ?? (d ? new Date(d).getFullYear() : null),
        };
      });
    },
  });
}

/** variables: { id?, dto } — có id thì cập nhật, không thì tạo mới. */
export function useSaveHomeSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'homeSections', 'save'],
    meta: { silent: true },
    mutationFn: ({ id, dto }) =>
      id ? homeSectionService.adminUpdate(id, dto) : homeSectionService.adminCreate(dto),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteHomeSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'homeSections', 'delete'],
    meta: { silent: true },
    mutationFn: (id) => homeSectionService.adminDelete(id),
    onSuccess: (_d, id) => {
      qc.setQueryData(keys.list, (old) => (Array.isArray(old) ? old.filter((s) => s.id !== id) : old));
      invalidateAll(qc);
    },
  });
}

/** variables: { id, isActive } — cập nhật lạc quan, lỗi thì hoàn lại. */
export function useSetHomeSectionActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'homeSections', 'active'],
    meta: { silent: true },
    mutationFn: ({ id, isActive }) => homeSectionService.adminSetActive(id, isActive),
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: keys.list });
      const prev = qc.getQueryData(keys.list);
      qc.setQueryData(keys.list, (old) =>
        Array.isArray(old) ? old.map((s) => (s.id === id ? { ...s, isActive } : s)) : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(keys.list, ctx.prev),
    onSettled: () => invalidateAll(qc),
  });
}

/** variables: sectionIds[] theo thứ tự mới — cập nhật lạc quan, lỗi thì hoàn lại. */
export function useReorderHomeSections() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'homeSections', 'reorder'],
    meta: { silent: true },
    mutationFn: (sectionIds) => homeSectionService.adminReorder(sectionIds),
    onMutate: async (sectionIds) => {
      await qc.cancelQueries({ queryKey: keys.list });
      const prev = qc.getQueryData(keys.list);
      qc.setQueryData(keys.list, (old) => {
        if (!Array.isArray(old)) return old;
        const byId = new Map(old.map((s) => [s.id, s]));
        return sectionIds.map((id, i) => ({ ...byId.get(id), sortOrder: i })).filter((s) => s.id);
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(keys.list, ctx.prev),
    onSettled: () => invalidateAll(qc),
  });
}