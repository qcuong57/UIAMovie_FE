// src/components/home/sections/shared/TrailerRoom.jsx
// "Phòng chiếu": nền đen đặc, khung video 16:9 bo góc, bảng thông tin bên cạnh, dải thẻ đánh số bên dưới.
// Dùng chung cho layout `trailer` (mọi màn hình) và `billboard` (mobile) — hai nơi chỉ khác vài tham số.
//  • trailer: YouTube iframe muted autoplay / video upload; tự phát khi vào màn hình, hết một lượt thì chuyển phim kế
//  • phim chưa có trailer: ảnh tĩnh + nhãn "Chưa có trailer"
//  • Reduce Motion / Data Saver chặn tự phát → hiện nút ▶ để người xem tự bấm
//  • mobile: MỘT iframe duy nhất giữ qua các phim (iOS Safari chỉ cho autoplay ở lần đầu → đổi video bằng loadVideoById)
import React, { useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Crown, ChevronLeft, ChevronRight, Film } from 'lucide-react';
import { C, FONT_BODY, FONT_DISPLAY } from '../../../../context/homeTokens';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import { infoPath } from '../../../../utils/normalizeHomeCard';
import LayoutStyles from './LayoutStyles';
import SectionHeading from './SectionHeading';
import TrailerPlayer, { hasTrailer, TRAILER_FILL, TRAILER_FIT } from './TrailerPlayer';
import Cover from './Cover';
import { Rating, PremiumTag } from './Badges';
import { accentOf, keyOf, imgOf, metaOf, clampLines } from './layoutUtils';
import { useTextMotion, HOME_EASE } from './motionPresets';
import { VolumeControl, useTrailerVolume } from './TrailerControls';
import { useTrailerStage } from '../../../../hooks/home/useTrailerStage';

// Iframe lớn hơn khung ~1% mỗi cạnh (khung overflow:hidden sẽ cắt phần thừa) → không còn vệt hở lộ ảnh nền do làm tròn pixel
const FIT_BLEED = { ...TRAILER_FIT, top: '-1%', left: '-1%', width: '102%', height: '102%' };

const pad2 = (v) => String(v).padStart(2, '0');

const TR_CSS = `
@keyframes hsl-tr-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.hsl-tr-grid { display: grid; grid-template-columns: minmax(0, 1fr) 330px; gap: 24px; align-items: stretch; }
@media (max-width: 1023px) { .hsl-tr-grid { grid-template-columns: minmax(0, 1fr); gap: 14px; } }
.hsl-tr-round { transition: background .2s, border-color .2s; }
.hsl-tr-round:hover { background: rgba(255,255,255,.14) !important; border-color: rgba(255,255,255,.4) !important; }
.hsl-tr-bigplay { transition: transform .25s, background .25s; }
.hsl-tr-bigplay:hover { transform: scale(1.08); background: rgba(255,255,255,.28) !important; }
.hsl-tr-thumb { transition: opacity .2s; }
.hsl-tr-thumb:hover { opacity: 1 !important; }
.hsl-tr-round:focus-visible, .hsl-tr-thumb:focus-visible, .hsl-tr-mute:focus-visible, .hsl-tr-bigplay:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.hsl-tr-strip { scrollbar-width: none; }
.hsl-tr-strip::-webkit-scrollbar { display: none; }
`;

const EMPTY = {};

// Vuốt ngang (touch/pen) trên khung video — không dùng drag của framer để không kéo lệch cả khung
function useSwipe(enabled, next, prev) {
  const swipe = useRef({ x: null, y: 0, swiped: false });
  if (!enabled) return EMPTY;
  return {
    onPointerDown: (e) => {
      if (e.pointerType === 'mouse') return;
      swipe.current = { x: e.clientX, y: e.clientY, swiped: false };
    },
    onPointerUp: (e) => {
      const s = swipe.current;
      if (s.x == null) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        s.swiped = true;
        if (dx < 0) next(); else prev();
      }
      s.x = null;
    },
    // Vừa vuốt xong thì nuốt cú click để không nhảy sang trang phim
    onClickCapture: (e) => {
      if (swipe.current.swiped) { e.preventDefault(); e.stopPropagation(); swipe.current.swiped = false; }
    },
  };
}

