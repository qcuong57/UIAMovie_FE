// src/components/ui/NavbarFilterModal.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, X, RotateCcw } from "lucide-react";
import genreService from "../../services/genreService";
import movieService from "../../services/movieService";
import tvShowService from "../../services/tvShowService";
import { C, FONT_BODY } from "../../context/homeTokens";
import { useIsMobile } from "../../hooks/useIsMobile";
import BottomSheet from "./BottomSheet";

const ACCENT = C.accent;

/* ---------- Quốc gia: lấy từ BE (chỉ nước THỰC SỰ có phim), FE chỉ lo nhãn ---------- */

// Chỉ dùng khi gọi API lỗi, để bộ lọc vẫn hoạt động.
const FALLBACK_COUNTRIES = ["US", "KR", "JP", "CN", "TH", "HK", "TW", "VN", "PH", "PL"];

// Nhãn ngắn gọn hơn Intl cho các nước hay gặp.
const COUNTRY_LABEL_OVERRIDES = {
  US: "Mỹ",
  GB: "Anh",
  HK: "Hồng Kông",
  TW: "Đài Loan",
  CN: "Trung Quốc",
};

// Nước hiện lên đầu danh sách (còn lại xếp A-Z theo tên tiếng Việt).
const PRIORITY_COUNTRIES = ["VN", "US", "KR", "JP", "CN", "TH", "HK", "TW", "GB"];
const COUNTRY_COLLAPSED_COUNT = 11; // + pill "Tất cả" = 12 ô (lưới 3 cột × 4 hàng)

let regionNames = null;
try {
  regionNames = new Intl.DisplayNames(["vi"], { type: "region" });
} catch {
  regionNames = null;
}

const countryLabel = (code) => {
  if (COUNTRY_LABEL_OVERRIDES[code]) return COUNTRY_LABEL_OVERRIDES[code];
  try {
    return regionNames?.of(code) || code;
  } catch {
    return code;
  }
};

const normalizeCountryList = (res) => {
  const raw = Array.isArray(res) ? res : (res?.data ?? []);
  const codes = (Array.isArray(raw) ? raw : [])
    .map((c) => (typeof c === "string" ? c : c?.code))
    .filter(Boolean)
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^[A-Z]{2}$/.test(c));
  return [...new Set(codes)];
};

// Cache cấp module: mở modal nhiều lần / đổi tab không gọi lại API.
const countryCache = {};
const loadCountries = (tab) => {
  if (!countryCache[tab]) {
    const fetcher =
      tab === "tvshow" ? tvShowService.getAvailableCountries : movieService.getAvailableCountries;
    countryCache[tab] = fetcher()
      .then(normalizeCountryList)
      .catch(() => {
        delete countryCache[tab]; // lỗi thì cho phép thử lại lần sau
        return null;
      });
  }
  return countryCache[tab];
};

const sortCountries = (codes) =>
  codes
    .map((code) => ({ value: code, label: countryLabel(code) }))
    .sort((a, b) => {
      const ia = PRIORITY_COUNTRIES.indexOf(a.value);
      const ib = PRIORITY_COUNTRIES.indexOf(b.value);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      return a.label.localeCompare(b.label, "vi");
    });


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
  { value: "Returning Series", label: "Đang chiếu" },
  { value: "Ended", label: "Đã kết thúc" },
  { value: "Canceled", label: "Đã hủy" },
  { value: "In Production", label: "Đang sản xuất" },
];

const RATING_OPTIONS = [9, 8, 7, 6].map((v) => ({ value: v, label: `${v}+` }));

const CURRENT_YEAR = new Date().getFullYear();
// 15 năm + pill "Tất cả" = 16 ô → vừa đúng lưới 4 cột x 4 hàng
const YEAR_OPTIONS = Array.from({ length: 15 }, (_, i) => {
  const y = CURRENT_YEAR - i;
  return { value: y, label: String(y) };
});

const DEFAULT_FILTER = {
  genreIds: [],
  minRating: null,
  originCountry: null,
  year: null,
  sortBy: "rating",
  sortDesc: true,
  tvStatus: "",
};

/* ---------- UI nhỏ dùng lại ---------- */

const Section = ({ label, children }) => (
  <div style={{ marginBottom: 22 }}>
    <p
      style={{
        margin: "0 0 10px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.45)",
        fontFamily: FONT_BODY,
      }}
    >
      {label}
    </p>
    {children}
  </div>
);

/** `fill` = pill nằm trong lưới → căn giữa chữ, bớt padding ngang. */
const Pill = ({ active, onClick, children, fill }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileTap={{ scale: 0.95 }}
    aria-pressed={active}
    style={{
      minHeight: 38, // vùng chạm đủ lớn cho ngón tay
      padding: fill ? "0 6px" : "0 14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      borderRadius: 999,
      border: `1px solid ${active ? ACCENT : "rgba(255,255,255,0.12)"}`,
      background: active ? `${ACCENT}25` : "rgba(255,255,255,0.05)",
      color: active ? "#fff" : "rgba(255,255,255,0.65)",
      fontSize: 13,
      fontWeight: active ? 700 : 400,
      fontFamily: FONT_BODY,
      cursor: "pointer",
      whiteSpace: "nowrap",
      minWidth: 0,
      maxWidth: "100%",
      overflow: "hidden",
      textOverflow: "ellipsis",
      transition: "background .15s, border-color .15s, color .15s",
    }}
  >
    {children}
  </motion.button>
);

