// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Film, Tag, Star, TrendingUp, Clock, Users } from 'lucide-react';
import movieService from '../../services/movieService';
import genreService from '../../services/genreService';
import axiosInstance from '../../config/axios';
import { C, FONT_DISPLAY, FONT_BODY } from '../../context/homeTokens';

const StatCard = ({ icon: Icon, label, value, sub, accent, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.07, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    style={{
      background: '#0d0d0d',
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* Glow */}
    <div style={{
      position: 'absolute', top: 0, right: 0,
      width: 100, height: 100,
      background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
      pointerEvents: 'none',
    }} />

    <div style={{
      width: 36, height: 36, borderRadius: 8,
      background: `${accent}18`,
      border: `1px solid ${accent}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={17} color={accent} strokeWidth={2} />
    </div>

    <div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 900, color: 'white', lineHeight: 1 }}>
        {value ?? '—'}
      </p>
      {sub && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
          {sub}
        </p>
      )}
    </div>
  </motion.div>
);

const RecentMovieRow = ({ movie, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.3 + index * 0.05 }}
    style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '10px 0',
      borderBottom: `1px solid ${C.border}`,
    }}
  >
    {/* Poster */}
    <div style={{
      width: 36, height: 52, borderRadius: 6, overflow: 'hidden',
      background: '#1a1a1a', flexShrink: 0,
    }}>
      {movie.posterUrl && (
        <img src={movie.posterUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {movie.title}
      </p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {movie.rating && (
          <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: '#f5c518', fontWeight: 700 }}>
            ★ {movie.rating.toFixed(1)}
          </span>
        )}
        {movie.year && (
          <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            {movie.year}
          </span>
        )}
        {movie.originCountry && (
          <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: 'rgba(255,255,255,0.3)', padding: '1px 6px', borderRadius: 4, border: `1px solid ${C.border}` }}>
            {movie.originCountry}
          </span>
        )}
      </div>
    </div>
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 160 }}>
      {movie.genres?.slice(0, 2).map(g => (
        <span key={g} style={{
          fontFamily: FONT_BODY, fontSize: 10, color: 'rgba(255,255,255,0.4)',
          padding: '2px 7px', borderRadius: 4, border: `1px solid ${C.border}`,
        }}>{g}</span>
      ))}
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const [stats,   setStats]   = useState({ movies: null, genres: null, users: null });
  const [recent,  setRecent]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      movieService.getMovies(1, 200),
      genreService.getAllGenres(),
      axiosInstance.get('/user?pageNumber=1&pageSize=1').catch(() => null),
    ]).then(([movRes, genRes, userRes]) => {
      const movies = (() => {
        const r = movRes;
        if (Array.isArray(r)) return r;
        return r?.items ?? r?.movies ?? r?.data?.items ?? r?.data ?? [];
      })();
      const genres = Array.isArray(genRes) ? genRes : genRes?.data ?? genRes?.genres ?? [];
      const totalUsers = userRes?.totalCount ?? userRes?.data?.totalCount ?? null;

      setStats({ movies: movies.length, genres: genres.length, users: totalUsers });
      setRecent(
        [...movies]
          .sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0))
          .slice(0, 8)
          .map(m => ({
            ...m,
            year: m.releaseDate ? new Date(m.releaseDate).getFullYear() : m.year,
          }))
      );
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const STATS = [
    { icon: Film,       label: 'Tổng phim',    value: stats.movies,  sub: 'trong database',  accent: '#7eaee8' },
    { icon: Tag,        label: 'Thể loại',      value: stats.genres,  sub: 'đang hoạt động', accent: '#e8c97e' },
    { icon: TrendingUp, label: 'Đang trending', value: 20,            sub: 'top rated',       accent: '#e87e7e' },
    { icon: Users,      label: 'Người dùng',    value: stats.users,   sub: 'đã đăng ký',     accent: '#c47ee8' },
  ];

  return (
    <div style={{ padding: '36px 40px 64px', maxWidth: 1200 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
          Tổng quan hệ thống
        </p>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 900, color: 'white', margin: 0 }}>
          Dashboard
        </h1>
      </motion.div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 40 }}>
        {STATS.map((s, i) => (
          <StatCard key={s.label} {...s} index={i} />
        ))}
      </div>

      {/* Recent movies */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        style={{
          background: '#0d0d0d',
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: '24px 28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={15} color="rgba(255,255,255,0.3)" />
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: 'white' }}>
              Phim mới nhất
            </p>
          </div>
          <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
            {recent.length} phim gần đây
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${C.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          recent.map((m, i) => <RecentMovieRow key={m.id} movie={m} index={i} />)
        )}
      </motion.div>
    </div>
  );
}