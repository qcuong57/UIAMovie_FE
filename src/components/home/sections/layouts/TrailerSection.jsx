// src/components/home/sections/layouts/TrailerSection.jsx
// trailer: "phòng chiếu" — viền/nền đen đặc bao quanh, khung video bo góc có bóng đổ,
// bảng thông tin kính mờ bên cạnh, dải thẻ đánh số bên dưới.
//  • trailer phát bằng đúng TrailerPlayer + cách bật của Billboard (YouTube iframe muted autoplay, video upload)
//  • tự phát khi khung video vào màn hình, dừng khi ra khỏi màn hình; hết một lượt thì chuyển phim kế
//  • Reduce Motion / Data Saver chặn tự phát → hiện nút ▶ để người xem tự bấm phát
//  • phim chưa có trailer: ảnh tĩnh + nhãn "Chưa có trailer"
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Play, Crown, Volume2, VolumeX, ChevronLeft, ChevronRight, Film } from 'lucide-react';
import { C, FONT_BODY, FONT_DISPLAY } from '../../../../context/homeTokens';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { contentPath } from '../../../../utils/normalizeHomeCard';
import LayoutStyles from '../shared/LayoutStyles';
import SectionHeading from '../shared/SectionHeading';
import TrailerPlayer, { hasTrailer, TRAILER_FILL, TRAILER_FIT } from '../shared/TrailerPlayer';
import Cover from '../shared/Cover';
import { Rating, PremiumTag } from '../shared/Badges';
import { accentOf, keyOf, imgOf, metaOf, clampLines } from '../shared/layoutUtils';
import { useTextMotion, HOME_EASE } from '../shared/motionPresets';

const MAX_ITEMS = 12;
const AUTO_MS = 8000; // phim không có trailer
const AUTO_MS_TRAILER = 25000; // phim có trailer
const START_DELAY = 1800; // y như Billboard: chờ ảnh hiện xong rồi mới phát trailer

// Không tự phát trailer nếu người dùng bật Data Saver
const dataSaver = () => typeof navigator !== 'undefined' && navigator.connection?.saveData === true;

const pad2 = (v) => String(v).padStart(2, '0');

const TR_CSS = `
@keyframes hsl-tr-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes hsl-tr-live { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.7); } }
.hsl-tr-grid { display: grid; grid-template-columns: minmax(0, 1fr) 330px; gap: 24px; align-items: stretch; }
@media (max-width: 1023px) { .hsl-tr-grid { grid-template-columns: minmax(0, 1fr); gap: 14px; } }
.hsl-tr-cta { transition: filter .2s, transform .2s; }
.hsl-tr-cta:hover { filter: brightness(1.1); transform: translateY(-1px); }
.hsl-tr-round { transition: background .2s, border-color .2s; }
.hsl-tr-round:hover { background: rgba(255,255,255,.14) !important; border-color: rgba(255,255,255,.4) !important; }
.hsl-tr-bigplay { transition: transform .25s, background .25s; }
.hsl-tr-bigplay:hover { transform: scale(1.08); background: rgba(255,255,255,.28) !important; }
.hsl-tr-thumb { transition: opacity .2s; }
.hsl-tr-thumb:hover { opacity: 1 !important; }
.hsl-tr-cta:focus-visible, .hsl-tr-round:focus-visible, .hsl-tr-thumb:focus-visible, .hsl-tr-mute:focus-visible, .hsl-tr-bigplay:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.hsl-tr-strip { scrollbar-width: none; }
.hsl-tr-strip::-webkit-scrollbar { display: none; }
`;

