// src/components/home/sections/layouts/SplitSection.jsx
// split: khung lớn + danh sách bên phải (tối đa 6 phim), kiểu YouTube playlist / Apple TV+.
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { C, FONT_BODY, FONT_DISPLAY } from '../../../../context/homeTokens';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { contentPath } from '../../../../utils/normalizeHomeCard';
import LayoutStyles from '../shared/LayoutStyles';
import SectionHeading from '../shared/SectionHeading';
import { useTextMotion, HOME_EASE } from '../shared/motionPresets';
import Cover from '../shared/Cover';
import { Rating, PremiumTag } from '../shared/Badges';
import { accentOf, keyOf, imgOf, metaOf, clampLines } from '../shared/layoutUtils';

export function SplitSection({ section }) {
  const isMobile = useIsMobile();
  const { reduce, coverV, textV, lineV } = useTextMotion(isMobile);
  const accent = accentOf(section);
  const items = section.items.slice(0, 6);
  const [index, setIndex] = useState(0);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const safeIndex = Math.min(index, Math.max(0, items.length - 1));
  const active = items[safeIndex];
  if (!active) return null;

  const peek = (i) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setIndex(i), 120);
  };

  const feature = (
    <Link to={contentPath(active)} aria-label={active.title} className="hsl-link" style={{ position: 'relative', display: 'block', overflow: 'hidden', borderRadius: 8, background: C.surfaceMid, aspectRatio: '16 / 9', textDecoration: 'none', '--hsl-accent': accent }}>
      <motion.div key={keyOf(active)} variants={{ enter: { opacity: 0 }, center: { opacity: 1 } }} initial={reduce ? false : 'enter'} animate="center" transition={{ duration: 0.35, ease: HOME_EASE }} style={{ position: 'absolute', inset: 0 }}>
        <motion.div variants={coverV} style={{ position: 'absolute', inset: 0, willChange: reduce ? undefined : 'transform' }}>
          <Cover item={active} src={imgOf(active)} />
        </motion.div>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)' }} />
        <motion.div variants={textV} style={{ position: 'absolute', inset: 'auto 0 0 0', padding: isMobile ? '0 16px 16px' : '0 26px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <motion.p variants={lineV} style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: isMobile ? 20 : 28, fontWeight: 800, color: '#fff', lineHeight: 1.15, ...clampLines(2) }}>{active.title}</motion.p>
          <motion.p variants={lineV} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,.8)' }}>
            <Rating value={active.rating} size={13} /> {metaOf(active, 2)}
          </motion.p>
          {!isMobile && active.description && (
            <motion.p variants={lineV} style={{ margin: 0, maxWidth: 560, fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.55, color: 'rgba(255,255,255,.72)', ...clampLines(2) }}>{active.description}</motion.p>
          )}
        </motion.div>
      </motion.div>
      {active.isPremium && <PremiumTag style={{ top: 12, left: 12, zIndex: 2 }} />}
    </Link>
  );

  const list = (
    <div role="list" className="hsl-rail" style={isMobile
      ? { display: 'flex', gap: 10, overflowX: 'auto', marginTop: 12 }
      : { display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', maxHeight: '100%' }}>
      {items.map((it, i) => {
        const on = i === safeIndex;
        return (
          <button
            key={keyOf(it)} type="button" role="listitem" aria-current={on} className="hsl-link hsl-row"
            onMouseEnter={() => !isMobile && peek(i)} onMouseLeave={() => clearTimeout(timer.current)}
            onFocus={() => setIndex(i)} onClick={() => setIndex(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 8, border: 'none', textAlign: 'left', cursor: 'pointer',
              background: 'transparent', flex: isMobile ? '0 0 220px' : undefined, borderLeft: `3px solid ${on ? accent : 'transparent'}`, transition: reduce ? 'none' : 'border-color .25s ease', '--hsl-accent': accent,
            }}
          >
            <span style={{ flex: '0 0 20px', textAlign: 'center', fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 800, color: on ? accent : C.textSub }}>{i + 1}</span>
            <div style={{ flex: '0 0 96px', aspectRatio: '16 / 9', borderRadius: 4, overflow: 'hidden', background: C.surfaceHigh }}><Cover item={it} src={imgOf(it)} /></div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: on ? C.text : C.textSub, ...clampLines(2) }}>{it.title}</p>
              <p style={{ margin: '3px 0 0', fontFamily: FONT_BODY, fontSize: 11.5, color: C.textSub }}>{metaOf(it, 1)}</p>
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <section style={{ marginBottom: isMobile ? 32 : 44 }}>
      <LayoutStyles />
      <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile} />
      {isMobile ? (
        <>{feature}{list}</>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.1fr) minmax(0, 1fr)', gap: 16, alignItems: 'stretch' }}>
          {feature}
          <div style={{ position: 'relative', minHeight: 0 }}>
            <div style={{ position: 'absolute', inset: 0 }}>{list}</div>
          </div>
        </div>
      )}
    </section>
  );
}