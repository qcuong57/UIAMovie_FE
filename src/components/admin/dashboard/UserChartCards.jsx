// src/components/admin/dashboard/UserChartCards.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

import {
  T, ACCENT2, ACCENT5, FONT_BODY as FONT,
} from '../../../context/adminTokens';

import { ChartTooltip } from './ChartComponents';
import { Spin, Empty } from './DashboardPrimitives';
import { Card, Paginated } from './Card';
import { UserRow } from './UserRow';

// ── User Growth Area Chart Card ────────────────────────────────────────────────
export const UserGrowthCard = ({ userGrowth, loading }) => {
  const tick = { fontFamily: FONT, fontSize: 9.5, fill: T.textMuted };
  const hasData = userGrowth.some((m) => m.cumulative > 0);

  return (
    <Card title="Tăng trưởng người dùng" subtitle="6 tháng gần nhất">
      {loading ? (
        <Spin />
      ) : hasData ? (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart
            data={userGrowth}
            margin={{ top: 8, right: 4, left: -28, bottom: 0 }}
          >
            <defs>
              <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={ACCENT5} stopOpacity={0.25} />
                <stop offset="95%" stopColor={ACCENT5} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={ACCENT2} stopOpacity={0.2} />
                <stop offset="95%" stopColor={ACCENT2} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
            <XAxis dataKey="month" tick={tick} axisLine={false} tickLine={false} />
            <YAxis tick={tick} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              iconSize={8} iconType="circle"
              wrapperStyle={{ fontFamily: FONT, fontSize: 11, paddingTop: 8 }}
            />
            <Area
              type="monotone" dataKey="cumulative" name="Tổng tích luỹ"
              stroke={ACCENT5} strokeWidth={2} fill="url(#userGrad)"
            />
            <Area
              type="monotone" dataKey="new" name="Mới mỗi tháng"
              stroke={ACCENT2} strokeWidth={2} fill="url(#newGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty text="Chưa có dữ liệu users (API userService chưa kết nối)" />
        </div>
      )}
    </Card>
  );
};

// ── User List Card (recent / active tabs) ─────────────────────────────────────
export const UserListCard = ({ recentUsers, activeUsers, loading, userTab, setUserTab }) => (
  <Card
    title="Người dùng"
    noPad
    tabs={[
      { key: 'recent', label: 'Mới đăng ký', count: recentUsers.length },
      { key: 'active', label: 'Hoạt động',   count: activeUsers.length },
    ]}
    activeTab={userTab}
    onTabChange={setUserTab}
  >
    <div style={{ padding: '4px 20px 12px' }}>
      {loading ? (
        <Spin />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={userTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Paginated
              items={userTab === 'recent' ? recentUsers : activeUsers}
              pageSize={6}
              renderItem={(user, i) => (
                <UserRow key={user.id ?? i} user={user} index={i} />
              )}
            />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  </Card>
);