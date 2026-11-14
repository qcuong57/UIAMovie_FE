// src/components/admin/dashboard/ReviewChartCards.jsx
import React, { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  T, ACCENT, ACCENT3, ACCENT4, FONT_BODY as FONT, FONT_TITLE,
} from "../../../context/adminTokens";
import { AXIS_TICK, ChartTooltip, GenreDonut, StarDisplay } from "./ChartComponents";
import { Card, Paginated } from "./Card";
import { ReviewRow } from "./ReviewRow";

const NEGATIVE = "#DC2626";

// ── Xu hướng đánh giá ─────────────────────────────────────────────────────────
export const ReviewTrendCard = ({ trend, loading, error, onRetry }) => (
  <Card
    title="Xu hướng đánh giá"
    subtitle="Phim và TV Show — 6 tháng gần nhất"
    loading={loading}
    error={error}
    onRetry={onRetry}
    skeletonRows={5}
  >
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={trend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
        <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} />
        <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontFamily: FONT, fontSize: 12, paddingTop: 8 }} />
        <Line type="monotone" dataKey="movie" name="Phim" stroke={ACCENT} strokeWidth={2.5} dot={{ r: 3, fill: ACCENT }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="tvshow" name="TV Show" stroke={ACCENT4} strokeWidth={2.5} dot={{ r: 3, fill: ACCENT4 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  </Card>
);

// ── Phân bố số sao ────────────────────────────────────────────────────────────
const SENTIMENT_SUMMARY = (ratio) =>
  ratio >= 70
    ? { text: "Phản hồi rất tốt", color: ACCENT, bg: T.accentLight, border: "#c6e8d5" }
    : ratio >= 50
      ? { text: "Phản hồi trung bình", color: ACCENT3, bg: "#E0F2FE", border: "#BAE6FD" }
      : { text: "Cần cải thiện", color: NEGATIVE, bg: "#FEF2F2", border: "#FECACA" };

export const RatingDistCard = ({ ratingDist, total, positiveRatio, loading, error, onRetry }) => {
  const summary = SENTIMENT_SUMMARY(positiveRatio);
  return (
    <Card
      title="Phân bố số sao"
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={total === 0}
      emptyText="Chưa có đánh giá"
    >
      {ratingDist.map(({ label, value, star }) => {
        const pct = Math.round((value / (total || 1)) * 100);
        const barColor = star >= 4 ? ACCENT : star === 3 ? ACCENT3 : NEGATIVE;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: T.textSub, width: 34, textAlign: "right", flexShrink: 0 }}>
              {label}
            </span>
            <div style={{ flex: 1, height: 8, borderRadius: 99, background: T.bg, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: barColor, transition: "width .4s ease-out" }} />
            </div>
            <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, width: 34, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              {value}
            </span>
          </div>
        );
      })}
      <div style={{ marginTop: 12, padding: "9px 12px", borderRadius: 8, background: summary.bg, border: `1px solid ${summary.border}` }}>
        <p style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 700, margin: 0, color: summary.color }}>{summary.text}</p>
        <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, margin: "2px 0 0" }}>{positiveRatio}% đánh giá tích cực</p>
      </div>
    </Card>
  );
};

// ── Cảm xúc tổng quan ─────────────────────────────────────────────────────────
export const SentimentDonutCard = ({ positive, neutral, negative, loading, error, onRetry }) => {
  const slices = [
    { label: "Tích cực", value: positive, color: ACCENT },
    { label: "Trung bình", value: neutral, color: ACCENT3 },
    { label: "Tiêu cực", value: negative, color: NEGATIVE },
  ].filter((s) => s.value > 0);

  return (
    <Card
      title="Cảm xúc tổng quan"
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={slices.length === 0}
      emptyText="Chưa có đánh giá"
    >
      <GenreDonut slices={slices} />
    </Card>
  );
};

// ── Đánh giá gần đây ──────────────────────────────────────────────────────────
export const ReviewListCard = ({ movieReviews, tvReviews, allReviews, loading, error, onRetry }) => {
  const [tab, setTab] = useState("all");
  const lists = { all: allReviews, movie: movieReviews, tvshow: tvReviews };

  return (
    <Card
      title="Đánh giá gần đây"
      loading={loading}
      error={error}
      onRetry={onRetry}
      skeletonRows={5}
      tabs={[
        { key: "all", label: "Tất cả", count: allReviews.length },
        { key: "movie", label: "Phim", count: movieReviews.length },
        { key: "tvshow", label: "TV Show", count: tvReviews.length },
      ]}
      activeTab={tab}
      onTabChange={setTab}
    >
      <Paginated
        key={tab}
        items={lists[tab]}
        pageSize={5}
        emptyText="Chưa có đánh giá"
        renderItem={(r, i) => (
          <ReviewRow key={r.id ?? i} review={r} index={i} type={tab === "tvshow" || r.tvShowId ? "tvshow" : "movie"} />
        )}
      />
    </Card>
  );
};

// ── Được đánh giá nhiều nhất ──────────────────────────────────────────────────
export const TopReviewedCard = ({ topReviewedMovies, topReviewedShows, loading, error, onRetry }) => {
  const [tab, setTab] = useState("movies");
  const isShow = tab === "shows";
  const list = isShow ? topReviewedShows : topReviewedMovies;
  const accent = isShow ? ACCENT4 : ACCENT;

  return (
    <Card
      title="Được đánh giá nhiều nhất"
      loading={loading}
      error={error}
      onRetry={onRetry}
      skeletonRows={5}
      tabs={[
        { key: "movies", label: "Phim", count: topReviewedMovies.length },
        { key: "shows", label: "TV Show", count: topReviewedShows.length },
      ]}
      activeTab={tab}
      onTabChange={setTab}
    >
      {list.length === 0 ? (
        <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted, textAlign: "center", padding: "24px 0", margin: 0 }}>
          Chưa có đánh giá
        </p>
      ) : (
        list.map((item, i) => (
          <div key={item.id ?? i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{
              fontFamily: FONT_TITLE, fontSize: 13, fontWeight: 800, width: 18, textAlign: "center", flexShrink: 0,
              color: i < 3 ? accent : T.textMuted,
            }}>
              {i + 1}
            </span>
            <div style={{ width: 30, height: 44, borderRadius: 4, overflow: "hidden", flexShrink: 0, background: T.bgSub ?? T.bg, border: `1px solid ${T.border}` }}>
              {item.posterUrl && (
                <img
                  src={item.posterUrl}
                  alt=""
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: FONT_TITLE, fontSize: 12.5, fontWeight: 700, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.title}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                <StarDisplay rating={Number(item.avg)} size={10} />
                <span style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 700, color: "#F59E0B" }}>{item.avg}</span>
              </div>
            </div>
            <span style={{
              fontFamily: FONT, fontSize: 11, fontWeight: 700, flexShrink: 0, color: accent,
              background: `${accent}15`, padding: "2px 8px", borderRadius: 99, border: `1px solid ${accent}30`,
            }}>
              {item.count} đánh giá
            </span>
          </div>
        ))
      )}
    </Card>
  );
};
