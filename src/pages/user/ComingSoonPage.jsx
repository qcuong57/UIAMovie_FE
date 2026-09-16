// src/pages/user/ComingSoonPage.jsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, Film, Tv, Inbox, RotateCcw } from "lucide-react";
import {
  C,
  FONT_DISPLAY,
  FONT_BODY,
  GOOGLE_FONTS,
} from "../../context/homeTokens";
import { useIsMobile } from "../../hooks/useIsMobile";
import { sortComingSoonMovies } from "../../utils/releaseDateUtils";
import movieService from "../../services/movieService";
import tvShowService from "../../services/tvShowService";
import BackButton from "../../components/common/BackButton";
import LoadingScreen from "../../components/ui/LoadingScreen";
import SectionReveal from "../../motion-configs/SectionReveal";
import ComingSoonFeatured from "../../components/home/coming-soon/ComingSoonFeatured";
import ComingSoonCard from "../../components/home/coming-soon/ComingSoonCard";

const ACCENT = C.gold;

const normalizeMovie = (m) => ({
  id: m.id,
  title: m.title,
  releaseDate: m.releaseDate ?? null,
  rating: m.rating ?? m.imdbRating ?? 0,
  posterUrl: m.posterUrl || null,
  backdropUrl: m.backdropUrl || null,
  genres: m.genres || [],
  description: m.description || "",
  isPremium: m.isPremium ?? false,
  trailerVideoUrl: m.trailerVideoUrl || null,
  isTvShow: false,
});

const normalizeTvShow = (s) => ({
  id: s.id,
  title: s.title ?? s.name,
  firstAirDate: s.firstAirDate ?? null,
  rating: s.rating ?? s.voteAverage ?? 0,
  posterUrl: s.posterUrl || null,
  backdropUrl: s.backdropUrl || null,
  genres: s.genres || [],
  description: s.description || s.overview || "",
  isPremium: s.isPremium ?? false,
  trailerVideoUrl: s.trailerVideoUrl || null,
  isTvShow: true,
});

const extractItems = (data) =>
  Array.isArray(data)
    ? data
    : (data?.items ??
      data?.movies ??
      data?.tvShows ??
      data?.data?.items ??
      data?.data ??
      []);

const MONTH_LABELS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

const monthKeyOf = (item) => {
  const raw = item.releaseDate || item.firstAirDate;
  if (!raw) return "unknown";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "unknown";
  return `${d.getFullYear()}-${d.getMonth()}`;
};

const monthLabelOf = (key) => {
  if (key === "unknown") return "Chưa xác định lịch chiếu";
  const [year, month] = key.split("-").map(Number);
  return `${MONTH_LABELS[month]}, ${year}`;
};

const TABS = [
  { value: "all", label: "Tất Cả", icon: CalendarClock },
  { value: "movie", label: "Phim", icon: Film },
  { value: "tv", label: "TV Series", icon: Tv },
];

