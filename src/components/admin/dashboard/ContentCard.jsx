// src/components/admin/dashboard/ContentCard.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { T, ACCENT, ACCENT4, MISSING_TAGS, FONT_BODY as FONT, FONT_TITLE } from '../../../context/adminTokens';
import { getYear } from '../../../helper/format';
import { Spin } from './DashboardPrimitives';
import { Card, Paginated } from './Card';

const TRENDING_COLORS = ['#D97706', '#71717A', '#92400E'];

// ── Missing Asset Badges ───────────────────────────────────────────────────────
export const MissingBadge = ({ item }) => {
  const tags = Object.entries(MISSING_TAGS).filter(([key]) => item[key]);
  if (!tags.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 3 }}>
      {tags.map(([key, t]) => (
        <span key={key} style={{
          fontFamily: FONT, fontSize: 9.5, fontWeight: 700, color: t.color,
          padding: '1px 6px', borderRadius: 99, background: t.bg,
          border: `1px solid ${t.border}`,
        }}>
          {t.label}
        </span>
      ))}
    </div>
  );
};

// ── Single Content Row ─────────────────────────────────────────────────────────
export const ContentRow = ({ item, index, badge, badgeColor, isShow }) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.04 + index * 0.03 }}
    style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 0', borderBottom: `1px solid ${T.border}`,
    }}
  >
    {/* Poster thumbnail */}
    <div style={{
      width: 30, height: 44, borderRadius: 6, overflow: 'hidden',
      background: T.bg, flexShrink: 0, border: `1px solid ${T.border}`,
    }}>
      {item.posterUrl
        ? <img src={item.posterUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', background: isShow ? '#FEF3C7' : T.accentLight }} />
      }
    </div>

    {/* Info */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{
        fontFamily: FONT_TITLE, fontSize: 12.5, fontWeight: 700, color: T.text,
        marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {item.title ?? item.name}
      </p>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
        {item.rating != null && (
          <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.gold }}>
            ★ {typeof item.rating === 'number' ? item.rating.toFixed(1) : item.rating}
          </span>
        )}
        {(item.releaseDate || item.firstAirDate) && (
          <span style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted }}>
            {getYear(item.releaseDate ?? item.firstAirDate)}
          </span>
        )}
        {item.originCountry && (
          <span style={{
            fontFamily: FONT, fontSize: 10, color: T.textSub,
            padding: '1px 5px', borderRadius: 99,
            background: T.bg, border: `1px solid ${T.border}`,
          }}>
            {item.originCountry}
          </span>
        )}
        {isShow && item.status && (
          <span style={{
            fontFamily: FONT, fontSize: 10, color: ACCENT4,
            padding: '1px 5px', borderRadius: 99,
            background: '#FEF3C7', border: '1px solid #FDE68A',
          }}>
            {item.status === 'Returning Series' ? 'Đang chiếu'
              : item.status === 'Ended' ? 'Đã kết thúc'
              : item.status}
          </span>
        )}
        {isShow && item.numberOfSeasons != null && (
          <span style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted }}>
            {item.numberOfSeasons} mùa
          </span>
        )}
      </div>
    </div>

    {/* Optional rank badge */}
    {badge && (
      <span style={{
        fontFamily: FONT, fontSize: 10.5, fontWeight: 700,
        color: badgeColor ?? ACCENT,
        padding: '2px 7px', borderRadius: 99, flexShrink: 0,
        background: badgeColor ? `${badgeColor}18` : T.accentLight,
        border: `1px solid ${badgeColor ? `${badgeColor}30` : '#c6e8d5'}`,
      }}>
        {badge}
      </span>
    )}
  </motion.div>
);

// ── Content Card (Movies or TV Shows panel) ────────────────────────────────────
export const ContentCard = ({ title, items, trending, missing, loading, isShow }) => {
  const [tab, setTab] = useState('recent');

  const recentItems = [...items].sort((a, b) => {
    const da = new Date(a.releaseDate ?? a.firstAirDate ?? 0);
    const db = new Date(b.releaseDate ?? b.firstAirDate ?? 0);
    return db - da;
  }).slice(0, 30);

  const tabContent = { recent: recentItems, trending, missing };

  return (
    <Card
      title={title}
      noPad
      tabs={[
        { key: 'recent',   label: 'Mới nhất',      count: recentItems.length },
        { key: 'trending', label: 'Trending',       count: trending.length    },
        { key: 'missing',  label: 'Thiếu dữ liệu', count: missing.length     },
      ]}
      activeTab={tab}
      onTabChange={setTab}
    >
      <div style={{ padding: '4px 20px 12px' }}>
        {loading ? <Spin /> : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {tab === 'missing' ? (
                <Paginated
                  items={missing}
                  pageSize={6}
                  renderItem={(item, i) => (
                    <div key={item.id ?? i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '9px 0', borderBottom: `1px solid ${T.border}`,
                    }}>
                      <div style={{
                        width: 28, height: 40, borderRadius: 5, flexShrink: 0,
                        background: item._missingPoster ? '#fef2f2' : T.bg,
                        border: `1px solid ${item._missingPoster ? '#fecaca' : T.border}`,
                        overflow: 'hidden',
                      }}>
                        {item.posterUrl
                          ? <img src={item.posterUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', background: '#fecaca' }} />
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontFamily: FONT_TITLE, fontSize: 12.5, fontWeight: 700, color: T.text,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4,
                        }}>
                          {item.title ?? item.name}
                        </p>
                        <MissingBadge item={item} />
                      </div>
                    </div>
                  )}
                />
              ) : (
                <Paginated
                  items={tabContent[tab]}
                  pageSize={6}
                  renderItem={(item, i) => (
                    <ContentRow
                      key={item.id ?? i}
                      item={item}
                      index={i}
                      isShow={isShow}
                      badge={tab === 'trending' ? `#${tabContent[tab].indexOf(item) + 1}` : undefined}
                      badgeColor={tab === 'trending' ? TRENDING_COLORS[i] : undefined}
                    />
                  )}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </Card>
  );
};