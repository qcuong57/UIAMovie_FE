// src/pages/SearchPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import movieService from '../services/movieService';
import genreService from '../services/genreService';

const toSlug = (name) =>
  (name || 'unknown')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

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
      // Gọi endpoint search/actor — trả về list phim có diễn viên khớp tên
      const raw = await movieService.searchMoviesByActor(debouncedQuery);
      const movies = Array.isArray(raw) ? raw : raw?.data || raw?.movies || [];

      // Trích xuất diễn viên từ cast của các phim trả về, gom theo tên
      const map = new Map();
      const q   = debouncedQuery.toLowerCase();

      movies.forEach(movie => {
        // Cast
        (movie.cast || []).forEach(member => {
          if (!member.name?.toLowerCase().includes(q)) return;
          const key = member.name.toLowerCase();
          if (map.has(key)) {
            map.get(key).movieCount++;
            if (!map.get(key).knownFor.includes(movie.title))
              map.get(key).knownFor += `, ${movie.title}`;
          } else {
            map.set(key, {
              id:          member.id || member.personId || null,
              name:        member.name,
              profileUrl:  member.profileUrl || null,
              knownFor:    movie.title,
              biography:   member.biography   || null,
              birthday:    member.birthday    || null,
              placeOfBirth:member.placeOfBirth|| null,
              movieCount:  1,
            });
          }
        });

        // Director — nếu tên cũng khớp query
        if (movie.directorDetail?.name?.toLowerCase().includes(q)) {
          const d   = movie.directorDetail;
          const key = d.name.toLowerCase();
          if (map.has(key)) {
            map.get(key).movieCount++;
          } else {
            map.set(key, {
              id:          null,
              name:        d.name,
              profileUrl:  d.profileUrl  || null,
              knownFor:    `Đạo diễn — ${movie.title}`,
              biography:   d.biography   || null,
              birthday:    d.birthday    || null,
              placeOfBirth:d.placeOfBirth|| null,
              movieCount:  1,
            });
          }
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
    if (tab === 'movies') fetchMovies(true);
    else fetchActors();
  }, [debouncedQuery, selGenre, selYear, sortBy, minRating, tab]);

  const clearFilters = () => { setSelGenre(null); setSelYear(null); setMinRating(0); setSortBy('rating'); };

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

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}
        >
          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.92 }}
            style={{
              background: C.surfaceMid, border: `1px solid ${C.border}`,
              borderRadius: 9, cursor: 'pointer', color: C.textSub,
              display: 'flex', padding: '8px',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderBright; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSub; }}
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </motion.button>

          <div>
            <h1 style={{
              fontFamily: FONT_TITLE, fontSize: 30, fontWeight: 900,
              color: C.text, letterSpacing: '0.02em', lineHeight: 1,
            }}>
              Tìm kiếm
            </h1>
            {debouncedQuery && total > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginTop: 3 }}
              >
                {total} kết quả cho "{debouncedQuery}"
              </motion.p>
            )}
          </div>
        </motion.div>

        {/* ── SearchBar ── */}
        <SearchBar value={query} onChange={setQuery} loading={loading} />

        {/* ── Tabs + Filter toggle ── */}
        <SearchTabs
          tab={tab} onTabChange={setTab}
          totalMovies={total} totalActors={actors.length}
          filterCount={filterCount} showFilter={showFilter}
          onToggleFilter={() => setShowFilter(v => !v)}
        />

        {/* ── Filter panel ── */}
        <FilterPanel
          show={showFilter && tab === 'movies'}
          genres={genres}
          selGenre={selGenre}   onGenreChange={setSelGenre}
          selYear={selYear}     onYearChange={setSelYear}
          sortBy={sortBy}       onSortChange={setSortBy}
          minRating={minRating} onRatingChange={setMinRating}
          filterCount={filterCount} onClearAll={clearFilters}
        />

        {/* ── Active filter chips ── */}
        <AnimatePresence>
          {filterCount > 0 && !showFilter && tab === 'movies' && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}
            >
              {selGenre    && <Chip label={genres.find(g => g.id === selGenre)?.name || 'Genre'} onRemove={() => setSelGenre(null)} />}
              {selYear     && <Chip label={selYear}           onRemove={() => setSelYear(null)} />}
              {minRating > 0 && <Chip label={`⭐ ${minRating}+`} onRemove={() => setMinRating(0)} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ── */}
        <AnimatePresence mode="wait">

          {/* Movies tab */}
          {tab === 'movies' && (
            <motion.div key="movies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}>

              {!debouncedQuery && filterCount === 0 && !loading && movies.length === 0 && <EmptySearch />}

              {loading && movies.length === 0 && (
                <div style={GRID_STYLE}>
                  {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              )}

              {!loading && movies.length === 0 && (debouncedQuery || filterCount > 0) && (
                <NoResults query={debouncedQuery} />
              )}

              {movies.length > 0 && (
                <>
                  <div style={GRID_STYLE}>
                    {movies.map((m, i) => (
                      <MovieCard key={m.id || i} movie={m} index={i % 20} />
                    ))}
                    {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`sk${i}`} />)}
                  </div>

                  {hasMore && !loading && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
                      <motion.button
                        whileHover={{ scale: 1.03, borderColor: C.borderBright }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { setPage(p => p + 1); fetchMovies(false); }}
                        style={{
                          padding: '12px 36px', borderRadius: 10,
                          border: `1px solid ${C.border}`,
                          background: C.surfaceMid, color: C.textSub,
                          cursor: 'pointer', fontFamily: FONT_BODY,
                          fontSize: 13, fontWeight: 600,
                          transition: 'all 0.15s',
                        }}
                      >
                        Xem thêm
                      </motion.button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* Actors tab */}
          {tab === 'actors' && (
            <motion.div key="actors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}>

              {!debouncedQuery && (
                <div style={{ textAlign: 'center', padding: '72px 0' }}>
                  <div style={{ fontSize: 44, marginBottom: 16, opacity: 0.5 }}>🎭</div>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: C.textSub }}>
                    Nhập tên diễn viên hoặc đạo diễn để tìm kiếm
                  </p>
                </div>
              )}

              {loading && actors.length === 0 && debouncedQuery && (
                <div style={GRID_STYLE}>
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
                  <div style={GRID_STYLE}>
                    {actors.map((a, i) => (
                      <ActorCard
                        key={a.name + i}
                        actor={a}
                        index={i}
                        onActorClick={(actor) => {
                          navigate(`/person/${toSlug(actor.name)}`, {
                            state: { actor }
                          });
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Floating loading indicator ── */}
      <AnimatePresence>
        {loading && (movies.length > 0 || actors.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            style={{
              position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 9, padding: '10px 20px',
              background: 'rgba(16,16,16,0.95)',
              borderRadius: 40, border: `1px solid ${C.border}`,
              backdropFilter: 'blur(16px)', zIndex: 9000,
              boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              border: `2px solid rgba(229,24,30,0.25)`,
              borderTopColor: C.accent,
              animation: 'spin 0.7s linear infinite',
            }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSub }}>
              Đang tải...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}