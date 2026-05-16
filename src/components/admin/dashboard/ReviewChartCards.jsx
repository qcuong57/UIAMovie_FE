// src/components/admin/dashboard/ReviewChartCards.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

import {
  T, ACCENT, ACCENT3, ACCENT4, FONT_BODY as FONT, FONT_TITLE,
} from '../../../context/adminTokens';

import { ChartTooltip, StarDisplay, GenreDonut } from './ChartComponents';
import { Spin, Empty } from './DashboardPrimitives';
import { Card, Paginated } from './Card';
import { ReviewRow } from './ReviewRow';

// ── Review Trend Line Chart ────────────────────────────────────────────────────
export const ReviewTrendCard = ({ movieReviewTrend, loading }) => {
  const tick = { fontFamily: FONT, fontSize: 9.5, fill: T.textMuted };
  return (
    <Card title="Xu hướng đánh giá" subtitle="Phim vs TV Shows — 6 tháng gần nhất">
      {loading ? (
        <Spin />
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart
            data={movieReviewTrend}
            margin={{ top: 8, right: 4, left: -28, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
            <XAxis dataKey="month" tick={tick} axisLine={false} tickLine={false} />
            <YAxis tick={tick} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              iconSize={8} iconType="circle"
              wrapperStyle={{ fontFamily: FONT, fontSize: 11, paddingTop: 8 }}
            />
            <Line
              type="monotone" dataKey="movie" name="Phim"
              stroke={ACCENT} strokeWidth={2.5}
              dot={{ r: 3, fill: ACCENT }} activeDot={{ r: 5 }}
            />
            <Line
              type="monotone" dataKey="tvshow" name="TV Show"
              stroke={ACCENT4} strokeWidth={2.5}
              dot={{ r: 3, fill: ACCENT4 }} activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

// ── Rating Distribution Bar Card ───────────────────────────────────────────────
export const RatingDistCard = ({ ratingDist, reviews, positiveRatio, loading }) => (
  <Card title="Phân bố số sao">
    {loading ? (
      <Spin />
    ) : (
      <div style={{ paddingTop: 4 }}>
        {ratingDist.map(({ label, value, star }) => {
          const pct      = Math.round((value / (reviews.length || 1)) * 100);
          const barColor = star >= 4 ? ACCENT : star === 3 ? ACCENT3 : '#DC2626';
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textSub,
                width: 32, flexShrink: 0, textAlign: 'right', whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
              <div style={{ flex: 1, height: 8, borderRadius: 99, background: T.bg, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: 99, background: barColor }}
                />
              </div>
              <span style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, width: 30, textAlign: 'right' }}>
                {value}
              </span>
            </div>
          );
        })}

        {/* Sentiment summary badge */}
        <div style={{
          marginTop: 12, padding: '8px 10px', borderRadius: 8,
          background: positiveRatio >= 70 ? T.accentLight : positiveRatio >= 50 ? '#E0F2FE' : '#FEF2F2',
          border: `1px solid ${positiveRatio >= 70 ? '#c6e8d5' : positiveRatio >= 50 ? '#BAE6FD' : '#FECACA'}`,
        }}>
          <p style={{
            fontFamily: FONT, fontSize: 11, fontWeight: 700, margin: 0,
            color: positiveRatio >= 70 ? ACCENT : positiveRatio >= 50 ? ACCENT3 : '#DC2626',
          }}>
            {positiveRatio >= 70 ? 'Phản hồi rất tốt' : positiveRatio >= 50 ? 'Phản hồi trung bình' : 'Cần cải thiện'}
          </p>
          <p style={{ fontFamily: FONT, fontSize: 10, color: T.textMuted, margin: '2px 0 0' }}>
            {positiveRatio}% đánh giá tích cực
          </p>
        </div>
      </div>
    )}
  </Card>
);

// ── Sentiment Donut Card ───────────────────────────────────────────────────────
export const SentimentDonutCard = ({ positiveReviews, negativeReviews, totalReviews, loading }) => (
  <Card title="Sentiment tổng quan">
    {loading ? (
      <Spin />
    ) : (
      <GenreDonut
        slices={[
          { label: `Tích cực (${positiveReviews})`,                                  value: positiveReviews,                                  color: ACCENT      },
          { label: `Trung bình (${totalReviews - positiveReviews - negativeReviews})`, value: totalReviews - positiveReviews - negativeReviews,  color: ACCENT3     },
          { label: `Tiêu cực (${negativeReviews})`,                                   value: negativeReviews,                                  color: '#DC2626'   },
        ].filter((s) => s.value > 0)}
      />
    )}
  </Card>
);

// ── Recent Reviews Card (tabbed: movie / tvshow / all) ────────────────────────
export const ReviewListCard = ({
  movieReviews, tvReviews, enrichedReviews,
  reviewTab, setReviewTab, loading,
}) => {
  const tabItems = {
    movie:  movieReviews,
    tvshow: tvReviews,
    all:    enrichedReviews,
  };

  return (
    <Card
      title="Đánh giá gần đây"
      noPad
      tabs={[
        { key: 'movie',  label: 'Phim',    count: movieReviews.length   },
        { key: 'tvshow', label: 'TV Show', count: tvReviews.length      },
        { key: 'all',    label: 'Tất cả',  count: enrichedReviews.length },
      ]}
      activeTab={reviewTab}
      onTabChange={setReviewTab}
    >
      <div style={{ padding: '4px 20px 12px' }}>
        {loading ? (
          <Spin />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={reviewTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {(() => {
                const sorted = [...tabItems[reviewTab]].sort(
                  (a, b) =>
                    new Date(b.createdAt ?? b.reviewDate ?? 0) -
                    new Date(a.createdAt ?? a.reviewDate ?? 0),
                );
                return (
                  <Paginated
                    items={sorted}
                    pageSize={5}
                    renderItem={(r, i) => (
                      <ReviewRow
                        key={r.id ?? i}
                        review={r}
                        index={i}
                        type={reviewTab === 'tvshow' || r.tvShowId ? 'tvshow' : 'movie'}
                      />
                    )}
                  />
                );
              })()}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </Card>
  );
};

// ── Top Reviewed Card ─────────────────────────────────────────────────────────
export const TopReviewedCard = ({
  topReviewedMovies, topReviewedShows, reviewTab, setReviewTab, loading,
}) => {
  const isShowTab = reviewTab === 'tvshow';
  const list      = isShowTab ? topReviewedShows : topReviewedMovies;
  const accentCol = isShowTab ? ACCENT4 : ACCENT;

  return (
    <Card
      title="Được đánh giá nhiều nhất"
      noPad
      tabs={[
        { key: 'movies', label: 'Phim',    count: topReviewedMovies.length },
        { key: 'shows',  label: 'TV Show', count: topReviewedShows.length  },
      ]}
      activeTab={isShowTab ? 'shows' : 'movies'}
      onTabChange={(v) => setReviewTab(v === 'shows' ? 'tvshow' : 'movie')}
    >
      <div style={{ padding: '4px 20px 12px' }}>
        {loading ? (
          <Spin />
        ) : list.length > 0 ? (
          list.map((item, i) => (
            <motion.div
              key={item.id ?? i}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 0', borderBottom: `1px solid ${T.border}`,
              }}
            >
              <span style={{
                fontFamily: FONT_TITLE, fontSize: 13, fontWeight: 800,
                color: i < 3 ? accentCol : T.textMuted,
                width: 18, textAlign: 'center', flexShrink: 0,
              }}>
                {i + 1}
              </span>
              {item.posterUrl ? (
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  style={{
                    width: 30, height: 44, objectFit: 'cover',
                    borderRadius: 4, flexShrink: 0,
                    border: `1px solid ${T.border}`,
                  }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div style={{
                  width: 30, height: 44, borderRadius: 4, flexShrink: 0,
                  background: T.bgSub, border: `1px solid ${T.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>
                  🎬
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: FONT_TITLE, fontSize: 12, fontWeight: 700, color: T.text,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0,
                }}>
                  {item.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <StarDisplay rating={Number(item.avg)} size={10} />
                  <span style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: '#F59E0B' }}>
                    {item.avg}
                  </span>
                </div>
              </div>
              <span style={{
                fontFamily: FONT, fontSize: 10.5, fontWeight: 700, flexShrink: 0,
                color: accentCol, background: `${accentCol}15`,
                padding: '2px 7px', borderRadius: 99,
                border: `1px solid ${accentCol}30`,
              }}>
                {item.count} rv
              </span>
            </motion.div>
          ))
        ) : (
          <Empty text="Chưa có đánh giá" />
        )}
      </div>
    </Card>
  );
};