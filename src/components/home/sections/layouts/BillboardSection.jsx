// src/components/home/sections/layouts/BillboardSection.jsx
// billboard: banner điện ảnh, xoay vòng tối đa 5 phim, tự phát trailer của phim đang hiện.
// Mẫu thiết kế (Netflix / Apple TV+ / Disney+):
//  • ảnh full-bleed + scrim 2 lớp (trái → chữ dễ đọc, đáy → hòa vào nền trang)
//  • chữ ở dưới-trái, CTA trắng nổi bật; mô tả tự thu gọn khi trailer chạy
//  • thanh phân đoạn (segmented progress) cho biết số phim + thời gian còn lại, bấm để chọn
//  • thẻ "Tiếp theo" ở góc phải dưới thay cho dải thumbnail rối mắt (mobile: dải chip phía dưới)
//  • trailer tự phát cả desktop lẫn mobile (muted, playsinline); tắt khi Reduce Motion / Data Saver
//  • tạm dừng khi rê chuột / focus / khi banner ra khỏi màn hình; vuốt ngang trên mobile; phím ← →
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Play, Crown, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
import { C, FONT_BODY, FONT_DISPLAY } from '../../../../context/homeTokens';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { contentPath } from '../../../../utils/normalizeHomeCard';
import LayoutStyles from '../shared/LayoutStyles';
import SectionHeading from '../shared/SectionHeading';
import TrailerPlayer, { hasTrailer, TRAILER_FILL } from '../shared/TrailerPlayer';
import Cover from '../shared/Cover';
import { Rating, PremiumTag } from '../shared/Badges';
import { accentOf, keyOf, imgOf, metaOf, clampLines } from '../shared/layoutUtils';
import { useTextMotion, HOME_EASE, CSS_EASE } from '../shared/motionPresets';

const MAX_ITEMS = 5;

// Mobile: khung 4:5 → iframe 16:9 phải rộng ~222% chiều ngang để phủ kín chiều cao (không viền đen)
const TRAILER_FILL_MOBILE = { top: '50%', left: '50%', width: '222.5%', height: '100%', transform: 'translate(-50%,-50%)' };

// Tiết kiệm dữ liệu: không tự phát trailer nếu người dùng bật Data Saver
const dataSaver = () => typeof navigator !== 'undefined' && navigator.connection?.saveData === true;
const AUTO_MS = 8000;
const AUTO_MS_TRAILER = 20000;

