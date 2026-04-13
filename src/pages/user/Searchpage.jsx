// src/pages/SearchPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";

import movieService from "../../services/movieService";
import genreService from "../../services/genreService";
import BackButton from "../../components/common/BackButton";
import Pagination from "../../components/common/Pagination";
import { usePagination } from "../../hooks/usePagination";

import {
  C,
  FONT_DISPLAY,
  FONT_BODY,
} from "../../context/homeTokens";
import { useIsMobile } from "../../hooks/useIsMobile";
import SearchBar from "../../components/search/SearchBar";
import SearchTabs from "../../components/search/SearchTabs";
import FilterPanel, { Chip } from "../../components/search/FilterPanel";
import MovieCard from "../../components/movie/MovieCard";
import ActorCard from "../../components/search/ActorCard";
import {
  SkeletonCard,
  EmptySearch,
  NoResults,
} from "../../components/search/SearchUI";

// ── Grids ───────────────────────────────────────────────────────
const movieGrid = (isMobile) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(7, 1fr)",
  gap: isMobile ? 10 : 12,
});

const ACTOR_GRID = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: 14,
};

// ── Debounce ────────────────────────────────────────────────────
function useDebounce(value, delay = 380) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return deb;
}

// ── Normalize API response ──────────────────────────────────────
const toMovies = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.movies)) return res.movies;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  return [];
};

const toSlug = (name) =>
  (name || "unknown")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// ── Mobile movie card ───────────────────────────────────────────
