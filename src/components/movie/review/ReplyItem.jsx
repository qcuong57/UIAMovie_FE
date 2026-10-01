// src/components/movie/shared/review/ReplyItem.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C } from "../../../context/homeTokens";
import { fmtDateShort, timeAgo } from "./reviewUtils";
import AvatarCircle from "./AvatarCircle";
import ReplyForm from "./ReplyForm";

// ── ReplyItem — bong bóng bình luận ────────────────────────────────────────
// Lồng tối đa 1 cấp (giống Facebook/YouTube/Instagram/TikTok):
//   • reply gốc  : truyền `childReplies` → hiển thị các reply con thụt vào bên dưới
//   • reply con  : isChild = true → vẫn có nút "Trả lời", nhưng reply mới sẽ
//                  được server gắn về reply gốc kèm @tên (không lồng sâu hơn)
const ReplyItem = ({
  reply,
  childReplies = [],
  isChild = false,
  currentUser,
  currentUserId,
  isAdmin,
  onCreate, // (text, parentReplyId) => Promise
  onUpdate,
  onDelete,
}) => {
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  // Reply con ẩn mặc định, bấm "Xem N phản hồi" mới hiện (giống Facebook/YouTube)
  const [showChildren, setShowChildren] = useState(false);
  const isOwn = !!currentUserId && reply.userId === currentUserId;
  const canDelete = isOwn || isAdmin;
  const canReply = !!currentUser;
  const avatarSize = isChild ? 24 : 28;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: "flex", gap: 10, padding: "6px 0" }}
    >
      <AvatarCircle
        name={reply.userName}
        avatarUrl={reply.userAvatar}
        size={avatarSize}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <ReplyForm
            initialText={reply.replyText}
            submitLabel="Lưu"
            placeholder="Sửa trả lời"
            autoFocus
            onSubmit={async (text) => {
              await onUpdate(reply.id, text);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <div
              style={{
                display: "inline-block",
                maxWidth: "100%",
                boxSizing: "border-box",
                background: C.surface,
                borderRadius: 16,
                padding: "8px 13px",
              }}
            >
              <p style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>
                {reply.userName || "Ẩn danh"}
                {isOwn && (
                  <span style={{ fontWeight: 500, color: C.textDim }}>
                    {" "}
                    (bạn)
                  </span>
                )}
              </p>
              <p
                style={{
                  fontSize: 13.5,
                  color: C.textSub,
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {reply.replyToUserName && (
                  <span
                    style={{ color: C.accent, fontWeight: 600, marginRight: 6 }}
                  >
                    @{reply.replyToUserName}
                  </span>
                )}
                {reply.replyText}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "2px 13px 0",
              }}
            >
              <span
                title={fmtDateShort(reply.createdAt)}
                style={{ fontSize: 11.5, color: C.textDim }}
              >
                {timeAgo(reply.createdAt)}
                {reply.updatedAt ? " · đã chỉnh sửa" : ""}
              </span>
              {canReply && (
                <button
                  type="button"
                  className="rv-link"
                  style={{ fontSize: 11.5 }}
                  onClick={() => setReplying((v) => !v)}
                >
                  Trả lời
                </button>
              )}
              {isOwn && (
                <button
                  type="button"
                  className="rv-link"
                  style={{ fontSize: 11.5 }}
                  onClick={() => setEditing(true)}
                >
                  Sửa
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  className="rv-link danger"
                  style={{ fontSize: 11.5 }}
                  onClick={() => onDelete(reply)}
                >
                  {isOwn ? "Xóa" : "Xóa (Admin)"}
                </button>
              )}
            </div>
          </>
        )}

        {/* Ô trả lời cho reply này */}
        {replying && !editing && (
          <div style={{ marginTop: 6 }}>
            <ReplyForm
              autoFocus
              placeholder={`Trả lời ${reply.userName || "Ẩn danh"}...`}
              submitLabel="Gửi trả lời"
              onSubmit={async (text) => {
                await onCreate(text, reply.id);
                setReplying(false);
                setShowChildren(true);
              }}
              onCancel={() => setReplying(false)}
            />
          </div>
        )}

        {/* Reply con (chỉ reply gốc mới có) */}
        {!isChild && childReplies.length > 0 && (
          <div style={{ marginTop: 2 }}>
            <button
              type="button"
              className="rv-link active"
              aria-expanded={showChildren}
              style={{ fontSize: 11.5, margin: "4px 0 0 13px" }}
              onClick={() => setShowChildren((v) => !v)}
            >
              {showChildren
                ? "Ẩn phản hồi"
                : `Xem ${childReplies.length} phản hồi`}
            </button>
            <AnimatePresence initial={false}>
              {showChildren &&
                childReplies.map((c) => (
                  <ReplyItem
                    key={c.id}
                    reply={c}
                    isChild
                    currentUser={currentUser}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    onCreate={onCreate}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                  />
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ReplyItem;