// src/components/layout/MobileBottomNav.jsx
// Thanh điều hướng dưới dạng "floating pill" bo tròn, cách mép dưới (kiểu Facebook).
// Dùng portal vì <nav> cha có backdrop-filter → fixed bên trong sẽ bị nhốt theo nav.
// Tối ưu:
//  • memo ở cả nav lẫn từng tab → Navbar render lại mỗi lần gõ phím cũng KHÔNG kéo theo bottom nav.
//  • Phản hồi chạm (scale khi nhấn) bằng CSS :active thay cho whileTap của 5 motion.button.
//  • touch-action: manipulation → bỏ độ trễ chạm; framer-motion chỉ còn dùng cho pill trượt (layoutId).
import React, { memo, useCallback } from "react";
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

const CSS = `
@keyframes mbnIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.mbn{animation:mbnIn .35s cubic-bezier(.22,1,.36,1) both}
.mbn-tab{transition:transform .12s ease,color .2s ease;touch-action:manipulation}
.mbn-tab:active{transform:scale(.9)}
.mbn-tab:focus-visible{outline:2px solid rgba(255,255,255,.6);outline-offset:-2px}
@media (prefers-reduced-motion:reduce){.mbn{animation:none}.mbn-tab{transition:none}}
`;

const NAV_STYLE = {
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
};

const PILL_TRANSITION = { type: "spring", stiffness: 500, damping: 38 };
const PILL_STYLE = {
  position: "absolute",
  inset: 0,
  borderRadius: 25,
  background: `linear-gradient(135deg, ${ACCENT}, #c81017)`,
  boxShadow: `0 4px 14px ${ACCENT}66`,
};

const ICON_STYLE = { position: "relative" };
const LABEL_BASE = {
  position: "relative",
  fontSize: 9.5,
  lineHeight: 1,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const BTN_BASE = {
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
  fontFamily: "'DM Sans', sans-serif",
  WebkitTapHighlightColor: "transparent",
};
const BTN_ACTIVE = { ...BTN_BASE, color: "#fff" };
const BTN_IDLE = { ...BTN_BASE, color: "rgba(255,255,255,0.5)" };
const LABEL_ACTIVE = { ...LABEL_BASE, fontWeight: 700 };
const LABEL_IDLE = { ...LABEL_BASE, fontWeight: 500 };

const TabButton = memo(function TabButton({ tab, active, onPress }) {
  const { Icon } = tab;
  return (
    <button
      type="button"
      className="mbn-tab"
      onClick={() => onPress(tab)}
      aria-label={tab.label}
      aria-current={active ? "page" : undefined}
      style={active ? BTN_ACTIVE : BTN_IDLE}
    >
      {active && <motion.span layoutId="bottom-nav-pill" transition={PILL_TRANSITION} style={PILL_STYLE} />}
      <Icon
        size={21}
        strokeWidth={active ? 2.3 : 1.8}
        style={ICON_STYLE}
        fill={active && (tab.key === "fav" || tab.key === "home") ? "currentColor" : "none"}
      />
      <span style={active ? LABEL_ACTIVE : LABEL_IDLE}>{tab.label}</span>
    </button>
  );
});

const MobileBottomNav = ({ searchOpen, onNavigate, onHome, onGuarded, onSearch }) => {
  const { pathname } = useLocation();

  const handlePress = useCallback(
    (t) => {
      if (t.key === "search") return onSearch();
      if (t.path === "/") return onHome();
      if (t.protected) return onGuarded(t.path);
      onNavigate(t.path);
    },
    [onSearch, onHome, onGuarded, onNavigate],
  );

  return createPortal(
    <nav aria-label="Điều hướng chính" data-bottom-nav className="mbn" style={NAV_STYLE}>
      <style>{CSS}</style>
      {TABS.map((t) => {
        const active = t.key === "search" ? !!searchOpen : !searchOpen && isActivePath(pathname, t.path);
        return <TabButton key={t.key} tab={t} active={active} onPress={handlePress} />;
      })}
    </nav>,
    document.body,
  );
};

export default memo(MobileBottomNav);