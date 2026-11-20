// src/components/ui/NavbarFilterModal.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, X, RotateCcw, Check } from "lucide-react";
import genreService from "../../services/genreService";
import movieService from "../../services/movieService";
import tvShowService from "../../services/tvShowService";
import { C, FONT_BODY } from "../../context/homeTokens";
import { useIsMobile } from "../../hooks/common/useIsMobile";
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
const COUNTRY_COLLAPSED_COUNT = 12; // thu gọn: 12 quốc gia đầu, còn lại bấm "Xem thêm"
const YEAR_COLLAPSED_COUNT = 8; // mobile: 2 hàng × 4 cột, còn lại bấm "Xem thêm"

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


// Mỗi lựa chọn gồm cả tiêu chí + chiều sắp xếp → không cần nút "Giảm dần/Tăng dần" riêng.
const SORT_OPTIONS = {
  movie: [
    { key: "rating", sortBy: "rating", sortDesc: true, label: "Điểm cao" },
    { key: "new", sortBy: "releaseDate", sortDesc: true, label: "Mới nhất" },
    { key: "az", sortBy: "title", sortDesc: false, label: "Tên A-Z" },
  ],
  tvshow: [
    { key: "rating", sortBy: "rating", sortDesc: true, label: "Điểm cao" },
    { key: "new", sortBy: "firstairdate", sortDesc: true, label: "Mới nhất" },
    { key: "az", sortBy: "title", sortDesc: false, label: "Tên A-Z" },
  ],
};

const TV_STATUS_OPTIONS = [
  { value: "Returning Series", label: "Đang chiếu" },
  { value: "Ended", label: "Đã kết thúc" },
  { value: "Canceled", label: "Đã hủy" },
  { value: "In Production", label: "Đang sản xuất" },
];

const RATING_OPTIONS = [9, 8, 7, 6].map((v) => ({ value: v, label: `${v}+` }));
const CHIP_H = 40; // vùng chạm tối thiểu cho ngón tay

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

/** Tiêu đề nhóm + nút "Xóa" riêng cho từng nhóm (chỉ hiện khi nhóm đang có lựa chọn). */
const Section = ({ label, count = 0, onClear, children }) => (
  <section style={{ marginBottom: 26 }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 28,
        marginBottom: 10,
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 700,
          color: "rgba(255,255,255,0.9)",
          fontFamily: FONT_BODY,
        }}
      >
        {label}
        {count > 0 && (
          <span style={{ marginLeft: 8, color: ACCENT, fontWeight: 700 }}>{count}</span>
        )}
      </h3>
      {count > 0 && onClear && (
        <button
          type="button"
          onClick={onClear}
          style={{
            background: "none",
            border: "none",
            padding: "4px 0 4px 12px",
            color: "rgba(255,255,255,0.6)",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: FONT_BODY,
            cursor: "pointer",
          }}
        >
          Xóa
        </button>
      )}
    </div>
    {children}
  </section>
);

