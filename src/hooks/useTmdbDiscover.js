// src/hooks/useTmdbDiscover.js (chỉ còn query key, cache, enabled — gọi API nằm ở tmdbService)
import { useQuery } from '@tanstack/react-query';
import tmdbService from '../services/tmdbService';

const DAY = 24 * 60 * 60 * 1000;

// Query key tập trung một chỗ để component invalidate không phải hard-code mảng key.
export const tmdbKeys = {
  all: ['admin', 'tmdb'],
  discover: (kind, query, filters, page) => [
    'admin', 'tmdb', 'discover', kind, query,
    // sắp xếp thể loại để chọn [1,2] và [2,1] dùng chung một cache entry
    { ...filters, genres: [...(filters?.genres ?? [])].sort((a, b) => a - b) },
    page,
  ],
  genres: (kind) => ['admin', 'tmdb', 'genres', kind],
  existing: (kind, ids) => ['admin', 'tmdb', 'exists', kind, ids.join(',')],
  existingAll: () => ['admin', 'tmdb', 'exists'], // prefix — dùng để invalidate
};

export const useTmdbDiscover = (kind, query, filters, page, enabled = true) =>
  useQuery({
    queryKey: tmdbKeys.discover(kind, query, filters, page),
    queryFn: ({ signal }) => tmdbService.discover(kind, query, filters, page, { signal }),
    enabled, staleTime: 5 * 60 * 1000, retry: 1,
  });

export const useTmdbGenres = (kind) =>
  useQuery({
    queryKey: tmdbKeys.genres(kind),
    queryFn: ({ signal }) => tmdbService.getGenres(kind, { signal }),
    staleTime: DAY, retry: 1,
  });

export const useTmdbExisting = (kind, ids) =>
  useQuery({
    queryKey: tmdbKeys.existing(kind, ids),
    queryFn: ({ signal }) => tmdbService.getExisting(kind, ids, { signal }),
    enabled: ids.length > 0, staleTime: 30 * 1000,
  });