// src/components/admin/dashboard/ReviewRow.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { T, ACCENT, ACCENT3, ACCENT4, FONT_BODY as FONT, FONT_TITLE } from '../../../context/adminTokens';
import { fmtDate } from '../../../helper/format';
import { StarDisplay } from './ChartComponents';

// API rating scale: 1–10
// >= 7 → tốt, >= 5 → trung bình, < 5 → tiêu cực
const SENTIMENT_STYLE = {
  positive: { color: ACCENT,    bg: '#EAF5EF',  label: 'Tốt'        },
  neutral:  { color: ACCENT3,   bg: '#E0F2FE',  label: 'Trung bình' },
  negative: { color: '#DC2626', bg: '#FEF2F2',  label: 'Tiêu cực'   },
};

const getSentiment = (rating) =>
  rating >= 7 ? 'positive' : rating >= 5 ? 'neutral' : 'negative';

export const ReviewRow = ({ review, index, type }) => {
  const stars     = review.rating ?? review.score ?? review.stars ?? 0;
  const sentiment = getSentiment(stars);
  const sStyle    = SENTIMENT_STYLE[sentiment];

  // Title: prefer enriched fields injected by dashboard, then fallbacks
  const title     = review.movieTitle ?? review.tvShowTitle ?? review.contentTitle ?? review.title ?? '—';
  // Poster: prefer enriched posterUrl injected by dashboard
  const poster    = review.posterUrl ?? null;

  const user      = review.username ?? review.userName ?? review.user?.username ?? 'Ẩn danh';
  const typeColor = type === 'tvshow' ? ACCENT4 : ACCENT;

  // Comment field: reviewText (API) or comment (legacy)
  const comment   = review.reviewText ?? review.comment ?? null;

  // StarDisplay expects 1–5; API sends 1–10 → scale down for star rendering
  const starsFor5 = stars / 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 + index * 0.025 }}
      style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {/* Type colour bar */}
        <div style={{
          width: 4, height: poster ? 52 : 40, borderRadius: 4,
          background: typeColor, flexShrink: 0, marginTop: 2,
        }} />

        {/* Poster thumbnail */}
        {poster && (
          <img
            src={poster}
            alt={title}
            style={{
              width: 34, height: 52, objectFit: 'cover',
              borderRadius: 4, flexShrink: 0,
              border: `1px solid ${T.border}`,
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title + stars */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 3 }}>
            <p style={{
              fontFamily: FONT_TITLE, fontSize: 12.5, fontWeight: 700, color: T.text,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, margin: 0,
            }}>
              {title}
            </p>
            {/* Rating badge: show full x/10 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <StarDisplay rating={starsFor5} size={11} />
              <span style={{
                fontFamily: FONT_TITLE, fontSize: 11.5, fontWeight: 700, color: '#F59E0B',
                whiteSpace: 'nowrap',
              }}>
                {Number(stars).toFixed(1)}<span style={{ fontWeight: 400, fontSize: 9.5, color: T.textMuted }}>/10</span>
              </span>
            </div>
          </div>

          {/* Comment excerpt */}
          {comment && (
            <p style={{
              fontFamily: FONT, fontSize: 11, color: T.textSub, lineHeight: 1.5,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
              marginBottom: 4,
            }}>
              "{comment}"
            </p>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: FONT, fontSize: 10, color: T.textMuted }}>👤 {user}</span>
            <span style={{
              fontFamily: FONT, fontSize: 9.5, fontWeight: 700,
              color: sStyle.color, background: sStyle.bg,
              padding: '1px 6px', borderRadius: 99,
            }}>
              {sStyle.label}
            </span>
            {review.isSpoiler && (
              <span style={{
                fontFamily: FONT, fontSize: 9.5, fontWeight: 700,
                color: '#92400E', background: '#FEF3C7',
                padding: '1px 6px', borderRadius: 99,
              }}>
                ⚠ Spoiler
              </span>
            )}
            {type === 'tvshow' && (
              <span style={{
                fontFamily: FONT, fontSize: 9.5, fontWeight: 700,
                color: ACCENT4, background: '#FEF3C7',
                padding: '1px 6px', borderRadius: 99,
              }}>
                TV Show
              </span>
            )}
            {review.episodeLabel && (
              <span style={{
                fontFamily: FONT, fontSize: 9.5,
                color: T.textMuted, background: T.bgSub,
                padding: '1px 6px', borderRadius: 99,
              }}>
                {review.episodeLabel}
              </span>
            )}
            <span style={{ fontFamily: FONT, fontSize: 10, color: T.textMuted, marginLeft: 'auto' }}>
              {fmtDate(review.createdAt ?? review.reviewDate)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};