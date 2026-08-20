// src/components/layout/Navbar.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  LogOut,
  Shield,
  ChevronDown,
  X,
  Clock,
  Menu,
  Crown,
} from "lucide-react";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";

// ── Shared UI components ──────────────────────────────────────────────────────
import UserAvatar from "../ui/UserAvatar";
import { MovieResultItem, ActorResultItem } from "../ui/SearchResultItem";
import SearchShimmer from "../ui/SearchShimmer";

// ── Shared hook ───────────────────────────────────────────────────────────────
import useDebounce from "../../hooks/useDebounce";

import { useIsMobile } from "../../hooks/useIsMobile";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as variants from "../../motion-configs/variants";
import * as transitions from "../../motion-configs/transitions";
import authService from "../../services/authService";
import axiosInstance from "../../config/axios";
import NavbarFilterModal from "../ui/NavbarFilterModal";

// ─── Fetch search — /movies/search ───────────────────────────────────────────
// ─── toSlug — khớp với movieConstants.toSlug ─────────────────────────
const toSlug = (name) =>
  (name || "unknown")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const fetchSearch = async (q) => {
  const res = await axiosInstance.get(
    `/movies/search?query=${encodeURIComponent(q)}`,
  );
  const raw = res.data?.data ?? res.data ?? [];
  return Array.isArray(raw) ? raw : [];
};

