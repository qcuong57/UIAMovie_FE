// src/components/admin/AdminPersons.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Calendar, MapPin, Film, Tv, Clapperboard, X } from 'lucide-react';
import { usePagination } from '../../hooks/usePagination';
import AdminPagination from '../common/AdminPagination';
import axiosInstance from '../../config/axios';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../context/adminTokens';

const PAGE_SIZE = 20;
const BATCH = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────
const fetchDetailsBatch = async (items, endpoint) => {
  const details = [];
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(item => axiosInstance.get(`/${endpoint}/${item.id}`))
    );
    for (const r of results) {
      if (r.status === 'fulfilled') {
        const d = r.value?.data ?? r.value;
        if (d) details.push(d);
      }
    }
  }
  return details;
};

const fetchPersonsFromMovies = async () => {
  const listRes = await axiosInstance.get('/movies?pageSize=500');
  const movies  = Array.isArray(listRes) ? listRes
    : listRes?.items ?? listRes?.movies ?? listRes?.data?.items ?? listRes?.data ?? [];
  if (movies.length === 0) return new Map();

  const details   = await fetchDetailsBatch(movies, 'movies');
  const personMap = new Map();
  const upsert = (key, data, type, movie) => {
    if (!personMap.has(key)) personMap.set(key, { ...data, movies: [], tvShows: [], type });
    const entry = personMap.get(key);
    entry.movies.push({ id: movie.id, title: movie.title, posterUrl: movie.posterUrl });
    if (type === 'director') entry.type = 'director';
  };
  for (const m of details) {
    if (Array.isArray(m.cast)) for (const c of m.cast) upsert(c.tmdbPersonId ?? c.name, c, 'cast', m);
    if (m.directorDetail) { const d = m.directorDetail; upsert(d.tmdbPersonId ?? d.name, d, 'director', m); }
    else if (m.director)  upsert(m.director, { name: m.director, profileUrl: null }, 'director', m);
  }
  return personMap;
};

const fetchPersonsFromTvShows = async () => {
  const listRes = await axiosInstance.get('/tvshows?pageSize=500');
  const shows   = Array.isArray(listRes) ? listRes
    : listRes?.items ?? listRes?.tvShows ?? listRes?.data?.items ?? listRes?.data ?? [];
  if (shows.length === 0) return new Map();

  const details   = await fetchDetailsBatch(shows, 'tvshows');
  const personMap = new Map();
  const upsert = (key, data, type, show) => {
    if (!personMap.has(key)) personMap.set(key, { ...data, movies: [], tvShows: [], type });
    const entry = personMap.get(key);
    entry.tvShows.push({ id: show.id, title: show.title, posterUrl: show.posterUrl });
    if (type === 'director') entry.type = 'director';
  };
  for (const s of details) {
    if (Array.isArray(s.cast)) for (const c of s.cast) upsert(c.tmdbPersonId ?? c.name, c, 'cast', s);
    if (Array.isArray(s.creators)) for (const cr of s.creators) upsert(cr.tmdbPersonId ?? cr.name, cr, 'director', s);
    else if (s.directorDetail) { const d = s.directorDetail; upsert(d.tmdbPersonId ?? d.name, d, 'director', s); }
  }
  return personMap;
};

const mergePersonMaps = (mapA, mapB) => {
  const merged = new Map(mapA);
  for (const [key, personB] of mapB) {
    if (!merged.has(key)) {
      merged.set(key, { ...personB });
    } else {
      const existing = merged.get(key);
      existing.movies  = [...(existing.movies  ?? []), ...(personB.movies  ?? [])];
      existing.tvShows = [...(existing.tvShows ?? []), ...(personB.tvShows ?? [])];
      if (personB.type === 'director') existing.type = 'director';
      if (!existing.profileUrl  && personB.profileUrl)  existing.profileUrl  = personB.profileUrl;
      if (!existing.biography   && personB.biography)   existing.biography   = personB.biography;
      if (!existing.birthday    && personB.birthday)     existing.birthday    = personB.birthday;
      if (!existing.placeOfBirth && personB.placeOfBirth) existing.placeOfBirth = personB.placeOfBirth;
    }
  }
  return merged;
};

