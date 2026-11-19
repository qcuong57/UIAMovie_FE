// src/components/home/sections/layouts/RankedSection.jsx
// ranked: số thứ hạng lớn kiểu Top 10. Tái dùng TopRankedRow, truyền `items` để GIỮ đúng thứ tự admin sắp.
import React from 'react';
import TopRankedRow from '../../TopRankedRow';

export function RankedSection({ section }) {
  return <TopRankedRow title={section.title} items={section.items} />;
}
