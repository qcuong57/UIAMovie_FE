// src/components/admin/dashboard/UserChartCards.jsx
import React, { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { T, ACCENT2, ACCENT5, FONT_BODY as FONT } from "../../../context/adminTokens";
import { AXIS_TICK, ChartTooltip } from "./ChartComponents";
import { Card, Paginated } from "./Card";
import { UserRow } from "./UserRow";

// ── Tăng trưởng người dùng ────────────────────────────────────────────────────
export const UserGrowthCard = ({ userGrowth, loading, error, onRetry }) => (
  <Card
    title="Tăng trưởng người dùng"
    subtitle="6 tháng gần nhất"
    loading={loading}
    error={error}
    onRetry={onRetry}
    skeletonRows={5}
    isEmpty={!userGrowth.some((m) => m.cumulative > 0)}
    emptyText="Chưa có người dùng đăng ký"
  >
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={userGrowth} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={ACCENT5} stopOpacity={0.25} />
            <stop offset="95%" stopColor={ACCENT5} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={ACCENT2} stopOpacity={0.2} />
            <stop offset="95%" stopColor={ACCENT2} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
        <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} />
        <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontFamily: FONT, fontSize: 12, paddingTop: 8 }} />
        <Area type="monotone" dataKey="cumulative" name="Tổng tích luỹ" stroke={ACCENT5} strokeWidth={2} fill="url(#userGrad)" />
        <Area type="monotone" dataKey="new" name="Mới mỗi tháng" stroke={ACCENT2} strokeWidth={2} fill="url(#newGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  </Card>
);

// ── Danh sách người dùng (mới đăng ký / hoạt động) ────────────────────────────
export const UserListCard = ({ recentUsers, activeUsers, loading, error, onRetry }) => {
  const [tab, setTab] = useState("recent");
  return (
    <Card
      title="Người dùng"
      loading={loading}
      error={error}
      onRetry={onRetry}
      skeletonRows={6}
      tabs={[
        { key: "recent", label: "Mới đăng ký", count: recentUsers.length },
        { key: "active", label: "Hoạt động", count: activeUsers.length },
      ]}
      activeTab={tab}
      onTabChange={setTab}
    >
      <Paginated
        key={tab}
        items={tab === "recent" ? recentUsers : activeUsers}
        pageSize={6}
        renderItem={(user, i) => <UserRow key={user.id ?? i} user={user} index={i} />}
      />
    </Card>
  );
};
