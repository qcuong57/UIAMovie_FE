// src/components/ui/SearchShimmer.jsx
import React from "react";
import { C } from "../../context/homeTokens";

/**
 * SearchShimmer — skeleton loading cho dropdown tìm kiếm.
 * Hiển thị section phim + section diễn viên với hiệu ứng shimmer.
 *
 * @param {number} movieRows   - Số hàng phim skeleton (mặc định 3)
 * @param {number} actorRows   - Số hàng diễn viên skeleton (mặc định 2)
 * @param {boolean} showActors - Có hiển thị phần diễn viên không (mặc định true)
 */

const shimmerKeyframes = `
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
`;

const shimmerBg = (opacity = 1) => ({
  background: `linear-gradient(
    90deg,
    rgba(255,255,255,${0.04 * opacity}) 0%,
    rgba(255,255,255,${0.09 * opacity}) 40%,
    rgba(255,255,255,${0.04 * opacity}) 80%
  )`,
  backgroundSize: "400px 100%",
  animation: "shimmer 1.4s ease-in-out infinite",
  borderRadius: 4,
});

const SectionLabel = ({ label }) => (
  <div style={{
    padding: "8px 16px 4px",
    display: "flex",
    alignItems: "center",
    gap: 8,
  }}>
    {/* Shimmer label block */}
    <div style={{ width: 80, height: 9, borderRadius: 3, ...shimmerBg(0.7) }} />
  </div>
);

const MovieShimmerRow = ({ opacity }) => (
  <div style={{
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: "8px 16px",
    opacity,
  }}>
    {/* Poster */}
    <div style={{
      width: 38, height: 54,
      borderRadius: 6,
      flexShrink: 0,
      ...shimmerBg(),
    }} />
    {/* Text */}
    <div style={{ flex: 1 }}>
      <div style={{ height: 11, width: "64%", marginBottom: 7, ...shimmerBg() }} />
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <div style={{ height: 9, width: 28, ...shimmerBg(0.6) }} />
        <div style={{ height: 9, width: 24, ...shimmerBg(0.5) }} />
        <div style={{ height: 9, width: 44, borderRadius: 3, ...shimmerBg(0.4) }} />
      </div>
    </div>
  </div>
);

const ActorShimmerRow = ({ opacity }) => (
  <div style={{
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: "8px 16px",
    opacity,
  }}>
    {/* Avatar circle */}
    <div style={{
      width: 38, height: 38,
      borderRadius: "50%",
      flexShrink: 0,
      ...shimmerBg(),
    }} />
    {/* Text */}
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <div style={{ height: 11, width: "50%", ...shimmerBg() }} />
        <div style={{ height: 14, width: 52, borderRadius: 3, ...shimmerBg(0.5) }} />
      </div>
      <div style={{ height: 9, width: "40%", ...shimmerBg(0.5) }} />
    </div>
  </div>
);

const Divider = () => (
  <div style={{
    margin: "4px 16px",
    height: 1,
    background: C.border,
    borderRadius: 1,
  }} />
);

const SearchShimmer = ({
  movieRows  = 3,
  actorRows  = 2,
  showActors = true,
}) => {
  const movieOpacities = Array.from({ length: movieRows }, (_, i) =>
    +(1 - i * (0.3 / Math.max(movieRows - 1, 1))).toFixed(2)
  );
  const actorOpacities = Array.from({ length: actorRows }, (_, i) =>
    +(1 - i * (0.3 / Math.max(actorRows - 1, 1))).toFixed(2)
  );

  return (
    <>
      <style>{shimmerKeyframes}</style>

      {/* Movies section */}
      <SectionLabel label="Danh sách phim" />
      {movieOpacities.map((op, i) => (
        <MovieShimmerRow key={`m-${i}`} opacity={op} />
      ))}

      {/* Actors section */}
      {showActors && (
        <>
          <Divider />
          <SectionLabel label="Diễn viên" />
          {actorOpacities.map((op, i) => (
            <ActorShimmerRow key={`a-${i}`} opacity={op} />
          ))}
        </>
      )}
    </>
  );
};

export default SearchShimmer;