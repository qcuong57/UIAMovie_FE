// src/components/search/SearchBar.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { C, FONT_BODY } from './searchConstants';

export default function SearchBar({ value, onChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      style={{ position: 'relative', marginBottom: 24 }}
    >
      <Search
        size={18}
        style={{
          position: 'absolute', left: 18, top: '50%',
          transform: 'translateY(-50%)',
          color: C.textDim, pointerEvents: 'none',
        }}
      />
      <input
        autoFocus
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Tìm phim, diễn viên, đạo diễn..."
        style={{
          width: '100%', padding: '16px 50px 16px 50px',
          background: C.surfaceMid, border: `1.5px solid ${C.borderBright}`,
          borderRadius: 12, color: C.text, outline: 'none',
          fontFamily: FONT_BODY, fontSize: 16,
          transition: 'border-color 0.2s',
        }}
        onFocus={e => e.target.style.borderColor = C.accent}
        onBlur={e  => e.target.style.borderColor = C.borderBright}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute', right: 16, top: '50%',
            transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.textDim, display: 'flex', alignItems: 'center', padding: 4,
          }}
        >
          <X size={16} />
        </button>
      )}
    </motion.div>
  );
}