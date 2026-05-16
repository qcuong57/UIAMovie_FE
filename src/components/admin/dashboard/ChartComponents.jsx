// src/components/admin/dashboard/ChartComponents.jsx
import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { T, FONT_BODY as FONT, FONT_TITLE } from '../../../context/adminTokens';

// ── Unified Dark Tooltip ───────────────────────────────────────────────────────
export const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.text, borderRadius: 10, padding: '10px 14px',
      boxShadow: T.shadowLg, fontFamily: FONT, minWidth: 130,
    }}>
      <p style={{
        fontSize: 11, color: 'rgba(255,255,255,0.5)',
        marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em',
      }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, marginBottom: 3 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{p.name}</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Genre / Segment Donut ──────────────────────────────────────────────────────
export const GenreDonut = ({ slices }) => (
  <div style={{ paddingTop: 8 }}>
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
      <PieChart width={120} height={120}>
        <Pie
          data={slices} dataKey="value"
          cx={55} cy={55}
          innerRadius={36} outerRadius={52}
          strokeWidth={2} stroke={T.surface}
        >
          {slices.map(d => (
            <Cell key={d.label} fill={d.color} fillOpacity={0.88} />
          ))}
        </Pie>
      </PieChart>
    </div>
    {slices.map(d => (
      <div key={d.label} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 0', borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
          <span style={{ fontFamily: FONT, fontSize: 12, color: T.textSub }}>{d.label}</span>
        </div>
        <span style={{ fontFamily: FONT_TITLE, fontSize: 13, fontWeight: 700, color: T.text }}>
          {d.value}
        </span>
      </div>
    ))}
  </div>
);

// ── Star Display ───────────────────────────────────────────────────────────────
export const StarDisplay = ({ rating, max = 5, size = 11 }) => {
  const full = Math.floor(rating ?? 0);
  const half = (rating ?? 0) - full >= 0.5;
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{
          fontSize: size,
          color:   i < full ? '#F59E0B' : (i === full && half) ? '#F59E0B' : '#D1D5DB',
          opacity: i < full ? 1         : (i === full && half) ? 0.6       : 0.3,
        }}>★</span>
      ))}
    </span>
  );
};