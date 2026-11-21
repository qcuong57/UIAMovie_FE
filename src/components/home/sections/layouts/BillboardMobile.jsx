// src/components/home/sections/layouts/BillboardMobile.jsx
// Bản MOBILE của billboard (BillboardSection tự chọn theo useIsMobile): "phòng chiếu" xoay vòng tối đa 5 phim,
// tự phát trailer phim đang chọn, vuốt ngang để đổi phim. Giao diện + logic dùng chung với TrailerSection (shared/TrailerRoom).
import React from 'react';
import TrailerRoom from '../shared/TrailerRoom';

export function BillboardMobile({ section }) {
  return <TrailerRoom section={section} maxItems={5} trailerMs={45000} label="NỔI BẬT" swipeable bleed clampDescription />;
}