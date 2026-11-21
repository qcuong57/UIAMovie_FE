// src/components/home/sections/layouts/AccordionSection.jsx
// accordion: dải panel, panel đang chọn mở rộng (poster → backdrop + thông tin). Mobile rơi về dải thẻ poster cuộn ngang.
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { Play, Crown } from 'lucide-react';
import MovieCard from '../../../movie/MovieCard';
import { C, FONT_BODY, FONT_DISPLAY } from '../../../../context/homeTokens';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import { infoPath } from '../../../../utils/normalizeHomeCard';
import LayoutStyles from '../shared/LayoutStyles';
import SectionHeading from '../shared/SectionHeading';
import { CSS_EASE } from '../shared/motionPresets';
import Cover from '../shared/Cover';
import { Rating, PremiumTag } from '../shared/Badges';
import { accentOf, keyOf, imgOf, metaOf, clampLines } from '../shared/layoutUtils';

const HOVER_DELAY = 70;   // đủ để lướt qua nhiều panel không bị kích hoạt, nhưng không còn cảm giác trễ
const ACTIVE_GROW = 6;    // panel mở rộng gấp 6 lần panel thu gọn
const GAP = 8;

// Nút "Xem ngay" giống Billboard: hover phình to, bấm thì nhún (CSS vì nút nằm trong <Link> của panel)
const CTA_CSS = `
.hsl-acc-cta{transition:transform .2s ease}
.hsl-acc-cta:hover{transform:scale(1.04)}
.hsl-acc-cta:active{transform:scale(.96)}
@media (prefers-reduced-motion:reduce){.hsl-acc-cta{transition:none}.hsl-acc-cta:hover,.hsl-acc-cta:active{transform:none}}
`;

export function AccordionSection({ section }) {
  const isMobile = useIsMobile();
  const reduce = useReducedMotion();
  const accent = accentOf(section);
  const items = section.items.slice(0, 6);
  const [active, setActive] = useState(0);
  const safeActive = Math.min(active, Math.max(0, items.length - 1));
  const hoverTimer = useRef(null);
  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  // Rê chuột lướt ngang qua nhiều panel: chờ ngắn rồi mới mở → không kích hoạt hàng loạt animation `flex` (mỗi khung hình là một lần layout)
  const peek = (i) => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setActive(i), HOVER_DELAY);
  };

  const heading = <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile} />;

  if (isMobile) {
    return (
      <section style={{ marginBottom: 32 }}>
        <LayoutStyles />
        {heading}
        <div className="hsl-rail" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {section.items.map((item) => (
            <div key={keyOf(item)} style={{ flexShrink: 0 }}>
              <MovieCard movie={item} cardWidth={150} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const ease = CSS_EASE;
  const n = items.length;
  // Chiều rộng panel đang mở (tính theo container). Lớp backdrop giữ cố định đúng chiều rộng này,
  // panel chỉ như "ô cửa" mở dần ra → ảnh không bị co giãn / giải mã lại ở từng khung hình, chữ không bị reflow.
  const openW = `calc((100cqw - ${(n - 1) * GAP}px) * ${ACTIVE_GROW} / ${n + ACTIVE_GROW - 1})`;
  return (
    <section style={{ marginBottom: 44, '--hsl-accent': accent }}>
      <LayoutStyles />
      <style>{CTA_CSS}</style>
      {heading}
      <div style={{ display: 'flex', gap: GAP, height: 'clamp(320px, 30vw, 440px)', containerType: 'inline-size', '--acc-w': openW }}>
        {items.map((item, i) => {
          const on = i === safeActive;
          return (
            <Link
              key={keyOf(item)} to={infoPath(item)} aria-label={item.title} className="hsl-link"
              onMouseEnter={() => peek(i)} onMouseLeave={() => clearTimeout(hoverTimer.current)} onFocus={() => setActive(i)}
              style={{
                position: 'relative', minWidth: 0, overflow: 'hidden', contain: 'layout paint', borderRadius: 8, background: C.surfaceHigh, textDecoration: 'none',
                flex: on ? ACTIVE_GROW : 1, transition: reduce ? 'none' : `flex .65s ${ease}`,
              }}
            >
              {/* Poster: phủ kín panel, mờ dần khi panel mở */}
              <div style={{ position: 'absolute', inset: 0, opacity: on ? 0 : 1, transition: reduce ? 'none' : 'opacity .45s ease', willChange: reduce ? undefined : 'opacity' }}>
                <Cover item={item} src={item.posterUrl || item.backdropUrl} />
              </div>
              {/* Backdrop: rộng cố định = chiều rộng lúc mở, căn giữa; chỉ đổi opacity + scale (chạy trên GPU) */}
              <div
                style={{
                  position: 'absolute', top: 0, bottom: 0, left: '50%', width: 'var(--acc-w, 100%)', minWidth: '100%',
                  opacity: on ? 1 : 0,
                  transform: `translateX(-50%) scale(${on || reduce ? 1 : 1.08})`,
                  transition: reduce ? 'none' : `opacity .45s ease, transform .9s ${ease}`,
                  willChange: reduce ? undefined : 'opacity, transform',
                }}
              >
                <Cover item={item} src={imgOf(item)} />
              </div>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.35)' }} />
              {/* Lớp tối dần ở đáy cho chữ dễ đọc: đổi opacity (mượt) thay vì đổi màu nền */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.25) 55%, transparent 100%)', opacity: on ? 1 : 0, transition: reduce ? 'none' : 'opacity .45s ease' }} />
              {item.isPremium && <PremiumTag style={{ top: 10, left: 10 }} />}

              <div
                style={{
                  position: 'absolute', left: 0, bottom: 0, width: 420, maxWidth: '100%', padding: '0 26px 24px',
                  display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
                  opacity: on ? 1 : 0, transform: on || reduce ? 'translateY(0)' : 'translateY(12px)',
                  transition: reduce ? 'none' : `opacity .35s ease ${on ? '.25s' : '0s'}, transform .65s ${ease} ${on ? '.2s' : '0s'}`,
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
                {/* Nút Xem ngay: cùng kiểu Billboard — nền trắng, phim Premium thì gradient vàng */}
                <span
                  className="hsl-acc-cta"
                  style={{
                    alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6,
                    padding: '11px 28px', borderRadius: 8, fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700,
                    background: item.isPremium ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : '#ffffff',
                    color: item.isPremium ? '#1c1400' : '#000000',
                    boxShadow: item.isPremium ? '0 4px 16px rgba(251,191,36,0.35)' : 'none',
                    pointerEvents: on ? 'auto' : 'none',
                  }}
                >
                  {item.isPremium
                    ? <Crown size={15} fill="#1c1400" color="#1c1400" />
                    : <Play size={16} fill="currentColor" strokeWidth={0} />}
                  Xem ngay
                </span>
              </div>
              <span style={{ position: 'absolute', left: 0, bottom: 0, height: 3, width: on ? '100%' : 0, background: accent, transition: reduce ? 'none' : `width .65s ${ease}` }} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}