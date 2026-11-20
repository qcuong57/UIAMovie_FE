// src/hooks/useSubtitles.js
// Hook phụ đề dùng chung cho MovieVideoPlayer và EpisodeVideoPlayer.
//
// Các lỗi của bản cũ được xử lý ở đây:
//  1. Effect đồng bộ cue chỉ phụ thuộc [cues]; nếu phụ đề mặc định tải xong
//     TRƯỚC khi <video> mount (video chỉ mount sau khi Playback API trả URL)
//     thì videoRef.current = null → listener không bao giờ được gắn → phụ đề
//     không hiện. Nay phụ thuộc thêm `videoMounted`.
//  2. Mỗi lần bật phụ đề đều gọi lại API + parse lại → trễ. Nay cache cue
//     đã parse theo id, bật lại là hiện ngay.
//  3. Tìm cue bằng Array.find (O(n)) trên mỗi timeupdate → nay dùng binary search.
//  4. Lắng nghe thêm `seeked` để tua xong phụ đề cập nhật ngay, không chờ timeupdate.
//  5. Bỏ qua cập nhật khi đang phát quảng cáo (cùng <video>) để khỏi re-render vô ích.

import { useState, useEffect, useRef } from "react";

// BE có thể trả status dạng số (0/1/2) hoặc chuỗi ("Ready"/"Processing"/"Failed").
const STATUS = { ready: 0, processing: 1, failed: 2 };
const isReady = (status) =>
  (typeof status === "string" ? STATUS[status.toLowerCase()] : status) ===
  STATUS.ready;

const EMPTY = [];

const timeToSec = (t) => {
  const parts = t.replace(",", ".").split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
};

/** VTT / SRT → [{ start, end, text }] đã sắp xếp theo start. */
export function parseCues(raw) {
  if (!raw) return EMPTY;
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const cues = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    i++;
    if (!line.includes("-->")) continue;

    const [startRaw, endRaw] = line
      .split("-->")
      .map((s) => s.trim().split(" ")[0]);
    const textLines = [];
    while (i < lines.length && lines[i].trim() !== "") {
      textLines.push(lines[i].trim());
      i++;
    }
    const text = textLines
      .join("\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\{[^}]+\}/g, "");
    if (text) cues.push({ start: timeToSec(startRaw), end: timeToSec(endRaw), text });
  }
  return cues.sort((a, b) => a.start - b.start);
}

/** Binary search: cue cuối có start <= t, rồi lùi vài bước để xử lý cue chồng nhau. */
export function findCue(cues, t) {
  let lo = 0;
  let hi = cues.length - 1;
  let idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid].start <= t) {
      idx = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  for (let k = idx; k >= 0 && k > idx - 4; k--) {
    if (t < cues[k].end) return cues[k];
  }
  return null;
}

/**
 * @param {object}  opts
 * @param {{getSubtitles: Function, getSubtitleContent: Function}} opts.service
 * @param {string|null} opts.ownerId        movie.id | episode.id
 * @param {React.RefObject} opts.videoRef
 * @param {boolean} opts.videoMounted       true khi <video> đã có trong DOM
 * @param {React.RefObject} [opts.isAdPlayingRef]
 */
export default function useSubtitles({
  service,
  ownerId,
  videoRef,
  videoMounted,
  isAdPlayingRef,
}) {
  const [subtitles, setSubtitles] = useState(EMPTY);
  const [selSubId, setSelSubId] = useState(null); // null = tắt
  const [cues, setCues] = useState(EMPTY);
  const [activeCue, setActiveCue] = useState(null);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef(new Map()); // subtitleId → cues đã parse

  // Danh sách phụ đề (chỉ Ready) + chọn mặc định
  useEffect(() => {
    cacheRef.current.clear();
    setSubtitles(EMPTY);
    setSelSubId(null);
    if (!ownerId) return;

    let cancelled = false;
    service
      .getSubtitles(ownerId)
      .then((data) => {
        if (cancelled) return;
        const ready = (Array.isArray(data) ? data : []).filter((s) =>
          isReady(s.status),
        );
        setSubtitles(ready);
        setSelSubId(ready.find((s) => s.isDefault)?.id ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [service, ownerId]);

  // Nội dung phụ đề đang chọn (có cache)
  useEffect(() => {
    if (!selSubId) {
      setCues(EMPTY);
      setLoading(false);
      return;
    }
    const cached = cacheRef.current.get(selSubId);
    if (cached) {
      setCues(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    service
      .getSubtitleContent(ownerId, selSubId)
      .then((dto) => {
        const parsed = parseCues(dto?.content ?? "");
        cacheRef.current.set(selSubId, parsed);
        if (!cancelled) setCues(parsed);
      })
      .catch(() => {
        if (!cancelled) setCues(EMPTY);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [service, ownerId, selSubId]);

  // Đồng bộ cue đang hiển thị với currentTime
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !cues.length) {
      setActiveCue(null);
      return;
    }
    const sync = () => {
      if (isAdPlayingRef?.current) return;
      const next = findCue(cues, v.currentTime);
      setActiveCue((prev) => (prev === next ? prev : next));
    };
    sync(); // hiện ngay, không chờ timeupdate đầu tiên
    v.addEventListener("timeupdate", sync);
    v.addEventListener("seeked", sync);
    return () => {
      v.removeEventListener("timeupdate", sync);
      v.removeEventListener("seeked", sync);
    };
  }, [cues, videoRef, videoMounted, isAdPlayingRef]);

  return {
    subtitles,
    selSubId,
    selectSubtitle: setSelSubId,
    activeCue,
    loading,
  };
}