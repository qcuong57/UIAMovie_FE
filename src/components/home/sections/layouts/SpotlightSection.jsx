// src/components/home/sections/layouts/SpotlightSection.jsx
// spotlight: sân khấu lớn cho phim đang chọn (backdrop + poster nổi bên phải) và "dock" thumbnail bên dưới để đổi phim.
// Không tự chuyển (khác billboard) — người dùng chủ động chọn: hover (desktop) / chạm (mobile) / phím ← →.
// Mẫu thiết kế: Apple TV+ (ít chrome, poster như tác phẩm), Disney+ (bo 6–8px, scrim điện ảnh), Netflix (CTA trắng).
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Crown } from 'lucide-react';
import { C, FONT_BODY, FONT_DISPLAY } from '../../../../context/homeTokens';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { contentPath } from '../../../../utils/normalizeHomeCard';
import LayoutStyles from '../shared/LayoutStyles';
import SectionHeading from '../shared/SectionHeading';
import Cover from '../shared/Cover';
import { Rating, PremiumTag } from '../shared/Badges';
import { accentOf, keyOf, imgOf, metaOf, clampLines } from '../shared/layoutUtils';
import { useTextMotion, HOME_EASE, CSS_EASE } from '../shared/motionPresets';

const MAX_ITEMS = 8;

const SP_CSS = `
.hsl-sp-cta { transition: background .2s, transform .2s; }
.hsl-sp-cta:hover { background: rgba(255,255,255,.82) !important; transform: translateY(-1px); }
.hsl-sp-card { transition: opacity .25s, transform .35s ${CSS_EASE}, border-color .25s; }
.hsl-sp-card:hover { opacity: 1 !important; }
.hsl-sp-cta:focus-visible, .hsl-sp-card:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.hsl-sp-dock { scrollbar-width: none; }
.hsl-sp-dock::-webkit-scrollbar { display: none; }
`;

