// src/components/home/sections/HomeSectionLayoutsMore.jsx
//   billboard : banner full-width, trailer làm nền       (kiểu Netflix)
//   trailer   : hàng thẻ backdrop, hover phát trailer    (kiểu Netflix / Prime Video)
//   split     : khung lớn + danh sách bên phải           (kiểu YouTube playlist / Apple TV+)
// Cần normalizeHomeCard giữ lại trailerKey và trailerVideoUrl; thiếu thì layout rơi về ảnh tĩnh.
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Play, Star, Crown, Volume2, VolumeX } from 'lucide-react';
import { C, FONT_BODY, FONT_DISPLAY } from '../../../context/homeTokens';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { contentPath } from '../../../utils/normalizeHomeCard';
import { SectionHeading, accentOf, keyOf } from './HomeSectionLayouts';

const imgOf = (i) => i.backdropUrl || i.posterUrl;
const metaOf = (i, g = 1) => [i.year, ...(i.genres ?? []).slice(0, g)].filter(Boolean).join(' · ');
const clampLines = (n) => ({ display: '-webkit-box', WebkitLineClamp: n, WebkitBoxOrient: 'vertical', overflow: 'hidden' });

const CSS = `
.hsm-link{outline:none}
.hsm-link:focus-visible{outline:2px solid var(--hsm-accent,#fff);outline-offset:3px}
.hsm-rail{scrollbar-width:none;-ms-overflow-style:none}
.hsm-rail::-webkit-scrollbar{display:none}
.hsm-row{transition:background .2s ease}
.hsm-row:hover,.hsm-row:focus-visible,.hsm-row[aria-current="true"]{background:rgba(255,255,255,.08)}
`;

const Rating = ({ value, size = 12 }) =>
  Number(value) > 0 ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#f5c518', fontWeight: 700 }}>
      <Star size={size} fill="#f5c518" /> {Number(value).toFixed(1)}
    </span>
  ) : null;

const Premium = ({ style }) => (
  <span style={{ position: 'absolute', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: 'linear-gradient(135deg,#f5c518,#e08a00)', color: '#1a1200', fontFamily: FONT_BODY, fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', ...style }}>
    <Crown size={10} /> PREMIUM
  </span>
);

const Cover = ({ item, src, style }) =>
  src ? (
    <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }} />
  ) : (
    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', padding: 8, textAlign: 'center', color: C.textSub, fontFamily: FONT_BODY, fontSize: 12 }}>{item.title}</div>
  );

// Trailer: ưu tiên YouTube (iframe muted autoplay), sau đó video upload. Không có thì trả null.
function TrailerPlayer({ item, muted = true, style }) {
  if (item.trailerKey) {
    const k = item.trailerKey;
    const src = `https://www.youtube-nocookie.com/embed/${k}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&loop=1&playlist=${k}&modestbranding=1&playsinline=1&rel=0&disablekb=1`;
    return (
      <iframe
        title={`Trailer ${item.title}`} src={src} allow="autoplay; encrypted-media" tabIndex={-1}
        style={{ position: 'absolute', border: 0, pointerEvents: 'none', ...style }}
      />
    );
  }
  if (item.trailerVideoUrl) {
    return <video src={item.trailerVideoUrl} autoPlay muted={muted} loop playsInline style={{ position: 'absolute', objectFit: 'cover', pointerEvents: 'none', ...style }} />;
  }
  return null;
}
const hasTrailer = (i) => Boolean(i.trailerKey || i.trailerVideoUrl);

// Phóng to khung trailer để lấp đầy tỉ lệ 16:9 → 21:9, tránh viền đen
const FILL = { top: '50%', left: '50%', width: '100%', height: '170%', transform: 'translate(-50%,-50%)' };

