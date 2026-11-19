// src/components/home/sections/layouts/UpcomingLayout.jsx
// upcoming: thẻ backdrop + đếm ngược ngày khởi chiếu (tái dùng UpcomingSection của trang chủ).
import React from 'react';
import UpcomingSectionBase from '../../UpcomingSection';

export function UpcomingLayout({ section }) {
  return <UpcomingSectionBase title={section.title} items={section.items} />;
}
