// src/hooks/useAdManager.js
// Hook chứa toàn bộ logic quảng cáo — dùng chung cho
// EpisodeVideoPlayer và MovieVideoPlayer.
//
// KIẾN TRÚC: SINGLE-VIDEO.
//   Ad và nội dung chính (phim/tập phim) phát trên CÙNG MỘT <video>
//   (videoRef truyền vào từ component cha). Hook không tạo video
//   element riêng cho ad — toàn bộ listener (timeupdate, ended...)
//   gắn trực tiếp lên videoRef.current.
//
//   Khi vào ad break: hook lưu lại currentTime của phim, swap
//   v.src = ad.videoUrl, phát ad. Khi ad kết thúc (hoặc bị skip):
//   hook swap v.src lại về contentUrl, seek về đúng currentTime đã
//   lưu (với midroll) rồi resume play.
//
//   isAdPlayingRef cho phép component cha (vd EpisodeVideoPlayer)
//   kiểm tra nhanh trong các listener của riêng nó (onEnded, onPause...)
//   để biết video hiện tại đang là ad hay là nội dung chính, tránh
//   chạy nhầm logic save-progress / next-episode trong lúc ad đang chạy.
//
// Usage:
//   const adManager = useAdManager({
//     isFreeUser,
//     contentType,   // "Episode" | "Movie"
//     contentId,     // episode.id | movie.id
//     parentId,      // tvShow.id  | null (movie không cần)
//     videoRef,      // ref đến <video> chính — DÙNG CHUNG cho cả ad
//     videoReady,    // boolean — true sau khi <video> fire canplay lần đầu
//     contentUrl,    // url phim hiện tại — để hook biết swap lại khi hết ad
//   });
//
//   <AdOverlay adManager={adManager} showControls={show} />
//   // trong onEnded của video chính:
//   if (adManager.isAdPlayingRef.current) return;
//   if (adManager.triggerPostRoll()) return;

import { useState, useEffect, useRef, useCallback } from "react";
import adService from "../services/adService";

/**
 * @param {{
 *   isFreeUser: boolean,
 *   contentType: "Episode" | "Movie",
 *   contentId: number | null,
 *   parentId: number | null,
 *   videoRef: React.RefObject,
 *   videoReady: boolean,
 *   contentUrl: string | null,
 * }} opts
 */
