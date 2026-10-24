// src/hooks/useAdManager.js
// Quảng cáo dùng chung cho MovieVideoPlayer / EpisodeVideoPlayer.
//
// KIẾN TRÚC SINGLE-VIDEO: ad và phim phát trên CÙNG một <video> (videoRef).
// Vào ad break: swap v.src = ad.videoUrl. Hết break: trả nguồn phim, seek về vị trí cũ, play tiếp.
//
// Lịch quảng cáo lấy từ BE (Fixed hoặc Random). Ở chế độ Random BE chia mid-roll theo % của thời lượng
// được gửi lên; hook quy đổi các offset đó sang thời lượng THẬT của video (offset × thật / đã gửi), nên
// video 2 phút hay 2 tiếng đều được chia đúng tỉ lệ dù số gửi lên có lệch.
//   durationSeconds          thời lượng THẬT do <video> báo — ưu tiên
//   fallbackDurationSeconds  số lấy từ DB (server / runtime TMDB) — chỉ dùng nếu chờ quá DURATION_WAIT_MS
//                            mà <video> chưa báo. Số thật về muộn thì CHỈ quy đổi offset, không lấy lại lịch
//                            (tránh bốc ngẫu nhiên lần nữa giữa chừng).
//
// Quy ước với player:
//   (a) gọi tryStartPreRoll() ĐỒNG BỘ trong gesture của lần Play đầu (iOS)
//   (b) bỏ qua logic của phim khi isAdPlayingRef.current === true (canplay/timeupdate/pause/ended)
//   (c) gọi triggerPostRoll() khi phim hết; true = đang phát post-roll
//   (d) đăng ký beforeAdRef.current = () => tháo hls.js, hook gọi nó TRƯỚC khi đổi src sang ad

import { useState, useEffect, useRef, useCallback } from "react";
import adService from "../services/adService";

const FETCH_TIMEOUT_MS = 5000; // quá hạn vẫn mở khoá nút Play
const DURATION_WAIT_MS = 4000; // chờ thời lượng thật (từ <video>) tối đa chừng này rồi mới dùng số dự phòng
const AD_STALL_TIMEOUT_MS = 8000; // ad chưa chạy được giây nào sau mức này = kẹt → bỏ qua
const MIDROLL_LATE_TOLERANCE_SEC = 5; // quá offset hơn mức này = đã bị bỏ lỡ (resume/seek) → không phát

const PHASE = { PRE: "preroll", MID: "midroll", POST: "postroll" };
const keyOf = (ad) => ad.slotId ?? ad.adId;

// Log chẩn đoán: localStorage.setItem("debugAds","1") trong Console rồi tải lại trang.
const log = (...args) => {
  try {
    if (localStorage.getItem("debugAds")) console.info("[ads]", ...args);
  } catch {
    /* ignore */
  }
};

const IDLE_AD_UI = { progress: 0, timeLeft: 0, skippable: false, skipCountdown: 0 };

