// src/components/layout/MobileBottomNav.jsx
// Thanh điều hướng dưới dạng "floating pill" bo tròn, cách mép dưới (kiểu Facebook).
// Dùng portal vì <nav> cha có backdrop-filter → fixed bên trong sẽ bị nhốt theo nav.
import React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Home, CalendarClock, Newspaper, Heart, Search } from "lucide-react";
import { useLocation } from "react-router-dom";

const ACCENT = "#e5181e";

const isActivePath = (pathname, path) =>
  path === "/"
    ? pathname === "/"
    : pathname === path || pathname.startsWith(path + "/");

const TABS = [
  { key: "home", label: "Trang chủ", Icon: Home, path: "/" },
  { key: "soon", label: "Sắp chiếu", Icon: CalendarClock, path: "/coming-soon" },
  { key: "search", label: "Tìm kiếm", Icon: Search },
  { key: "news", label: "Tin tức", Icon: Newspaper, path: "/announcements" },
  { key: "fav", label: "Yêu thích", Icon: Heart, path: "/favorites", protected: true },
];

const MobileBottomNav = ({ searchOpen, onNavigate, onHome, onGuarded, onSearch }) => {
  const { pathname } = useLocation();

  const handleClick = (t) => {
    if (t.key === "search") return onSearch();
    if (t.path === "/") return onHome();
    if (t.protected) return onGuarded(t.path);
    onNavigate(t.path);
  };

  return createPortal(
    <nav
      aria-label="Điều hướng chính"
      data-bottom-nav
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        zIndex: 9990,
        height: 62,
        padding: "0 6px",
        display: "flex",
        alignItems: "center",
        gap: 2,
        borderRadius: 31,
        background: "rgba(18,18,18,0.88)",
        backdropFilter: "blur(24px) saturate(160%)",
        WebkitBackdropFilter: "blur(24px) saturate(160%)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.4)",
      }}
    >
      {TABS.map((t) => {
        const active = t.key === "search" ? !!searchOpen : !searchOpen && isActivePath(pathname, t.path);
        return (
          <motion.button
            key={t.key}
            type="button"
            onClick={() => handleClick(t)}
            whileTap={{ scale: 0.9 }}
            aria-label={t.label}
            aria-current={active ? "page" : undefined}
            style={{
              position: "relative",
              flex: 1,
              minWidth: 0,
              height: 50,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              background: "none",
              border: "none",
              borderRadius: 25,
              cursor: "pointer",
              color: active ? "#fff" : "rgba(255,255,255,0.5)",
              fontFamily: "'DM Sans', sans-serif",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {active && (
              <motion.span
                layoutId="bottom-nav-pill"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 25,
                  background: `linear-gradient(135deg, ${ACCENT}, #c81017)`,
                  boxShadow: `0 4px 14px ${ACCENT}66`,
                }}
              />
            )}
            <t.Icon
              size={21}
              strokeWidth={active ? 2.3 : 1.8}
              style={{ position: "relative" }}
              fill={active && (t.key === "fav" || t.key === "home") ? "currentColor" : "none"}
            />
            <span
              style={{
                position: "relative",
                fontSize: 9.5,
                lineHeight: 1,
                fontWeight: active ? 700 : 500,
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </span>
          </motion.button>
        );
      })}
    </nav>,
    document.body,
  );
}

export default MobileBottomNav;