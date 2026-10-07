// src/hooks/usePlayback.js
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Gọi Playback API và quản lý trạng thái.
 *
 * @param {() => Promise<object>} loader  VD: () => playbackService.getMoviePlayback(id)
 * @param {string|null} key               Định danh nội dung; null = chưa sẵn sàng; đổi key = tải lại
 * @returns {{ status: "idle"|"loading"|"ready"|"blocked"|"error", playback, error, reload }}
 */
export default function usePlayback(loader, key) {
  const [state, setState] = useState({ status: "idle", playback: null, error: null });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const reqRef = useRef(0);

  const load = useCallback(async () => {
    const id = ++reqRef.current; // chống race khi đổi tập/phim nhanh
    if (!key) {
      setState({ status: "idle", playback: null, error: null });
      return;
    }
    // Xoá playback cũ ngay để không flash video của tập trước
    setState({ status: "loading", playback: null, error: null });
    try {
      const playback = await loaderRef.current();
      if (id !== reqRef.current) return;
      setState({
        status: playback?.canWatch ? "ready" : "blocked",
        playback,
        error: null,
      });
    } catch (error) {
      if (id !== reqRef.current) return;
      setState({ status: "error", playback: null, error });
    }
  }, [key]);

  useEffect(() => {
    load();
    return () => {
      reqRef.current++;
    };
  }, [load]);

  return { ...state, reload: load };
}