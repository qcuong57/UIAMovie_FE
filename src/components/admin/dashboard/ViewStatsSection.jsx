// src/components/admin/dashboard/ViewStatsSection.jsx
import React, { useMemo, useState } from "react";
import { Clock, Eye, UserCheck, UserX } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  T,
  ACCENT,
  ACCENT2,
  ACCENT4,
  PALETTE,
  FONT_BODY as FONT,
  FONT_TITLE,
} from "../../../context/adminTokens";
import {
  useViewGenres,
  useViewOverview,
  useViewTop,
} from "../../../hooks/admin/useAdminDashboard";
import { nf } from "../../../helper/dashboardStats";
import { useIsMobile } from "../../../hooks/common/useIsMobile";
import { AXIS_TICK, ChartTooltip, HBarChart } from "./ChartComponents";
import { Segmented } from "./DashboardPrimitives";
import { Card } from "./Card";
import { KpiGrid } from "./StatCard";

const GRANULARITY = [
  { key: "day", label: "Ngày" },
  { key: "week", label: "Tuần" },
  { key: "month", label: "Tháng" },
  { key: "quarter", label: "Quý" },
  { key: "year", label: "Năm" },
];
const CONTENT = [
  { key: "all", label: "Tất cả" },
  { key: "movie", label: "Phim" },
  { key: "tvshow", label: "TV Show" },
];

