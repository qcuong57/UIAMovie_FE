// src/components/ui/SearchResultItem.jsx
// Tối ưu:
//  • Hover / focus / entrance chạy hoàn toàn bằng CSS (transform + opacity → GPU), KHÔNG còn useState(hovered)
//    và KHÔNG còn framer-motion trên từng row → rê chuột không re-render React.
//  • React.memo + callback `onSelect(item)` ổn định → gõ phím chỉ render row mới/thay đổi.
//  • Style được inject 1 lần ở mức module (không lặp <style> trên mỗi row).
//  • Ảnh lỗi → hiện icon placeholder (trước đây chỉ để trống).
import React, { memo, useCallback } from "react";
import { Film, User, ArrowUpRight, Star } from "lucide-react";
import {
  C,
  FONT_DISPLAY,
  FONT_BODY,
  GENRE_VI,
  GENRE_COLOR,
} from "../../context/homeTokens";

/* =========================================================
   CSS (inject 1 lần)
========================================================= */

const EASE = "cubic-bezier(.22,1,.36,1)";

// Các thay đổi khi hover (chỉ trên thiết bị có chuột) + focus bàn phím (luôn)
const HOVER_RULES = [
  ["", "background:linear-gradient(90deg,rgba(255,255,255,.055),rgba(255,255,255,.025));border-left-color:var(--g-l)"],
  [" .sri-bar", "opacity:1;transform:none"],
  [" .sri-poster", "border-color:var(--g-b);box-shadow:0 8px 24px rgba(0,0,0,.28)"],
  [" .sri-img", "transform:scale(1.055)"],
  [" .sri-accent", "transform:scaleX(1)"],
  [" .sri-avatar", "transform:scale(1.035);border-color:var(--g-b);box-shadow:0 7px 20px rgba(0,0,0,.24)"],
  [" .sri-title", "color:var(--tx)"],
  [" .sri-go", "opacity:1;transform:none"],
];

const CSS = `
@keyframes sriIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.sri{position:relative;width:100%;display:flex;align-items:center;gap:14px;padding:10px 18px;
  background:transparent;border:0;border-left:1px solid transparent;cursor:pointer;text-align:left;
  box-sizing:border-box;overflow:hidden;font:inherit;color:inherit;outline:none;
  -webkit-tap-highlight-color:transparent;
  animation:sriIn .26s ${EASE} both;
  transition:background-color .2s ease,border-color .2s ease,transform .12s ease}
.sri:active{transform:scale(.992)}
.sri-bar{position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--g);box-shadow:0 0 14px var(--g-s);
  opacity:0;transform:translateX(-12px);transition:opacity .25s ease,transform .25s ${EASE};pointer-events:none}
.sri-poster,.sri-avatar{position:relative;flex:none;overflow:hidden;background:var(--surf);
  border:1px solid var(--bd);transition:border-color .25s ease,box-shadow .25s ease,transform .3s ${EASE}}
.sri-poster{width:48px;height:68px;min-width:48px;border-radius:8px;box-shadow:0 3px 12px rgba(0,0,0,.16)}
.sri-avatar{width:46px;height:46px;min-width:46px;border-radius:50%;box-shadow:0 2px 10px rgba(0,0,0,.12)}
.sri-ph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.sri-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;
  transition:transform .45s ${EASE}}
.sri-avatar .sri-img{position:static}
.sri-shade{position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,rgba(0,0,0,.42) 100%);pointer-events:none}
.sri-accent{position:absolute;left:0;bottom:0;width:100%;height:2px;background:var(--g);
  transform:scaleX(0);transform-origin:left;transition:transform .3s ${EASE}}
.sri-title{color:rgba(245,245,245,.92);transition:color .2s ease}
.sri-go{flex:none;display:flex;color:var(--dim);opacity:var(--go-o,0);transform:translateX(-4px);
  transition:opacity .2s ease,transform .2s ease}
@media (hover:hover){${HOVER_RULES.map(([s, d]) => `.sri:hover${s}{${d}}`).join("")}}
${HOVER_RULES.map(([s, d]) => `.sri:focus-visible${s}{${d}}`).join("")}
@media (prefers-reduced-motion:reduce){.sri{animation:none}.sri,.sri *{transition:none!important}}
`;

