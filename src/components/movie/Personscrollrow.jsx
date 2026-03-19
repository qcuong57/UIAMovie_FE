// src/components/movie/PersonScrollRow.jsx
// Component scroll ngang cho diễn viên / đạo diễn — dùng chung ở mọi trang
import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

// ── Design tokens — khớp với MovieInfoPage & MovieDetailPage ──────────────────
const C = {
  card:        '#141414',
  border:      'rgba(255,255,255,0.07)',
  surfaceMid:  '#181818',
  text:        '#f0f2f8',
  textSub:     '#9299a8',
  textDim:     '#525868',
  accent:      '#e5181e',
};

// ── CastCard ──────────────────────────────────────────────────────────────────
const CastCard = ({ person, index }) => {
  const [imgErr, setImgErr] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.28 }}
      whileHover={{ y: -6, transition: { duration: 0.18 } }}
      style={{
        width: 120,
        flexShrink: 0,
        borderRadius: 10,
        overflow: 'hidden',
        background: C.card,
        border: `1px solid ${C.border}`,
        cursor: 'pointer',
        boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
      }}
    >
      {/* Avatar 2:3 */}
      <div style={{ width: '100%', aspectRatio: '2/3', background: C.surfaceMid, overflow: 'hidden', position: 'relative' }}>
        {person.profileUrl && !imgErr ? (
          <img
            src={person.profileUrl}
            alt={person.name}
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" fill="#2e2e2e"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#2e2e2e" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 10px 12px' }}>
        <p style={{
          fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700,
          color: C.text, lineHeight: 1.35, marginBottom: 3,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {person.name || '—'}
        </p>
        {person.character && (
          <p style={{
            fontFamily: "'Nunito', sans-serif", fontSize: 11,
            color: C.textSub, fontStyle: 'italic',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4,
          }}>
            {person.character}
          </p>
        )}
        {person.role && (
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.accent, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {person.role}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// ── PersonScrollRow ───────────────────────────────────────────────────────────
/**
 * Props:
 *   people   — array of { name, character?, role?, profileUrl? }
 *   cardWidth — optional override (default 120)
 */
const PersonScrollRow = ({ people = [], cardWidth = 120 }) => {
  const scrollRef = useRef(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [people]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.7 : el.clientWidth * 0.7, behavior: 'smooth' });
  };

  if (!people.length) return null;

  return (
    <div className="group/scroll" style={{ position: 'relative' }}>

      {/* Left fade */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 48, zIndex: 10,
        background: 'linear-gradient(to right, #000 0%, transparent 100%)',
        opacity: canLeft ? 1 : 0, pointerEvents: 'none',
        transition: 'opacity 0.2s',
      }} />

      {/* Left arrow */}
      {canLeft && (
        <button
          onClick={() => scroll('left')}
          style={{
            position: 'absolute', left: 4, top: '40%', transform: 'translateY(-50%)',
            zIndex: 20, width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(10,10,12,0.9)', border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#e8eaf0',
          }}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
      )}

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          overflowY: 'visible',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingTop: 8,
          paddingBottom: 12,
          paddingLeft: 2,
          paddingRight: 2,
        }}
      >
        <style>{`.psr-row::-webkit-scrollbar{display:none}`}</style>
        {people.map((p, i) => (
          <CastCard key={i} person={p} index={i} />
        ))}
      </div>

      {/* Right fade */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 48, zIndex: 10,
        background: 'linear-gradient(to left, #000 0%, transparent 100%)',
        opacity: canRight ? 1 : 0, pointerEvents: 'none',
        transition: 'opacity 0.2s',
      }} />

      {/* Right arrow */}
      {canRight && (
        <button
          onClick={() => scroll('right')}
          style={{
            position: 'absolute', right: 4, top: '40%', transform: 'translateY(-50%)',
            zIndex: 20, width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(10,10,12,0.9)', border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#e8eaf0',
          }}
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default PersonScrollRow;
export { CastCard };