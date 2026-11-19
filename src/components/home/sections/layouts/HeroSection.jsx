// src/components/home/sections/layouts/HeroSection.jsx
// hero: khối nổi bật lớn, tự chuyển nếu có nhiều phim (tối đa 5). Không trailer (xem billboard).
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Star, Crown } from 'lucide-react';
import { C, FONT_BODY, FONT_DISPLAY } from '../../../../context/homeTokens';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { contentPath } from '../../../../utils/normalizeHomeCard';
import SectionHeading from '../shared/SectionHeading';
import { useTextMotion, HOME_EASE, MOTION } from '../shared/motionPresets';
import { accentOf, keyOf } from '../shared/layoutUtils';

export function HeroSection({ section }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { reduce, coverV, textV, lineV } = useTextMotion(isMobile);
  const accent = accentOf(section);
  const items = section.items.slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || paused || reduce) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length, paused, reduce]);

  const safeIndex = Math.min(index, Math.max(0, items.length - 1));
  const item = items[safeIndex];
  if (!item) return null;
  const bg = item.backdropUrl || item.posterUrl;

  return (
    <section style={{ marginBottom: isMobile ? 32 : 44 }}>
      <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile} />
      <div
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        style={{ position: 'relative', overflow: 'hidden', borderRadius: 8, background: C.surfaceMid, aspectRatio: isMobile ? '4 / 3' : '21 / 9' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={keyOf(item)}
            variants={{ enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } }} initial="enter" animate="center" exit="exit" transition={{ duration: reduce ? 0 : MOTION.duration.fast, ease: HOME_EASE }}
            style={{ position: 'absolute', inset: 0 }}
          >
            {bg && (
              <motion.div variants={coverV} style={{ position: 'absolute', inset: 0, willChange: reduce ? undefined : 'transform' }}>
                <img src={bg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </motion.div>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)' }} />
            <motion.div variants={textV} style={{ position: 'absolute', left: isMobile ? 18 : 40, bottom: isMobile ? 36 : 40, right: isMobile ? 18 : '45%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {item.isPremium && (
                <motion.span variants={lineV} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 4, background: C.gold, color: '#1a1200', fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.04em' }}>
                  <Crown size={11} /> PREMIUM
                </motion.span>
              )}
              <motion.h3 variants={lineV} style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: isMobile ? 22 : 34, fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.01em' }}>{item.title}</motion.h3>
              <motion.p variants={lineV} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,.8)' }}>
                {item.rating > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: C.gold, fontWeight: 700 }}>
                    <Star size={13} fill={C.gold} /> {Number(item.rating).toFixed(1)}
                  </span>
                )}
                {[item.year, ...(item.genres ?? []).slice(0, 2)].filter(Boolean).join(' · ')}
              </motion.p>
              {!isMobile && item.description && (
                <motion.p variants={lineV} style={{ margin: 0, fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: 'rgba(255,255,255,.75)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.description}
                </motion.p>
              )}
              <motion.button variants={lineV}
                type="button" onClick={() => navigate(contentPath(item))}
                style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 6, border: 'none', cursor: 'pointer', background: accent, color: '#fff', fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700 }}
              >
                <Play size={15} fill="#fff" /> Xem ngay
              </motion.button>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {items.length > 1 && (
          <div style={{ position: 'absolute', right: 18, bottom: 16, display: 'flex', gap: 6 }}>
            {items.map((it, i) => (
              <button
                key={keyOf(it)} type="button" aria-label={`Xem ${it.title}`} onClick={() => setIndex(i)}
                style={{ width: i === safeIndex ? 24 : 6, height: 3, borderRadius: 2, border: 'none', padding: 0, cursor: 'pointer', background: i === safeIndex ? accent : 'rgba(255,255,255,.4)', transition: 'all .25s' }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}