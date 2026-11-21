// src/components/home/sections/layouts/BillboardSection.jsx
// billboard: banner điện ảnh, xoay vòng tối đa 5 phim, tự phát trailer của phim đang hiện.
// Mẫu thiết kế (Netflix / Apple TV+ / Disney+):
//  • ảnh full-bleed + scrim 2 lớp (trái → chữ dễ đọc, đáy → hòa vào nền trang)
//  • chữ ở dưới-trái, CTA trắng nổi bật; mô tả tự thu gọn khi trailer chạy
//  • thanh phân đoạn (segmented progress) cho biết số phim + thời gian còn lại, bấm để chọn
//  • thẻ "Tiếp theo" ở góc phải dưới thay cho dải thumbnail rối mắt
//  • trailer tự phát (muted, playsinline); tắt khi Reduce Motion / Data Saver
//  • tạm dừng khi rê chuột / focus / khi banner ra khỏi màn hình; phím ← →
// Mobile dùng BillboardMobile ("phòng chiếu" giống TrailerSection) nên file này chỉ lo bản desktop.
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Play, Crown, ChevronLeft, ChevronRight } from 'lucide-react';
import { C, FONT_BODY, FONT_DISPLAY } from '../../../../context/homeTokens';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import { infoPath } from '../../../../utils/normalizeHomeCard';
import LayoutStyles from '../shared/LayoutStyles';
import SectionHeading from '../shared/SectionHeading';
import TrailerPlayer, { hasTrailer, TRAILER_FILL } from '../shared/TrailerPlayer';
import { VolumeControl, useTrailerVolume, dataSaver } from '../shared/TrailerControls';
import Cover from '../shared/Cover';
import { Rating, PremiumTag } from '../shared/Badges';
import { accentOf, keyOf, imgOf, metaOf, clampLines } from '../shared/layoutUtils';
import { useTextMotion, HOME_EASE, CSS_EASE } from '../shared/motionPresets';
import { BillboardMobile } from './BillboardMobile';

const MAX_ITEMS = 5;
const AUTO_MS = 8000;
const AUTO_MS_TRAILER = 45000;
const START_DELAY = 1800; // chờ ảnh hiện xong rồi mới phát trailer
const PAD_X = 72;

const BB_CSS = `
@keyframes hsl-bb-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.hsl-bb-arrow { transition: opacity .25s, background .2s; }
.hsl-bb-arrow:hover { background: rgba(0,0,0,.7) !important; }
.hsl-bb-next { transition: border-color .2s, background .2s; }
.hsl-bb-next:hover { border-color: rgba(255,255,255,.4) !important; background: rgba(0,0,0,.72) !important; }
.hsl-bb-arrow:focus-visible, .hsl-bb-next:focus-visible, .hsl-bb-mute:focus-visible, .hsl-bb-seg:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
`;