// ─── Fetch TV show search — /tvshows/search ───────────────────────────────────
const fetchTvShowSearch = async (q) => {
  try {
    const res = await axiosInstance.get(
      `/tvshows/search?query=${encodeURIComponent(q)}`,
    );
    const raw = res.data?.data ?? res.data ?? [];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

// ─── Fetch actor search — /movies/search/actor + /tvshows/search/actor ────────
const fetchActorSearch = async (q) => {
  try {
    const [movieRes, tvRes] = await Promise.allSettled([
      axiosInstance.get(
        `/movies/search/actor?actorName=${encodeURIComponent(q)}`,
      ),
      axiosInstance.get(
        `/tvshows/search/actor?actorName=${encodeURIComponent(q)}`,
      ),
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
        // Handle camelCase (movie) và PascalCase (nếu serializer không config CamelCase)
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

// ═══════════════════════════════════════════════════════════════════════════════
const Navbar = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  // ── Search state ───────────────────────────────────────────────────────────
  const [results, setResults] = useState([]);
  const [tvShows, setTvShows] = useState([]);
  const [actors, setActors] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "movie";
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchWrapRef = useRef(null);
  const filterBtnRef = useRef(null);

  // 350ms — không spam request khi gõ nhanh
  const debouncedQuery = useDebounce(searchQuery, 350);

  const [currentUser, setCurrentUser] = useState(() =>
    authService.getCurrentUser(),
  );

  const goHome = () => {
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Sync user ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const sync = () => setCurrentUser(authService.getCurrentUser());
    window.addEventListener("storage", sync);
    window.addEventListener("userUpdated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("userUpdated", sync);
    };
  }, []);

  // ── Scroll listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Click outside user dropdown ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Click outside search wrapper → đóng results (không đóng input) ─────────
  useEffect(() => {
    const handler = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target))
        setShowResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Trigger search khi debounced query đổi ─────────────────────────────────
  useEffect(() => {
    if (!showSearch || debouncedQuery.trim().length < 1) {
      setResults([]);
      setTvShows([]);
      setActors([]);
      setShowResults(false);
      return;
    }
    doSearch(debouncedQuery.trim());
  }, [debouncedQuery, showSearch]);

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

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openSearch = () => {
    setShowSearch(true);
    setTimeout(() => searchInputRef.current?.focus(), 80);
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery("");
    setResults([]);
    setTvShows([]);
    setActors([]);
    setShowResults(false);
  };

  // Enter → trang search đầy đủ
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    closeSearch();
  };

  // Click phim → thẳng trang chi tiết
  const handleResultClick = (movie) => {
    navigate(`/movie/${movie.id}/info`);
    closeSearch();
  };

  const handleFilterApply = useCallback(
    (params) => {
      const qs = new URLSearchParams();
      // Giữ lại từ khoá search nếu user đang gõ trong search bar
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
      authService.clearSession();
      window.location.href = "/welcome";
    }
  };

  const isLoggedIn = !!currentUser;

  const isPremium =
    currentUser?.subscriptionPlan === "premium" || currentUser?.isPremium;

  const dropdownItems = [
    {
      icon: <User size={15} />,
      label: "Hồ sơ của tôi",
      onClick: () => navigate("/profile"),
    },
    {
      icon: <Clock size={15} />,
      label: "Lịch sử xem",
      onClick: () => navigate("/watch-history"),
    },
    {
      icon: <Shield size={15} />,
      label: "Bảo mật & 2FA",
      onClick: () => navigate("/settings/security"),
    },
    {
      icon: <Crown size={15} />,
      label: isPremium ? "Gói Premium" : "Nâng cấp Premium",
      onClick: () => navigate("/premium"),
      isPremium,
    },
  ];

  const navBg = scrolled ? "rgba(0,0,0,0.97)" : "transparent";
  const navBorder = scrolled
    ? "1px solid rgba(255,255,255,0.06)"
    : "1px solid transparent";
  const ACCENT = "#e5181e";

  const hasMovies = results.length > 0;
  const hasTvShows = tvShows.length > 0;
  const hasActors = actors.length > 0;

  const dropdownVisible =
    showResults &&
    (searching ||
      hasMovies ||
      hasTvShows ||
      hasActors ||
      debouncedQuery.trim().length >= 2);

  return (
    <motion.nav
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
        transition:
          "background 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease",
      }}
    >
      <div className="flex items-center justify-between px-4 md:px-8 py-3">
        {/* ── Logo ── */}
        <motion.div
          className="flex items-center gap-1.5 cursor-pointer"
          onClick={goHome}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span
            className="text-3xl font-black leading-none"
            style={{ color: ACCENT, letterSpacing: "-0.02em" }}
          >
            UIA
          </span>
          <span
            className="text-2xl font-bold leading-none"
            style={{
              color: scrolled ? "#ffffff" : "#f0f0f0",
              letterSpacing: "0.06em",
              transition: "color 0.3s",
            }}
          >
            MOVIE
          </span>
        </motion.div>

        {/* ── Nav links (desktop) ── */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { label: "Trang chủ", path: "/" },
            { label: "Yêu thích", path: "/favorites" },
            { label: "Trending", path: "/trending" },
          ].map(({ label, path }, i) => (
            <motion.button
              key={label}
              onClick={() => (path === "/" ? goHome() : navigate(path))}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transitions.TRANSITION_NORMAL, delay: i * 0.07 }}
              className="relative px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 group"
              style={{
                color: scrolled
                  ? "rgba(255,255,255,0.75)"
                  : "rgba(255,255,255,0.7)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
              whileHover={{ color: "#ffffff" }}
            >
              <span
                className="relative z-10"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {label}
              </span>
              <motion.span
                className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
            </motion.button>
          ))}
        </div>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-1">
          {/* ── Search ── */}
          <AnimatePresence mode="wait">
            {showSearch ? (
              <motion.div
                key="search-open"
                ref={searchWrapRef}
                initial={{ width: 36, opacity: 0 }}
                animate={{ width: isMobile ? 230 : 340, opacity: 1 }}
                exit={{ width: 36, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                style={{ position: "relative" }}
              >
                {/* Input bar */}
                <form
                  onSubmit={handleSearchSubmit}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    overflow: "hidden",
                    background: scrolled
                      ? "rgba(255,255,255,0.07)"
                      : "rgba(0,0,0,0.45)",
                    borderRadius: dropdownVisible ? "10px 10px 0 0" : 10,
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderBottom: dropdownVisible
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "1px solid rgba(255,255,255,0.12)",
                    backdropFilter: "blur(12px)",
                    transition: "border-radius 0.15s",
                  }}
                >
                  <button
                    type="submit"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "8px 10px",
                      display: "flex",
                      color: "rgba(255,255,255,0.45)",
                      flexShrink: 0,
                    }}
                  >
                    <Search size={15} />
                  </button>

                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") closeSearch();
                    }}
                    onFocus={() => {
                      if (results.length > 0 || tvShows.length > 0)
                        setShowResults(true);
                    }}
                    placeholder="Tìm phim, TV show, diễn viên..."
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      outline: "none",
                      color: "#fff",
                      fontSize: 13,
                      fontFamily: "'DM Sans', sans-serif",
                      padding: "9px 0",
                      minWidth: 0,
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      searchQuery ? setSearchQuery("") : closeSearch()
                    }
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "8px 10px",
                      display: "flex",
                      color: "rgba(255,255,255,0.3)",
                      flexShrink: 0,
                    }}
                  >
                    <X size={14} />
                  </button>
                </form>

                {/* Dropdown kết quả */}
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
                        background: "rgba(10,10,10,0.98)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderTop: "none",
                        borderRadius: "0 0 12px 12px",
                        overflow: "hidden",
                        backdropFilter: "blur(20px)",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.75)",
                        zIndex: 9998,
                      }}
                    >
                      {/* ── Loading skeleton ── */}
                      {searching && (
                        <SearchShimmer movieRows={3} actorRows={2} showActors />
                      )}

                      {/* ── Kết quả phim ── */}
                      {!searching && hasMovies && (
                        <>
                          {/* Section header: Phim */}
                          <div
                            style={{
                              padding: "8px 16px 4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "'Nunito', sans-serif",
                                fontSize: 10,
                                fontWeight: 700,
                                color: "rgba(255,255,255,0.25)",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                              }}
                            >
                              Danh sách phim
                            </span>
                            <span
                              style={{
                                fontFamily: "'Nunito', sans-serif",
                                fontSize: 10,
                                color: "rgba(255,255,255,0.18)",
                              }}
                            >
                              {results.length} kết quả
                            </span>
                          </div>
                          {results.map((movie) => (
                            <MovieResultItem
                              key={movie.id}
                              movie={movie}
                              onClick={() => handleResultClick(movie)}
                            />
                          ))}
                        </>
                      )}

                      {/* ── Divider movies / tvshows ── */}
                      {!searching && hasMovies && hasTvShows && (
                        <div
                          style={{
                            margin: "4px 0",
                            height: 1,
                            background: "rgba(255,255,255,0.06)",
                          }}
                        />
                      )}

                      {/* ── Kết quả TV show ── */}
                      {!searching && hasTvShows && (
                        <>
                          <div
                            style={{
                              padding: "8px 16px 4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "'Nunito', sans-serif",
                                fontSize: 10,
                                fontWeight: 700,
                                color: "rgba(255,255,255,0.25)",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                              }}
                            >
                              TV Show
                            </span>
                            <span
                              style={{
                                fontFamily: "'Nunito', sans-serif",
                                fontSize: 10,
                                color: "rgba(255,255,255,0.18)",
                              }}
                            >
                              {tvShows.length} kết quả
                            </span>
                          </div>
                          {tvShows.map((show) => (
                            <MovieResultItem
                              key={show.id}
                              movie={{
                                ...show,
                                releaseDate: show.firstAirDate,
                                _isTvShow: true,
                              }}
                              onClick={() => {
                                navigate(`/tvshow/${show.id}/info`);
                                closeSearch();
                              }}
                            />
                          ))}
                        </>
                      )}

                      {/* ── Divider ── */}
                      {!searching && hasMovies && hasActors && (
                        <div
                          style={{
                            margin: "4px 0",
                            height: 1,
                            background: "rgba(255,255,255,0.06)",
                          }}
                        />
                      )}

                      {/* ── Kết quả diễn viên ── */}
                      {!searching && hasActors && (
                        <>
                          {/* Section header: Diễn viên */}
                          <div
                            style={{
                              padding: "8px 16px 4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "'Nunito', sans-serif",
                                fontSize: 10,
                                fontWeight: 700,
                                color: "rgba(255,255,255,0.25)",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                              }}
                            >
                              Diễn viên
                            </span>
                          </div>
                          {actors.map((actor) => (
                            <ActorResultItem
                              key={actor.id}
                              actor={actor}
                              onClick={() => {
                                navigate(`/person/${toSlug(actor.name)}`, {
                                  state: { actor },
                                });
                                closeSearch();
                              }}
                            />
                          ))}
                        </>
                      )}

                      {/* Không có kết quả */}
                      {!searching &&
                        !hasMovies &&
                        !hasTvShows &&
                        !hasActors &&
                        debouncedQuery.trim().length >= 1 && (
                          <div
                            style={{
                              padding: "20px 14px",
                              textAlign: "center",
                              fontFamily: "'Nunito', sans-serif",
                              fontSize: 12,
                              color: "rgba(255,255,255,0.25)",
                            }}
                          >
                            Không tìm thấy kết quả nào cho&nbsp;
                            <span
                              style={{
                                color: "rgba(255,255,255,0.5)",
                                fontWeight: 700,
                              }}
                            >
                              "{searchQuery}"
                            </span>
                          </div>
                        )}

                      {/* Footer — xem tất cả */}
                      {!searching && (hasMovies || hasTvShows || hasActors) && (
                        <motion.button
                          type="button"
                          onClick={handleSearchSubmit}
                          whileHover={{
                            backgroundColor: "rgba(229,24,30,0.08)",
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            color: ACCENT,
                            fontFamily: "'Nunito', sans-serif",
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: "0.02em",
                          }}
                        >
                          <Search size={11} />
                          Xem tất cả kết quả cho "{searchQuery}"
                        </motion.button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.button
                key="search-icon"
                onClick={openSearch}
                whileHover={{
                  scale: 1.08,
                  backgroundColor: "rgba(255,255,255,0.1)",
                }}
                whileTap={{ scale: 0.94 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-2 rounded-lg"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: scrolled
                    ? "rgba(255,255,255,0.8)"
                    : "rgba(255,255,255,0.7)",
                }}
              >
                <Search size={18} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* ── Hamburger (mobile) ── */}
          {isMobile && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setShowMobileMenu((v) => !v)}
              className="p-2 rounded-lg md:hidden"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          )}

          {/* ── Bộ lọc button (right actions) ── */}
          <motion.button
            ref={filterBtnRef}
            onClick={() => setShowFilter((p) => !p)}
            whileHover={{
              scale: 1.08,
              backgroundColor: "rgba(255,255,255,0.1)",
            }}
            whileTap={{ scale: 0.94 }}
            className="hidden md:flex items-center justify-center p-2 rounded-lg"
            style={{
              background: showFilter ? "rgba(229,24,30,0.15)" : "transparent",
              border: "none",
              cursor: "pointer",
              color: showFilter
                ? ACCENT
                : scrolled
                  ? "rgba(255,255,255,0.8)"
                  : "rgba(255,255,255,0.7)",
            }}
          >
            <IconAdjustmentsHorizontal size={18} strokeWidth={1.6} />
          </motion.button>

          {/* ── Divider ── */}
          <div
            className="mx-1 h-5 w-px"
            style={{
              background: scrolled
                ? "rgba(255,255,255,0.12)"
                : "rgba(255,255,255,0.08)",
              transition: "background 0.3s",
            }}
          />

          {/* ── Đăng nhập / Đăng ký (chỉ khi chưa đăng nhập) ── */}
          {!isLoggedIn ? (
            <div className="flex items-center gap-2.5">
              <motion.button
                onClick={() =>
                  navigate("/welcome", { state: { view: "register" } })
                }
                whileHover="hover"
                whileTap={{ scale: 0.96 }}
                initial="rest"
                animate="rest"
                className="relative px-4 py-[7px] rounded-lg overflow-hidden"
                style={{
                  border: "1px solid rgba(255,255,255,0.1)",
                  cursor: "pointer",
                  backdropFilter: "blur(6px)",
                }}
              >
                <motion.span
                  variants={{
                    rest: { opacity: 0 },
                    hover: { opacity: 1 },
                  }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute inset-0"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                />
                <motion.span
                  variants={{
                    rest: { color: "rgba(255,255,255,0.55)" },
                    hover: { color: "rgba(255,255,255,0.95)" },
                  }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="relative text-[13px] font-semibold whitespace-nowrap tracking-wide"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Đăng ký
                </motion.span>
              </motion.button>

              <motion.button
                onClick={() =>
                  navigate("/welcome", { state: { view: "login" } })
                }
                whileHover={{
                  scale: 1.035,
                  boxShadow: "0 6px 20px rgba(229,24,30,0.45)",
                }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                className="px-[18px] py-[7px] rounded-lg"
                style={{
                  background:
                    "linear-gradient(135deg, #ff2b32 0%, #e5181e 55%, #c81017 100%)",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 3px 12px rgba(229,24,30,0.3)",
                }}
              >
                <span
                  className="text-[13px] font-semibold text-white whitespace-nowrap tracking-wide"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Đăng nhập
                </span>
              </motion.button>
            </div>
          ) : (
          <div className="relative" ref={dropdownRef}>
            <motion.button
              onClick={() => setShowDropdown((p) => !p)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
              style={{
                background: showDropdown
                  ? "rgba(255,255,255,0.1)"
                  : "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              {/* ← UserAvatar thay thế khối avatar inline */}
              <UserAvatar
                avatarUrl={currentUser?.avatar}
                name={currentUser?.name}
                size={28}
                style={{
                  boxShadow: scrolled
                    ? "0 2px 8px rgba(229,24,30,0.4)"
                    : "0 2px 12px rgba(229,24,30,0.5)",
                  transition: "box-shadow 0.3s",
                }}
              />

              {/* Tên (chỉ hiện khi scrolled) */}
              <AnimatePresence>
                {scrolled && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs font-semibold text-white overflow-hidden whitespace-nowrap"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      maxWidth: 80,
                    }}
                  >
                    {currentUser?.name?.split(" ")[0] ?? "User"}
                  </motion.span>
                )}
              </AnimatePresence>

              <motion.div
                animate={{ rotate: showDropdown ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }}
              >
                <ChevronDown size={13} />
              </motion.div>
            </motion.button>

            {/* Dropdown panel */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-52 rounded-2xl overflow-hidden shadow-2xl"
                  style={{
                    background: "rgba(12,12,12,0.97)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  {/* User info */}
                  <div
                    className="px-4 py-3"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* ← UserAvatar trong dropdown */}
                      <UserAvatar
                        avatarUrl={currentUser?.avatar}
                        name={currentUser?.name}
                        size={32}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate leading-tight">
                          {currentUser?.name ?? "Người dùng"}
                        </p>
                        <p
                          className="text-xs truncate leading-tight"
                          style={{ color: "rgba(255,255,255,0.3)" }}
                        >
                          {currentUser?.email ?? ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5 px-1.5">
                    {dropdownItems.map(
                      ({ icon, label, onClick, isPremium: itemIsPremium }) => (
                        <motion.button
                          key={label}
                          onClick={() => {
                            setShowDropdown(false);
                            onClick();
                          }}
                          whileHover={{
                            backgroundColor:
                              itemIsPremium && !isPremium
                                ? "rgba(234,179,8,0.12)"
                                : "rgba(255,255,255,0.06)",
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                          }}
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
                              color: itemIsPremium
                                ? isPremium
                                  ? "#facc15"
                                  : "#fbbf24"
                                : "rgba(255,255,255,0.7)",
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
                      ),
                    )}
                  </div>

                  {/* Logout */}
                  <div
                    className="px-1.5 pb-1.5"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <motion.button
                      onClick={handleLogout}
                      whileHover={{ backgroundColor: "rgba(229,24,30,0.1)" }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left mt-1"
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <LogOut
                        size={15}
                        style={{ color: "rgba(229,24,30,0.7)" }}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{
                          color: "#e5181e",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        Đăng xuất
                      </span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          )}
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {isMobile && showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "rgba(8,8,8,0.98)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
              padding: "12px 16px 20px",
              zIndex: 9998,
            }}
          >
            {[
              { label: "Trang chủ", path: "/" },
              // Các mục dưới đây cần đăng nhập → chỉ hiện khi đã login
              ...(isLoggedIn
                ? [
                    { label: "Yêu thích", path: "/favorites" },
                    { label: "Watchlist", path: "/search?filter=watchlist" },
                    { label: "Lịch sử xem", path: "/watch-history" },
                  ]
                : []),
            ].map(({ label, path }) => (
              <button
                key={label}
                onClick={() => {
                  path === "/" ? goHome() : navigate(path);
                  setShowMobileMenu(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 8px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.75)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {label}
              </button>
            ))}
            {/* Bộ lọc — mobile */}
            <button
              onClick={() => {
                setShowFilter((p) => !p);
                setShowMobileMenu(false);
              }}
              F
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                textAlign: "left",
                padding: "12px 8px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.75)",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <IconAdjustmentsHorizontal size={16} strokeWidth={1.6} />
              Bộ lọc
            </button>
            {isLoggedIn ? (
              <button
                onClick={() => {
                  handleLogout();
                  setShowMobileMenu(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 8,
                  padding: "12px 8px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#e5181e",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                <LogOut size={16} /> Đăng xuất
              </button>
            ) : (
              <div
                style={{ display: "flex", gap: 8, marginTop: 8 }}
              >
                <button
                  onClick={() => {
                    navigate("/welcome", { state: { view: "login" } });
                    setShowMobileMenu(false);
                  }}
                  style={{
                    display: "flex",
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "12px 8px",
                    background:
                      "linear-gradient(135deg, #ff2b32 0%, #e5181e 55%, #c81017 100%)",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    color: "#fff",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                    boxShadow: "0 3px 12px rgba(229,24,30,0.3)",
                  }}
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => {
                    navigate("/welcome", { state: { view: "register" } });
                    setShowMobileMenu(false);
                  }}
                  style={{
                    display: "flex",
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "12px 8px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                  }}
                >
                  Đăng ký
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filter Modal ── */}
      <NavbarFilterModal
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={handleFilterApply}
        anchorRef={filterBtnRef}
        currentTab={currentTab}
      />
    </motion.nav>
  );
};

export default Navbar;