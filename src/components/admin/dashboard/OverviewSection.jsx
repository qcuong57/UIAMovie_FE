// src/components/admin/dashboard/OverviewSection.jsx
import React from "react";
import { CheckCircle2, ChevronRight, Clapperboard, Eye, Film, MessageSquare, Users } from "lucide-react";
import { T, ACCENT, ACCENT2, ACCENT4, ACCENT5, FONT_BODY as FONT } from "../../../context/adminTokens";
import {
  useDashboardContent,
  useDashboardReviews,
  useDashboardUsers,
  useViewOverview,
} from "../../../hooks/admin/useAdminDashboard";
import { nf } from "../../../helper/dashboardStats";
import { Card } from "./Card";
import { StatCard } from "./StatCard";
import { ViewTrendCard } from "./ViewStatsSection";

const WARN = "#D97706";
const NEGATIVE = "#DC2626";

// Khoảng mặc định của tab Tổng quan; trùng key với tab Lượt xem lúc mới mở → dùng chung cache.
const OVERVIEW_VIEWS = { granularity: "day", contentType: "all" };

// ── Việc cần xử lý: mỗi dòng dẫn thẳng tới tab chứa dữ liệu liên quan ─────────
const AttentionRow = ({ icon: Icon, color, text, count, onClick }) => (
  <button
    type="button"
    className="dash-focus"
    onClick={onClick}
    style={{
      display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
      padding: "11px 4px", background: "none", border: "none", borderBottom: `1px solid ${T.border}`,
      cursor: "pointer", fontFamily: FONT,
    }}
  >
    <span style={{ width: 30, height: 30, borderRadius: 8, background: `${color}14`, color, display: "grid", placeItems: "center", flexShrink: 0 }}>
      <Icon size={16} aria-hidden="true" />
    </span>
    <span style={{ flex: 1, fontSize: 13, color: T.text, lineHeight: 1.4 }}>{text}</span>
    <span style={{ fontSize: 12, fontWeight: 700, color, background: `${color}14`, padding: "1px 9px", borderRadius: 99 }}>
      {nf(count)}
    </span>
    <ChevronRight size={16} color={T.textMuted} aria-hidden="true" />
  </button>
);

export const OverviewSection = ({ onNavigate }) => {
  const content = useDashboardContent();
  const users = useDashboardUsers();
  const reviews = useDashboardReviews();
  const views = useViewOverview(OVERVIEW_VIEWS);

  const kpis = [
    {
      label: "Nội dung",
      value: nf(content.totalMovies + content.totalTvShows),
      hint: `${nf(content.totalMovies)} phim · ${nf(content.totalTvShows)} show`,
      icon: Film,
      color: ACCENT,
      loading: content.isPending,
    },
    {
      label: "Người dùng",
      value: nf(users.total),
      hint: `${nf(users.newThisMonth)} đăng ký tháng này`,
      delta: users.newGrowthPct,
      icon: Users,
      color: ACCENT5,
      loading: users.isPending,
    },
    {
      label: "Đánh giá",
      value: nf(reviews.total),
      hint: `${reviews.positiveRatio}% tích cực`,
      icon: MessageSquare,
      color: ACCENT2,
      loading: reviews.isPending,
    },
    {
      label: "Lượt xem",
      value: views.hasData ? nf(views.totalViews) : null,
      hint: `${nf(views.totalWatchHours)} giờ xem`,
      delta: views.viewsTrend,
      icon: Eye,
      color: ACCENT4,
      loading: views.isPending,
    },
  ];

  const attention = [
    { icon: Clapperboard, color: WARN, count: content.missingMovieCount, text: "Phim thiếu poster hoặc video", tab: "content" },
    { icon: Clapperboard, color: WARN, count: content.missingShowCount, text: "TV Show thiếu poster hoặc trailer", tab: "content" },
    { icon: MessageSquare, color: NEGATIVE, count: reviews.negative, text: "Đánh giá tiêu cực (dưới 5 điểm)", tab: "reviews" },
  ].filter((a) => a.count > 0);

  const attentionLoading = content.isPending || reviews.isPending;

  return (
    <div className="dash-stack">
      {/* Mỗi nguồn dữ liệu tải độc lập → từng thẻ tự hiện skeleton của riêng nó */}
      <div className="dg dg--4">
        {kpis.map((k) => <StatCard key={k.label} {...k} />)}
      </div>

      <div className="dg dg--2-1">
        <ViewTrendCard
          points={views.points}
          from={views.from}
          to={views.to}
          loading={views.isPending}
          error={views.isError && !views.hasData}
          onRetry={views.refetch}
        />
        <Card
          title="Cần xử lý"
          subtitle="Nhấn để mở chi tiết"
          loading={attentionLoading}
          error={content.isError && reviews.isError}
          onRetry={() => { content.refetch(); reviews.refetch(); }}
          skeletonRows={3}
        >
          {attention.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", fontFamily: FONT, fontSize: 13, color: T.textSub }}>
              <CheckCircle2 size={18} color={ACCENT} aria-hidden="true" />
              Không có việc nào cần xử lý
            </div>
          ) : (
            attention.map((a) => <AttentionRow key={a.text} {...a} onClick={() => onNavigate(a.tab)} />)
          )}
        </Card>
      </div>
    </div>
  );
};
