// src/pages/SearchPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';

import movieService  from '../../services/movieService';
import { Heart } from 'lucide-react';
import genreService   from '../../services/genreService';
import BackButton     from '../../components/common/BackButton';
import Pagination     from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';

import { C, FONT_TITLE, FONT_BODY } from '../../components/search/searchConstants';
import { useIsMobile } from '../../hooks/useIsMobile';
import SearchBar    from '../../components/search/SearchBar';
import SearchTabs   from '../../components/search/SearchTabs';
import FilterPanel, { Chip } from '../../components/search/FilterPanel';
import MovieCard    from '../../components/movie/MovieCard';
import ActorCard    from '../../components/search/ActorCard';
import { SkeletonCard, EmptySearch, NoResults } from '../../components/search/SearchUI';

// ── Grids — responsive ─────────────────────────────────────────
const movieGrid = (isMobile) => ({
  display: 'grid',
  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(7, 1fr)',
  gap: 12,
});
const ACTOR_GRID = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  gap: 16,
};

const PAGE_SIZE = 24;

// ── Debounce ────────────────────────────────────────────────────
function useDebounce(value, delay = 420) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return deb;
}

// ── Normalize any API movie response shape ─────────────────────
const toMovies = (res) => {
  if (Array.isArray(res))              return res;
  if (Array.isArray(res?.items))       return res.items;
  if (Array.isArray(res?.movies))      return res.movies;
  if (Array.isArray(res?.data))        return res.data;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  return [];
};

const toSlug = (name) =>
  (name || 'unknown')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// ══════════════════════════════════════════════════════════════

// ── SearchMobileCard — card mobile có nút tim ────────────────────
const SearchMobileCard = ({ movie, navigate }) => {
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
    } catch (err) { console.error(err); }
    finally { setFavLoading(false); }
  };

  return (
    <div onClick={() => navigate(`/movie/${movie.id}/info`)} style={{ cursor: 'pointer' }}>
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '2/3', background: '#181818' }}>
        {movie.posterUrl && !imgErr
          ? <img src={movie.posterUrl} alt={movie.title} onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎬</div>
        }
        {movie.rating > 0 && (
          <div style={{ position: 'absolute', top: 6, left: 6, display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 99, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="#f5c518"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: 10, fontWeight: 700, color: '#f5c518' }}>{movie.rating.toFixed(1)}</span>
          </div>
        )}
        <button
          onClick={handleFav}
          disabled={favLoading}
          style={{ position: 'absolute', bottom: 6, right: 6, width: 30, height: 30, borderRadius: '50%', background: localFav ? '#e5181e' : 'rgba(0,0,0,0.65)', border: `1.5px solid ${localFav ? '#e5181e' : 'rgba(255,255,255,0.3)'}`, backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: favLoading ? 'not-allowed' : 'pointer' }}
        >
          {favLoading
            ? <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
            : <Heart size={13} fill={localFav ? 'white' : 'none'} color="white" strokeWidth={2} />
          }
        </button>
      </div>
      <div style={{ paddingTop: 7, paddingBottom: 4 }}>
        <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 12, fontWeight: 700, color: '#f0f2f8', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 2 }}>{movie.title}</p>
        {movie.year && <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 10, color: '#525868' }}>{movie.year}</p>}
      </div>
    </div>
  );
};

