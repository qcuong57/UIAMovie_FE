// src/components/movie/shared/review/ReplyForm.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Send,
} from "lucide-react";
import { C } from "../../../context/homeTokens";
import { REPLY_MAX_LEN, getErrMsg } from "./reviewUtils";

// ── ReplyForm — ô nhập gọn, nút gửi nằm trong ô ────────────────────────────
const ReplyForm = ({
  initialText = "",
  placeholder,
  submitLabel = "Gửi",
  autoFocus = false,
  onSubmit,
  onCancel,
}) => {
  const [text, setText] = useState(initialText);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const taRef = useRef(null);
  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [text]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      setText(""); // nếu form còn mounted (form tạo mới) thì clear
    } catch (e) {
      setError(getErrMsg(e, "Không thể gửi trả lời"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div
        className="rv-field"
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 6,
          padding: "5px 5px 5px 14px",
          borderRadius: 20,
        }}
      >
        <textarea
          ref={taRef}
          className="rv-textarea"
          value={text}
          autoFocus={autoFocus}
          rows={1}
          maxLength={REPLY_MAX_LEN}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
          }}
          style={{ fontSize: 13.5, padding: "5px 0" }}
        />
        <button
          type="button"
          className="rv-send"
          disabled={!canSubmit}
          onClick={handleSubmit}
          aria-label={submitLabel}
          title={submitLabel}
        >
          <Send size={14} />
        </button>
      </div>
      {error && (
        <p style={{ fontSize: 12, color: "#f87171", margin: "6px 0 0 14px" }}>
          {error}
        </p>
      )}
      {(onCancel || text.length > REPLY_MAX_LEN * 0.9) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "4px 14px 0",
          }}
        >
          {onCancel && (
            <button type="button" className="rv-link" onClick={onCancel}>
              Hủy
            </button>
          )}
          {text.length > REPLY_MAX_LEN * 0.9 && (
            <span style={{ marginLeft: "auto", fontSize: 11, color: C.accent }}>
              {text.length}/{REPLY_MAX_LEN}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ReplyForm;