// ═══ billboard ═══════════════════════════════════════════════════════════════
export function BillboardSection({ section }) {
  const isMobile = useIsMobile();
  const reduce = useReducedMotion();
  const accent = accentOf(section);
  const item = section.items[0];
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    setPlaying(false);
    if (!item || isMobile || reduce || !hasTrailer(item)) return undefined;
    const t = setTimeout(() => setPlaying(true), 1800); // để ảnh hiện trước rồi mới phát
    return () => clearTimeout(t);
  }, [item?.id, isMobile, reduce]);

  if (!item) return null;

  return (
    <section style={{ marginBottom: isMobile ? 32 : 44, '--hsm-accent': accent }}>
      <style>{CSS}</style>
      <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile} />
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, background: '#111', aspectRatio: isMobile ? '4 / 5' : '21 / 9' }}>
        <Cover item={item} src={imgOf(item)} />
        {playing && <TrailerPlayer item={item} muted={muted} style={FILL} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,.88) 0%, rgba(0,0,0,.35) 50%, transparent 80%), linear-gradient(to top, rgba(0,0,0,.7), transparent 40%)' }} />
        {item.isPremium && <Premium style={{ top: 14, left: 14 }} />}

        <div style={{ position: 'absolute', left: isMobile ? 18 : 44, bottom: isMobile ? 20 : 48, right: isMobile ? 18 : '46%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: isMobile ? 26 : 42, fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.02em' }}>{item.title}</h3>
          <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT_BODY, fontSize: 13.5, color: 'rgba(255,255,255,.85)' }}>
            <Rating value={item.rating} size={14} /> {metaOf(item, 3)}
          </p>
          {item.description && (
            <p style={{ margin: 0, fontFamily: FONT_BODY, fontSize: isMobile ? 13 : 14.5, lineHeight: 1.6, color: 'rgba(255,255,255,.78)', ...clampLines(isMobile ? 2 : 3) }}>{item.description}</p>
          )}
          <Link to={contentPath(item)} className="hsm-link" style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 26px', borderRadius: 8, background: accent, color: '#fff', textDecoration: 'none', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700 }}>
            <Play size={16} fill="#fff" /> Xem ngay
          </Link>
        </div>

        {playing && (
          <button
            type="button" aria-label={muted ? 'Bật tiếng' : 'Tắt tiếng'} onClick={() => setMuted((m) => !m)}
            style={{ position: 'absolute', right: 18, bottom: 18, width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(255,255,255,.35)', background: 'rgba(0,0,0,.55)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
        )}
      </div>
    </section>
  );
}

// ═══ trailer ═════════════════════════════════════════════════════════════════
function TrailerCard({ item, accent, isMobile, reduce }) {
  const [live, setLive] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const enter = () => {
    if (isMobile || reduce || !hasTrailer(item)) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLive(true), 500);
  };
  const leave = () => { clearTimeout(timer.current); setLive(false); };

  return (
    <Link
      to={contentPath(item)} aria-label={item.title} className="hsm-link"
      onMouseEnter={enter} onMouseLeave={leave} onFocus={enter} onBlur={leave}
      style={{
        position: 'relative', display: 'block', flexShrink: 0, width: isMobile ? '78%' : 320, aspectRatio: '16 / 9',
        borderRadius: 8, overflow: 'hidden', background: '#16161c', textDecoration: 'none', scrollSnapAlign: 'start',
        transform: live ? 'scale(1.06)' : 'scale(1)', zIndex: live ? 5 : 1,
        boxShadow: live ? '0 18px 40px rgba(0,0,0,.65)' : 'none', transition: 'transform .3s ease, box-shadow .3s ease',
        '--hsm-accent': accent,
      }}
    >
      <Cover item={item} src={imgOf(item)} />
      {live && <TrailerPlayer item={item} style={FILL} />}
      <div style={{ position: 'absolute', inset: 'auto 0 0 0', padding: '30px 12px 10px', background: 'linear-gradient(to top, rgba(0,0,0,.92), transparent)' }}>
        <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 700, color: '#fff', ...clampLines(1) }}>{item.title}</p>
        <p style={{ margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT_BODY, fontSize: 11.5, color: 'rgba(255,255,255,.7)' }}>
          <Rating value={item.rating} size={11} /> {metaOf(item, 2)}
        </p>
      </div>
      {item.isPremium && <Premium style={{ top: 8, left: 8 }} />}
      {live && (
        <span style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,.65)', color: '#fff', fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700 }}>TRAILER</span>
      )}
      <span style={{ position: 'absolute', left: 0, bottom: 0, height: 3, width: live ? '100%' : 0, background: accent, transition: 'width .3s ease' }} />
    </Link>
  );
}

