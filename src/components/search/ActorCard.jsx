// src/components/search/ActorCard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { C, FONT_BODY } from './searchConstants';

const toSlug = (name) =>
  (name || 'unknown')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export default function ActorCard({ actor, index, onActorClick }) {
  const [imgErr, setImgErr] = useState(false);
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    if (onActorClick) {
      onActorClick(actor);
    } else if (actor.name) {
      navigate(`/person/${toSlug(actor.name)}`, { state: { actor } });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      style={{
        borderRadius: 12, overflow: 'hidden',
        background: C.card,
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.1)' : C.border}`,
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.7)' : '0 4px 16px rgba(0,0,0,0.4)',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
        cursor: actor.name ? 'pointer' : 'default',
      }}
    >
      {/* Photo */}
      <div style={{
        width: '100%', aspectRatio: '2/3',
        background: C.surfaceMid, overflow: 'hidden', position: 'relative',
      }}>
        {actor.profileUrl && !imgErr ? (
          <img
            src={actor.profileUrl} alt={actor.name}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              objectPosition: 'center 15%',
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 0.4s ease',
            }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(160deg, ${C.surfaceHigh}, ${C.surfaceMid})`,
          }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4.5" fill="#222" />
              <path d="M3.5 20.5c0-4.5 3.8-8 8.5-8s8.5 3.5 8.5 8"
                stroke="#222" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {/* Hover overlay */}
        {hovered && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)',
          }} />
        )}

        {/* Movie count badge */}
        {actor.movieCount != null && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)',
            borderRadius: 6, padding: '3px 8px',
            border: `1px solid rgba(255,255,255,0.08)`,
          }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
              {actor.movieCount} phim
            </span>
          </div>
        )}

        {/* "Xem trang" hint khi hover */}
        {hovered && actor.name && (
          <div style={{
            position: 'absolute', bottom: 8, left: 0, right: 0,
            display: 'flex', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700,
              color: 'rgba(255,255,255,0.9)',
              background: 'rgba(229,24,30,0.8)',
              padding: '3px 10px', borderRadius: 20,
              backdropFilter: 'blur(4px)',
            }}>
              Xem thông tin
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '11px 13px 14px' }}>
        <p style={{
          fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700,
          color: hovered && actor.name ? C.accent : C.text,
          marginBottom: 4, lineHeight: 1.3,
          transition: 'color 0.15s',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {actor.name}
        </p>
        {actor.knownFor && (
          <p style={{
            fontFamily: FONT_BODY, fontSize: 11, color: C.textDim,
            fontStyle: 'italic', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {actor.knownFor}
          </p>
        )}
      </div>
    </motion.div>
  );
}