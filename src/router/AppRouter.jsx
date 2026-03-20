// src/router/AppRouter.jsx
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import HomePage from "../pages/Homepage";
import MovieInfoPage from "../pages/MovieInfoPage";
import MovieDetailPage from "../pages/MovieDetailPage";
import LandingPage from "../pages/Landingpage";
import Navbar from "../components/layout/Navbar";
import SearchPage from "../pages/Searchpage";
import ProfilePage from "../pages/ProfilePage";
import SecurityPage from "../pages/SecurityPage";
import PersonPage from "../pages/PersonPage";

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
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="/movie/:id/info" element={<MovieInfoPage />} />
        <Route path="/person/:id" element={<PersonPage />} />
      </Route>

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
