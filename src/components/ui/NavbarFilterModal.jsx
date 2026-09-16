// src/components/layout/NavbarFilterModal.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  X,
  Search,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import genreService from "../../services/genreService";
import { C, FONT_BODY } from "../../context/homeTokens";
import { useIsMobile } from "../../hooks/useIsMobile";

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

const SORT_OPTIONS = {
  movie: [
    { value: "rating", label: "Điểm IMDb" },
    { value: "releaseDate", label: "Mới nhất" },
    { value: "title", label: "Tên A-Z" },
  ],
  tvshow: [
    { value: "rating", label: "Điểm IMDb" },
    { value: "firstairdate", label: "Mới nhất" },
    { value: "title", label: "Tên A-Z" },
  ],
};

const TV_STATUS_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "Returning Series", label: "Đang chiếu" },
  { value: "Ended", label: "Đã kết thúc" },
  { value: "Canceled", label: "Đã hủy" },
  { value: "In Production", label: "Đang sản xuất" },
];

const RATING_OPTIONS = [
  { min: 9, label: "9+" },
  { min: 8, label: "8+" },
  { min: 7, label: "7+" },
  { min: 6, label: "6+" },
  { min: 0, label: "Tất cả" },
];

const YEAR_RANGE = Array.from({ length: 17 }, (_, i) => 2026 - i);

const DEFAULT_FILTER = {
  genreIds: [],
  minRating: null,
  originCountry: null,
  fromYear: null,
  toYear: null,
  sortBy: "rating",
  sortDesc: true,
  tvStatus: "",
};

const Section = ({ label, children, isMobile }) => (
  <div style={{ marginBottom: isMobile ? 16 : 20 }}>
    <p
      style={{
        fontSize: isMobile ? 11 : 11.5,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.45)",
        marginBottom: 8,
        fontFamily: FONT_BODY,
      }}
    >
      {label}
    </p>
    {children}
  </div>
);

