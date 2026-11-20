// src/components/admin/dashboard/ReviewsSection.jsx
import React from "react";
import { Film, MessageSquare, ThumbsUp, Tv } from "lucide-react";
import { ACCENT, ACCENT2, ACCENT4 } from "../../../context/adminTokens";
import { useDashboardReviews } from "../../../hooks/admin/useAdminDashboard";
import { nf } from "../../../helper/dashboardStats";
import { KpiGrid } from "./StatCard";
import {
  RatingDistCard,
  ReviewListCard,
  ReviewTrendCard,
  SentimentDonutCard,
  TopReviewedCard,
} from "./ReviewChartCards";

export const ReviewsSection = () => {
  const r = useDashboardReviews();
  const state = { loading: r.isPending, error: r.isError, onRetry: r.refetch };

  const kpis = [
    {
      label: "Tổng đánh giá",
      value: nf(r.total),
      hint: `${nf(r.movieReviews.length)} phim · ${nf(r.tvReviews.length)} show`,
      icon: MessageSquare,
      color: ACCENT2,
    },
    {
      label: "Đánh giá tốt",
      value: `${r.positiveRatio}%`,
      hint: `${nf(r.positive)} / ${nf(r.total)} đánh giá từ 7 điểm`,
      icon: ThumbsUp,
      color: ACCENT,
    },
    { label: "Điểm TB phim", value: r.avgMovie, hint: "thang 10", icon: Film, color: ACCENT },
    { label: "Điểm TB TV Show", value: r.avgTv, hint: "thang 10", icon: Tv, color: ACCENT4 },
  ];

  return (
    <div className="dash-stack">
      <KpiGrid items={kpis} loading={r.isPending} />

      <div className="dg dg--2-1">
        <ReviewTrendCard trend={r.trend} {...state} />
        <RatingDistCard ratingDist={r.ratingDist} total={r.total} positiveRatio={r.positiveRatio} {...state} />
      </div>

      <div className="dg dg--2-1">
        <ReviewListCard
          allReviews={r.all}
          movieReviews={r.movieReviews}
          tvReviews={r.tvReviews}
          {...state}
        />
        <div className="dash-stack">
          <TopReviewedCard
            topReviewedMovies={r.topReviewedMovies}
            topReviewedShows={r.topReviewedShows}
            {...state}
          />
          <SentimentDonutCard positive={r.positive} neutral={r.neutral} negative={r.negative} {...state} />
        </div>
      </div>
    </div>
  );
};
