// src/components/home/sections/HomeSectionLayoutsExtra.jsx
// 4 layout mới, cùng chuẩn với HomeSectionLayouts.jsx (tiêu đề có vạch nhấn, token C / FONT_*, accent theo config).
//   spotlight : khung lớn + dải thumbnail chọn phim           (kiểu Netflix / Apple TV+ / Prime Video)
//   mosaic    : 1 ô lớn + 4 ô nhỏ không đều                   (kiểu Disney+ / Max "bộ sưu tập")
//   accordion : dải panel, hover thì panel mở rộng            (kiểu Crunchyroll / HBO Max)
//   list      : danh sách dày thumbnail + thông tin nhiều cột (kiểu Viu / iQIYI / YouTube)
// Đăng ký trong HomeSections.jsx và thêm key vào HomeSectionConstants.Layouts (BE).
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Play, Star, Crown } from 'lucide-react';
import MovieCard from '../../movie/MovieCard';
import { C, FONT_BODY, FONT_DISPLAY } from '../../../context/homeTokens';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { contentPath } from '../../../utils/normalizeHomeCard';
import { SectionHeading, accentOf, keyOf } from './HomeSectionLayouts';

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const imgOf = (item) => item.backdropUrl || item.posterUrl;
const metaOf = (item, genres = 1) =>
  [item.year, ...(item.genres ?? []).slice(0, genres)].filter(Boolean).join(' · ');

const CSS = `
.hsx-link{outline:none}
.hsx-link:focus-visible{outline:2px solid var(--hsx-accent,#fff);outline-offset:3px}
.hsx-row{transition:background .2s ease}
.hsx-row:hover,.hsx-row:focus-visible{background:rgba(255,255,255,.07)}
.hsx-rail{scrollbar-width:none;-ms-overflow-style:none}
.hsx-rail::-webkit-scrollbar{display:none}
`;

const clampLines = (n) => ({
  display: '-webkit-box', WebkitLineClamp: n, WebkitBoxOrient: 'vertical', overflow: 'hidden',
});

function Rating({ value, size = 11 }) {
  if (!(Number(value) > 0)) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#f5c518', fontWeight: 700 }}>
      <Star size={size} fill="#f5c518" /> {Number(value).toFixed(1)}
    </span>
  );
}

function PremiumTag({ style }) {
  return (
    <span
      style={{
        position: 'absolute', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px',
        borderRadius: 6, background: 'linear-gradient(135deg,#f5c518,#e08a00)', color: '#1a1200',
        fontFamily: FONT_BODY, fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', ...style,
      }}
    >
      <Crown size={10} /> PREMIUM
    </span>
  );
}

const Cover = ({ item, src, style }) =>
  src ? (
    <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }} />
  ) : (
    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', padding: 8, textAlign: 'center', color: C.textSub, fontFamily: FONT_BODY, fontSize: 12, ...style }}>
      {item.title}
    </div>
  );

