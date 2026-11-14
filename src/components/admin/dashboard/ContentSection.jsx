// src/components/admin/dashboard/ContentSection.jsx
import React from "react";
import { AlertTriangle, Crown, Film, Tv } from "lucide-react";
import { ACCENT, ACCENT4 } from "../../../context/adminTokens";
import { useDashboardContent } from "../../../hooks/useAdminDashboard";
import { nf } from "../../../helper/dashboardStats";
import { Card } from "./Card";
import { HBarChart } from "./ChartComponents";
import { KpiGrid } from "./StatCard";
import { ContentCard } from "./ContentCard";
import { GenreDonutCard } from "./GenreDonutCard";

const WARN = "#D97706";

export const ContentSection = () => {
  const c = useDashboardContent();
  const state = { loading: c.isPending, error: c.isError, onRetry: c.refetch };
  const missingTotal = c.missingMovieCount + c.missingShowCount;

  const kpis = [
    { label: "Phim", value: nf(c.totalMovies), hint: "trong hệ thống", icon: Film, color: ACCENT },
    { label: "TV Show", value: nf(c.totalTvShows), hint: "trong hệ thống", icon: Tv, color: ACCENT4 },
    {
      label: "Premium",
      value: nf(c.moviePremiumCount + c.showPremiumCount),
      hint: `${c.moviePremiumCount} phim · ${c.showPremiumCount} show`,
      icon: Crown,
      color: "#7C3AED",
    },
    {
      label: "Cần bổ sung",
      value: nf(missingTotal),
      hint: "thiếu poster hoặc video",
      icon: AlertTriangle,
      color: WARN,
    },
  ];

  return (
    <div className="dash-stack">
      <KpiGrid items={kpis} loading={c.isPending} />

      <div className="dg dg--3-2">
        <Card
          title="Phân bố thể loại"
          subtitle={`${c.genreChart.length} thể loại nhiều nội dung nhất`}
          isEmpty={c.genreChart.length === 0}
          {...state}
        >
          <HBarChart data={c.genreChart} name="Nội dung" />
        </Card>

        <Card
          title="Trạng thái TV Show"
          subtitle={`${nf(c.showCount)} show đã tải`}
          isEmpty={c.showStatusChart.length === 0}
          emptyText="Chưa có dữ liệu TV Show"
          {...state}
        >
          <HBarChart data={c.showStatusChart} name="Show" />
        </Card>
      </div>

      <div className="dg dg--3">
        <ContentCard
          title="Phim"
          items={c.movies}
          trending={c.trendingMovies}
          missing={c.missingMovies}
          isShow={false}
          {...state}
        />
        <ContentCard
          title="TV Show"
          items={c.tvShows}
          trending={c.trendingShows}
          missing={c.missingShows}
          isShow
          {...state}
        />
        <GenreDonutCard
          donutSlices={c.donutSlices}
          movieCount={c.movieCount}
          showCount={c.showCount}
          moviePremiumCount={c.moviePremiumCount}
          showPremiumCount={c.showPremiumCount}
          {...state}
        />
      </div>
    </div>
  );
};
