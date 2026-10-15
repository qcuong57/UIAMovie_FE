// src/hooks/useHlsSource.js
import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { shouldUseMse, isHlsUrl } from "../utils/hls";

const MAX_NET_RETRY = 3;
// CDN từ chối link (đổi public_id, mất quyền...) → retry vô ích, cần xin link mới
const REJECTED_STATUS = new Set([401, 403, 404]);

/**
 * Gắn hls.js vào <video> khi trình duyệt hỗ trợ MSE (ưu tiên hls.js) (Chrome/Firefox/Edge/Android).
 * Safari/iOS phát native: hls.js không chạy, nhưng hook vẫn tự đọc master playlist để có
 * danh sách chất lượng (xem effect 4) và đổi chất lượng bằng cách đổi v.src.
 *
 * Trả về { useMse }:
 *   - true  → KHÔNG đặt thuộc tính src trên <video> (hls.js tự gắn blob MediaSource)
 *             và KHÔNG gọi v.load() khi đổi nguồn (sẽ phá MediaSource)
 *   - false → src={url} như bình thường
 *
 * Link bị CDN từ chối (401/403/404): gọi onLinkRejected(). Nếu callback trả true (đang xin
 * link mới) thì hls dừng tải; khi `nonce` đổi, hls.js được khởi tạo lại.
 *
 * Phối hợp với useAdManager (single-video):
 *   - Ad bắt đầu: hook ad đổi v.src sang ad  → ở đây dừng tải + tháo hls khỏi <video>.
 *   - Ad kết thúc: hook ad đặt v.src = m3u8 + load() (Chrome không phát được) → ở đây
 *     gắn lại hls.js (ghi đè src bằng blob) và startLoad(đúng vị trí). Việc seek về
 *     mainResumeTime + play() vẫn do resumeContent() của useAdManager làm (listener
 *     loadedmetadata), nên hook này không tự seek/play.
 */
