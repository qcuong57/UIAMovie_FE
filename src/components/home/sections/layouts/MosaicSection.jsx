// src/components/home/sections/layouts/MosaicSection.jsx
// mosaic: 1 ô lớn + tối đa 4 ô nhỏ bất đối xứng. config.reverse = true để đưa ô lớn sang phải.
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { C, FONT_BODY, FONT_DISPLAY } from '../../../../context/homeTokens';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { contentPath } from '../../../../utils/normalizeHomeCard';
import LayoutStyles from '../shared/LayoutStyles';
import SectionHeading from '../shared/SectionHeading';
import { useRailMotion, CSS_EASE } from '../shared/motionPresets';
import Cover from '../shared/Cover';
import { Rating, PremiumTag } from '../shared/Badges';
import { accentOf, keyOf, imgOf, metaOf, clampLines } from '../shared/layoutUtils';

function MosaicTile({ item, accent, big, compact, style, index = 0, itemV, revealProps }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.div
      {...revealProps} custom={index} variants={itemV}
      style={{ position: 'relative', minHeight: 0, overflow: 'hidden', borderRadius: big ? 8 : 6, background: C.surfaceHigh, '--hsl-accent': accent, ...style }}
    >
    <Link
      to={contentPath(item)} aria-label={item.title} className="hsl-link"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ position: 'absolute', inset: 0, display: 'block', textDecoration: 'none' }}
    >
      <Cover item={item} src={imgOf(item)} style={{ transform: hover ? 'scale(1.04)' : 'scale(1)', transition: `transform .7s ${CSS_EASE}` }} />
      <div style={{ position: 'absolute', inset: 0, background: big ? 'rgba(0,0,0,.5)' : 'rgba(0,0,0,.45)' }} />
      {item.isPremium && <PremiumTag style={{ top: 10, left: 10 }} />}
      <div style={{ position: 'absolute', inset: 'auto 0 0 0', padding: big && !compact ? '0 24px 22px' : '0 12px 11px', display: 'flex', flexDirection: 'column', gap: big ? 8 : 3 }}>
        <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: big ? 800 : 700, fontSize: big ? (compact ? 18 : 28) : 14, lineHeight: 1.2, color: '#fff', letterSpacing: big ? '-0.01em' : 0, ...clampLines(big ? 2 : 1) }}>
          {item.title}
        </p>
        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT_BODY, fontSize: big ? 13 : 11.5, color: 'rgba(255,255,255,.75)' }}>
          <Rating value={item.rating} />
          {metaOf(item, big ? 2 : 1)}
        </p>
        {big && !compact && item.description && (
          <p style={{ margin: 0, maxWidth: 520, fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.55, color: 'rgba(255,255,255,.72)', ...clampLines(2) }}>
            {item.description}
          </p>
        )}
      </div>
      <span style={{ position: 'absolute', left: 0, bottom: 0, height: 3, width: hover ? '100%' : 0, background: accent, transition: 'width .3s ease' }} />
    </Link>
    </motion.div>
  );
}

export function MosaicSection({ section }) {
  const isMobile = useIsMobile();
  const accent = accentOf(section);
  const { itemV, revealProps } = useRailMotion();
  const reverse = Boolean(section.config?.reverse);
  const [big, ...rest] = section.items;
  if (!big) return null;
  const small = rest.slice(0, 4);
  const n = small.length;

  const heading = <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile} />;

  if (isMobile) {
    return (
      <section style={{ marginBottom: 32 }}>
        <LayoutStyles />
        {heading}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <MosaicTile itemV={itemV} revealProps={revealProps} item={big} accent={accent} big compact style={{ gridColumn: '1 / -1', aspectRatio: '16 / 9' }} />
          {small.map((it, i) => (
            <MosaicTile itemV={itemV} revealProps={revealProps} index={i + 1} key={keyOf(it)} item={it} accent={accent} style={{ aspectRatio: '16 / 9', gridColumn: n % 2 === 1 && i === n - 1 ? '1 / -1' : undefined }} />
          ))}
        </div>
      </section>
    );
  }

  // Desktop: chỉ có 1 phim thì ô lớn chiếm cả khung (tránh template rỗng); còn lại cột nhỏ = 1 / 2 tuỳ số ô.
  const smallCols = n === 0 ? 0 : n >= 3 ? 2 : n;
  const template = n === 0
    ? '1fr'
    : reverse ? `${'1fr '.repeat(smallCols)}1.6fr` : `1.6fr ${'1fr '.repeat(smallCols)}`;
  const bigCol = reverse && n > 0 ? smallCols + 1 : 1;
  const firstSmallCol = reverse ? 1 : 2;
  const tall = n <= 2;

  return (
    <section style={{ marginBottom: 44 }}>
      <LayoutStyles />
      {heading}
      <div style={{ display: 'grid', gridTemplateColumns: template.trim(), gridTemplateRows: 'repeat(2, 1fr)', gap: 10, height: 'clamp(340px, 32vw, 500px)' }}>
        <MosaicTile itemV={itemV} revealProps={revealProps} item={big} accent={accent} big style={{ gridColumn: bigCol, gridRow: '1 / span 2' }} />
        {small.map((it, i) => {
          const col = firstSmallCol + (i % smallCols);
          const lastOdd = n === 3 && i === 2;
          return (
            <MosaicTile itemV={itemV} revealProps={revealProps} index={i + 1}
              key={keyOf(it)} item={it} accent={accent}
              style={{
                gridColumn: lastOdd ? `${firstSmallCol} / span 2` : col,
                gridRow: tall ? '1 / span 2' : Math.floor(i / 2) + 1,
              }}
            />
          );
        })}
      </div>
    </section>
  );
}