export function TrailerSection({ section }) {
  const isMobile = useIsMobile();
  const reduce = useReducedMotion();
  const accent = accentOf(section);
  return (
    <section style={{ marginBottom: isMobile ? 32 : 44 }}>
      <style>{CSS}</style>
      <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile} />
      {/* padding dọc dư để thẻ phóng to không bị cắt */}
      <div className="hsm-rail" style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '16px 2px 20px' }}>
        {section.items.map((it) => <TrailerCard key={keyOf(it)} item={it} accent={accent} isMobile={isMobile} reduce={reduce} />)}
      </div>
    </section>
  );
}

// ═══ split ═══════════════════════════════════════════════════════════════════
export function SplitSection({ section }) {
  const isMobile = useIsMobile();
  const reduce = useReducedMotion();
  const accent = accentOf(section);
  const items = section.items.slice(0, 6);
  const [index, setIndex] = useState(0);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const active = items[index] ?? items[0];
  if (!active) return null;

  const peek = (i) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setIndex(i), 120);
  };

  const feature = (
    <Link to={contentPath(active)} aria-label={active.title} className="hsm-link" style={{ position: 'relative', display: 'block', overflow: 'hidden', borderRadius: 12, background: '#111', aspectRatio: '16 / 9', textDecoration: 'none', '--hsm-accent': accent }}>
      <motion.div key={keyOf(active)} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} style={{ position: 'absolute', inset: 0 }}>
        <Cover item={active} src={imgOf(active)} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.92) 0%, rgba(0,0,0,.2) 55%, transparent)' }} />
        <div style={{ position: 'absolute', inset: 'auto 0 0 0', padding: isMobile ? '0 16px 16px' : '0 26px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: isMobile ? 20 : 28, fontWeight: 800, color: '#fff', lineHeight: 1.15, ...clampLines(2) }}>{active.title}</p>
          <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,.8)' }}>
            <Rating value={active.rating} size={13} /> {metaOf(active, 2)}
          </p>
          {!isMobile && active.description && (
            <p style={{ margin: 0, maxWidth: 560, fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.55, color: 'rgba(255,255,255,.72)', ...clampLines(2) }}>{active.description}</p>
          )}
        </div>
      </motion.div>
      {active.isPremium && <Premium style={{ top: 12, left: 12, zIndex: 2 }} />}
    </Link>
  );

  const list = (
    <div role="list" className="hsm-rail" style={isMobile
      ? { display: 'flex', gap: 10, overflowX: 'auto', marginTop: 12 }
      : { display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', maxHeight: '100%' }}>
      {items.map((it, i) => {
        const on = i === index;
        return (
          <button
            key={keyOf(it)} type="button" role="listitem" aria-current={on} className="hsm-link hsm-row"
            onMouseEnter={() => !isMobile && peek(i)} onMouseLeave={() => clearTimeout(timer.current)}
            onFocus={() => setIndex(i)} onClick={() => setIndex(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 10, border: 'none', textAlign: 'left', cursor: 'pointer',
              background: 'transparent', flex: isMobile ? '0 0 220px' : undefined, borderLeft: `3px solid ${on ? accent : 'transparent'}`, '--hsm-accent': accent,
            }}
          >
            <span style={{ flex: '0 0 20px', textAlign: 'center', fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 800, color: on ? accent : C.textSub }}>{i + 1}</span>
            <div style={{ flex: '0 0 96px', aspectRatio: '16 / 9', borderRadius: 6, overflow: 'hidden', background: '#16161c' }}><Cover item={it} src={imgOf(it)} /></div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: on ? C.text : C.textSub, ...clampLines(2) }}>{it.title}</p>
              <p style={{ margin: '3px 0 0', fontFamily: FONT_BODY, fontSize: 11.5, color: C.textSub }}>{metaOf(it, 1)}</p>
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <section style={{ marginBottom: isMobile ? 32 : 44 }}>
      <style>{CSS}</style>
      <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile} />
      {isMobile ? (
        <>{feature}{list}</>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.1fr) minmax(0, 1fr)', gap: 16, alignItems: 'stretch' }}>
          {feature}
          <div style={{ position: 'relative', minHeight: 0 }}>
            <div style={{ position: 'absolute', inset: 0 }}>{list}</div>
          </div>
        </div>
      )}
    </section>
  );
}