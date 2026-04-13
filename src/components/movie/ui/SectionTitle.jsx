import React from 'react';
import { C } from './movieConstants';

const SectionTitle = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
    <div style={{ width: 3, height: 20, borderRadius: 2, background: C.accent, flexShrink: 0 }} />
    <h2 style={{
      fontFamily: "'Be Vietnam Pro', sans-serif",
      fontSize: 20, fontWeight: 800, color: C.text,
      letterSpacing: '0.03em', textTransform: 'uppercase', margin: 0,
    }}>
      {children}
    </h2>
  </div>
);

export default SectionTitle;