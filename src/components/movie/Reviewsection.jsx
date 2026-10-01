// src/components/movie/shared/ReviewSection.jsx
import React, { useState, useEffect } from "react";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  Star,
  Edit2,
  Trash2,
  LogIn,
} from "lucide-react";
import { useIsMobile } from "../../hooks/useIsMobile";
import reviewService from "../../services/reviewService";
import { useToast } from "../../components/common/Toast";
import { C, FONT_TITLE } from "../../context/homeTokens";
import SectionTitle from "./ui/SectionTitle";
import Skeleton from "./ui/Skeleton";
import { epLabelOf, checkIsAdmin } from "./review/reviewUtils";
import { CSS } from "./review/reviewStyles";
import ConfirmDeleteModal from "./review/ConfirmDeleteModal";
import ReviewCard from "./review/ReviewCard";
import ReviewForm from "./review/ReviewForm";
import RatingDistribution from "./review/RatingDistribution";
import ReviewSkeleton from "./review/ReviewSkeleton";
import ModeTabs from "./review/ModeTabs";

// ══════════════════════════════════════════════════════════════════════════════
// ReviewSection — Main component
//
// Props:
//   contentType: 'movie' | 'tvshow'   (default: 'movie')
//   movieId:    string  (dùng khi contentType='movie')
//   tvShowId:   string  (dùng khi contentType='tvshow')
//   episodes:   Array<{ id, seasonNumber, episodeNumber, title }>
//   movieRating, voteCount, currentUser — giữ nguyên như cũ
// ══════════════════════════════════════════════════════════════════════════════
const ReviewSection = ({
  contentType = "movie",
  movieId,
  tvShowId,
  episodes = [],
  reviewMode: reviewModeProp = null, // 'show' | 'episode' | null (null = user-controlled tabs)
  activeEpisodeId = null, // ID tập đang xem — auto-select & lock khi truyền vào
  movieRating,
  voteCount,
  currentUser,
}) => {
  const isMobile = useIsMobile();

  // ── Deep-link từ thông báo: ?reviewId=...&episodeId=... ──
  const [searchParams, setSearchParams] = useSearchParams();
  const targetReviewId = searchParams.get("reviewId");
  const targetEpisodeId = searchParams.get("episodeId");
  const deepEpisode =
    reviewModeProp === null && contentType === "tvshow" && targetReviewId
      ? targetEpisodeId
      : null;

  // reviewMode: nếu prop truyền vào thì lock, không thì user tự chọn bằng ModeTabs
  const isModeLocked = reviewModeProp !== null;
  const [reviewModeInternal, setReviewModeInternal] = useState(
    reviewModeProp ?? (deepEpisode ? "episode" : "show"),
  );
  // Khi prop thay đổi (hoặc remount với prop mới), sync lại internal state
  React.useEffect(() => {
    if (reviewModeProp !== null) setReviewModeInternal(reviewModeProp);
  }, [reviewModeProp]);
  const reviewMode = isModeLocked ? reviewModeProp : reviewModeInternal;
  const setReviewMode = isModeLocked ? () => {} : setReviewModeInternal;

  // Nếu activeEpisodeId được truyền, auto-select tập đó và lock episode mode
  const [selectedEp, setSelectedEp] = useState(
    activeEpisodeId ?? deepEpisode ?? null,
  );
  // Ref luôn giữ giá trị mới nhất của selectedEp — tránh stale trong fetchAll closure
  const selectedEpRef = React.useRef(activeEpisodeId ?? deepEpisode ?? null);
  // Update ref ngay trong render body khi activeEpisodeId prop thay đổi
  if (activeEpisodeId && activeEpisodeId !== selectedEpRef.current) {
    selectedEpRef.current = activeEpisodeId;
  }
  const setSelectedEpSync = (val) => {
    selectedEpRef.current = val;
    setSelectedEp(val);
  };

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  // Khóa của lần tải danh sách gần nhất (mode|tập|trang) — dùng cho deep-link
  const [loadedKey, setLoadedKey] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // review đang chờ xác nhận xóa
  const [deleting, setDeleting] = useState(false);
  const PAGE_SIZE = 8;
  const isAdmin = checkIsAdmin(currentUser);

  // Toast dùng hệ thống chung (<ToastProvider> ở gốc app).
  // showToast(message, type, title?) giữ nguyên chữ ký cũ để RepliesPanel dùng lại.
  const {
    success: toastSuccess,
    error: toastError,
    warning: toastWarning,
    info: toastInfo,
  } = useToast();
  const showToast = React.useCallback(
    (message, type = "success", title) => {
      const fn =
        { success: toastSuccess, error: toastError, warning: toastWarning }[
          type
        ] ?? toastInfo;
      fn(message, title);
    },
    [toastSuccess, toastError, toastWarning, toastInfo],
  );

  // Sync selectedEp khi activeEpisodeId prop thay đổi (user đổi tập đang xem)
  useEffect(() => {
    if (activeEpisodeId) {
      setSelectedEpSync(activeEpisodeId);
    }
  }, [activeEpisodeId]);

  // Khi đổi tab hoặc đổi tập: reset page về 1 mà KHÔNG trigger fetchAll ngay lập tức
  // (fetchAll sẽ tự chạy lại khi page thay đổi qua dep bên dưới)
  const prevModeRef = React.useRef(reviewMode);
  const prevEpRef = React.useRef(selectedEp);
  useEffect(() => {
    const modeChanged = prevModeRef.current !== reviewMode;
    const epChanged = prevEpRef.current !== selectedEp;
    prevModeRef.current = reviewMode;
    prevEpRef.current = selectedEp;
    if (modeChanged || epChanged) {
      setPage(1);
      setReviews([]);
      setStats(null);
    }
  }, [reviewMode, selectedEp]);

  // ── Fetch ────────────────────────────────────────────────────────────────
  // Dùng ref để luôn đọc state mới nhất, tránh stale closure trong useCallback
  const stateRef = React.useRef({});
  // selectedEp dùng ref để luôn là giá trị mới nhất khi fetchAll chạy
  stateRef.current = {
    contentType,
    movieId,
    tvShowId,
    reviewMode,
    selectedEp: selectedEpRef.current,
    page,
    currentUser,
  };

  // opts.silent: không bật skeleton · opts.metaOnly: chỉ làm mới điểm tổng + "đã đánh giá", giữ nguyên danh sách
  const fetchAll = React.useCallback(
    async (pageOverride, { silent = false, metaOnly = false } = {}) => {
      const {
        contentType,
        movieId,
        tvShowId,
        reviewMode,
        selectedEp,
        page,
        currentUser,
      } = stateRef.current;
      const isMovie = contentType === "movie";
      const isShow = contentType === "tvshow" && reviewMode === "show";
      const isEpisode = contentType === "tvshow" && reviewMode === "episode";
      const fetchPage = pageOverride ?? page;
      const append = fetchPage > 1 && !metaOnly; // "Xem thêm" nối vào danh sách, không thay thế

      if (isMovie && !movieId) return;
      if (isShow && !tvShowId) return;
      if (isEpisode && !selectedEp) {
        setReviews([]);
        setStats(null);
        setLoading(false);
        return;
      }

      if (!silent && !metaOnly) {
        if (append) setLoadingMore(true);
        else setLoading(true);
      }
      try {
        let reviewsRes, statsRes;
        const listCall = (fn) =>
          metaOnly ? Promise.resolve(null) : fn().catch(() => null);

        if (isMovie) {
          [reviewsRes, statsRes] = await Promise.all([
            listCall(() =>
              reviewService.getMovieReviews(movieId, fetchPage, PAGE_SIZE),
            ),
            reviewService.getMovieRatingStats(movieId).catch(() => null),
          ]);
        } else if (isShow) {
          [reviewsRes, statsRes] = await Promise.all([
            listCall(() =>
              reviewService.getTvShowReviews(tvShowId, fetchPage, PAGE_SIZE),
            ),
            reviewService.getTvShowRatingStats(tvShowId).catch(() => null),
          ]);
        } else {
          [reviewsRes, statsRes] = await Promise.all([
            listCall(() =>
              reviewService.getEpisodeReviews(selectedEp, fetchPage, PAGE_SIZE),
            ),
            reviewService.getEpisodeRatingStats(selectedEp).catch(() => null),
          ]);
        }

        // Backend: ApiResponseDTO<MovieReviewsResponseDTO>
        // axios unwrap: response.data = { data: { reviews: [...] }, message }
        const envelope = reviewsRes?.data ?? {};
        const rawData = envelope?.data ?? envelope ?? {};
        const reviewList = rawData.reviews ?? rawData.Reviews ?? [];
        if (!metaOnly) {
          const list = Array.isArray(reviewList) ? reviewList : [];
          setReviews((prev) =>
            append
              ? [
                  ...prev,
                  ...list.filter((x) => !prev.some((p) => p.id === x.id)),
                ]
              : list,
          );
          setHasMore(list.length === PAGE_SIZE);
          setLoadedKey(`${reviewMode}|${selectedEp ?? ""}|${fetchPage}`);
        }

        // Stats: ApiResponseDTO<MovieRatingStatsDTO>
        // axios: response.data = { data: { averageRating, totalReviews, ... } }
        const statsEnvelope = statsRes?.data ?? {};
        setStats(statsEnvelope?.data ?? statsEnvelope ?? null);

      } catch (e) {
        console.error("ReviewSection fetch error:", e);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [],
  ); // deps rỗng — luôn đọc state mới nhất từ stateRef.current

  // Re-fetch khi các dependency thực sự thay đổi
  useEffect(() => {
    fetchAll();
  }, [contentType, movieId, tvShowId, reviewMode, selectedEp, page]); // eslint-disable-line

  // ── Deep-link tới một review (từ thông báo) ───────────────────────────────
  const DEEP_LINK_MAX_PAGES = 12;

  const clearDeepLink = React.useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("reviewId");
        next.delete("episodeId");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  // Chuyển đúng chế độ (show/tập) khi không bị lock từ prop
  useEffect(() => {
    if (!targetReviewId || isModeLocked || contentType !== "tvshow") return;
    if (targetEpisodeId) {
      setReviewModeInternal("episode");
      setSelectedEpSync(targetEpisodeId);
    } else {
      setReviewModeInternal("show");
      setSelectedEpSync(null);
    }
  }, [targetReviewId, targetEpisodeId]); // eslint-disable-line

  const deepDoneRef = React.useRef(false);
  useEffect(() => {
    deepDoneRef.current = false;
  }, [targetReviewId]);

  // Tìm review đích; chưa thấy thì tải thêm trang tiếp theo
  useEffect(() => {
    if (!targetReviewId || deepDoneRef.current) return;
    if (loading || loadingMore) return;
    // Chỉ xét khi danh sách hiện tại đúng là kết quả của mode/tập/trang đang chọn
    if (loadedKey !== `${reviewMode}|${selectedEp ?? ""}|${page}`) return;

    const want = targetReviewId.toLowerCase();
    const found = reviews.find((r) => String(r.id).toLowerCase() === want);
    if (found) {
      deepDoneRef.current = true;
      setHighlightId(found.id);
      return;
    }
    if (hasMore && page < DEEP_LINK_MAX_PAGES) {
      setPage((p) => p + 1);
    } else {
      deepDoneRef.current = true;
      showToast(
        "Đánh giá này có thể đã bị xóa hoặc không còn hiển thị",
        "warning",
        "Không tìm thấy đánh giá",
      );
      clearDeepLink();
    }
  }, [
    targetReviewId,
    reviews,
    loading,
    loadingMore,
    loadedKey,
    hasMore,
    page,
    reviewMode,
    selectedEp,
  ]); // eslint-disable-line

  // Tắt highlight và dọn query sau vài giây
  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => {
      setHighlightId(null);
      clearDeepLink();
    }, 3000);
    return () => clearTimeout(t);
  }, [highlightId, clearDeepLink]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleDelete = (review) => setDeleteTarget(review);

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    const target = deleteTarget;
    setDeleting(true);
    try {
      await reviewService.deleteReview(target.id);
      setDeleteTarget(null);
      setReviews((prev) => prev.filter((r) => r.id !== target.id)); // biến mất ngay, không nháy skeleton
      showToast(
        "Đánh giá của bạn đã được gỡ khỏi trang",
        "success",
        "Đã xóa đánh giá",
      );
      fetchAll(undefined, { metaOnly: true }); // cập nhật điểm trung bình, phân bố, ô soạn
    } catch (e) {
      setDeleteTarget(null);
      showToast(
        e?.response?.data?.message || e.message || "Vui lòng thử lại sau",
        "error",
        "Xóa đánh giá thất bại",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (review) => {
    setEditTarget(review);
    setIsEditing(true);
  };

  const handleFormSuccess = async (isEdit = false) => {
    setIsEditing(false);
    setEditTarget(null);
    showToast(
      isEdit
        ? "Thay đổi của bạn đã được lưu"
        : "Đánh giá của bạn đã hiển thị bên dưới",
      "success",
      isEdit ? "Đã lưu thay đổi" : "Đã đăng đánh giá",
    );
    setPage(1);
    setReviews([]);
    // Đảm bảo stateRef.current.page = 1 trước khi fetchAll (tránh stale)
    stateRef.current = { ...stateRef.current, page: 1 };
    await fetchAll(1);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const avgRating =
    stats?.averageRating ?? stats?.AverageRating ?? movieRating ?? 0;
  const totalReviews = stats?.totalReviews ?? stats?.TotalReviews ?? 0;
  const ratingDist =
    stats?.ratingDistribution ?? stats?.RatingDistribution ?? null;

  // Label tập phim cho ReviewCard
  const episodeLabelMap = React.useMemo(() => {
    const m = {};
    (episodes || []).forEach((ep) => {
      m[ep.id] = epLabelOf(ep);
    });
    return m;
  }, [episodes]);

  // ── Render ────────────────────────────────────────────────────────────────
  const sectionTitle =
    contentType === "tvshow" && reviewMode === "episode"
      ? "Đánh Giá Theo Tập"
      : "Đánh Giá";

  const statsLabel =
    contentType === "tvshow" && reviewMode === "episode" && selectedEp
      ? `Điểm tập ${episodeLabelMap[selectedEp] || ""}`
      : contentType === "tvshow"
        ? "Điểm cả show"
        : "Điểm trung bình";

  const showList =
    contentType !== "tvshow" || reviewMode !== "episode" || selectedEp;
  const hasDist = ratingDist && Object.keys(ratingDist).length > 0;

  return (
    <MotionConfig reducedMotion="user">
      <div className="rv-root">
        <style>{CSS}</style>

        <ConfirmDeleteModal
          open={!!deleteTarget}
          title="Xóa đánh giá này?"
          description="Điểm và nhận xét của bạn sẽ bị gỡ khỏi trang này. Thao tác này không thể hoàn tác."
          preview={
            deleteTarget
              ? {
                  rating: deleteTarget.rating,
                  text: deleteTarget.reviewText,
                  label: deleteTarget.episodeId
                    ? episodeLabelMap[deleteTarget.episodeId]
                    : null,
                }
              : null
          }
          confirmLabel="Xóa đánh giá"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => {
            if (!deleting) setDeleteTarget(null);
          }}
        />

        <SectionTitle>{sectionTitle}</SectionTitle>

        {/* TV show mode tabs — chỉ hiện khi KHÔNG bị lock từ prop */}
        {contentType === "tvshow" && !isModeLocked && (
          <ModeTabs
            mode={reviewMode}
            onChange={(m) => {
              setReviewMode(m);
              setSelectedEpSync(null);
            }}
          />
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 280px",
            gap: isMobile ? "20px 0" : "0 48px",
            alignItems: "start",
          }}
        >
          {/* ── LEFT: composer + feed ─────────────────────────────────── */}
          <div>
            <div
              style={{
                paddingBottom: 20,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              {!currentUser ? (
                <p
                  className="rv-field"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 18px",
                    borderRadius: 24,
                    fontSize: 14,
                    color: C.textDim,
                  }}
                >
                  <LogIn size={15} /> Đăng nhập để viết đánh giá
                </p>
              ) : loading ? (
                <Skeleton
                  h={48}
                  r={24}
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg,#181818 25%,#222 50%,#181818 75%)",
                    backgroundSize: "200% 100%",
                    animation: "rv-shimmer 1.4s linear infinite",
                  }}
                />
              ) : isEditing ? (
                <AnimatePresence>
                  <ReviewForm
                    contentType={contentType}
                    movieId={movieId}
                    tvShowId={tvShowId}
                    reviewMode={reviewMode}
                    episodes={episodes}
                    existing={editTarget}
                    activeEpisodeId={activeEpisodeId}
                    currentUser={currentUser}
                    onSuccess={handleFormSuccess}
                    onCancel={() => {
                      setIsEditing(false);
                      setEditTarget(null);
                    }}
                  />
                </AnimatePresence>
              ) : (
                <ReviewForm
                  contentType={contentType}
                  movieId={movieId}
                  tvShowId={tvShowId}
                  reviewMode={reviewMode}
                  episodes={episodes}
                  existing={null}
                  activeEpisodeId={activeEpisodeId}
                  currentUser={currentUser}
                  onSuccess={handleFormSuccess}
                  onCancel={null}
                />
              )}
            </div>

            {showList && (
              <>
                {loading ? (
                  <ReviewSkeleton />
                ) : reviews.length > 0 ? (
                  <>
                    <h3
                      style={{
                        fontFamily: FONT_TITLE,
                        fontSize: 15,
                        fontWeight: 700,
                        color: C.text,
                        margin: "20px 0 0",
                      }}
                    >
                      {totalReviews > 0
                        ? `${totalReviews.toLocaleString()} đánh giá`
                        : "Đánh giá"}
                    </h3>
                    <AnimatePresence mode="popLayout">
                      {reviews.map((r) => (
                        <ReviewCard
                          key={r.id}
                          review={r}
                          currentUser={currentUser}
                          isAdmin={isAdmin}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onToast={showToast}
                          highlight={highlightId === r.id}
                          episodeLabel={
                            r.episodeId ? episodeLabelMap[r.episodeId] : null
                          }
                        />
                      ))}
                    </AnimatePresence>
                  </>
                ) : (
                  <p
                    style={{
                      padding: "36px 0",
                      textAlign: "center",
                      color: C.textDim,
                      fontSize: 14,
                    }}
                  >
                    Chưa có đánh giá nào. Bạn hãy là người đầu tiên.
                  </p>
                )}

                {hasMore && (
                  <button
                    type="button"
                    className="rv-link active"
                    disabled={loadingMore}
                    onClick={() => setPage((p) => p + 1)}
                    style={{
                      display: "flex",
                      margin: "8px auto 0",
                      padding: "10px 16px",
                      fontSize: 13.5,
                    }}
                  >
                    {loadingMore ? "Đang tải..." : "Xem thêm đánh giá"}
                  </button>
                )}
              </>
            )}

            {/* Episode mode nhưng chưa chọn tập */}
            {contentType === "tvshow" &&
              reviewMode === "episode" &&
              !selectedEp && (
                <p
                  style={{
                    padding: "36px 0",
                    textAlign: "center",
                    color: C.textDim,
                    fontSize: 14,
                  }}
                >
                  Chọn một tập ở trên để xem đánh giá của tập đó.
                </p>
              )}
          </div>

          {/* ── RIGHT: tổng quan điểm ─────────────────────────────────── */}
          <aside
            style={{
              position: isMobile ? "static" : "sticky",
              top: 80,
              order: isMobile ? -1 : 0,
              display: "flex",
              flexDirection: isMobile ? "row" : "column",
              gap: isMobile ? 24 : 20,
              padding: isMobile ? "0 0 4px" : "22px",
              alignItems: isMobile ? "center" : "stretch",
              background: isMobile ? "none" : C.card,
              borderRadius: 14,
              border: isMobile ? "none" : `1px solid ${C.border}`,
            }}
          >
            <div style={{ flexShrink: 0 }}>
              <p style={{ fontSize: 13, color: C.textDim, marginBottom: 4 }}>
                {statsLabel}
              </p>
              <p style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                <span
                  style={{
                    fontFamily: FONT_TITLE,
                    fontSize: 38,
                    fontWeight: 800,
                    color: C.gold,
                    lineHeight: 1,
                  }}
                >
                  {Number(avgRating).toFixed(1)}
                </span>
                <span style={{ fontSize: 14, color: C.textDim }}>/ 10</span>
              </p>
              <p style={{ fontSize: 12.5, color: C.textDim, marginTop: 6 }}>
                {totalReviews > 0
                  ? `${totalReviews.toLocaleString()} đánh giá`
                  : voteCount
                    ? `${voteCount.toLocaleString()} lượt (TMDB)`
                    : "Chưa có đánh giá"}
              </p>
            </div>

            {hasDist && (
              <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
                <RatingDistribution distribution={ratingDist} />
              </div>
            )}
          </aside>
        </div>
      </div>
    </MotionConfig>
  );
};

export default ReviewSection;