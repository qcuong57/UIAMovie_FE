// src/components/home/sections/HomeSectionLayouts.jsx
// Mỗi layout nhận { section } (đã normalize: title, subtitle, config, items[]) và tự render.
// Bám đúng chuẩn UI của các hàng cố định: MovieRow (tiêu đề có vạch màu nhấn, subtitle mờ),
// CountryMovieRows (lưới chia trang + nút tròn + chấm), TopRankedRow (số hạng lớn) — và dùng MovieCard
// chung toàn site nên yêu thích / hover / route chi tiết hoạt động y hệt.
// Thêm layout mới = viết 1 component ở đây + đăng ký trong HomeSections.jsx + thêm key vào HomeSectionConstants.Layouts (BE).
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Star, Crown, Sparkles } from 'lucide-react';
import MovieRow from '../MovieRow';
import TopRankedRow from '../TopRankedRow';
import UpcomingSection from '../UpcomingSection';
import SectionBadge from '../SectionBadge';
import MovieCard from '../../movie/MovieCard';
import { C, FONT_BODY, FONT_DISPLAY } from '../../../context/homeTokens';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { contentPath } from '../../../utils/normalizeHomeCard';

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
export const accentOf = (section) => section.config?.accent || C.accent;
// Glow chỉ dựng được khi màu là hex 6 ký tự (thêm alpha); màu khác thì bỏ glow thay vì vỡ CSS
const withAlpha = (color, alpha) => (/^#[0-9a-f]{6}$/i.test(color) ? `${color}${alpha}` : null);
export const keyOf = (item) => `${item.isTvShow ? 'tv' : 'mv'}-${item.id}`;

// ── Tiêu đề: y hệt MovieRow ─────────────────────────────────────────────────
export function SectionHeading({ title, subtitle, accent, isMobile, right }) {
  return (
    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <h2
          style={{
            fontFamily: FONT_DISPLAY, fontSize: isMobile ? 15 : 20, fontWeight: 700, color: C.text,
            letterSpacing: '-0.01em', lineHeight: 1, borderLeft: `2.5px solid ${accent}`,
            paddingLeft: 11, margin: 0,
          }}
        >
          {title}
        </h2>
        {subtitle && !isMobile && (
          <SectionBadge icon={Sparkles} text={subtitle} color={accent} />
        )}
      </div>
      {right}
    </div>
  );
}

// ── Cặp nút tròn trước / sau: y hệt CountryMovieRows ────────────────────────
function PagerButtons({ canPrev, canNext, onPrev, onNext }) {
  const items = [
    { key: 'p', can: canPrev, onClick: onPrev, icon: <ChevronLeft size={16} strokeWidth={2} />, label: 'Trang trước' },
    { key: 'n', can: canNext, onClick: onNext, icon: <ChevronRight size={16} strokeWidth={2} />, label: 'Trang sau' },
  ];
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {items.map(({ key, can, onClick, icon, label }) => (
        <button
          key={key} type="button" aria-label={label} disabled={!can} onClick={() => can && onClick()}
          style={{
            width: 34, height: 34, borderRadius: '50%', background: 'rgba(12,12,12,0.88)',
            border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', color: '#fff',
            cursor: can ? 'pointer' : 'default', opacity: can ? 1 : 0.22,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity .2s, transform .15s',
          }}
          onMouseEnter={(e) => can && (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

// ── carousel: tái dùng MovieRow ──────────────────────────────────────────────
export function CarouselSection({ section }) {
  return (
    <MovieRow
      title={section.title}
      subtitle={section.subtitle}
      items={section.items}
      accentColor={section.config?.accent || undefined}
    />
  );
}

// ── upcoming: thẻ backdrop + đếm ngược ngày khởi chiếu ───────────────────────
export function UpcomingLayout({ section }) {
  return <UpcomingSection title={section.title} items={section.items} />;
}

// ── ranked: tái dùng TopRankedRow, truyền `items` để GIỮ đúng thứ tự admin sắp ──
export function RankedSection({ section }) {
  return <TopRankedRow title={section.title} items={section.items} />;
}

// ── grid: lưới chia trang giống CountryMovieRows (cột × hàng cấu hình được) ───
export function GridSection({ section }) {
  const isMobile = useIsMobile();
  const accent = accentOf(section);
  const COLS = clamp(Number(section.config?.columns) || 5, 3, 6);
  const ROWS = clamp(Number(section.config?.rows) || 2, 1, 3);
  const perPage = COLS * ROWS;
  const items = section.items;

  const [page, setPage] = useState(0);
  const maxPage = Math.max(0, Math.ceil(items.length / perPage) - 1);
  useEffect(() => { if (page > maxPage) setPage(maxPage); }, [page, maxPage]);

  const visible = items.slice(page * perPage, page * perPage + perPage);
  const glow = withAlpha(accent, '1f');
  const paged = !isMobile && maxPage > 0;

  return (
    <section style={{ marginBottom: isMobile ? 32 : 44 }}>
      <SectionHeading
        title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile}
        right={paged && <PagerButtons canPrev={page > 0} canNext={page < maxPage} onPrev={() => setPage((p) => p - 1)} onNext={() => setPage((p) => p + 1)} />}
      />

      <div style={{ position: 'relative' }}>
        {glow && !isMobile && (
          <div style={{ position: 'absolute', inset: '-20px -40px', background: `radial-gradient(ellipse 60% 50% at 40% 60%, ${glow}, transparent)`, pointerEvents: 'none', zIndex: 0 }} />
        )}

        <div style={{ position: 'relative', zIndex: 1, overflow: isMobile ? 'hidden' : 'visible' }}>
          {isMobile ? (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
              {items.map((item) => (
                <div key={keyOf(item)} style={{ flexShrink: 0 }}>
                  <MovieCard movie={item} cardWidth={160} />
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: ROWS > 1 ? '20px 4px' : 4 }}
              >
                {visible.map((item, i) => (
                  <motion.div key={keyOf(item)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.3 }}>
                    <MovieCard movie={item} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {paged && (
          <div style={{ display: 'flex', gap: 6, marginTop: 16, paddingLeft: 2 }}>
            {Array.from({ length: maxPage + 1 }).map((_, i) => (
              <motion.button
                key={i} type="button" aria-label={`Trang ${i + 1}`} onClick={() => setPage(i)}
                animate={{ width: i === page ? 24 : 6, opacity: i === page ? 1 : 0.3, background: i === page ? accent : 'rgba(255,255,255,0.5)' }}
                transition={{ duration: 0.25 }}
                style={{ height: 3, borderRadius: 2, border: 'none', cursor: 'pointer', padding: 0 }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── banner: hàng thẻ backdrop rộng, cuộn ngang (nút trái/phải như MovieRow) ───
function BannerCard({ item, accent, isMobile }) {
  const [hover, setHover] = useState(false);
  const img = item.backdropUrl || item.posterUrl;
  const meta = [item.year, item.genres?.[0]].filter(Boolean).join(' · ');

  return (
    <Link
      to={contentPath(item)} aria-label={item.title}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', display: 'block', flexShrink: 0, width: isMobile ? '78%' : 340, aspectRatio: '16 / 9',
        borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', textDecoration: 'none',
        transform: hover ? 'scale(1.03)' : 'scale(1)', boxShadow: hover ? '0 14px 32px rgba(0,0,0,0.55)' : 'none',
        transition: 'transform .25s ease, box-shadow .25s ease', scrollSnapAlign: 'start',
      }}
    >
      {img && <img src={img} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
      <div style={{ position: 'absolute', inset: 'auto 0 0 0', padding: '34px 14px 12px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
        <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{item.title}</p>
        <p style={{ margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT_BODY, fontSize: 11.5, color: 'rgba(255,255,255,0.65)' }}>
          {item.rating > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#f5c518', fontWeight: 700 }}>
              <Star size={11} fill="#f5c518" /> {Number(item.rating).toFixed(1)}
            </span>
          )}
          {meta}
        </p>
      </div>
      {item.isPremium && (
        <span style={{ position: 'absolute', top: 8, left: 8, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: 'linear-gradient(135deg,#f5c518,#e08a00)', color: '#1a1200', fontFamily: FONT_BODY, fontSize: 10, fontWeight: 800, letterSpacing: '0.04em' }}>
          <Crown size={10} /> PREMIUM
        </span>
      )}
      <span style={{ position: 'absolute', left: 0, bottom: 0, height: 3, width: hover ? '100%' : 0, background: accent, transition: 'width .3s ease' }} />
    </Link>
  );
}

export function BannerSection({ section }) {
  const isMobile = useIsMobile();
  const accent = accentOf(section);
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    const check = () => {
      if (!el) return;
      setCanLeft(el.scrollLeft > 8);
      setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
    };
    check();
    el?.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => { el?.removeEventListener('scroll', check); window.removeEventListener('resize', check); };
  }, [section.items]);

  const scroll = (dir) => scrollRef.current?.scrollBy({ left: dir * scrollRef.current.clientWidth * 0.72, behavior: 'smooth' });
  const arrowClass = 'absolute top-1/2 -translate-y-1/2 z-[70] w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95 opacity-0 group-hover/row:opacity-100';
  const arrowStyle = { background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: C.text };

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
          {section.items.map((item) => <BannerCard key={keyOf(item)} item={item} accent={accent} isMobile={isMobile} />)}
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

// ── hero: khối nổi bật lớn, tự chuyển nếu có nhiều phim (tối đa 5) ───────────
export function HeroSection({ section }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const accent = accentOf(section);
  const items = section.items.slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || paused) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length, paused]);

  const item = items[index] ?? items[0];
  if (!item) return null;
  const bg = item.backdropUrl || item.posterUrl;

  return (
    <section style={{ marginBottom: isMobile ? 32 : 44 }}>
      <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile} />
      <div
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, background: '#111', aspectRatio: isMobile ? '4 / 3' : '21 / 9' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            {bg && <img src={bg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,.88) 0%, rgba(0,0,0,.4) 55%, transparent 100%)' }} />
            <div style={{ position: 'absolute', left: isMobile ? 18 : 40, bottom: isMobile ? 18 : 40, right: isMobile ? 18 : '45%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {item.isPremium && (
                <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 6, background: 'linear-gradient(135deg,#f5c518,#e08a00)', color: '#1a1200', fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.04em' }}>
                  <Crown size={11} /> PREMIUM
                </span>
              )}
              <h3 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: isMobile ? 22 : 34, fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.01em' }}>{item.title}</h3>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,.8)' }}>
                {item.rating > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#f5c518', fontWeight: 700 }}>
                    <Star size={13} fill="#f5c518" /> {Number(item.rating).toFixed(1)}
                  </span>
                )}
                {[item.year, ...(item.genres ?? []).slice(0, 2)].filter(Boolean).join(' · ')}
              </p>
              {!isMobile && item.description && (
                <p style={{ margin: 0, fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: 'rgba(255,255,255,.75)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.description}
                </p>
              )}
              <button
                type="button" onClick={() => navigate(contentPath(item))}
                style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 8, border: 'none', cursor: 'pointer', background: accent, color: '#fff', fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700 }}
              >
                <Play size={15} fill="#fff" /> Xem ngay
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {items.length > 1 && (
          <div style={{ position: 'absolute', right: 18, bottom: 16, display: 'flex', gap: 6 }}>
            {items.map((it, i) => (
              <button
                key={it.id} type="button" aria-label={`Xem ${it.title}`} onClick={() => setIndex(i)}
                style={{ width: i === index ? 24 : 6, height: 3, borderRadius: 2, border: 'none', padding: 0, cursor: 'pointer', background: i === index ? accent : 'rgba(255,255,255,.4)', transition: 'all .25s' }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}