// src/components/home/sections/layouts/TrailerSection.jsx
// trailer: hàng thẻ backdrop, rê chuột để xem trailer (kiểu Netflix / Prime Video).
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { C, FONT_BODY, FONT_DISPLAY } from '../../../../context/homeTokens';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { contentPath } from '../../../../utils/normalizeHomeCard';
import LayoutStyles from '../shared/LayoutStyles';
import SectionHeading from '../shared/SectionHeading';
import { useRailMotion, CSS_EASE } from '../shared/motionPresets';
import TrailerPlayer, { hasTrailer, TRAILER_FILL } from '../shared/TrailerPlayer';
import Cover from '../shared/Cover';
import { Rating, PremiumTag } from '../shared/Badges';
import { accentOf, keyOf, imgOf, metaOf, clampLines } from '../shared/layoutUtils';

function TrailerCard({ item, accent, isMobile, reduce, index, itemV, revealProps }) {
  const [live, setLive] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const enter = () => {
    if (isMobile || reduce || !hasTrailer(item)) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLive(true), 500);
  };
  const leave = () => { clearTimeout(timer.current); setLive(false); };

  return (
    <motion.div {...revealProps} custom={index} variants={itemV} style={{ position: 'relative', zIndex: live ? 5 : 1, flexShrink: 0, width: isMobile ? '78%' : 320, scrollSnapAlign: 'start' }}>
    <Link
      to={contentPath(item)} aria-label={item.title} className="hsl-link"
      onMouseEnter={enter} onMouseLeave={leave} onFocus={enter} onBlur={leave}
      style={{
        position: 'relative', display: 'block', width: '100%', aspectRatio: '16 / 9',
        borderRadius: 6, overflow: 'hidden', background: C.surfaceHigh, textDecoration: 'none',
        transform: live ? 'scale(1.05)' : 'scale(1)',
        transition: reduce ? 'none' : `transform .45s ${CSS_EASE}`,
        '--hsl-accent': accent,
      }}
    >
      <Cover item={item} src={imgOf(item)} />
      {live && <TrailerPlayer item={item} style={TRAILER_FILL} />}
      <div style={{ position: 'absolute', inset: 'auto 0 0 0', padding: '8px 12px 10px', background: 'rgba(0,0,0,.72)' }}>
        <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 700, color: '#fff', ...clampLines(1) }}>{item.title}</p>
        <p style={{ margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT_BODY, fontSize: 11.5, color: 'rgba(255,255,255,.7)' }}>
          <Rating value={item.rating} size={11} /> {metaOf(item, 2)}
        </p>
      </div>
      {item.isPremium && <PremiumTag style={{ top: 8, left: 8 }} />}
      {live && (
        <span style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 4, background: 'rgba(0,0,0,.75)', color: '#fff', fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700 }}>TRAILER</span>
      )}
      <span style={{ position: 'absolute', left: 0, bottom: 0, height: 3, width: live ? '100%' : 0, background: accent, transition: 'width .3s ease' }} />
    </Link>
    </motion.div>
  );
}

export function TrailerSection({ section }) {
  const isMobile = useIsMobile();
  const reduce = useReducedMotion();
  const accent = accentOf(section);
  const { itemV, revealProps } = useRailMotion();
  return (
    <section style={{ marginBottom: isMobile ? 32 : 44 }}>
      <LayoutStyles />
      <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile} />
      {/* padding dọc dư để thẻ phóng to không bị cắt */}
      <div className="hsl-rail" style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '16px 2px 20px' }}>
        {section.items.map((it, i) => <TrailerCard key={keyOf(it)} item={it} accent={accent} isMobile={isMobile} reduce={reduce} index={i} itemV={itemV} revealProps={revealProps} />)}
      </div>
    </section>
  );
}