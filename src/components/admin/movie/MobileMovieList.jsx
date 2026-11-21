// src/components/admin/movie/MobileMovieList.jsx
// Danh sách phim dạng thẻ cho mobile (< 768px) — tương ứng MobileUserList bên admin user.
import React from "react";
import { Star, Eye, Pencil, Trash2, Video } from "lucide-react";
import { T, FONT_BODY as FONT } from "../../../context/adminTokens";
import {
  SpinnerLight,
  PremiumBadge,
  UpcomingBadge,
  PremiumToggle,
  ActionBtn,
  COUNTRY_FLAG,
  fmtReleaseDate,
} from "./movieAdminParts";

function MovieCard({
  m,
  premiumPending,
  onTogglePremium,
  onUpload,
  onDetail,
  onEdit,
  onDelete,
}) {
  const release = m.isUpcoming ? fmtReleaseDate(m.releaseDate) : null;

  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        boxShadow: T.shadow,
        overflow: "hidden",
      }}
    >
      {/* Phần trên: bấm để xem chi tiết */}
      <div
        onClick={() => onDetail(m)}
        style={{
          display: "flex",
          gap: 12,
          padding: 12,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 52,
            height: 76,
            borderRadius: 8,
            overflow: "hidden",
            background: T.bg,
            flexShrink: 0,
            border: `1px solid ${T.border}`,
          }}
        >
          {m.posterUrl && (
            <img
              src={m.posterUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 14,
              fontWeight: 600,
              color: T.text,
              lineHeight: 1.35,
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              wordBreak: "break-word",
            }}
          >
            {m.title}
          </p>

          {(m.isUpcoming || m.isPremium) && (
            <div
              style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 5 }}
            >
              {m.isUpcoming && <UpcomingBadge />}
              {m.isPremium && <PremiumBadge />}
            </div>
          )}

          {/* Rating · Năm · Quốc gia */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "4px 12px",
              marginTop: 6,
              fontFamily: FONT,
              fontSize: 12.5,
              color: T.textSub,
            }}
          >
            {m.rating ? (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Star size={11} style={{ fill: T.gold, color: T.gold }} />
                <b style={{ color: T.gold }}>{Number(m.rating).toFixed(1)}</b>
              </span>
            ) : null}
            {m.year && (
              <span>
                {m.year}
                {release && (
                  <span style={{ color: "#3B82F6", marginLeft: 5, fontSize: 11 }}>
                    ({release})
                  </span>
                )}
              </span>
            )}
            {m.originCountry && (
              <span>
                {COUNTRY_FLAG[m.originCountry] ?? "🌐"} {m.originCountry}
              </span>
            )}
          </div>

          {/* Thể loại */}
          {m.genres?.length > 0 && (
            <div
              style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 7 }}
            >
              {m.genres.slice(0, 3).map((g) => (
                <span
                  key={g}
                  style={{
                    fontFamily: FONT,
                    fontSize: 11,
                    color: T.textSub,
                    padding: "2px 8px",
                    borderRadius: 5,
                    border: `1px solid ${T.border}`,
                    background: T.surfaceAlt,
                  }}
                >
                  {g}
                </span>
              ))}
              {m.genres.length > 3 && (
                <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted }}>
                  +{m.genres.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Phần dưới: Premium + thao tác */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "10px 12px",
          borderTop: `1px solid ${T.border}`,
          background: T.surfaceAlt,
        }}
      >
        <PremiumToggle
          isPremium={!!m.isPremium}
          loading={premiumPending}
          onClick={() => onTogglePremium(m)}
        />
        <div style={{ display: "flex", gap: 6 }}>
          <ActionBtn
            color="#16A34A"
            bg="#F0FDF4"
            border="rgba(22,163,74,0.2)"
            title="Upload video"
            onClick={() => onUpload(m)}
          >
            <Video size={14} />
          </ActionBtn>
          <ActionBtn
            color={T.textSub}
            bg={T.surface}
            border={T.border}
            title="Xem chi tiết"
            onClick={() => onDetail(m)}
          >
            <Eye size={14} />
          </ActionBtn>
          <ActionBtn
            color={T.blue}
            bg="rgba(37,99,235,0.07)"
            border="rgba(37,99,235,0.2)"
            title="Chỉnh sửa"
            onClick={() => onEdit(m)}
          >
            <Pencil size={14} />
          </ActionBtn>
          <ActionBtn
            color={T.red}
            bg="#FEF2F2"
            border="rgba(220,38,38,0.2)"
            title="Xóa phim"
            onClick={() => onDelete(m)}
          >
            <Trash2 size={14} />
          </ActionBtn>
        </div>
      </div>
    </div>
  );
}

export default function MobileMovieList({
  loading,
  movies,
  pendingPremiumIds,
  onTogglePremium,
  onUpload,
  onDetail,
  onEdit,
  onDelete,
}) {
  if (loading) {
    return (
      <div style={{ padding: "56px 0", textAlign: "center" }}>
        <SpinnerLight />
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div
        style={{
          padding: "48px 0",
          textAlign: "center",
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 14,
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎬</div>
        <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>
          Không tìm thấy phim
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {movies.map((m) => (
        <MovieCard
          key={m.id}
          m={m}
          premiumPending={pendingPremiumIds.includes(m.id)}
          onTogglePremium={onTogglePremium}
          onUpload={onUpload}
          onDetail={onDetail}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}