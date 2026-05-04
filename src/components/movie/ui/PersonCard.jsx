// src/components/movie/ui/PersonCard.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { C, toSlug } from "./movieConstants";

/**
 * PersonCard — thẻ diễn viên / đạo diễn dạng chữ nhật (tỉ lệ 2:3).
 *
 * Props:
 *   person      — { name, profileUrl, character, ... }
 *   isDirector  — hiển thị "Đạo diễn" thay vì character
 */
const PersonCard = ({ person, isDirector = false }) => {
  const [err, setErr] = useState(false);
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      onClick={() =>
        person.name &&
        navigate(`/person/${toSlug(person.name)}`, { state: { actor: person } })
      }
      style={{
        width: 140,
        flexShrink: 0,
        borderRadius: 10,
        overflow: "hidden",
        background: C.card,
        border: `1px solid ${C.borderBright}`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        cursor: person.name ? "pointer" : "default",
      }}
    >
      {/* Ảnh — tỉ lệ 2:3 */}
      <div
        style={{
          width: "100%",
          aspectRatio: "2/3",
          background: "#1a1a1a",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {person.profileUrl && !err ? (
          <img
            src={person.profileUrl}
            alt={person.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 15%",
            }}
            onError={() => setErr(true)}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: C.surfaceMid,
            }}
          >
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" fill="#3a3a3a" />
              <path
                d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                stroke="#3a3a3a"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "12px 12px 14px" }}>
        <p
          style={{
            fontFamily: "'Nunito',sans-serif",
            fontSize: 13,
            fontWeight: 700,
            color: C.text,
            lineHeight: 1.35,
            marginBottom: 4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {person.name || "Chưa có tên"}
        </p>

        {isDirector ? (
          <p
            style={{
              fontFamily: "'Nunito',sans-serif",
              fontSize: 11.5,
              color: C.textSub,
              fontStyle: "italic",
            }}
          >
            Đạo diễn
          </p>
        ) : person.character ? (
          <p
            style={{
              fontFamily: "'Nunito',sans-serif",
              fontSize: 11.5,
              color: C.textSub,
              fontStyle: "italic",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.4,
            }}
          >
            {person.character}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
};

export default PersonCard;