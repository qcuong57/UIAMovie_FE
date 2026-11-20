// src/hooks/useTmdbDiscover.js (chỉ còn query key, cache, enabled — gọi API nằm ở tmdbService)
import { useQuery } from '@tanstack/react-query';
import tmdbService from '../services/tmdbService';
import { queryKeys } from '../config/queryKeys';

const DAY = 24 * 60 * 60 * 1000;

const keys = queryKeys.admin.tmdb;

export const useTmdbDiscover = (kind, query, filters, page, enabled = true) =>
  useQuery({
    queryKey: keys.discover(kind, query, filters, page),
    queryFn: ({ signal }) => tmdbService.discover(kind, query, filters, page, { signal }),
    enabled, staleTime: 5 * 60 * 1000, retry: 1,
  });

export const useTmdbGenres = (kind) =>
  useQuery({
    queryKey: keys.genres(kind),
    queryFn: ({ signal }) => tmdbService.getGenres(kind, { signal }),
    staleTime: DAY, retry: 1,
  });

export const useTmdbExisting = (kind, ids) =>
  useQuery({
    queryKey: keys.existing(kind, ids),
    queryFn: ({ signal }) => tmdbService.getExisting(kind, ids, { signal }),
    enabled: ids.length > 0, staleTime: 30 * 1000,
  });