// Inject 1 lần (an toàn với SSR & HMR)
if (typeof document !== "undefined") {
  let el = document.getElementById("sri-styles");
  if (!el) {
    el = document.createElement("style");
    el.id = "sri-styles";
    document.head.appendChild(el);
  }
  el.textContent = CSS;
}

/* =========================================================
   Helpers
========================================================= */

const getYear = (date) => {
  if (!date) return null;
  const year = new Date(date).getFullYear();
  return Number.isFinite(year) ? year : null;
};

const getGenres = (genres) =>
  Array.isArray(genres)
    ? genres
        .slice(0, 2)
        .map((g) => (typeof g === "string" ? g : g?.name))
        .filter(Boolean)
    : [];

// Delay stagger tối đa 6 bậc → danh sách dài không bị chờ lâu
const delay = (i) => `${Math.min(i, 6) * 28}ms`;

const hideBrokenImg = (e) => {
  e.currentTarget.style.display = "none"; // placeholder (.sri-ph) nằm sẵn phía sau
};

// CSS variables theo màu → cache để giữ nguyên reference style object
const BASE_VARS = { "--bd": C.border, "--surf": C.surfaceHigh, "--tx": C.text, "--dim": C.textDim };
const varsCache = new Map();
const colorVars = (color, goOpacity = 0) => {
  const key = `${color}|${goOpacity}`;
  let v = varsCache.get(key);
  if (!v) {
    v = {
      ...BASE_VARS,
      "--g": color,
      "--g-b": `${color}66`,
      "--g-l": `${color}55`,
      "--g-s": `${color}44`,
      "--go-o": goOpacity,
    };
    varsCache.set(key, v);
  }
  return v;
};

