// src/components/home/sections/shared/useTrailerStage.js
// Máy trạng thái của "phòng chiếu": phim đang chọn, khi nào phát trailer, tự chuyển phim, phím ← →.
//  • `playing` dẫn xuất từ phim đang chọn: đổi phim là về false NGAY trong cùng lần render
//    (nếu để effect tự tắt thì iframe của phim mới mount rồi bị huỷ ngay → YouTube kẹt, trailer thứ 2 trở đi về ảnh nền)
//  • tự phát khi khung video vào màn hình, dừng khi ra khỏi màn hình
//  • Reduce Motion / Data Saver chặn tự phát → người xem tự bấm ▶ (`playManually`)
import { useState, useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';
import { hasTrailer } from '../../components/home/sections/shared/TrailerPlayer';
import { keyOf } from '../../components/home/sections/shared/layoutUtils';
import { dataSaver } from '../../components/home/sections/shared/TrailerControls';

const AUTO_MS = 8000; // phim không có trailer
const START_DELAY = 1800; // chờ ảnh hiện xong rồi mới phát trailer

export function useTrailerStage({ items, reduce, trailerMs }) {
  const n = items.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [playingFor, setPlayingFor] = useState(null); // key phim đã tới lượt phát trailer
  const [manualKey, setManualKey] = useState(null); // người xem tự bấm ▶ cho phim này
  const [playerOn, setPlayerOn] = useState(false); // mobile: player được dựng một lần rồi giữ nguyên
  const lastTrailer = useRef(null);
  const stageRef = useRef(null);
  const stripRef = useRef(null);
  const inView = useInView(stageRef, { amount: 0.35 });

  const safeIndex = Math.min(index, Math.max(0, n - 1));
  const item = items[safeIndex];
  const itemKey = item ? String(keyOf(item)) : '';
  const trailerOk = !!item && hasTrailer(item);
  if (trailerOk) lastTrailer.current = item; // phim không có trailer: giữ player cũ, không dựng lại iframe
  const manual = manualKey === itemKey;
  const autoOk = trailerOk && !reduce && !dataSaver();
  const canPlay = (autoOk || (trailerOk && manual)) && inView;
  const playing = canPlay && playingFor === itemKey;

  // Trailer tự phát sau START_DELAY (bấm tay thì phát ngay); đổi phim / ra khỏi màn hình thì tắt
  useEffect(() => {
    if (!canPlay) return undefined;
    const t = setTimeout(() => { setPlayerOn(true); setPlayingFor(itemKey); }, manual ? 0 : START_DELAY);
    return () => { clearTimeout(t); setPlayingFor(null); };
  }, [itemKey, canPlay, manual]);

  // Giữ thẻ đang chọn ở giữa dải (chỉ cuộn trong dải, không kéo cả trang)
  useEffect(() => {
    const strip = stripRef.current;
    const el = strip?.children?.[safeIndex];
    if (!strip || !el) return;
    strip.scrollTo({ left: el.offsetLeft - (strip.clientWidth - el.clientWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  }, [safeIndex, reduce]);

  const go = (i) => { if (i !== safeIndex) setIndex(i); };
  const next = () => setIndex((safeIndex + 1) % n);
  const prev = () => setIndex((safeIndex - 1 + n) % n);

  const onKeyDown = (e) => {
    if (n < 2) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  };

  return {
    stageRef, stripRef, item, safeIndex, trailerOk, playing, playerOn,
    playerItem: trailerOk ? item : lastTrailer.current,
    autoplay: n > 1 && !reduce,
    duration: trailerOk ? trailerMs : AUTO_MS,
    running: inView && !paused,
    showPlayBtn: trailerOk && !playing && !autoOk, // tự phát bị chặn → cho bấm tay
    setPaused, playManually: () => setManualKey(itemKey),
    go, next, prev, onKeyDown,
  };
}