const BB_CSS = `
@keyframes hsl-bb-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.hsl-bb-cta { transition: background .2s, transform .2s; }
.hsl-bb-cta:hover { background: rgba(255,255,255,.82) !important; transform: translateY(-1px); }
.hsl-bb-arrow { transition: opacity .25s, background .2s; }
.hsl-bb-arrow:hover { background: rgba(0,0,0,.7) !important; }
.hsl-bb-next { transition: border-color .2s, background .2s; }
.hsl-bb-next:hover { border-color: rgba(255,255,255,.4) !important; background: rgba(0,0,0,.72) !important; }
.hsl-bb-chip { transition: opacity .2s, border-color .2s; }
.hsl-bb-chip:hover { opacity: 1 !important; }
.hsl-bb-cta:focus-visible, .hsl-bb-arrow:focus-visible, .hsl-bb-next:focus-visible, .hsl-bb-chip:focus-visible, .hsl-bb-mute:focus-visible, .hsl-bb-seg:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.hsl-bb-strip { scrollbar-width: none; }
.hsl-bb-strip::-webkit-scrollbar { display: none; }
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

// ── Chip chọn phim (mobile, dải dưới banner) ────────────────────────────────
function Chip({ item, active, accent, onSelect }) {
  return (
    <button
      type="button" className="hsl-bb-chip" onClick={onSelect}
      aria-label={`Xem ${item.title}`} aria-current={active ? 'true' : undefined}
      style={{
        position: 'relative', flex: '0 0 124px', aspectRatio: '16 / 9', padding: 0, overflow: 'hidden', cursor: 'pointer',
        borderRadius: 6, background: C.surfaceHigh, scrollSnapAlign: 'center',
        border: `2px solid ${active ? accent : 'transparent'}`, opacity: active ? 1 : 0.6,
      }}
    >
      {imgOf(item) && <img src={imgOf(item)} alt="" loading="lazy" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
      <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.85), transparent 65%)' }} />
      <span style={{ position: 'absolute', left: 6, right: 6, bottom: 5, textAlign: 'left', fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 600, lineHeight: 1.25, color: C.text, ...clampLines(1) }}>
        {item.title}
      </span>
    </button>
  );
}

// ── Nút + thanh trượt âm lượng (không đổi src của trailer → không tải lại) ──
function VolumeControl({ muted, volume, onToggle, onVolume, isMobile }) {
  const shown = muted ? 0 : volume;
  return (
    <div
      style={{ position: 'absolute', right: isMobile ? 12 : 28, top: isMobile ? 12 : 20, zIndex: 4, display: 'flex', alignItems: 'center', gap: 6, height: 38, borderRadius: 19, border: `1px solid ${C.borderBright}`, background: 'rgba(0,0,0,.55)' }}
    >
      <button
        type="button" className="hsl-bb-mute" aria-label={muted ? 'Bật tiếng' : 'Tắt tiếng'} onClick={onToggle}
        style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'none', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
      >
        {shown === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
      </button>
      {!isMobile && (
        <input
          type="range" min={0} max={100} step={1} value={shown} aria-label="Âm lượng"
          onChange={(e) => onVolume(Number(e.target.value))}
          style={{ width: 84, marginRight: 12, accentColor: '#fff', cursor: 'pointer' }}
        />
      )}
    </div>
  );
}

const arrowStyle = (side, visible) => ({
  position: 'absolute', top: '50%', [side]: 16, transform: 'translateY(-50%)', zIndex: 4,
  width: 42, height: 42, borderRadius: '50%', border: `1px solid ${C.borderMid}`,
  background: 'rgba(0,0,0,.4)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center',
  opacity: visible ? 1 : 0,
});

export function BillboardSection({ section }) {
  const isMobile = useIsMobile();
  const { reduce, textV, lineV } = useTextMotion(isMobile);
  const accent = accentOf(section);
  const items = section.items.slice(0, MAX_ITEMS);
  const n = items.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(60); // 0–100
  const stageRef = useRef(null);
  const stripRef = useRef(null);
  const swipe = useRef({ x: null, y: 0, swiped: false });
  const inView = useInView(stageRef, { amount: 0.35 });

  const safeIndex = Math.min(index, Math.max(0, n - 1));
  const item = items[safeIndex];
  const nextItem = items[(safeIndex + 1) % Math.max(n, 1)];
  const hasClip = !!item && !reduce && !dataSaver() && hasTrailer(item);
  const canTrailer = hasClip && inView;
  const autoplay = n > 1 && !reduce;
  const duration = hasClip ? AUTO_MS_TRAILER : AUTO_MS;
  const running = inView && !paused;

  const go = (i) => { if (i !== safeIndex) setIndex(i); };
  const next = () => setIndex((safeIndex + 1) % n);
  const prev = () => setIndex((safeIndex - 1 + n) % n);

  // Trailer tự phát sau 1.8s, dừng khi banner rời màn hình
  useEffect(() => {
    setPlaying(false);
    if (!canTrailer) return undefined;
    const t = setTimeout(() => setPlaying(true), 1800);
    return () => clearTimeout(t);
  }, [safeIndex, canTrailer]);

  // Mobile: giữ chip đang chọn ở giữa dải
  useEffect(() => {
    const strip = stripRef.current;
    const el = strip?.children?.[safeIndex];
    if (!strip || !el) return;
    strip.scrollTo({ left: el.offsetLeft - (strip.clientWidth - el.clientWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  }, [safeIndex, reduce]);

  if (!item) return null;

  const onKeyDown = (e) => {
    if (n < 2) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  };

  // Vuốt ngang (touch/pen) — không dùng drag của framer để không kéo lệch cả khung
  const onPointerDown = (e) => {
    if (!isMobile || e.pointerType === 'mouse') return;
    swipe.current = { x: e.clientX, y: e.clientY, swiped: false };
  };
  const onPointerUp = (e) => {
    const s = swipe.current;
    if (s.x == null) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      s.swiped = true;
      if (dx < 0) next(); else prev();
    }
    s.x = null;
  };
  const onClickCapture = (e) => {
    if (swipe.current.swiped) { e.preventDefault(); e.stopPropagation(); swipe.current.swiped = false; }
  };

  const textLayerV = { ...textV, exit: { opacity: 0, transition: { duration: reduce ? 0 : 0.18 } } };
  const padX = isMobile ? 18 : 72;

  // Tiêu đề dài → co cỡ chữ và cho phép 3 dòng; line-height đủ rộng để không cắt dấu / đuôi chữ tiếng Việt
  const tl = (item.title || '').length;
  const titleSize = isMobile
    ? (tl > 40 ? 22 : tl > 24 ? 25 : 28)
    : (tl > 40 ? 'clamp(24px, 2.8vw, 38px)' : tl > 24 ? 'clamp(28px, 3.4vw, 46px)' : 'clamp(32px, 4vw, 56px)');

  return (
    <section
      role="region" aria-roledescription="carousel" aria-label={section.title}
      onKeyDown={onKeyDown}
      style={{ marginBottom: isMobile ? 32 : 44, '--hsl-accent': accent }}
    >
      <LayoutStyles />
      <style>{BB_CSS}</style>
      <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile} />

      <div
        ref={stageRef}
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
        onPointerDown={onPointerDown} onPointerUp={onPointerUp} onClickCapture={onClickCapture}
        style={{
          position: 'relative', overflow: 'hidden', borderRadius: isMobile ? 8 : 10, background: C.surfaceMid,
          ...(isMobile ? { aspectRatio: '4 / 5' } : { height: 'clamp(400px, 42vw, 600px)' }),
          touchAction: isMobile ? 'pan-y' : undefined,
        }}
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
                <TrailerPlayer item={item} muted={muted} volume={volume} style={isMobile ? TRAILER_FILL_MOBILE : TRAILER_FILL} />
              </motion.div>
            )}
            {item.isPremium && <PremiumTag style={{ top: 16, left: 16 }} />}
          </motion.div>
        </AnimatePresence>

        {/* Scrim 2 lớp: trái cho chữ, đáy hòa vào nền trang */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: isMobile
          ? 'linear-gradient(0deg, rgba(0,0,0,.94) 0%, rgba(0,0,0,.6) 42%, rgba(0,0,0,.05) 75%)'
          : `linear-gradient(90deg, rgba(0,0,0,.82) 0%, rgba(0,0,0,.5) 34%, rgba(0,0,0,0) 68%), linear-gradient(0deg, ${C.bg} 0%, rgba(0,0,0,.55) 16%, rgba(0,0,0,0) 42%)` }}
        />

        {/* Lớp chữ: thoát nhanh, vào lần lượt */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={keyOf(item)} variants={textLayerV} initial="enter" animate="center" exit="exit"
            style={{
              position: 'absolute', left: padX, bottom: isMobile ? 56 : 76, right: isMobile ? 18 : '44%', maxWidth: 620,
              display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 14, zIndex: 2,
            }}
          >
            <motion.h3 variants={lineV} style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: titleSize, fontWeight: 800, color: '#fff', lineHeight: 1.12, letterSpacing: '-0.03em', overflowWrap: 'anywhere', padding: '0.1em 0 0.12em', margin: 0, overflow: 'visible', clipPath: 'none', textShadow: '0 2px 18px rgba(0,0,0,.45)' }}>
              {item.title}
            </motion.h3>
            <motion.p variants={lineV} style={{ margin: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,.88)' }}>
              <Rating value={item.rating} size={14} /> {metaOf(item, 3)}
            </motion.p>
            {item.description && (
              <motion.div variants={lineV}>
                <div style={{ display: 'grid', gridTemplateRows: playing ? '0fr' : '1fr', opacity: playing ? 0 : 1, transition: reduce ? 'none' : `grid-template-rows .6s ${CSS_EASE}, opacity .5s ease` }}>
                  <div style={{ minHeight: 0, overflow: 'hidden' }}>
                    <p style={{ margin: 0, maxWidth: '52ch', fontFamily: FONT_BODY, fontSize: isMobile ? 13 : 15, lineHeight: 1.6, color: 'rgba(255,255,255,.8)', ...clampLines(isMobile ? 2 : 3) }}>{item.description}</p>
                  </div>
                </div>
              </motion.div>
            )}
            <motion.div variants={lineV} style={{ alignSelf: 'flex-start', marginTop: 2 }}>
              {/* Nút Xem ngay: y hệt nút Phát của HeroBanner — hover phình to, bấm thì nhún; phim Premium thì màu vàng */}
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ display: 'inline-flex' }}>
                <Link
                  to={contentPath(item)} className="hsl-link"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none',
                    padding: isMobile ? '7px 14px' : '11px 28px', borderRadius: 8,
                    fontFamily: FONT_BODY, fontSize: isMobile ? 12.5 : 15, fontWeight: 700,
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

        {/* Thanh phân đoạn */}
        {n > 1 && (
          <Segments
            items={items} index={safeIndex} autoplay={autoplay} running={running} duration={duration} accent={accent}
            onSelect={go} onEnd={next}
            style={{ position: 'absolute', left: padX, bottom: isMobile ? 14 : 22, zIndex: 3 }}
          />
        )}

        {/* Mũi tên (desktop, hiện khi rê chuột / focus) */}
        {!isMobile && n > 1 && (
          <>
            <button type="button" className="hsl-bb-arrow" aria-label="Phim trước" onClick={prev} style={arrowStyle('left', paused)}><ChevronLeft size={22} /></button>
            <button type="button" className="hsl-bb-arrow" aria-label="Phim tiếp theo" onClick={next} style={arrowStyle('right', paused)}><ChevronRight size={22} /></button>
          </>
        )}

        {/* Âm thanh trailer */}
        {playing && (
          <VolumeControl
            isMobile={isMobile} muted={muted} volume={volume}
            onToggle={() => {
              if (muted && volume === 0) setVolume(60);
              setMuted((m) => !m);
            }}
            onVolume={(v) => { setVolume(v); setMuted(v === 0); }}
          />
        )}

        {/* Thẻ "Tiếp theo" — giúp người dùng thấy ngay phim kế tiếp là gì */}
        {!isMobile && n > 1 && (
          <button
            type="button" className="hsl-bb-next" onClick={next} aria-label={`Phim tiếp theo: ${nextItem.title}`}
            style={{ position: 'absolute', right: 28, bottom: 24, zIndex: 3, display: 'flex', alignItems: 'center', gap: 12, width: 290, padding: 8, borderRadius: 8, textAlign: 'left', cursor: 'pointer', background: 'rgba(0,0,0,.55)', border: `1px solid ${C.borderMid}`, color: C.text }}
          >
            <motion.span key={keyOf(nextItem)} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
              <span style={{ position: 'relative', flex: '0 0 108px', aspectRatio: '16 / 9', borderRadius: 4, overflow: 'hidden', background: C.surfaceHigh }}>
                {imgOf(nextItem) && <img src={imgOf(nextItem)} alt="" loading="lazy" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
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

      {/* Mobile: dải chip chọn phim */}
      {isMobile && n > 1 && (
        <div ref={stripRef} className="hsl-bb-strip" role="group" aria-label="Chọn phim" style={{ position: 'relative', display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', scrollSnapType: 'x proximity', paddingBottom: 2 }}>
          {items.map((it, i) => <Chip key={keyOf(it)} item={it} active={i === safeIndex} accent={accent} onSelect={() => go(i)} />)}
        </div>
      )}
    </section>
  );
}