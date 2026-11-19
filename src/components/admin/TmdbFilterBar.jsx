// src/components/admin/TmdbFilterBar.jsx
// Thanh bộ lọc cho panel import TMDB (phim & TV show): thể loại, quốc gia, năm, điểm, lượt vote, sắp xếp.

import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { T, FONT_BODY as FONT } from '../../context/adminTokens';
import { useTmdbGenres } from '../../hooks/useTmdbDiscover';

export const EMPTY_FILTERS = {
  genres: [],      // id thể loại TMDB (số)
  country: '',     // ISO alpha-2
  yearFrom: '',
  yearTo: '',
  minRating: '',
  minVotes: '',
  sort: 'popular', // popular | rating | newest | oldest
};

const isYear = (v) => /^\d{4}$/.test(String(v ?? '').trim());

export function hasActiveFilters(f) {
  return (
    f.genres.length > 0 || !!f.country || isYear(f.yearFrom) || isYear(f.yearTo) ||
    !!f.minRating || !!f.minVotes || f.sort !== 'popular'
  );
}

// Khoá ổn định để so sánh bộ lọc (kể cả khi thứ tự chọn thể loại khác nhau)
export function filtersKey(f) {
  return JSON.stringify([
    [...f.genres].sort((a, b) => a - b), f.country, f.yearFrom, f.yearTo, f.minRating, f.minVotes, f.sort,
  ]);
}

const countActive = (f) =>
  (f.genres.length > 0 ? 1 : 0) + (f.country ? 1 : 0) +
  (isYear(f.yearFrom) || isYear(f.yearTo) ? 1 : 0) +
  (f.minRating ? 1 : 0) + (f.minVotes ? 1 : 0) + (f.sort !== 'popular' ? 1 : 0);

const COUNTRIES = [
  ['VN', 'Việt Nam'], ['KR', 'Hàn Quốc'], ['JP', 'Nhật Bản'], ['CN', 'Trung Quốc'],
  ['US', 'Mỹ'], ['GB', 'Anh'], ['FR', 'Pháp'], ['TH', 'Thái Lan'],
  ['IN', 'Ấn Độ'], ['HK', 'Hồng Kông'], ['TW', 'Đài Loan'],
];
const flagOf = (code) => String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

const RATINGS = [['', 'Mọi điểm'], ['5', '≥ 5.0'], ['6', '≥ 6.0'], ['7', '≥ 7.0'], ['8', '≥ 8.0']];
const VOTES   = [['', 'Mọi lượt vote'], ['50', '≥ 50 vote'], ['100', '≥ 100 vote'], ['500', '≥ 500 vote'], ['1000', '≥ 1000 vote']];
const SORTS   = [['popular', 'Phổ biến nhất'], ['rating', 'Điểm cao nhất'], ['newest', 'Mới nhất'], ['oldest', 'Cũ nhất']];

const Label = ({ children }) => (
  <p style={{
    fontFamily: FONT, fontSize: 10, fontWeight: 700, color: T.textMuted,
    textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px',
  }}>
    {children}
  </p>
);

const Chip = ({ active, onClick, children }) => (
  <button
    type="button" onClick={onClick} aria-pressed={active}
    style={{
      padding: '4px 10px', borderRadius: 999, cursor: 'pointer',
      border: `1px solid ${active ? T.accent : T.border}`,
      background: active ? T.accent : T.surface,
      color: active ? '#fff' : T.textSub,
      fontFamily: FONT, fontSize: 11, fontWeight: active ? 700 : 500,
      transition: 'all 0.12s', whiteSpace: 'nowrap',
    }}
  >
    {children}
  </button>
);

const controlStyle = {
  height: 30, padding: '0 8px', borderRadius: 7, background: T.surface,
  border: `1px solid ${T.border}`, fontFamily: FONT, fontSize: 12, color: T.text, outline: 'none',
};

