// src/router/AppRouter.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/Homepage";
import MovieInfoPage from "../pages/MovieInfoPage";
import MovieDetailPage from "../pages/MovieDetailPage";
import LandingPage from "../pages/Landingpage";
import Navbar from "../components/layout/Navbar";
import SearchPage from "../pages/Searchpage";

// ── key phải khớp với authService.saveSession() ───────────────────────────
const isLoggedIn = () => {
  try { return !!localStorage.getItem('accessToken'); }
  catch { return false; }
};

/** Chỉ cho vào khi đã đăng nhập */
const ProtectedRoute = ({ children }) =>
  isLoggedIn() ? children : <Navigate to="/welcome" replace />;

/** Chỉ cho vào khi CHƯA đăng nhập (guest-only) */
const GuestRoute = ({ children }) =>
  isLoggedIn() ? <Navigate to="/" replace /> : children;


const AppRouter = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/welcome" element={<GuestRoute><LandingPage /></GuestRoute>} />
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
        <Route path="/movie/:id/info" element={<ProtectedRoute><MovieInfoPage /></ProtectedRoute>} />
        <Route path="/movie/:id" element={<ProtectedRoute><MovieDetailPage /></ProtectedRoute>} />
        <Route path="*" element={
          isLoggedIn() ? <Navigate to="/" replace /> : <Navigate to="/welcome" replace />
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;