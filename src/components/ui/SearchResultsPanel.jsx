// src/components/ui/SearchResultsPanel.jsx
// Nội dung kết quả tìm kiếm — dùng chung cho dropdown desktop và overlay mobile.
// Tối ưu:
//  • Stale-while-searching: đang gõ mà đã có kết quả cũ → giữ nguyên (mờ nhẹ) thay vì nháy sang shimmer.
//    Shimmer chỉ hiện ở lần tìm đầu tiên (chưa có gì để hiển thị).
//  • Truyền `onSelect={onMovie}` thẳng xuống row (không tạo closure / object mới mỗi render) → React.memo ở row phát huy.
//  • Dùng token từ homeTokens (C, FONT_BODY) thay vì hard-code màu/font.
import React, { memo } from "react";
import { Search } from "lucide-react";
import { MovieResultItem, ActorResultItem } from "./SearchResultItem";
import SearchShimmer from "./SearchShimmer";
import { C, FONT_BODY } from "../../context/homeTokens";

const CSS = `
.srp{transition:opacity .15s ease}
.srp[data-stale="true"]{opacity:.55}
.srp-all{transition:background-color .2s ease}
.srp-all:focus-visible{background:rgba(255,255,255,.05);outline:none}
@media (hover:hover){.srp-all:hover{background:rgba(255,255,255,.05)}}
@media (prefers-reduced-motion:reduce){.srp,.srp-all{transition:none}}
`;

const S = {
  header: { padding: "10px 18px 4px", display: "flex", justifyContent: "space-between" }, // 18px = khớp padding của row
  headerTitle: { fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" },
  headerCount: { fontFamily: FONT_BODY, fontSize: 10, color: "rgba(255,255,255,0.25)" },
  divider: { margin: "4px 0", height: 1, background: "rgba(255,255,255,0.06)" },
  empty: { padding: "28px 16px", textAlign: "center", fontFamily: FONT_BODY, fontSize: 13, color: "rgba(255,255,255,0.35)" },
  emptyQuery: { color: "rgba(255,255,255,0.6)" },
  seeAll: {
    width: "100%", minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    background: "transparent", border: "none", borderTop: "1px solid rgba(255,255,255,0.06)",
    color: C.accent, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
};

const EMPTY = [];

const SectionHeader = ({ title, count }) => (
  <div style={S.header}>
    <span style={S.headerTitle}>{title}</span>
    {count != null && <span style={S.headerCount}>{count} kết quả</span>}
  </div>
);

const Divider = () => <div style={S.divider} />;

const SearchResultsPanel = ({
  query,
  searching,
  movies = EMPTY,
  tvShows = EMPTY,
  actors = EMPTY,
  onMovie,
  onTvShow,
  onActor,
  onSeeAll,
}) => {
  const hasAny = movies.length + tvShows.length + actors.length > 0;

  // Chỉ hiện shimmer khi CHƯA có gì để cho người dùng xem
  if (searching && !hasAny) return <SearchShimmer movieRows={3} actorRows={2} showActors />;

  if (!hasAny) {
    return (
      <div style={S.empty}>
        Không tìm thấy kết quả cho <b style={S.emptyQuery}>"{query}"</b>
      </div>
    );
  }

  // Mỗi nhóm khai báo 1 lần; divider tự chèn giữa các nhóm có dữ liệu.
  const groups = [
    movies.length > 0 && {
      key: "movies",
      title: "Phim",
      count: movies.length,
      items: movies.map((m, i) => <MovieResultItem key={m.id} movie={m} index={i} onSelect={onMovie} />),
    },
    tvShows.length > 0 && {
      key: "tv",
      title: "TV Show",
      count: tvShows.length,
      // MovieResultItem tự đọc firstAirDate → không cần clone object (giữ reference ổn định cho memo)
      items: tvShows.map((s, i) => <MovieResultItem key={s.id} movie={s} index={i} onSelect={onTvShow} />),
    },
    actors.length > 0 && {
      key: "actors",
      title: "Diễn viên",
      items: actors.map((a, i) => <ActorResultItem key={a.id} actor={a} index={i} onSelect={onActor} />),
    },
  ].filter(Boolean);

  return (
    <div className="srp" data-stale={searching ? "true" : undefined} aria-busy={searching ? "true" : undefined}>
      <style>{CSS}</style>

      {groups.map((g, i) => (
        <section key={g.key}>
          {i > 0 && <Divider />}
          <SectionHeader title={g.title} count={g.count} />
          {g.items}
        </section>
      ))}

      <button type="button" className="srp-all" onClick={onSeeAll} style={S.seeAll}>
        <Search size={13} /> Xem tất cả kết quả cho "{query}"
      </button>
    </div>
  );
};

export default memo(SearchResultsPanel);