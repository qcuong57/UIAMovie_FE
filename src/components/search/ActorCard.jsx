// src/components/search/ActorCard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { C, FONT_BODY } from './searchConstants';

export default function ActorCard({ actor, index }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.28 }}
      whileHover={{ y: -5, transition: { duration: 0.18 } }}
      style={{
        borderRadius: 10, overflow: 'hidden',
        background: C.card, border: `1px solid ${C.border}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      {/* Photo */}
      <div style={{
        width: '100%', aspectRatio: '2/3',
        background: C.surfaceMid, overflow: 'hidden',
      }}>
        {actor.profileUrl && !imgErr ? (
          <img
            src={actor.profileUrl} alt={actor.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: C.surfaceMid,
          }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" fill="#2a2a2a" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                stroke="#2a2a2a" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 13px' }}>
        <p style={{
          fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700,
          color: C.text, marginBottom: 3,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {actor.name}
        </p>
        {actor.knownFor && (
          <p style={{
            fontFamily: FONT_BODY, fontSize: 11, color: C.textDim,
            fontStyle: 'italic',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {actor.knownFor}
          </p>
        )}
        {actor.movieCount != null && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textSub, marginTop: 4 }}>
            {actor.movieCount} phim
          </p>
        )}
      </div>
    </motion.div>
  );
}