// ── Xu hướng lượt xem (dùng lại ở tab Tổng quan) ─────────────────────────────
export const ViewTrendCard = ({
  points,
  from,
  to,
  loading,
  error,
  onRetry,
  fetching,
}) => {
  const isMobile = useIsMobile();
  const dot = (color) => (points.length > 40 ? false : { r: 3, fill: color });
  return (
    <Card
      title="Xu hướng lượt xem"
      subtitle={from && to ? `${from} → ${to}` : undefined}
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={points.length === 0}
      skeletonRows={5}
      // Đang tải khoảng mới: giữ biểu đồ cũ nhưng mờ đi để người dùng biết dữ liệu chưa mới
      style={{ opacity: fetching ? 0.6 : 1, transition: "opacity .15s" }}
    >
      <ResponsiveContainer width="100%" height={isMobile ? 210 : 260}>
        <LineChart
          data={points}
          margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={T.border}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            minTickGap={16}
          />
          {/* Trục trái: lượt xem + user. Trục phải riêng cho giờ xem (thường nhỏ hơn nhiều) */}
          <YAxis
            yAxisId="left"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          {/* Mobile: ẩn trục phải (đường giờ xem vẫn vẽ, tooltip vẫn đọc được) để dành chỗ cho biểu đồ */}
          <YAxis
            yAxisId="right"
            hide={isMobile}
            orientation="right"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend
            iconSize={8}
            iconType="circle"
            wrapperStyle={{ fontFamily: FONT, fontSize: 12, paddingTop: 8 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="views"
            name="Lượt xem"
            stroke={ACCENT}
            strokeWidth={2.5}
            dot={dot(ACCENT)}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="uniqueUsers"
            name="Người dùng đăng nhập"
            stroke={ACCENT4}
            strokeWidth={2.5}
            dot={dot(ACCENT4)}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="watchHours"
            name="Giờ xem"
            stroke={ACCENT2}
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ── Xem nhiều nhất ────────────────────────────────────────────────────────────
const TopContentCard = ({ top, loading, error, onRetry }) => (
  <Card
    title="Xem nhiều nhất"
    subtitle="Theo lượt xem đã tính"
    loading={loading}
    error={error}
    onRetry={onRetry}
    isEmpty={top.length === 0}
    emptyText="Chưa có lượt xem"
    skeletonRows={6}
  >
    {top.map((it, i) => {
      const col = it.contentType === "tvshow" ? ACCENT4 : ACCENT;
      return (
        <div
          key={`${it.contentType}-${it.id}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 0",
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <span
            style={{
              fontFamily: FONT_TITLE,
              fontSize: 13,
              fontWeight: 800,
              width: 18,
              textAlign: "center",
              flexShrink: 0,
              color: i < 3 ? col : T.textMuted,
            }}
          >
            {i + 1}
          </span>
          <div
            style={{
              width: 30,
              height: 44,
              borderRadius: 4,
              overflow: "hidden",
              flexShrink: 0,
              background: T.bg,
              border: `1px solid ${T.border}`,
            }}
          >
            {it.posterUrl && (
              <img
                src={it.posterUrl}
                alt=""
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: FONT_TITLE,
                fontSize: 12.5,
                fontWeight: 700,
                color: T.text,
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {it.title}
            </p>
            <p
              style={{
                fontFamily: FONT,
                fontSize: 11.5,
                color: T.textMuted,
                margin: "2px 0 0",
              }}
            >
              {nf(it.watchHours)} giờ · {nf(it.uniqueUsers)} người dùng
              {it.estimatedViews != null &&
                ` · ~${nf(it.estimatedViews)} lượt theo thời lượng`}
            </p>
          </div>
          <span
            style={{
              fontFamily: FONT,
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
              color: col,
              background: `${col}15`,
              border: `1px solid ${col}30`,
              padding: "2px 8px",
              borderRadius: 99,
            }}
          >
            {nf(it.views)} lượt
          </span>
        </div>
      );
    })}
  </Card>
);

// ── Theo thể loại ─────────────────────────────────────────────────────────────
const GenreViewsCard = ({ genres, loading, error, onRetry }) => {
  const data = useMemo(
    () =>
      genres.slice(0, 8).map((g, i) => ({
        label: g.share != null ? `${g.name} · ${g.share}%` : g.name,
        value: g.views,
        color: PALETTE[i % PALETTE.length],
      })),
    [genres],
  );
  return (
    <Card
      title="Lượt xem theo thể loại"
      subtitle="Phim nhiều thể loại được tính cho từng thể loại nên tổng phần trăm có thể vượt 100%"
      loading={loading}
      error={error}
      onRetry={onRetry}
      isEmpty={data.length === 0}
      skeletonRows={6}
    >
      <HBarChart data={data} name="Lượt xem" labelWidth={128} />
    </Card>
  );
};

// ── Section ───────────────────────────────────────────────────────────────────
export const ViewStatsSection = () => {
  const [granularity, setGranularity] = useState("day");
  const [contentType, setContentType] = useState("all");

  const overview = useViewOverview({ granularity, contentType });
  const topQ = useViewTop({ contentType });
  const genresQ = useViewGenres({ contentType });

  const v = overview;
  const note = v.compareNote ? ` · ${v.compareNote}` : "";
  const ready = v.hasData;

  const kpis = [
    {
      label: "Tổng lượt xem",
      value: ready ? nf(v.totalViews) : null,
      hint: `${nf(v.sessions)} phiên xem${note}`,
      delta: v.viewsTrend,
      icon: Eye,
      color: ACCENT,
    },
    {
      label: "Giờ xem",
      value: ready ? nf(v.totalWatchHours) : null,
      hint: `tổng thời lượng${note}`,
      delta: v.hoursTrend,
      icon: Clock,
      color: ACCENT4,
    },
    {
      label: "Người dùng đăng nhập",
      value: ready ? nf(v.totalUniqueUsers) : null,
      hint: "khác nhau trong khoảng chọn",
      icon: UserCheck,
      color: ACCENT2,
    },
    {
      label: "Khách chưa đăng nhập",
      value: ready ? `${v.guestPct}%` : null,
      hint: `${nf(v.guestSessions)} phiên`,
      icon: UserX,
      color: T.textSub,
    },
  ];

  return (
    <div className="dash-stack">
      <div
        data-dash-filters=""
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}
      >
        <Segmented
          label="Đơn vị thời gian"
          options={GRANULARITY}
          value={granularity}
          onChange={setGranularity}
        />
        <Segmented
          label="Loại nội dung"
          options={CONTENT}
          value={contentType}
          onChange={setContentType}
        />
      </div>

      <KpiGrid items={kpis} loading={v.isPending} />

      <div className="dg dg--2-1">
        <ViewTrendCard
          points={v.points}
          from={v.from}
          to={v.to}
          loading={v.isPending}
          error={v.isError && !v.hasData}
          onRetry={v.refetch}
          fetching={v.isPlaceholder}
        />
        <GenreViewsCard
          genres={genresQ.genres}
          loading={genresQ.isPending}
          error={genresQ.isError}
          onRetry={genresQ.refetch}
        />
      </div>

      <TopContentCard
        top={topQ.top}
        loading={topQ.isPending}
        error={topQ.isError}
        onRetry={topQ.refetch}
      />
    </div>
  );
};