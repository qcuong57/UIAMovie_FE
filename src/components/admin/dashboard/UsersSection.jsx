// src/components/admin/dashboard/UsersSection.jsx
import React from "react";
import { Activity, Crown, UserPlus, Users } from "lucide-react";
import { ACCENT, ACCENT2, ACCENT5 } from "../../../context/adminTokens";
import { useDashboardUsers } from "../../../hooks/admin/useAdminDashboard";
import { nf } from "../../../helper/dashboardStats";
import { KpiGrid } from "./StatCard";
import { UserGrowthCard, UserListCard } from "./UserChartCards";

export const UsersSection = () => {
  const u = useDashboardUsers();
  const state = { loading: u.isPending, error: u.isError, onRetry: u.refetch };

  const kpis = [
    { label: "Tổng người dùng", value: nf(u.total), hint: "tài khoản đã đăng ký", icon: Users, color: ACCENT5 },
    { label: "Premium", value: nf(u.premium), hint: `${u.premiumPct}% tổng người dùng`, icon: Crown, color: "#D97706" },
    { label: "Hoạt động 24 giờ", value: nf(u.activeToday), hint: "đăng nhập trong 24 giờ qua", icon: Activity, color: ACCENT },
    {
      label: "Đăng ký tháng này",
      value: nf(u.newThisMonth),
      hint: "so với cùng kỳ tháng trước",
      delta: u.newGrowthPct,
      icon: UserPlus,
      color: ACCENT2,
    },
  ];

  return (
    <div className="dash-stack">
      <KpiGrid items={kpis} loading={u.isPending} />
      <div className="dg dg--3-2">
        <UserGrowthCard userGrowth={u.growth} {...state} />
        <UserListCard recentUsers={u.recent} activeUsers={u.active} {...state} />
      </div>
    </div>
  );
};
