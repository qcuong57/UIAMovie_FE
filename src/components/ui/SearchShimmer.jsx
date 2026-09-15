// src/components/ui/SearchShimmer.jsx
import React from "react";
import { C } from "../../context/homeTokens";

/* =========================================================
   Cinematic shimmer
========================================================= */

const shimmerKeyframes = `
  @keyframes searchLuxuryShimmer {
    0% {
      background-position: -420px 0;
    }

    100% {
      background-position: 420px 0;
    }
  }

  @keyframes searchLuxuryPulse {
    0%, 100% {
      opacity: 0.48;
    }

    50% {
      opacity: 0.72;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .search-shimmer-item,
    .search-shimmer-block {
      animation: none !important;
    }
  }
`;

/* =========================================================
   Shimmer background
========================================================= */

const shimmerBg = (opacity = 1) => ({
  background: `
    linear-gradient(
      105deg,
      rgba(255,255,255,${0.025 * opacity}) 0%,
      rgba(255,255,255,${0.045 * opacity}) 30%,
      rgba(255,255,255,${0.105 * opacity}) 50%,
      rgba(255,255,255,${0.045 * opacity}) 70%,
      rgba(255,255,255,${0.025 * opacity}) 100%
    )
  `,
  backgroundSize: "420px 100%",
  animation:
    "searchLuxuryShimmer 1.65s cubic-bezier(.4,0,.2,1) infinite",
});

/* =========================================================
   Section header
========================================================= */

const SectionLabel = ({ label }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "13px 18px 7px",
    }}
  >
    <div
      style={{
        width: 2,
        height: 11,
        borderRadius: 2,
        background: "rgba(255,255,255,0.10)",
        animation:
          "searchLuxuryPulse 1.8s ease-in-out infinite",
      }}
    />

    <div
      className="search-shimmer-block"
      style={{
        width: label === "Diễn viên" ? 56 : 72,
        height: 8,
        borderRadius: 3,
        ...shimmerBg(0.8),
      }}
    />
  </div>
);

/* =========================================================
   Movie row
========================================================= */

const MovieShimmerRow = ({ opacity, index }) => (
  <div
    className="search-shimmer-item"
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "10px 18px",
      opacity,
      animationDelay: `${index * 70}ms`,
    }}
  >
    {/* Poster */}
    <div
      style={{
        position: "relative",
        width: 48,
        height: 68,
        minWidth: 48,
        borderRadius: 8,
        overflow: "hidden",
        flexShrink: 0,
        ...shimmerBg(),
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.12))",
        }}
      />
    </div>

    {/* Content */}
    <div
      style={{
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        className="search-shimmer-block"
        style={{
          width: `${52 + (index % 3) * 9}%`,
          maxWidth: "72%",
          height: 11,
          marginBottom: 9,
          borderRadius: 3,
          ...shimmerBg(),
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
        }}
      >
        <div
          className="search-shimmer-block"
          style={{
            width: 28,
            height: 7,
            borderRadius: 3,
            ...shimmerBg(0.7),
          }}
        />

        <div
          className="search-shimmer-block"
          style={{
            width: 32,
            height: 7,
            borderRadius: 3,
            ...shimmerBg(0.55),
          }}
        />

        <div
          className="search-shimmer-block"
          style={{
            width: 54,
            height: 7,
            borderRadius: 3,
            ...shimmerBg(0.45),
          }}
        />
      </div>
    </div>
  </div>
);

/* =========================================================
   Actor row
========================================================= */

const ActorShimmerRow = ({ opacity, index }) => (
  <div
    className="search-shimmer-item"
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "10px 18px",
      opacity,
      animationDelay: `${index * 70}ms`,
    }}
  >
    {/* Avatar */}
    <div
      className="search-shimmer-block"
      style={{
        width: 46,
        height: 46,
        minWidth: 46,
        borderRadius: "50%",
        flexShrink: 0,
        ...shimmerBg(),
      }}
    />

    {/* Content */}
    <div
      style={{
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 7,
        }}
      >
        <div
          className="search-shimmer-block"
          style={{
            width: `${42 + (index % 3) * 8}%`,
            maxWidth: "60%",
            height: 10,
            borderRadius: 3,
            ...shimmerBg(),
          }}
        />

        <div
          className="search-shimmer-block"
          style={{
            width: 52,
            height: 13,
            borderRadius: 4,
            ...shimmerBg(0.55),
          }}
        />
      </div>

      <div
        className="search-shimmer-block"
        style={{
          width: `${35 + (index % 2) * 10}%`,
          height: 7,
          borderRadius: 3,
          ...shimmerBg(0.5),
        }}
      />
    </div>
  </div>
);

/* =========================================================
   Divider
========================================================= */

const Divider = () => (
  <div
    style={{
      height: 1,
      margin: "6px 18px",
      background: `linear-gradient(
        90deg,
        transparent,
        ${C.border},
        transparent
      )`,
    }}
  />
);

/* =========================================================
   Main
========================================================= */

const SearchShimmer = ({
  movieRows = 3,
  actorRows = 2,
  showActors = true,
}) => {
  const movieOpacities = Array.from(
    { length: movieRows },
    (_, index) =>
      +(
        1 -
        index * (0.28 / Math.max(movieRows - 1, 1))
      ).toFixed(2)
  );

  const actorOpacities = Array.from(
    { length: actorRows },
    (_, index) =>
      +(
        1 -
        index * (0.28 / Math.max(actorRows - 1, 1))
      ).toFixed(2)
  );

  return (
    <>
      <style>{shimmerKeyframes}</style>

      {/* Movies */}
      <section aria-label="Đang tìm kiếm phim">
        <SectionLabel label="Phim" />

        {movieOpacities.map((opacity, index) => (
          <MovieShimmerRow
            key={`movie-${index}`}
            opacity={opacity}
            index={index}
          />
        ))}
      </section>

      {/* Actors */}
      {showActors && (
        <section aria-label="Đang tìm kiếm diễn viên">
          <Divider />

          <SectionLabel label="Diễn viên" />

          {actorOpacities.map((opacity, index) => (
            <ActorShimmerRow
              key={`actor-${index}`}
              opacity={opacity}
              index={index}
            />
          ))}
        </section>
      )}
    </>
  );
};

export default SearchShimmer;