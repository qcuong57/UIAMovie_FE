// src/components/home/sections/layouts/ListSection.jsx
// list: danh sách dày thumbnail + thông tin, nhiều cột. config: columns (1-3), rows (3-6), numbered (bool).
// Chỉ bật numbered khi thứ tự do admin sắp thực sự là xếp hạng.
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { C, FONT_BODY, FONT_DISPLAY } from '../../../../context/homeTokens';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { contentPath } from '../../../../utils/normalizeHomeCard';
import LayoutStyles from '../shared/LayoutStyles';
import SectionHeading from '../shared/SectionHeading';
import Cover from '../shared/Cover';
import { Rating } from '../shared/Badges';
import { useRailMotion } from '../shared/motionPresets';
import { accentOf, keyOf, clamp, imgOf, metaOf } from '../shared/layoutUtils';

function ListRow({ item, rank, accent, isMobile, index, itemV, revealProps }) {
  return (
    <motion.div {...revealProps} custom={index} variants={itemV} style={{ minWidth: 0 }}>
    <Link
      to={contentPath(item)} aria-label={item.title} className="hsl-link hsl-row"
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 10px', borderRadius: 8, textDecoration: 'none', minWidth: 0, '--hsl-accent': accent }}
    >
      {rank != null && (
        <span style={{ flex: '0 0 26px', textAlign: 'center', fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 800, color: rank <= 3 ? accent : C.textSub }}>
          {rank}
        </span>
      )}
      <div style={{ position: 'relative', flex: `0 0 ${isMobile ? 112 : 132}px`, aspectRatio: '16 / 9', borderRadius: 4, overflow: 'hidden', background: C.surfaceHigh }}>
        <Cover item={item} src={imgOf(item)} />
        {item.isPremium && (
          <span aria-label="Premium" style={{ position: 'absolute', top: 4, left: 4, display: 'grid', placeItems: 'center', width: 18, height: 18, borderRadius: 3, background: C.gold, color: '#1a1200' }}>
            <Crown size={10} />
          </span>
        )}
      </div>
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p title={item.title} style={{ margin: 0, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.title}
        </p>
        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT_BODY, fontSize: 12, color: C.textSub, minWidth: 0 }}>
          <Rating value={item.rating} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{metaOf(item, 2)}</span>
        </p>
      </div>
    </Link>
    </motion.div>
  );
}

export function ListSection({ section }) {
  const isMobile = useIsMobile();
  const accent = accentOf(section);
  const { itemV, revealProps } = useRailMotion();
  const cols = isMobile ? 1 : clamp(Number(section.config?.columns) || 2, 1, 3);
  const rows = clamp(Number(section.config?.rows) || 4, 3, 6);
  const numbered = Boolean(section.config?.numbered);
  const visible = section.items.slice(0, isMobile ? rows * 2 : cols * rows);
  const rowCount = Math.ceil(visible.length / cols);

  return (
    <section style={{ marginBottom: isMobile ? 32 : 44 }}>
      <LayoutStyles />
      <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile} />
      <div
        style={{
          display: 'grid', gridAutoFlow: 'column', gridTemplateRows: `repeat(${rowCount}, auto)`,
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, columnGap: 28, rowGap: 2,
        }}
      >
        {visible.map((item, i) => (
          <ListRow key={keyOf(item)} item={item} rank={numbered ? i + 1 : null} accent={accent} isMobile={isMobile} index={i} itemV={itemV} revealProps={revealProps} />
        ))}
      </div>
    </section>
  );
}