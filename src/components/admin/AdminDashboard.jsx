// src/pages/admin/AdminDashboard.jsx
import React, { useState } from "react";
import { Eye, Film, LayoutDashboard, MessageSquare, RefreshCw, Users } from "lucide-react";
import {
  T, ACCENT, FONT_BODY as FONT, FONT_TITLE, DASHBOARD_GLOBAL_CSS,
} from "../../context/adminTokens";
import { useDashboardRefresh } from "../../hooks/admin/useAdminDashboard";
import { useIsMobile } from "../../hooks/common/useIsMobile";
import { DASHBOARD_LAYOUT_CSS, GhostBtn } from "../../components/admin/dashboard/DashboardPrimitives";
import { OverviewSection } from "../../components/admin/dashboard/OverviewSection";
import { ContentSection } from "../../components/admin/dashboard/ContentSection";
import { UsersSection } from "../../components/admin/dashboard/UsersSection";
import { ReviewsSection } from "../../components/admin/dashboard/ReviewsSection";
import { ViewStatsSection } from "../../components/admin/dashboard/ViewStatsSection";

// Chỉ tab đang mở được mount → chỉ tải dữ liệu của tab đó; chuyển lại tab thì lấy từ cache.
const TABS = [
  { key: "overview", label: "Tổng quan", icon: LayoutDashboard, Panel: OverviewSection },
  { key: "content", label: "Nội dung", icon: Film, Panel: ContentSection },
  { key: "users", label: "Người dùng", icon: Users, Panel: UsersSection },
  { key: "reviews", label: "Đánh giá", icon: MessageSquare, Panel: ReviewsSection },
  { key: "views", label: "Lượt xem", icon: Eye, Panel: ViewStatsSection },
];

const fmtUpdated = (ts) =>
  ts ? `Cập nhật lúc ${new Date(ts).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}` : "Đang tải dữ liệu";

export default function AdminDashboard() {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("overview");
  const { refresh, isRefreshing, updatedAt } = useDashboardRefresh();
  const { Panel } = TABS.find((t) => t.key === tab);

  return (
    <div className="dash-root" style={{ maxWidth: 1400, fontFamily: FONT }}>
      <style>{DASHBOARD_GLOBAL_CSS}{DASHBOARD_LAYOUT_CSS}</style>

      {/* Header + tab: dính đầu trang để đổi mục hay làm mới mà không phải cuộn lên */}
      <header data-dash-head="" style={{
        position: "sticky", top: 0, zIndex: 5, background: T.bg,
        padding: isMobile ? "14px 16px 0" : "20px 28px 0", borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <h2 data-dash-title="" style={{ fontFamily: FONT_TITLE, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.02em", margin: 0 }}>
              Tổng quan hệ thống
            </h2>
            <p aria-live="polite" style={{ fontFamily: FONT, fontSize: 12.5, color: T.textMuted, margin: "2px 0 0" }}>
              {isRefreshing ? "Đang cập nhật…" : fmtUpdated(updatedAt)}
            </p>
          </div>
          <GhostBtn onClick={refresh} disabled={isRefreshing} label="Làm mới dữ liệu" style={{ padding: "8px 14px", minHeight: isMobile ? 40 : undefined }}>
            <RefreshCw size={14} aria-hidden="true" style={{ animation: isRefreshing ? "spin 0.8s linear infinite" : "none" }} />
            Làm mới
          </GhostBtn>
        </div>

        <nav role="tablist" aria-label="Mục dashboard" className="dash-scroll-x" style={{ display: "flex", gap: 4 }}>
          {TABS.map(({ key, label, icon: Icon }) => {
            const on = key === tab;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={on}
                className="dash-focus"
                data-dash-tab=""
                onClick={(e) => {
                  setTab(key);
                  // Tab nằm ngoài vùng nhìn (vuốt ngang trên mobile) → đưa vào giữa
                  e.currentTarget.scrollIntoView?.({ inline: "center", block: "nearest", behavior: "smooth" });
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap",
                  fontFamily: FONT, fontSize: 13.5, fontWeight: on ? 600 : 500,
                  color: on ? ACCENT : T.textMuted, background: "none", border: "none", cursor: "pointer",
                  padding: "10px 14px 11px", marginBottom: -1,
                  borderBottom: `2px solid ${on ? ACCENT : "transparent"}`,
                  transition: "color .13s, border-color .13s",
                }}
              >
                <Icon size={15} aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </nav>
      </header>

      <main role="tabpanel" data-page="" style={{ padding: isMobile ? "16px 16px 24px" : "20px 28px 64px" }}>
        <Panel onNavigate={setTab} />
      </main>
    </div>
  );
}