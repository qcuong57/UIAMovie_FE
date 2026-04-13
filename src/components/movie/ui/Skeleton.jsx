// src/components/movie/shared/Skeleton.jsx
import React from 'react';

const Skeleton = ({ w = '100%', h = 16, r = 6, style = {} }) => (
  <div style={{
    width: w, height: h, borderRadius: r,
    background: 'linear-gradient(90deg, #1a1a1a 25%, #242424 50%, #1a1a1a 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
    ...style,
  }} />
);

export default Skeleton;