export default function SearchPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query,     setQuery]     = useState(searchParams.get('q') || '');
  const [tab,       setTab]       = useState('movies');
  const [genres,    setGenres]    = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [actors,    setActors]    = useState([]);
  const [loading,   setLoading]   = useState(false);

  // Filters
  const [showFilter, setShowFilter] = useState(false);
  const [selGenre,   setSelGenre]   = useState(null); // genre name string
  const [selYear,    setSelYear]    = useState(null);
  const [selCountry, setSelCountry] = useState(null);
  const [sortBy,     setSortBy]     = useState('rating');
  const [minRating,  setMinRating]  = useState(0);

  const debouncedQuery = useDebounce(query);
  const filterCount    = [selGenre, selYear, selCountry, minRating > 0].filter(Boolean).length;

  // Pagination
  const moviePg    = usePagination({ total: allMovies.length, pageSize: PAGE_SIZE });
  const pageMovies = moviePg.paginate(allMovies);
  const actorPg    = usePagination({ total: actors.length,   pageSize: PAGE_SIZE });
  const pageActors = actorPg.paginate(actors);

  // Sync URL
  useEffect(() => {
    if (debouncedQuery) setSearchParams({ q: debouncedQuery }, { replace: true });
    else                setSearchParams({},                     { replace: true });
  }, [debouncedQuery]);

  // Load genres once
  useEffect(() => {
    genreService.getAllGenres()
      .then(res => {
        const raw = Array.isArray(res) ? res : res?.genres ?? res?.data ?? [];
        setGenres(raw);
      })
      .catch(() => {});
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelGenre(null);
    setSelYear(null);
    setSelCountry(null);
    setMinRating(0);
    setSortBy('rating');
  }, []);

  // ── Fetch movies ────────────────────────────────────────────
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

      // Normalize year
      result = result.map(m => ({
        ...m,
        year: m.year ?? (m.releaseDate ? new Date(m.releaseDate).getFullYear() : null),
      }));

      // Genre filter — genres can be string names or {id,name} objects
      if (selGenre) {
        result = result.filter(m =>
          m.genres?.some(g =>
            typeof g === 'string'
              ? g.toLowerCase() === selGenre.toLowerCase()
              : g?.name?.toLowerCase() === selGenre.toLowerCase()
          )
        );
      }

      // Year filter
      if (selYear) {
        result = result.filter(m => String(m.year) === String(selYear));
      }

      // Country filter
      if (selCountry) {
        result = result.filter(m =>
          m.originCountry?.toUpperCase() === selCountry.toUpperCase()
        );
      }

      // Rating filter
      if (minRating > 0) {
        result = result.filter(m =>
          (m.rating ?? m.imdbRating ?? 0) >= minRating
        );
      }

      // Sort
      result = [...result].sort((a, b) => {
        if (sortBy === 'rating')
          return (b.rating ?? b.imdbRating ?? 0) - (a.rating ?? a.imdbRating ?? 0);
        if (sortBy === 'releaseDate')
          return new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0);
        if (sortBy === 'title')
          return (a.title || '').localeCompare(b.title || '', 'vi');
        return 0;
      });

      setAllMovies(result);
      moviePg.goTo(1);
    } catch (e) {
      console.error('[SearchPage] fetchMovies:', e);
      setAllMovies([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, selGenre, selYear, selCountry, sortBy, minRating]);

  // ── Fetch actors ────────────────────────────────────────────
  const fetchActors = useCallback(async () => {
    if (!debouncedQuery.trim()) { setActors([]); return; }
    setLoading(true);
    try {
      // Support different naming conventions
      const fn = movieService.searchMoviesByActor
              ?? movieService.searchByActor
              ?? movieService.getMoviesByActor;
      if (!fn) { setActors([]); return; }

      const raw    = await fn.call(movieService, debouncedQuery);
      const movies = toMovies(raw);
      const map    = new Map();
      const q      = debouncedQuery.toLowerCase();

      movies.forEach(movie => {
        (movie.cast || []).forEach(member => {
          if (!member.name?.toLowerCase().includes(q)) return;
          const key = member.name.toLowerCase();
          if (map.has(key)) {
            const e = map.get(key);
            e.movieCount++;
            if (!e.knownFor.includes(movie.title))
              e.knownFor += `, ${movie.title}`;
          } else {
            map.set(key, {
              id:           member.id ?? member.personId ?? null,
              name:         member.name,
              profileUrl:   member.profileUrl ?? null,
              knownFor:     movie.title,
              biography:    member.biography ?? null,
              birthday:     member.birthday ?? null,
              placeOfBirth: member.placeOfBirth ?? null,
              movieCount:   1,
            });
          }
        });
        const d = movie.directorDetail;
        if (d?.name?.toLowerCase().includes(q)) {
          const key = d.name.toLowerCase();
          if (map.has(key)) { map.get(key).movieCount++; }
          else map.set(key, {
            id: null, name: d.name, profileUrl: d.profileUrl ?? null,
            knownFor: `Đạo diễn — ${movie.title}`,
            biography: d.biography ?? null, birthday: d.birthday ?? null,
            placeOfBirth: d.placeOfBirth ?? null, movieCount: 1,
          });
        }
      });

      setActors([...map.values()]);
      actorPg.goTo(1);
    } catch (e) {
      console.error('[SearchPage] fetchActors:', e);
      setActors([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // Trigger fetches
  useEffect(() => { if (tab === 'movies') fetchMovies(); }, [fetchMovies, tab]);
  useEffect(() => { if (tab === 'actors') fetchActors(); }, [fetchActors, tab]);

  // Scroll on page change
  useEffect(() => { if (moviePg.page > 1) window.scrollTo({ top: 120, behavior: 'smooth' }); }, [moviePg.page]);
  useEffect(() => { if (actorPg.page > 1) window.scrollTo({ top: 120, behavior: 'smooth' }); }, [actorPg.page]);

  // Genre options for FilterPanel — use name as value (not id) since API returns string names
  const genresForFilter = genres.map(g =>
    typeof g === 'string' ? { id: g, name: g } : { id: g.name, name: g.name }
  );

  // ── Render ──────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, paddingTop: 68 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@700;800;900&family=Nunito:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: ${C.textDim}; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-thumb { background: #252525; border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '20px 16px 80px' : '32px 28px 100px' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}
        >
          <BackButton />
          <div>
            <h1 style={{
              fontFamily: FONT_TITLE, fontSize: 28, fontWeight: 900,
              color: C.text, letterSpacing: '0.01em', lineHeight: 1,
            }}>
              Tìm kiếm
            </h1>
            <AnimatePresence mode="wait">
              {debouncedQuery && !loading && (
                <motion.p
                  key={`${tab}-${debouncedQuery}-${allMovies.length}`}
                  initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginTop: 4 }}
                >
                  {tab === 'movies'
                    ? `${allMovies.length} phim${filterCount > 0 ? ` · ${filterCount} bộ lọc` : ''}`
                    : `${actors.length} diễn viên / đạo diễn`}
                  {' '}cho &ldquo;{debouncedQuery}&rdquo;
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Search bar */}
        <SearchBar value={query} onChange={setQuery} />

        {/* Tabs + filter toggle */}
        <SearchTabs
          tab={tab} onTabChange={setTab}
          totalMovies={allMovies.length} totalActors={actors.length}
          filterCount={filterCount} showFilter={showFilter}
          onToggleFilter={() => setShowFilter(v => !v)}
        />

        {/* Filter panel */}
        <FilterPanel
          show={showFilter && tab === 'movies'}
          genres={genresForFilter}
          selGenre={selGenre}       onGenreChange={setSelGenre}
          selYear={selYear}         onYearChange={setSelYear}
          selCountry={selCountry}   onCountryChange={setSelCountry}
          sortBy={sortBy}           onSortChange={v => setSortBy(v || 'rating')}
          minRating={minRating}     onRatingChange={setMinRating}
          filterCount={filterCount} onClearAll={clearFilters}
        />

        {/* Active chips */}
        <AnimatePresence>
          {filterCount > 0 && !showFilter && tab === 'movies' && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}
            >
              {selGenre    && <Chip label={selGenre}        onRemove={() => setSelGenre(null)} />}
              {selYear     && <Chip label={selYear}         onRemove={() => setSelYear(null)} />}
              {selCountry  && <Chip label={`🌏 ${selCountry}`} onRemove={() => setSelCountry(null)} />}
              {minRating > 0 && <Chip label={`⭐ ${minRating}+`} onRemove={() => setMinRating(0)} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence mode="wait">

          {/* ── Movies ── */}
          {tab === 'movies' && (
            <motion.div key="movies"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {!debouncedQuery && filterCount === 0 && !loading && allMovies.length === 0 && <EmptySearch />}

              {loading && allMovies.length === 0 && (
                <div style={movieGrid(isMobile)}>
                  {Array.from({ length: isMobile ? 8 : 12 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              )}

              {!loading && allMovies.length === 0 && (debouncedQuery || filterCount > 0) && (
                <NoResults query={debouncedQuery} />
              )}

              {allMovies.length > 0 && (
                <>
                  <div style={{ ...movieGrid(isMobile), opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                    <AnimatePresence mode="popLayout">
                      {pageMovies.map((m, i) => (
                        <motion.div key={m.id ?? i}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: Math.min(i * 0.018, 0.2), duration: 0.22 }}
                          style={isMobile ? {} : { zoom: 0.78 }}
                        >
                          {isMobile ? (
                            <SearchMobileCard movie={m} navigate={navigate} />
                          ) : (
                            <MovieCard
                              movie={m}
                              index={i}
                              onClick={(movie) => navigate(`/movie/${movie.id}/info`)}
                            />
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  <Pagination
                    page={moviePg.page} totalPages={moviePg.totalPages}
                    total={allMovies.length} pageSize={PAGE_SIZE}
                    onPageChange={moviePg.goTo} pageNumbers={moviePg.pageNumbers}
                    itemLabel="phim"
                  />
                </>
              )}
            </motion.div>
          )}

          {/* ── Actors ── */}
          {tab === 'actors' && (
            <motion.div key="actors"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {!debouncedQuery && (
                <div style={{ textAlign: 'center', padding: '72px 0' }}>
                  <div style={{ fontSize: 44, marginBottom: 16, opacity: 0.4 }}>🎭</div>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: C.textSub }}>
                    Nhập tên diễn viên hoặc đạo diễn để tìm kiếm
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
                  <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginBottom: 16 }}>
                    {actors.length} diễn viên / đạo diễn
                  </p>
                  <div style={{ ...ACTOR_GRID, opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                    <AnimatePresence mode="popLayout">
                      {pageActors.map((a, i) => (
                        <motion.div key={`${a.name}-${i}`}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          transition={{ delay: Math.min(i * 0.018, 0.2), duration: 0.22 }}
                        >
                          <ActorCard
                            actor={a} index={i}
                            onActorClick={actor =>
                              navigate(`/person/${toSlug(actor.name)}`, { state: { actor } })
                            }
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  <Pagination
                    page={actorPg.page} totalPages={actorPg.totalPages}
                    total={actors.length} pageSize={PAGE_SIZE}
                    onPageChange={actorPg.goTo} pageNumbers={actorPg.pageNumbers}
                    itemLabel="diễn viên"
                  />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating loader */}
      <AnimatePresence>
        {loading && (allMovies.length > 0 || actors.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            style={{
              position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '10px 20px',
              background: 'rgba(14,14,14,0.95)', borderRadius: 40,
              border: `1px solid ${C.border}`, backdropFilter: 'blur(16px)',
              zIndex: 9000, boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              border: `2px solid rgba(229,24,30,0.25)`,
              borderTopColor: C.accent, animation: 'spin 0.7s linear infinite',
            }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSub }}>Đang tải...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}