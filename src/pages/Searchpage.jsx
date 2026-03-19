// src/pages/SearchPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import movieService from '../services/movieService';
import genreService from '../services/genreService';

import { C, FONT_TITLE, FONT_BODY } from '../components/search/searchConstants';
import SearchBar from '../components/search/SearchBar';
import SearchTabs from '../components/search/SearchTabs';
import FilterPanel, { Chip } from '../components/search/FilterPanel';
import MovieCard from '../components/movie/MovieCard';
import ActorCard from '../components/search/ActorCard';
import { SkeletonCard, EmptySearch, NoResults, GRID_STYLE } from '../components/search/SearchUI';

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const PAGE_SIZE = 20;

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query,     setQuery]     = useState(searchParams.get('q') || '');
  const [tab,       setTab]       = useState('movies');
  const [genres,    setGenres]    = useState([]);
  const [movies,    setMovies]    = useState([]);
  const [actors,    setActors]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [hasMore,   setHasMore]   = useState(false);

  const [showFilter, setShowFilter] = useState(false);
  const [selGenre,   setSelGenre]   = useState(null);
  const [selYear,    setSelYear]    = useState(null);
  const [sortBy,     setSortBy]     = useState('rating');
  const [minRating,  setMinRating]  = useState(0);

  const debouncedQuery = useDebounce(query);
  const filterCount    = [selGenre, selYear, minRating > 0].filter(Boolean).length;

  useEffect(() => {
    genreService.getAllGenres()
      .then(res => {
        const raw = Array.isArray(res) ? res : res?.genres || res?.data || [];
        setGenres(raw);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (debouncedQuery) setSearchParams({ q: debouncedQuery }, { replace: true });
    else setSearchParams({}, { replace: true });
  }, [debouncedQuery]);

  const fetchMovies = useCallback(async (resetPage = true) => {
    setLoading(true);
    const pg = resetPage ? 1 : page;
    if (resetPage) { setPage(1); setMovies([]); }
    try {
      if (debouncedQuery.trim()) {
        const raw = await movieService.searchMovies(debouncedQuery);
        let result = Array.isArray(raw) ? raw : raw?.data || raw?.movies || [];
        if (selGenre) result = result.filter(m => m.genres?.some(g => g === selGenre || g?.id === selGenre));
        if (minRating > 0) result = result.filter(m => (m.rating || 0) >= minRating);
        if (selYear) result = result.filter(m => {
          const y = m.releaseDate ? new Date(m.releaseDate).getFullYear() : m.year;
          return String(y) === String(selYear);
        });
        result = [...result].sort((a, b) => {
          if (sortBy === 'rating')      return (b.rating || 0) - (a.rating || 0);
          if (sortBy === 'releaseDate') return new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0);
          if (sortBy === 'title')       return (a.title || '').localeCompare(b.title || '');
          return 0;
        });
        setMovies(result); setTotal(result.length); setHasMore(false);
      } else {
        const params = {
          page: pg, pageSize: PAGE_SIZE, sortBy, sortDesc: sortBy !== 'title',
          ...(selGenre      ? { genreIds: [selGenre] } : {}),
          ...(minRating > 0 ? { minRating }            : {}),
          ...(selYear ? { fromReleaseDate: `${selYear}-01-01`, toReleaseDate: `${selYear}-12-31` } : {}),
        };
        const res   = await movieService.getMovies(params);
        const raw   = res?.data?.movies ?? res?.movies ?? res?.data ?? [];
        const count = res?.data?.total  ?? res?.total  ?? raw.length;
        setMovies(prev => resetPage ? raw : [...prev, ...raw]);
        setTotal(count); setHasMore(raw.length === PAGE_SIZE);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [debouncedQuery, selGenre, selYear, sortBy, minRating, page]);

  const fetchActors = useCallback(async () => {
    if (!debouncedQuery.trim()) { setActors([]); return; }
    setLoading(true);
    try {
      const raw    = await movieService.searchMovies(debouncedQuery);
      const movies = Array.isArray(raw) ? raw : raw?.data || raw?.movies || [];
      const map    = new Map();
      movies.forEach(movie => {
        (movie.cast || []).forEach(member => {
          const key = member.name?.toLowerCase();
          if (!key) return;
          if (map.has(key)) map.get(key).movieCount++;
          else map.set(key, { name: member.name, profileUrl: member.profileUrl, knownFor: movie.title, movieCount: 1 });
        });
        if (movie.director) {
          const key = movie.director.toLowerCase();
          if (map.has(key)) map.get(key).movieCount++;
          else map.set(key, { name: movie.director, profileUrl: null, knownFor: `Đạo diễn — ${movie.title}`, movieCount: 1 });
        }
      });
      const q = debouncedQuery.toLowerCase();
      setActors([...map.values()].filter(a => a.name?.toLowerCase().includes(q)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [debouncedQuery]);

  useEffect(() => {
    if (tab === 'movies') fetchMovies(true);
    else fetchActors();
  }, [debouncedQuery, selGenre, selYear, sortBy, minRating, tab]);

  const clearFilters = () => { setSelGenre(null); setSelYear(null); setMinRating(0); setSortBy('rating'); };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, paddingTop: 60 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@600;700;800;900&family=Nunito:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 80px' }}>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <button onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSub, display: 'flex', padding: '6px 0' }}>
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontFamily: FONT_TITLE, fontSize: 28, fontWeight: 900, color: C.text }}>
            Tìm kiếm
          </h1>
        </motion.div>

        <SearchBar value={query} onChange={setQuery} />

        <SearchTabs
          tab={tab} onTabChange={setTab}
          totalMovies={total} totalActors={actors.length}
          filterCount={filterCount} showFilter={showFilter}
          onToggleFilter={() => setShowFilter(v => !v)}
        />

        <FilterPanel
          show={showFilter && tab === 'movies'}
          genres={genres}
          selGenre={selGenre}   onGenreChange={setSelGenre}
          selYear={selYear}     onYearChange={setSelYear}
          sortBy={sortBy}       onSortChange={setSortBy}
          minRating={minRating} onRatingChange={setMinRating}
          filterCount={filterCount} onClearAll={clearFilters}
        />

        {filterCount > 0 && !showFilter && tab === 'movies' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {selGenre    && <Chip label={genres.find(g => g.id === selGenre)?.name || 'Genre'} onRemove={() => setSelGenre(null)} />}
            {selYear     && <Chip label={selYear}           onRemove={() => setSelYear(null)} />}
            {minRating > 0 && <Chip label={`⭐ ${minRating}+`} onRemove={() => setMinRating(0)} />}
          </div>
        )}

        <AnimatePresence mode="wait">
          {tab === 'movies' && (
            <motion.div key="movies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {!debouncedQuery && filterCount === 0 && !loading && movies.length === 0 && <EmptySearch />}
              {loading && movies.length === 0 && (
                <div style={GRID_STYLE}>{Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}</div>
              )}
              {!loading && movies.length === 0 && (debouncedQuery || filterCount > 0) && <NoResults query={debouncedQuery} />}
              {movies.length > 0 && (
                <>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginBottom: 16 }}>
                    {debouncedQuery ? `${total} kết quả cho "${debouncedQuery}"` : `${total} phim`}
                  </p>
                  <div style={GRID_STYLE}>
                    {movies.map((m, i) => <MovieCard key={m.id || i} movie={m} index={i % 20} />)}
                    {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`sk${i}`} />)}
                  </div>
                  {hasMore && !loading && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
                      <button
                        onClick={() => { setPage(p => p + 1); fetchMovies(false); }}
                        style={{ padding: '11px 32px', borderRadius: 8, border: `1px solid ${C.border}`,
                          background: C.surfaceMid, color: C.textSub, cursor: 'pointer',
                          fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600 }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = C.borderBright}
                        onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                      >
                        Xem thêm
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {tab === 'actors' && (
            <motion.div key="actors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {!debouncedQuery && (
                <div style={{ textAlign: 'center', padding: '64px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🎭</div>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: C.textSub }}>
                    Nhập tên diễn viên hoặc đạo diễn để tìm kiếm
                  </p>
                </div>
              )}
              {loading && actors.length === 0 && debouncedQuery && (
                <div style={GRID_STYLE}>{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div>
              )}
              {!loading && actors.length === 0 && debouncedQuery && <NoResults query={debouncedQuery} isActor />}
              {actors.length > 0 && (
                <>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginBottom: 16 }}>
                    {actors.length} diễn viên / đạo diễn tìm thấy
                  </p>
                  <div style={GRID_STYLE}>
                    {actors.map((a, i) => <ActorCard key={a.name + i} actor={a} index={i} />)}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {loading && (movies.length > 0 || actors.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
              background: 'rgba(20,20,20,0.92)', borderRadius: 40, border: `1px solid ${C.border}`,
              backdropFilter: 'blur(12px)', zIndex: 9000 }}>
            <Loader2 size={14} style={{ color: C.accent, animation: 'spin 0.7s linear infinite' }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSub }}>Đang tải...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}