export default function TmdbFilterBar({ kind, filters, onChange, hasQuery }) {
  const [open, setOpen] = useState(false);
  const genresQ = useTmdbGenres(kind);
  const activeCount = countActive(filters);

  const patch = (p) => onChange({ ...filters, ...p });
  const toggleGenre = (id) =>
    patch({
      genres: filters.genres.includes(id)
        ? filters.genres.filter((g) => g !== id)
        : [...filters.genres, id],
    });
  const digits = (v) => v.replace(/\D/g, '').slice(0, 4);

  return (
    <div style={{
      marginBottom: 14, borderRadius: 10, background: T.surface,
      border: `1px solid ${activeCount > 0 ? `${T.accent}60` : T.border}`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
        <button
          type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 7, background: 'none',
            border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
            fontFamily: FONT, fontSize: 12.5, fontWeight: 700, color: T.text,
          }}
        >
          <SlidersHorizontal size={13} color={T.accent} />
          Bộ lọc
          {activeCount > 0 && (
            <span style={{
              padding: '1px 7px', borderRadius: 999, background: T.accent, color: '#fff',
              fontSize: 10, fontWeight: 700,
            }}>
              {activeCount}
            </span>
          )}
          {open ? <ChevronUp size={13} color={T.textMuted} /> : <ChevronDown size={13} color={T.textMuted} />}
        </button>
        {activeCount > 0 && (
          <button
            type="button" onClick={() => onChange(EMPTY_FILTERS)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: FONT, fontSize: 11, color: T.textMuted, padding: 0,
            }}
          >
            <RotateCcw size={11} /> Xoá lọc
          </button>
        )}
      </div>

      {open && (
        <div style={{
          padding: '4px 12px 12px', display: 'flex', flexDirection: 'column', gap: 12,
          borderTop: `1px solid ${T.border}`, paddingTop: 12,
        }}>
          {/* Thể loại */}
          <div>
            <Label>Thể loại (khớp tất cả)</Label>
            {genresQ.isPending && (
              <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, margin: 0 }}>Đang tải thể loại…</p>
            )}
            {genresQ.isError && (
              <p style={{ fontFamily: FONT, fontSize: 11, color: T.red ?? '#DC2626', margin: 0 }}>
                Không tải được thể loại từ TMDB.
              </p>
            )}
            {genresQ.data && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {genresQ.data.map((g) => (
                  <Chip key={g.id} active={filters.genres.includes(g.id)} onClick={() => toggleGenre(g.id)}>
                    {g.name}
                  </Chip>
                ))}
              </div>
            )}
          </div>

          {/* Quốc gia */}
          <div>
            <Label>Quốc gia sản xuất</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              <Chip active={!filters.country} onClick={() => patch({ country: '' })}>Tất cả</Chip>
              {COUNTRIES.map(([code, name]) => (
                <Chip key={code} active={filters.country === code} onClick={() => patch({ country: code })}>
                  {flagOf(code)} {name}
                </Chip>
              ))}
            </div>
          </div>

          {/* Năm + điểm + vote + sắp xếp */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <Label>Năm phát hành</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  inputMode="numeric" placeholder="Từ" value={filters.yearFrom}
                  onChange={(e) => patch({ yearFrom: digits(e.target.value) })}
                  style={{ ...controlStyle, width: '100%', minWidth: 0 }}
                />
                <span style={{ color: T.textMuted, fontSize: 11 }}>–</span>
                <input
                  inputMode="numeric" placeholder="Đến" value={filters.yearTo}
                  onChange={(e) => patch({ yearTo: digits(e.target.value) })}
                  style={{ ...controlStyle, width: '100%', minWidth: 0 }}
                />
              </div>
            </div>
            <div>
              <Label>Điểm TMDB</Label>
              <select
                value={filters.minRating} onChange={(e) => patch({ minRating: e.target.value })}
                style={{ ...controlStyle, width: '100%' }}
              >
                {RATINGS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <Label>Lượt vote</Label>
              <select
                value={filters.minVotes} onChange={(e) => patch({ minVotes: e.target.value })}
                style={{ ...controlStyle, width: '100%' }}
              >
                {VOTES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <Label>Sắp xếp</Label>
              <select
                value={filters.sort} onChange={(e) => patch({ sort: e.target.value })}
                disabled={hasQuery}
                title={hasQuery ? 'Khi tìm theo tên, kết quả xếp theo độ liên quan' : undefined}
                style={{ ...controlStyle, width: '100%', opacity: hasQuery ? 0.55 : 1 }}
              >
                {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          {hasQuery && (
            <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>
              Đang tìm theo tên: bộ lọc được áp dụng lên kết quả tìm kiếm, còn thứ tự theo độ liên quan.
            </p>
          )}
        </div>
      )}
    </div>
  );
}