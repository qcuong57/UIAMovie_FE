// src/components/admin/dashboard/ViewStatsSection.jsx
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import {
  T, ACCENT, ACCENT2, ACCENT4, PALETTE, FONT_BODY as FONT, FONT_TITLE,
} from "../../../context/adminTokens";
import { ChartTooltip } from "./ChartComponents";
import { Spin, Empty, GhostBtn } from "./DashboardPrimitives";
import { Card } from "./Card";
import { StatCard } from "./StatCard";
import { useViewStats } from "./useViewStats";

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

const nf = (n) => Number(n ?? 0).toLocaleString("vi-VN");

// "2026-10-08" → "08/10" · "2026-10" → "T10/26" · còn lại giữ nguyên
const fmtPeriod = (p = "") => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(p)) return `${p.slice(8)}/${p.slice(5, 7)}`;
  if (/^\d{4}-\d{2}$/.test(p)) return `T${p.slice(5)}/${p.slice(2, 4)}`;
  return p;
};

const pctChange = (cur, prev) =>
  prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0;

const tick = { fontFamily: FONT, fontSize: 9.5, fill: T.textMuted };

// ── Toolbar ────────────────────────────────────────────────────────────────────
const Toolbar = ({ granularity, setGranularity, contentType, setContentType, onReload, loading }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 14 }}>
    <div style={{ display: "flex", gap: 6 }}>
      {GRANULARITY.map((g) => (
        <GhostBtn key={g.key} active={granularity === g.key} onClick={() => setGranularity(g.key)}>
          {g.label}
        </GhostBtn>
      ))}
    </div>
    <div style={{ width: 1, height: 22, background: T.border }} />
    <div style={{ display: "flex", gap: 6 }}>
      {CONTENT.map((c) => (
        <GhostBtn key={c.key} active={contentType === c.key} onClick={() => setContentType(c.key)}>
          {c.label}
        </GhostBtn>
      ))}
    </div>
    <div style={{ marginLeft: "auto" }}>
      <GhostBtn onClick={onReload}>{loading ? "Đang tải…" : "↻ Làm mới"}</GhostBtn>
    </div>
  </div>
);

// ── Trend chart ────────────────────────────────────────────────────────────────
const ViewTrendCard = ({ points, from, to, loading }) => (
  <Card
    title="Xu hướng lượt xem"
    subtitle={from && to ? `${from} → ${to}` : undefined}
  >
    {loading ? <Spin /> : points.length === 0 ? <Empty /> : (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={points} margin={{ top: 8, right: -12, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
          <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} minTickGap={16} />
          {/* Trục trái: lượt xem + user. Trục phải riêng cho giờ xem (thường nhỏ hơn nhiều) */}
          <YAxis yAxisId="left" tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis yAxisId="right" orientation="right" tick={tick} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontFamily: FONT, fontSize: 11, paddingTop: 8 }} />
          <Line yAxisId="left" type="monotone" dataKey="views" name="Lượt xem" stroke={ACCENT} strokeWidth={2.5}
                dot={points.length > 40 ? false : { r: 3, fill: ACCENT }} activeDot={{ r: 5 }} />
          <Line yAxisId="left" type="monotone" dataKey="uniqueUsers" name="User (đăng nhập)" stroke={ACCENT4} strokeWidth={2.5}
                dot={points.length > 40 ? false : { r: 3, fill: ACCENT4 }} activeDot={{ r: 5 }} />
          <Line yAxisId="right" type="monotone" dataKey="watchHours" name="Giờ xem" stroke={ACCENT2} strokeWidth={2}
                strokeDasharray="4 3" dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    )}
  </Card>
);

// ── Top content ────────────────────────────────────────────────────────────────
const TopContentCard = ({ top, loading, error }) => (
  <Card title="Xem nhiều nhất" subtitle="Theo lượt xem đã tính" noPad>
    <div style={{ padding: "4px 20px 12px" }}>
      {loading ? <Spin /> : error ? <Empty text="Không tải được danh sách xem nhiều nhất" /> : top.length === 0 ? <Empty text="Chưa có lượt xem" /> : top.map((it, i) => {
        const isShow = it.contentType === "tvshow";
        const col = isShow ? ACCENT4 : ACCENT;
        return (
          <motion.div
            key={`${it.contentType}-${it.id}`}
            initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 0", borderBottom: `1px solid ${T.border}` }}
          >
            <span style={{ fontFamily: FONT_TITLE, fontSize: 13, fontWeight: 800, width: 18, textAlign: "center",
                           color: i < 3 ? col : T.textMuted, flexShrink: 0 }}>{i + 1}</span>
            <div style={{ width: 30, height: 44, borderRadius: 4, overflow: "hidden", flexShrink: 0,
                          background: T.bg, border: `1px solid ${T.border}` }}>
              {it.posterUrl && (
                <img src={it.posterUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                     onError={(e) => { e.target.style.display = "none"; }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: FONT_TITLE, fontSize: 12, fontWeight: 700, color: T.text, margin: 0,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</p>
              <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, margin: "2px 0 0" }}>
                {nf(it.watchHours)} giờ · {nf(it.uniqueUsers)} user
                {it.estimatedViews != null && ` · ~${nf(it.estimatedViews)} lượt/runtime`}
              </p>
            </div>
            <span style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 700, flexShrink: 0, color: col,
                           background: `${col}15`, border: `1px solid ${col}30`, padding: "2px 7px", borderRadius: 99 }}>
              {nf(it.views)} views
            </span>
          </motion.div>
        );
      })}
    </div>
  </Card>
);

