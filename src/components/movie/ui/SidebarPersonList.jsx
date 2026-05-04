// src/components/movie/ui/SidebarPersonList.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { C, toSlug } from "./movieConstants";

/**
 * SidebarPersonList — danh sách người (đạo diễn / diễn viên) trong sidebar.
 *
 * Props:
 *   title       — tiêu đề uppercase nhỏ (vd: "Đạo diễn", "Diễn viên chính")
 *   people      — Array<{ name, profileUrl, character? }>
 *   showRole    — "director" | "character" — dòng phụ hiển thị gì
 *   limit       — số người tối đa hiển thị (default: 6)
 *   navigateTo  — fn(person) => path string, nếu không truyền dùng /person/:slug
 */
const SidebarPersonList = ({
  title,
  people,
  showRole = "character",
  limit = 6,
  navigateTo,
}) => {
  const navigate = useNavigate();

  if (!people?.length) return null;

  const getPath = (p) =>
    navigateTo ? navigateTo(p) : `/person/${toSlug(p.name)}`;

  return (
    <div>
      {title && (
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
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {people.slice(0, limit).map((p, i) => (
          <div
            key={i}
            onClick={() =>
              p.name && navigate(getPath(p), { state: { actor: p } })
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: p.name ? "pointer" : "default",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                border: "1.5px solid rgba(255,255,255,0.12)",
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
                    fontSize: 17,
                    color: C.textDim,
                    fontFamily: "'Be Vietnam Pro',sans-serif",
                  }}
                >
                  {p.name?.charAt(0)}
                </div>
              )}
            </div>

            {/* Name + role */}
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontFamily: "'Nunito',sans-serif",
                  fontSize: 13,
                  fontWeight: showRole === "director" ? 600 : 500,
                  color: C.text,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {p.name}
              </p>
              <p
                style={{
                  fontFamily: "'Nunito',sans-serif",
                  fontSize: 11,
                  color: C.textSub,
                  marginTop: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontStyle: "italic",
                }}
              >
                {showRole === "director"
                  ? "Đạo diễn"
                  : (p.character ?? "")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SidebarPersonList;