const S = {
  info: { flex: 1, minWidth: 0, paddingRight: 4 },
  titleRow: { display: "flex", alignItems: "center", gap: 7, minWidth: 0, marginBottom: 7 },
  title: {
    flex: 1, minWidth: 0, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 650, lineHeight: 1.25, letterSpacing: "-0.015em",
  },
  meta: { display: "flex", alignItems: "center", gap: 7, minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", fontFamily: FONT_BODY },
  year: { flexShrink: 0, fontSize: 10.5, fontWeight: 500, color: C.textSub },
  sep1: { color: C.textDim, opacity: 0.55, fontSize: 9 },
  sep2: { color: C.textDim, opacity: 0.45, fontSize: 9 },
  rating: { display: "inline-flex", alignItems: "center", gap: 3, flexShrink: 0, fontSize: 10.5, fontWeight: 650, color: C.gold },
  genre: { minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 10.5, color: C.textSub },
  actorTitleRow: { display: "flex", alignItems: "center", gap: 8, minWidth: 0, marginBottom: 5 },
  badge: {
    flexShrink: 0, padding: "3px 6px", borderRadius: 4, fontFamily: FONT_BODY, fontSize: 8.5, lineHeight: 1,
    fontWeight: 750, letterSpacing: "0.075em", color: C.accent, background: C.accentSoft, border: `1px solid ${C.accent}18`,
  },
  sub: {
    margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    fontFamily: FONT_BODY, fontSize: 10.5, lineHeight: 1.35, color: C.textSub,
  },
  subDim: { margin: 0, fontFamily: FONT_BODY, fontSize: 10.5, color: C.textDim },
};

const useSelect = (item, onSelect, onClick) =>
  useCallback(() => (onSelect ? onSelect(item) : onClick?.(item)), [item, onSelect, onClick]);

/* =========================================================
   Movie / TV result
   Dùng `onSelect(item)` (ổn định, KHÔNG tạo closure mới mỗi render) thay vì `onClick`.
   `onClick` vẫn được hỗ trợ để không vỡ chỗ khác đang dùng.
========================================================= */

export const MovieResultItem = memo(function MovieResultItem({ movie, onSelect, onClick, index = 0 }) {
  const handle = useSelect(movie, onSelect, onClick);

  const year = getYear(movie?.releaseDate ?? movie?.firstAirDate); // TV show dùng firstAirDate
  const rating = movie?.rating ?? movie?.imdbRating;
  const genres = getGenres(movie?.genres);
  const genreColor = (genres[0] && GENRE_COLOR?.[genres[0]]) || C.accent;

  return (
    <button
      type="button"
      className="sri"
      onClick={handle}
      style={{ ...colorVars(genreColor), animationDelay: delay(index) }}
    >
      <span className="sri-bar" aria-hidden="true" />

      <div className="sri-poster">
        <div className="sri-ph">
          <Film size={18} strokeWidth={1.4} color={C.textDim} />
        </div>
        {movie?.posterUrl && (
          <img
            className="sri-img"
            src={movie.posterUrl}
            alt={movie.title || ""}
            decoding="async"
            onError={hideBrokenImg}
          />
        )}
        <div className="sri-shade" />
        <div className="sri-accent" />
      </div>

      <div style={S.info}>
        <div style={S.titleRow}>
          <p className="sri-title" style={S.title}>{movie?.title || "Untitled"}</p>
          <span className="sri-go" aria-hidden="true"><ArrowUpRight size={13} strokeWidth={1.7} /></span>
        </div>

        <div style={S.meta}>
          {year && <span style={S.year}>{year}</span>}

          {rating != null && Number(rating) > 0 && (
            <>
              <span style={S.sep1}>/</span>
              <span style={S.rating}>
                <Star size={10} fill="currentColor" strokeWidth={0} />
                {Number(rating).toFixed(1)}
              </span>
            </>
          )}

          {genres.length > 0 && (
            <>
              <span style={S.sep2}>/</span>
              <span style={S.genre}>{genres.map((g) => GENRE_VI?.[g] ?? g).join(" · ")}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
});

/* =========================================================
   Actor result
========================================================= */

const ACTOR_VARS = colorVars(C.accent, 0.25);

export const ActorResultItem = memo(function ActorResultItem({ actor, onSelect, onClick, index = 0 }) {
  const handle = useSelect(actor, onSelect, onClick);

  const knownTitles = Array.isArray(actor?.knownMovies)
    ? actor.knownMovies.slice(0, 2).map((m) => (typeof m === "string" ? m : m?.title)).filter(Boolean)
    : [];

  return (
    <button
      type="button"
      className="sri"
      onClick={handle}
      style={{ ...ACTOR_VARS, animationDelay: delay(index) }}
    >
      <span className="sri-bar" aria-hidden="true" />

      <div className="sri-avatar">
        <div className="sri-ph">
          <User size={18} strokeWidth={1.35} color={C.textDim} />
        </div>
        {actor?.profileUrl && (
          <img
            className="sri-img"
            src={actor.profileUrl}
            alt={actor.name || ""}
            decoding="async"
            onError={hideBrokenImg}
          />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.actorTitleRow}>
          <p className="sri-title" style={S.title}>{actor?.name || "Unknown actor"}</p>
          <span style={S.badge}>DIỄN VIÊN</span>
        </div>

        {knownTitles.length > 0 ? (
          <p style={S.sub}>{knownTitles.join(" · ")}</p>
        ) : actor?.character ? (
          <p style={S.sub}>vai {actor.character}</p>
        ) : (
          <p style={S.subDim}>Khám phá hồ sơ diễn viên</p>
        )}
      </div>

      <span className="sri-go" aria-hidden="true"><ArrowUpRight size={14} strokeWidth={1.6} /></span>
    </button>
  );
});

/* =========================================================
   Default export (giữ tương thích)
========================================================= */

const SearchResultItem = (props) => <MovieResultItem {...props} />;

export default SearchResultItem;