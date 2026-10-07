// src/hooks/useHlsSource.js
import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { supportsMse } from "../utils/hls";

const MAX_NET_RETRY = 3;

/**
 * Gắn hls.js vào <video> khi trình duyệt hỗ trợ MSE (ưu tiên hls.js) (Chrome/Firefox/Edge).
 * Safari/iOS phát native nên hook này không làm gì.
 *
 * Trả về { useMse }:
 *   - true  → KHÔNG đặt thuộc tính src trên <video> (hls.js tự gắn blob MediaSource)
 *             và KHÔNG gọi v.load() khi đổi nguồn (sẽ phá MediaSource)
 *   - false → src={url} như bình thường
 *
 * Phối hợp với useAdManager (single-video):
 *   - Ad bắt đầu: hook ad đổi v.src sang ad  → ở đây dừng tải + tháo hls khỏi <video>.
 *   - Ad kết thúc: hook ad đặt v.src = m3u8 + load() (Chrome không phát được) → ở đây
 *     gắn lại hls.js (ghi đè src bằng blob) và startLoad(đúng vị trí). Việc seek về
 *     mainResumeTime + play() vẫn do resumeContent() của useAdManager làm (listener
 *     loadedmetadata), nên hook này không tự seek/play.
 */
export default function useHlsSource({ videoRef, url, isHls, isAd, onFatalError }) {
  const useMse = !!url && !!isHls && supportsMse();

  const hlsRef = useRef(null);
  const errRef = useRef(onFatalError);
  errRef.current = onFatalError;
  const isAdRef = useRef(false);
  isAdRef.current = isAd;
  const lastTimeRef = useRef(0);
  const wasAdRef = useRef(false);

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
      if (isAdRef.current) return;
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR && netRetry < MAX_NET_RETRY) {
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
  }, [url, useMse, videoRef]);

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

  // -1 = tự động (ABR); >=0 = khoá cố định 1 level
  //
  // QUAN TRỌNG: dùng `nextLevel` thay vì `currentLevel` khi ép 1 level cụ thể.
  // `currentLevel = idx` sẽ FLUSH buffer đang phát và load lại ngay tại vị trí
  // hiện tại ở level mới → gây giật/đứng hình 1 nhịp (đây là nguyên nhân chính
  // của hiện tượng lag khi đổi chất lượng).
  // `nextLevel = idx` chỉ áp dụng level mới cho fragment load TIẾP THEO, buffer
  // cũ vẫn phát tiếp bình thường → chuyển mượt, không giật hình.
  // Khi về "Tự động" (idx === -1) thì set `currentLevel = -1` để hls.js lấy lại
  // quyền ABR ngay (không có buffer "sai" để flush nên không gây giật).
  const setLevel = useCallback((idx) => {
    setLevelState(idx);
    const hls = hlsRef.current;
    if (!hls) return;

    if (idx === -1) {
      hls.currentLevel = -1; // trả về ABR tự động
    } else {
      hls.nextLevel = idx; // ép chất lượng, nhưng chuyển mượt không flush buffer
    }
  }, []);

  return { useMse, levels, level, setLevel, autoHeight };
}