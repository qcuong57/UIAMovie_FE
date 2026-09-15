// src/components/home/RecommendSection.jsx
import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Sparkles,
  Star,
  Play,
  Plus,
  Heart,
  Crown,
  Loader,
  Info,
  Flame,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useIsMobile } from "../../hooks/useIsMobile";
import { C, FONT_DISPLAY, FONT_BODY } from "../../context/homeTokens";
import { useToast } from "../common/Toast";
import movieService from "../../services/movieService";
import tvShowService from "../../services/tvShowService";
import PremiumGateModal from "../movie/ui/PremiumGateModal";

// ── Auth & Premium Helpers ─────────────────────────────────────────
function getCurrentUser() {
  try {
    const raw = localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function userHasPremium(user) {
  if (!user) return false;
  return (
    user.isPremium === true ||
    user.plan === "premium" ||
    user.subscription?.active === true
  );
}

function isUnauthorizedError(err) {
  const status = err?.response?.status ?? err?.status;
  return status === 401 || status === 403;
}

function getErrorMessage(err, fallback) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.data?.message ||
    (typeof err?.message === "string" && err.message) ||
    fallback
  );
}

function ModalPortal({ children }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

const getPlayerRoute = (item) => (item?.isTvShow ? `/tvshow/${item.id}` : `/movie/${item.id}`);
const getInfoRoute   = (item) => (item?.isTvShow ? `/tvshow/${item.id}/info` : `/movie/${item.id}/info`);

const ACCENT_COLOR = "#a78bfa";

export default function RecommendSection({
  movies = [],
  tvShows = [],
  items,
  subtitle = "",
  onFavoriteToggle,
  isFavorited,
  favoritedIds = [],
}) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const toast = useToast();

  // Chuẩn 10 phim (2 lượt carousel, mỗi lượt đúng 5 phim)
  const list = useMemo(() => {
    const raw = items ?? [...movies, ...tvShows];
    return (raw || []).filter(Boolean).slice(0, 10);
  }, [items, movies, tvShows]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselPage, setCarouselPage] = useState(0); // 0 (phim 1-5) hoặc 1 (phim 6-10)
  const [showGate, setShowGate] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [gateTitle, setGateTitle] = useState("");

  const activeItem = list[activeIndex] || list[0] || null;

  const checkFav = useCallback(
    (id) => {
      if (typeof isFavorited === "function") return isFavorited(id);
      return favoritedIds?.includes(id) ?? false;
    },
    [isFavorited, favoritedIds]
  );

  const handleTogglePage = () => {
    setCarouselPage((prev) => (prev === 0 ? 1 : 0));
  };

  const handleFavoriteClick = async (e, item) => {
    e.stopPropagation();
    if (!item || favLoading) return;

    if (!getCurrentUser()) {
      toast.warning("Bạn cần đăng nhập để thêm vào Yêu thích");
      return;
    }

    setFavLoading(true);
    const isFav = checkFav(item.id);
    const svc = item.isTvShow ? tvShowService : movieService;

    try {
      if (isFav) {
        await svc.removeFavorite(item.id);
        onFavoriteToggle?.(item, false);
        toast.info(`Đã bỏ "${item.title}" khỏi Yêu thích`);
      } else {
        await svc.addFavorite(item.id);
        onFavoriteToggle?.(item, true);
        toast.success(`Đã thêm "${item.title}" vào Yêu thích`);
      }
    } catch (err) {
      if (isUnauthorizedError(err)) {
        toast.warning("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
      } else {
        toast.error(getErrorMessage(err, "Không thể cập nhật danh sách yêu thích"));
      }
    } finally {
      setFavLoading(false);
    }
  };

  const handlePlay = (e, item) => {
    e.stopPropagation();
    if (!item) return;
    const isLocked = item.isPremium && !userHasPremium(getCurrentUser());
    if (isLocked) {
      setGateTitle(item.title);
      setShowGate(true);
      return;
    }
    navigate(getPlayerRoute(item));
  };

  if (!list.length || !activeItem) return null;

  const isCurrentFav = checkFav(activeItem.id);
  const isCurrentPremium = activeItem.isPremium && !userHasPremium(getCurrentUser());
  const matchPct = activeItem.rating ? Math.round(activeItem.rating * 10) : 96;
  const displayGenre =
    activeItem.genres?.[0] ||
    (Array.isArray(activeItem.genre) ? activeItem.genre[0] : activeItem.genre);

  // 5 phim tương ứng cho carousel hiện tại
  const currentFiveMovies = list.slice(carouselPage * 5, carouselPage * 5 + 5);

  return (
    <section
      style={{
        marginBottom: 56,
        position: "relative",
      }}
    >
      {/* ── Tiêu đề Section (Không viền) ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          padding: "0 4px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(167, 139, 250, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={15} color={ACCENT_COLOR} />
          </div>
          <h2
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: isMobile ? 18 : 22,
              fontWeight: 800,
              color: C.text,
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Gợi Ý Dành Riêng Cho Bạn
          </h2>
        </div>

        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 12,
            color: "rgba(255,255,255,0.45)",
            fontWeight: 600,
          }}
        >
          {subtitle || "Dựa trên sở thích xem phim của bạn"}
        </span>
      </div>

      {/* ── SHOWCASE STUDIO LAYOUT (KHÔNG DÙNG VIỀN) ── */}
      {!isMobile ? (
        <div
          style={{
            position: "relative",
            width: "100%",
            borderRadius: 24,
            background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 24px 60px -10px rgba(0,0,0,0.75)",
            padding: "36px 36px 30px 36px",
            display: "grid",
            gridTemplateColumns: "300px 1fr",
            gap: 40,
            alignItems: "stretch",
            overflow: "hidden",
          }}
        >
          {/* Ambient Glow nhẹ phía sau */}
          <div
            style={{
              position: "absolute",
              top: "-20%",
              left: "-10%",
              width: "45%",
              height: "140%",
              background: `radial-gradient(circle, ${ACCENT_COLOR}16 0%, transparent 65%)`,
              filter: "blur(60px)",
              pointerEvents: "none",
            }}
          />

          {/* 1. CỘT TRÁI: Poster Phim Đứng (2:3) */}
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "2 / 3",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 20px 45px rgba(0,0,0,0.9)",
              cursor: "pointer",
            }}
            onClick={() => navigate(getInfoRoute(activeItem))}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={`poster-${activeItem.id}`}
                src={activeItem.posterUrl || activeItem.backdropUrl}
                alt={activeItem.title}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </AnimatePresence>

            <div
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                right: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#fff",
                  background: "rgba(0,0,0,0.7)",
                  backdropFilter: "blur(8px)",
                  padding: "4px 8px",
                  borderRadius: 6,
                }}
              >
                {activeItem.isTvShow ? "SERIES" : "MOVIE"}
              </span>

              {activeItem.isPremium && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 8px",
                    borderRadius: 6,
                    background: "linear-gradient(135deg, #facc15, #f59e0b)",
                  }}
                >
                  <Crown size={10} fill="#1c1400" color="#1c1400" />
                  <span style={{ fontFamily: FONT_BODY, fontSize: 9, fontWeight: 900, color: "#1c1400" }}>
                    PREMIUM
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 2. CỘT PHẢI: Khối Thông Tin + Carousel 5 Phim (2 Lần Scroll) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minWidth: 0,
            }}
          >
            {/* Cụm thông tin chi tiết */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`info-${activeItem.id}`}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: 0.28 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "rgba(70, 211, 105, 0.14)",
                    }}
                  >
                    <Flame size={12} color={C.green} />
                    <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 800, color: C.green }}>
                      {matchPct}% Phù hợp với gu của bạn
                    </span>
                  </div>

                  <span
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize: 11,
                      fontWeight: 700,
                      color: ACCENT_COLOR,
                      background: "rgba(167, 139, 250, 0.12)",
                      padding: "4px 10px",
                      borderRadius: 999,
                    }}
                  >
                    Đề xuất hàng đầu hôm nay
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 32,
                    fontWeight: 900,
                    color: "#ffffff",
                    lineHeight: 1.15,
                    margin: "0 0 10px 0",
                  }}
                >
                  {activeItem.title}
                </h3>

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  {activeItem.rating > 0 && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: "rgba(245, 197, 24, 0.15)",
                      }}
                    >
                      <Star size={12} fill={C.gold} color={C.gold} />
                      <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 800, color: C.gold }}>
                        {Number(activeItem.rating).toFixed(1)}
                      </span>
                    </div>
                  )}

                  {activeItem.year && (
                    <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                      {activeItem.year}
                    </span>
                  )}

                  {displayGenre && (
                    <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                      • {displayGenre}
                    </span>
                  )}
                </div>

                <p
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: 13.5,
                    color: "rgba(255,255,255,0.7)",
                    lineHeight: 1.6,
                    margin: "0 0 20px 0",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    maxWidth: 620,
                  }}
                >
                  {activeItem.description || "Nội dung phim được đề xuất dựa trên mức độ tương đồng về diễn viên, đạo diễn và thể loại yêu thích của bạn."}
                </p>

                {/* Dàn nút hành động */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={(e) => handlePlay(e, activeItem)}
                    style={{
                      height: 42,
                      padding: "0 24px",
                      borderRadius: 999,
                      border: "none",
                      background: isCurrentPremium
                        ? "linear-gradient(135deg, #facc15, #f59e0b)"
                        : "#ffffff",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      fontFamily: FONT_BODY,
                      fontSize: 13.5,
                      fontWeight: 800,
                      color: "#000000",
                      boxShadow: isCurrentPremium
                        ? "0 6px 20px rgba(250,204,21,0.3)"
                        : "0 6px 20px rgba(255,255,255,0.2)",
                    }}
                  >
                    {isCurrentPremium ? (
                      <>
                        <Crown size={15} fill="#000" color="#000" />
                        <span>Mở khóa Premium</span>
                      </>
                    ) : (
                      <>
                        <Play size={15} fill="#000" color="#000" style={{ marginLeft: 2 }} />
                        <span>Xem ngay</span>
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={(e) => handleFavoriteClick(e, activeItem)}
                    disabled={favLoading}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      border: "none",
                      background: isCurrentFav ? C.accent : "rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: favLoading ? "not-allowed" : "pointer",
                    }}
                    title={isCurrentFav ? "Bỏ yêu thích" : "Thêm vào danh sách"}
                  >
                    {favLoading ? (
                      <Loader size={15} color="white" style={{ animation: "spin 0.7s linear infinite" }} />
                    ) : isCurrentFav ? (
                      <Heart size={16} fill="white" color="white" />
                    ) : (
                      <Plus size={18} color="white" strokeWidth={2.5} />
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => navigate(getInfoRoute(activeItem))}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      border: "none",
                      background: "rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                    title="Xem chi tiết"
                  >
                    <Info size={16} color="white" />
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* ── DÀN CAROUSEL 5 PHIM (TỔNG 2 LẦN SCROLL) ── */}
            <div style={{ paddingTop: 24 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize: 11,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.45)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Các phim khác cùng gu
                  </span>

                  {/* Dot phân trang hiển thị 2 lượt cuộn */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div
                      style={{
                        width: carouselPage === 0 ? 16 : 5,
                        height: 5,
                        borderRadius: 999,
                        background: carouselPage === 0 ? ACCENT_COLOR : "rgba(255,255,255,0.2)",
                        transition: "all 0.3s ease",
                      }}
                    />
                    <div
                      style={{
                        width: carouselPage === 1 ? 16 : 5,
                        height: 5,
                        borderRadius: 999,
                        background: carouselPage === 1 ? ACCENT_COLOR : "rgba(255,255,255,0.2)",
                        transition: "all 0.3s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Nút lật 2 lượt cuộn */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={handleTogglePage}
                    disabled={carouselPage === 0}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: "none",
                      background: carouselPage === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)",
                      color: carouselPage === 0 ? "rgba(255,255,255,0.2)" : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: carouselPage === 0 ? "default" : "pointer",
                      transition: "all 0.2s",
                    }}
                    title="Trang trước"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={handleTogglePage}
                    disabled={carouselPage === 1}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: "none",
                      background: carouselPage === 1 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)",
                      color: carouselPage === 1 ? "rgba(255,255,255,0.2)" : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: carouselPage === 1 ? "default" : "pointer",
                      transition: "all 0.2s",
                    }}
                    title="Trang tiếp theo"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Dàn 5 Card hiển thị cùng lúc (Không viền tím đáy) */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`carousel-page-${carouselPage}`}
                  initial={{ opacity: 0, x: carouselPage === 1 ? 16 : -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: carouselPage === 1 ? -16 : 16 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                    gap: 12,
                  }}
                >
                  {currentFiveMovies.map((item, idx) => {
                    const globalIdx = carouselPage * 5 + idx;
                    const isSelected = globalIdx === activeIndex;
                    const itemMatch = item.rating ? Math.round(item.rating * 10) : 92;

                    return (
                      <motion.div
                        key={`card-${item.id}-${globalIdx}`}
                        onClick={() => setActiveIndex(globalIdx)}
                        whileHover={{ y: -3 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          position: "relative",
                          height: 104,
                          borderRadius: 14,
                          overflow: "hidden",
                          cursor: "pointer",
                          background: "#16161a",
                          border: "none",
                          opacity: isSelected ? 1 : 0.5,
                          transform: isSelected ? "scale(1.02)" : "scale(1)",
                          boxShadow: isSelected
                            ? "0 12px 30px rgba(0,0,0,0.85)"
                            : "0 4px 14px rgba(0,0,0,0.35)",
                          transition: "opacity 0.2s, transform 0.2s, box-shadow 0.2s",
                        }}
                      >
                        <img
                          src={item.backdropUrl || item.posterUrl}
                          alt={item.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />

                        {/* Gradient che tối để đọc chữ rõ ràng */}
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.95) 100%)",
                          }}
                        />

                        {/* Điểm % phù hợp */}
                        <div
                          style={{
                            position: "absolute",
                            top: 6,
                            left: 6,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: FONT_BODY,
                              fontSize: 9.5,
                              fontWeight: 800,
                              color: C.green,
                              background: "rgba(0,0,0,0.75)",
                              backdropFilter: "blur(4px)",
                              padding: "2px 6px",
                              borderRadius: 4,
                            }}
                          >
                            {itemMatch}%
                          </span>
                        </div>

                        {/* Tên phim */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: 8,
                            left: 8,
                            right: 8,
                          }}
                        >
                          <p
                            style={{
                              fontFamily: FONT_BODY,
                              fontSize: 11.5,
                              fontWeight: isSelected ? 800 : 700,
                              color: "#ffffff",
                              margin: 0,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              lineHeight: 1.25,
                              textShadow: "0 2px 6px rgba(0,0,0,0.9)",
                            }}
                          >
                            {item.title}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      ) : (
        /* ── BỐ CỤC MOBILE: CARD VUỐT NGANG ── */
        <div
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            padding: "2px 2px 14px 2px",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          }}
        >
          {list.map((item) => {
            const isFav = checkFav(item.id);
            const isLocked = item.isPremium && !userHasPremium(getCurrentUser());
            const matchPct = item.rating ? Math.round(item.rating * 10) : 95;

            return (
              <div
                key={`mob-curated-${item.id}`}
                onClick={() => navigate(getInfoRoute(item))}
                style={{
                  position: "relative",
                  flexShrink: 0,
                  width: "86vw",
                  maxWidth: 340,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.04)",
                  border: "none",
                  padding: 12,
                  display: "flex",
                  gap: 12,
                  scrollSnapAlign: "start",
                }}
              >
                <div
                  style={{
                    width: 90,
                    aspectRatio: "2 / 3",
                    borderRadius: 10,
                    overflow: "hidden",
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  <img
                    src={item.posterUrl || item.backdropUrl}
                    alt={item.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  {item.isPremium && (
                    <div
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        background: "linear-gradient(135deg, #facc15, #f59e0b)",
                        borderRadius: 4,
                        padding: "2px 4px",
                      }}
                    >
                      <Crown size={8} fill="#1c1400" color="#1c1400" />
                    </div>
                  )}
                </div>

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontFamily: FONT_BODY,
                        fontSize: 10,
                        fontWeight: 800,
                        color: C.green,
                        display: "block",
                        marginBottom: 3,
                      }}
                    >
                      {matchPct}% Phù hợp
                    </span>

                    <h4
                      style={{
                        fontFamily: FONT_DISPLAY,
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#fff",
                        margin: "0 0 4px 0",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.title}
                    </h4>

                    <span
                      style={{
                        fontFamily: FONT_BODY,
                        fontSize: 11,
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      {item.isTvShow ? "Series" : "Phim"} • {item.year || "Mới"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                    <button
                      onClick={(e) => handlePlay(e, item)}
                      style={{
                        flex: 1,
                        height: 32,
                        borderRadius: 8,
                        border: "none",
                        background: isLocked ? "#facc15" : "#fff",
                        color: "#000",
                        fontFamily: FONT_BODY,
                        fontSize: 12,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      <Play size={12} fill="#000" />
                      <span>Xem</span>
                    </button>

                    <button
                      onClick={(e) => handleFavoriteClick(e, item)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "none",
                        background: isFav ? C.accent : "rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isFav ? <Heart size={13} fill="white" color="white" /> : <Plus size={14} color="white" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Premium Gate */}
      <ModalPortal>
        <PremiumGateModal
          open={showGate}
          onClose={() => setShowGate(false)}
          movieTitle={gateTitle}
        />
      </ModalPortal>
    </section>
  );
}