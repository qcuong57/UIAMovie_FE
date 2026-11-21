// src/components/home/sections/layouts/BannerSection.jsx
// banner: hàng thẻ backdrop rộng, cuộn ngang (nút trái/phải như MovieRow).
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Crown } from 'lucide-react';
import { C, FONT_BODY, FONT_DISPLAY } from '../../../../context/homeTokens';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import { infoPath } from '../../../../utils/normalizeHomeCard';
import SectionHeading from '../shared/SectionHeading';
import { useRailMotion, CSS_EASE } from '../shared/motionPresets';
import { accentOf, keyOf } from '../shared/layoutUtils';

function BannerCard({ item, accent, isMobile, index, itemV, revealProps }) {
  const [hover, setHover] = useState(false);
  const img = item.backdropUrl || item.posterUrl;
  const meta = [item.year, item.genres?.[0]].filter(Boolean).join(' · ');

  return (
    <motion.div {...revealProps} custom={index} variants={itemV} style={{ flexShrink: 0, width: isMobile ? '78%' : 340, scrollSnapAlign: 'start' }}>
    <Link
      to={infoPath(item)} aria-label={item.title}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', display: 'block', width: '100%', aspectRatio: '16 / 9',
        borderRadius: 6, overflow: 'hidden', background: C.surfaceHigh, textDecoration: 'none',
      }}
    >
      {img && <img src={img} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: hover ? 'scale(1.04)' : 'scale(1)', transition: `transform .6s ${CSS_EASE}` }} />}
      <div style={{ position: 'absolute', inset: 'auto 0 0 0', padding: '10px 14px 12px', background: 'rgba(0,0,0,0.72)' }}>
        <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</p>
        <p style={{ margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT_BODY, fontSize: 11.5, color: 'rgba(255,255,255,0.65)' }}>
          {item.rating > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: C.gold, fontWeight: 700 }}>
              <Star size={11} fill={C.gold} /> {Number(item.rating).toFixed(1)}
            </span>
          )}
          {meta}
        </p>
      </div>
      {item.isPremium && (
        <span style={{ position: 'absolute', top: 8, left: 8, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, background: C.gold, color: '#1a1200', fontFamily: FONT_BODY, fontSize: 10, fontWeight: 800, letterSpacing: '0.04em' }}>
          <Crown size={10} /> PREMIUM
        </span>
      )}
      <span style={{ position: 'absolute', left: 0, bottom: 0, height: 3, width: hover ? '100%' : 0, background: accent, transition: 'width .3s ease' }} />
    </Link>
    </motion.div>
  );
}

export function BannerSection({ section }) {
  const isMobile = useIsMobile();
  const accent = accentOf(section);
  const { itemV, revealProps } = useRailMotion();
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // Đo vị trí cuộn tối đa 1 lần / khung hình (scroll bắn dày, đọc scrollLeft liên tục sẽ ép layout)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    let raf = 0;
    const check = () => {
      raf = 0;
      setCanLeft(el.scrollLeft > 8);
      setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    el.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [section.items]);

  const scroll = (dir) => scrollRef.current?.scrollBy({ left: dir * scrollRef.current.clientWidth * 0.72, behavior: 'smooth' });
  const arrowClass = 'absolute top-1/2 -translate-y-1/2 z-[70] w-10 h-10 rounded-md flex items-center justify-center transition-opacity duration-150 opacity-0 group-hover/row:opacity-100';
  const arrowStyle = { background: C.surfaceMid, border: `1px solid ${C.borderBright}`, color: C.text };

  return (
    <section style={{ marginBottom: isMobile ? 32 : 44 }} className="group/row">
      <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile} />
      <div className="relative" style={{ overflow: 'clip' }}>
        {!isMobile && canLeft && (
          <button type="button" aria-label="Cuộn trái" onClick={() => scroll(-1)} className={`${arrowClass} left-1`} style={arrowStyle}>
            <ChevronLeft size={18} strokeWidth={2} />
          </button>
        )}
        <div
          ref={scrollRef}
          style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', padding: '8px 2px 12px' }}
        >
          {section.items.map((item, i) => <BannerCard key={keyOf(item)} item={item} accent={accent} isMobile={isMobile} index={i} itemV={itemV} revealProps={revealProps} />)}
        </div>
        {!isMobile && canRight && (
          <button type="button" aria-label="Cuộn phải" onClick={() => scroll(1)} className={`${arrowClass} right-1`} style={arrowStyle}>
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        )}
      </div>
    </section>
  );
}