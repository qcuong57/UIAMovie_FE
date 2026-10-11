// src/hooks/useResumeOffer.js
// Hỏi server xem user đã xem nội dung này tới đâu (khi KHÔNG có resume từ location.state).
// Trả về số giây đề nghị tiếp tục, 0 = không có gì để hỏi.
import { useEffect, useRef, useState } from "react";

export const resumeLog = (...a) => {
  try { if (localStorage.getItem("debugResume")) console.info("[resume]", ...a); } catch { /* ignore */ }
};

export const MIN_RESUME_SEC = 10; // xem chưa tới 10s → coi như chưa xem, khỏi hỏi
const END_MARGIN_SEC = 30; // còn <30s là hết → không hỏi

export function toResumeSeconds({ seconds, totalSec, completed }, tag = "") {
  const s = Math.floor(Number(seconds) || 0);
  let out = s;
  let reason = "đủ điều kiện → hiện popup";
  if (completed) { out = 0; reason = "bản ghi đã đánh dấu HOÀN THÀNH"; }
  else if (s < MIN_RESUME_SEC) { out = 0; reason = `mới xem ${s}s (< ${MIN_RESUME_SEC}s)`; }
  else if (totalSec > 0 && s >= totalSec - END_MARGIN_SEC) { out = 0; reason = `gần hết phim (${s}s / ${totalSec}s)`; }
  if (tag) resumeLog(tag, { seconds: s, totalSec, completed, reason });
  return out;
}

/**
 * @param {{ enabled: boolean, id: any, load: () => Promise<number> }} p
 *   id đổi → hỏi lại; load trả về số giây (đã qua toResumeSeconds)
 */
export default function useResumeOffer({ enabled, id, load }) {
  const [seconds, setSeconds] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    setSeconds(0);
    resumeLog("bắt đầu hỏi lịch sử", { enabled, id });
    if (!enabled || !id) return;
    let cancelled = false;
    Promise.resolve()
      .then(() => loadRef.current())
      .then((s) => {
        resumeLog("kết quả (giây, 0 = không hỏi):", s);
        if (!cancelled) setSeconds(Number(s) > 0 ? Number(s) : 0);
      })
      .catch((e) => resumeLog("LỖI lấy lịch sử:", e?.response?.status, e?.message)); // chưa đăng nhập / lỗi mạng → phát từ đầu
    return () => {
      cancelled = true;
    };
  }, [enabled, id]);

  return seconds;
}