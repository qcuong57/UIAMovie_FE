// src/components/tvshow/TvShowSidebar.jsx
import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { C, toSlug } from "../ui/movieConstants";

const TvShowSidebar = ({ tvShow, actors, related }) => {
  const navigate = useNavigate();
  const showTitle = tvShow?.title ?? tvShow?.name ?? "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      style={{
        width: 280,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      {/* Poster */}
      {tvShow?.posterUrl && (
        <div style={{ borderRadius: 8, overflow: "hidden" }}>
          <img
            src={tvShow.posterUrl}
            alt={showTitle}
            style={{ width: "100%", display: "block" }}
          />
        </div>
      )}

      {/* Diễn viên */}
      {actors.length > 0 && (
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
            Diễn viên chính
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {actors.slice(0, 6).map((p, i) => (
              <div
                key={i}
                onClick={() =>
                  p.name &&
                  navigate(`/person/${toSlug(p.name)}`, {
                    state: { actor: p },
                  })
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: p.name ? "pointer" : "default",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    border: "1.5px solid rgba(255,255,255,0.1)",
                    overflow: "hidden",
                    background: C.surfaceMid,
                    flexShrink: 0,
                  }}
                >
                  {p.profileUrl ? (
                    <img
                      src={p.profileUrl}
                      alt={p.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center 15%",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        color: C.textDim,
                        fontFamily: "'Be Vietnam Pro',sans-serif",
                      }}
                    >
                      {p.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: "'Nunito',sans-serif",
                      fontSize: 13,
                      fontWeight: 500,
                      color: C.text,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.name}
                  </p>
                  {p.character && (
                    <p
                      style={{
                        fontFamily: "'Nunito',sans-serif",
                        fontSize: 11,
                        color: C.textDim,
                        marginTop: 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontStyle: "italic",
                      }}
                    >
                      {p.character}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related shows */}
      {related.length > 0 && (
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
            Có thể bạn thích
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {related.slice(0, 5).map((s) => (
              <motion.div
                key={s.id}
                whileHover={{ x: 3 }}
                onClick={() => navigate(`/tvshow/${s.id}`)}
                style={{
                  display: "flex",
                  gap: 10,
                  cursor: "pointer",
                  alignItems: "center",
                }}
              >
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
                  {s.posterUrl ? (
                    <img
                      src={s.posterUrl}
                      alt={s.title}
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
                      📺
                    </div>
                  )}
                </div>
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
                    {s.title}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {s.rating && (
                      <>
                        <Star
                          size={10}
                          style={{ fill: "#f5c518", color: "#f5c518", flexShrink: 0 }}
                        />
                        <span
                          style={{
                            fontFamily: "'Nunito',sans-serif",
                            fontSize: 11,
                            color: "#f5c518",
                          }}
                        >
                          {s.rating.toFixed(1)}
                        </span>
                      </>
                    )}
                    {s.year && (
                      <span
                        style={{
                          fontFamily: "'Nunito',sans-serif",
                          fontSize: 11,
                          color: C.textDim,
                        }}
                      >
                        {s.year}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TvShowSidebar;   