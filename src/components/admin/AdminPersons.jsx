// src/components/admin/AdminPersons.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User, Calendar, MapPin, Film } from 'lucide-react';
import { Input, Spinner, Modal } from '../ui';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../common/Pagination';
import axiosInstance from '../../config/axios';
import { C, FONT_DISPLAY, FONT_BODY } from '../../context/homeTokens';

const PAGE_SIZE = 20;

// Lấy danh sách phim → fetch detail từng phim (có cast + directorDetail)
// Batch 10 request cùng lúc để tránh quá tải
const fetchPersonsFromMovies = async () => {
  // Bước 1: lấy danh sách ID phim
  const listRes = await axiosInstance.get('/movies?pageSize=500');
  const movies = Array.isArray(listRes) ? listRes
    : listRes?.items ?? listRes?.movies ?? listRes?.data?.items ?? listRes?.data ?? [];

  if (movies.length === 0) return [];

  // Bước 2: fetch detail từng phim theo batch 10
  const BATCH = 10;
  const details = [];
  for (let i = 0; i < movies.length; i += BATCH) {
    const batch = movies.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(m => axiosInstance.get(`/movies/${m.id}`))
    );
    for (const r of results) {
      if (r.status === 'fulfilled') {
        const d = r.value?.data ?? r.value;
        if (d) details.push(d);
      }
    }
  }

  // Bước 3: tổng hợp person từ cast + directorDetail
  const personMap = new Map();

  const upsert = (key, data, type, movie) => {
    if (!personMap.has(key)) {
      personMap.set(key, { ...data, movies: [], type });
    }
    const entry = personMap.get(key);
    entry.movies.push({ id: movie.id, title: movie.title, posterUrl: movie.posterUrl });
    // Cập nhật type nếu là đạo diễn (ưu tiên hơn)
    if (type === 'director') entry.type = 'director';
  };

  for (const m of details) {
    // Cast
    if (Array.isArray(m.cast)) {
      for (const c of m.cast) {
        const key = c.tmdbPersonId ?? c.name;
        upsert(key, c, 'cast', m);
      }
    }
    // Director
    if (m.directorDetail) {
      const d = m.directorDetail;
      const key = d.tmdbPersonId ?? d.name;
      upsert(key, d, 'director', m);
    }
    // Director name only fallback
    else if (m.director) {
      const key = m.director;
      upsert(key, { name: m.director, profileUrl: null }, 'director', m);
    }
  }

  return Array.from(personMap.values())
    .filter(p => p.name)
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'vi'));
};

