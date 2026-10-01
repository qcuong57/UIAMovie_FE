// src/components/movie/shared/review/RatingDistribution.jsx
import React from "react";
import { motion } from "framer-motion";
import { C } from "../../../context/homeTokens";

// ── RatingDistribution ─────────────────────────────────────────────────────
const RatingDistribution = ({ distribution = {} }) => {
  const max = Math.max(...Object.values(distribution), 1);
  return (
    <div
      role="list"
      aria-label="Phân bố điểm đánh giá"
      style={{ display: "flex", flexDirection: "column", gap: 6 }}
    >
      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => {
        const count = distribution[n] || 0;
        const pct = count > 0 ? Math.max(4, (count / max) * 100) : 0; // có điểm thì luôn thấy thanh
        return (
          <div
            key={n}
            role="listitem"
            className="rv-dist"
            title={`${count} đánh giá ${n} điểm`}
          >
            <span className="rv-dist-n">{n}</span>
            <div className="rv-dist-track">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{
                  height: "100%",
                  borderRadius: 3,
                  background: C.gold,
                  opacity: 0.9,
                }}
              />
            </div>
            <span className="rv-dist-c">{count}</span>
          </div>
        );
      })}
    </div>
  );
};

export default RatingDistribution;
