// src/components/home/sections/layouts/AccordionSection.jsx
// accordion: dải panel, panel đang chọn mở rộng (poster → backdrop + thông tin). Mobile rơi về dải thẻ poster cuộn ngang.
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { Play } from 'lucide-react';
import MovieCard from '../../../movie/MovieCard';
import { C, FONT_BODY, FONT_DISPLAY } from '../../../../context/homeTokens';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { contentPath } from '../../../../utils/normalizeHomeCard';
import LayoutStyles from '../shared/LayoutStyles';
import SectionHeading from '../shared/SectionHeading';
import { CSS_EASE } from '../shared/motionPresets';
import Cover from '../shared/Cover';
import { Rating, PremiumTag } from '../shared/Badges';
import { accentOf, keyOf, imgOf, metaOf, clampLines } from '../shared/layoutUtils';

export function AccordionSection({ section }) {
  const isMobile = useIsMobile();
  const reduce = useReducedMotion();
  const accent = accentOf(section);
  const items = section.items.slice(0, 6);
  const [active, setActive] = useState(0);
  const safeActive = Math.min(active, Math.max(0, items.length - 1));

  const heading = <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile} />;

  if (isMobile) {
    return (
      <section style={{ marginBottom: 32 }}>
        <LayoutStyles />
        {heading}
        <div className="hsl-rail" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {section.items.map((item) => (
            <div key={keyOf(item)} style={{ flexShrink: 0 }}>
              <MovieCard movie={item} cardWidth={150} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const ease = CSS_EASE;
  return (
    <section style={{ marginBottom: 44, '--hsl-accent': accent }}>
      <LayoutStyles />
      {heading}
      <div style={{ display: 'flex', gap: 8, height: 'clamp(320px, 30vw, 440px)' }}>
        {items.map((item, i) => {
          const on = i === safeActive;
          return (
            <Link
              key={keyOf(item)} to={contentPath(item)} aria-label={item.title} className="hsl-link"
              onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)}
              style={{
                position: 'relative', minWidth: 0, overflow: 'hidden', borderRadius: 8, background: C.surfaceHigh, textDecoration: 'none',
                flex: on ? 6 : 1, transition: reduce ? 'none' : `flex .55s ${ease}`,
              }}
            >
              <div style={{ position: 'absolute', inset: 0, opacity: on ? 0 : 1, transition: reduce ? 'none' : 'opacity .4s ease' }}>
                <Cover item={item} src={item.posterUrl || item.backdropUrl} />
              </div>
              <div style={{ position: 'absolute', inset: 0, opacity: on ? 1 : 0, transition: reduce ? 'none' : 'opacity .4s ease' }}>
                <Cover item={item} src={imgOf(item)} />
              </div>
              <div style={{ position: 'absolute', inset: 0, background: on ? 'rgba(0,0,0,.5)' : 'rgba(0,0,0,.35)', transition: reduce ? 'none' : 'background .4s ease' }} />
              {item.isPremium && <PremiumTag style={{ top: 10, left: 10 }} />}

              <div
                style={{
                  position: 'absolute', left: 0, bottom: 0, width: 420, maxWidth: '100%', padding: '0 26px 24px',
                  display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
                  opacity: on ? 1 : 0, transform: on || reduce ? 'translateY(0)' : 'translateY(12px)',
                  transition: reduce ? 'none' : `opacity .3s ease ${on ? '.2s' : '0s'}, transform .55s ${ease} ${on ? '.15s' : '0s'}`,
                }}
              >
                <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 800, lineHeight: 1.15, color: '#fff', letterSpacing: '-0.01em', ...clampLines(2) }}>
                  {item.title}
                </p>
                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,.75)' }}>
                  <Rating value={item.rating} size={13} />
                  {metaOf(item, 2)}
                </p>
                {item.description && (
                  <p style={{ margin: 0, fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.55, color: 'rgba(255,255,255,.72)', ...clampLines(2) }}>
                    {item.description}
                  </p>
                )}
                <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 4, padding: '8px 18px', borderRadius: 6, background: accent, color: '#fff', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700 }}>
                  <Play size={13} fill="#fff" /> Xem ngay
                </span>
              </div>
              <span style={{ position: 'absolute', left: 0, bottom: 0, height: 3, width: on ? '100%' : 0, background: accent, transition: reduce ? 'none' : 'width .4s ease' }} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}