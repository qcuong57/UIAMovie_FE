// src/router/AppRouter.jsx
import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

/** Scroll lên đầu trang mỗi khi route thay đổi */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};
import HomePage from "../pages/user/Homepage";
import MovieInfoPage from "../pages/user/MovieInfoPage";
import MovieDetailPage from "../pages/user/MovieDetailPage";
import LandingPage from "../pages/Landingpage";
import Navbar from "../components/layout/Navbar";
import SearchPage from "../pages/user/Searchpage";
import BrowsePage from "../pages/user/BrowsePage";
import ProfilePage from "../pages/user/ProfilePage";
import SecurityPage from "../pages/user/SecurityPage";
import PersonPage from "../pages/user/PersonPage";
import FavoritesPage from "../pages/user/FavoritesPage";
import WatchHistoryPage from "../pages/user/WatchHistoryPage";
import AdminPage from "../pages/admin/AdminPage";

// ── Auth helpers ──────────────────────────────────────────────────────────────
const isLoggedIn = () => {
  try {
    return !!localStorage.getItem("accessToken");
  } catch {
    return false;
  }
};

/** Layout có Navbar — chỉ dùng cho các trang phim chính */
const WithNavbar = () => (
  <>
    <Navbar />
    <Outlet />
  </>
);

/** Chỉ cho vào khi đã đăng nhập */
const ProtectedRoute = ({ children }) =>
  isLoggedIn() ? children : <Navigate to="/welcome" replace />;

/** Chỉ cho vào khi CHƯA đăng nhập */
const GuestRoute = ({ children }) =>
  isLoggedIn() ? <Navigate to="/" replace /> : children;

// ─────────────────────────────────────────────────────────────────────────────

const AppRouter = () => (
  <BrowserRouter>
    <ScrollToTop />
    <Routes>
      {/* ── Trang guest (không Navbar) ── */}
      <Route
        path="/welcome"
        element={
          <GuestRoute>
            <LandingPage />
          </GuestRoute>
        }
      />

      {/* ── Trang có Navbar (phim, tìm kiếm) ── */}
      <Route
        element={
          <ProtectedRoute>
            <WithNavbar />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="/movie/:id/info" element={<MovieInfoPage />} />
        <Route path="/person/:id" element={<PersonPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/watch-history" element={<WatchHistoryPage />} />
      </Route>

      {/* ── Admin (layout riêng, không dùng Navbar) ── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* ── Trang cài đặt (có top bar riêng, không cần Navbar) ── */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/security"
        element={
          <ProtectedRoute>
            <SecurityPage />
          </ProtectedRoute>
        }
      />

      {/* ── Fallback ── */}
      <Route
        path="*"
        element={
          isLoggedIn() ? (
            <Navigate to="/" replace />
          ) : (
            <Navigate to="/welcome" replace />
          )
        }
      />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;