function FilterTabs({ active, onChange, counts, isMobile }) {
  return (
    <div
      role="tablist"
      style={{
        display: "inline-flex",
        gap: 4,
        padding: 3,
        borderRadius: 10,
        background: C.surface,
        border: `1px solid ${C.border}`,
        width: "fit-content", // Giúp tab ôm trọn vừa vặn
        maxWidth: "100%",
        overflowX: "auto",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.value;
        const Icon = tab.icon;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: isMobile ? "6px 10px" : "8px 16px",
              borderRadius: 7,
              border: "none",
              cursor: "pointer",
              background: "transparent",
              fontFamily: FONT_BODY,
              fontSize: isMobile ? 11.5 : 13,
              fontWeight: 700,
              color: isActive ? C.bg : C.textSub,
              transition: "color 0.25s ease",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {isActive && (
              <motion.div
                layoutId="comingsoon-tab-pill"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 7,
                  background: ACCENT,
                  zIndex: 0,
                }}
              />
            )}
            <span
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Icon size={isMobile ? 12 : 13} strokeWidth={2.5} />
              {tab.label}
              <span style={{ fontSize: 10.5, fontWeight: 700, opacity: 0.85 }}>
                {counts[tab.value] ?? 0}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

const StateNotice = ({ icon: Icon, title, description, onRetry }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      padding: "60px 20px",
    }}
  >
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: "50%",
        border: `1px solid ${C.borderMid}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
      }}
    >
      <Icon size={20} color={C.textSub} strokeWidth={1.5} />
    </div>
    <h3
      style={{
        fontFamily: FONT_DISPLAY,
        fontSize: 16,
        fontWeight: 700,
        color: C.text,
        marginBottom: 8,
      }}
    >
      {title}
    </h3>
    <p
      style={{
        fontFamily: FONT_BODY,
        fontSize: 13,
        color: C.textSub,
        lineHeight: 1.5,
        maxWidth: 360,
        marginBottom: onRetry ? 20 : 0,
      }}
    >
      {description}
    </p>
    {onRetry && (
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        onClick={onRetry}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 22px",
          borderRadius: 6,
          background: C.accent,
          border: "none",
          cursor: "pointer",
          fontFamily: FONT_BODY,
          fontSize: 13,
          fontWeight: 700,
          color: "#ffffff",
        }}
      >
        <RotateCcw size={13} />
        Thử lại
      </motion.button>
    )}
  </div>
);

function MonthGroup({ monthKey, items, index, isMobile }) {
  return (
    <SectionReveal variant="fade" delay={Math.min(index * 0.05, 0.3)}>
      <div style={{ marginBottom: isMobile ? 28 : 40 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: isMobile ? 14 : 18,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: ACCENT,
              flexShrink: 0,
            }}
          />
          <h3
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: isMobile ? 13 : 15,
              fontWeight: 700,
              letterSpacing: "0.02em",
              color: C.text,
              margin: 0,
            }}
          >
            {monthLabelOf(monthKey)}
          </h3>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        {/* Grid phim: 2 cột trên mobile, co giãn tự động trên desktop */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(2, 1fr)"
              : "repeat(auto-fill, minmax(180px, 1fr))",
            gap: isMobile ? 10 : 18,
            rowGap: isMobile ? 16 : 24,
          }}
        >
          {items.map((item) => (
            <div
              key={`${item.isTvShow ? "tv" : "mv"}-${item.id}`}
              style={{ width: "100%" }}
            >
              <ComingSoonCard item={item} accentColor={ACCENT} />
            </div>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}

export default function ComingSoonPage() {
  const isMobile = useIsMobile();
  const [status, setStatus] = useState("loading");
  const [allItems, setAllItems] = useState([]);
  const [tab, setTab] = useState("all");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [moviesRes, tvRes] = await Promise.all([
        movieService.getMovies({
          isUpcoming: true,
          sortBy: "releaseDate",
          sortDesc: false,
          pageSize: 100,
        }),
        tvShowService
          .getTvShows({
            isUpcoming: true,
            sortBy: "firstAirDate",
            sortDesc: false,
            pageSize: 100,
          })
          .catch(() => []),
      ]);

      const movies = extractItems(moviesRes).map(normalizeMovie);
      const tvShows = extractItems(tvRes).map(normalizeTvShow);
      const merged = sortComingSoonMovies([...movies, ...tvShows]);

      if (!merged.length) {
        setStatus("empty");
        return;
      }

      setAllItems(merged);
      setStatus("ready");
    } catch (err) {
      console.error("[ComingSoonPage] load error:", err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      all: allItems.length,
      movie: allItems.filter((i) => !i.isTvShow).length,
      tv: allItems.filter((i) => i.isTvShow).length,
    }),
    [allItems],
  );

  const filtered = useMemo(() => {
    if (tab === "movie") return allItems.filter((i) => !i.isTvShow);
    if (tab === "tv") return allItems.filter((i) => i.isTvShow);
    return allItems;
  }, [allItems, tab]);

  const featured = filtered[0] || null;
  const rest = featured ? filtered.slice(1) : [];

  const grouped = useMemo(() => {
    const map = new Map();
    rest.forEach((item) => {
      const key = monthKeyOf(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries());
  }, [rest]);

  return (
    <>
      <AnimatePresence>
        {status === "loading" && <LoadingScreen key="loading-screen" />}
      </AnimatePresence>

      {status !== "loading" && (
        <>
          <style>{GOOGLE_FONTS}</style>

          <div style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
            <div
              style={{
                maxWidth: 1280,
                margin: "0 auto",
                width: "100%",
                padding: isMobile ? "80px 14px 60px" : "112px 48px 100px",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 8,
                }}
              >
                <BackButton />
              </div>

              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  display: "flex",
                  alignItems: isMobile ? "flex-start" : "flex-end", // Tránh giãn dài toàn màn hình
                  justifyContent: "space-between",
                  flexDirection: isMobile ? "column" : "row",
                  gap: isMobile ? 12 : 0,
                  margin: isMobile ? "6px 0 20px" : "8px 0 36px",
                }}
              >
                <div>
                  <h1
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: isMobile ? 24 : 36,
                      fontWeight: 800,
                      color: C.text,
                      letterSpacing: "-0.01em",
                      margin: 0,
                    }}
                  >
                    Phim Sắp Chiếu
                  </h1>
                  <p
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize: isMobile ? 12 : 13,
                      color: C.textSub,
                      margin: "6px 0 0",
                    }}
                  >
                    Cập nhật những tựa phim &amp; series sắp ra mắt, đừng bỏ lỡ.
                  </p>
                </div>

                {status === "ready" && (
                  <FilterTabs
                    active={tab}
                    onChange={setTab}
                    counts={counts}
                    isMobile={isMobile}
                  />
                )}
              </motion.div>

              {/* Content */}
              {status === "error" && (
                <StateNotice
                  icon={Inbox}
                  title="Không tải được dữ liệu"
                  description="Đã có lỗi xảy ra khi tải danh sách phim sắp chiếu. Vui lòng thử lại."
                  onRetry={load}
                />
              )}

              {status === "empty" && (
                <StateNotice
                  icon={CalendarClock}
                  title="Chưa có phim sắp chiếu"
                  description="Hiện chưa có tựa phim hoặc series nào được lên lịch."
                />
              )}

              {status === "ready" && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28 }}
                  >
                    {featured && (
                      <ComingSoonFeatured
                        item={featured}
                        accentColor={ACCENT}
                      />
                    )}

                    {grouped.length > 0
                      ? grouped.map(([monthKey, items], i) => (
                          <MonthGroup
                            key={monthKey}
                            monthKey={monthKey}
                            items={items}
                            index={i}
                            isMobile={isMobile}
                          />
                        ))
                      : !featured && (
                          <StateNotice
                            icon={CalendarClock}
                            title="Không có kết quả"
                            description="Không tìm thấy nội dung phù hợp với bộ lọc hiện tại."
                          />
                        )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
