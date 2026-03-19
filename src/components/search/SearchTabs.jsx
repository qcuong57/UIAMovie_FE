// src/components/search/SearchTabs.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Film, Users, SlidersHorizontal } from 'lucide-react';
import { C, FONT_BODY } from './searchConstants';

export default function SearchTabs({
  tab, onTabChange,
  totalMovies, totalActors,
  filterCount, showFilter, onToggleFilter,
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.12 }}
      style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, marginBottom: 20,
      }}
    >
      {/* Tab pills */}
      <div style={{
        display: 'flex', gap: 4,
        background: C.surfaceMid, borderRadius: 10, padding: 4,
      }}>
        {[
          { key: 'movies', label: 'Phim',      Icon: Film,  count: totalMovies  },
          { key: 'actors', label: 'Diễn viên', Icon: Users, count: totalActors  },
        ].map(({ key, label, Icon, count }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 7,
              border: 'none', cursor: 'pointer',
              fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700,
              background: tab === key ? C.accent : 'none',
              color: tab === key ? '#fff' : C.textSub,
              transition: 'all 0.18s',
            }}
          >
            <Icon size={13} />
            {label}
            {count > 0 && (
              <span style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 10,
                background: tab === key ? 'rgba(255,255,255,0.25)' : C.surfaceHigh,
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
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 16px', borderRadius: 8,
            border: `1px solid ${showFilter || filterCount > 0 ? C.accentGlow : C.border}`,
            background: showFilter || filterCount > 0 ? C.accentSoft : C.surfaceMid,
            cursor: 'pointer',
            color: filterCount > 0 ? C.accent : C.textSub,
            fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600,
            transition: 'all 0.18s',
          }}
        >
          <SlidersHorizontal size={14} />
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