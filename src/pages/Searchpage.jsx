// src/pages/SearchPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';

import movieService from '../services/movieService';
import genreService from '../services/genreService';
import BackButton   from '../components/common/BackButton';
import Pagination   from '../components/common/Pagination';
import { usePagination } from '../hooks/usePagination';

import { C, FONT_TITLE, FONT_BODY } from '../components/search/searchConstants';
import SearchBar    from '../components/search/SearchBar';
import SearchTabs   from '../components/search/SearchTabs';
import FilterPanel, { Chip } from '../components/search/FilterPanel';
import MovieCard    from '../components/movie/MovieCard';
import ActorCard    from '../components/search/ActorCard';
import { SkeletonCard, EmptySearch, NoResults } from '../components/search/SearchUI';

// 6 cột đồng nhất với BrowsePage
const GRID_6 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, 1fr)',
  gap: 12,
};

const PAGE_SIZE = 24;

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const toSlug = (name) =>
  (name || 'unknown')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query,     setQuery]     = useState(searchParams.get('q') || '');
  const [tab,       setTab]       = useState('movies');
  const [genres,    setGenres]    = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [actors,    setActors]    = useState([]);
  const [loading,   setLoading]   = useState(false);

  // ── Favorites state ─────────────────────────────────────────────────────────
  const [favorites, setFavorites] = useState(new Set()); // Set<movieId>

  const [showFilter, setShowFilter] = useState(false);
  const [selGenre,   setSelGenre]   = useState(null);
  const [selYear,    setSelYear]    = useState(null);
  const [sortBy,     setSortBy]     = useState('rating');
  const [minRating,  setMinRating]  = useState(0);

  const debouncedQuery = useDebounce(query);
  const filterCount    = [selGenre, selYear, minRating > 0].filter(Boolean).length;

  // ── Pagination — movies ─────────────────────────────────────────────────────
  const moviePg    = usePagination({ total: allMovies.length, pageSize: PAGE_SIZE });
  const pageMovies = moviePg.paginate(allMovies);

  // ── Pagination — actors ─────────────────────────────────────────────────────
  const actorPg    = usePagination({ total: actors.length, pageSize: PAGE_SIZE });
  const pageActors = actorPg.paginate(actors);

  // ── Sync URL query ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (debouncedQuery) setSearchParams({ q: debouncedQuery }, { replace: true });
    else setSearchParams({}, { replace: true });
  }, [debouncedQuery]);

  // ── Load genres + favorites (một lần khi mount) ─────────────────────────────
  useEffect(() => {
    genreService.getAllGenres()
      .then(res => {
        const raw = Array.isArray(res) ? res : res?.genres || res?.data || [];
        setGenres(raw);
      })
      .catch(() => {});

    movieService.getFavorites()
      .then(res => {
        const raw = Array.isArray(res) ? res : res?.data || res?.favorites || [];
        setFavorites(new Set(raw.map(f => f.movieId ?? f.id)));
      })
      .catch(() => {}); // không throw nếu chưa đăng nhập
  }, []);

  // ── Favorite helpers ────────────────────────────────────────────────────────
  const isFavorited = useCallback((id) => favorites.has(id), [favorites]);

  const handleFavoriteToggle = useCallback((movie, newState) => {
    setFavorites(prev => {
      const next = new Set(prev);
      newState ? next.add(movie.id) : next.delete(movie.id);
      return next;
    });
  }, []);

  // ── Fetch movies ─────────────────────────────────────────────────────────────
  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      let result = [];

      if (debouncedQuery.trim()) {
        const raw = await movieService.searchMovies(debouncedQuery);
        result = Array.isArray(raw) ? raw : raw?.data || raw?.movies || [];
      } else {
        const res = await movieService.getMovies(1, 200);
        result = res?.data?.movies ?? res?.movies ?? (Array.isArray(res?.data) ? res.data : []) ?? [];
      }

      // Client filter
      if (selGenre)      result = result.filter(m => m.genres?.some(g => g === selGenre || g?.id === selGenre));
      if (minRating > 0) result = result.filter(m => (m.rating || 0) >= minRating);
      if (selYear)       result = result.filter(m => {
        const y = m.releaseDate ? new Date(m.releaseDate).getFullYear() : m.year;
        return String(y) === String(selYear);
      });

      // Sort
      result = [...result].sort((a, b) =>
        sortBy === 'rating'      ? (b.rating || 0) - (a.rating || 0) :
        sortBy === 'releaseDate' ? new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0) :
        sortBy === 'title'       ? (a.title || '').localeCompare(b.title || '', 'vi') : 0
      );

      setAllMovies(result);
    } catch (e) {
      console.error(e);
      setAllMovies([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selGenre, selYear, sortBy, minRating]);

  // ── Fetch actors ─────────────────────────────────────────────────────────────
  const fetchActors = useCallback(async () => {
    if (!debouncedQuery.trim()) { setActors([]); return; }
    setLoading(true);
    try {
      const raw    = await movieService.searchMoviesByActor(debouncedQuery);
      const movies = Array.isArray(raw) ? raw : raw?.data || raw?.movies || [];
      const map    = new Map();
      const q      = debouncedQuery.toLowerCase();

      movies.forEach(movie => {
        (movie.cast || []).forEach(member => {
          if (!member.name?.toLowerCase().includes(q)) return;
          const key = member.name.toLowerCase();
          if (map.has(key)) {
            map.get(key).movieCount++;
            if (!map.get(key).knownFor.includes(movie.title))
              map.get(key).knownFor += `, ${movie.title}`;
          } else {
            map.set(key, {
              id: member.id || member.personId || null,
              name: member.name,
              profileUrl: member.profileUrl || null,
              knownFor: movie.title,
              biography: member.biography || null,
              birthday: member.birthday || null,
              placeOfBirth: member.placeOfBirth || null,
              movieCount: 1,
            });
          }
        });
        if (movie.directorDetail?.name?.toLowerCase().includes(q)) {
          const d   = movie.directorDetail;
          const key = d.name.toLowerCase();
          if (map.has(key)) { map.get(key).movieCount++; }
          else map.set(key, {
            id: null, name: d.name, profileUrl: d.profileUrl || null,
            knownFor: `Đạo diễn — ${movie.title}`,
            biography: d.biography || null, birthday: d.birthday || null,
            placeOfBirth: d.placeOfBirth || null, movieCount: 1,
          });
        }
      });

      setActors([...map.values()]);
    } catch (e) {
      console.error(e);
      setActors([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    if (tab === 'movies') fetchMovies();
    else fetchActors();
  }, [debouncedQuery, selGenre, selYear, sortBy, minRating, tab]);

  // Scroll lên khi chuyển trang
  useEffect(() => {
    if (moviePg.page > 1) window.scrollTo({ top: 160, behavior: 'smooth' });
  }, [moviePg.page]);

  useEffect(() => {
    if (actorPg.page > 1) window.scrollTo({ top: 160, behavior: 'smooth' });
  }, [actorPg.page]);

  const clearFilters = () => { setSelGenre(null); setSelYear(null); setMinRating(0); setSortBy('rating'); };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, paddingTop: 68 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: ${C.textDim}; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-thumb { background: #252525; border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '28px 28px 100px' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}
        >
          <BackButton />
          <div>
            <h1 style={{ fontFamily: FONT_TITLE, fontSize: 30, fontWeight: 900, color: C.text, letterSpacing: '0.02em', lineHeight: 1 }}>
              Tìm kiếm
            </h1>
            {debouncedQuery && allMovies.length > 0 && tab === 'movies' && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginTop: 3 }}>
                {allMovies.length} kết quả cho "{debouncedQuery}"
              </motion.p>
            )}
          </div>
        </motion.div>

        {/* SearchBar */}
        <SearchBar value={query} onChange={setQuery} loading={loading} />

        {/* Tabs + filter toggle */}
        <SearchTabs
          tab={tab} onTabChange={t => { setTab(t); }}
          totalMovies={allMovies.length} totalActors={actors.length}
          filterCount={filterCount} showFilter={showFilter}
          onToggleFilter={() => setShowFilter(v => !v)}
        />

        {/* Filter panel */}
        <FilterPanel
          show={showFilter && tab === 'movies'}
          genres={genres}
          selGenre={selGenre}   onGenreChange={setSelGenre}
          selYear={selYear}     onYearChange={setSelYear}
          sortBy={sortBy}       onSortChange={setSortBy}
          minRating={minRating} onRatingChange={setMinRating}
          filterCount={filterCount} onClearAll={clearFilters}
        />

        {/* Active chips */}
        <AnimatePresence>
          {filterCount > 0 && !showFilter && tab === 'movies' && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {selGenre     && <Chip label={genres.find(g => g.id === selGenre)?.name || 'Genre'} onRemove={() => setSelGenre(null)} />}
              {selYear      && <Chip label={selYear}           onRemove={() => setSelYear(null)} />}
              {minRating > 0 && <Chip label={`⭐ ${minRating}+`} onRemove={() => setMinRating(0)} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence mode="wait">

          {/* ── Movies tab ── */}
          {tab === 'movies' && (
            <motion.div key="movies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

              {/* Empty prompt */}
              {!debouncedQuery && filterCount === 0 && !loading && allMovies.length === 0 && <EmptySearch />}

              {/* Skeleton */}
              {loading && allMovies.length === 0 && (
                <div style={GRID_6}>
                  {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              )}

              {/* No results */}
              {!loading && allMovies.length === 0 && (debouncedQuery || filterCount > 0) && (
                <NoResults query={debouncedQuery} />
              )}

              {/* Grid */}
              {allMovies.length > 0 && (
                <>
                  <div style={{ ...GRID_6, opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                    <AnimatePresence mode="popLayout">
                      {pageMovies.map((m, i) => (
                        <motion.div key={m.id || i}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: Math.min(i * 0.02, 0.25), duration: 0.25 }}>
                          <MovieCard
                            movie={m}
                            index={i}
                            isFavorited={isFavorited(m.id)}
                            onFavoriteToggle={handleFavoriteToggle}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <Pagination
                    page={moviePg.page}
                    totalPages={moviePg.totalPages}
                    total={allMovies.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={moviePg.goTo}
                    pageNumbers={moviePg.pageNumbers}
                    itemLabel="kết quả"
                  />
                </>
              )}
            </motion.div>
          )}

          {/* ── Actors tab ── */}
          {tab === 'actors' && (
            <motion.div key="actors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

              {!debouncedQuery && (
                <div style={{ textAlign: 'center', padding: '72px 0' }}>
                  <div style={{ fontSize: 44, marginBottom: 16, opacity: 0.5 }}>🎭</div>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: C.textSub }}>Nhập tên diễn viên hoặc đạo diễn để tìm kiếm</p>
                </div>
              )}

              {loading && actors.length === 0 && debouncedQuery && (
                <div style={GRID_6}>
                  {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              )}

              {!loading && actors.length === 0 && debouncedQuery && <NoResults query={debouncedQuery} isActor />}

              {actors.length > 0 && (
                <>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginBottom: 16 }}>
                    {actors.length} diễn viên / đạo diễn
                  </p>
                  <div style={GRID_6}>
                    <AnimatePresence mode="popLayout">
                      {pageActors.map((a, i) => (
                        <motion.div key={a.name + i}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          transition={{ delay: Math.min(i * 0.02, 0.25), duration: 0.25 }}>
                          <ActorCard
                            actor={a} index={i}
                            onActorClick={(actor) => navigate(`/person/${toSlug(actor.name)}`, { state: { actor } })}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <Pagination
                    page={actorPg.page}
                    totalPages={actorPg.totalPages}
                    total={actors.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={actorPg.goTo}
                    pageNumbers={actorPg.pageNumbers}
                    itemLabel="diễn viên"
                  />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating loading */}
      <AnimatePresence>
        {loading && (allMovies.length > 0 || actors.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 20px', background: 'rgba(16,16,16,0.95)', borderRadius: 40, border: `1px solid ${C.border}`, backdropFilter: 'blur(16px)', zIndex: 9000, boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid rgba(229,24,30,0.25)`, borderTopColor: C.accent, animation: 'spin 0.7s linear infinite' }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSub }}>Đang tải...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}