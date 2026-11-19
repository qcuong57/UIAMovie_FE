// src/components/home/sections/HomeSections.jsx
// Đọc /api/home-sections rồi render từng khối theo REGISTRY layout. KHÔNG hard code nội dung:
// admin đổi tên / phim / thứ tự / kiểu bố trí ở trang quản trị là trang chủ đổi theo.
//
// Cấu trúc thư mục:
//   HomeSections.jsx   ← file này: registry key → component
//   layouts/           ← MỖI LAYOUT MỘT FILE (tên file = tên layout)
//   shared/            ← phần dùng chung: SectionHeading, Cover, Badges, TrailerPlayer, LayoutStyles, layoutUtils
//
// Thêm layout mới:
//   1. Tạo layouts/TenLayoutSection.jsx (nhận { section }, dùng đồ trong shared/)
//   2. Đăng ký 1 dòng vào HOME_LAYOUTS bên dưới
//   3. Thêm key vào HomeSectionConstants.Layouts (BE) và LAYOUT_INFO + LayoutThumb trong AdminHomeSections.jsx
import React from 'react';
import HomeReveal from '../../../motion-configs/HomeReveal';
import { useHomeSections } from '../../../hooks/useHomeSections';
import { CarouselSection } from './layouts/CarouselSection';
import { GridSection } from './layouts/GridSection';
import { HeroSection } from './layouts/HeroSection';
import { RankedSection } from './layouts/RankedSection';
import { BannerSection } from './layouts/BannerSection';
import { UpcomingLayout } from './layouts/UpcomingLayout';
import { SpotlightSection } from './layouts/SpotlightSection';
import { MosaicSection } from './layouts/MosaicSection';
import { AccordionSection } from './layouts/AccordionSection';
import { ListSection } from './layouts/ListSection';
import { BillboardSection } from './layouts/BillboardSection';
import { TrailerSection } from './layouts/TrailerSection';
import { SplitSection } from './layouts/SplitSection';

// key (khớp HomeSectionConstants.Layouts ở BE) → component + kiểu hiệu ứng xuất hiện
export const HOME_LAYOUTS = {
  // hàng cuộn / lưới
  carousel:  { component: CarouselSection,  reveal: 'row' },
  grid:      { component: GridSection,      reveal: 'row' },
  list:      { component: ListSection,      reveal: 'row' },
  trailer:   { component: TrailerSection,   reveal: 'row' },
  // xếp hạng / sắp chiếu
  ranked:    { component: RankedSection,    reveal: 'feature' },
  upcoming:  { component: UpcomingLayout,   reveal: 'spotlight' },
  // banner / nổi bật
  banner:    { component: BannerSection,    reveal: 'spotlight' },
  hero:      { component: HeroSection,      reveal: 'spotlight' },
  spotlight: { component: SpotlightSection, reveal: 'spotlight' },
  mosaic:    { component: MosaicSection,    reveal: 'spotlight' },
  accordion: { component: AccordionSection, reveal: 'spotlight' },
  billboard: { component: BillboardSection, reveal: 'spotlight' },
  split:     { component: SplitSection,     reveal: 'spotlight' },
};

export default function HomeSections() {
  const { data } = useHomeSections();

  // Lỗi / chưa có khối nào → không hiện gì, trang chủ vẫn chạy bình thường với các phần có sẵn.
  if (!data?.length) return null;

  return data.map((section) => {
    if (!section.items.length) return null;
    // Layout lạ (FE cũ chưa biết) rơi về carousel thay vì làm vỡ trang
    const { component: Layout, reveal } = HOME_LAYOUTS[section.layout] ?? HOME_LAYOUTS.carousel;
    return (
      <HomeReveal key={section.id} variant={reveal} divider>
        <Layout section={section} />
      </HomeReveal>
    );
  });
}
