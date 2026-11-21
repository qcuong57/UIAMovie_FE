// src/components/home/sections/layouts/TrailerSection.jsx
// trailer: "phòng chiếu" — khung video bo góc, bảng thông tin bên cạnh, dải thẻ đánh số bên dưới.
// Toàn bộ giao diện + logic nằm ở shared/TrailerRoom (dùng chung với billboard mobile).
import React from 'react';
import TrailerRoom from '../shared/TrailerRoom';

export function TrailerSection({ section }) {
  return <TrailerRoom section={section} maxItems={12} trailerMs={45000} label="TRAILER" />;
}