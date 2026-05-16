// src/pages/admin/AdminDashboard.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import {
  T,
  ACCENT,
  ACCENT2,
  ACCENT3,
  ACCENT4,
  ACCENT5,
  PALETTE,
  FONT_BODY as FONT,
  FONT_TITLE,
  DASHBOARD_GLOBAL_CSS,
} from "../../context/adminTokens";

import {
  buildGenreFreq,
  buildMonthlyReviewTrend,
  buildUserGrowth,
  buildRatingDist,
  buildTopReviewed,
  hasVideoType,
  computeMissingFlags,
} from "../../helper/format";

import { useDashboardData } from "../../components/admin/dashboard/useDashboardData";
import {
  StatCard,
  SectionHeader,
} from "../../components/admin/dashboard/StatCard";
import { ChartTooltip } from "../../components/admin/dashboard/ChartComponents";
import {
  Spin,
  Empty,
} from "../../components/admin/dashboard/DashboardPrimitives";
import { Card } from "../../components/admin/dashboard/Card";
import { ContentCard } from "../../components/admin/dashboard/ContentCard";
import { GenreDonutCard } from "../../components/admin/dashboard/GenreDonutCard";
import {
  UserGrowthCard,
  UserListCard,
} from "../../components/admin/dashboard/UserChartCards";
import {
  ReviewTrendCard,
  RatingDistCard,
  SentimentDonutCard,
  ReviewListCard,
  TopReviewedCard,
} from "../../components/admin/dashboard/ReviewChartCards";

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const {
    movies,
    tvShows,
    trendingMovies,
    trendingShows,
    genres,
    users,
    reviews,
    loading,
  } = useDashboardData();

  // ── Derived: Content ────────────────────────────────────────────────────────
  const missingMovies = movies
    .filter(
      (m) =>
        !m.posterUrl ||
        !hasVideoType(m.videos, "main") ||
        !hasVideoType(m.videos, "trailer"),
    )
    .map((m) => computeMissingFlags(m, false))
    .slice(0, 50);

  const missingShows = tvShows
    .filter((s) => !s.posterUrl || !hasVideoType(s.videos, "trailer"))
    .map((s) => computeMissingFlags(s, true))
    .slice(0, 50);

  const mergedGenreFreq = { ...buildGenreFreq(movies) };
  Object.entries(buildGenreFreq(tvShows)).forEach(([k, v]) => {
    mergedGenreFreq[k] = (mergedGenreFreq[k] || 0) + v;
  });

  const finalGenreFreq = Object.keys(mergedGenreFreq).length
    ? mergedGenreFreq
    : Object.fromEntries(
        genres.map((g) => [g.name ?? String(g), g.movieCount ?? 0]),
      );

  const genreChart = Object.entries(finalGenreFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([label, value], i) => ({
      label,
      value,
      color: PALETTE[i % PALETTE.length],
    }));

  const donutSlices = genreChart.slice(0, 6);

  const showStatusChart = Object.entries(
    tvShows.reduce((acc, s) => {
      const st = s.status ?? "Unknown";
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({
      label:
        label === "Returning Series"
          ? "Đang chiếu"
          : label === "Ended"
            ? "Kết thúc"
            : label,
      value,
      color: PALETTE[i % PALETTE.length],
    }));

  const moviePremiumCount = movies.filter((m) => m.isPremium).length;
  const showPremiumCount = tvShows.filter((s) => s.isPremium).length;

  // ── Derived: Users ──────────────────────────────────────────────────────────
  const totalUsers = users.length;
  const premiumUsers = users.filter((u) => u.subscriptionType).length;
  const activeToday = users.filter((u) => {
    if (!u.lastLoginAt && !u.lastActiveAt) return false;
    return (
      Date.now() - new Date(u.lastLoginAt ?? u.lastActiveAt).getTime() <
      1000 * 60 * 60 * 24
    );
  }).length;

  const userGrowth = buildUserGrowth(users);
  const newThisMonth = userGrowth[userGrowth.length - 1]?.new ?? 0;
  const newLastMonth = userGrowth[userGrowth.length - 2]?.new ?? 0;
  const userGrowthPct =
    newLastMonth > 0
      ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
      : newThisMonth > 0
        ? 100
        : 0;

  const recentUsers = [...users]
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? b.joinedAt ?? 0) -
        new Date(a.createdAt ?? a.joinedAt ?? 0),
    )
    .slice(0, 50);
  const activeUsers = [...users]
    .filter((u) => u.lastLoginAt ?? u.lastActiveAt)
    .sort(
      (a, b) =>
        new Date(b.lastLoginAt ?? b.lastActiveAt) -
        new Date(a.lastLoginAt ?? a.lastActiveAt),
    )
    .slice(0, 50);

  // ── Derived: Reviews ────────────────────────────────────────────────────────
  const movieMap = React.useMemo(
    () => Object.fromEntries(movies.map((mv) => [mv.id, mv])),
    [movies],
  );
  const tvShowMap = React.useMemo(
    () => Object.fromEntries(tvShows.map((s) => [s.id, s])),
    [tvShows],
  );

  const enrichedReviews = React.useMemo(
    () =>
      reviews.map((r) => {
        if (r.movieId && movieMap[r.movieId]) {
          const mv = movieMap[r.movieId];
          return {
            ...r,
            movieTitle: mv.title,
            posterUrl: r.posterUrl ?? mv.posterUrl,
          };
        }
        if (r.tvShowId && tvShowMap[r.tvShowId]) {
          const s = tvShowMap[r.tvShowId];
          return {
            ...r,
            tvShowTitle: s.title ?? s.name,
            posterUrl: r.posterUrl ?? s.posterUrl,
          };
        }
        return r;
      }),
    [reviews, movieMap, tvShowMap],
  );

  const movieReviews = enrichedReviews.filter(
    (r) => !r.tvShowId && r.contentType !== "TvShow",
  );
  const tvReviews = enrichedReviews.filter(
    (r) => r.tvShowId || r.contentType === "TvShow",
  );
  const avgRating = (list) =>
    list.length
      ? (
          list.reduce((s, r) => s + (r.rating ?? r.score ?? r.stars ?? 0), 0) /
          list.length
        ).toFixed(2)
      : "—";
  const positiveReviews = enrichedReviews.filter(
    (r) => (r.rating ?? r.score ?? r.stars ?? 0) >= 7,
  ).length;
  const negativeReviews = enrichedReviews.filter(
    (r) => (r.rating ?? r.score ?? r.stars ?? 0) < 5,
  ).length;
  const positiveRatio =
    enrichedReviews.length > 0
      ? Math.round((positiveReviews / enrichedReviews.length) * 100)
      : 0;

  const ratingDist = buildRatingDist(enrichedReviews);
  const movieReviewTrend = buildMonthlyReviewTrend(enrichedReviews);
  const topReviewedMovies = buildTopReviewed(
    movieReviews,
    "movieId",
    "movieTitle",
  ).map((item) => ({
    ...item,
    posterUrl:
      movieReviews.find((r) => (r.movieId ?? r.contentId) === item.id)?.posterUrl ??
      movieMap[item.id]?.posterUrl ??
      null,
  }));

  const topReviewedShows = buildTopReviewed(
    tvReviews,
    "tvShowId",
    "tvShowTitle",
  ).map((item) => ({
    ...item,
    posterUrl:
      tvReviews.find((r) => (r.tvShowId ?? r.contentId) === item.id)?.posterUrl ??
      tvShowMap[item.id]?.posterUrl ??
      null,
  }));
  console.log(ratingDist);
  // ── UI State ────────────────────────────────────────────────────────────────
  const [donutTab, setDonutTab] = useState("genres");
  const [userTab, setUserTab] = useState("recent");
  const [reviewTab, setReviewTab] = useState("movie");

  // ── KPI configs ─────────────────────────────────────────────────────────────
  const CONTENT_KPI = [
    {
      label: "Tổng phim",
      value: movies.length,
      sub: "movies trong DB",
      featured: true,
      index: 0,
    },
    {
      label: "TV Shows",
      value: tvShows.length,
      sub: "series trong DB",
      accentColor: ACCENT4,
      index: 1,
    },
    {
      label: "Tổng nội dung",
      value: movies.length + tvShows.length,
      sub: "phim + series",
      index: 2,
    },
    {
      label: "Premium",
      value: moviePremiumCount + showPremiumCount,
      sub: `${moviePremiumCount} phim · ${showPremiumCount} show`,
      index: 3,
    },
  ];

  const USER_KPI = [
    {
      label: "Tổng Users",
      value: totalUsers,
      sub: "tài khoản đã đăng ký",
      accentColor: ACCENT5,
      index: 0,
      trend: userGrowthPct,
    },
    {
      label: "Premium Users",
      value: premiumUsers,
      sub: `${totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0}% tổng users`,
      accentColor: ACCENT4,
      index: 1,
    },
    {
      label: "Online hôm nay",
      value: activeToday,
      sub: "đăng nhập trong 24h",
      index: 2,
    },
    {
      label: "Mới tháng này",
      value: newThisMonth,
      sub: "user đăng ký tháng này",
      index: 3,
      trend: userGrowthPct,
    },
  ];

  const REVIEW_KPI = [
    {
      label: "Tổng đánh giá",
      value: enrichedReviews.length,
      sub: `${movieReviews.length} phim · ${tvReviews.length} show`,
      accentColor: ACCENT2,
      index: 0,
    },
    {
      label: "Đánh giá tốt",
      value: `${positiveRatio}%`,
      sub: `${positiveReviews} / ${reviews.length} đánh giá`,
      featured: true,
      index: 1,
    },
    {
      label: "TB phim",
      value: avgRating(movieReviews),
      sub: "điểm trung bình movies",
      accentColor: ACCENT,
      index: 2,
    },
    {
      label: "TB TV Show",
      value: avgRating(tvReviews),
      sub: "điểm trung bình TV Shows",
      accentColor: ACCENT4,
      index: 3,
    },
  ];

  const tick = { fontFamily: FONT, fontSize: 9.5, fill: T.textMuted };

  return (
    <div
      style={{ padding: "28px 28px 64px", maxWidth: 1400, fontFamily: FONT }}
    >
      <style>{DASHBOARD_GLOBAL_CSS}</style>

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24 }}
      >
        <p
          style={{
            fontFamily: FONT,
            fontSize: 13,
            color: T.textMuted,
            marginBottom: 2,
          }}
        >
          Chào mừng trở lại
        </p>
        <h2
          style={{
            fontFamily: FONT_TITLE,
            fontSize: 22,
            fontWeight: 800,
            color: T.text,
            letterSpacing: "-0.02em",
          }}
        >
          Tổng quan hệ thống
        </h2>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1 — NỘI DUNG                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <SectionHeader
        title="Nội dung"
        subtitle="Phim & TV Shows trong hệ thống"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 16,
        }}
      >
        {CONTENT_KPI.map((s) => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {/* Genre bar + TV Status */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 2fr",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <Card
          title="Phân bố thể loại"
          action={
            <span
              style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted }}
            >
              {genreChart.length} thể loại
            </span>
          }
        >
          {loading ? (
            <Spin />
          ) : genreChart.length > 0 ? (
            <div style={{ marginTop: 4 }}>
              <ResponsiveContainer width="100%" height={148}>
                <BarChart
                  data={genreChart}
                  barCategoryGap="28%"
                  margin={{ top: 8, right: 4, left: -28, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={T.border}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={tick}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    tickFormatter={(v) =>
                      v.length > 7 ? v.slice(0, 6) + "…" : v
                    }
                  />
                  <YAxis tick={tick} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  />
                  <Bar dataKey="value" name="Nội dung" radius={[4, 4, 0, 0]}>
                    {genreChart.map((d) => (
                      <Cell key={d.label} fill={d.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty />
          )}
        </Card>

        <Card
          title="Trạng thái TV Shows"
          action={
            <span
              style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted }}
            >
              {tvShows.length} shows
            </span>
          }
        >
          {loading ? (
            <Spin />
          ) : showStatusChart.length > 0 ? (
            <div style={{ marginTop: 4 }}>
              <ResponsiveContainer width="100%" height={148}>
                <BarChart
                  data={showStatusChart}
                  barCategoryGap="22%"
                  margin={{ top: 8, right: 4, left: -28, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={T.border}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={tick}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v.length > 8 ? v.slice(0, 7) + "…" : v
                    }
                  />
                  <YAxis tick={tick} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  />
                  <Bar dataKey="value" name="Shows" radius={[4, 4, 0, 0]}>
                    {showStatusChart.map((d) => (
                      <Cell key={d.label} fill={d.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty text="Chưa có dữ liệu TV Show" />
          )}
        </Card>
      </div>

      {/* Movies · TV Shows · Genre donut */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}
      >
        <ContentCard
          title="Phim"
          items={movies}
          trending={trendingMovies}
          missing={missingMovies}
          loading={loading}
          isShow={false}
        />
        <ContentCard
          title="TV Shows"
          items={tvShows}
          trending={trendingShows}
          missing={missingShows}
          loading={loading}
          isShow={true}
        />
        <GenreDonutCard
          donutSlices={donutSlices}
          movies={movies}
          tvShows={tvShows}
          moviePremiumCount={moviePremiumCount}
          showPremiumCount={showPremiumCount}
          donutTab={donutTab}
          setDonutTab={setDonutTab}
          loading={loading}
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2 — USERS                                                   */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <SectionHeader
        title="Người dùng"
        subtitle="Thống kê tài khoản & hoạt động"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 16,
        }}
      >
        {USER_KPI.map((s) => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 14 }}>
        <UserGrowthCard userGrowth={userGrowth} loading={loading} />
        <UserListCard
          recentUsers={recentUsers}
          activeUsers={activeUsers}
          loading={loading}
          userTab={userTab}
          setUserTab={setUserTab}
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3 — ĐÁNH GIÁ                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <SectionHeader
        title="Đánh giá người dùng"
        subtitle="Phân tích reviews phim & TV Shows"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 16,
        }}
      >
        {REVIEW_KPI.map((s) => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {/* Review charts row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <ReviewTrendCard
          movieReviewTrend={movieReviewTrend}
          loading={loading}
        />
        <RatingDistCard
          ratingDist={ratingDist}
          reviews={reviews}
          positiveRatio={positiveRatio}
          loading={loading}
        />
        <SentimentDonutCard
          positiveReviews={positiveReviews}
          negativeReviews={negativeReviews}
          totalReviews={enrichedReviews.length}
          loading={loading}
        />
      </div>

      {/* Review lists */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <ReviewListCard
          movieReviews={movieReviews}
          tvReviews={tvReviews}
          enrichedReviews={enrichedReviews}
          reviewTab={reviewTab}
          setReviewTab={setReviewTab}
          loading={loading}
        />
        <TopReviewedCard
          topReviewedMovies={topReviewedMovies}
          topReviewedShows={topReviewedShows}
          reviewTab={reviewTab}
          setReviewTab={setReviewTab}
          loading={loading}
        />
      </div>
    </div>
  );
}