/** Chip chọn. Có dấu ✓ khi đang chọn để không phụ thuộc mỗi màu sắc. */
const Pill = ({ active, onClick, children, fill }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileTap={{ scale: 0.96 }}
    aria-pressed={active}
    style={{
      minHeight: CHIP_H,
      padding: fill ? "0 6px" : "0 14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      textAlign: "center",
      borderRadius: 999,
      border: `1px solid ${active ? ACCENT : "rgba(255,255,255,0.14)"}`,
      background: active ? `${ACCENT}26` : "rgba(255,255,255,0.05)",
      color: active ? "#fff" : "rgba(255,255,255,0.75)",
      fontSize: 14,
      fontWeight: active ? 700 : 500,
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
    {active && <Check size={13} strokeWidth={3} style={{ flexShrink: 0, color: ACCENT }} />}
    {children}
  </motion.button>
);

/**
 * Nhóm chip.
 * `cols`: lưới cột đều nhau (năm, điểm) — chip ngắn, cùng độ dài.
 * Không có `cols`: chip tự co theo chữ và xuống dòng (thể loại, quốc gia) → không bị cắt chữ.
 * Không còn chip "Tất cả": không chọn gì = tất cả; muốn bỏ chọn thì bấm "Xóa" ở tiêu đề nhóm.
 */
const PillGroup = ({ options, isActive, onSelect, cols }) => (
  <div
    style={{
      display: cols ? "grid" : "flex",
      ...(cols
        ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
        : { flexWrap: "wrap" }),
      gap: 8,
      maxWidth: "100%",
      minWidth: 0,
    }}
  >
    {options.map(({ value, label }) => (
      <Pill key={value} fill={!!cols} active={isActive(value)} onClick={() => onSelect(value)}>
        {label}
      </Pill>
    ))}
  </div>
);

/** Chọn 1 trong N (sắp xếp): thanh phân đoạn gọn trên một hàng. */
const Segmented = ({ options, isActive, onSelect }) => (
  <div
    role="radiogroup"
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      gap: 4,
      padding: 4,
      borderRadius: 12,
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.08)",
    }}
  >
    {options.map((o) => {
      const active = isActive(o);
      return (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={active}
          onClick={() => onSelect(o)}
          style={{
            minHeight: 38,
            padding: "0 6px",
            borderRadius: 9,
            border: "none",
            background: active ? ACCENT : "transparent",
            color: active ? "#fff" : "rgba(255,255,255,0.7)",
            fontSize: 13.5,
            fontWeight: active ? 700 : 500,
            fontFamily: FONT_BODY,
            cursor: "pointer",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            transition: "background .15s, color .15s",
          }}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

/** Nút "Xem thêm / Thu gọn" dùng chung */
const MoreButton = ({ expanded, hiddenCount, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    style={{
      marginTop: 10,
      minHeight: 32,
      background: "none",
      border: "none",
      padding: 0,
      color: ACCENT,
      fontSize: 13.5,
      fontWeight: 600,
      fontFamily: FONT_BODY,
      cursor: "pointer",
    }}
  >
    {expanded ? "Thu gọn" : `Xem thêm (${hiddenCount})`}
  </button>
);

/* ---------- Component chính ---------- */

const NavbarFilterModal = ({ isOpen, onClose, onApply, currentTab = "movie" }) => {
  const isMobile = useIsMobile();
  const isTv = currentTab === "tvshow";
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [genres, setGenres] = useState([]);
  const [countryCodes, setCountryCodes] = useState(FALLBACK_COUNTRIES);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [showAllYears, setShowAllYears] = useState(false);

  // Đổi tab Phim ⇄ TV: reset toàn bộ (sortBy "releaseDate" / "firstairdate" và status không dùng chung được).
  useEffect(() => {
    setFilter(DEFAULT_FILTER);
    setShowAllCountries(false);
    setShowAllYears(false);
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

  // Mobile: thu gọn năm còn 2 hàng; năm đang chọn luôn phải nhìn thấy. Desktop: hiện đủ.
  const collapseYears = isMobile && !showAllYears;
  const yearOptions = useMemo(() => {
    if (!collapseYears) return YEAR_OPTIONS;
    const head = YEAR_OPTIONS.slice(0, YEAR_COLLAPSED_COUNT);
    const selected = YEAR_OPTIONS.find((y) => y.value === filter.year);
    return selected && !head.includes(selected) ? [...head.slice(0, -1), selected] : head;
  }, [collapseYears, filter.year]);

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
        style={{ width: 40, height: 40, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "rgba(255,255,255,0.7)", cursor: "pointer" }}
      >
        <X size={16} />
      </button>
    </div>
  );

  // Footer: Đặt lại luôn hiện (mờ khi chưa chọn gì) để nút Áp dụng không bị nhảy vị trí.
  const footer = (
    <div style={{ display: "flex", gap: 10 }}>
      <button
        type="button"
        onClick={() => setFilter(DEFAULT_FILTER)}
        disabled={activeCount === 0}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 48, padding: "0 18px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 12, color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 600, fontFamily: FONT_BODY, cursor: activeCount === 0 ? "default" : "pointer", opacity: activeCount === 0 ? 0.4 : 1 }}
      >
        <RotateCcw size={14} /> Đặt lại
      </button>
      <button
        type="button"
        onClick={handleApply}
        style={{ flex: 1, height: 48, background: ACCENT, border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: FONT_BODY, cursor: "pointer", boxShadow: `0 4px 16px ${ACCENT}55` }}
      >
        Áp dụng{activeCount > 0 ? ` (${activeCount})` : ""}
      </button>
    </div>
  );

  const sortOptions = SORT_OPTIONS[isTv ? "tvshow" : "movie"];

  const sortSection = (
    <Section label="Sắp xếp">
      <Segmented
        options={sortOptions}
        isActive={(o) => filter.sortBy === o.sortBy && filter.sortDesc === o.sortDesc}
        onSelect={(o) => patch({ sortBy: o.sortBy, sortDesc: o.sortDesc })}
      />
    </Section>
  );

  const genreSection = (
    <Section label="Thể loại" count={filter.genreIds.length} onClear={() => patch({ genreIds: [] })}>
      <PillGroup
        options={genreOptions}
        isActive={(id) => filter.genreIds.includes(id)}
        onSelect={toggleGenre}
      />
    </Section>
  );

  const countrySection = (
    <Section
      label="Quốc gia"
      count={filter.originCountry ? 1 : 0}
      onClear={() => patch({ originCountry: null })}
    >
      <PillGroup
        options={countryOptions}
        isActive={(v) => filter.originCountry === v}
        onSelect={toggleField("originCountry")}
      />
      {hasMoreCountries && (
        <MoreButton
          expanded={showAllCountries}
          hiddenCount={countryCodes.length - COUNTRY_COLLAPSED_COUNT}
          onToggle={() => setShowAllCountries((v) => !v)}
        />
      )}
    </Section>
  );

  const yearSection = (
    <Section
      label={isTv ? "Năm phát sóng đầu tiên" : "Năm phát hành"}
      count={filter.year ? 1 : 0}
      onClear={() => patch({ year: null })}
    >
      <PillGroup
        options={yearOptions}
        isActive={(y) => filter.year === y}
        onSelect={toggleField("year")}
        cols={4}
      />
      {isMobile && (
        <MoreButton
          expanded={showAllYears}
          hiddenCount={YEAR_OPTIONS.length - YEAR_COLLAPSED_COUNT}
          onToggle={() => setShowAllYears((v) => !v)}
        />
      )}
    </Section>
  );

  const ratingSection = (
    <Section
      label="Điểm IMDb tối thiểu"
      count={filter.minRating != null ? 1 : 0}
      onClear={() => patch({ minRating: null })}
    >
      <PillGroup
        options={RATING_OPTIONS}
        isActive={(v) => filter.minRating === v}
        onSelect={toggleField("minRating")}
        cols={4}
      />
    </Section>
  );

  const statusSection = isTv && (
    <Section label="Trạng thái" count={filter.tvStatus ? 1 : 0} onClear={() => patch({ tvStatus: "" })}>
      <PillGroup
        options={TV_STATUS_OPTIONS}
        isActive={(v) => filter.tvStatus === v}
        onSelect={(v) => patch({ tvStatus: filter.tvStatus === v ? "" : v })}
      />
    </Section>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} header={header} footer={footer}>
      {isMobile ? (
        // Mobile: một cột, sắp xếp lên đầu (giống Shopee / Google Play), rồi các bộ lọc.
        <div style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}>
          {sortSection}
          {genreSection}
          {countrySection}
          {yearSection}
          {ratingSection}
          {statusSection}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: "0 36px",
            width: "100%",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          <div style={{ minWidth: 0 }}>
            {genreSection}
            {countrySection}
          </div>
          <div style={{ minWidth: 0 }}>
            {sortSection}
            {yearSection}
            {ratingSection}
            {statusSection}
          </div>
        </div>
      )}
    </BottomSheet>
  );
};

export default NavbarFilterModal;