/**
 * Nhóm pill dùng chung.
 * `cols`: lưới cột cố định (mobile) → pill luôn nằm gọn trong khung, KHÔNG cuộn ngang.
 * Không có `cols`: flex-wrap xuống dòng (desktop).
 * `onClear` thêm pill "Tất cả".
 */
const PillGroup = ({ options, isActive, onSelect, onClear, allActive, cols }) => (
  <div
    style={{
      display: cols ? "grid" : "flex",
      ...(cols
        ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
        : { flexWrap: "wrap" }),
      gap: 8,
      maxWidth: "100%",
      minWidth: 0,
      overflow: "hidden", // không bao giờ tràn ngang
    }}
  >
    {onClear && (
      <Pill fill={!!cols} active={allActive} onClick={onClear}>
        Tất cả
      </Pill>
    )}
    {options.map(({ value, label }) => (
      <Pill key={value} fill={!!cols} active={isActive(value)} onClick={() => onSelect(value)}>
        {label}
      </Pill>
    ))}
  </div>
);

/* ---------- Component chính ---------- */

const NavbarFilterModal = ({ isOpen, onClose, onApply, currentTab = "movie" }) => {
  const isMobile = useIsMobile();
  const isTv = currentTab === "tvshow";
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [genres, setGenres] = useState([]);
  const [countryCodes, setCountryCodes] = useState(FALLBACK_COUNTRIES);
  const [showAllCountries, setShowAllCountries] = useState(false);

  // Đổi tab Phim ⇄ TV: reset toàn bộ (sortBy "releaseDate" / "firstairdate" và status không dùng chung được).
  useEffect(() => {
    setFilter(DEFAULT_FILTER);
    setShowAllCountries(false);
  }, [currentTab]);

  const patch = useCallback((p) => setFilter((f) => ({ ...f, ...p })), []);
  const toggleField = (key) => (value) =>
    setFilter((f) => ({ ...f, [key]: f[key] === value ? null : value }));

  useEffect(() => {
    if (!isOpen || genres.length) return; // chỉ tải 1 lần
    genreService
      .getAllGenres()
      .then((res) => {
        const list = res?.data ?? res ?? [];
        setGenres(Array.isArray(list) ? list : []);
      })
      .catch(() => setGenres([]));
  }, [isOpen, genres.length]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    loadCountries(currentTab).then((codes) => {
      if (cancelled) return;
      setCountryCodes(codes?.length ? codes : FALLBACK_COUNTRIES);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, currentTab]);

  const countryOptions = useMemo(() => {
    const all = sortCountries(countryCodes);
    if (showAllCountries || all.length <= COUNTRY_COLLAPSED_COUNT) return all;
    const head = all.slice(0, COUNTRY_COLLAPSED_COUNT);
    // Nước đang chọn luôn phải nhìn thấy dù đang thu gọn.
    const selected = all.find((c) => c.value === filter.originCountry);
    return selected && !head.includes(selected) ? [...head.slice(0, -1), selected] : head;
  }, [countryCodes, showAllCountries, filter.originCountry]);

  const hasMoreCountries = countryCodes.length > COUNTRY_COLLAPSED_COUNT;

  const genreOptions = useMemo(
    () => genres.map((g) => ({ value: g.id, label: g.name })),
    [genres],
  );

  const toggleGenre = (id) =>
    setFilter((f) => ({
      ...f,
      genreIds: f.genreIds.includes(id)
        ? f.genreIds.filter((g) => g !== id)
        : [...f.genreIds, id],
    }));

  const activeCount =
    filter.genreIds.length +
    [filter.minRating, filter.originCountry, filter.year].filter((v) => v != null).length +
    (isTv && filter.tvStatus ? 1 : 0);

  const handleApply = () => {
    const params = { page: 1, pageSize: 20, sortBy: filter.sortBy, sortDesc: filter.sortDesc };
    if (filter.genreIds.length) params.genreIds = filter.genreIds;
    if (filter.minRating != null) params.minRating = filter.minRating;
    if (filter.originCountry) params.originCountry = filter.originCountry;
    if (isTv && filter.tvStatus) params.status = filter.tvStatus;
    if (filter.year) {
      // Tên tham số phải khớp DTO của BE: FilterMoviesDTO (…ReleaseDate) / FilterTvShowsDTO (…FirstAirDate).
      const [fromKey, toKey] = isTv
        ? ["fromFirstAirDate", "toFirstAirDate"]
        : ["fromReleaseDate", "toReleaseDate"];
      params[fromKey] = `${filter.year}-01-01`;
      params[toKey] = `${filter.year}-12-31`;
    }
    onApply?.(params);
    onClose();
  };

  const header = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <SlidersHorizontal size={17} style={{ color: ACCENT }} />
        <span style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: FONT_BODY }}>
          Bộ lọc {isTv ? "TV Series" : "Phim"}
        </span>
        {activeCount > 0 && (
          <span style={{ background: ACCENT, color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "1px 8px" }}>
            {activeCount}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng bộ lọc"
        style={{ width: 36, height: 36, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "rgba(255,255,255,0.7)", cursor: "pointer" }}
      >
        <X size={16} />
      </button>
    </div>
  );

  // Footer: Đặt lại + Áp dụng (đã có X, backdrop, Esc để đóng).
  const footer = (
    <div style={{ display: "flex", gap: 10 }}>
      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => setFilter(DEFAULT_FILTER)}
          style={{ display: "flex", alignItems: "center", gap: 6, height: 44, padding: "0 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 600, fontFamily: FONT_BODY, cursor: "pointer" }}
        >
          <RotateCcw size={13} /> Đặt lại
        </button>
      )}
      <button
        type="button"
        onClick={handleApply}
        style={{ flex: 1, height: 44, background: ACCENT, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: FONT_BODY, cursor: "pointer", boxShadow: `0 4px 16px ${ACCENT}55` }}
      >
        Áp dụng{activeCount > 0 ? ` (${activeCount})` : ""}
      </button>
    </div>
  );

  const sortOptions = SORT_OPTIONS[isTv ? "tvshow" : "movie"];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} header={header} footer={footer}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "minmax(0, 1fr)" : "minmax(0, 1fr) minmax(0, 1fr)",
          gap: isMobile ? 0 : "0 36px",
          width: "100%",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <Section label={`Thể loại${filter.genreIds.length ? ` (${filter.genreIds.length})` : ""}`}>
            <PillGroup
              options={genreOptions}
              isActive={(id) => filter.genreIds.includes(id)}
              onSelect={toggleGenre}
              onClear={() => patch({ genreIds: [] })}
              allActive={!filter.genreIds.length}
              cols={isMobile ? 2 : undefined}
            />
          </Section>

          <Section label="Quốc gia">
            <PillGroup
              options={countryOptions}
              isActive={(v) => filter.originCountry === v}
              onSelect={toggleField("originCountry")}
              onClear={() => patch({ originCountry: null })}
              allActive={!filter.originCountry}
              cols={isMobile ? 3 : undefined}
            />
            {hasMoreCountries && (
              <button
                type="button"
                onClick={() => setShowAllCountries((v) => !v)}
                style={{ marginTop: 10, background: "none", border: "none", padding: 0, color: ACCENT, fontSize: 13, fontWeight: 600, fontFamily: FONT_BODY, cursor: "pointer" }}
              >
                {showAllCountries ? "Thu gọn" : `Xem thêm (${countryCodes.length - COUNTRY_COLLAPSED_COUNT})`}
              </button>
            )}
          </Section>
        </div>

        <div style={{ minWidth: 0 }}>
          <Section label={filter.year ? `Năm: ${filter.year}` : isTv ? "Năm phát sóng đầu tiên" : "Năm sản xuất"}>
            <PillGroup
              options={YEAR_OPTIONS}
              isActive={(y) => filter.year === y}
              onSelect={toggleField("year")}
              onClear={() => patch({ year: null })}
              allActive={!filter.year}
              cols={isMobile ? 4 : undefined}
            />
          </Section>

          <Section label="Điểm IMDb tối thiểu">
            {/* "Tất cả" + 4 mức = đúng 5 cột */}
            <PillGroup
              options={RATING_OPTIONS}
              isActive={(v) => filter.minRating === v}
              onSelect={toggleField("minRating")}
              onClear={() => patch({ minRating: null })}
              allActive={filter.minRating == null}
              cols={isMobile ? 5 : undefined}
            />
          </Section>

          <Section label="Sắp xếp theo">
            <div
              style={{
                display: isMobile ? "grid" : "flex",
                ...(isMobile
                  ? { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }
                  : { flexWrap: "wrap" }),
                gap: 8,
                minWidth: 0,
              }}
            >
              {sortOptions.map(({ value, label }) => (
                <Pill key={value} fill={isMobile} active={filter.sortBy === value} onClick={() => patch({ sortBy: value })}>
                  {label}
                </Pill>
              ))}
              <Pill fill={isMobile} active={!filter.sortDesc} onClick={() => patch({ sortDesc: !filter.sortDesc })}>
                {filter.sortDesc ? "↓ Giảm dần" : "↑ Tăng dần"}
              </Pill>
            </div>
          </Section>

          {isTv && (
            <Section label="Trạng thái phim bộ">
              <PillGroup
                options={TV_STATUS_OPTIONS}
                isActive={(v) => filter.tvStatus === v}
                onSelect={(v) => patch({ tvStatus: filter.tvStatus === v ? "" : v })}
                onClear={() => patch({ tvStatus: "" })}
                allActive={!filter.tvStatus}
                cols={isMobile ? 2 : undefined}
              />
            </Section>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export default NavbarFilterModal;