// ── PersonCard ────────────────────────────────────────────────────────────────
const PersonCard = ({ person, index, onClick }) => {
  const [imgErr, setImgErr] = useState(false);
  const isDirector = person.type === 'director';
  const totalWorks = (person.movies?.length ?? 0) + (person.tvShows?.length ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.018 }}
      onClick={() => onClick(person)}
      style={{
        background: T.surface, borderRadius: 14,
        border: `1px solid ${T.border}`, boxShadow: T.shadow,
        overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = T.shadowMd; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = T.shadow;   e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Photo */}
      <div style={{ aspectRatio: '2/3', background: T.bg, overflow: 'hidden', position: 'relative' }}>
        {person.profileUrl && !imgErr ? (
          <img src={person.profileUrl} alt={person.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }}
            onError={() => setImgErr(true)} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDirector ? T.accentLight : T.surfaceAlt }}>
            <User size={34} color={isDirector ? T.accent : T.textMuted} strokeWidth={1.2} />
          </div>
        )}
        {/* Role badge */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          padding: '3px 8px', borderRadius: 6,
          background: isDirector ? T.accent : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(4px)',
          boxShadow: T.shadow,
          fontFamily: FONT, fontSize: 9.5, fontWeight: 700,
          color: isDirector ? 'white' : T.textSub,
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          {isDirector ? 'Đạo diễn' : 'Diễn viên'}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '11px 12px 13px' }}>
        <p style={{
          fontFamily: FONT_TITLE, fontSize: 13, fontWeight: 700,
          color: T.text, marginBottom: 3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {person.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {person.movies?.length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: FONT, fontSize: 11, color: T.textMuted }}>
              <Film size={9} /> {person.movies.length}
            </span>
          )}
          {person.tvShows?.length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: FONT, fontSize: 11, color: T.textMuted }}>
              <Tv size={9} /> {person.tvShows.length}
            </span>
          )}
          {totalWorks === 0 && (
            <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted }}>0 tác phẩm</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
    <div style={{
      aspectRatio: '2/3',
      background: `linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.surfaceHov} 50%, ${T.surfaceAlt} 75%)`,
      backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite',
    }} />
    <div style={{ padding: '11px 12px 13px' }}>
      <div style={{ height: 13, width: '75%', borderRadius: 5, marginBottom: 7,
        background: `linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.surfaceHov} 50%, ${T.surfaceAlt} 75%)`,
        backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite',
      }} />
      <div style={{ height: 11, width: '45%', borderRadius: 5,
        background: `linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.surfaceHov} 50%, ${T.surfaceAlt} 75%)`,
        backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite 0.1s',
      }} />
    </div>
  </div>
);

// ── WorksSection ──────────────────────────────────────────────────────────────
const WorksSection = ({ items, icon: Icon, label, color }) => {
  if (!items?.length) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{
        fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <Icon size={11} color={color ?? T.textMuted} />
        {items.length} {label}
      </p>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {items.slice(0, 8).map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 8,
            background: T.surfaceAlt, border: `1px solid ${T.border}`,
          }}>
            {item.posterUrl && (
              <img src={item.posterUrl} alt="" style={{ width: 18, height: 25, borderRadius: 3, objectFit: 'cover', flexShrink: 0 }} />
            )}
            <span style={{ fontFamily: FONT, fontSize: 12, color: T.textSub, whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.title}
            </span>
          </div>
        ))}
        {items.length > 8 && (
          <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, alignSelf: 'center', padding: '5px 8px' }}>
            +{items.length - 8} khác
          </span>
        )}
      </div>
    </div>
  );
};