// ── Thanh phân đoạn: vừa là chỉ báo, vừa là bộ đếm giờ tự chuyển ─────────────
function Segments({ items, index, autoplay, running, duration, accent, onSelect, onEnd, style }) {
  return (
    <div role="tablist" aria-label="Chọn phim" style={{ display: 'flex', gap: 6, ...style }}>
      {items.map((it, i) => {
        const on = i === index;
        return (
          <button
            key={keyOf(it)} type="button" role="tab" className="hsl-bb-seg" aria-selected={on}
            aria-label={it.title} title={it.title} onClick={() => onSelect(i)}
            style={{ padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer', width: on ? 56 : 24, transition: `width .35s ${CSS_EASE}` }}
          >
            <span style={{ display: 'block', height: 3, borderRadius: 2, background: 'rgba(255,255,255,.3)', overflow: 'hidden' }}>
              {on && (
                <span
                  key={`${index}-${duration}`}
                  onAnimationEnd={autoplay ? onEnd : undefined}
                  style={{
                    display: 'block', height: '100%', background: autoplay ? accent : '#fff', transformOrigin: 'left center',
                    animation: autoplay ? `hsl-bb-fill ${duration}ms linear forwards` : undefined,
                    animationPlayState: running ? 'running' : 'paused',
                  }}
                />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const arrowStyle = (side, visible) => ({
  position: 'absolute', top: '50%', [side]: 16, transform: 'translateY(-50%)', zIndex: 4,
  width: 42, height: 42, borderRadius: '50%', border: `1px solid ${C.borderMid}`,
  background: 'rgba(0,0,0,.4)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center',
  opacity: visible ? 1 : 0,
});

// Tiêu đề dài → co cỡ chữ; line-height đủ rộng để không cắt dấu / đuôi chữ tiếng Việt
const titleSizeOf = (title) => {
  const len = (title || '').length;
  if (len > 40) return 'clamp(24px, 2.8vw, 38px)';
  return len > 24 ? 'clamp(28px, 3.4vw, 46px)' : 'clamp(32px, 4vw, 56px)';
};

function BillboardDesktop({ section }) {
  const { reduce, textV, lineV } = useTextMotion(false);
  const accent = accentOf(section);
  const items = section.items.slice(0, MAX_ITEMS);
  const n = items.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [playingFor, setPlayingFor] = useState(null); // index phim đã tới lượt phát trailer
  const { muted, volume, toggleMute, changeVolume } = useTrailerVolume();
  const stageRef = useRef(null);
  const inView = useInView(stageRef, { amount: 0.35 });

  const safeIndex = Math.min(index, Math.max(0, n - 1));
  const item = items[safeIndex];
  const nextItem = items[(safeIndex + 1) % Math.max(n, 1)];
  const hasClip = !!item && !reduce && !dataSaver() && hasTrailer(item);
  const canTrailer = hasClip && inView;
  // Dẫn xuất từ index: chuyển phim là `playing` tự về false ngay trong cùng lần render
  // (trước đây còn true 1 nhịp → iframe mới mount rồi bị huỷ ngay)
  const playing = canTrailer && playingFor === safeIndex;
  const autoplay = n > 1 && !reduce;
  const duration = hasClip ? AUTO_MS_TRAILER : AUTO_MS;
  const running = inView && !paused;

  const go = (i) => { if (i !== safeIndex) setIndex(i); };
  const next = () => setIndex((safeIndex + 1) % n);
  const prev = () => setIndex((safeIndex - 1 + n) % n);

  // Trailer tự phát sau START_DELAY, dừng khi banner rời màn hình
  useEffect(() => {
    if (!canTrailer) return undefined;
    const t = setTimeout(() => setPlayingFor(safeIndex), START_DELAY);
    return () => clearTimeout(t);
  }, [safeIndex, canTrailer]);

  if (!item) return null;

  const onKeyDown = (e) => {
    if (n < 2) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  };

  const textLayerV = { ...textV, exit: { opacity: 0, transition: { duration: reduce ? 0 : 0.18 } } };
  const nextSrc = imgOf(nextItem);

  return (
    <section
      role="region" aria-roledescription="carousel" aria-label={section.title}
      onKeyDown={onKeyDown}
      style={{ marginBottom: 44, '--hsl-accent': accent }}
    >
      <LayoutStyles />
      <style>{BB_CSS}</style>
      <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={false} />

      <div
        ref={stageRef}
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
        style={{ position: 'relative', overflow: 'hidden', borderRadius: 10, background: C.surfaceMid, height: 'clamp(400px, 42vw, 600px)' }}
      >
        {/* Lớp ảnh nền: phim mới mờ dần lên TRÊN phim cũ → không bao giờ có khoảng đen giữa hai phim */}
        <AnimatePresence initial={false}>
          <motion.div
            key={keyOf(item)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }}
            transition={{ duration: reduce ? 0 : 0.9, ease: HOME_EASE }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <motion.div
              initial={reduce ? false : { scale: 1.06 }} animate={{ scale: 1 }}
              transition={{ duration: 1.8, ease: HOME_EASE }}
              style={{ position: 'absolute', inset: 0, willChange: reduce ? undefined : 'transform' }}
            >
              <Cover item={item} src={imgOf(item)} />
            </motion.div>
            {playing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} style={{ position: 'absolute', inset: 0 }}>
                <TrailerPlayer item={item} muted={muted} volume={volume} style={TRAILER_FILL} />
              </motion.div>
            )}
            {item.isPremium && <PremiumTag style={{ top: 16, left: 16 }} />}
          </motion.div>
        </AnimatePresence>

        {/* Scrim 2 lớp: trái cho chữ, đáy hòa vào nền trang */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `linear-gradient(90deg, rgba(0,0,0,.82) 0%, rgba(0,0,0,.5) 34%, rgba(0,0,0,0) 68%), linear-gradient(0deg, ${C.bg} 0%, rgba(0,0,0,.55) 16%, rgba(0,0,0,0) 42%)`,
          }}
        />

        {/* Chữ nằm đè lên banner */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={keyOf(item)} variants={textLayerV} initial="enter" animate="center" exit="exit"
            style={{ position: 'absolute', left: PAD_X, bottom: 76, right: '44%', maxWidth: 620, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <motion.h3 variants={lineV} style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: titleSizeOf(item.title), fontWeight: 800, color: '#fff', lineHeight: 1.12, letterSpacing: '-0.03em', overflowWrap: 'anywhere', padding: '0.1em 0 0.12em', overflow: 'visible', clipPath: 'none', textShadow: '0 2px 18px rgba(0,0,0,.45)' }}>
              {item.title}
            </motion.h3>
            <motion.p variants={lineV} style={{ margin: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,.88)' }}>
              <Rating value={item.rating} size={14} /> {metaOf(item, 3)}
            </motion.p>
            {item.description && (
              <motion.div variants={lineV}>
                {/* Trailer chạy thì mô tả thu gọn để khỏi che hình */}
                <div style={{ display: 'grid', gridTemplateRows: playing ? '0fr' : '1fr', opacity: playing ? 0 : 1, transition: reduce ? 'none' : `grid-template-rows .6s ${CSS_EASE}, opacity .5s ease` }}>
                  <div style={{ minHeight: 0, overflow: 'hidden' }}>
                    <p style={{ margin: 0, maxWidth: '52ch', fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,.8)', ...clampLines(3) }}>{item.description}</p>
                  </div>
                </div>
              </motion.div>
            )}
            <motion.div variants={lineV} style={{ alignSelf: 'flex-start', marginTop: 2 }}>
              {/* Nút Xem ngay: hover phình to, bấm thì nhún; phim Premium thì màu vàng */}
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ display: 'inline-flex' }}>
                <Link
                  to={infoPath(item)} className="hsl-link"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none',
                    padding: '11px 28px', borderRadius: 8, fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700,
                    background: item.isPremium ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : '#ffffff',
                    color: item.isPremium ? '#1c1400' : '#000000',
                    boxShadow: item.isPremium ? '0 4px 16px rgba(251,191,36,0.35)' : 'none',
                  }}
                >
                  {item.isPremium
                    ? <Crown size={15} fill="#1c1400" color="#1c1400" />
                    : <Play size={16} fill="currentColor" strokeWidth={0} />}
                  Xem ngay
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {n > 1 && (
          <>
            {/* Thanh phân đoạn */}
            <Segments
              items={items} index={safeIndex} autoplay={autoplay} running={running} duration={duration} accent={accent}
              onSelect={go} onEnd={next}
              style={{ position: 'absolute', left: PAD_X, bottom: 22, zIndex: 3 }}
            />

            {/* Mũi tên (hiện khi rê chuột / focus) */}
            <button type="button" className="hsl-bb-arrow" aria-label="Phim trước" onClick={prev} style={arrowStyle('left', paused)}><ChevronLeft size={22} /></button>
            <button type="button" className="hsl-bb-arrow" aria-label="Phim tiếp theo" onClick={next} style={arrowStyle('right', paused)}><ChevronRight size={22} /></button>
          </>
        )}

        {playing && (
          <VolumeControl
            large muted={muted} volume={volume} className="hsl-bb-mute"
            onToggle={toggleMute} onVolume={changeVolume}
            style={{ right: 28, top: 20 }}
          />
        )}

        {/* Thẻ "Tiếp theo" — giúp người dùng thấy ngay phim kế tiếp là gì */}
        {n > 1 && (
          <button
            type="button" className="hsl-bb-next" onClick={next} aria-label={`Phim tiếp theo: ${nextItem.title}`}
            style={{ position: 'absolute', right: 28, bottom: 24, zIndex: 3, display: 'flex', alignItems: 'center', gap: 12, width: 290, padding: 8, borderRadius: 8, textAlign: 'left', cursor: 'pointer', background: 'rgba(0,0,0,.55)', border: `1px solid ${C.borderMid}`, color: C.text }}
          >
            <motion.span key={keyOf(nextItem)} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
              <span style={{ position: 'relative', flex: '0 0 108px', aspectRatio: '16 / 9', borderRadius: 4, overflow: 'hidden', background: C.surfaceHigh }}>
                {nextSrc && <img src={nextSrc} alt="" loading="lazy" decoding="async" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textSub }}>Tiếp theo</span>
                <span style={{ display: 'block', marginTop: 3, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, lineHeight: 1.3, color: C.text, ...clampLines(2) }}>{nextItem.title}</span>
              </span>
            </motion.span>
            <ChevronRight size={18} style={{ flex: '0 0 auto', color: C.textSub }} />
          </button>
        )}
      </div>
    </section>
  );
}

// Web: bố cục billboard gốc. Mobile: khung "phòng chiếu" giống TrailerSection.
export function BillboardSection({ section }) {
  const isMobile = useIsMobile();
  return isMobile ? <BillboardMobile section={section} /> : <BillboardDesktop section={section} />;
}