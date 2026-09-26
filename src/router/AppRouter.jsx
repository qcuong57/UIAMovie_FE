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
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
};
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

/** Chỉ cho vào khi đã đăng nhập — chưa đăng nhập thì báo toast + redirect về Trang chủ */
const ProtectedRoute = ({ children }) => {
  const toast = useToast();
  const loggedIn = isLoggedIn();
  const warnedRef = React.useRef(false);

  useEffect(() => {
    if (!loggedIn && !warnedRef.current) {
      warnedRef.current = true;
      toast.warning("Bạn cần đăng nhập để sử dụng tính năng này");
    }
  }, [loggedIn]);

  return loggedIn ? children : <Navigate to="/" replace />;
};

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

      {/* ── Trang có Navbar ── */}
      <Route element={<WithNavbar />}>
        {/* Công khai — không cần đăng nhập */}
        <Route path="/" element={<HomePage />} />

        {/* Về chúng tôi: Công khai cho cả khách lẫn người dùng đã đăng nhập */}
        <Route path="/about-us" element={<AboutUs />} />

        <Route path="/search" element={<SearchPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/movie/:id/info" element={<MovieInfoPage />} />
        <Route path="/tvshow/:id/info" element={<TvShowInfoPage />} />
        <Route path="/person/:id" element={<PersonPage />} />
        <Route path="/coming-soon" element={<ComingSoonPage />} />
        <Route path="/premium" element={<PremiumPage />} />
        <Route
          path="/announcements"
          element={
            <ProtectedRoute>
              <AnnouncementsPage />
            </ProtectedRoute>
          }
        />

        {/* Xem phim */}
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="/tvshow/:id" element={<TvShowDetailPage />} />
        
        {/* Tính năng yêu cầu đăng nhập */}
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <FavoritesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/watch-history"
          element={
            <ProtectedRoute>
              <WatchHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/result"
          element={
            <ProtectedRoute>
              <PaymentResultPage />
            </ProtectedRoute>
          }
        />
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

      {/* ── Trang cài đặt ── */}
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
            <Navigate to="/about-us" replace />
          )
        }
      />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;