// ── Genre bar ──────────────────────────────────────────────────────────────────
const GenreViewsCard = ({ genres, loading, error }) => {
  const data = useMemo(
    () => genres.slice(0, 8).map((g, i) => ({ label: g.share != null ? `${g.name} · ${g.share}%` : g.name, views: g.views, watchHours: g.watchHours, color: PALETTE[i % PALETTE.length] })),
    [genres],
  );
  return (
    <Card title="Lượt xem theo thể loại" subtitle="% = tỷ lệ trên tổng lượt xem; phim nhiều thể loại tính cho từng thể loại nên tổng có thể >100%">
      {loading ? <Spin /> : error ? <Empty text="Không tải được thống kê thể loại" /> : data.length === 0 ? <Empty /> : (
        <ResponsiveContainer width="100%" height={Math.max(160, data.length * 28)}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }} barCategoryGap="22%">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
            <XAxis type="number" tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="label" width={118} tick={tick} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Bar dataKey="views" name="Lượt xem" radius={[0, 4, 4, 0]}>
              {data.map((d) => <Cell key={d.label} fill={d.color} fillOpacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

// ── Section ────────────────────────────────────────────────────────────────────
export const ViewStatsSection = ({ reloadKey = 0 }) => {
  const [granularity, setGranularity] = useState("day");
  const [contentType, setContentType] = useState("all");
  const { overview, top, genres, loading, error, topError, genresError, reload } =
    useViewStats({ granularity, contentType, reloadKey });

  const points = useMemo(
    () => (overview?.points ?? []).map((p) => ({ ...p, label: fmtPeriod(p.period) })),
    [overview],
  );

  // Kỳ cuối (hôm nay / tuần này...) chưa kết thúc nên luôn trông như "giảm".
  // So 2 kỳ đã hoàn thành gần nhất với nhau; ít hơn 3 kỳ thì không hiện xu hướng.
  const last = points.length >= 3 ? points[points.length - 2] : null;
  const prev = points.length >= 3 ? points[points.length - 3] : null;
  const cmpNote = last && prev ? ` · ${last.label} so với ${prev.label}` : "";
  const totalSessions = points.reduce((s, p) => s + p.sessions, 0);
  const totalGuest = points.reduce((s, p) => s + p.guestSessions, 0);
  const guestPct = totalSessions ? Math.round((totalGuest / totalSessions) * 100) : 0;

  const kpis = [
    { label: "Tổng lượt xem", value: nf(overview?.totalViews), sub: `${nf(totalSessions)} phiên xem${cmpNote}`, featured: true,
      trend: prev ? pctChange(last.views, prev.views) : undefined },
    { label: "Giờ xem", value: nf(overview?.totalWatchHours), sub: `tổng thời lượng${cmpNote}`, accentColor: ACCENT4,
      trend: prev ? pctChange(last.watchHours, prev.watchHours) : undefined },
    { label: "User đăng nhập", value: nf(overview?.totalUniqueUsers), sub: "distinct trong khoảng chọn", accentColor: ACCENT2 },
    { label: "Khách (guest)", value: `${guestPct}%`, sub: `${nf(totalGuest)} phiên chưa đăng nhập` },
  ].map((k, i) => ({ ...k, index: i }));

  return (
    <div>
      <Toolbar {...{ granularity, setGranularity, contentType, setContentType }} onReload={reload} loading={loading} />

      {error && (
        <p style={{ fontFamily: FONT, fontSize: 12.5, color: "#DC2626", marginBottom: 12 }}>
          Không tải được thống kê lượt xem. Kiểm tra endpoint /api/admin/view-stats.
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 16 }}>
        {kpis.map((k) => <StatCard key={k.label} {...k} loading={loading} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
        <ViewTrendCard points={points} from={overview?.from} to={overview?.to} loading={loading} />
        <GenreViewsCard genres={genres} loading={loading} error={genresError} />
      </div>

      <TopContentCard top={top} loading={loading} error={topError} />
    </div>
  );
};