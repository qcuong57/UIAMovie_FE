// src/components/search/SearchTabs.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { C, FONT_BODY } from '../../context/homeTokens';

export default function SearchTabs({
  tab, onTabChange,
  totalMovies, totalActors,
  filterCount, showFilter, onToggleFilter,
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, marginBottom: 20,
      }}
    >
      {/* Tab pills */}
      <div style={{
        display: 'flex', gap: 2,
        background: C.surfaceMid,
        borderRadius: 3,
        padding: 3,
        border: `1px solid ${C.border}`,
      }}>
        {[
          { key: 'movies', label: 'Phim',      count: totalMovies  },
          { key: 'actors', label: 'Diễn viên', count: totalActors  },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 20px', borderRadius: 2,
              border: 'none', cursor: 'pointer',
              fontFamily: FONT_BODY, fontSize: 13, fontWeight: tab === key ? 600 : 400,
              background: tab === key ? C.accent : 'transparent',
              color: tab === key ? '#fff' : C.textSub,
              transition: 'all 0.18s',
              letterSpacing: '0.02em',
            }}
          >
            {label}
            {count > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                padding: '1px 7px', borderRadius: 10,
                background: tab === key ? 'rgba(255,255,255,0.2)' : C.surfaceHigh,
                color: tab === key ? '#fff' : C.textDim,
              }}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filter toggle — chỉ hiện ở tab phim */}
      {tab === 'movies' && (
        <button
          onClick={onToggleFilter}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 18px', borderRadius: 3,
            border: `1px solid ${showFilter || filterCount > 0 ? C.accentGlow : C.border}`,
            background: showFilter || filterCount > 0 ? C.accentSoft : 'transparent',
            cursor: 'pointer',
            color: filterCount > 0 ? C.accent : C.textSub,
            fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500,
            transition: 'all 0.18s',
            letterSpacing: '0.02em',
          }}
        >
          Bộ lọc
          {filterCount > 0 && (
            <span style={{
              background: C.accent, color: '#fff',
              fontSize: 10, fontWeight: 800,
              padding: '1px 6px', borderRadius: 10,
            }}>
              {filterCount}
            </span>
          )}
        </button>
      )}
    </motion.div>
  );
}