const PersonCard = ({ person, onClick }) => {
  const [imgErr, setImgErr] = useState(false);
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(person)}
      style={{
        background: '#0d0d0d',
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {/* Photo */}
      <div style={{ aspectRatio: '2/3', background: '#1a1a1a', overflow: 'hidden', position: 'relative' }}>
        {person.profileUrl && !imgErr ? (
          <img src={person.profileUrl} alt={person.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={40} color="rgba(255,255,255,0.1)" />
          </div>
        )}
        {/* Type badge */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          padding: '2px 8px', borderRadius: 4,
          background: person.type === 'director' ? 'rgba(229,24,30,0.85)' : 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          fontFamily: FONT_BODY, fontSize: 9, fontWeight: 700,
          color: 'white', letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {person.type === 'director' ? 'Đạo diễn' : 'Diễn viên'}
        </div>
      </div>
      {/* Info */}
      <div style={{ padding: '12px 12px 14px' }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {person.name}
        </p>
        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          {person.movies?.length ?? 0} phim
        </p>
      </div>
    </motion.div>
  );
};

const PersonDetail = ({ person, onClose }) => {
  const [imgErr, setImgErr] = useState(false);
  if (!person) return null;
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* Photo */}
      <div style={{ width: 160, flexShrink: 0, borderRadius: 10, overflow: 'hidden', background: '#1a1a1a' }}>
        {person.profileUrl && !imgErr ? (
          <img src={person.profileUrl} alt={person.name}
            style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div style={{ width: '100%', aspectRatio: '2/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={48} color="rgba(255,255,255,0.1)" />
          </div>
        )}
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 900, color: 'white', margin: 0 }}>
            {person.name}
          </h2>
          <span style={{
            fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
            background: person.type === 'director' ? 'rgba(229,24,30,0.15)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${person.type === 'director' ? 'rgba(229,24,30,0.3)' : C.border}`,
            color: person.type === 'director' ? C.accent : 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {person.type === 'director' ? 'Đạo diễn' : 'Diễn viên'}
          </span>
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {person.birthday && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Calendar size={13} color="rgba(255,255,255,0.3)" />
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                {new Date(person.birthday).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          )}
          {person.placeOfBirth && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <MapPin size={13} color="rgba(255,255,255,0.3)" />
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{person.placeOfBirth}</span>
            </div>
          )}
          {person.tmdbPersonId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>TMDB ID: #{person.tmdbPersonId}</span>
            </div>
          )}
        </div>

        {/* Biography */}
        {person.biography && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Tiểu sử
            </p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxHeight: 140, overflowY: 'auto' }}>
              {person.biography}
            </p>
          </div>
        )}

        {/* Movies */}
        {person.movies?.length > 0 && (
          <div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              <Film size={11} style={{ display: 'inline', marginRight: 5 }} />
              {person.movies.length} phim
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {person.movies.slice(0, 8).map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}` }}>
                  {m.posterUrl && <img src={m.posterUrl} alt="" style={{ width: 20, height: 28, borderRadius: 3, objectFit: 'cover' }} />}
                  <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.title}
                  </span>
                </div>
              ))}
              {person.movies.length > 8 && (
                <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.25)', alignSelf: 'center' }}>
                  +{person.movies.length - 8} phim khác
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AdminPersons() {
  const [allPersons, setAllPersons] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [loadMsg,    setLoadMsg]    = useState('Đang tải danh sách phim...');
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selected,   setSelected]   = useState(null);

  useEffect(() => {
    setLoadMsg('Đang tải danh sách phim...');
    fetchPersonsFromMovies()
      .then(persons => {
        setAllPersons(persons);
        setLoadMsg('');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = allPersons.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q);
    const matchType   = !typeFilter || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const pagination = usePagination({ total: filtered.length, pageSize: PAGE_SIZE });
  const pagePersons = pagination.paginate(filtered);

  return (
    <div style={{ padding: '36px 40px 64px', maxWidth: 1300 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Quản lý</p>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 900, color: 'white', margin: 0 }}>
          Diễn viên & Đạo diễn ({filtered.length})
        </h1>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <Input type="search" placeholder="Tìm theo tên..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{
          height: 42, padding: '0 12px', borderRadius: 8,
          background: '#111', border: `1px solid ${C.border}`,
          color: typeFilter ? 'white' : 'rgba(255,255,255,0.35)',
          fontFamily: FONT_BODY, fontSize: 13, outline: 'none', cursor: 'pointer',
        }}>
          <option value="">Tất cả</option>
          <option value="cast" style={{ background: '#111' }}>Diễn viên</option>
          <option value="director" style={{ background: '#111' }}>Đạo diễn</option>
        </select>
      </div>

      {loading ? (
        <div style={{ padding: '64px 0', textAlign: 'center' }}>
          <Spinner size="md" color="red" />
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 16 }}>
            {loadMsg}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
            <AnimatePresence>
              {pagePersons.map((p, i) => (
                <motion.div key={p.tmdbPersonId ?? p.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <PersonCard person={p} onClick={setSelected} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          <Pagination {...pagination.props} itemLabel="người" />
        </>
      )}

      {/* Detail modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="" size="xl" showCloseBtn>
        <PersonDetail person={selected} onClose={() => setSelected(null)} />
      </Modal>
    </div>
  );
}