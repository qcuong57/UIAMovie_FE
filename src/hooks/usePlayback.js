// src/hooks/usePlayback.js
import { useCallback, useEffect, useRef, useState } from "react";

const IDLE_STATE = { status: "idle", playback: null, error: null };
const LOADING_STATE = { status: "loading", playback: null, error: null };

/**
 * Gọi Playback API và quản lý trạng thái.
 *
 * @param {() => Promise<object>} loader  VD: () => playbackService.getMoviePlayback(id)
 * @param {string|null} key               Định danh nội dung; null = chưa sẵn sàng; đổi key = tải lại
 * @returns {{ status: "idle"|"loading"|"ready"|"blocked"|"error", playback, error, reload }}
 */
export default function usePlayback(loader, key) {
  const [state, setState] = useState(IDLE_STATE);

  // Luôn gọi loader mới nhất mà không buộc `load` đổi identity theo loader.
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  // Chống race khi đổi tập/phim nhanh: chỉ request mới nhất được ghi state.
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const isStale = () => requestId !== requestIdRef.current;

    if (!key) {
      setState(IDLE_STATE);
      return;
    }

    // Xoá playback cũ ngay để không flash video của tập trước.
    setState(LOADING_STATE);

    try {
      const playback = await loaderRef.current();
      if (isStale()) return;
      setState({
        status: playback?.canWatch ? "ready" : "blocked",
        playback,
        error: null,
      });
    } catch (error) {
      if (isStale()) return;
      setState({ status: "error", playback: null, error });
    }
  }, [key]);

  useEffect(() => {
    load();
    // Huỷ request đang bay khi unmount hoặc khi key đổi.
    return () => {
      requestIdRef.current++;
    };
  }, [load]);

  return { ...state, reload: load };
}