const MobileMovieCard = ({ movie, navigate }) => {
  const [imgErr, setImgErr] = React.useState(false);
  const [favLoading, setFavLoading] = React.useState(false);
  const [localFav, setLocalFav] = React.useState(false);

  const handleFav = async (e) => {
    e.stopPropagation();
    if (favLoading) return;
    setFavLoading(true);
    try {
      if (localFav) {
        await movieService.removeFavorite(movie.id);
        setLocalFav(false);
      } else {
        await movieService.addFavorite(movie.id);
        setLocalFav(true);
      }
    } catch {
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <div onClick={() => navigate(`/movie/${movie.id}/info`)} style={{ cursor: "pointer" }}>
      <div style={{ position: "relative", borderRadius: 3, overflow: "hidden", aspectRatio: "2/3", background: "#161616" }}>
        {movie.posterUrl && !imgErr ? (
          <img src={movie.posterUrl} alt={movie.title} onError={() => setImgErr(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", background: "#161616", fontSize: 24, opacity: 0.3 }}>▶</div>
        )}
        {movie.rating > 0 && (
          <div style={{ position: "absolute", top: 6, left: 6, padding: "2px 7px", borderRadius: 2,
            background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: C.gold }}>
              {movie.rating.toFixed(1)}
            </span>
          </div>
        )}
        <button onClick={handleFav} disabled={favLoading} style={{
          position: "absolute", bottom: 6, right: 6, width: 28, height: 28, borderRadius: "50%",
          background: localFav ? C.accent : "rgba(0,0,0,0.7)",
          border: `1px solid ${localFav ? C.accent : "rgba(255,255,255,0.15)"}`,
          backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: favLoading ? "not-allowed" : "pointer", transition: "background 0.2s, border-color 0.2s",
        }}>
          {favLoading ? (
            <span style={{ width: 10, height: 10, border: "2px solid rgba(255,255,255,0.2)",
              borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "block" }} />
          ) : (
            <span style={{ fontSize: 11, color: "#fff", lineHeight: 1, fontFamily: FONT_BODY }}>
              {localFav ? "♥" : "♡"}
            </span>
          )}
        </button>
      </div>
      <div style={{ paddingTop: 7 }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: C.text,
          lineHeight: 1.3, marginBottom: 2, display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {movie.title}
        </p>
        {movie.year && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim }}>{movie.year}</p>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
export default function SearchPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [tab, setTab] = useState("movies");
  const [genres, setGenres] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showFilter, setShowFilter] = useState(false);
  const [selGenre, setSelGenre] = useState(null);
  const [selYear, setSelYear] = useState(null);
  const [selCountry, setSelCountry] = useState(null);
  const [sortBy, setSortBy] = useState("rating");
  const [minRating, setMinRating] = useState(0);

  const debouncedQuery = useDebounce(query);
  const filterCount = [selGenre, selYear, selCountry, minRating > 0].filter(Boolean).length;

  const moviePg = usePagination({ total: allMovies.length });
  const pageMovies = moviePg.paginate(allMovies);
  const actorPg = usePagination({ total: actors.length });
  const pageActors = actorPg.paginate(actors);

  useEffect(() => {
    if (debouncedQuery) setSearchParams({ q: debouncedQuery }, { replace: true });
    else setSearchParams({}, { replace: true });
  }, [debouncedQuery]);

  useEffect(() => {
    genreService.getAllGenres().then((res) => {
      const raw = Array.isArray(res) ? res : (res?.genres ?? res?.data ?? []);
      setGenres(raw);
    }).catch(() => {});
  }, []);

  const clearFilters = useCallback(() => {
    setSelGenre(null); setSelYear(null); setSelCountry(null);
    setMinRating(0); setSortBy("rating");
  }, []);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      let result = [];
      if (debouncedQuery.trim()) {
        const raw = await movieService.searchMovies(debouncedQuery);
        result = toMovies(raw);
      } else {
        const res = await movieService.getMovies(1, 500);
        result = toMovies(res);
      }
      result = result.map((m) => ({
        ...m,
        year: m.year ?? (m.releaseDate ? new Date(m.releaseDate).getFullYear() : null),
      }));
      if (selGenre)
        result = result.filter((m) => m.genres?.some((g) =>
          typeof g === "string" ? g.toLowerCase() === selGenre.toLowerCase()
            : g?.name?.toLowerCase() === selGenre.toLowerCase()));
      if (selYear)
        result = result.filter((m) => String(m.year) === String(selYear));
      if (selCountry)
        result = result.filter((m) => m.originCountry?.toUpperCase() === selCountry.toUpperCase());
      if (minRating > 0)
        result = result.filter((m) => (m.rating ?? m.imdbRating ?? 0) >= minRating);
      result = [...result].sort((a, b) => {
        if (sortBy === "rating") return (b.rating ?? b.imdbRating ?? 0) - (a.rating ?? a.imdbRating ?? 0);
        if (sortBy === "releaseDate") return new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0);
        if (sortBy === "title") return (a.title || "").localeCompare(b.title || "", "vi");
        return 0;
      });
      setAllMovies(result);
      moviePg.goTo(1);
    } catch (e) {
      console.error("[SearchPage] fetchMovies:", e);
      setAllMovies([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, selGenre, selYear, selCountry, sortBy, minRating]);

  const fetchActors = useCallback(async () => {
    if (!debouncedQuery.trim()) { setActors([]); return; }
    setLoading(true);
    try {
      const fn = movieService.searchMoviesByActor ?? movieService.searchByActor ?? movieService.getMoviesByActor;
      if (!fn) { setActors([]); return; }
      const raw = await fn.call(movieService, debouncedQuery);
      const movies = toMovies(raw);
      const map = new Map();
      const q = debouncedQuery.toLowerCase();
      movies.forEach((movie) => {
        (movie.cast || []).forEach((member) => {
          if (!member.name?.toLowerCase().includes(q)) return;
          const key = member.name.toLowerCase();
          if (map.has(key)) {
            const e = map.get(key);
            e.movieCount++;
            if (!e.knownFor.includes(movie.title)) e.knownFor += `, ${movie.title}`;
          } else {
            map.set(key, { id: member.id ?? member.personId ?? null, name: member.name,
              profileUrl: member.profileUrl ?? null, knownFor: movie.title,
              biography: member.biography ?? null, birthday: member.birthday ?? null,
              placeOfBirth: member.placeOfBirth ?? null, movieCount: 1 });
          }
        });
        const d = movie.directorDetail;
        if (d?.name?.toLowerCase().includes(q)) {
          const key = d.name.toLowerCase();
          if (map.has(key)) map.get(key).movieCount++;
          else map.set(key, { id: null, name: d.name, profileUrl: d.profileUrl ?? null,
            knownFor: `Đạo diễn — ${movie.title}`, biography: d.biography ?? null,
            birthday: d.birthday ?? null, placeOfBirth: d.placeOfBirth ?? null, movieCount: 1 });
        }
      });
      setActors([...map.values()]);
      actorPg.goTo(1);
    } catch (e) {
      console.error("[SearchPage] fetchActors:", e);
      setActors([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  useEffect(() => { if (tab === "movies") fetchMovies(); }, [fetchMovies, tab]);
  useEffect(() => { if (tab === "actors") fetchActors(); }, [fetchActors, tab]);
  useEffect(() => { if (moviePg.page > 1) window.scrollTo({ top: 100, behavior: "smooth" }); }, [moviePg.page]);
  useEffect(() => { if (actorPg.page > 1) window.scrollTo({ top: 100, behavior: "smooth" }); }, [actorPg.page]);

  const genresForFilter = genres.map((g) =>
    typeof g === "string" ? { id: g, name: g } : { id: g.name, name: g.name });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, paddingTop: 68 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,600;0,700;0,800;0,900;1,600;1,700;1,800;1,900&family=Nunito:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: ${C.textDim}; font-family: 'Nunito', sans-serif; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: isMobile ? "24px 16px 80px" : "36px 32px 100px" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 36 }}
        >
          <BackButton />
          <div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: isMobile ? 26 : 32,
              fontWeight: 700, color: C.text, letterSpacing: "0.01em", lineHeight: 1 }}>
              Tìm kiếm
            </h1>
            <AnimatePresence mode="wait">
              {debouncedQuery && !loading && (
                <motion.p
                  key={`${tab}-${debouncedQuery}-${allMovies.length}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 400,
                    color: C.textDim, marginTop: 6, letterSpacing: "0.01em" }}
                >
                  {tab === "movies"
                    ? `${allMovies.length} phim${filterCount > 0 ? ` · ${filterCount} bộ lọc` : ""}`
                    : `${actors.length} diễn viên / đạo diễn`}{" "}
                  cho &ldquo;{debouncedQuery}&rdquo;
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <SearchBar value={query} onChange={setQuery} />
        <SearchTabs tab={tab} onTabChange={setTab} totalMovies={allMovies.length}
          totalActors={actors.length} filterCount={filterCount} showFilter={showFilter}
          onToggleFilter={() => setShowFilter((v) => !v)} />
        <FilterPanel show={showFilter && tab === "movies"} genres={genresForFilter}
          selGenre={selGenre} onGenreChange={setSelGenre}
          selYear={selYear} onYearChange={setSelYear}
          selCountry={selCountry} onCountryChange={setSelCountry}
          sortBy={sortBy} onSortChange={(v) => setSortBy(v || "rating")}
          minRating={minRating} onRatingChange={setMinRating}
          filterCount={filterCount} onClearAll={clearFilters} />

        <AnimatePresence>
          {filterCount > 0 && !showFilter && tab === "movies" && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
              {selGenre && <Chip label={selGenre} onRemove={() => setSelGenre(null)} />}
              {selYear && <Chip label={selYear} onRemove={() => setSelYear(null)} />}
              {selCountry && <Chip label={selCountry} onRemove={() => setSelCountry(null)} />}
              {minRating > 0 && <Chip label={`${minRating}+`} onRemove={() => setMinRating(0)} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence mode="wait">

          {/* ── Movies ── */}
          {tab === "movies" && (
            <motion.div key="movies" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

              {!debouncedQuery && filterCount === 0 && !loading && allMovies.length === 0 && <EmptySearch />}

              {loading && allMovies.length === 0 && (
                <div style={movieGrid(isMobile)}>
                  {Array.from({ length: isMobile ? 6 : 14 }).map((_, i) => (
                    <div key={i} style={isMobile ? {} : { zoom: 0.78 }}><SkeletonCard /></div>
                  ))}
                </div>
              )}

              {!loading && allMovies.length === 0 && (debouncedQuery || filterCount > 0) && (
                <NoResults query={debouncedQuery} />
              )}

              {allMovies.length > 0 && (
                <>
                  {/*
                    Fade cả grid khi đổi trang — không animate từng card riêng lẻ
                    key đổi theo page → Framer tự fade out/in
                  */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`movies-p${moviePg.page}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: loading ? 0.45 : 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      style={movieGrid(isMobile)}
                    >
                      {pageMovies.map((m) => (
                        <div key={m.id} style={isMobile ? {} : { zoom: 0.78 }}>
                          {isMobile ? (
                            <MobileMovieCard movie={m} navigate={navigate} />
                          ) : (
                            <MovieCard movie={m} index={0}
                              onClick={(movie) => navigate(`/movie/${movie.id}/info`)} />
                          )}
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>

                  <Pagination
                    {...moviePg.props}
                    itemLabel="phim"
                  />
                </>
              )}
            </motion.div>
          )}

          {/* ── Actors ── */}
          {tab === "actors" && (
            <motion.div key="actors" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

              {!debouncedQuery && (
                <div style={{ textAlign: "center", padding: "80px 0" }}>
                  <div style={{ width: 40, height: 1, background: C.border, margin: "0 auto 24px" }} />
                  <p style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700,
                    color: C.textSub, marginBottom: 8 }}>
                    Tìm diễn viên & đạo diễn
                  </p>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim, fontWeight: 400 }}>
                    Nhập tên để tìm kiếm
                  </p>
                </div>
              )}

              {loading && actors.length === 0 && debouncedQuery && (
                <div style={ACTOR_GRID}>
                  {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              )}

              {!loading && actors.length === 0 && debouncedQuery && (
                <NoResults query={debouncedQuery} isActor />
              )}

              {actors.length > 0 && (
                <>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 400,
                    color: C.textDim, marginBottom: 16, letterSpacing: "0.01em" }}>
                    {actors.length} diễn viên / đạo diễn
                  </p>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`actors-p${actorPg.page}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: loading ? 0.45 : 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      style={ACTOR_GRID}
                    >
                      {pageActors.map((a, i) => (
                        <ActorCard key={`${a.name}-${i}`} actor={a} index={0}
                          onActorClick={(actor) =>
                            navigate(`/person/${toSlug(actor.name)}`, { state: { actor } })} />
                      ))}
                    </motion.div>
                  </AnimatePresence>

                  <Pagination
                    {...actorPg.props}
                    itemLabel="diễn viên"
                  />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating loading indicator */}
      <AnimatePresence>
        {loading && (allMovies.length > 0 || actors.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2 }}
            style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
              display: "flex", alignItems: "center", gap: 10, padding: "10px 22px",
              background: "rgba(10,10,10,0.96)", borderRadius: 3, border: `1px solid ${C.border}`,
              backdropFilter: "blur(20px)", zIndex: 9000, boxShadow: "0 8px 32px rgba(0,0,0,0.8)" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%",
              border: `1.5px solid rgba(229,24,30,0.2)`, borderTopColor: C.accent,
              animation: "spin 0.7s linear infinite" }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 400,
              color: C.textSub, letterSpacing: "0.02em" }}>Đang tải</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}