// ── PersonDetail (modal body) ─────────────────────────────────────────────────
const PersonDetail = ({ person }) => {
  const [imgErr, setImgErr] = useState(false);
  if (!person) return null;
  const isDirector = person.type === 'director';

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', fontFamily: FONT }}>
      {/* Photo */}
      <div style={{
        width: 160, flexShrink: 0, borderRadius: 12,
        overflow: 'hidden', background: T.bg, border: `1px solid ${T.border}`,
      }}>
        {person.profileUrl && !imgErr ? (
          <img src={person.profileUrl} alt={person.name}
            style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }}
            onError={() => setImgErr(true)} />
        ) : (
          <div style={{ width: '100%', aspectRatio: '2/3', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDirector ? T.accentLight : T.surfaceAlt }}>
            <User size={48} color={isDirector ? T.accent : T.textMuted} strokeWidth={1} />
          </div>
        )}
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name & role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: FONT_TITLE, fontSize: 22, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.02em' }}>
            {person.name}
          </h2>
          <span style={{
            fontFamily: FONT, fontSize: 11, fontWeight: 600,
            padding: '3px 10px', borderRadius: 99,
            background: isDirector ? T.accentLight : T.bg,
            border: `1px solid ${isDirector ? T.accent + '30' : T.border}`,
            color: isDirector ? T.accentText : T.textSub,
          }}>
            {isDirector ? 'Đạo diễn' : 'Diễn viên'}
          </span>
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
          {person.birthday && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Calendar size={13} color={T.textMuted} />
              <span style={{ fontFamily: FONT, fontSize: 13, color: T.textSub }}>
                {new Date(person.birthday).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          )}
          {person.placeOfBirth && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <MapPin size={13} color={T.textMuted} />
              <span style={{ fontFamily: FONT, fontSize: 13, color: T.textSub }}>{person.placeOfBirth}</span>
            </div>
          )}
          {person.tmdbPersonId && (
            <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>TMDB ID: #{person.tmdbPersonId}</span>
          )}
        </div>

        {/* Biography */}
        {person.biography && (
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Tiểu sử</p>
            <p style={{ fontFamily: FONT, fontSize: 13, color: T.textSub, lineHeight: 1.7, maxHeight: 140, overflowY: 'auto' }}>
              {person.biography}
            </p>
          </div>
        )}

        <WorksSection items={person.movies}   icon={Film} label="phim điện ảnh" color={T.accent}  />
        <WorksSection items={person.tvShows}  icon={Tv}   label="TV show"       color="#7C3AED"   />
      </div>
    </div>
  );
};

