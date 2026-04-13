// src/components/movie/shared/StarRating.jsx
import React from 'react';
import { Star } from 'lucide-react';
import { C } from './movieConstants';

const StarRating = ({ score, votes }) => {
  const pct = ((score || 0) / 10) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Circular score */}
      <div style={{ position: 'relative', width: 54, height: 54, flexShrink: 0 }}>
        <svg width="54" height="54" viewBox="0 0 54 54" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="27" cy="27" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
          <circle cx="27" cy="27" r="22" fill="none" stroke={C.gold} strokeWidth="3.5"
            strokeDasharray={`${2 * Math.PI * 22}`}
            strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
            strokeLinecap="round"
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 15, fontWeight: 800, color: C.gold, letterSpacing: '-0.02em' }}>
            {score ? score.toFixed(1) : '—'}
          </span>
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} size={11}
              style={{
                color: i <= Math.round((score || 0) / 2) ? C.gold : 'rgba(255,255,255,0.15)',
                fill:  i <= Math.round((score || 0) / 2) ? C.gold : 'none',
              }}
            />
          ))}
        </div>
        {votes && (
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.textDim }}>
            {votes.toLocaleString()} đánh giá
          </p>
        )}
      </div>
    </div>
  );
};

export default StarRating;