const Pill = ({ active, onClick, children, small, isMobile }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileTap={{ scale: 0.95 }}
    style={{
      padding: small
        ? isMobile ? "4px 9px" : "4px 10px"
        : isMobile ? "5px 12px" : "6px 14px",
      borderRadius: 999,
      border: active ? `1px solid ${ACCENT}` : "1px solid rgba(255,255,255,0.12)",
      background: active ? `${ACCENT}25` : "rgba(255,255,255,0.05)",
      color: active ? "#ffffff" : "rgba(255,255,255,0.65)",
      fontSize: small ? (isMobile ? 11.5 : 12) : (isMobile ? 12.5 : 13),
      fontWeight: active ? 700 : 400,
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

const NavbarFilterModal = ({
  isOpen,
  onClose,
  onApply,
  currentTab = "movie",
}) => {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [genres, setGenres] = useState([]);
  const [yearSearch, setYearSearch] = useState("");
  const panelRef = useRef(null);

  // 1. Đặt isTv lên đầu để các hàm bên dưới sử dụng an toàn
  const isTv = currentTab === "tvshow";

  // 2. Load genres
  useEffect(() => {
    if (!isOpen) return;
    genreService
      .getAllGenres()
      .then((res) => {
        const list = res?.data ?? res ?? [];
        setGenres(Array.isArray(list) ? list : []);
      })
      .catch(() => setGenres([]));
  }, [isOpen]);

  // 3. Khóa scroll khi mở modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // 4. Bấm Escape để đóng
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // 5. Handlers
  const toggleGenre = useCallback((id) => {
    setFilter((f) => ({
      ...f,
      genreIds: f.genreIds.includes(id)
        ? f.genreIds.filter((g) => g !== id)
        : [...f.genreIds, id],
    }));
  }, []);

  const toggleCountry = useCallback((code) => {
    setFilter((f) => ({
      ...f,
      originCountry: f.originCountry === code ? null : code,
    }));
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

  const handleApply = useCallback(() => {
    const params = {
      page: 1,
      pageSize: 20,
      sortBy: filter.sortBy,
      sortDesc: filter.sortDesc,
    };

    if (filter.genreIds.length) params.genreIds = filter.genreIds;
    if (filter.minRating != null) params.minRating = filter.minRating;
    if (filter.originCountry) params.originCountry = filter.originCountry;
    if (isTv && filter.tvStatus) params.status = filter.tvStatus;

    if (filter.fromYear || filter.toYear) {
      const from = filter.fromYear ?? filter.toYear;
      const to = filter.toYear ?? filter.fromYear;
      params.fromYear = Math.min(from, to);
      params.toYear = Math.max(from, to);
    }

    onApply?.(params);
    onClose();
  }, [filter, onApply, onClose, isTv]);

  // 6. Derived states
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

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="filter-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0, 0, 0, 0.78)",
          backdropFilter: "blur(6px)",
          zIndex: 99998,
        }}
      />

      {/* Sheet Container */}
      <div
        key="filter-container"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: isMobile ? "flex-end" : "flex-start",
          padding: isMobile ? 0 : "74px 16px 20px",
          zIndex: 99999,
          pointerEvents: "none",
        }}
      >
        <motion.div
          ref={panelRef}
          initial={isMobile ? { y: "100%" } : { opacity: 0, y: -16, scale: 0.98 }}
          animate={isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
          exit={isMobile ? { y: "100%" } : { opacity: 0, y: -16, scale: 0.98 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          style={{
            pointerEvents: "auto",
            width: "100%",
            maxWidth: isMobile ? "100%" : 960,
            maxHeight: isMobile ? "82vh" : "85vh",
            display: "flex",
            flexDirection: "column",
            background: "#121212",
            border: isMobile ? "none" : "1px solid rgba(255,255,255,0.12)",
            borderTop: isMobile ? "1px solid rgba(255,255,255,0.16)" : undefined,
            borderRadius: isMobile ? "20px 20px 0 0" : 16,
            boxShadow: "0 -8px 40px rgba(0,0,0,0.85)",
            padding: isMobile ? "14px 16px 24px" : "20px 24px 22px",
            boxSizing: "border-box",
          }}
        >
          {/* Thanh gạt bottom sheet trên Mobile */}
          {isMobile && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 4,
                  borderRadius: 99,
                  background: "rgba(255,255,255,0.25)",
                }}
              />
            </div>
          )}

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
              paddingBottom: 12,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <SlidersHorizontal size={17} style={{ color: ACCENT }} />
              <span
                style={{
                  fontSize: isMobile ? 15.5 : 17,
                  fontWeight: 800,
                  color: "#ffffff",
                  fontFamily: FONT_BODY,
                }}
              >
                Bộ lọc {isTv ? "TV Series" : "Phim"}
              </span>

              {activeCount > 0 && (
                <span
                  style={{
                    background: ACCENT,
                    color: "#fff",
                    fontSize: 10.5,
                    fontWeight: 700,
                    borderRadius: 999,
                    padding: "1px 7px",
                    fontFamily: FONT_BODY,
                  }}
                >
                  {activeCount}
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 12,
                    fontFamily: FONT_BODY,
                    cursor: "pointer",
                  }}
                >
                  <RotateCcw size={11} />
                  Đặt lại
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 30,
                  height: 30,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              paddingRight: isMobile ? 2 : 8,
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: isMobile ? "0px" : "0 36px",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {/* CỘT 1 */}
            <div>
              <Section
                label={`Thể loại${filter.genreIds.length ? ` (${filter.genreIds.length})` : ""}`}
                isMobile={isMobile}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  <Pill
                    active={filter.genreIds.length === 0}
                    onClick={() => setFilter((f) => ({ ...f, genreIds: [] }))}
                    isMobile={isMobile}
                  >
                    Tất cả
                  </Pill>
                  {genres.map((g) => (
                    <Pill
                      key={g.id}
                      active={filter.genreIds.includes(g.id)}
                      onClick={() => toggleGenre(g.id)}
                      small
                      isMobile={isMobile}
                    >
                      {g.name}
                    </Pill>
                  ))}
                </div>
              </Section>

              <Section label="Quốc gia" isMobile={isMobile}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  <Pill
                    active={!filter.originCountry}
                    onClick={() => setFilter((f) => ({ ...f, originCountry: null }))}
                    isMobile={isMobile}
                  >
                    Tất cả
                  </Pill>
                  {COUNTRIES.map(({ code, label }) => (
                    <Pill
                      key={code}
                      active={filter.originCountry === code}
                      onClick={() => toggleCountry(code)}
                      isMobile={isMobile}
                    >
                      {label}
                    </Pill>
                  ))}
                </div>
              </Section>
            </div>

            {/* CỘT 2 */}
            <div>
              <Section label={yearSectionLabel} isMobile={isMobile}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 8,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: "5px 9px",
                    width: isMobile ? 120 : 130,
                  }}
                >
                  <Search size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
                  <input
                    value={yearSearch}
                    onChange={(e) => setYearSearch(e.target.value)}
                    placeholder="Tìm năm..."
                    style={{
                      background: "none",
                      border: "none",
                      outline: "none",
                      color: "#fff",
                      fontSize: 11.5,
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
                    isMobile={isMobile}
                  >
                    Tất cả
                  </Pill>
                  {filteredYears.map((y) => {
                    const inRange =
                      filter.fromYear &&
                      filter.toYear &&
                      y >= filter.fromYear &&
                      y <= filter.toYear;
                    const isEdge = y === filter.fromYear || y === filter.toYear;
                    return (
                      <Pill
                        key={y}
                        active={inRange || isEdge}
                        onClick={() => toggleYear(y)}
                        small
                        isMobile={isMobile}
                      >
                        {y}
                      </Pill>
                    );
                  })}
                </div>
              </Section>

              <Section label="Điểm IMDb tối thiểu" isMobile={isMobile}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {RATING_OPTIONS.map(({ min, label }) => (
                    <Pill
                      key={min}
                      active={min === 0 ? filter.minRating == null : filter.minRating === min}
                      onClick={() => setRating(min)}
                      isMobile={isMobile}
                    >
                      {label}
                    </Pill>
                  ))}
                </div>
              </Section>

              <Section label="Sắp xếp theo" isMobile={isMobile}>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {(SORT_OPTIONS[isTv ? "tvshow" : "movie"] ?? SORT_OPTIONS["movie"]).map(
                    ({ value, label }) => (
                      <Pill
                        key={value}
                        active={filter.sortBy === value}
                        onClick={() => setFilter((f) => ({ ...f, sortBy: value }))}
                        isMobile={isMobile}
                      >
                        {label}
                      </Pill>
                    )
                  )}
                  <Pill
                    active={!filter.sortDesc}
                    onClick={() => setFilter((f) => ({ ...f, sortDesc: !f.sortDesc }))}
                    isMobile={isMobile}
                  >
                    {filter.sortDesc ? "↓ Giảm dần" : "↑ Tăng dần"}
                  </Pill>
                </div>
              </Section>

              {isTv && (
                <Section label="Trạng thái phim bộ" isMobile={isMobile}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {TV_STATUS_OPTIONS.map(({ value, label }) => (
                      <Pill
                        key={value}
                        active={filter.tvStatus === value}
                        onClick={() => setFilter((f) => ({ ...f, tvStatus: value }))}
                        isMobile={isMobile}
                      >
                        {label}
                      </Pill>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </div>

          {/* Footer CTA */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: isMobile ? "8px 16px" : "9px 20px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                color: "rgba(255,255,255,0.65)",
                fontSize: isMobile ? 12.5 : 13,
                fontWeight: 600,
                fontFamily: FONT_BODY,
                cursor: "pointer",
              }}
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={handleApply}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: isMobile ? "8px 18px" : "9px 22px",
                background: ACCENT,
                border: "none",
                borderRadius: 8,
                color: "#ffffff",
                fontSize: isMobile ? 12.5 : 13,
                fontWeight: 700,
                fontFamily: FONT_BODY,
                cursor: "pointer",
                boxShadow: `0 4px 16px ${ACCENT}55`,
              }}
            >
              Áp dụng
              <ArrowRight size={13} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default NavbarFilterModal;