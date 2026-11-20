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

export const REWIND_SEC = 5; // Netflix lùi vài giây khi resume để người xem nhớ lại ngữ cảnh

/** Vị trí bắt đầu phát thật: lùi REWIND_SEC, không âm. */
export const toStartAt = (sec) => (sec > REWIND_SEC ? sec - REWIND_SEC : 0);

/**
 * @param {{ enabled: boolean, id: any, load: () => Promise<number> }} p
 *   id đổi → hỏi lại; load trả về số giây (đã qua toResumeSeconds)
 * @returns {{ seconds: number, loaded: boolean }}
 *   loaded = true khi đã có câu trả lời (hoặc không cần hỏi) → mới nên cho player load,
 *   nếu không player chạy từ 0 rồi 15s sau ghi đè tiến độ cũ.
 */
export default function useResumeOffer({ enabled, id, load }) {
  // Gắn kết quả với id đã hỏi → đổi id thì không dùng nhầm kết quả của nội dung cũ
  const [state, setState] = useState({ id: null, seconds: 0 });
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    resumeLog("bắt đầu hỏi lịch sử", { enabled, id });
    if (!enabled || !id) return undefined;
    let cancelled = false;
    Promise.resolve()
      .then(() => loadRef.current())
      .then((s) => {
        resumeLog("kết quả (giây, 0 = phát từ đầu):", s);
        if (!cancelled) setState({ id, seconds: Number(s) > 0 ? Number(s) : 0 });
      })
      .catch((e) => {
        // chưa đăng nhập / lỗi mạng → phát từ đầu, nhưng vẫn phải mở khoá player
        resumeLog("LỖI lấy lịch sử:", e?.response?.status, e?.message);
        if (!cancelled) setState({ id, seconds: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, id]);

  if (!enabled || !id) return { seconds: 0, loaded: true };
  const ready = state.id === id;
  return { seconds: ready ? state.seconds : 0, loaded: ready };
}