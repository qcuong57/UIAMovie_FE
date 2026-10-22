// src/components/ui/SearchResultsPanel.jsx
// Nội dung kết quả tìm kiếm — dùng chung cho dropdown desktop và overlay mobile.
// Thay cho ~150 dòng JSX lặp trong Navbar (3 header giống hệt, 2 divider...).
import React from "react";
import { Search } from "lucide-react";
import { MovieResultItem, ActorResultItem } from "./SearchResultItem";
import SearchShimmer from "./SearchShimmer";

const ACCENT = "#e5181e";
const FONT = "'Nunito', sans-serif";

const SectionHeader = ({ title, count }) => (
  <div style={{ padding: "10px 16px 4px", display: "flex", justifyContent: "space-between" }}>
    <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
      {title}
    </span>
    {count != null && (
      <span style={{ fontFamily: FONT, fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{count} kết quả</span>
    )}
  </div>
);

const Divider = () => <div style={{ margin: "4px 0", height: 1, background: "rgba(255,255,255,0.06)" }} />;

const SearchResultsPanel = ({
  query,
  searching,
  movies,
  tvShows,
  actors,
  onMovie,
  onTvShow,
  onActor,
  onSeeAll,
}) => {
  if (searching) return <SearchShimmer movieRows={3} actorRows={2} showActors />;

  // Mỗi nhóm khai báo 1 lần; divider tự chèn giữa các nhóm có dữ liệu.
  const groups = [
    movies.length > 0 && {
      key: "movies",
      title: "Phim",
      count: movies.length,
      items: movies.map((m) => <MovieResultItem key={m.id} movie={m} onClick={() => onMovie(m)} />),
    },
    tvShows.length > 0 && {
      key: "tv",
      title: "TV Show",
      count: tvShows.length,
      items: tvShows.map((s) => (
        <MovieResultItem
          key={s.id}
          movie={{ ...s, releaseDate: s.firstAirDate, _isTvShow: true }}
          onClick={() => onTvShow(s)}
        />
      )),
    },
    actors.length > 0 && {
      key: "actors",
      title: "Diễn viên",
      items: actors.map((a) => <ActorResultItem key={a.id} actor={a} onClick={() => onActor(a)} />),
    },
  ].filter(Boolean);

  if (!groups.length) {
    return (
      <div style={{ padding: "28px 16px", textAlign: "center", fontFamily: FONT, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
        Không tìm thấy kết quả cho{" "}
        <b style={{ color: "rgba(255,255,255,0.6)" }}>"{query}"</b>
      </div>
    );
  }

  return (
    <>
      {groups.map((g, i) => (
        <section key={g.key}>
          {i > 0 && <Divider />}
          <SectionHeader title={g.title} count={g.count} />
          {g.items}
        </section>
      ))}

      <button
        type="button"
        onClick={onSeeAll}
        style={{ width: "100%", minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", color: ACCENT, fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
      >
        <Search size={13} /> Xem tất cả kết quả cho "{query}"
      </button>
    </>
  );
};

export default SearchResultsPanel;