// src/router/AppRouter.jsx
import React, { Suspense, lazy, useEffect, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import ErrorBoundary from "../components/common/ErrorBoundary";
import SeoMeta from "../components/common/SeoMeta";
import { useToast } from "../components/common/Toast";
import { useIsLoggedIn, useStoredUser } from "../hooks/useStoredUser";
import { postLoginPath } from "../utils/authRedirect";
import LoadingScreen from "../components/ui/LoadingScreen";

// Mỗi trang một chunk riêng → bundle đầu nhẹ, AdminPage chỉ tải khi vào /admin
const HomePage = lazy(() => import("../pages/user/Homepage"));
const MovieInfoPage = lazy(() => import("../pages/user/MovieInfoPage"));
const MovieDetailPage = lazy(() => import("../pages/user/MovieDetailPage"));
const LandingPage = lazy(() => import("../pages/Landingpage"));
const AboutUs = lazy(() => import("../pages/AboutUs"));
const SearchPage = lazy(() => import("../pages/user/Searchpage"));
const BrowsePage = lazy(() => import("../pages/user/BrowsePage"));
const ProfilePage = lazy(() => import("../pages/user/ProfilePage"));
const SecurityPage = lazy(() => import("../pages/user/SecurityPage"));
const PersonPage = lazy(() => import("../pages/user/PersonPage"));
const FavoritesPage = lazy(() => import("../pages/user/FavoritesPage"));
const ComingSoonPage = lazy(() => import("../pages/user/ComingSoonPage"));
const WatchHistoryPage = lazy(() => import("../pages/user/WatchHistoryPage"));
const AdminPage = lazy(() => import("../pages/admin/AdminPage"));
const TvShowInfoPage = lazy(() => import("../pages/user/TvShowInfoPage"));
const TvShowDetailPage = lazy(() => import("../pages/user/TvShowDetailPage"));
const PremiumPage = lazy(() => import("../pages/PremiumPage"));
const PaymentResultPage = lazy(() => import("../pages/PaymentResultPage"));
const AnnouncementsPage = lazy(() => import("../pages/user/AnnouncementsPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

/** Scroll lên đầu trang mỗi khi route thay đổi */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
};

/** Layout có Navbar — chỉ dùng cho các trang phim chính */
const WithNavbar = () => {
  const { pathname } = useLocation();
  return (
    <>
      {/* SEO mặc định + canonical theo đường dẫn; trang con có SeoMeta riêng sẽ ghi đè */}
      <SeoMeta />
      <Navbar />
      {/* Trang con crash → chỉ vùng nội dung hiện PageError, Navbar vẫn dùng được.
          resetKey: sang trang khác thì tự thoát khỏi trạng thái lỗi. */}
      <ErrorBoundary resetKey={pathname}>
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </>
  );
};

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
 * Đã đăng nhập → quay lại nơi đang làm dở (location.state.from), nếu không có thì
 * admin về /admin, người dùng thường về Trang chủ (khớp với LandingPage).
 */
const GuestRoute = ({ children }) => {
  const user = useStoredUser();
  const location = useLocation();
  if (!user) return children;
  return <Navigate to={postLoginPath(user, location.state?.from)} replace />;
};

const protectedPage = (Page) => (
  <ProtectedRoute>
    <SeoMeta noindex />
    <Page />
  </ProtectedRoute>
);

// ─────────────────────────────────────────────────────────────────────────────

const AppRouter = () => (
  <BrowserRouter>
    <ScrollToTop />
    <Suspense fallback={<LoadingScreen />}>
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

        {/* URL không tồn tại → trang 404 (vẫn có Navbar) */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* ── Admin (layout riêng, không dùng Navbar) ── */}
      <Route path="/admin" element={protectedPage(AdminPage)} />

      {/* ── Trang cài đặt ── */}
      <Route path="/profile" element={protectedPage(ProfilePage)} />
      <Route path="/settings/security" element={protectedPage(SecurityPage)} />
    </Routes>
    </Suspense>
  </BrowserRouter>
);

export default AppRouter;