// ═══ spotlight ═══════════════════════════════════════════════════════════════
// Khung lớn hiện phim đang chọn; dải thumbnail bên dưới để đổi (hover trên desktop, chạm trên mobile).
// Không tự chuyển như `hero`, người xem chủ động chọn.
export function SpotlightSection({ section }) {
  const isMobile = useIsMobile();
  const reduce = useReducedMotion();
  const accent = accentOf(section);
  const items = section.items.slice(0, 8);
  const [index, setIndex] = useState(0);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const active = items[index] ?? items[0];
  if (!active) return null;

  const pick = (i) => { clearTimeout(timer.current); setIndex(i); };
  // Trễ ngắn để rê chuột lướt ngang dải thumbnail không làm khung lớn nhấp nháy
  const peek = (i) => {
    if (isMobile) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setIndex(i), 140);
  };
  const dur = reduce ? 0 : 0.45;

  return (
    <section style={{ marginBottom: isMobile ? 32 : 44, '--hsx-accent': accent }}>
      <style>{CSS}</style>
      <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile} />

      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, background: '#111', aspectRatio: isMobile ? '16 / 12' : '21 / 8' }}>
        <AnimatePresence>
          <motion.div
            key={keyOf(active)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }}
            transition={{ duration: dur }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <Cover item={active} src={imgOf(active)} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,.85) 0%, rgba(0,0,0,.35) 50%, transparent 85%), linear-gradient(to top, rgba(0,0,0,.55), transparent 45%)' }} />
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: dur, delay: reduce ? 0 : 0.1 }}
              style={{ position: 'absolute', left: isMobile ? 16 : 40, bottom: isMobile ? 16 : 36, right: isMobile ? 16 : '48%', display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <h3 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: isMobile ? 21 : 32, fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                {active.title}
              </h3>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,.8)' }}>
                <Rating value={active.rating} size={13} />
                {metaOf(active, 2)}
              </p>
              {!isMobile && active.description && (
                <p style={{ margin: 0, fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: 'rgba(255,255,255,.75)', ...clampLines(2) }}>
                  {active.description}
                </p>
              )}
              <Link
                to={contentPath(active)} className="hsx-link"
                style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 8, background: accent, color: '#fff', textDecoration: 'none', fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700 }}
              >
                <Play size={14} fill="#fff" /> Xem ngay
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>
        {active.isPremium && <PremiumTag style={{ top: 14, left: 14, zIndex: 2 }} />}
      </div>

      {items.length > 1 && (
        <div className="hsx-rail" role="tablist" aria-label={section.title} style={{ display: 'flex', gap: 10, marginTop: 12, overflowX: 'auto', padding: '2px 2px 6px' }}>
          {items.map((it, i) => {
            const on = i === index;
            return (
              <button
                key={keyOf(it)} type="button" role="tab" aria-selected={on} aria-label={it.title}
                className="hsx-link"
                onClick={() => pick(i)} onFocus={() => pick(i)} onMouseEnter={() => peek(i)} onMouseLeave={() => clearTimeout(timer.current)}
                style={{
                  position: 'relative', flex: isMobile ? '0 0 136px' : '1 1 0', minWidth: isMobile ? undefined : 120,
                  aspectRatio: '16 / 9', padding: 0, border: 'none', borderRadius: 8, overflow: 'hidden',
                  background: '#16161c', cursor: 'pointer', opacity: on ? 1 : 0.5, transition: reduce ? 'none' : 'opacity .25s ease',
                }}
              >
                <Cover item={it} src={imgOf(it)} />
                <span style={{ position: 'absolute', inset: 'auto 0 0 0', padding: '16px 8px 6px', background: 'linear-gradient(to top, rgba(0,0,0,.85), transparent)', color: '#fff', fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {it.title}
                </span>
                <span style={{ position: 'absolute', left: 0, bottom: 0, height: 3, width: on ? '100%' : 0, background: accent, transition: reduce ? 'none' : 'width .3s ease' }} />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ═══ mosaic ══════════════════════════════════════════════════════════════════
// Ô đầu tiên là ô lớn, tối đa 4 ô nhỏ. config.reverse = true để đưa ô lớn sang phải.
function MosaicTile({ item, accent, big, compact, style }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      to={contentPath(item)} aria-label={item.title} className="hsx-link"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', display: 'block', minHeight: 0, overflow: 'hidden', borderRadius: big ? 12 : 8, background: '#16161c', textDecoration: 'none', '--hsx-accent': accent, ...style }}
    >
      <Cover item={item} src={imgOf(item)} style={{ transform: hover ? 'scale(1.05)' : 'scale(1)', transition: 'transform .7s cubic-bezier(.2,.8,.2,1)' }} />
      <div style={{ position: 'absolute', inset: 0, background: big ? 'linear-gradient(to top, rgba(0,0,0,.9) 0%, rgba(0,0,0,.2) 55%, transparent)' : 'linear-gradient(to top, rgba(0,0,0,.88), transparent 70%)' }} />
      {item.isPremium && <PremiumTag style={{ top: 10, left: 10 }} />}
      <div style={{ position: 'absolute', inset: 'auto 0 0 0', padding: big && !compact ? '0 24px 22px' : '0 12px 11px', display: 'flex', flexDirection: 'column', gap: big ? 8 : 3 }}>
        <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: big ? 800 : 700, fontSize: big ? (compact ? 18 : 28) : 14, lineHeight: 1.2, color: '#fff', letterSpacing: big ? '-0.01em' : 0, ...clampLines(big ? 2 : 1) }}>
          {item.title}
        </p>
        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT_BODY, fontSize: big ? 13 : 11.5, color: 'rgba(255,255,255,.7)' }}>
          <Rating value={item.rating} />
          {metaOf(item, big ? 2 : 1)}
        </p>
        {big && !compact && item.description && (
          <p style={{ margin: 0, maxWidth: 520, fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.55, color: 'rgba(255,255,255,.72)', ...clampLines(2) }}>
            {item.description}
          </p>
        )}
      </div>
      <span style={{ position: 'absolute', left: 0, bottom: 0, height: 3, width: hover ? '100%' : 0, background: accent, transition: 'width .3s ease' }} />
    </Link>
  );
}

export function MosaicSection({ section }) {
  const isMobile = useIsMobile();
  const accent = accentOf(section);
  const reverse = Boolean(section.config?.reverse);
  const [big, ...rest] = section.items;
  if (!big) return null;
  const small = rest.slice(0, 4);
  const n = small.length;

  const heading = <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile} />;

  if (isMobile) {
    return (
      <section style={{ marginBottom: 32 }}>
        <style>{CSS}</style>
        {heading}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <MosaicTile item={big} accent={accent} big compact style={{ gridColumn: '1 / -1', aspectRatio: '16 / 9' }} />
          {small.map((it, i) => (
            <MosaicTile key={keyOf(it)} item={it} accent={accent} style={{ aspectRatio: '16 / 9', gridColumn: n % 2 === 1 && i === n - 1 ? '1 / -1' : undefined }} />
          ))}
        </div>
      </section>
    );
  }

  // Desktop: cột nhỏ = 0 / 1 / 2 tuỳ số ô nhỏ. Ít hơn 3 ô thì mỗi ô cao gấp đôi để lưới không bị hở.
  const smallCols = n >= 3 ? 2 : n;
  const template = reverse ? `${'1fr '.repeat(smallCols)}1.6fr` : `1.6fr ${'1fr '.repeat(smallCols)}`.trim();
  const bigCol = reverse ? smallCols + 1 : 1;
  const firstSmallCol = reverse ? 1 : 2;
  const tall = n <= 2;

  return (
    <section style={{ marginBottom: 44 }}>
      <style>{CSS}</style>
      {heading}
      <div style={{ display: 'grid', gridTemplateColumns: template.trim(), gridTemplateRows: 'repeat(2, 1fr)', gap: 10, height: 'clamp(340px, 32vw, 500px)' }}>
        <MosaicTile item={big} accent={accent} big style={{ gridColumn: bigCol, gridRow: '1 / span 2' }} />
        {small.map((it, i) => {
          const col = firstSmallCol + (i % smallCols);
          const lastOdd = n === 3 && i === 2;
          return (
            <MosaicTile
              key={keyOf(it)} item={it} accent={accent}
              style={{
                gridColumn: lastOdd ? `${firstSmallCol} / span 2` : col,
                gridRow: tall ? '1 / span 2' : Math.floor(i / 2) + 1,
              }}
            />
          );
        })}
      </div>
    </section>
  );
}

// ═══ accordion ═══════════════════════════════════════════════════════════════
// Desktop: panel đang chọn mở rộng (poster → backdrop + thông tin), các panel khác thu hẹp.
// Mobile: rê chuột không có nghĩa → rơi về dải thẻ poster cuộn ngang.
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
        <style>{CSS}</style>
        {heading}
        <div className="hsx-rail" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {section.items.map((item) => (
            <div key={keyOf(item)} style={{ flexShrink: 0 }}>
              <MovieCard movie={item} cardWidth={150} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const ease = 'cubic-bezier(.2,.8,.2,1)';
  return (
    <section style={{ marginBottom: 44, '--hsx-accent': accent }}>
      <style>{CSS}</style>
      {heading}
      <div style={{ display: 'flex', gap: 8, height: 'clamp(320px, 30vw, 440px)' }}>
        {items.map((item, i) => {
          const on = i === safeActive;
          return (
            <Link
              key={keyOf(item)} to={contentPath(item)} aria-label={item.title} className="hsx-link"
              onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)}
              style={{
                position: 'relative', minWidth: 0, overflow: 'hidden', borderRadius: 12, background: '#16161c', textDecoration: 'none',
                flex: on ? 6 : 1, transition: reduce ? 'none' : `flex .55s ${ease}`,
              }}
            >
              {/* Poster khi thu hẹp, backdrop khi mở: chồng 2 ảnh và đổi opacity để không giật */}
              <div style={{ position: 'absolute', inset: 0, opacity: on ? 0 : 1, transition: reduce ? 'none' : 'opacity .4s ease' }}>
                <Cover item={item} src={item.posterUrl || item.backdropUrl} />
              </div>
              <div style={{ position: 'absolute', inset: 0, opacity: on ? 1 : 0, transition: reduce ? 'none' : 'opacity .4s ease' }}>
                <Cover item={item} src={imgOf(item)} />
              </div>
              <div style={{ position: 'absolute', inset: 0, background: on ? 'linear-gradient(to top, rgba(0,0,0,.92) 0%, rgba(0,0,0,.15) 60%, transparent)' : 'rgba(0,0,0,.35)', transition: reduce ? 'none' : 'background .4s ease' }} />
              {item.isPremium && <PremiumTag style={{ top: 10, left: 10 }} />}

              {/* Nội dung rộng cố định để chữ không xuống dòng lại trong lúc panel đang co giãn */}
              <div
                style={{
                  position: 'absolute', left: 0, bottom: 0, width: 420, maxWidth: '100%', padding: '0 26px 24px',
                  display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
                  opacity: on ? 1 : 0, transition: reduce ? 'none' : `opacity .3s ease ${on ? '.2s' : '0s'}`,
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
                <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 4, padding: '8px 18px', borderRadius: 8, background: accent, color: '#fff', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700 }}>
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

// ═══ list ════════════════════════════════════════════════════════════════════
// Danh sách dày, đọc từ trên xuống rồi sang cột kế. config: columns (1-3), rows (3-6), numbered (bool).
// Chỉ bật numbered khi thứ tự do admin sắp thực sự là xếp hạng.
function ListRow({ item, rank, accent, isMobile }) {
  return (
    <Link
      to={contentPath(item)} aria-label={item.title} className="hsx-link hsx-row"
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 10px', borderRadius: 10, textDecoration: 'none', minWidth: 0, '--hsx-accent': accent }}
    >
      {rank != null && (
        <span style={{ flex: '0 0 26px', textAlign: 'center', fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 800, color: rank <= 3 ? accent : C.textSub }}>
          {rank}
        </span>
      )}
      <div style={{ position: 'relative', flex: `0 0 ${isMobile ? 112 : 132}px`, aspectRatio: '16 / 9', borderRadius: 6, overflow: 'hidden', background: '#16161c' }}>
        <Cover item={item} src={imgOf(item)} />
        {item.isPremium && (
          <span aria-label="Premium" style={{ position: 'absolute', top: 4, left: 4, display: 'grid', placeItems: 'center', width: 18, height: 18, borderRadius: 5, background: 'linear-gradient(135deg,#f5c518,#e08a00)', color: '#1a1200' }}>
            <Crown size={10} />
          </span>
        )}
      </div>
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p title={item.title} style={{ margin: 0, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.title}
        </p>
        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT_BODY, fontSize: 12, color: C.textSub }}>
          <Rating value={item.rating} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{metaOf(item, 2)}</span>
        </p>
      </div>
    </Link>
  );
}

export function ListSection({ section }) {
  const isMobile = useIsMobile();
  const accent = accentOf(section);
  const cols = isMobile ? 1 : clamp(Number(section.config?.columns) || 2, 1, 3);
  const rows = clamp(Number(section.config?.rows) || 4, 3, 6);
  const numbered = Boolean(section.config?.numbered);
  const visible = section.items.slice(0, isMobile ? rows * 2 : cols * rows);
  const rowCount = Math.ceil(visible.length / cols);

  return (
    <section style={{ marginBottom: isMobile ? 32 : 44 }}>
      <style>{CSS}</style>
      <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile} />
      <div
        style={{
          display: 'grid', gridAutoFlow: 'column', gridTemplateRows: `repeat(${rowCount}, auto)`,
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, columnGap: 28, rowGap: 2,
        }}
      >
        {visible.map((item, i) => (
          <ListRow key={keyOf(item)} item={item} rank={numbered ? i + 1 : null} accent={accent} isMobile={isMobile} />
        ))}
      </div>
    </section>
  );
}