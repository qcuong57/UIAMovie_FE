// src/components/movie/shared/review/ReviewForm.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Tv,
} from "lucide-react";
import reviewService from "../../../services/reviewService";
import { C, FONT_TITLE } from "../../../context/homeTokens";
import { userInfo, epLabelOf } from "./reviewUtils";
import AvatarCircle from "./AvatarCircle";
import StarPicker from "./StarPicker";
import EpisodeSelector from "./EpisodeSelector";

// ── ReviewForm — ô soạn: thu gọn như ô "bạn đang nghĩ gì" ──────────────────
// contentType: 'movie' | 'tvshow'
// reviewMode (TV show only): 'show' | 'episode'
// activeEpisodeId: nếu có, lock thẳng vào tập đó (không cần chọn)
const ReviewForm = ({
  movieId,
  tvShowId,
  contentType,
  reviewMode,
  episodes,
  existing,
  onSuccess,
  onCancel,
  activeEpisodeId,
  currentUser,
}) => {
  const [rating, setRating] = useState(existing?.rating || 0);
  const [text, setText] = useState(existing?.reviewText || "");
  const [isSpoiler, setIsSpoiler] = useState(existing?.isSpoiler || false);
  const [focused, setFocused] = useState(false);
  // Dùng ref để luôn có episodeId mới nhất khi submit (tránh stale state)
  const activeEpIdRef = React.useRef(activeEpisodeId);
  const [episodeId, setEpisodeId] = useState(
    existing?.episodeId || activeEpisodeId || null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const isEdit = !!existing;
  const MAX = 5000;
  const me = userInfo(currentUser);

  // Sync episodeId khi activeEpisodeId prop thay đổi (user đổi tập)
  React.useEffect(() => {
    if (activeEpisodeId && activeEpisodeId !== activeEpIdRef.current) {
      activeEpIdRef.current = activeEpisodeId;
      setEpisodeId(activeEpisodeId);
    }
  }, [activeEpisodeId]);

  // Lock episode khi: đang edit (review cũ có episodeId) HOẶC activeEpisodeId được truyền vào
  const lockedEpisode = (isEdit && !!existing?.episodeId) || !!activeEpisodeId;
  const needsEpisodePick = reviewMode === "episode" && !lockedEpisode;
  const expanded =
    isEdit || focused || rating > 0 || text.length > 0 || needsEpisodePick;

  const prompt =
    reviewMode === "episode"
      ? "Bạn thấy tập này thế nào?"
      : contentType === "movie"
        ? "Bạn thấy bộ phim này thế nào?"
        : "Bạn thấy series này thế nào?";

  const handleCancel = () => {
    if (onCancel) return onCancel();
    setFocused(false);
    setRating(0);
    setText("");
    setIsSpoiler(false);
    setError(null);
  };

  const handleSubmit = async () => {
    // Dùng activeEpisodeId trực tiếp nếu có (luôn fresh từ prop), fallback về state episodeId
    const submitEpisodeId = activeEpisodeId || episodeId;
    if (rating < 1) {
      setError("Vui lòng chọn điểm");
      return;
    }
    if (reviewMode === "episode" && !submitEpisodeId) {
      setError("Vui lòng chọn tập");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit) {
        await reviewService.updateReview(existing.id, {
          rating,
          reviewText: text || null,
          isSpoiler,
        });
      } else if (contentType === "movie") {
        await reviewService.createReview({
          movieId,
          rating,
          reviewText: text || null,
          isSpoiler,
        });
      } else if (reviewMode === "episode") {
        await reviewService.createReview({
          tvShowId,
          episodeId: submitEpisodeId,
          rating,
          reviewText: text || null,
          isSpoiler,
        });
      } else {
        await reviewService.createReview({
          tvShowId,
          rating,
          reviewText: text || null,
          isSpoiler,
        });
      }
      if (!isEdit) {
        // Cho phép đăng tiếp: dọn ô soạn sau khi đăng thành công
        setRating(0);
        setText("");
        setIsSpoiler(false);
        setFocused(false);
      }
      onSuccess(isEdit);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data ||
        e.message ||
        "Có lỗi xảy ra";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const lockedLabel =
    existing?.episodeLabel ||
    (() => {
      const ep = (episodes || []).find((e) => e.id === activeEpisodeId);
      return ep ? epLabelOf(ep) : "Tập đang xem";
    })();

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      style={{ display: "flex", gap: 12 }}
    >
      <AvatarCircle name={me.name} avatarUrl={me.avatar} size={40} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {isEdit && (
          <p
            style={{
              fontFamily: FONT_TITLE,
              fontSize: 14,
              fontWeight: 700,
              color: C.text,
              margin: "0 0 10px",
              lineHeight: "40px",
              height: 40,
              marginTop: -6,
            }}
          >
            Chỉnh sửa đánh giá
          </p>
        )}

        {needsEpisodePick && episodes?.length > 0 && (
          <EpisodeSelector
            episodes={episodes}
            selectedId={episodeId}
            onSelect={setEpisodeId}
          />
        )}

        {lockedEpisode && (existing?.episodeLabel || activeEpisodeId) && (
          <p
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 10,
              fontSize: 13,
              color: C.textSub,
            }}
          >
            <Tv size={13} /> {lockedLabel}
          </p>
        )}

        {!expanded ? (
          <button
            type="button"
            className="rv-field rv-fake"
            onClick={() => setFocused(true)}
          >
            {prompt}
          </button>
        ) : (
          <div
            className="rv-field"
            style={{ borderRadius: 16, padding: "14px 16px 12px" }}
          >
            <StarPicker value={rating} onChange={setRating} />

            <textarea
              className="rv-textarea"
              value={text}
              autoFocus={focused && !isEdit}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  (e.ctrlKey || e.metaKey) &&
                  !submitting &&
                  rating >= 1
                )
                  handleSubmit();
              }}
              maxLength={MAX}
              rows={3}
              aria-label="Nhận xét"
              placeholder={
                reviewMode === "episode" && !episodeId
                  ? "Chọn tập trước rồi viết nhận xét"
                  : "Viết nhận xét (không bắt buộc)"
              }
              style={{ fontSize: 14.5, marginTop: 10, minHeight: 72 }}
            />

            {error && (
              <p
                role="alert"
                style={{ fontSize: 13, color: "#f87171", margin: "4px 0 8px" }}
              >
                {error}
              </p>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 6,
              }}
            >
              <button
                type="button"
                className="rv-chip"
                aria-pressed={isSpoiler}
                onClick={() => setIsSpoiler((v) => !v)}
              >
                Có spoiler
              </button>
              <span
                style={{ marginLeft: "auto", fontSize: 12, color: C.accent }}
              >
                {text.length > MAX * 0.9 ? `${text.length}/${MAX}` : ""}
              </span>
              {(onCancel || !needsEpisodePick) && (
                <button
                  type="button"
                  className="rv-link"
                  onClick={handleCancel}
                >
                  Hủy
                </button>
              )}
              <button
                type="button"
                className="rv-primary"
                onClick={handleSubmit}
                disabled={submitting || rating < 1}
              >
                {submitting ? "Đang gửi..." : isEdit ? "Lưu thay đổi" : "Đăng"}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ReviewForm;