// ── AdminPersons ──────────────────────────────────────────────────────────────
export default function AdminPersons() {
  const [allPersons, setAllPersons] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selected,   setSelected]   = useState(null);

  useEffect(() => {
    Promise.all([fetchPersonsFromMovies(), fetchPersonsFromTvShows()])
      .then(([movieMap, tvMap]) => {
        const merged  = mergePersonMaps(movieMap, tvMap);
        const persons = Array.from(merged.values())
          .filter(p => p.name)
          .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'vi'));
        setAllPersons(persons);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = allPersons.filter(p => {
    const q = search.toLowerCase();
    return (!q || p.name?.toLowerCase().includes(q)) && (!typeFilter || p.type === typeFilter);
  });

  const pagination  = usePagination({ total: filtered.length, pageSize: PAGE_SIZE });
  const pagePersons = pagination.paginate(filtered);

  const directorCount = allPersons.filter(p => p.type === 'director').length;
  const castCount     = allPersons.filter(p => p.type !== 'director').length;

  return (
    <div style={{ padding: '28px 32px 64px', maxWidth: 1200, fontFamily: FONT }}>
      <style>{ADMIN_GOOGLE_FONTS}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 22 }}>
        <p style={{ fontSize: 11.5, color: T.textMuted, marginBottom: 3, fontFamily: FONT, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Quản lý</p>
        <h2 style={{ fontFamily: FONT_TITLE, fontSize: 23, fontWeight: 700, color: T.text, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 8 }}>
          Diễn viên & Đạo diễn
          <span style={{ fontSize: 13.5, fontWeight: 500, color: T.textMuted, letterSpacing: 0, fontFamily: FONT }}>
            · {filtered.length.toLocaleString('vi-VN')}
          </span>
        </h2>
      </div>

      {/* ── Stat chips ── */}
      {!loading && allPersons.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { icon: User,         label: 'Tổng',       value: allPersons.length, accent: T.accent  },
            { icon: User,         label: 'Diễn viên',  value: castCount,         accent: '#0891B2' },
            { icon: Clapperboard, label: 'Đạo diễn',   value: directorCount,     accent: '#7C3AED' },
          ].map(({ icon: Icon, label, value, accent }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px', borderRadius: 12,
              background: T.surface, border: `1px solid ${T.border}`,
              boxShadow: T.shadow,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: accent + '15' }}>
                <Icon size={14} color={accent} />
              </div>
              <div>
                <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, marginBottom: 1 }}>{label}</p>
                <p style={{ fontFamily: FONT_TITLE, fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={14} color={T.textMuted} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            placeholder="Tìm theo tên…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', height: 42, padding: '0 14px 0 38px',
              borderRadius: 11, background: T.surface, border: `1px solid ${T.border}`,
              fontFamily: FONT, fontSize: 13.5, color: T.text, outline: 'none',
              boxShadow: T.shadow, transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = T.accent + '80'}
            onBlur={e  => e.target.style.borderColor = T.border}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{
              height: 42, padding: '0 34px 0 14px', borderRadius: 11,
              background: T.surface, border: `1px solid ${T.border}`,
              color: typeFilter ? T.text : T.textMuted,
              fontFamily: FONT, fontSize: 13.5, outline: 'none', cursor: 'pointer',
              minWidth: 150, boxShadow: T.shadow,
              transition: 'border-color 0.15s', appearance: 'none',
            }}
            onFocus={e => e.target.style.borderColor = T.accent + '80'}
            onBlur={e  => e.target.style.borderColor = T.border}
          >
            <option value="">Tất cả</option>
            <option value="cast">Diễn viên</option>
            <option value="director">Đạo diễn</option>
          </select>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2"
            style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
          {Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '96px 0', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, background: T.surfaceAlt,
            border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <User size={28} color={T.textMuted} strokeWidth={1.2} />
          </div>
          <p style={{ fontFamily: FONT_TITLE, fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 6 }}>Không tìm thấy kết quả</p>
          <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Thử thay đổi từ khoá hoặc bộ lọc</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
            <AnimatePresence>
              {pagePersons.map((p, i) => (
                <PersonCard key={p.tmdbPersonId ?? p.name} person={p} index={i} onClick={setSelected} />
              ))}
            </AnimatePresence>
          </div>
          <AdminPagination {...pagination.props} itemLabel="người" />
        </>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {!!selected && (
          <>
            <motion.div
              key="person-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 299, backdropFilter: 'blur(3px)' }}
            />
            <motion.div
              key="person-modal"
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1,    y: 0 }}
              exit={{   opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              style={{
                position: 'fixed', inset: 0, margin: 'auto',
                width: 660, height: 'fit-content', maxHeight: '88vh',
                zIndex: 300,
                background: T.surface,
                borderRadius: 16,
                border: `1px solid ${T.border}`,
                boxShadow: T.shadowLg,
                display: 'flex', flexDirection: 'column',
                fontFamily: FONT, overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <p style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3, fontWeight: 600, fontFamily: FONT }}>
                    {selected?.type === 'director' ? 'Đạo diễn' : 'Diễn viên'}
                  </p>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em', fontFamily: FONT_TITLE, maxWidth: 460, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected?.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                <PersonDetail person={selected} />
              </div>

              {/* Footer */}
              <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, background: T.surface, display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                <button
                  onClick={() => setSelected(null)}
                  style={{ padding: '8px 20px', borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textSub }}
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}