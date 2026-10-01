// src/components/movie/shared/review/ReviewCard.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Tv,
  MessageCircle,
} from "lucide-react";
import { C } from "../../../context/homeTokens";
import { fmtDateShort, timeAgo } from "./reviewUtils";
import AvatarCircle from "./AvatarCircle";
import OwnerMenu from "./OwnerMenu";
import RepliesPanel from "./RepliesPanel";

// ── ReviewCard — một bài trong feed ────────────────────────────────────────
const ReviewCard = ({
  review,
  currentUser,
  isAdmin,
  onEdit,
  onDelete,
  onToast,
  episodeLabel,
  highlight = false, // true khi mở từ thông báo: cuộn tới, mở sẵn trả lời
}) => {
  const [expanded, setExpanded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  // Khởi tạo từ backend (review.replyCount) để hiện sẵn "N trả lời" khi chưa mở panel
  const [replyCount, setReplyCount] = useState(review.replyCount ?? null);
  const rootRef = useRef(null);
  const currentUserId = currentUser?.id;

  useEffect(() => {
    if (review.replyCount != null) setReplyCount(review.replyCount);
  }, [review.replyCount]);

  useEffect(() => {
    if (!highlight) return;
    setShowReplies(true);
    const t = setTimeout(() => {
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => clearTimeout(t);
  }, [highlight]);
  const isLong = (review.reviewText?.length || 0) > 280;
  const isOwn = !!currentUserId && review.userId === currentUserId;
  const hidden = !!review.isSpoiler && !revealed;

  return (
    <motion.article
      ref={rootRef}
      id={`review-${review.id}`}
      layout="position"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="rv-item"
      style={{
        display: "flex",
        gap: 12,
        padding: "18px 0",
        borderBottom: `1px solid ${C.border}`,
        scrollMarginTop: 88,
        borderRadius: 12,
        outline: `1px solid ${highlight ? C.accent : "transparent"}`,
        outlineOffset: 8,
        transition: "outline-color 0.3s",
      }}
    >
      <AvatarCircle
        name={review.userName}
        avatarUrl={review.userAvatar}
        size={40}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Dòng 1: tên · điểm · menu — Dòng 2: thời gian, tập, spoiler */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minHeight: 28,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: C.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {review.userName || "Ẩn danh"}
          </span>
          {isOwn && <span className="rv-you">Bạn</span>}
          <span
            className="rv-score"
            style={{ marginLeft: "auto" }}
            aria-label={`${review.rating} trên 10 điểm`}
          >
            <Star size={13} style={{ fill: C.gold, color: C.gold }} />
            {review.rating}
            <small>/10</small>
          </span>
          {isOwn && (
            <div style={{ marginRight: -6 }}>
              <OwnerMenu
                onEdit={() => onEdit(review)}
                onDelete={() => onDelete(review)}
              />
            </div>
          )}
        </div>

        <div className="rv-meta">
          <span title={fmtDateShort(review.createdAt)}>
            {timeAgo(review.createdAt)}
            {review.updatedAt ? " · đã chỉnh sửa" : ""}
          </span>
          {episodeLabel && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                color: C.textSub,
              }}
            >
              <Tv size={12} /> {episodeLabel}
            </span>
          )}
          {review.isSpoiler && <span className="rv-spoiler">Spoiler</span>}
        </div>

        {/* Nội dung */}
        {review.reviewText && (
          <div style={{ marginTop: 10 }}>
            <div style={{ position: "relative" }}>
              <p
                aria-hidden={hidden}
                style={{
                  fontSize: 14.5,
                  color: C.textSub,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  display: expanded ? "block" : "-webkit-box",
                  WebkitLineClamp: expanded ? undefined : 4,
                  WebkitBoxOrient: "vertical",
                  overflow: expanded ? "visible" : "hidden",
                  filter: hidden ? "blur(7px)" : "none",
                  userSelect: hidden ? "none" : "auto",
                }}
              >
                {review.reviewText}
              </p>
              {hidden && (
                <button
                  type="button"
                  className="rv-reveal"
                  onClick={() => setRevealed(true)}
                >
                  Có spoiler. Bấm để xem
                </button>
              )}
            </div>
            {isLong && !hidden && (
              <button
                type="button"
                className="rv-link"
                onClick={() => setExpanded((v) => !v)}
                style={{ marginTop: 4 }}
              >
                {expanded ? "Thu gọn" : "Xem thêm"}
              </button>
            )}
          </div>
        )}

        {/* Hành động */}
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            className={`rv-link${showReplies ? " active" : ""}`}
            aria-expanded={showReplies}
            onClick={() => setShowReplies((v) => !v)}
          >
            <MessageCircle size={16} />
            {replyCount > 0 ? `${replyCount} trả lời` : "Trả lời"}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {showReplies && (
            <RepliesPanel
              reviewId={review.id}
              currentUser={currentUser}
              isAdmin={isAdmin}
              onCountChange={setReplyCount}
              onToast={onToast}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
};

export default ReviewCard;