export function SpotlightSection({ section }) {
  const isMobile = useIsMobile();
  const { reduce, textV, lineV } = useTextMotion(isMobile);
  const accent = accentOf(section);
  const items = section.items.slice(0, MAX_ITEMS);
  const n = items.length;
  const [index, setIndex] = useState(0);
  const timer = useRef(null);
  const dockRef = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const safeIndex = Math.min(index, Math.max(0, n - 1));
  const active = items[safeIndex];
  if (!active) return null;

  const pick = (i) => { clearTimeout(timer.current); setIndex(i); };
  // Trễ ngắn: rê chuột lướt ngang dock không làm sân khấu nhấp nháy
  const peek = (i) => {
    if (isMobile) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setIndex(i), 140);
  };

  const move = (delta) => {
    const i = (safeIndex + delta + n) % n;
    pick(i);
    dockRef.current?.querySelectorAll('[role="tab"]')[i]?.focus();
  };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
  };

  // Mobile: giữ thẻ đang chọn ở giữa dock
  useEffect(() => {
    if (!isMobile) return;
    const dock = dockRef.current;
    const el = dock?.children?.[safeIndex];
    if (!dock || !el) return;
    dock.scrollTo({ left: el.offsetLeft - (dock.clientWidth - el.clientWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  }, [safeIndex, isMobile, reduce]);

  const textLayerV = { ...textV, exit: { opacity: 0, transition: { duration: reduce ? 0 : 0.15 } } };
  const posterSrc = active.posterUrl;
  const padX = isMobile ? 18 : 56;

  return (
    <section style={{ marginBottom: isMobile ? 32 : 44, '--hsl-accent': accent }}>
      <LayoutStyles />
      <style>{SP_CSS}</style>
      <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile} />

      {/* Sân khấu */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: isMobile ? 8 : 10, background: C.surfaceMid, ...(isMobile ? { aspectRatio: '16 / 13' } : { height: 'clamp(380px, 36vw, 520px)' }) }}>
        {/* Nền: phim mới mờ dần lên trên phim cũ */}
        <AnimatePresence initial={false}>
          <motion.div
            key={keyOf(active)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }}
            transition={{ duration: reduce ? 0 : 0.7, ease: HOME_EASE }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <motion.div
              initial={reduce ? false : { scale: 1.05 }} animate={{ scale: 1 }}
              transition={{ duration: 1.4, ease: HOME_EASE }}
              style={{ position: 'absolute', inset: 0, willChange: reduce ? undefined : 'transform' }}
            >
              <Cover item={active} src={imgOf(active)} />
            </motion.div>
            {active.isPremium && <PremiumTag style={{ top: 14, left: 14 }} />}
          </motion.div>
        </AnimatePresence>

        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: isMobile
          ? 'linear-gradient(0deg, rgba(0,0,0,.94) 0%, rgba(0,0,0,.55) 45%, rgba(0,0,0,.08) 80%)'
          : `linear-gradient(90deg, rgba(0,0,0,.86) 0%, rgba(0,0,0,.55) 40%, rgba(0,0,0,.25) 100%), linear-gradient(0deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,0) 40%)` }}
        />

        {/* Poster nổi (desktop) — làm Spotlight khác Billboard: "tác phẩm được chọn" */}
        {!isMobile && posterSrc && (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={keyOf(active)}
              initial={reduce ? false : { opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, transition: { duration: reduce ? 0 : 0.15 } }}
              transition={{ duration: reduce ? 0 : 0.55, ease: HOME_EASE }}
              style={{ position: 'absolute', right: 56, top: '50%', marginTop: 'calc(clamp(150px, 15vw, 214px) * -0.75)', width: 'clamp(150px, 15vw, 214px)', aspectRatio: '2 / 3', borderRadius: 8, overflow: 'hidden', background: C.surfaceHigh, border: `1px solid ${C.borderBright}`, boxShadow: '0 24px 60px rgba(0,0,0,.65)', zIndex: 2 }}
            >
              <img src={posterSrc} alt={active.title} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </motion.div>
          </AnimatePresence>
        )}

        {/* Chữ */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={keyOf(active)} variants={textLayerV} initial="enter" animate="center" exit="exit"
            style={{ position: 'absolute', left: padX, bottom: isMobile ? 18 : 44, right: isMobile ? 18 : '34%', maxWidth: 600, display: 'flex', flexDirection: 'column', gap: isMobile ? 9 : 13, zIndex: 2 }}
          >
            <motion.h3 variants={lineV} style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: isMobile ? 24 : 'clamp(28px, 3.4vw, 46px)', fontWeight: 800, color: '#fff', lineHeight: 1.08, letterSpacing: '-0.03em', textShadow: '0 2px 16px rgba(0,0,0,.4)', ...clampLines(2) }}>
              {active.title}
            </motion.h3>
            <motion.p variants={lineV} style={{ margin: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.85)' }}>
              <Rating value={active.rating} size={13} /> {metaOf(active, 3)}
            </motion.p>
            {!isMobile && active.description && (
              <motion.p variants={lineV} style={{ margin: 0, maxWidth: '54ch', fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.6, color: 'rgba(255,255,255,.78)', ...clampLines(3) }}>
                {active.description}
              </motion.p>
            )}
            <motion.div variants={lineV} style={{ alignSelf: 'flex-start', marginTop: 2 }}>
              {/* Nút Xem ngay: y hệt nút Phát của HeroBanner — hover phình to, bấm thì nhún; phim Premium thì màu vàng */}
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ display: 'inline-flex' }}>
                <Link
                  to={contentPath(active)} className="hsl-link"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none',
                    padding: isMobile ? '7px 14px' : '11px 28px', borderRadius: 8,
                    fontFamily: FONT_BODY, fontSize: isMobile ? 12.5 : 15, fontWeight: 700,
                    background: active.isPremium ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : '#ffffff',
                    color: active.isPremium ? '#1c1400' : '#000000',
                    boxShadow: active.isPremium ? '0 4px 16px rgba(251,191,36,0.35)' : 'none',
                  }}
                >
                  {active.isPremium
                    ? <Crown size={15} fill="#1c1400" color="#1c1400" />
                    : <Play size={16} fill="currentColor" strokeWidth={0} />}
                  Xem ngay
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Đếm vị trí */}
        {n > 1 && (
          <span aria-hidden style={{ position: 'absolute', top: 16, right: 18, zIndex: 3, padding: '3px 10px', borderRadius: 999, background: 'rgba(0,0,0,.5)', border: `1px solid ${C.borderMid}`, fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', color: C.text }}>
            {safeIndex + 1} / {n}
          </span>
        )}
      </div>

      {/* Dock thumbnail */}
      {n > 1 && (
        <div
          ref={dockRef} className="hsl-sp-dock" role="tablist" aria-label={section.title} onKeyDown={onKeyDown}
          style={{ display: 'flex', gap: isMobile ? 8 : 10, marginTop: 12, padding: '4px 2px 6px', overflowX: isMobile ? 'auto' : 'visible', scrollSnapType: isMobile ? 'x proximity' : undefined }}
        >
          {items.map((it, i) => {
            const on = i === safeIndex;
            return (
              <button
                key={keyOf(it)} type="button" role="tab" aria-selected={on} aria-label={it.title} tabIndex={on ? 0 : -1}
                className="hsl-sp-card"
                onClick={() => pick(i)} onFocus={() => pick(i)} onMouseEnter={() => peek(i)} onMouseLeave={() => clearTimeout(timer.current)}
                style={{
                  position: 'relative', flex: isMobile ? '0 0 132px' : '1 1 0', minWidth: 0, aspectRatio: '16 / 9', padding: 0, overflow: 'hidden', cursor: 'pointer',
                  borderRadius: 6, background: C.surfaceHigh, scrollSnapAlign: 'center',
                  border: `2px solid ${on ? accent : 'transparent'}`, opacity: on ? 1 : 0.55,
                  transform: on && !reduce ? 'translateY(-3px)' : 'none',
                }}
              >
                {imgOf(it) && <img src={imgOf(it)} alt="" loading="lazy" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.88), rgba(0,0,0,.05) 65%)' }} />
                <span style={{ position: 'absolute', left: 8, right: 8, bottom: 7, textAlign: 'left', fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, lineHeight: 1.25, color: C.text, ...clampLines(1) }}>
                  {it.title}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}