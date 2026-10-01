// src/components/movie/shared/review/RepliesPanel.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogIn,
} from "lucide-react";
import reviewService from "../../../services/reviewService";
import { C } from "../../../context/homeTokens";
import { userInfo, REPLY_STEP, REPLY_MAX_FETCH, parseReplies, getErrMsg } from "./reviewUtils";
import AvatarCircle from "./AvatarCircle";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import ReplyForm from "./ReplyForm";
import ReplyItem from "./ReplyItem";

// ── RepliesPanel — tải lazy khi mở ─────────────────────────────────────────
const RepliesPanel = ({
  reviewId,
  currentUser,
  isAdmin,
  onCountChange,
  onToast,
}) => {
  const [replies, setReplies] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalRoots, setTotalRoots] = useState(0);
  // Đếm theo REPLY GỐC (backend phân trang theo gốc, kèm đủ reply con)
  const repliesLenRef = React.useRef(0);
  repliesLenRef.current = replies.filter((r) => !r.parentReplyId).length;
  const me = userInfo(currentUser);
  const [replyDelete, setReplyDelete] = useState(null);
  const [deletingReply, setDeletingReply] = useState(false);
  const replyDeleteChildCount = replyDelete
    ? replies.filter((r) => r.parentReplyId === replyDelete.id).length
    : 0;
  const replyDeleteAsAdmin =
    !!replyDelete && isAdmin && replyDelete.userId !== currentUser?.id;

  // Backend phân trang theo page/size cố định, nên để đơn giản & nhất quán:
  // luôn lấy trang 1 với pageSize = số reply muốn hiển thị (tối đa 100).
  const fetchUpTo = React.useCallback(
    async (count) => {
      const size = Math.min(REPLY_MAX_FETCH, Math.max(REPLY_STEP, count));
      const res = await reviewService.getReplies(reviewId, 1, size);
      const { replies: list, total: t } = parseReplies(res);
      const env = res?.data?.data ?? res?.data ?? {};
      const roots =
        env.totalRootReplies ??
        env.TotalRootReplies ??
        list.filter((r) => !r.parentReplyId).length;
      setReplies(list);
      setTotal(t);
      setTotalRoots(roots);
      onCountChange?.(t);
    },
    [reviewId, onCountChange],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchUpTo(REPLY_STEP)
      .catch(() => {
        if (!cancelled) onToast?.("Không thể tải trả lời", "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchUpTo]); // eslint-disable-line

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      await fetchUpTo(repliesLenRef.current + REPLY_STEP);
    } catch {
      onToast?.("Không thể tải thêm trả lời", "error");
    } finally {
      setLoadingMore(false);
    }
  };

  // Các handler ném lỗi ra ngoài để ReplyForm hiển thị lỗi inline
  const handleCreate = async (text, parentReplyId = null) => {
    await reviewService.createReply(reviewId, text, parentReplyId);
    // reply mới nằm cuối danh sách (sắp xếp cũ → mới) nên nới thêm 1 slot
    // reply gốc mới nằm cuối danh sách gốc → tải hết gốc; reply con thì giữ nguyên số gốc
    await fetchUpTo(
      parentReplyId
        ? repliesLenRef.current
        : Math.max(repliesLenRef.current, totalRoots) + 1,
    );
    onToast?.("Đã gửi trả lời", "success");
  };

  const handleUpdate = async (replyId, text) => {
    await reviewService.updateReply(replyId, text);
    await fetchUpTo(repliesLenRef.current);
    onToast?.("Đã cập nhật trả lời", "success");
  };

  const handleDelete = (reply) => setReplyDelete(reply);

  const confirmDeleteReply = async () => {
    if (!replyDelete || deletingReply) return;
    const reply = replyDelete;
    const asAdmin = isAdmin && reply.userId !== currentUser?.id;
    setDeletingReply(true);
    try {
      if (asAdmin) await reviewService.adminDeleteReply(reply.id);
      else await reviewService.deleteReply(reply.id);
    } catch (e) {
      setReplyDelete(null);
      setDeletingReply(false);
      onToast?.(
        getErrMsg(e, "Vui lòng thử lại sau"),
        "error",
        "Xóa trả lời thất bại",
      );
      return;
    }
    setReplyDelete(null);
    setDeletingReply(false);
    // xóa reply gốc thì các reply con cũng bị xóa theo
    setReplies((prev) =>
      prev.filter((r) => r.id !== reply.id && r.parentReplyId !== reply.id),
    ); // ẩn ngay cho mượt, rồi đồng bộ lại
    onToast?.(
      "Trả lời đã được gỡ khỏi cuộc trò chuyện",
      "success",
      "Đã xóa trả lời",
    );
    fetchUpTo(Math.max(REPLY_STEP, repliesLenRef.current)).catch(() => {});
  };

  // Nhóm: reply gốc (không có parentReplyId) + reply con theo từng gốc.
  // Danh sách trả về theo CreatedAt tăng dần nên reply con luôn đứng sau reply gốc
  // trong cùng một trang → không bao giờ bị "mồ côi" khi phân trang.
  const rootReplies = replies.filter((r) => !r.parentReplyId);
  const childrenOf = (id) => replies.filter((r) => r.parentReplyId === id);

  const hasMore =
    rootReplies.length < totalRoots && rootReplies.length < REPLY_MAX_FETCH;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      style={{ overflow: "hidden" }}
    >
      <div style={{ paddingTop: 10 }}>
        {loading ? (
          <p style={{ fontSize: 13, color: C.textDim, padding: "6px 0" }}>
            Đang tải trả lời...
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {rootReplies.map((r) => (
              <ReplyItem
                key={r.id}
                reply={r}
                childReplies={childrenOf(r.id)}
                currentUser={currentUser}
                currentUserId={currentUser?.id}
                isAdmin={isAdmin}
                onCreate={handleCreate}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        )}

        {hasMore && (
          <button
            type="button"
            className="rv-link active"
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{ margin: "4px 0 6px 38px" }}
          >
            {loadingMore
              ? "Đang tải..."
              : `Xem thêm ${Math.min(REPLY_STEP, totalRoots - rootReplies.length)} trả lời`}
          </button>
        )}

        <div style={{ marginTop: 8 }}>
          {currentUser ? (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <AvatarCircle name={me.name} avatarUrl={me.avatar} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <ReplyForm
                  placeholder="Viết trả lời..."
                  submitLabel="Gửi trả lời"
                  onSubmit={handleCreate}
                />
              </div>
            </div>
          ) : (
            <p
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: C.textDim,
              }}
            >
              <LogIn size={13} /> Đăng nhập để trả lời
            </p>
          )}
        </div>
      </div>

      <ConfirmDeleteModal
        open={!!replyDelete}
        title="Xóa trả lời này?"
        description={
          replyDeleteAsAdmin
            ? `Bạn đang xóa trả lời của ${replyDelete?.userName || "người dùng"} với tư cách Admin${replyDeleteChildCount ? ` (kèm ${replyDeleteChildCount} phản hồi bên dưới)` : ""}. Thao tác này không thể hoàn tác.`
            : replyDeleteChildCount
              ? `Trả lời này và ${replyDeleteChildCount} phản hồi bên dưới sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.`
              : "Trả lời sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác."
        }
        preview={replyDelete ? { text: replyDelete.replyText } : null}
        confirmLabel="Xóa trả lời"
        busy={deletingReply}
        onConfirm={confirmDeleteReply}
        onCancel={() => {
          if (!deletingReply) setReplyDelete(null);
        }}
      />
    </motion.div>
  );
};

export default RepliesPanel;