// src/components/layout/NavbarFilterModal.jsx
// Filter panel drop xuống từ Navbar — hỗ trợ cả Movie lẫn TV Show trong 1 modal
// Usage: <NavbarFilterModal isOpen={showFilter} onClose={...} onApply={...} anchorRef={...} currentTab={activeTab} />
// Navbar cần đọc tab từ URL: const [searchParams] = useSearchParams(); const currentTab = searchParams.get("tab") || "movie";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  X,
  Search,
  RotateCcw,
  ArrowRight,
  Clapperboard,
  Tv,
  LayoutGrid,
} from "lucide-react";
import genreService from "../../services/genreService";
import { C, FONT_BODY, FONT_DISPLAY } from "../../context/homeTokens";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = C.accent;

const COUNTRIES = [
  { code: "US", label: "Âu Mỹ" },
  { code: "PL", label: "Ba Lan" },
  { code: "TW", label: "Đài Loan" },
  { code: "KR", label: "Hàn Quốc" },
  { code: "HK", label: "Hồng Kông" },
  { code: "JP", label: "Nhật Bản" },
  { code: "PH", label: "Philippines" },
  { code: "TH", label: "Thái Lan" },
  { code: "CN", label: "Trung Quốc" },
  { code: "VN", label: "Việt Nam" },
];

// sortBy value phải khớp với SortBy backend nhận (case-insensitive ok với .ToLower())
const SORT_OPTIONS = {
  movie:  [
    { value: "rating",      label: "Điểm IMDb" },
    { value: "releaseDate", label: "Mới nhất" },
    { value: "title",       label: "Tên A-Z" },
  ],
  tvshow: [
    { value: "rating",       label: "Điểm IMDb" },
    { value: "firstairdate", label: "Mới nhất" },
    { value: "title",        label: "Tên A-Z" },
  ],
};

const TV_STATUS_OPTIONS = [
  { value: "",                 label: "Tất cả" },
  { value: "Returning Series", label: "Đang chiếu" },
  { value: "Ended",            label: "Đã kết thúc" },
  { value: "Canceled",         label: "Đã hủy" },
  { value: "In Production",    label: "Đang sản xuất" },
];

const RATING_OPTIONS = [
  { min: 9, label: "9+" },
  { min: 8, label: "8+" },
  { min: 7, label: "7+" },
  { min: 6, label: "6+" },
  { min: 0, label: "Tất cả" },
];

const YEAR_RANGE = Array.from({ length: 17 }, (_, i) => 2026 - i); // 2026 → 2010

const DEFAULT_FILTER = {
  genreIds:      [],
  minRating:     null,
  originCountry: null,
  fromYear:      null,
  toYear:        null,
  sortBy:        "rating",
  sortDesc:      true,
  tvStatus:      "",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Section = ({ label, children }) => (
  <div style={{ marginBottom: 20 }}>
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.35)",
        marginBottom: 10,
        fontFamily: FONT_BODY,
      }}
    >
      {label}
    </p>
    {children}
  </div>
);

const Pill = ({ active, onClick, children, small }) => (
  <motion.button
    onClick={onClick}
    whileTap={{ scale: 0.95 }}
    style={{
      padding: small ? "4px 10px" : "5px 13px",
      borderRadius: 999,
      border: active ? `1px solid ${ACCENT}` : "1px solid rgba(255,255,255,0.1)",
      background: active ? `${ACCENT}22` : "rgba(255,255,255,0.04)",
      color: active ? "#fff" : "rgba(255,255,255,0.55)",
      fontSize: small ? 12 : 13,
      fontWeight: active ? 600 : 400,
      fontFamily: FONT_BODY,
      cursor: "pointer",
      whiteSpace: "nowrap",
      transition: "all 0.15s ease",
      flexShrink: 0,
    }}
  >
    {children}
  </motion.button>
);

// ─── Media Type Options ───────────────────────────────────────────────────────