export function useAdManager({
  isFreeUser,
  contentType, // "Movie" | "Episode"
  contentId,
  parentId, // Episode: id của bộ (để áp override của cả bộ)
  videoRef,
  contentUrl,
  useMse = false, // hls.js đang quản lý nguồn phim
  resumeSeconds = 0, // vị trí resume (seek lại sau pre-roll)
  durationSeconds = 0, // thời lượng THẬT (0 = chưa biết)
  fallbackDurationSeconds = 0, // runtime dự phòng
  onPostRollEnd, // post-roll phát xong (player lưu 100% / hiện next-episode)
}) {
  // ── State (chỉ để render UI) ─────────────────────────────────
  const [allAds, setAllAds] = useState(null); // ContentAdsDTO | null
  const [adsFetchDone, setAdsFetchDone] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const [adUi, setAdUi] = useState(IDLE_AD_UI);
  const [waitedForDuration, setWaitedForDuration] = useState(false);
  const [planDuration, setPlanDuration] = useState(null); // thời lượng đã gửi cho BE (chốt 1 lần); null = đang chờ

  // ── Ref: trạng thái điều khiển, đọc đồng bộ trong listener ───
  const isAdPlayingRef = useRef(false); // true suốt ad break (kể cả giữa 2 ad liên tiếp)
  const queueRef = useRef([]); // các ad còn lại trong break
  const phaseRef = useRef(null);
  const mainResumeTimeRef = useRef(0);
  const allAdsRef = useRef(null);
  const preRollFiredRef = useRef(false);
  const postRollFiredRef = useRef(false);
  const midRollFiredRef = useRef(new Set());
  const beforeAdRef = useRef(null); // core đăng ký: tháo hls.js trước khi swap src sang ad

  // Giá trị mới nhất cho callback ổn định (không phải khai báo từng ref + effect đồng bộ)
  const latest = useRef({});
  latest.current = { contentUrl, useMse, resumeSeconds, onPostRollEnd, realDuration: durationSeconds > 0 };

  // ── Lấy lịch quảng cáo ───────────────────────────────────────
  // Đổi nội dung → reset toàn bộ. Khai báo TRƯỚC effect fetch để chạy trước.
  useEffect(() => {
    preRollFiredRef.current = false;
    postRollFiredRef.current = false;
    midRollFiredRef.current = new Set();
    allAdsRef.current = null;
    setAllAds(null);
    setWaitedForDuration(false);
    setPlanDuration(null);
    // Premium / chưa có content → không cần chờ gì; Free → khoá Play tới khi lấy xong lịch
    setAdsFetchDone(!isFreeUser || !contentId);
    if (!isFreeUser || !contentId) log("bỏ qua, không fetch ads:", { isFreeUser, contentId });
  }, [isFreeUser, contentType, contentId, parentId]);

  // Chưa có thời lượng thật → chờ một chút (từ lúc video có nguồn) rồi mới dùng runtime dự phòng
  useEffect(() => {
    if (!contentUrl || planDuration !== null || durationSeconds > 0 || waitedForDuration) return undefined;
    const timer = setTimeout(() => setWaitedForDuration(true), DURATION_WAIT_MS);
    return () => clearTimeout(timer);
  }, [contentUrl, planDuration, durationSeconds, waitedForDuration]);

  // Chốt thời lượng gửi cho BE đúng 1 lần: số thật nếu đã có, hết thời gian chờ thì dùng số dự phòng
  useEffect(() => {
    if (planDuration !== null) return;
    if (durationSeconds > 0) setPlanDuration(Math.round(durationSeconds));
    else if (waitedForDuration) setPlanDuration(Math.max(0, Math.round(fallbackDurationSeconds)));
  }, [planDuration, durationSeconds, waitedForDuration, fallbackDurationSeconds]);

  // Hệ số quy đổi offset BE (theo thời lượng đã gửi) → thời lượng thật. 1 khi chưa biết số thật hoặc đã khớp.
  const midScale = durationSeconds > 0 && planDuration > 0 ? durationSeconds / planDuration : 1;

  useEffect(() => {
    if (!isFreeUser || !contentId || planDuration === null) return undefined;

    let cancelled = false;
    const safetyTimer = setTimeout(() => !cancelled && setAdsFetchDone(true), FETCH_TIMEOUT_MS);

    adService
      .getAdsForContent(contentType, contentId, planDuration, parentId)
      .then((data) => {
        if (cancelled) return;
        log("đã fetch ads", contentType, contentId, {
          duration: planDuration,
          durationSource: latest.current.realDuration ? "video" : "fallback (DB/TMDB)",
          pre: data?.preRoll?.length,
          mid: data?.midRoll?.length,
          post: data?.postRoll?.length,
          raw: data,
        });
        allAdsRef.current = data;
        setAllAds(data);
      })
      .catch((e) => log("fetch ads LỖI", e?.message, e?.response?.status, e?.code))
      .finally(() => {
        clearTimeout(safetyTimer);
        if (!cancelled) setAdsFetchDone(true);
      });

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
    };
  }, [isFreeUser, contentType, contentId, parentId, planDuration]);

  // ── Phát 1 ad trên videoRef ──────────────────────────────────
  // play() phải gọi đồng bộ ngay sau load() để còn nằm trong user gesture (iOS).
  const playAdOnVideo = useCallback(
    (ad) => {
      const v = videoRef.current;
      if (!v) return false;
      isAdPlayingRef.current = true;
      setCurrentAd(ad);
      setAdUi({
        progress: 0,
        timeLeft: ad.durationSeconds ?? 0,
        skippable: (ad.skipAfterSeconds ?? Infinity) <= 0,
        skipCountdown: ad.skipAfterSeconds ?? 0,
      });

      // MSE: tháo hls.js (đồng bộ) TRƯỚC khi đổi src, nếu không MediaSource còn mở sẽ tranh <video>
      if (latest.current.useMse) beforeAdRef.current?.();

      v.pause();
      v.src = ad.videoUrl;
      v.currentTime = 0;
      v.load();
      log("phát ad", ad.videoUrl);
      v.play().catch((e) => log("ad play() bị từ chối", e?.name, e?.message));
      return true;
    },
    [videoRef],
  );

  const startBreak = useCallback(
    (ads, phase, resumeAt = 0) => {
      const [first, ...rest] = (ads ?? []).filter((a) => a?.videoUrl);
      if (!first) return false;
      queueRef.current = rest;
      phaseRef.current = phase;
      mainResumeTimeRef.current = resumeAt;
      return playAdOnVideo(first);
    },
    [playAdOnVideo],
  );

  // ── Hết break → trả video về phim ────────────────────────────
  const resumeContent = useCallback(() => {
    const v = videoRef.current;
    const phase = phaseRef.current;
    phaseRef.current = null;
    queueRef.current = [];
    isAdPlayingRef.current = false;
    setCurrentAd(null);
    setAdUi(IDLE_AD_UI);
    if (!v) return;

    const { useMse: mse, contentUrl: url, resumeSeconds: resumeAt, onPostRollEnd: onPostEnd } = latest.current;

    // MSE: KHÔNG đặt src m3u8 (Chrome có thể tự phát native song song với hls.js → 2 nguồn tranh nhau);
    // useHlsSource tự attachMedia lại khi isAd = false, và loadedmetadata bên dưới bắn khi stream sẵn sàng.
    // Native (iOS) / MP4: đặt lại src.
    if (!mse) {
      if (url) v.src = url;
      v.load();
    }
    v.addEventListener(
      "loadedmetadata",
      () => {
        if (phase === PHASE.POST) {
          // Phim đã hết từ trước post-roll: đưa về cuối, KHÔNG play lại
          if (Number.isFinite(v.duration)) v.currentTime = v.duration;
          onPostEnd?.();
          return;
        }
        if (phase === PHASE.MID) v.currentTime = mainResumeTimeRef.current;
        else if (phase === PHASE.PRE && resumeAt > 0) v.currentTime = resumeAt; // load() đã đưa về 0
        v.play().catch(() => {});
      },
      { once: true },
    );
  }, [videoRef]);

  // Ad kết thúc / bị skip / lỗi → ad kế tiếp hoặc quay về phim
  const advance = useCallback(() => {
    if (!isAdPlayingRef.current) return;
    const next = queueRef.current.shift();
    if (next) playAdOnVideo(next);
    else resumeContent();
  }, [playAdOnVideo, resumeContent]);

  // ── Listener trên videoRef, chỉ tồn tại khi đang có ad ───────
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !currentAd) return undefined;

    // Trì hoãn 1 tick để listener "ended" của player vẫn thấy isAdPlayingRef = true và bỏ qua
    const advanceLater = () => setTimeout(advance, 0);

    // Ad lỗi ngay lúc nạp (trước khi listener này kịp gắn) → bỏ qua luôn
    if (v.error) {
      log("video ad LỖI code", v.error.code, v.currentSrc);
      advanceLater();
      return undefined;
    }

    const onError = () => {
      log("video ad LỖI code", v.error?.code, v.currentSrc);
      advanceLater();
    };
    const onTime = () => {
      const total = currentAd.durationSeconds || v.duration || 1;
      const elapsed = v.currentTime;
      setAdUi((prev) => {
        const next = {
          ...prev,
          progress: Math.min(100, (elapsed / total) * 100),
          timeLeft: Math.max(0, Math.ceil(total - elapsed)),
        };
        if (currentAd.skipAfterSeconds != null) {
          next.skipCountdown = Math.max(0, Math.ceil(currentAd.skipAfterSeconds - elapsed));
          if (elapsed >= currentAd.skipAfterSeconds) next.skippable = true;
        }
        return next;
      });
    };

    // Watchdog: ad chưa chạy được giây nào sau AD_STALL_TIMEOUT_MS → bỏ qua (không đụng ad đang chạy bình thường)
    const stall = setTimeout(() => {
      if (v.currentTime > 0) return;
      log("ad kẹt, bỏ qua", v.currentSrc, v.readyState);
      advance();
    }, AD_STALL_TIMEOUT_MS);

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", advanceLater);
    v.addEventListener("error", onError);
    return () => {
      clearTimeout(stall);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", advanceLater);
      v.removeEventListener("error", onError);
    };
  }, [currentAd, advance, videoRef]);

  // ── Pre-roll: player gọi đồng bộ trong gesture của lần Play đầu ──
  const tryStartPreRoll = useCallback(() => {
    if (preRollFiredRef.current) return false;
    preRollFiredRef.current = true;
    const ads = allAdsRef.current;
    log("tryStartPreRoll", { adsLoaded: !!ads, count: ads?.preRoll?.length ?? 0 });
    return startBreak(ads?.preRoll, PHASE.PRE);
  }, [startBreak]);

  // ── Mid-roll ─────────────────────────────────────────────────
  // Offset BE chia theo % của `planDuration`; × midScale để ra giây trên video thật.
  // Resume/seek vượt qua offset → coi như đã bỏ lỡ, KHÔNG phát dồn.
  // hasVideo: <video> chỉ mount khi đã có link phát; thiếu dep này listener có thể không bao giờ gắn.
  const hasVideo = !!contentUrl;
  useEffect(() => {
    const midRoll = allAds?.midRoll;
    if (!isFreeUser || !midRoll?.length || !hasVideo) return undefined;
    const v = videoRef.current;
    if (!v) return undefined;

    const atOf = (ad) => (ad.midRollOffsetSeconds == null ? null : ad.midRollOffsetSeconds * midScale);

    const markPassed = () => {
      if (isAdPlayingRef.current) return;
      const t = v.currentTime;
      midRoll.forEach((ad) => {
        const at = atOf(ad);
        if (at != null && t >= at) midRollFiredRef.current.add(keyOf(ad));
      });
    };
    const onTime = () => {
      if (isAdPlayingRef.current || v.seeking) return;
      const t = v.currentTime;
      const due = midRoll.filter((ad) => {
        const at = atOf(ad);
        return at != null && t >= at && !midRollFiredRef.current.has(keyOf(ad));
      });
      if (!due.length) return;
      due.forEach((ad) => midRollFiredRef.current.add(keyOf(ad)));
      // Chỉ phát ad vừa tới; ad đã trôi xa (resume/seek) bị bỏ qua
      const fresh = due.filter((ad) => t - atOf(ad) <= MIDROLL_LATE_TOLERANCE_SEC);
      log("midroll", { t, scale: midScale, due: due.length, fresh: fresh.length });
      if (fresh.length) startBreak(fresh, PHASE.MID, t);
    };

    log("mid-roll (giây trên video thật)", midRoll.map((ad) => Math.round(atOf(ad) ?? -1)));
    markPassed();
    v.addEventListener("seeked", markPassed);
    v.addEventListener("timeupdate", onTime);
    return () => {
      v.removeEventListener("seeked", markPassed);
      v.removeEventListener("timeupdate", onTime);
    };
  }, [isFreeUser, allAds, hasVideo, midScale, startBreak, videoRef]);

  // ── Post-roll: gọi từ onEnded của phim ───────────────────────
  const triggerPostRoll = useCallback(() => {
    if (!isFreeUser || postRollFiredRef.current) return false;
    postRollFiredRef.current = true;
    const ads = allAdsRef.current;
    log("triggerPostRoll", { count: ads?.postRoll?.length ?? 0 });
    return startBreak(ads?.postRoll, PHASE.POST);
  }, [isFreeUser, startBreak]);

  const skipAd = useCallback(() => {
    if (adUi.skippable) advance();
  }, [adUi.skippable, advance]);

  return {
    isAdPlayingRef,
    beforeAdRef,
    currentAd,
    adProgress: adUi.progress,
    adTimeLeft: adUi.timeLeft,
    adSkippable: adUi.skippable,
    adSkipCountdown: adUi.skipCountdown,
    // Sẵn sàng cho user bấm Play: premium, hoặc lịch đã lấy xong (thành công / lỗi / rỗng)
    adsReady: !isFreeUser || adsFetchDone,
    tryStartPreRoll,
    triggerPostRoll,
    skipAd,
  };
}