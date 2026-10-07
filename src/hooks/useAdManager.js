// src/hooks/useAdManager.js
// Logic quảng cáo dùng chung cho EpisodeVideoPlayer và MovieVideoPlayer.
//
// KIẾN TRÚC: SINGLE-VIDEO — ad và phim phát trên CÙNG một <video> (videoRef).
// Khi vào ad break: swap v.src = ad.videoUrl. Hết ad: swap lại contentUrl,
// seek về vị trí cũ (midroll) rồi play tiếp.
//
// Các lỗi của bản cũ được xử lý ở đây:
//  1. Side-effect (playAdOnVideo / resumeContent) nằm TRONG hàm updater của
//     setState → React có thể gọi updater 2 lần (StrictMode) hoặc trì hoãn,
//     khiến ad phát đôi / isAdPlayingRef đổi sai thời điểm. Nay queue + phase
//     nằm trong ref, state chỉ dùng để render UI.
//  2. Ended của ad và onEnded của player cùng bắn trên 1 <video>; nếu hook
//     reset isAdPlayingRef đồng bộ thì player tưởng PHIM vừa hết → postroll /
//     lưu 100%. Nay chuyển ad kế tiếp ở tick sau (setTimeout 0).
//  3. Ad có skipAfterSeconds = 0 giờ skip được ngay.
//  4. Bỏ state/tham số thừa (adQueue, adPhase, videoReady).
//
// Player PHẢI: (a) gọi tryStartPreRoll() đồng bộ trong gesture của lần Play đầu,
// (b) bỏ qua mọi logic của phim khi isAdPlayingRef.current === true
//     (onCanPlay/onTimeUpdate/onPause/onEnded).

import { useState, useEffect, useRef, useCallback } from "react";
import adService from "../services/adService";

const FETCH_TIMEOUT_MS = 5000; // quá hạn vẫn mở khoá nút Play

// Log chẩn đoán: chạy localStorage.setItem("debugAds","1") trong Console rồi tải lại trang.
const log = (...args) => {
  try {
    if (localStorage.getItem("debugAds")) console.info("[ads]", ...args);
  } catch {
    /* ignore */
  }
};

