// src/components/admin/AdminPersons.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Calendar, MapPin, Film, Tv } from 'lucide-react';
import { Modal } from '../ui';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../common/Pagination';
import axiosInstance from '../../config/axios';

const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const T = {
  bg:          '#F4F3EF',
  surface:     '#FFFFFF',
  surfaceAlt:  '#FAFAF8',
  surfaceHov:  '#F6F6F3',
  accent:      '#1C5F3A',
  accentLight: '#EAF5EF',
  accentText:  '#155230',
  text:        '#18181B',
  textSub:     '#71717A',
  textMuted:   '#A1A1AA',
  border:      'rgba(0,0,0,0.08)',
  shadow:      '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
};

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

// ── Fetch persons from movies ─────────────────────────────────────────────────
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
    if (Array.isArray(m.cast)) {
      for (const c of m.cast) upsert(c.tmdbPersonId ?? c.name, c, 'cast', m);
    }
    if (m.directorDetail) {
      const d = m.directorDetail;
      upsert(d.tmdbPersonId ?? d.name, d, 'director', m);
    } else if (m.director) {
      upsert(m.director, { name: m.director, profileUrl: null }, 'director', m);
    }
  }

  return personMap;
};

// ── Fetch persons from TV shows ───────────────────────────────────────────────
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
    if (Array.isArray(s.cast)) {
      for (const c of s.cast) upsert(c.tmdbPersonId ?? c.name, c, 'cast', s);
    }
    // TV shows thường dùng creators thay vì director
    if (Array.isArray(s.creators)) {
      for (const cr of s.creators) upsert(cr.tmdbPersonId ?? cr.name, cr, 'director', s);
    } else if (s.directorDetail) {
      const d = s.directorDetail;
      upsert(d.tmdbPersonId ?? d.name, d, 'director', s);
    }
  }

  return personMap;
};

// ── Merge hai Map persons lại với nhau ───────────────────────────────────────
const mergePersonMaps = (mapA, mapB) => {
  const merged = new Map(mapA);

  for (const [key, personB] of mapB) {
    if (!merged.has(key)) {
      merged.set(key, { ...personB });
    } else {
      const existing = merged.get(key);
      existing.movies   = [...(existing.movies   ?? []), ...(personB.movies   ?? [])];
      existing.tvShows  = [...(existing.tvShows  ?? []), ...(personB.tvShows  ?? [])];
      if (personB.type === 'director') existing.type = 'director';
      // Ưu tiên giữ thông tin phong phú hơn (có profileUrl, biography...)
      if (!existing.profileUrl && personB.profileUrl) existing.profileUrl = personB.profileUrl;
      if (!existing.biography  && personB.biography)  existing.biography  = personB.biography;
      if (!existing.birthday   && personB.birthday)   existing.birthday   = personB.birthday;
      if (!existing.placeOfBirth && personB.placeOfBirth) existing.placeOfBirth = personB.placeOfBirth;
    }
  }

  return merged;
};

// ── PersonCard ────────────────────────────────────────────────────────────────
const PersonCard = ({ person, index, onClick }) => {
  const [imgErr, setImgErr] = useState(false);
  const isDirector  = person.type === 'director';
  const totalWorks  = (person.movies?.length ?? 0) + (person.tvShows?.length ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02 }}
      onClick={() => onClick(person)}
      style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = T.shadow}
    >
      {/* Photo */}
      <div style={{ aspectRatio: '2/3', background: T.bg, overflow: 'hidden', position: 'relative' }}>
        {person.profileUrl && !imgErr ? (
          <img src={person.profileUrl} alt={person.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }}
            onError={() => setImgErr(true)} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={36} color={T.textMuted} strokeWidth={1.2} />
          </div>
        )}
        {/* Role badge */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          padding: '3px 8px', borderRadius: 5,
          background: isDirector ? T.accent : T.surface,
          boxShadow: T.shadow,
          fontFamily: FONT, fontSize: 9.5, fontWeight: 700,
          color: isDirector ? 'white' : T.textSub,
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          {isDirector ? 'Đạo diễn' : 'Diễn viên'}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 12px 14px' }}>
        <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {person.name}
        </p>
        <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>
          {totalWorks} tác phẩm
        </p>
      </div>
    </motion.div>
  );
};