export default function useHlsSource({
  videoRef,
  url,
  isHls,
  isAd,
  adPlayingRef,
  onFatalError,
  onLinkRejected, // () => boolean — true nếu đã nhận xử lý (đang xin link mới)
  nonce = 0, // đổi giá trị → khởi tạo lại hls.js dù url không đổi
}) {
  const useMse = shouldUseMse(url, isHls);

  const hlsRef = useRef(null);
  const errRef = useRef(onFatalError);
  errRef.current = onFatalError;
  const rejectedRef = useRef(onLinkRejected);
  rejectedRef.current = onLinkRejected;
  const isAdRef = useRef(false);
  isAdRef.current = isAd;
  const lastTimeRef = useRef(0);
  const wasAdRef = useRef(false);
  // Native HLS (iOS): { master: url, uris: Map<levelIndex, playlistUrl> }
  const nativeRef = useRef(null);

  // Chất lượng: levels = [{ index, height, bitrate }] giảm dần; level = -1 (Tự động) hoặc index
  const [levels, setLevels] = useState([]);
  const [level, setLevelState] = useState(-1);
  const [autoHeight, setAutoHeight] = useState(null); // độ phân giải đang chạy khi ở chế độ Tự động

  // 1) Khởi tạo hls.js cho nguồn hiện tại (đồng bộ → play() trước khi manifest tải xong vẫn được xếp hàng)
  useEffect(() => {
    if (!useMse) return;
    const v = videoRef.current;
    if (!v) return;

    if (!Hls.isSupported()) {
      errRef.current?.({
        code: "HLS_UNSUPPORTED",
        message: "Trình duyệt không hỗ trợ phát HLS (MSE).",
        src: url,
      });
      return;
    }

    let netRetry = 0;
    lastTimeRef.current = 0;
    setLevels([]);
    setLevelState(-1);
    const hls = new Hls({
      enableWorker: true,
      maxBufferLength: 30,
      // Ước lượng băng thông ban đầu hợp lý hơn (tránh ABR nhảy loạn lúc mới vào)
      abrEwmaDefaultEstimate: 500000,
      // Dung sai lỗ hổng buffer nhỏ, tránh stall vô cớ khi có gap nhỏ giữa fragment
      maxBufferHole: 0.5,
      fragLoadingMaxRetry: 4,
    });
    hlsRef.current = hls;

    hls.on(Hls.Events.ERROR, (_e, data) => {
      if (!data.fatal) return;
      // Đang ad: <video> đang phát file của ad, đừng để hls "cứu" và giành lại element.
      // adPlayingRef đổi đồng bộ (không chờ render) → không bị race lúc vừa swap sang ad
      if (isAdRef.current || adPlayingRef?.current) return;

      const isNetworkError = data.type === Hls.ErrorTypes.NETWORK_ERROR;

      // Link bị từ chối → ngừng tải, chờ link mới (hls được khởi tạo lại khi nonce/url đổi)
      if (isNetworkError && REJECTED_STATUS.has(data.response?.code) && rejectedRef.current?.()) {
        hls.stopLoad();
        return;
      }

      if (isNetworkError && netRetry < MAX_NET_RETRY) {
        netRetry += 1;
        hls.startLoad();
      } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hls.recoverMediaError();
      } else {
        hls.destroy();
        errRef.current?.({
          code: `HLS_${data.type}`,
          message: `Lỗi phát HLS: ${data.details}`,
          src: url,
        });
      }
    });

    hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
      const list = data.levels
        .map((l, index) => ({ index, height: l.height || 0, bitrate: l.bitrate || 0 }))
        .sort((a, b) => b.height - a.height || b.bitrate - a.bitrate);
      setLevels(list);
      setLevelState(-1);
    });
    hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
      setAutoHeight(hls.levels[data.level]?.height || null);
    });

    hls.loadSource(url);
    hls.attachMedia(v);

    return () => {
      hlsRef.current = null;
      hls.destroy();
    };
    // adPlayingRef là ref ổn định, không cần đưa vào deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, useMse, videoRef, nonce]);

  // 2) Nhớ vị trí nội dung (không ghi khi đang ad)
  useEffect(() => {
    if (!useMse) return;
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      if (isAdRef.current) return;
      lastTimeRef.current = v.currentTime || 0;
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [useMse, url, videoRef]);

  // 3) Ad bắt đầu → tháo hls; ad kết thúc → gắn lại
  useEffect(() => {
    if (!useMse) return;
    const hls = hlsRef.current;
    const v = videoRef.current;
    if (!hls || !v) return;

    if (isAd) {
      wasAdRef.current = true;
      hls.stopLoad();
      hls.detachMedia(); // chỉ xoá src nếu src là blob của chính nó → không đụng tới file ad
      return;
    }
    if (!wasAdRef.current) return;
    wasAdRef.current = false;

    hls.attachMedia(v); // ghi đè src m3u8 mà resumeContent() vừa đặt
    hls.startLoad(lastTimeRef.current);
  }, [isAd, useMse, videoRef]);

  // 4) Native HLS (iOS/Safari): hls.js không chạy → tự đọc master playlist để có menu chất lượng.
  //    Lỗi CORS/mạng/không phải master playlist → levels rỗng → menu chỉ còn "Tốc độ phát".
  useEffect(() => {
    nativeRef.current = null;
    if (useMse || !url || !(isHls ?? isHlsUrl(url))) return;
    let cancelled = false;
    setLevels([]);
    setLevelState(-1);
    setAutoHeight(null);

    fetch(url)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((txt) => {
        if (cancelled) return;
        const lines = txt.split(/\r?\n/);
        const found = [];
        for (let i = 0; i < lines.length; i++) {
          if (!lines[i].startsWith("#EXT-X-STREAM-INF")) continue;
          const bitrate = +(/BANDWIDTH=(\d+)/.exec(lines[i])?.[1] || 0);
          const height = +(/RESOLUTION=\d+x(\d+)/.exec(lines[i])?.[1] || 0);
          let j = i + 1;
          while (j < lines.length && (!lines[j].trim() || lines[j].startsWith("#"))) j++;
          if (lines[j]) {
            found.push({ height, bitrate, uri: new URL(lines[j].trim(), url).href });
          }
        }
        found.sort((a, b) => b.height - a.height || b.bitrate - a.bitrate);
        const uris = new Map();
        const list = found.map((f, index) => {
          uris.set(index, f.uri);
          return { index, height: f.height, bitrate: f.bitrate };
        });
        nativeRef.current = { master: url, uris };
        setLevels(list);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      nativeRef.current = null;
    };
  }, [url, isHls, useMse, nonce]);

  // Native: sau quảng cáo, resumeContent() đặt lại src = master → quay về "Tự động"
  useEffect(() => {
    if (!useMse && !isAd) setLevelState(-1);
  }, [isAd, useMse]);

  // -1 = tự động (ABR); >=0 = khoá cố định 1 level
  //
  // MSE: dùng `nextLevel` thay vì `currentLevel` khi ép 1 level cụ thể.
  // `currentLevel = idx` sẽ FLUSH buffer đang phát và load lại ngay tại vị trí
  // hiện tại ở level mới → gây giật/đứng hình 1 nhịp.
  // `nextLevel = idx` chỉ áp dụng level mới cho fragment load TIẾP THEO → chuyển mượt.
  // Về "Tự động" (idx === -1) thì set `currentLevel = -1` để hls.js lấy lại quyền ABR.
  //
  // Native (iOS): Safari không cho JS chọn level → đổi v.src sang playlist của level đó,
  // giữ lại vị trí và trạng thái phát.
  const setLevel = useCallback(
    (idx) => {
      setLevelState(idx);

      const nat = nativeRef.current;
      if (nat) {
        const v = videoRef.current;
        const target = idx === -1 ? nat.master : nat.uris.get(idx);
        if (!v || !target || isAdRef.current) return;
        const t = v.currentTime;
        const wasPlaying = !v.paused;
        v.addEventListener(
          "loadedmetadata",
          () => {
            v.currentTime = t;
            if (wasPlaying) v.play().catch(() => {});
          },
          { once: true },
        );
        v.src = target;
        v.load();
        return;
      }

      const hls = hlsRef.current;
      if (!hls) return;
      if (idx === -1) {
        hls.currentLevel = -1; // trả về ABR tự động
      } else {
        hls.nextLevel = idx; // ép chất lượng, nhưng chuyển mượt không flush buffer
      }
    },
    [videoRef],
  );

  return { useMse, levels, level, setLevel, autoHeight };
}