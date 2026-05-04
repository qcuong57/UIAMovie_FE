// src/components/movie/ui/SidebarRelatedList.jsx
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { C } from "./movieConstants";

/**
 * SidebarRelatedList — block "Có thể bạn thích" trong sidebar.
 *
 * Props:
 *   items        — Array<{ id, title, year?, rating?, posterUrl? }>
 *   getPath      — fn(item) => navigate path (vd: `/movie/${id}` hoặc `/tvshow/${id}`)
 *   emptyIcon    — emoji hiển thị khi poster null (default "🎬")
 *   title        — tiêu đề uppercase (default "Có thể bạn thích")
 *   limit        — số item tối đa (default 5)
 */
const SidebarRelatedList = ({
  items,
  getPath,
  emptyIcon = "🎬",
  title = "Có thể bạn thích",
  limit = 5,
}) => {
  const navigate = useNavigate();

  if (!items?.length) return null;

  return (
    <div>
      <p
        style={{
          fontFamily: "'Nunito',sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: C.textDim,
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        {title}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.slice(0, limit).map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ x: 3 }}
            onClick={() => navigate(getPath(item))}
            style={{
              display: "flex",
              gap: 10,
              cursor: "pointer",
              alignItems: "center",
            }}
          >
            {/* Poster */}
            <div
              style={{
                width: 60,
                height: 85,
                borderRadius: 6,
                overflow: "hidden",
                background: C.surfaceMid,
                flexShrink: 0,
              }}
            >
              {item.posterUrl ? (
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  {emptyIcon}
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontFamily: "'Nunito',sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: C.text,
                  marginBottom: 4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.title}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {item.rating && (
                  <>
                    <Star
                      size={10}
                      style={{ fill: C.gold, color: C.gold, flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontFamily: "'Nunito',sans-serif",
                        fontSize: 11,
                        color: C.gold,
                      }}
                    >
                      {item.rating.toFixed(1)}
                    </span>
                  </>
                )}
                {item.year && (
                  <span
                    style={{
                      fontFamily: "'Nunito',sans-serif",
                      fontSize: 11,
                      color: C.textDim,
                    }}
                  >
                    {item.year}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SidebarRelatedList;