export function useAdManager({
  isFreeUser,
  contentType,
  contentId,
  parentId,
  videoRef,
  videoReady,
  contentUrl,
}) {
  const [allAds, setAllAds] = useState(null); // ContentAdsDTO | null
  const [adQueue, setAdQueue] = useState([]); // AdPlaybackDTO[]
  const [currentAd, setCurrentAd] = useState(null); // AdPlaybackDTO | null
  const [adPhase, setAdPhase] = useState(null); // "preroll"|"midroll"|"postroll"|null
  const [adProgress, setAdProgress] = useState(0); // % 0-100
  const [adTimeLeft, setAdTimeLeft] = useState(0); // giây còn lại
  const [adSkippable, setAdSkippable] = useState(false);
  const [adSkipCountdown, setAdSkipCountdown] = useState(0);

  // true trong suốt thời gian video đang phát ad (kể cả giữa 2 ad liên tiếp
  // trong cùng 1 break) — component cha dùng để bỏ qua logic riêng của nó
  // (vd onEnded, onPause, save-progress) trong lúc ad đang chạy trên cùng videoRef.
  const isAdPlayingRef = useRef(false);

  const midRollFiredRef = useRef(new Set());
  const preRollFiredRef = useRef(false);
  const postRollFiredRef = useRef(false);
  const mainResumeTimeRef = useRef(0); // currentTime của phim lúc bắt đầu midroll
  const contentUrlRef = useRef(contentUrl); // luôn giữ url phim mới nhất, kể cả khi đang ad

  useEffect(() => {
    contentUrlRef.current = contentUrl;
  }, [contentUrl]);

  // ── Fetch ads khi content thay đổi ──────────────────────────
  useEffect(() => {
    if (!isFreeUser || !contentId) {
      setAllAds(null);
      midRollFiredRef.current = new Set();
      preRollFiredRef.current = false;
      postRollFiredRef.current = false;
      return;
    }
    // Reset flags TRƯỚC khi fetch để tránh race condition
    midRollFiredRef.current = new Set();
    preRollFiredRef.current = false;
    postRollFiredRef.current = false;
    setAllAds(null);

    adService
      .getAdsForContent(contentType, contentId, parentId)
      .then((data) => setAllAds(data))
      .catch(() => setAllAds(null));
  }, [isFreeUser, contentType, contentId, parentId]);

  // ── Phát 1 ad cụ thể trên videoRef (swap src + state) ───────
  const playAdOnVideo = useCallback(
    (ad) => {
      const v = videoRef.current;
      if (!v || !ad?.videoUrl) return false;
      isAdPlayingRef.current = true;
      setCurrentAd(ad);
      setAdProgress(0);
      setAdTimeLeft(ad.durationSeconds ?? 0);
      setAdSkippable(false);
      setAdSkipCountdown(ad.skipAfterSeconds ?? 0);

      v.pause();
      v.src = ad.videoUrl;
      v.currentTime = 0;
      v.load();
      const tryPlay = () => v.play().catch(() => {});
      if (v.readyState >= 2) {
        tryPlay();
      } else {
        const onReady = () => {
          tryPlay();
          v.removeEventListener("loadedmetadata", onReady);
        };
        v.addEventListener("loadedmetadata", onReady);
      }
      return true;
    },
    [videoRef],
  );

  // ── Bắt đầu 1 ad break từ 1 queue ────────────────────────────
  const playNextAd = useCallback(
    (queue, phase) => {
      if (!queue?.length) return false;
      const [ad, ...remaining] = queue;
      setAdQueue(remaining);
      setAdPhase(phase);
      return playAdOnVideo(ad);
    },
    [playAdOnVideo],
  );

  // ── Quay lại phát nội dung chính sau khi hết ad break ───────
  const resumeContent = useCallback(
    (phaseEnded) => {
      const v = videoRef.current;
      isAdPlayingRef.current = false;
      setCurrentAd(null);
      setAdPhase(null);
      setAdProgress(0);
      setAdTimeLeft(0);
      setAdSkippable(false);
      setAdSkipCountdown(0);
      if (!v) return;

      const url = contentUrlRef.current;
      if (url) v.src = url;
      v.load();
      const onReady = () => {
        if (phaseEnded === "midroll") {
          v.currentTime = mainResumeTimeRef.current;
        }
        v.play().catch(() => {});
        v.removeEventListener("loadedmetadata", onReady);
      };
      v.addEventListener("loadedmetadata", onReady);
    },
    [videoRef],
  );

  // ── Khi 1 ad video kết thúc (hoặc bị skip) ──────────────────
  // Dùng functional update để luôn đọc adQueue mới nhất, tránh stale
  // closure giữa nhiều ad liên tiếp trong cùng 1 break.
  const advanceQueueRef = useRef(null);
  advanceQueueRef.current = () => {
    setAdQueue((prev) => {
      if (prev.length > 0) {
        const [next, ...rest] = prev;
        playAdOnVideo(next);
        return rest;
      }
      // Hết queue → kết thúc ad break, quay lại phim
      setAdPhase((phase) => {
        resumeContent(phase);
        return null;
      });
      return prev;
    });
  };
  const onAdEnded = useCallback(() => {
    advanceQueueRef.current?.();
  }, []);

  // ── Listener gắn trên videoRef khi đang ở chế độ ad ─────────
  // Bật/tắt theo currentAd nên không xung đột với listener của component
  // cha (vốn cũng lắng nghe các event này trên cùng videoRef) — component
  // cha tự bỏ qua nhờ isAdPlayingRef.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !currentAd) return;

    const onTime = () => {
      const dur = currentAd.durationSeconds || v.duration || 1;
      const elapsed = v.currentTime;
      setAdProgress(Math.min(100, (elapsed / dur) * 100));
      setAdTimeLeft(Math.max(0, Math.ceil(dur - elapsed)));
      if (currentAd.skipAfterSeconds != null) {
        const countdown = Math.max(
          0,
          Math.ceil(currentAd.skipAfterSeconds - elapsed),
        );
        setAdSkipCountdown(countdown);
        if (elapsed >= currentAd.skipAfterSeconds) setAdSkippable(true);
      }
    };

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onAdEnded);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onAdEnded);
    };
  }, [currentAd, onAdEnded, videoRef]);

  // ── PreRoll: KHÔNG tự động trigger qua useEffect ────────────
  // LƯU Ý QUAN TRỌNG (iOS Safari): video.play() chỉ được phép chạy mà
  // không bị chặn khi nó nằm trong cùng call stack đồng bộ với 1 user
  // gesture thật (click/tap). Nếu preroll tự bắn ra từ useEffect (phản
  // ứng theo videoReady) mà không có gesture nào, Safari/iOS sẽ reject
  // play() ÂM THẦM (không throw lỗi rõ ràng) — video/ad kẹt cứng, không
  // phát được gì, dù Chrome desktop vẫn chạy bình thường (policy autoplay
  // của desktop khoan dung hơn).
  //
  // Thay vào đó, component cha PHẢI gọi tryStartPreRoll() ngay bên trong
  // handler của lần tap Play đầu tiên (vd onClick nút Play / onClick video)
  // — KHÔNG qua setTimeout/Promise.then/useEffect — để play() của ad vẫn
  // còn nằm trong cùng "user activation" của cú tap đó.
  //
  // Trả về true nếu đã bắt đầu phát 1 ad break (component cha không cần
  // tự gọi v.play() cho content nữa — playAdOnVideo đã swap src + play()).
  // Trả về false nếu không có preroll (hoặc đã fire rồi) — component cha
  // tự gọi v.play() cho content như bình thường.
  const tryStartPreRoll = useCallback(() => {
    if (preRollFiredRef.current) return false;
    // allAds chưa load kịp lúc user tap (fetch ads thường rất nhanh so với
    // thời gian user chờ video buffer, nhưng vẫn có thể race) — chấp nhận
    // bỏ qua preroll cho lượt xem này thay vì giữ video treo chờ, vì chờ
    // rồi tự động play() sau đó lại quay về đúng vấn đề autoplay-without-
    // gesture ban đầu.
    if (!allAds?.preRoll?.length) {
      preRollFiredRef.current = true;
      return false;
    }
    preRollFiredRef.current = true;
    mainResumeTimeRef.current = 0;
    return playNextAd([...allAds.preRoll], "preroll");
  }, [allAds, playNextAd]);

  // ── MidRoll: check khi video chính đang chạy ────────────────
  // BUG FIX: trước đây chỉ check `currentTime >= offsetSeconds` trên mỗi
  // timeupdate. Khi resume phim từ WatchHistory (hoặc user tua/seek), v.currentTime
  // có thể NHẢY THẲNG tới 1 vị trí đã vượt qua offset của midroll (vd offset=300s
  // nhưng resume ở giây 600) → timeupdate đầu tiên sau resume thấy t >= 300 và
  // phát ad NGAY LẬP TỨC, trông như midroll bị phát ở đầu video.
  // Fix: mỗi khi currentTime "nhảy" (mount lần đầu hoặc seeked — bao gồm cả
  // việc hook resume set currentTime), các midroll ad có offset đã nằm phía
  // sau vị trí hiện tại được coi là đã "bỏ lỡ" trong lượt xem này → đánh dấu
  // fired luôn (skip), KHÔNG phát, thay vì phát dồn. Ad chỉ thực sự phát khi
  // video tiến tới offset của nó một cách tự nhiên trong lúc đang xem.
  useEffect(() => {
    if (!isFreeUser || !allAds?.midRoll?.length) return;
    const v = videoRef.current;
    if (!v) return;

    const markPassedAds = (t) => {
      allAds.midRoll.forEach((ad) => {
        if (
          ad.midRollOffsetSeconds != null &&
          t >= ad.midRollOffsetSeconds &&
          !midRollFiredRef.current.has(ad.scheduleId)
        ) {
          midRollFiredRef.current.add(ad.scheduleId);
        }
      });
    };
    // Vị trí hiện tại lúc effect này gắn vào (vd 0 nếu chưa resume)
    markPassedAds(v.currentTime);
    // Resume (set currentTime trong onCanPlay) hoặc user tua tay đều bắn "seeked"
    const onSeeked = () => markPassedAds(v.currentTime);

    const onTime = () => {
      if (isAdPlayingRef.current) return;
      const t = v.currentTime;
      const pending = allAds.midRoll.filter(
        (ad) =>
          !midRollFiredRef.current.has(ad.scheduleId) &&
          ad.midRollOffsetSeconds != null &&
          t >= ad.midRollOffsetSeconds,
      );
      if (!pending.length) return;
      pending.forEach((ad) => midRollFiredRef.current.add(ad.scheduleId));
      mainResumeTimeRef.current = v.currentTime;
      playNextAd([...pending], "midroll");
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("seeked", onSeeked);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("seeked", onSeeked);
    };
  }, [isFreeUser, allAds, playNextAd, videoRef]);

  // ── PostRoll reset khi content đổi ──────────────────────────
  useEffect(() => {
    postRollFiredRef.current = false;
  }, [contentId]);

  // ── triggerPostRoll — gọi từ onEnded của video chính ────────
  const triggerPostRoll = useCallback(() => {
    if (!isFreeUser || !allAds?.postRoll?.length) return false;
    if (postRollFiredRef.current) return false;
    postRollFiredRef.current = true;
    mainResumeTimeRef.current = 0;
    return playNextAd([...allAds.postRoll], "postroll");
  }, [isFreeUser, allAds, playNextAd]);

  // ── Skip ad hiện tại ─────────────────────────────────────────
  const skipAd = useCallback(() => {
    if (!adSkippable) return;
    advanceQueueRef.current?.();
  }, [adSkippable]);

  return {
    // refs
    isAdPlayingRef,
    // state (chỉ đọc từ bên ngoài)
    currentAd,
    adPhase,
    adProgress,
    adTimeLeft,
    adSkippable,
    adSkipCountdown,
    // actions
    triggerPostRoll,
    skipAd,
    tryStartPreRoll,
  };
}