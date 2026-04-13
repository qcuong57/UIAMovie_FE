// src/components/search/MovieCard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { C, FONT_BODY } from '../../context/homeTokens';

// Easing expo-out — giống hệt Netflix: bắt đầu nhanh, đáp xuống nhẹ
const NETFLIX_EASE = [0.22, 1, 0.36, 1];

export default function MovieCard({ movie, index }) {
  const navigate = useNavigate();
  const [imgErr, setImgErr]     = useState(false);
  const [hovered, setHovered]   = useState(false);
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : movie.year;

  return (
    /*
     * Kiến trúc 3 lớp — tách hoàn toàn, không xung đột:
     *   1. <div>          → giữ chỗ trong grid (kích thước luôn ổn định)
     *   2. <motion.div>   → chỉ lo entrance animation (scale + y + opacity)
     *   3. <div>          → chỉ lo hover effect (CSS transition transform)
     *
     * Trước đây gộp layer 2+3 vào 1 node → framer transform xung đột với
     * CSS hover transform → layout nhảy. Giờ tách ra → hết hoàn toàn.
     */
    <div>
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        transition={{
          delay:    Math.min(index * 0.04, 0.32),
          duration: 0.42,
          ease:     NETFLIX_EASE,
        }}
      >
        {/* ── Hover layer ── */}
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => navigate(`/movie/${movie.id}/info`)}
          style={{
            borderRadius: 10,
            overflow: 'hidden',
            cursor: 'pointer',
            background: C.card,
            border: `1px solid ${hovered ? 'rgba(229,24,30,0.35)' : C.border}`,
            boxShadow: hovered
              ? '0 8px 32px rgba(229,24,30,0.15)'
              : '0 4px 20px rgba(0,0,0,0.5)',
            transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
            transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.22s',
          }}
        >
          {/* Poster */}
          <div style={{
            width: '100%', aspectRatio: '2/3',
            background: C.surfaceMid, overflow: 'hidden', position: 'relative',
          }}>
            {movie.posterUrl && !imgErr ? (
              <img
                src={movie.posterUrl} alt={movie.title}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  transform: hovered ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 0.35s ease',
                }}
                onError={() => setImgErr(true)}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 36, background: C.surfaceMid,
              }}>
                🎬
              </div>
            )}

            {/* Rating badge */}
            {movie.rating > 0 && (
              <div style={{
                position: 'absolute', top: 8, right: 8,
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '3px 7px', borderRadius: 6,
                background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(245,197,24,0.3)',
              }}>
                <Star size={10} style={{ fill: C.gold, color: C.gold }} />
                <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: C.gold }}>
                  {Number(movie.rating).toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ padding: '10px 12px 13px' }}>
            <p style={{
              fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: C.text,
              lineHeight: 1.35, marginBottom: 4,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {movie.title}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {year && (
                <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim }}>
                  {year}
                </span>
              )}
              {movie.genres?.[0] && (
                <span style={{
                  fontFamily: FONT_BODY, fontSize: 10, color: C.accent,
                  background: C.accentSoft, padding: '1px 6px', borderRadius: 4,
                }}>
                  {movie.genres[0]}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}