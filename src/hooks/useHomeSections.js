// src/hooks/useHomeSections.js
// Các khối trang chủ do admin cấu hình. Key nằm dưới gốc "home" (thuộc PUBLIC_QUERY_ROOTS + CATALOG_ROOTS):
// không bị reset khi đổi tài khoản, và tự làm mới khi admin sửa phim.

import { useQuery } from '@tanstack/react-query';
import homeSectionService from '../services/homeSectionService';
import { normalizeHomeSection } from '../utils/normalizeHomeCard';
import { queryKeys, STALE } from '../config/queryKeys';

export function useHomeSections(options = {}) {
  return useQuery({
    queryKey: queryKeys.home.sections,
    queryFn: async () => {
      const res = await homeSectionService.getPublic();
      const list = res?.data ?? res;
      return (Array.isArray(list) ? list : []).map(normalizeHomeSection);
    },
    staleTime: STALE.medium,
    ...options,
  });
}