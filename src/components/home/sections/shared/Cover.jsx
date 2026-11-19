// src/components/home/sections/shared/Cover.jsx
// Ảnh phủ kín khung; không có ảnh thì hiện tên phim.
import React from 'react';
import { C, FONT_BODY } from '../../../../context/homeTokens';

const Cover = ({ item, src, style }) =>
  src ? (
    <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }} />
  ) : (
    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', padding: 8, textAlign: 'center', color: C.textSub, fontFamily: FONT_BODY, fontSize: 12, ...style }}>
      {item.title}
    </div>
  );

export default Cover;
