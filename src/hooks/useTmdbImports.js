// src/hooks/useTmdbImports.js
// Gắn store import TMDB (chạy nền) vào React.

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { getJobs, subscribe, subscribeSettled, isActive } from '../../stores/tmdbImportStore';

/** Toàn bộ job: { [`${kind}:${tmdbId}`]: job }. Object đổi tham chiếu mỗi khi có thay đổi. */
export const useImportJobs = () => useSyncExternalStore(subscribe, getJobs);

const byStatusThenTime = (a, b) => {
  const rank = (j) => (j.status === 'running' ? 0 : j.status === 'queued' ? 1 : 2);
  if (rank(a) !== rank(b)) return rank(a) - rank(b);
  return rank(a) === 2
    ? (b.finishedAt ?? 0) - (a.finishedAt ?? 0) // đã xong: mới nhất trước
    : a.createdAt - b.createdAt;                // đang chạy/chờ: theo thứ tự thêm vào
};

/** Danh sách job: đang chạy → đang chờ → đã xong (mới nhất trước). */
export function useImportJobList() {
  const jobs = useImportJobs();
  return useMemo(() => Object.values(jobs).sort(byStatusThenTime), [jobs]);
}

/** Chạy callback sau khi một nhóm job vừa xong (đã debounce). */
export function useOnImportsSettled(callback) {
  const ref = useRef(callback);
  useEffect(() => { ref.current = callback; });
  useEffect(() => subscribeSettled(() => ref.current?.()), []);
}

/**
 * Thống kê "đợt" import hiện tại: các job được thêm từ lúc job đang hoạt động sớm nhất.
 * Trả về null khi không còn job nào đang chạy/chờ.
 */
export function batchStats(list) {
  const active = list.filter(isActive);
  if (active.length === 0) return null;

  const start = Math.min(...active.map((j) => j.createdAt));
  const batch = list.filter((j) => j.createdAt >= start);
  const finished = batch.filter((j) => !isActive(j)).length;
  const partial = active.reduce((sum, j) => sum + (j.status === 'running' ? (j.progress ?? 0) / 100 : 0), 0);

  return {
    total: batch.length,
    finished,
    failed: batch.filter((j) => j.status === 'failed').length,
    running: active.filter((j) => j.status === 'running').length,
    queued: active.filter((j) => j.status === 'queued').length,
    percent: Math.round(((finished + partial) / batch.length) * 100),
  };
}
