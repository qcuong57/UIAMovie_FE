// src/components/admin/dashboard/ContentCard.jsx
import React, { useMemo, useState } from "react";
import { T, ACCENT, ACCENT4, MISSING_TAGS, FONT_BODY as FONT, FONT_TITLE } from "../../../context/adminTokens";
import { getYear } from "../../../helper/format";
import { showStatusLabel } from "../../../helper/dashboardStats";
import { Card, Paginated } from "./Card";

const RANK_COLORS = ["#D97706", "#71717A", "#92400E"];
const RECENT_LIMIT = 30;

const chip = {
  fontFamily: FONT, fontSize: 10.5, padding: "1px 6px", borderRadius: 99,
  background: T.bg, border: `1px solid ${T.border}`, color: T.textSub,
};

// ── Poster nhỏ ────────────────────────────────────────────────────────────────
const Thumb = ({ url, fallback }) => (
  <div style={{
    width: 32, height: 46, borderRadius: 6, overflow: "hidden", flexShrink: 0,
    background: fallback, border: `1px solid ${T.border}`,
  }}>
    {url && <img src={url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
  </div>
);

const Row = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
    {children}
  </div>
);

const Title = ({ children }) => (
  <p style={{
    fontFamily: FONT_TITLE, fontSize: 13, fontWeight: 700, color: T.text, margin: "0 0 3px",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  }}>
    {children}
  </p>
);

// ── Tag thiếu dữ liệu ─────────────────────────────────────────────────────────
export const MissingBadge = ({ item }) => {
  const tags = Object.entries(MISSING_TAGS).filter(([key]) => item[key]);
  if (!tags.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {tags.map(([key, t]) => (
        <span key={key} style={{
          fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: t.color,
          padding: "1px 7px", borderRadius: 99, background: t.bg, border: `1px solid ${t.border}`,
        }}>
          {t.label}
        </span>
      ))}
    </div>
  );
};

// ── Một dòng nội dung ─────────────────────────────────────────────────────────
export const ContentRow = ({ item, badge, badgeColor, isShow }) => {
  const date = item.releaseDate ?? item.firstAirDate;
  return (
    <Row>
      <Thumb url={item.posterUrl} fallback={isShow ? "#FEF3C7" : T.accentLight} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Title>{item.title ?? item.name}</Title>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {item.rating != null && (
            <span style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 700, color: T.gold }}>
              ★ {typeof item.rating === "number" ? item.rating.toFixed(1) : item.rating}
            </span>
          )}
          {date && <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>{getYear(date)}</span>}
          {item.originCountry && <span style={chip}>{item.originCountry}</span>}
          {isShow && item.status && (
            <span style={{ ...chip, color: ACCENT4, background: "#FEF3C7", border: "1px solid #FDE68A" }}>
              {showStatusLabel(item.status)}
            </span>
          )}
          {isShow && item.numberOfSeasons != null && (
            <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>{item.numberOfSeasons} mùa</span>
          )}
        </div>
        {/* Chỉ item từ API trending mới có views30d → admin thấy số liệu thật đằng sau thứ hạng */}
        {item.views30d != null && (
          <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, margin: "3px 0 0" }}>
            {item.views7d ?? 0} lượt / 7 ngày · {item.views30d} lượt / 30 ngày
          </p>
        )}
      </div>
      {badge && (
        <span style={{
          fontFamily: FONT, fontSize: 11, fontWeight: 700, flexShrink: 0,
          color: badgeColor ?? ACCENT, padding: "2px 8px", borderRadius: 99,
          background: badgeColor ? `${badgeColor}18` : T.accentLight,
          border: `1px solid ${badgeColor ? `${badgeColor}30` : "#c6e8d5"}`,
        }}>
          {badge}
        </span>
      )}
    </Row>
  );
};

const MissingRow = ({ item }) => (
  <Row>
    <Thumb url={item.posterUrl} fallback={item._missingPoster ? "#fecaca" : T.bg} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <Title>{item.title ?? item.name}</Title>
      <MissingBadge item={item} />
    </div>
  </Row>
);

// ── Thẻ Phim / TV Show ────────────────────────────────────────────────────────
export const ContentCard = ({ title, items, trending: trendingRaw, missing, loading, error, onRetry, isShow }) => {
  const [tab, setTab] = useState("recent");

  // BE bù các mục "chỗ trống" với trendingScore = 0 cho đủ danh sách → không gắn hạng cho nội dung chưa có view.
  const trending = useMemo(() => trendingRaw.filter((x) => (x.trendingScore ?? 1) > 0), [trendingRaw]);

  const recent = useMemo(() => {
    const time = (x) => new Date(x.releaseDate ?? x.firstAirDate ?? 0).getTime();
    return [...items].sort((a, b) => time(b) - time(a)).slice(0, RECENT_LIMIT);
  }, [items]);

  const lists = { recent, trending, missing };

  return (
    <Card
      title={title}
      loading={loading}
      error={error}
      onRetry={onRetry}
      skeletonRows={6}
      tabs={[
        { key: "recent", label: "Mới nhất", count: recent.length },
        { key: "trending", label: "Trending", count: trending.length },
        { key: "missing", label: "Thiếu dữ liệu", count: missing.length },
      ]}
      activeTab={tab}
      onTabChange={setTab}
    >
      <Paginated
        key={tab}
        items={lists[tab]}
        pageSize={6}
        emptyText={tab === "missing" ? "Không có nội dung nào thiếu dữ liệu" : undefined}
        renderItem={(item, i, rank) =>
          tab === "missing" ? (
            <MissingRow key={item.id ?? i} item={item} />
          ) : (
            <ContentRow
              key={item.id ?? i}
              item={item}
              isShow={isShow}
              badge={tab === "trending" ? `#${rank + 1}` : undefined}
              badgeColor={tab === "trending" ? RANK_COLORS[rank] : undefined}
            />
          )
        }
      />
    </Card>
  );
};
