// src/components/movie/shared/review/ReviewSkeleton.jsx
import React from "react";
import Skeleton from "../ui/Skeleton";

// ── ReviewSkeleton ─────────────────────────────────────────────────────────
const ReviewSkeleton = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 14,
      paddingTop: 18,
    }}
  >
    {[1, 2, 3].map((i) => (
      <Skeleton
        key={i}
        h={84}
        r={12}
        style={{
          background:
            "linear-gradient(90deg, #141414 25%, #1e1e1e 50%, #141414 75%)",
          backgroundSize: "200% 100%",
          animation: "rv-shimmer 1.4s linear infinite",
        }}
      />
    ))}
  </div>
);

export default ReviewSkeleton;
