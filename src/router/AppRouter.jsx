// src/router/AppRouter.jsx
import React, { useEffect, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import HomePage from "../pages/user/Homepage";
import MovieInfoPage from "../pages/user/MovieInfoPage";
import MovieDetailPage from "../pages/user/MovieDetailPage";
import LandingPage from "../pages/Landingpage";
import AboutUs from "../pages/AboutUs";
import Navbar from "../components/layout/Navbar";
import SearchPage from "../pages/user/Searchpage";
import BrowsePage from "../pages/user/BrowsePage";
import ProfilePage from "../pages/user/ProfilePage";
import SecurityPage from "../pages/user/SecurityPage";
import PersonPage from "../pages/user/PersonPage";
import FavoritesPage from "../pages/user/FavoritesPage";
import ComingSoonPage from "../pages/user/ComingSoonPage";
import WatchHistoryPage from "../pages/user/WatchHistoryPage";
import AdminPage from "../pages/admin/AdminPage";
import TvShowInfoPage from "../pages/user/TvShowInfoPage";
import TvShowDetailPage from "../pages/user/TvShowDetailPage";
import PremiumPage from "../pages/PremiumPage";
import PaymentResultPage from "../pages/PaymentResultPage";
import AnnouncementsPage from "../pages/user/AnnouncementsPage";
import { useToast } from "../components/common/Toast";
import { useIsLoggedIn, useStoredUser } from "../hooks/useStoredUser";

/** Scroll lên đầu trang mỗi khi route thay đổi */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
};

/** Layout có Navbar — chỉ dùng cho các trang phim chính */
const WithNavbar = () => (
  <>
    <Navbar />
    <Outlet />
  </>
);

/**
 * Chỉ cho vào khi đã đăng nhập.
 * Vào thẳng trang khi chưa đăng nhập → toast + về Trang chủ.
 * Đang ở trang mà bị đăng xuất (bấm Đăng xuất, hết phiên, tab khác đăng xuất) → về Trang chủ, không toast.
 */
const ProtectedRoute = ({ children }) => {
  const toast = useToast();
  const loggedIn = useIsLoggedIn();
  const enteredLoggedIn = useRef(loggedIn);

  useEffect(() => {
    if (!loggedIn && !enteredLoggedIn.current) {
      toast.warning("Bạn cần đăng nhập để sử dụng tính năng này");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return loggedIn ? children : <Navigate to="/" replace />;
};

/**
 * Chỉ cho vào khi CHƯA đăng nhập.
 * Đã đăng nhập → admin về /admin, người dùng thường về Trang chủ
 * (khớp với điều hướng sau đăng nhập trong LandingPage).
 */
const GuestRoute = ({ children }) => {
  const user = useStoredUser();
  if (!user) return children;
  return (
    <Navigate to={user.role?.toLowerCase() === "admin" ? "/admin" : "/"} replace />
  );
};

/** Route không tồn tại: đã đăng nhập → Trang chủ, khách → Về chúng tôi */
const FallbackRedirect = () => (
  <Navigate to={useIsLoggedIn() ? "/" : "/about-us"} replace />
);

const protectedPage = (Page) => (
  <ProtectedRoute>
    <Page />
  </ProtectedRoute>
);

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

      {/* ── Trang có Navbar ── */}
      <Route element={<WithNavbar />}>
        {/* Công khai — không cần đăng nhập */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/movie/:id/info" element={<MovieInfoPage />} />
        <Route path="/tvshow/:id/info" element={<TvShowInfoPage />} />
        <Route path="/person/:id" element={<PersonPage />} />
        <Route path="/coming-soon" element={<ComingSoonPage />} />
        <Route path="/premium" element={<PremiumPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />

        {/* Xem phim */}
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="/tvshow/:id" element={<TvShowDetailPage />} />

        {/* Tính năng yêu cầu đăng nhập */}
        <Route path="/favorites" element={protectedPage(FavoritesPage)} />
        <Route path="/watch-history" element={protectedPage(WatchHistoryPage)} />
        <Route path="/payment/result" element={protectedPage(PaymentResultPage)} />
      </Route>

      {/* ── Admin (layout riêng, không dùng Navbar) ── */}
      <Route path="/admin" element={protectedPage(AdminPage)} />

      {/* ── Trang cài đặt ── */}
      <Route path="/profile" element={protectedPage(ProfilePage)} />
      <Route path="/settings/security" element={protectedPage(SecurityPage)} />

      {/* ── Fallback ── */}
      <Route path="*" element={<FallbackRedirect />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;