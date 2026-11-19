// src/components/home/sections/layouts/CarouselSection.jsx
// carousel: hàng cuộn ngang quen thuộc, tái dùng MovieRow.
import React from 'react';
import MovieRow from '../../MovieRow';

export function CarouselSection({ section }) {
  return (
    <MovieRow
      title={section.title}
      subtitle={section.subtitle}
      items={section.items}
      accentColor={section.config?.accent || undefined}
    />
  );
}