// ── Nút + thanh trượt âm lượng (mobile: chỉ nút tắt/bật tiếng) ───────────────
function VolumeControl({ muted, volume, onToggle, onVolume, isMobile }) {
  const shown = muted ? 0 : volume;
  return (
    <div style={{ position: 'absolute', right: isMobile ? 10 : 14, bottom: isMobile ? 10 : 14, zIndex: 4, display: 'flex', alignItems: 'center', gap: 4, height: 34, borderRadius: 17, border: '1px solid rgba(255,255,255,.2)', background: 'rgba(0,0,0,.6)' }}>
      <button
        type="button" className="hsl-tr-mute" aria-label={muted ? 'Bật tiếng' : 'Tắt tiếng'} onClick={onToggle}
        style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'none', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
      >
        {shown === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      {!isMobile && (
        <input
          type="range" min={0} max={100} step={1} value={shown} aria-label="Âm lượng"
          onChange={(e) => onVolume(Number(e.target.value))}
          style={{ width: 76, marginRight: 12, accentColor: '#fff', cursor: 'pointer' }}
        />
      )}
    </div>
  );
}

// ── Thẻ chọn phim: ảnh + số thứ tự, tên nằm DƯỚI ảnh; tiến trình chạy trên thẻ đang chọn ──
function Thumb({ item, index, active, accent, isMobile, autoplay, running, duration, onSelect, onEnd }) {
  return (
    <button
      type="button" className="hsl-tr-thumb" onClick={onSelect}
      aria-label={`Xem trailer ${item.title}`} aria-current={active ? 'true' : undefined}
      style={{ flex: `0 0 ${isMobile ? 136 : 196}px`, padding: 0, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', scrollSnapAlign: 'center', opacity: active ? 1 : 0.62 }}
    >
      <span style={{ position: 'relative', display: 'block', aspectRatio: '16 / 9', borderRadius: 8, overflow: 'hidden', background: C.surfaceHigh, boxShadow: active ? `0 0 0 2px ${accent}` : '0 0 0 1px rgba(255,255,255,.1)' }}>
        {imgOf(item) && <img src={imgOf(item)} alt="" loading="lazy" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
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
              key={duration} onAnimationEnd={autoplay ? onEnd : undefined}
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

export function TrailerSection({ section }) {
  const isMobile = useIsMobile();
  const { reduce, textV, lineV } = useTextMotion(isMobile);
  const accent = accentOf(section);
  const items = section.items.slice(0, MAX_ITEMS);
  const n = items.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [playingFor, setPlayingFor] = useState(null); // key phim đã tới lượt phát trailer
  const [manualKey, setManualKey] = useState(null); // người xem tự bấm ▶ cho phim này
  const [playerOn, setPlayerOn] = useState(false); // mobile: player được dựng một lần rồi giữ nguyên
  const lastTrailer = useRef(null);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(60); // 0–100
  const stageRef = useRef(null);
  const stripRef = useRef(null);
  const inView = useInView(stageRef, { amount: 0.35 });

  const safeIndex = Math.min(index, Math.max(0, n - 1));
  const item = items[safeIndex];
  const itemKey = item ? String(keyOf(item)) : '';
  const trailerOk = !!item && hasTrailer(item);
  if (trailerOk) lastTrailer.current = item;
  const manual = manualKey === itemKey;
  const autoOk = trailerOk && !reduce && !dataSaver(); // được tự phát
  const canPlay = (autoOk || (trailerOk && manual)) && inView;
  const autoplay = n > 1 && !reduce;
  const duration = trailerOk ? AUTO_MS_TRAILER : AUTO_MS;
  const running = inView && !paused;

  const go = (i) => { if (i !== safeIndex) setIndex(i); };
  const next = () => setIndex((safeIndex + 1) % n);
  const prev = () => setIndex((safeIndex - 1 + n) % n);

  // `playing` dẫn xuất từ itemKey: đổi phim là về false NGAY trong cùng lần render.
  // (Trước đây dùng setPlaying(false) trong effect → render đầu của phim mới vẫn còn playing=true,
  // iframe mount rồi bị huỷ ngay, rồi mount lại → YouTube kẹt, trailer thứ 2 trở đi về ảnh nền.)
  const playing = canPlay && playingFor === itemKey;

  // Trailer tự phát sau 1.8s (bấm tay thì phát ngay), dừng khi khung rời màn hình / đổi phim
  useEffect(() => {
    if (!canPlay) return undefined;
    const t = setTimeout(() => { setPlayerOn(true); setPlayingFor(itemKey); }, manual ? 0 : START_DELAY);
    return () => { clearTimeout(t); setPlayingFor(null); };
  }, [itemKey, canPlay, manual]);

  // Giữ thẻ đang chọn ở giữa dải (chỉ cuộn trong dải, không kéo cả trang)
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

  const infoV = { ...textV, exit: { opacity: 0, transition: { duration: reduce ? 0 : 0.15 } } };
  const tl = (item.title || '').length;
  const titleSize = isMobile ? (tl > 40 ? 18 : 21) : (tl > 40 ? 22 : tl > 24 ? 26 : 30);
  const showPlayBtn = trailerOk && !playing && !autoOk; // tự phát bị chặn → cho bấm tay

  return (
    <section
      role="region" aria-roledescription="carousel" aria-label={section.title}
      onKeyDown={onKeyDown}
      style={{ marginBottom: isMobile ? 32 : 44, '--hsl-accent': accent }}
    >
      <LayoutStyles />
      <style>{TR_CSS}</style>
      <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile} />

      {/* Phòng chiếu */}
      <div
        onMouseEnter={isMobile ? undefined : () => setPaused(true)} onMouseLeave={isMobile ? undefined : () => setPaused(false)}
        onFocus={isMobile ? undefined : () => setPaused(true)} onBlur={isMobile ? undefined : () => setPaused(false)}
        style={{ position: 'relative', overflow: 'hidden', isolation: 'isolate', borderRadius: isMobile ? 12 : 18, background: '#000', padding: isMobile ? 12 : 28 }}
      >
        <div className="hsl-tr-grid">
          {/* Khung video */}
          <div
            ref={stageRef}
            style={{ position: 'relative', overflow: 'hidden', aspectRatio: '16 / 9', alignSelf: 'start', borderRadius: isMobile ? 8 : 12, background: '#000', ...(isMobile ? { transform: 'translateZ(0)', WebkitMaskImage: '-webkit-radial-gradient(white, black)' } : {}) }}
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={itemKey}
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
                    <TrailerPlayer item={item} muted={muted} volume={volume} style={isMobile ? TRAILER_FIT : TRAILER_FILL} clean={isMobile} />
                  </motion.div>
                )}
                {item.isPremium && <PremiumTag style={{ top: 12, left: 12 }} />}
              </motion.div>
            </AnimatePresence>

            {/* Mobile: MỘT iframe duy nhất giữ qua các phim (iOS Safari chỉ cho autoplay ở lần đầu → đổi video bằng loadVideoById) */}
            {isMobile && playerOn && (trailerOk || lastTrailer.current) && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <TrailerPlayer item={trailerOk ? item : lastTrailer.current} active={playing && trailerOk} persist clean muted={muted} volume={volume} style={TRAILER_FIT} />
              </div>
            )}

            <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(0deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,0) 30%)' }} />

            {/* Tự phát bị chặn (Reduce Motion / Data Saver): bấm ▶ để xem */}
            {showPlayBtn && (
              <button
                type="button" className="hsl-tr-bigplay" aria-label={`Phát trailer ${item.title}`} onClick={() => setManualKey(itemKey)}
                style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 3, width: 68, height: 68, borderRadius: '50%', border: '1px solid rgba(255,255,255,.4)', background: 'rgba(255,255,255,.18)', ...(isMobile ? {} : { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }), color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              >
                <Play size={28} fill="#fff" strokeWidth={0} style={{ marginLeft: 3 }} />
              </button>
            )}

            {!trailerOk && (
              <span style={{ position: 'absolute', left: 12, bottom: 12, zIndex: 3, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: 'rgba(0,0,0,.6)', color: 'rgba(255,255,255,.8)', fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 600 }}>
                <Film size={12} /> Chưa có trailer
              </span>
            )}

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
          </div>

          {/* Bảng thông tin: nền đặc, chữ rõ, hiển thị đủ mô tả */}
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
                {playing ? 'ĐANG PHÁT TRAILER' : 'TRAILER'}
              </span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.45)' }}>{pad2(safeIndex + 1)} / {pad2(n)}</span>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={itemKey} variants={infoV} initial="enter" animate="center" exit="exit"
                style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, marginTop: isMobile ? 12 : 16 }}
              >
                <motion.h3 variants={lineV} style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: titleSize, fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.02em', overflowWrap: 'anywhere', padding: '0.06em 0 0.1em' }}>
                  {item.title}
                </motion.h3>
                <motion.p variants={lineV} style={{ margin: '8px 0 0', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.65)' }}>
                  <Rating value={item.rating} size={13} /> {metaOf(item, 3)}
                </motion.p>
                {item.description && (
                  <motion.p variants={lineV} style={{ margin: isMobile ? '14px 0 0' : '16px 0 0', paddingTop: isMobile ? 14 : 16, borderTop: '1px solid rgba(255,255,255,.08)', fontFamily: FONT_BODY, fontSize: isMobile ? 13.5 : 14, lineHeight: 1.7, color: 'rgba(255,255,255,.78)', whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
                    {item.description}
                  </motion.p>
                )}
              </motion.div>
            </AnimatePresence>

            <div style={{ marginTop: isMobile ? 16 : 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Nút "Xem ngay": y hệt nút Phát của HeroBanner — hover phình to, bấm thì nhún; phim Premium thì màu vàng */}
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
              {n > 1 && (
                <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 8 }}>
                  <button type="button" className="hsl-tr-round" aria-label="Phim trước" onClick={prev} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,.18)', background: 'transparent', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><ChevronLeft size={17} /></button>
                  <button type="button" className="hsl-tr-round" aria-label="Phim tiếp theo" onClick={next} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,.18)', background: 'transparent', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><ChevronRight size={17} /></button>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dải thẻ đánh số */}
        {n > 1 && (
          <div ref={stripRef} className="hsl-tr-strip" role="group" aria-label="Chọn phim" style={{ position: 'relative', display: 'flex', gap: 12, marginTop: isMobile ? 14 : 22, overflowX: 'auto', scrollSnapType: 'x proximity', padding: '4px 2px 2px' }}>
            {items.map((it, i) => (
              <Thumb
                key={keyOf(it)} item={it} index={i} active={i === safeIndex} accent={accent} isMobile={isMobile}
                autoplay={autoplay} running={running} duration={duration} onSelect={() => go(i)} onEnd={next}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}