const MEDIA_TYPE_OPTIONS = [
  { value: "all",    label: "Tất cả",  Icon: LayoutGrid   },
  { value: "movie",  label: "Phim lẻ", Icon: Clapperboard },
  { value: "tvshow", label: "Phim bộ", Icon: Tv           },
];

// ─── Media Type Tab Switcher (REMOVED - kept for reference) ──────────────────

const MediaTypeTabs_UNUSED = ({ value, onChange }) => (
  <div
    style={{
      display: "flex",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10,
      padding: 3,
      gap: 2,
    }}
  >
    {[
      { value: "movie",  label: "Phim",    Icon: Film },
      { value: "tvshow", label: "TV Show", Icon: Tv   },
    ].map(({ value: v, label, Icon }) => {
      const active = value === v;
      return (
        <motion.button
          key={v}
          onClick={() => onChange(v)}
          whileTap={{ scale: 0.97 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 14px",
            borderRadius: 7,
            border: "none",
            background: active ? ACCENT : "transparent",
            color: active ? "#fff" : "rgba(255,255,255,0.45)",
            fontSize: 12,
            fontWeight: active ? 700 : 500,
            fontFamily: FONT_BODY,
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: active ? `0 2px 8px ${ACCENT}55` : "none",
          }}
        >
          <Icon size={13} />
          {label}
        </motion.button>
      );
    })}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// NavbarFilterModal
// ═══════════════════════════════════════════════════════════════════════════════

const NavbarFilterModal = ({ isOpen, onClose, onApply, anchorRef, currentTab = "movie" }) => {
  const [filter, setFilter]     = useState(DEFAULT_FILTER);
  const [genres, setGenres]     = useState([]);
  const [yearSearch, setYearSearch] = useState("");
  const panelRef = useRef(null);

  // ── Load genres ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    genreService.getAllGenres().then((res) => {
      const list = res?.data ?? res ?? [];
      setGenres(Array.isArray(list) ? list : []);
    }).catch(() => setGenres([]));
  }, [isOpen]);

  // ── Click outside → close ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        anchorRef?.current && !anchorRef.current.contains(e.target)
      ) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose, anchorRef]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const toggleGenre = useCallback((id) => {
    setFilter((f) => ({
      ...f,
      genreIds: f.genreIds.includes(id)
        ? f.genreIds.filter((g) => g !== id)
        : [...f.genreIds, id],
    }));
  }, []);

  const toggleCountry = useCallback((code) => {
    setFilter((f) => ({ ...f, originCountry: f.originCountry === code ? null : code }));
  }, []);

  const setRating = useCallback((min) => {
    setFilter((f) => ({ ...f, minRating: min === 0 ? null : min }));
  }, []);

  const toggleYear = useCallback((year) => {
    setFilter((f) => {
      if (f.fromYear === year && f.toYear === year)
        return { ...f, fromYear: null, toYear: null };
      return { ...f, fromYear: year, toYear: year };
    });
  }, []);

  const reset = useCallback(() => {
    setFilter(DEFAULT_FILTER);
    setYearSearch("");
  }, []);

  // ── Build params & apply ────────────────────────────────────────────────────

  const handleApply = useCallback(() => {
    // Params chung cho cả Movie lẫn TV Show — SearchPage tự map sang đúng field
    const params = {
      page:     1,
      pageSize: 20,
      sortBy:   filter.sortBy,
      sortDesc: filter.sortDesc,
    };

    if (filter.genreIds.length)   params.genreIds      = filter.genreIds;
    if (filter.minRating != null) params.minRating     = filter.minRating;
    if (filter.originCountry)     params.originCountry = filter.originCountry;
    if (isTv && filter.tvStatus)  params.status        = filter.tvStatus;

    // Dùng fromYear/toYear — SearchPage sẽ map thành fromReleaseDate hoặc fromFirstAirDate tuỳ tab
    if (filter.fromYear || filter.toYear) {
      const from = filter.fromYear ?? filter.toYear;
      const to   = filter.toYear   ?? filter.fromYear;
      params.fromYear = Math.min(from, to);
      params.toYear   = Math.max(from, to);
    }

    onApply?.(params);
    onClose();
  }, [filter, onApply, onClose]);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const isTv = currentTab === "tvshow";

  const activeCount =
    filter.genreIds.length +
    (filter.minRating != null ? 1 : 0) +
    (filter.originCountry ? 1 : 0) +
    (filter.fromYear || filter.toYear ? 1 : 0) +
    (isTv && filter.tvStatus ? 1 : 0);

  const filteredYears = yearSearch
    ? YEAR_RANGE.filter((y) => String(y).includes(yearSearch))
    : YEAR_RANGE;

  const yearSectionLabel = (() => {
    if (filter.fromYear && filter.toYear && filter.fromYear !== filter.toYear)
      return `Năm: ${filter.fromYear} – ${filter.toYear}`;
    if (filter.fromYear) return `Năm: ${filter.fromYear}`;
    return isTv ? "Năm phát sóng đầu tiên" : "Năm sản xuất";
  })();

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Invisible click-away layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "transparent",
              pointerEvents: "none",
              zIndex: 9990,
            }}
            onClick={onClose}
          />

          {/* Panel wrapper */}
          <div
            style={{
              position: "fixed",
              top: 64,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              padding: "0 16px",
              zIndex: 9999,
              pointerEvents: "none",
            }}
          >
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0,   scale: 1    }}
              exit={{    opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{
                pointerEvents: "all",
                width: "100%",
                maxWidth: 960,
                background: "rgba(10,10,10,0.97)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 16,
                boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(229,24,30,0.08)",
                backdropFilter: "blur(24px)",
                padding: "20px 24px 24px",
              }}
            >
              {/* ── Header ── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                  paddingBottom: 16,
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                {/* Left: icon + title + badge + tabs */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <SlidersHorizontal size={16} style={{ color: ACCENT }} />
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#fff",
                      fontFamily: FONT_BODY,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Bộ lọc
                  </span>

                  {/* Active filter count badge */}
                  <AnimatePresence>
                    {activeCount > 0 && (
                      <motion.span
                        key="badge"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{   scale: 0, opacity: 0 }}
                        style={{
                          background: ACCENT,
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 999,
                          padding: "1px 7px",
                          fontFamily: FONT_BODY,
                        }}
                      >
                        {activeCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right: reset + close */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <AnimatePresence>
                    {activeCount > 0 && (
                      <motion.button
                        key="reset"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{   opacity: 0, x: 8 }}
                        onClick={reset}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "5px 12px",
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 8,
                          color: "rgba(255,255,255,0.5)",
                          fontSize: 12,
                          fontFamily: FONT_BODY,
                          cursor: "pointer",
                        }}
                      >
                        <RotateCcw size={12} />
                        Đặt lại
                      </motion.button>
                    )}
                  </AnimatePresence>

                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 30, height: 30,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      color: "rgba(255,255,255,0.5)",
                      cursor: "pointer",
                    }}
                  >
                    <X size={14} />
                  </motion.button>
                </div>
              </div>

              {/* ── Body: 2-column grid ── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0 40px",
                }}
              >
                {/* ── LEFT COL ── */}
                <div>

                  {/* Quốc gia */}
                  <Section label="Quốc gia">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <Pill
                        active={!filter.originCountry}
                        onClick={() => setFilter((f) => ({ ...f, originCountry: null }))}
                      >
                        Tất cả
                      </Pill>
                      {COUNTRIES.map(({ code, label }) => (
                        <Pill
                          key={code}
                          active={filter.originCountry === code}
                          onClick={() => toggleCountry(code)}
                        >
                          {label}
                        </Pill>
                      ))}
                    </div>
                  </Section>

                  {/* Điểm IMDb */}
                  <Section label="Điểm IMDb tối thiểu">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {RATING_OPTIONS.map(({ min, label }) => (
                        <Pill
                          key={min}
                          active={min === 0 ? filter.minRating == null : filter.minRating === min}
                          onClick={() => setRating(min)}
                        >
                          {label}
                        </Pill>
                      ))}
                    </div>
                  </Section>

                  {/* Sắp xếp */}
                  <Section label="Sắp xếp theo">
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(SORT_OPTIONS[filter.mediaType] ?? SORT_OPTIONS["movie"]).map(({ value, label }) => (
                        <Pill
                          key={value}
                          active={filter.sortBy === value}
                          onClick={() => setFilter((f) => ({ ...f, sortBy: value }))}
                        >
                          {label}
                        </Pill>
                      ))}
                      <Pill
                        active={!filter.sortDesc}
                        onClick={() => setFilter((f) => ({ ...f, sortDesc: !f.sortDesc }))}
                      >
                        {filter.sortDesc ? "↓ Giảm dần" : "↑ Tăng dần"}
                      </Pill>
                    </div>
                  </Section>

                  {/* Trạng thái — chỉ TV Show */}
                  <AnimatePresence>
                    {isTv && (
                      <motion.div
                        key="tv-status"
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                        exit={{   opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}
                      >
                        <Section label="Trạng thái">
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {TV_STATUS_OPTIONS.map(({ value, label }) => (
                              <Pill
                                key={value}
                                active={filter.tvStatus === value}
                                onClick={() => setFilter((f) => ({ ...f, tvStatus: value }))}
                              >
                                {label}
                              </Pill>
                            ))}
                          </div>
                        </Section>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>

                {/* ── RIGHT COL ── */}
                <div>

                  {/* Thể loại */}
                  <Section
                    label={`Thể loại${filter.genreIds.length ? ` (${filter.genreIds.length})` : ""}`}
                  >
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <Pill
                        active={filter.genreIds.length === 0}
                        onClick={() => setFilter((f) => ({ ...f, genreIds: [] }))}
                      >
                        Tất cả
                      </Pill>
                      {genres.map((g) => (
                        <Pill
                          key={g.id}
                          active={filter.genreIds.includes(g.id)}
                          onClick={() => toggleGenre(g.id)}
                          small
                        >
                          {g.name}
                        </Pill>
                      ))}
                      {genres.length === 0 && (
                        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
                          Đang tải...
                        </span>
                      )}
                    </div>
                  </Section>

                  {/* Năm */}
                  <Section label={yearSectionLabel}>
                    {/* Year search input */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 8,
                        padding: "6px 10px",
                        width: 140,
                      }}
                    >
                      <Search size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
                      <input
                        value={yearSearch}
                        onChange={(e) => setYearSearch(e.target.value)}
                        placeholder="Nhập năm..."
                        style={{
                          background: "none",
                          border: "none",
                          outline: "none",
                          color: "#fff",
                          fontSize: 12,
                          fontFamily: FONT_BODY,
                          width: "100%",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      <Pill
                        active={!filter.fromYear && !filter.toYear}
                        onClick={() => setFilter((f) => ({ ...f, fromYear: null, toYear: null }))}
                        small
                      >
                        Tất cả
                      </Pill>
                      {filteredYears.map((y) => {
                        const inRange =
                          filter.fromYear && filter.toYear &&
                          y >= filter.fromYear && y <= filter.toYear;
                        const isEdge = y === filter.fromYear || y === filter.toYear;
                        return (
                          <Pill
                            key={y}
                            active={inRange || isEdge}
                            onClick={() => toggleYear(y)}
                            small
                          >
                            {y}
                          </Pill>
                        );
                      })}
                    </div>
                  </Section>

                </div>
              </div>

              {/* ── Footer ── */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: "9px 20px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: FONT_BODY,
                    cursor: "pointer",
                  }}
                >
                  Đóng
                </motion.button>

                <motion.button
                  onClick={handleApply}
                  whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "9px 22px",
                    background: ACCENT,
                    border: "none",
                    borderRadius: 10,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: FONT_BODY,
                    cursor: "pointer",
                    boxShadow: `0 4px 16px ${ACCENT}55`,
                  }}
                >
                  Lọc kết quả
                  <ArrowRight size={14} />
                </motion.button>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NavbarFilterModal;