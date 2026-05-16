// src/pages/admin/AdminPage.jsx
import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import authService from "../../services/authService";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminDashboard from "../../components/admin/AdminDashboard";
import AdminMovies from "../../components/admin/AdminMovies";
import AdminGenres from "../../components/admin/AdminGenres";
import AdminReviews from "../../components/admin/AdminReviews";
import AdminUsers from "../../components/admin/AdminUsers";
import AdminPersons from "../../components/admin/AdminPersons";
import AdminTvShows from "../../components/admin/AdminTvShows";
import AdminRevenue from "../../components/admin/AdminRevenue";

export default function AdminPage() {
  const [tab, setTab] = useState("dashboard");
  const user = authService.getCurrentUser();

  if (!user || user.role?.toLowerCase() !== "admin") {
    return <Navigate to="/" replace />;
  }

  const renderContent = () => {
    switch (tab) {
      case "dashboard":
        return <AdminDashboard />;
      case "revenue":
        return <AdminRevenue />;
      case "movies":
        return <AdminMovies />;
        case "tvshows":
        return <AdminTvShows />;
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