// ── Thẻ chọn phim: ảnh + số thứ tự, tên nằm DƯỚI ảnh; tiến trình chạy trên thẻ đang chọn ──
function Thumb({ item, index, active, accent, isMobile, autoplay, running, duration, onSelect, onEnd }) {
  const src = imgOf(item);
  return (
    <button
      type="button" className="hsl-tr-thumb" onClick={onSelect}
      aria-label={`Xem ${item.title}`} aria-current={active ? 'true' : undefined}
      style={{ flex: `0 0 ${isMobile ? 136 : 196}px`, padding: 0, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', scrollSnapAlign: 'center', opacity: active ? 1 : 0.62 }}
    >
      <span style={{ position: 'relative', display: 'block', aspectRatio: '16 / 9', borderRadius: 8, overflow: 'hidden', background: C.surfaceHigh, boxShadow: active ? `0 0 0 2px ${accent}` : '0 0 0 1px rgba(255,255,255,.1)' }}>
        {src && <img src={src} alt="" loading="lazy" decoding="async" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.6), transparent 55%)' }} />
        <span style={{ position: 'absolute', left: 8, bottom: 4, fontFamily: FONT_DISPLAY, fontSize: isMobile ? 16 : 20, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,.6)' }}>{pad2(index + 1)}</span>
        {hasTrailer(item) && (
          <span aria-hidden style={{ position: 'absolute', right: 6, top: 6, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,.6)', display: 'grid', placeItems: 'center' }}>
            <Play size={11} fill="#fff" strokeWidth={0} />
          </span>
        )}
        {active && (
          <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: 'rgba(255,255,255,.25)', overflow: 'hidden' }}>
            <span
              key={`${index}-${duration}`} onAnimationEnd={autoplay ? onEnd : undefined}
              style={{ display: 'block', height: '100%', background: accent, transformOrigin: 'left center', animation: autoplay ? `hsl-tr-fill ${duration}ms linear forwards` : undefined, animationPlayState: running ? 'running' : 'paused', transform: autoplay ? undefined : 'scaleX(1)' }}
            />
          </span>
        )}
      </span>
      <span style={{ display: 'block', marginTop: 8, fontFamily: FONT_BODY, fontSize: isMobile ? 11.5 : 12.5, fontWeight: active ? 700 : 600, lineHeight: 1.3, color: active ? '#fff' : 'rgba(255,255,255,.65)', ...clampLines(2) }}>
        {item.title}
      </span>
    </button>
  );
}

/**
 * @param {number}  maxItems         số phim tối đa
 * @param {number}  trailerMs        thời gian ở lại một phim có trailer trước khi tự chuyển
 * @param {string}  label            nhãn nhỏ phía trên bảng thông tin khi chưa phát trailer
 * @param {boolean} swipeable        vuốt ngang trên khung video để đổi phim (chỉ có tác dụng trên mobile)
 * @param {boolean} bleed            iframe tràn nhẹ ra ngoài khung để không lộ vệt hở (mobile)
 * @param {boolean} clampDescription cắt mô tả sau vài dòng thay vì hiện đủ
 */
export default function TrailerRoom({ section, maxItems, trailerMs, label, swipeable = false, bleed = false, clampDescription = false }) {
  const isMobile = useIsMobile();
  const { reduce, textV, lineV } = useTextMotion(isMobile);
  const accent = accentOf(section);
  const items = useMemo(() => section.items.slice(0, maxItems), [section.items, maxItems]);
  const n = items.length;

  const stage = useTrailerStage({ items, reduce, trailerMs });
  const { muted, volume, toggleMute, changeVolume } = useTrailerVolume();
  const swipeHandlers = useSwipe(swipeable && isMobile, stage.next, stage.prev);
  const { item, safeIndex, playing } = stage;

  if (!item) return null;

  const infoV = { ...textV, exit: { opacity: 0, transition: { duration: reduce ? 0 : 0.15 } } };
  const tl = (item.title || '').length;
  const titleSize = isMobile ? (tl > 40 ? 18 : 21) : (tl > 40 ? 22 : tl > 24 ? 26 : 30);
  const hoverPause = isMobile ? EMPTY : {
    onMouseEnter: () => stage.setPaused(true), onMouseLeave: () => stage.setPaused(false),
    onFocus: () => stage.setPaused(true), onBlur: () => stage.setPaused(false),
  };

  return (
    <section
      role="region" aria-roledescription="carousel" aria-label={section.title}
      onKeyDown={stage.onKeyDown}
      style={{ marginBottom: isMobile ? 32 : 44, '--hsl-accent': accent }}
    >
      <LayoutStyles />
      <style>{TR_CSS}</style>
      <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile} />

      <div
        {...hoverPause}
        style={{ position: 'relative', overflow: 'hidden', isolation: 'isolate', borderRadius: isMobile ? 12 : 18, background: '#000', padding: isMobile ? 12 : 28 }}
      >
        <div className="hsl-tr-grid">
          {/* Khung video 16:9 */}
          <div
            ref={stage.stageRef} {...swipeHandlers}
            style={{
              position: 'relative', overflow: 'hidden', aspectRatio: '16 / 9', alignSelf: 'start', borderRadius: isMobile ? 8 : 12, background: '#000',
              ...(isMobile ? { transform: 'translateZ(0)', WebkitMaskImage: '-webkit-radial-gradient(white, black)', touchAction: swipeable ? 'pan-y' : undefined } : {}),
            }}
          >
            {/* Phim mới mờ dần lên TRÊN phim cũ → không có khoảng đen giữa hai phim */}
            <AnimatePresence initial={false}>
              <motion.div
                key={keyOf(item)}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }}
                transition={{ duration: reduce ? 0 : 0.9, ease: HOME_EASE }}
                style={{ position: 'absolute', inset: 0 }}
              >
                <motion.div
                  initial={reduce || isMobile ? false : { scale: 1.05 }} animate={{ scale: 1 }}
                  transition={{ duration: 1.8, ease: HOME_EASE }}
                  style={{ position: 'absolute', inset: 0, willChange: reduce || isMobile ? undefined : 'transform' }}
                >
                  <Cover item={item} src={imgOf(item)} />
                </motion.div>
                {playing && !isMobile && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} style={{ position: 'absolute', inset: 0 }}>
                    <TrailerPlayer item={item} muted={muted} volume={volume} style={TRAILER_FILL} />
                  </motion.div>
                )}
                {item.isPremium && <PremiumTag style={{ top: 12, left: 12 }} />}
              </motion.div>
            </AnimatePresence>

            {isMobile && stage.playerOn && stage.playerItem && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <TrailerPlayer item={stage.playerItem} active={playing && stage.trailerOk} persist clean muted={muted} volume={volume} style={bleed ? FIT_BLEED : TRAILER_FIT} />
              </div>
            )}

            <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(0deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,0) 30%)' }} />

            {/* Tự phát bị chặn (Reduce Motion / Data Saver): bấm ▶ để xem */}
            {stage.showPlayBtn && (
              <button
                type="button" className="hsl-tr-bigplay" aria-label={`Phát trailer ${item.title}`} onClick={stage.playManually}
                style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 3, width: 68, height: 68, borderRadius: '50%', border: '1px solid rgba(255,255,255,.4)', background: 'rgba(255,255,255,.18)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              >
                <Play size={28} fill="#fff" strokeWidth={0} style={{ marginLeft: 3 }} />
              </button>
            )}

            {!stage.trailerOk && (
              <span style={{ position: 'absolute', left: 12, bottom: 12, zIndex: 3, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: 'rgba(0,0,0,.6)', color: 'rgba(255,255,255,.8)', fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 600 }}>
                <Film size={12} /> Chưa có trailer
              </span>
            )}

            {playing && (
              <VolumeControl
                compact={isMobile} muted={muted} volume={volume} className="hsl-tr-mute"
                onToggle={toggleMute} onVolume={changeVolume}
                style={{ right: isMobile ? 10 : 14, bottom: isMobile ? 10 : 14 }}
              />
            )}
          </div>

          {/* Bảng thông tin: nền đặc, chữ rõ */}
          <div
            style={{
              display: 'flex', flexDirection: 'column', minWidth: 0,
              padding: isMobile ? '16px' : '22px 24px', borderRadius: isMobile ? 8 : 12,
              background: '#111114', border: '1px solid rgba(255,255,255,.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,.55)' }}>
                <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: playing ? accent : 'rgba(255,255,255,.35)' }} />
                {playing ? 'ĐANG PHÁT TRAILER' : label}
              </span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.45)' }}>{pad2(safeIndex + 1)} / {pad2(n)}</span>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={keyOf(item)} variants={infoV} initial="enter" animate="center" exit="exit"
                style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, marginTop: isMobile ? 12 : 16 }}
              >
                <motion.h3 variants={lineV} style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: titleSize, fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.02em', overflowWrap: 'anywhere', padding: '0.06em 0 0.1em' }}>
                  {item.title}
                </motion.h3>
                <motion.p variants={lineV} style={{ margin: '8px 0 0', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.65)' }}>
                  <Rating value={item.rating} size={13} /> {metaOf(item, 3)}
                </motion.p>
                {item.description && (
                  <motion.p
                    variants={lineV}
                    style={{
                      margin: isMobile ? '14px 0 0' : '16px 0 0', paddingTop: isMobile ? 14 : 16, borderTop: '1px solid rgba(255,255,255,.08)',
                      fontFamily: FONT_BODY, fontSize: isMobile ? 13.5 : 14, lineHeight: 1.7, color: 'rgba(255,255,255,.78)', overflowWrap: 'anywhere',
                      ...(clampDescription ? clampLines(isMobile ? 4 : 6) : { whiteSpace: 'pre-line' }),
                    }}
                  >
                    {item.description}
                  </motion.p>
                )}
              </motion.div>
            </AnimatePresence>

            <div style={{ marginTop: isMobile ? 16 : 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Nút "Xem ngay": hover phình to, bấm thì nhún; phim Premium thì màu vàng */}
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ display: 'inline-flex' }}>
                <Link
                  to={infoPath(item)} className="hsl-link"
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
              {n > 1 && (
                <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 8 }}>
                  {[['Phim trước', stage.prev, ChevronLeft], ['Phim tiếp theo', stage.next, ChevronRight]].map(([name, onClick, Icon]) => (
                    <button
                      key={name} type="button" className="hsl-tr-round" aria-label={name} onClick={onClick}
                      style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,.18)', background: 'transparent', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                    >
                      <Icon size={17} />
                    </button>
                  ))}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dải thẻ đánh số */}
        {n > 1 && (
          <div ref={stage.stripRef} className="hsl-tr-strip" role="group" aria-label="Chọn phim" style={{ position: 'relative', display: 'flex', gap: 12, marginTop: isMobile ? 14 : 22, overflowX: 'auto', scrollSnapType: 'x proximity', padding: '4px 2px 2px' }}>
            {items.map((it, i) => (
              <Thumb
                key={keyOf(it)} item={it} index={i} active={i === safeIndex} accent={accent} isMobile={isMobile}
                autoplay={stage.autoplay} running={stage.running} duration={stage.duration} onSelect={() => stage.go(i)} onEnd={stage.next}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}