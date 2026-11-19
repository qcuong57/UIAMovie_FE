// src/components/home/sections/HomeContentCard.jsx
// Thẻ nội dung dùng chung cho các layout tự dựng (grid, banner). Carousel / Ranked dùng lại MovieRow / TopRankedRow.
import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Crown } from 'lucide-react';
import { C, FONT_BODY } from '../../../context/homeTokens';
import { contentPath } from '../../../utils/normalizeHomeCard';

const CSS = `
.hs-card{position:relative;display:block;overflow:hidden;border-radius:10px;background:#16161c;text-decoration:none;
  transition:transform .25s ease, box-shadow .25s ease}
.hs-card:hover,.hs-card:focus-visible{transform:translateY(-4px) scale(1.02);box-shadow:0 12px 28px rgba(0,0,0,.5);outline:none}
.hs-card img{width:100%;height:100%;object-fit:cover;display:block}
`;

const Badge = ({ children, bg, color = '#fff', style }) => (
  <span
    style={{
      position: 'absolute', display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 6, background: bg, color,
      fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', ...style,
    }}
  >
    {children}
  </span>
);

/**
 * variant: 'poster' (2:3) | 'backdrop' (16:9).
 * Backdrop hiện tên + năm đè lên ảnh; poster hiện tên dưới ảnh.
 */
export default function HomeContentCard({ item, variant = 'poster' }) {
  const isBackdrop = variant === 'backdrop';
  const img = isBackdrop ? item.backdropUrl || item.posterUrl : item.posterUrl || item.backdropUrl;

  return (
    <div style={{ minWidth: 0 }}>
      <style>{CSS}</style>
      <Link
        to={contentPath(item)}
        className="hs-card"
        aria-label={item.title}
        style={{ aspectRatio: isBackdrop ? '16 / 9' : '2 / 3' }}
      >
        {img ? (
          <img src={img} alt={item.title} loading="lazy" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: C.textSub, fontFamily: FONT_BODY, fontSize: 12, padding: 8, textAlign: 'center' }}>
            {item.title}
          </div>
        )}

        {item.isPremium && (
          <Badge bg="linear-gradient(135deg,#f5c518,#e08a00)" color="#1a1200" style={{ top: 8, left: 8 }}>
            <Crown size={10} /> PREMIUM
          </Badge>
        )}
        {item.isUpcoming && (
          <Badge bg="rgba(56,189,248,0.9)" color="#04202e" style={{ top: 8, right: 8 }}>SẮP CHIẾU</Badge>
        )}

        {isBackdrop && (
          <div
            style={{
              position: 'absolute', inset: 'auto 0 0 0', padding: '28px 14px 12px',
              background: 'linear-gradient(to top, rgba(0,0,0,.88), transparent)',
            }}
          >
            <p style={{ margin: 0, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
              {item.title}
            </p>
            <p style={{ margin: '3px 0 0', fontFamily: FONT_BODY, fontSize: 11.5, color: 'rgba(255,255,255,.7)' }}>
              {[item.year, item.genres?.[0]].filter(Boolean).join(' · ')}
            </p>
          </div>
        )}
      </Link>

      {!isBackdrop && (
        <div style={{ padding: '8px 2px 0' }}>
          <p
            title={item.title}
            style={{
              margin: 0, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: C.text,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {item.title}
          </p>
          <p style={{ margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT_BODY, fontSize: 11.5, color: C.textSub }}>
            {item.rating > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#f5c518', fontWeight: 700 }}>
                <Star size={11} fill="#f5c518" /> {Number(item.rating).toFixed(1)}
              </span>
            )}
            {item.year && <span>{item.year}</span>}
          </p>
        </div>
      )}
    </div>
  );
}