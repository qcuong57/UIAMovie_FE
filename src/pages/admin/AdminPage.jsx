// src/pages/admin/AdminPage.jsx
import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useStoredUser } from "../../hooks/useStoredUser";

import AdminLayout from "../../components/admin/AdminLayout";
import AdminDashboard from "../../components/admin/AdminDashboard";
import AdminMovies from "../../components/admin/AdminMovies";
import AdminTvShows from "../../components/admin/AdminTvShows";
import AdminAnnouncements from "../../components/admin/AdminAnnouncements";
import AdminGenres from "../../components/admin/AdminGenres";
import AdminReviews from "../../components/admin/AdminReviews";
import AdminUsers from "../../components/admin/AdminUsers";
import AdminPersons from "../../components/admin/AdminPersons";
import AdminRevenue from "../../components/admin/AdminRevenue";
import AdminAds from "../../components/admin/AdminAds";

export default function AdminPage() {
  const [tab, setTab] = useState("dashboard");
  // Reactive: tự render lại khi đăng xuất / đổi tài khoản (kể cả từ tab khác).
  // Lưu ý: đây chỉ là chặn giao diện, quyền thật sự vẫn do backend kiểm tra theo token.
  const user = useStoredUser();

  if (!user || user.role?.toLowerCase() !== "admin") {
    return <Navigate to="/" replace />;
  }

  const renderContent = () => {
    switch (tab) {
      case "dashboard":
        return <AdminDashboard />;
      case "revenue":
        return <AdminRevenue />;
      case "ads":
        return <AdminAds />;
      case "movies":
        return <AdminMovies />;
      case "tvshows":
        return <AdminTvShows />;
      case "announcements":
        return <AdminAnnouncements />;
      case "genres":
        return <AdminGenres />;
      case "reviews":
        return <AdminReviews />;
      case "users":
        return <AdminUsers />;
      case "persons":
        return <AdminPersons />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AdminLayout activeTab={tab} onTabChange={setTab}>
      {renderContent()}
    </AdminLayout>
  );
}