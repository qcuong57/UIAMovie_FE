// // src/hooks/useHlsPlayback.js
// // Gắn nguồn phát HLS (Adaptive Bitrate) vào <video> và cung cấp danh sách chất lượng.
// //
// // Cần cài:  npm i hls.js
// //
// // Chiến lược chọn nguồn (theo PlaybackDTO từ BE):
// //   1. Safari/iOS hỗ trợ HLS native  → v.src = hlsUrl (trình duyệt tự ABR, không có menu chất lượng).
// //   2. Trình duyệt có MSE            → dùng hls.js, có menu chọn chất lượng (Auto + từng độ phân giải).
// //   3. Còn lại / HLS lỗi nặng        → rơi về fallbackUrl (MP4 H.264/AAC).
// //
// // Lưu ý quảng cáo: useAdManager swap trực tiếp v.src sang URL quảng cáo. Khi quảng cáo kết thúc
// // (isAd: true → false) hook này gắn lại hls.js và khôi phục vị trí đang xem.

// import { useEffect, useRef, useState, useCallback } from "react";
// import Hls from "hls.js";

// export const QUALITY_AUTO = -1;

// export function useHlsPlayback({ videoRef, hlsUrl, fallbackUrl, isAd = false }) {
//   const hlsRef = useRef(null);
//   const resumeAtRef = useRef(0);
//   const [levels, setLevels] = useState([]); // [{ index, height, label }]
//   const [selectedLevel, setSelectedLevel] = useState(QUALITY_AUTO); // lựa chọn của người dùng
//   const [currentLevel, setCurrentLevel] = useState(QUALITY_AUTO); // level đang phát thực tế (khi Auto)
//   const [usingHls, setUsingHls] = useState(false);
//   const [hlsFailed, setHlsFailed] = useState(false);

//   const nativeHls =
//     typeof document !== "undefined" &&
//     !!document.createElement("video").canPlayType("application/vnd.apple.mpegurl");

//   // URL cuối cùng cho thẻ <video> / useAdManager (contentUrl).
//   // - hls.js: src do MediaSource quản lý → để undefined, hook tự gắn.
//   // - native HLS: dùng thẳng hlsUrl.
//   // - fallback: mp4.
//   const useNative = !!hlsUrl && !hlsFailed && nativeHls;
//   const useHlsJs = !!hlsUrl && !hlsFailed && !nativeHls && Hls.isSupported();
//   const contentUrl = useNative ? hlsUrl : useHlsJs ? null : (fallbackUrl ?? null);

//   const destroyHls = useCallback(() => {
//     if (hlsRef.current) {
//       hlsRef.current.destroy();
//       hlsRef.current = null;
//     }
//   }, []);

//   const attachHlsJs = useCallback(() => {
//     const v = videoRef.current;
//     if (!v || !hlsUrl) return;
//     destroyHls();

//     const hls = new Hls({
//       startPosition: resumeAtRef.current || -1,
//       capLevelToPlayerSize: true,
//       enableWorker: true,
//     });
//     hlsRef.current = hls;

//     hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
//       const list = data.levels
//         .map((l, index) => ({ index, height: l.height, label: l.height ? `${l.height}p` : `${Math.round(l.bitrate / 1000)}k` }))
//         .sort((a, b) => b.height - a.height);
//       setLevels(list);
//       setUsingHls(true);
//     });

//     hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => setCurrentLevel(data.level));

//     hls.on(Hls.Events.ERROR, (_e, data) => {
//       if (!data.fatal) return;
//       if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
//         hls.startLoad(); // thử tải lại
//       } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
//         hls.recoverMediaError();
//       } else {
//         // Lỗi không phục hồi được → rơi về MP4
//         destroyHls();
//         setUsingHls(false);
//         setHlsFailed(true);
//       }
//     });

//     hls.attachMedia(v);
//     hls.loadSource(hlsUrl);
//   }, [videoRef, hlsUrl, destroyHls]);

//   // Gắn / gỡ khi đổi nguồn
//   useEffect(() => {
//     setHlsFailed(false);
//     setLevels([]);
//     setSelectedLevel(QUALITY_AUTO);
//     setCurrentLevel(QUALITY_AUTO);
//     setUsingHls(false);
//     resumeAtRef.current = 0;
//     return destroyHls;
//   }, [hlsUrl, fallbackUrl, destroyHls]);

//   useEffect(() => {
//     if (!useHlsJs || isAd) return;
//     attachHlsJs();
//     return destroyHls;
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [useHlsJs, hlsUrl, isAd]);

//   // Lưu vị trí khi vào quảng cáo, khôi phục khi quay lại nội dung chính
//   useEffect(() => {
//     const v = videoRef.current;
//     if (!v || !useHlsJs) return;
//     if (isAd) {
//       resumeAtRef.current = hlsRef.current?.media ? v.currentTime : resumeAtRef.current;
//       destroyHls();
//     }
//   }, [isAd, useHlsJs, videoRef, destroyHls]);

//   // Áp dụng lựa chọn chất lượng (-1 = Auto/ABR)
//   useEffect(() => {
//     const hls = hlsRef.current;
//     if (!hls) return;
//     // currentLevel = chuyển ngay; -1 bật lại ABR
//     hls.currentLevel = selectedLevel;
//   }, [selectedLevel, usingHls]);

//   const setQuality = useCallback((level) => setSelectedLevel(level), []);

//   const activeHeight =
//     selectedLevel !== QUALITY_AUTO
//       ? levels.find((l) => l.index === selectedLevel)?.height
//       : levels.find((l) => l.index === currentLevel)?.height;

//   return {
//     contentUrl, // truyền cho <video src> và useAdManager.contentUrl
//     isHlsJs: useHlsJs,
//     usingHls: useNative || usingHls,
//     levels, // rỗng nếu native HLS / MP4 (không điều khiển được chất lượng)
//     selectedLevel,
//     setQuality,
//     activeHeight, // chiều cao đang phát (hiển thị cạnh "Tự động")
//   };
// }