// ── WorksSection (dùng chung cho movies & tvshows) ───────────────────────────
const WorksSection = ({ items, icon: Icon, label, color }) => {
  if (!items?.length) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Icon size={11} color={color ?? T.textMuted} />
        {items.length} {label}
      </p>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {items.slice(0, 8).map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 7, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
            {item.posterUrl && (
              <img src={item.posterUrl} alt="" style={{ width: 18, height: 25, borderRadius: 3, objectFit: 'cover' }} />
            )}
            <span style={{ fontFamily: FONT, fontSize: 12, color: T.textSub, whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.title}
            </span>
          </div>
        ))}
        {items.length > 8 && (
          <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, alignSelf: 'center' }}>
            +{items.length - 8} khác
          </span>
        )}
      </div>
    </div>
  );
};

// ── PersonDetail ──────────────────────────────────────────────────────────────
const PersonDetail = ({ person }) => {
  const [imgErr, setImgErr] = useState(false);
  if (!person) return null;
  const isDirector = person.type === 'director';

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', fontFamily: FONT }}>
      {/* Photo */}
      <div style={{ width: 160, flexShrink: 0, borderRadius: 12, overflow: 'hidden', background: T.bg, border: `1px solid ${T.border}` }}>
        {person.profileUrl && !imgErr ? (
          <img src={person.profileUrl} alt={person.name}
            style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }}
            onError={() => setImgErr(true)} />
        ) : (
          <div style={{ width: '100%', aspectRatio: '2/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={48} color={T.textMuted} strokeWidth={1} />
          </div>
        )}
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name & role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <h2 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.02em' }}>
            {person.name}
          </h2>
          <span style={{
            fontFamily: FONT, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
            background: isDirector ? T.accentLight : T.bg,
            border: `1px solid ${isDirector ? `${T.accent}30` : T.border}`,
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

        {/* Movies */}
        <WorksSection
          items={person.movies}
          icon={Film}
          label="phim điện ảnh"
          color={T.accent}
        />

        {/* TV Shows */}
        <WorksSection
          items={person.tvShows}
          icon={Tv}
          label="TV show"
          color="#2563EB"
        />
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
        const merged = mergePersonMaps(movieMap, tvMap);
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

  return (
    <div style={{ padding: '28px 32px 56px', maxWidth: 1200, fontFamily: FONT }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 3 }}>Quản lý</p>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>
          Diễn viên & Đạo diễn
          <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 500, color: T.textMuted, letterSpacing: 0 }}>({filtered.length})</span>
        </h2>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={15} color={T.textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            placeholder="Tìm theo tên..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', height: 40, padding: '0 14px 0 38px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, fontFamily: FONT, fontSize: 13.5, color: T.text, outline: 'none' }}
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{ height: 40, padding: '0 14px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, color: typeFilter ? T.text : T.textMuted, fontFamily: FONT, fontSize: 13.5, outline: 'none', cursor: 'pointer', minWidth: 140 }}
        >
          <option value="">Tất cả</option>
          <option value="cast">Diễn viên</option>
          <option value="director">Đạo diễn</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ padding: '80px 0', textAlign: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: `2.5px solid ${T.accentLight}`, borderTopColor: T.accent, animation: 'spin 0.75s linear infinite', margin: '0 auto 12px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Đang tải dữ liệu…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '80px 0', textAlign: 'center' }}>
          <User size={32} color={T.textMuted} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Không tìm thấy kết quả</p>
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
          <Pagination {...pagination.props} itemLabel="người" />
        </>
      )}

      {/* Detail modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Chi tiết" size="xl" showCloseBtn>
        <PersonDetail person={selected} />
      </Modal>
    </div>
  );
}