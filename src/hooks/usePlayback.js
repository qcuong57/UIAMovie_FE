// src/hooks/usePlayback.js
import { useCallback, useEffect, useRef, useState } from "react";

const IDLE_STATE = { status: "idle", playback: null, error: null };
const LOADING_STATE = { status: "loading", playback: null, error: null };

const toReadyState = (playback) => ({
  status: playback?.canWatch ? "ready" : "blocked",
  playback,
  error: null,
});

/**
 * Gọi Playback API và quản lý trạng thái.
 *
 * @param {() => Promise<object>} loader  VD: () => playbackService.getMoviePlayback(id)
 * @param {string|null} key               Định danh nội dung; null = chưa sẵn sàng; đổi key = tải lại
 * @returns {{
 *   status: "idle"|"loading"|"ready"|"blocked"|"error",
 *   playback, error,
 *   reload: () => Promise<void>,          // tải lại, hiện trạng thái loading
 *   refresh: () => Promise<object|null>,  // lấy link mới NGẦM (không loading) — dùng khi link bị từ chối
 * }}
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
      setState(toReadyState(playback));
    } catch (error) {
      if (isStale()) return;
      setState({ status: "error", playback: null, error });
    }
  }, [key]);

  // Lấy link ký mới mà không đụng tới player đang mount.
  // Lỗi mạng → giữ nguyên state hiện tại, trả null để nơi gọi tự quyết định.
  // Mất quyền (canWatch=false) → state chuyển "blocked", player tự hiện paywall.
  const refresh = useCallback(async () => {
    if (!key) return null;

    const requestId = ++requestIdRef.current;
    try {
      const playback = await loaderRef.current();
      if (requestId !== requestIdRef.current) return null;
      setState(toReadyState(playback));
      return playback;
    } catch {
      return null;
    }
  }, [key]);

  useEffect(() => {
    load();
    // Huỷ request đang bay khi unmount hoặc khi key đổi.
    return () => {
      requestIdRef.current++;
    };
  }, [load]);

  return { ...state, reload: load, refresh };
}