// src/components/home/sections/shared/PagerButtons.jsx
// Cặp nút tròn trước / sau: y hệt CountryMovieRows.
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PagerButtons({ canPrev, canNext, onPrev, onNext }) {
  const items = [
    { key: 'p', can: canPrev, onClick: onPrev, icon: <ChevronLeft size={16} strokeWidth={2} />, label: 'Trang trước' },
    { key: 'n', can: canNext, onClick: onNext, icon: <ChevronRight size={16} strokeWidth={2} />, label: 'Trang sau' },
  ];
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {items.map(({ key, can, onClick, icon, label }) => (
        <button
          key={key} type="button" aria-label={label} disabled={!can} onClick={() => can && onClick()}
          style={{
            width: 34, height: 34, borderRadius: '50%', background: 'rgba(12,12,12,0.88)',
            border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', color: '#fff',
            cursor: can ? 'pointer' : 'default', opacity: can ? 1 : 0.22,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity .2s, transform .15s',
          }}
          onMouseEnter={(e) => can && (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