export function useAdManager({
  isFreeUser,
  contentType, // "Episode" | "Movie"
  contentId,
  parentId,
  videoRef,
  contentUrl,
}) {
  const [allAds, setAllAds] = useState(null); // ContentAdsDTO | null
  const [adsFetchDone, setAdsFetchDone] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const [adProgress, setAdProgress] = useState(0);
  const [adTimeLeft, setAdTimeLeft] = useState(0);
  const [adSkippable, setAdSkippable] = useState(false);
  const [adSkipCountdown, setAdSkipCountdown] = useState(0);

  // true suốt thời gian đang ở ad break (kể cả giữa 2 ad liên tiếp)
  const isAdPlayingRef = useRef(false);
  const queueRef = useRef([]); // các ad còn lại trong break
  const phaseRef = useRef(null); // "preroll" | "midroll" | "postroll"
  const mainResumeTimeRef = useRef(0);
  const preRollFiredRef = useRef(false);
  const postRollFiredRef = useRef(false);
  const midRollFiredRef = useRef(new Set());
  const contentUrlRef = useRef(contentUrl);

  useEffect(() => {
    contentUrlRef.current = contentUrl;
  }, [contentUrl]);

  // ── Fetch ads khi content đổi ───────────────────────────────
  useEffect(() => {
    preRollFiredRef.current = false;
    postRollFiredRef.current = false;
    midRollFiredRef.current = new Set();
    setAllAds(null);

    if (!isFreeUser || !contentId) {
      log("bỏ qua, không fetch ads:", { isFreeUser, contentId });
      setAdsFetchDone(true); // premium / chưa có content → không cần chờ
      return;
    }

    setAdsFetchDone(false);
    let cancelled = false;
    const safetyTimer = setTimeout(() => {
      if (!cancelled) setAdsFetchDone(true);
    }, FETCH_TIMEOUT_MS);

    adService
      .getAdsForContent(contentType, contentId, parentId)
      .then((data) => {
        log("đã fetch ads", contentType, contentId, {
          pre: data?.preRoll?.length,
          mid: data?.midRoll?.length,
          post: data?.postRoll?.length,
          raw: data,
        });
        if (!cancelled) setAllAds(data);
      })
      .catch((e) =>
        log("fetch ads LỖI", e?.message, e?.response?.status, e?.code),
      )
      .finally(() => {
        clearTimeout(safetyTimer);
        if (!cancelled) setAdsFetchDone(true);
      });

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
    };
  }, [isFreeUser, contentType, contentId]);

  // ── Phát 1 ad trên videoRef ─────────────────────────────────
  // play() phải gọi đồng bộ ngay sau load() để còn nằm trong user gesture (iOS).
  const playAdOnVideo = useCallback(
    (ad) => {
      const v = videoRef.current;
      if (!v) return false;
      isAdPlayingRef.current = true;
      setCurrentAd(ad);
      setAdProgress(0);
      setAdTimeLeft(ad.durationSeconds ?? 0);
      setAdSkippable((ad.skipAfterSeconds ?? Infinity) <= 0);
      setAdSkipCountdown(ad.skipAfterSeconds ?? 0);

      v.pause();
      v.src = ad.videoUrl;
      v.currentTime = 0;
      v.load();
      log("phát ad", ad.videoUrl);
      v.addEventListener(
        "error",
        () => log("video ad LỖI code", v.error?.code, v.currentSrc),
        { once: true },
      );
      v.play().catch((e) => log("ad play() bị từ chối", e?.name, e?.message));
      return true;
    },
    [videoRef],
  );

  // ── Bắt đầu 1 ad break ──────────────────────────────────────
  const startBreak = useCallback(
    (ads, phase, resumeAt = 0) => {
      const playable = (ads ?? []).filter((a) => a?.videoUrl);
      if (!playable.length) return false;
      const [first, ...rest] = playable;
      queueRef.current = rest;
      phaseRef.current = phase;
      mainResumeTimeRef.current = resumeAt;
      return playAdOnVideo(first);
    },
    [playAdOnVideo],
  );

  // ── Hết break → trả video về phim ───────────────────────────
  const resumeContent = useCallback(() => {
    const v = videoRef.current;
    const phase = phaseRef.current;
    phaseRef.current = null;
    queueRef.current = [];
    isAdPlayingRef.current = false;
    setCurrentAd(null);
    setAdProgress(0);
    setAdTimeLeft(0);
    setAdSkippable(false);
    setAdSkipCountdown(0);
    if (!v) return;

    // Đặt lại src phim. Với MSE, useHlsSource tự attachMedia (ghi đè src bằng blob)
    // khi isAd chuyển về false, nên không cần cầu nối ở đây.
    if (contentUrlRef.current) v.src = contentUrlRef.current;
    v.load();
    v.addEventListener(
      "loadedmetadata",
      () => {
        if (phase === "midroll") v.currentTime = mainResumeTimeRef.current;
        v.play().catch(() => {});
      },
      { once: true },
    );
  }, [videoRef]);

  // ── Ad kết thúc / bị skip → ad kế tiếp hoặc quay về phim ────
  const advance = useCallback(() => {
    if (!isAdPlayingRef.current) return;
    const next = queueRef.current.shift();
    if (next) playAdOnVideo(next);
    else resumeContent();
  }, [playAdOnVideo, resumeContent]);

  // ── Listener trên videoRef chỉ khi đang có ad ───────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !currentAd) return;

    const onTime = () => {
      const dur = currentAd.durationSeconds || v.duration || 1;
      const elapsed = v.currentTime;
      setAdProgress(Math.min(100, (elapsed / dur) * 100));
      setAdTimeLeft(Math.max(0, Math.ceil(dur - elapsed)));
      if (currentAd.skipAfterSeconds != null) {
        setAdSkipCountdown(
          Math.max(0, Math.ceil(currentAd.skipAfterSeconds - elapsed)),
        );
        if (elapsed >= currentAd.skipAfterSeconds) setAdSkippable(true);
      }
    };
    // Trì hoãn 1 tick để các listener "ended" khác (player) vẫn thấy
    // isAdPlayingRef = true và bỏ qua.
    const onEnded = () => setTimeout(advance, 0);

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnded);
    };
  }, [currentAd, advance, videoRef]);

  // ── PreRoll: player gọi đồng bộ trong gesture của lần Play đầu ──
  const tryStartPreRoll = useCallback(() => {
    if (preRollFiredRef.current) return false;
    preRollFiredRef.current = true;
    log("tryStartPreRoll", { adsLoaded: !!allAds, count: allAds?.preRoll?.length ?? 0 });
    return startBreak(allAds?.preRoll, "preroll");
  }, [allAds, startBreak]);

  // ── MidRoll ─────────────────────────────────────────────────
  // Resume/seek vượt qua offset → coi như đã bỏ lỡ, KHÔNG phát dồn.
  useEffect(() => {
    if (!isFreeUser || !allAds?.midRoll?.length) return;
    const v = videoRef.current;
    if (!v) return;

    const keyOf = (ad) => ad.slotId ?? ad.adId;
    const markPassed = () => {
      if (isAdPlayingRef.current) return;
      const t = v.currentTime;
      allAds.midRoll.forEach((ad) => {
        if (ad.midRollOffsetSeconds != null && t >= ad.midRollOffsetSeconds)
          midRollFiredRef.current.add(keyOf(ad));
      });
    };
    const onTime = () => {
      if (isAdPlayingRef.current) return;
      const t = v.currentTime;
      const pending = allAds.midRoll.filter(
        (ad) =>
          ad.midRollOffsetSeconds != null &&
          t >= ad.midRollOffsetSeconds &&
          !midRollFiredRef.current.has(keyOf(ad)),
      );
      if (!pending.length) return;
      pending.forEach((ad) => midRollFiredRef.current.add(keyOf(ad)));
      startBreak(pending, "midroll", t);
    };

    markPassed();
    v.addEventListener("seeked", markPassed);
    v.addEventListener("timeupdate", onTime);
    return () => {
      v.removeEventListener("seeked", markPassed);
      v.removeEventListener("timeupdate", onTime);
    };
  }, [isFreeUser, allAds, startBreak, videoRef]);

  // ── PostRoll: gọi từ onEnded của phim ───────────────────────
  const triggerPostRoll = useCallback(() => {
    if (!isFreeUser || postRollFiredRef.current) return false;
    postRollFiredRef.current = true;
    return startBreak(allAds?.postRoll, "postroll");
  }, [isFreeUser, allAds, startBreak]);

  const skipAd = useCallback(() => {
    if (adSkippable) advance();
  }, [adSkippable, advance]);

  // Sẵn sàng cho user bấm Play: premium, hoặc fetch ads đã kết thúc
  // (thành công / lỗi / rỗng — KHÔNG suy ra từ allAds !== null).
  const adsReady = !isFreeUser || adsFetchDone;

  return {
    isAdPlayingRef,
    currentAd,
    adProgress,
    adTimeLeft,
    adSkippable,
    adSkipCountdown,
    adsReady,
    triggerPostRoll,
    skipAd,
    tryStartPreRoll,
  };
}