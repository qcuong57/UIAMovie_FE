// src/components/layout/Navbar.jsx

import React, { useState, useRef, useEffect, useCallback, useReducer } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, LogOut, Shield, ChevronDown, X, Clock, Crown, Info } from "lucide-react";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";

import UserAvatar from "../ui/UserAvatar";
import SearchResultsPanel from "../ui/SearchResultsPanel";
import MobileSearchOverlay from "../ui/MobileSearchOverlay";
import MobileBottomNav from "./MobileBottomNav";
import useDebounce from "../../hooks/useDebounce";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import * as variants from "../../motion-configs/variants";
import * as transitions from "../../motion-configs/transitions";
import authService from "../../services/authService";
import { useStoredUser } from "../../hooks/useStoredUser";
import axiosInstance from "../../config/axios";
import NavbarFilterModal from "../ui/NavbarFilterModal";
import NotificationBell from "../ui/NotificationBell";

const ACCENT = "#e5181e";

const toSlug = (name) =>
  (name || "unknown")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const fetchSearch = async (q) => {
  const res = await axiosInstance.get(`/movies/search?query=${encodeURIComponent(q)}`);
  const raw = res.data?.data ?? res.data ?? [];
  return Array.isArray(raw) ? raw : [];
};

const fetchTvShowSearch = async (q) => {
  try {
    const res = await axiosInstance.get(`/tvshows/search?query=${encodeURIComponent(q)}`);
    const raw = res.data?.data ?? res.data ?? [];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

const fetchActorSearch = async (q) => {
  try {
    const [movieRes, tvRes] = await Promise.allSettled([
      axiosInstance.get(`/movies/search/actor?actorName=${encodeURIComponent(q)}`),
      axiosInstance.get(`/tvshows/search/actor?actorName=${encodeURIComponent(q)}`),
    ]);

    const extractRaw = (res) => {
      if (res.status !== "fulfilled") return [];
      const raw = res.value?.data?.data ?? res.value?.data;
      return Array.isArray(raw) ? raw : [];
    };

    const actorMap = new Map();

    const processSource = (rawList) => {
      rawList.forEach((item) => {
        const itemTitle = item.title ?? item.name;
        const castList = item.cast ?? item.Cast ?? [];
        castList.forEach((c) => {
          const name = c.name ?? c.Name ?? c.personName;
          if (!name || !name.toLowerCase().includes(q.toLowerCase())) return;

          if (actorMap.has(name)) {
            const existing = actorMap.get(name);
            if (itemTitle && !existing.knownMovies.includes(itemTitle))
              existing.knownMovies.push(itemTitle);
            return;
          }

          actorMap.set(name, {
            id: c.tmdbPersonId ?? c.TmdbPersonId ?? c.personId ?? name,
            name,
            profileUrl: c.profileUrl ?? c.ProfileUrl ?? null,
            character: c.character ?? c.Character ?? null,
            biography: c.biography ?? c.Biography ?? null,
            birthday: c.birthday ?? c.Birthday ?? null,
            placeOfBirth: c.placeOfBirth ?? c.PlaceOfBirth ?? null,
            deathday: c.deathday ?? null,
            popularity: c.popularity ?? null,
            tmdbPersonId: c.tmdbPersonId ?? c.TmdbPersonId ?? null,
            profileImages: c.profileImages ?? c.ProfileImages ?? [],
            movies: c.movies ?? [],
            knownMovies: [itemTitle].filter(Boolean),
          });
        });
      });
    };

    processSource(extractRaw(movieRes));
    processSource(extractRaw(tvRes));

    return [...actorMap.values()].slice(0, 3);
  } catch {
    return [];
  }
};

const DESKTOP_LINKS = [
  { label: "Trang chủ", path: "/" },
  { label: "Yêu thích", path: "/favorites", protected: true },
  { label: "Phim sắp chiếu", path: "/coming-soon" },
  { label: "Tin tức", path: "/announcements" },
  { label: "Về chúng tôi", path: "/about-us" },
];

const Navbar = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const [results, setResults] = useState([]);
  const [tvShows, setTvShows] = useState([]);
  const [actors, setActors] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const guardedNav = useAuthGuard();
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "movie";
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchWrapRef = useRef(null);
  const filterBtnRef = useRef(null);

  const debouncedQuery = useDebounce(searchQuery, 350);

  const currentUser = useStoredUser();
  const [, forceRender] = useReducer((n) => n + 1, 0);

  const goHome = () => {
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    window.addEventListener("userUpdated", forceRender);
    return () => window.removeEventListener("userUpdated", forceRender);
  }, []);

  useEffect(() => {
    if (!isHomePage) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHomePage]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const doSearch = useCallback(async (q) => {
    setSearching(true);
    setShowResults(true);
    try {
      const [movieData, actorData, tvData] = await Promise.all([
        fetchSearch(q),
        fetchActorSearch(q),
        fetchTvShowSearch(q),
      ]);
      setResults(movieData.slice(0, 5));
      setActors(actorData);
      setTvShows(tvData.slice(0, 4));
    } catch {
      setResults([]);
      setActors([]);
      setTvShows([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!showSearch || debouncedQuery.trim().length < 1) {
      setResults([]);
      setTvShows([]);
      setActors([]);
      setShowResults(false);
      return;
    }
    doSearch(debouncedQuery.trim());
  }, [debouncedQuery, showSearch, doSearch]);

  const openSearch = () => {
    setShowSearch(true);
    if (!isMobile) setTimeout(() => searchInputRef.current?.focus(), 80);
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery("");
    setResults([]);
    setTvShows([]);
    setActors([]);
    setShowResults(false);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault?.();
    const q = searchQuery.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    closeSearch();
  };

  const goMovie = (m) => {
    navigate(`/movie/${m.id}/info`);
    closeSearch();
  };
  const goTvShow = (s) => {
    navigate(`/tvshow/${s.id}/info`);
    closeSearch();
  };
  const goActor = (a) => {
    navigate(`/person/${toSlug(a.name)}`, { state: { actor: a } });
    closeSearch();
  };

  const handleFilterApply = useCallback(
    (params) => {
      const qs = new URLSearchParams();
      if (searchQuery.trim()) qs.set("q", searchQuery.trim());
      Object.entries(params).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach((id) => qs.append(k, id));
        else qs.set(k, String(v));
      });
      navigate(`/search?${qs.toString()}`);
    },
    [navigate, searchQuery],
  );

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      /* noop */
    } finally {
      window.location.href = "/welcome";
    }
  };

  const isLoggedIn = !!currentUser;
  const isPremium = currentUser?.subscriptionPlan === "premium" || currentUser?.isPremium;

  const dropdownItems = [
    { icon: <User size={15} />, label: "Hồ sơ của tôi", onClick: () => navigate("/profile") },
    { icon: <Clock size={15} />, label: "Lịch sử xem", onClick: () => navigate("/watch-history") },
    { icon: <Shield size={15} />, label: "Bảo mật & 2FA", onClick: () => navigate("/settings/security") },
    {
      icon: <Crown size={15} />,
      label: isPremium ? "Gói Premium" : "Nâng cấp Premium",
      onClick: () => navigate("/premium"),
      isPremium,
    },
    // Trên mobile, "Về chúng tôi" không còn trong bottom nav nên đưa vào đây.
    ...(isMobile
      ? [{ icon: <Info size={15} />, label: "Về chúng tôi", onClick: () => navigate("/about-us") }]
      : []),
  ];

  const navBg = scrolled ? "rgba(0,0,0,0.97)" : "transparent";
  const navBorder = scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent";
  const iconColor = scrolled ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.75)";

  const hasAny = results.length > 0 || tvShows.length > 0 || actors.length > 0;
  const q = searchQuery.trim();
  const pending = q !== debouncedQuery.trim(); // đang gõ, chưa kịp gọi API
  const panelSearching = searching || pending;

  const dropdownVisible =
    !isMobile && showResults && (searching || hasAny || debouncedQuery.trim().length >= 2);

  const panelProps = {
    query: searchQuery,
    searching: panelSearching,
    movies: results,
    tvShows,
    actors,
    onMovie: goMovie,
    onTvShow: goTvShow,
    onActor: goActor,
    onSeeAll: handleSearchSubmit,
  };

  const filterButton = (
    <motion.button
      ref={filterBtnRef}
      onClick={() => setShowFilter((p) => !p)}
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.1)" }}
      aria-label="Bộ lọc phim"
      title="Bộ lọc phim"
      className="flex items-center justify-center rounded-lg"
      style={{
        width: isMobile ? 36 : 36,
        height: 36,
        background: showFilter ? "rgba(229,24,30,0.18)" : "transparent",
        border: "none",
        cursor: "pointer",
        color: showFilter ? ACCENT : iconColor,
      }}
    >
      <IconAdjustmentsHorizontal size={19} strokeWidth={1.7} />
    </motion.button>
  );

  return (
    <>
      <motion.nav
        data-navbar
        variants={variants.navbarVariants}
        initial="hidden"
        animate="visible"
        transition={transitions.TRANSITION_HERO_CONTENT}
        className="fixed top-0 left-0 right-0 z-[9999]"
        style={{
          isolation: "isolate",
          background: navBg,
          borderBottom: navBorder,
          backdropFilter: scrolled ? "blur(20px)" : "none",
          transition: "background 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease",
        }}
      >
        <div className="flex items-center justify-between px-3 md:px-8 py-2 md:py-3 gap-2">
          {/* ── Logo ── */}
          <motion.div
            className="flex items-center gap-1.5 cursor-pointer shrink-0"
            onClick={goHome}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ fontSize: "clamp(1.2rem, 1rem + 1vw, 1.875rem)" }}
          >
            <span className="font-black leading-none" style={{ color: ACCENT, letterSpacing: "-0.02em", fontSize: "1em" }}>
              UIA
            </span>
            <span
              className="font-bold"
              style={{
                color: "#fff",
                letterSpacing: "0.06em",
                fontSize: "0.62em",
                lineHeight: 1,
                alignSelf: "center",
              }}
            >
              MOVIE
            </span>
          </motion.div>

          {/* ── Nav links (desktop) ── */}
          <div className="hidden md:flex items-center gap-1">
            {DESKTOP_LINKS.map(({ label, path, protected: isProtected }, i) => {
              const isActive =
                path === "/"
                  ? location.pathname === "/"
                  : location.pathname === path || location.pathname.startsWith(path + "/");

              return (
                <motion.button
                  key={label}
                  onClick={() => (path === "/" ? goHome() : isProtected ? guardedNav(path) : navigate(path))}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...transitions.TRANSITION_NORMAL, delay: i * 0.07 }}
                  className="relative px-3 py-2 text-sm group"
                  style={{ background: "transparent", border: "none", cursor: "pointer" }}
                >
                  <span
                    className="relative z-10 transition-colors duration-300"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: isActive ? 700 : 600,
                      letterSpacing: "0.015em",
                      color: isActive ? "#fff" : scrolled ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.55)",
                    }}
                  >
                    {label}
                  </span>
                  <span
                    className={`absolute left-3 right-3 bottom-[3px] h-[1px] origin-center transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                    style={{
                      background: isActive ? `linear-gradient(90deg, ${ACCENT}, #ff5a5f)` : "rgba(255,255,255,0.85)",
                    }}
                  />
                </motion.button>
              );
            })}
          </div>

          {/* ── Right actions ── (mobile: tìm kiếm nằm ở tab giữa của bottom nav) */}
          <div className="flex items-center gap-0.5 md:gap-1.5 shrink-0">
            {/* Desktop search */}
            {!isMobile && (
              <AnimatePresence mode="wait">
                {showSearch ? (
                  <motion.div
                    key="search-open"
                    ref={searchWrapRef}
                    initial={{ width: 36, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 36, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    style={{ position: "relative" }}
                  >
                    <form
                      onSubmit={handleSearchSubmit}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        overflow: "hidden",
                        background: scrolled ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.55)",
                        borderRadius: dropdownVisible ? "10px 10px 0 0" : 10,
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderBottom: dropdownVisible
                          ? "1px solid rgba(255,255,255,0.06)"
                          : "1px solid rgba(255,255,255,0.15)",
                        backdropFilter: "blur(12px)",
                        transition: "border-radius 0.15s",
                      }}
                    >
                      <button
                        type="submit"
                        aria-label="Tìm"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 10px", display: "flex", color: "rgba(255,255,255,0.6)", flexShrink: 0 }}
                      >
                        <Search size={15} />
                      </button>

                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Escape" && closeSearch()}
                        onFocus={() => hasAny && setShowResults(true)}
                        placeholder="Tìm phim, TV show, diễn viên..."
                        style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 13, fontFamily: "'DM Sans', sans-serif", padding: "8px 0", minWidth: 0 }}
                      />

                      <button
                        type="button"
                        onClick={() => (searchQuery ? setSearchQuery("") : closeSearch())}
                        aria-label="Xoá"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 10px", display: "flex", color: "rgba(255,255,255,0.4)", flexShrink: 0 }}
                      >
                        <X size={13} />
                      </button>
                    </form>

                    <AnimatePresence>
                      {dropdownVisible && (
                        <motion.div
                          key="search-dropdown"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.14 }}
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            maxHeight: "75vh",
                            overflowY: "auto",
                            background: "rgba(10,10,10,0.98)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderTop: "none",
                            borderRadius: "0 0 12px 12px",
                            backdropFilter: "blur(20px)",
                            boxShadow: "0 20px 50px rgba(0,0,0,0.75)",
                            zIndex: 9998,
                          }}
                        >
                          <SearchResultsPanel {...panelProps} searching={searching} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.button
                    key="search-icon"
                    onClick={openSearch}
                    aria-label="Tìm kiếm"
                    whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.94 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-2 rounded-lg"
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: iconColor }}
                  >
                    <Search size={18} />
                  </motion.button>
                )}
              </AnimatePresence>
            )}

            {filterButton}

            <div
              className="hidden md:block mx-1 h-5 w-px"
              style={{ background: scrolled ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)", transition: "background 0.3s" }}
            />

            {/* ── Auth / User ── */}
            {!isLoggedIn ? (
              <>
              {/* Mobile: nút đăng nhập gọn (tab Cá nhân đã đổi thành Tìm kiếm) */}
              <button
                type="button"
                onClick={() => navigate("/welcome", { state: { view: "login" } })}
                className="md:hidden"
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 16,
                  border: "none",
                  background: "linear-gradient(135deg, #ff2b32 0%, #e5181e 55%, #c81017 100%)",
                  color: "#fff",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                Đăng nhập
              </button>
              <div className="hidden md:flex items-center gap-2.5">
                <motion.button
                  onClick={() => navigate("/welcome", { state: { view: "register" } })}
                  whileTap={{ scale: 0.96 }}
                  className="px-4 py-[7px] rounded-lg"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", background: "transparent", cursor: "pointer" }}
                >
                  <span className="text-[13px] font-semibold whitespace-nowrap tracking-wide" style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.7)" }}>
                    Đăng ký
                  </span>
                </motion.button>

                <motion.button
                  onClick={() => navigate("/welcome", { state: { view: "login" } })}
                  whileHover={{ scale: 1.035, boxShadow: "0 6px 20px rgba(229,24,30,0.45)" }}
                  whileTap={{ scale: 0.96 }}
                  className="px-[18px] py-[7px] rounded-lg"
                  style={{
                    background: "linear-gradient(135deg, #ff2b32 0%, #e5181e 55%, #c81017 100%)",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 3px 12px rgba(229,24,30,0.3)",
                  }}
                >
                  <span className="text-[13px] font-semibold text-white whitespace-nowrap tracking-wide" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Đăng nhập
                  </span>
                </motion.button>
              </div>
              </>
            ) : (
              <div className="flex items-center gap-0.5 md:gap-1.5">
                <NotificationBell scrolled={scrolled} />

                <div className="relative" ref={dropdownRef}>
                  <motion.button
                    onClick={() => setShowDropdown((p) => !p)}
                    whileTap={{ scale: 0.97 }}
                    aria-label="Tài khoản"
                    className="flex items-center gap-1.5 px-1 py-1 rounded-lg"
                    style={{ background: showDropdown ? "rgba(255,255,255,0.1)" : "transparent", border: "none", cursor: "pointer" }}
                  >
                    <UserAvatar
                      avatarUrl={currentUser?.avatar}
                      name={currentUser?.name}
                      size={isMobile ? 28 : 28}
                      style={{ boxShadow: "0 2px 10px rgba(229,24,30,0.45)" }}
                    />

                    <AnimatePresence>
                      {scrolled && !isMobile && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-xs font-semibold text-white overflow-hidden whitespace-nowrap"
                          style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 80 }}
                        >
                          {currentUser?.name?.split(" ")[0] ?? "User"}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {!isMobile && (
                      <motion.div animate={{ rotate: showDropdown ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>
                        <ChevronDown size={13} />
                      </motion.div>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {showDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden shadow-2xl"
                        style={{ background: "rgba(12,12,12,0.97)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
                      >
                        <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          <div className="flex items-center gap-2.5">
                            <UserAvatar avatarUrl={currentUser?.avatar} name={currentUser?.name} size={32} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate leading-tight">
                                {currentUser?.name ?? "Người dùng"}
                              </p>
                              <p className="text-xs truncate leading-tight" style={{ color: "rgba(255,255,255,0.3)" }}>
                                {currentUser?.email ?? ""}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="py-1.5 px-1.5">
                          {dropdownItems.map(({ icon, label, onClick, isPremium: itemIsPremium }) => (
                            <motion.button
                              key={label}
                              onClick={() => {
                                setShowDropdown(false);
                                onClick();
                              }}
                              whileHover={{
                                backgroundColor: itemIsPremium && !isPremium ? "rgba(234,179,8,0.12)" : "rgba(255,255,255,0.06)",
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                              style={{ background: "transparent", border: "none", cursor: "pointer" }}
                            >
                              <span
                                style={{
                                  color: itemIsPremium
                                    ? isPremium
                                      ? "rgba(234,179,8,0.9)"
                                      : "rgba(234,179,8,0.7)"
                                    : "rgba(255,255,255,0.3)",
                                }}
                              >
                                {icon}
                              </span>
                              <span
                                className="text-sm"
                                style={{
                                  fontFamily: "'DM Sans', sans-serif",
                                  color: itemIsPremium ? (isPremium ? "#facc15" : "#fbbf24") : "rgba(255,255,255,0.7)",
                                  fontWeight: itemIsPremium ? 600 : 400,
                                }}
                              >
                                {label}
                              </span>
                              {itemIsPremium && !isPremium && (
                                <span
                                  style={{
                                    marginLeft: "auto",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: "#facc15",
                                    background: "rgba(234,179,8,0.15)",
                                    padding: "1px 6px",
                                    borderRadius: 4,
                                    fontFamily: "'DM Sans', sans-serif",
                                  }}
                                >
                                  HOT
                                </span>
                              )}
                            </motion.button>
                          ))}
                        </div>

                        <div className="px-1.5 pb-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                          <motion.button
                            onClick={handleLogout}
                            whileHover={{ backgroundColor: "rgba(229,24,30,0.1)" }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left mt-1"
                            style={{ background: "transparent", border: "none", cursor: "pointer" }}
                          >
                            <LogOut size={15} style={{ color: "rgba(229,24,30,0.7)" }} />
                            <span className="text-sm font-medium" style={{ color: ACCENT, fontFamily: "'DM Sans', sans-serif" }}>
                              Đăng xuất
                            </span>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>

        <NavbarFilterModal
          isOpen={showFilter}
          onClose={() => setShowFilter(false)}
          onApply={handleFilterApply}
          anchorRef={filterBtnRef}
          currentTab={currentTab}
        />
      </motion.nav>

      {/* ── Mobile: tìm kiếm toàn màn hình + bottom nav (portal, nằm ngoài <nav>) ── */}
      {isMobile && (
        <>
          <MobileSearchOverlay
            isOpen={showSearch}
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onSubmit={handleSearchSubmit}
            onClose={closeSearch}
          >
            {q ? (
              <SearchResultsPanel {...panelProps} />
            ) : (
              <p style={{ padding: "40px 24px", textAlign: "center", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                Nhập tên phim, TV show hoặc diễn viên để tìm kiếm
              </p>
            )}
          </MobileSearchOverlay>

          <MobileBottomNav
            searchOpen={showSearch}
            onSearch={openSearch}
            onHome={goHome}
            onNavigate={navigate}
            onGuarded={guardedNav}
          />
        </>
      )}
    </>
  );
};

export default Navbar;